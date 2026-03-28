"""
Live Translation App - Sarvam AI Saaras V3
"""

import asyncio
import secrets
import base64
import json
import os
import wave
import io
import re
from datetime import datetime, timezone

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Depends, Header
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# ── Load .env file from project directory ────────────────────────────────────
import pathlib as _pathlib
_env_file = _pathlib.Path(__file__).parent / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=_env_file, override=True)
    print(f"✅ .env loaded from {_env_file}")
except ImportError:
    print("⚠️  python-dotenv not installed — run: pip install python-dotenv")

try:
    from auth import (hash_password, verify_password, create_token, decode_token,
                      generate_api_key, get_current_user, get_user_by_api_key,
                      validate_email, validate_password, AUTH_AVAILABLE)
except ImportError:
    AUTH_AVAILABLE = False
    print("WARNING: auth.py not found or dependencies missing")

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

try:
    from sarvamai import AsyncSarvamAI
    SARVAM_AVAILABLE = True
except ImportError:
    SARVAM_AVAILABLE = False

try:
    import redis.asyncio as redis_async
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("WARNING: redis not found or dependencies missing")

try:
    from llm import process_session, translate_transcript
    import llm as llm_module
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    print("WARNING: llm.py not found or httpx not installed.")

try:
    from ai_features import (
        analyze_sentiment_text,
        apply_custom_vocabulary,
        build_youtube_session,
        chat_with_transcript,
        generate_flashcards,
        generate_mind_map,
        generate_podcast_script,
        generate_quiz,
        generate_translation,
        normalize_custom_vocabulary,
        summarize_sentiment_timeline,
    )
    AI_FEATURES_AVAILABLE = True
except ImportError as e:
    AI_FEATURES_AVAILABLE = False
    print(f"WARNING: ai_features unavailable: {e}")

SARVAM_API_KEY     = os.getenv("SARVAM_API_KEY",     "YOUR_SARVAM_API_KEY_HERE")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")
USE_REDIS      = os.getenv("USE_REDIS",      "false").lower() == "true"
REDIS_URI      = os.getenv("REDIS_URI",      "redis://localhost:6379")
MONGO_URI      = os.getenv("MONGO_URI",      "mongodb://localhost:27017")
MONGO_DB       = os.getenv("MONGO_DB",       "live_transcription")
MONGO_COL      = os.getenv("MONGO_COL",      "sessions")
MONGO_COL_USERS= os.getenv("MONGO_COL_USERS","users")
SECRET_KEY     = os.getenv("SECRET_KEY",     "change_me_in_production")

SAMPLE_RATE   = 16000
CHANNELS      = 1
CHUNK_BYTES   = int(SAMPLE_RATE * 0.5 * 2)
SENTENCE_ENDS = re.compile(r'[.!?।]\s*$')

db_client      = None
db_collection  = None
users_col      = None
redis_client   = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client, db_collection, users_col, redis_client
    if LLM_AVAILABLE:
        llm_module.GROQ_API_KEY = GROQ_API_KEY
        llm_module.HEADERS["Authorization"] = f"Bearer {GROQ_API_KEY}"
        ok = GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE"
        print(f"{'✅' if ok else '⚠️ '} Groq {'ready' if ok else 'API key not set'}")
    if MONGO_AVAILABLE:
        try:
            db_client     = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            await db_client.admin.command("ping")
            db_collection = db_client[MONGO_DB][MONGO_COL]
            users_col     = db_client[MONGO_DB][MONGO_COL_USERS]
            # Ensure unique index on email
            await users_col.create_index("email", unique=True)
            await users_col.create_index("api_key", unique=True, sparse=True)
            print(f"✅ MongoDB connected → {MONGO_DB}.{MONGO_COL} + users")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            db_client = None
    if REDIS_AVAILABLE and USE_REDIS:
        try:
            redis_client = redis_async.from_url(REDIS_URI)
            await redis_client.ping()
            print(f"✅ Redis connected → {REDIS_URI}")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            redis_client = None
    elif REDIS_AVAILABLE:
        print("ℹ️ Redis skipped (USE_REDIS=false)")
        redis_client = None
    yield
    if db_client:
        db_client.close()
    if redis_client:
        await redis_client.aclose()


app = FastAPI(
    title="Sarvam Live Transcription API",
    description="Live speech transcription and translation powered by Sarvam AI",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth helpers ──────────────────────────────────────────────────────────────
def require_user(request: Request):
    """Dependency: returns user dict or raises redirect."""
    user = get_current_user(request) if AUTH_AVAILABLE else {"sub": "local", "email": "local"}
    return user

async def require_api_auth(request: Request, x_api_key: str = Header(default="")):
    """Dependency for REST API: accepts JWT or API key."""
    # Try API key first
    if x_api_key and AUTH_AVAILABLE:
        user = await get_user_by_api_key(x_api_key, users_col)
        if user:
            return user
    # Try JWT cookie/header
    if AUTH_AVAILABLE:
        user = get_current_user(request)
        if user:
            return user
    # If auth not available, allow anonymous
    if not AUTH_AVAILABLE:
        return {"sub": "local", "email": "local"}
    return None


def serve_html(filename: str):
    base = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base, "templates", filename), "r", encoding="utf-8") as f:
        return f.read()


@app.get("/favicon.ico")
async def favicon():
    # Return a simple inline SVG favicon as ICO equivalent
    from fastapi.responses import Response
    # Minimal 1x1 transparent ICO file (base64)
    ico = bytes([
        0,0,1,0,1,0,16,16,0,0,1,0,32,0,104,4,0,0,22,0,0,0,
        40,0,0,0,16,0,0,0,32,0,0,0,1,0,32,0,0,0,0,0,0,4,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ] + [0]*1064)
    return Response(content=ico, media_type="image/x-icon",
                    headers={"Cache-Control": "public, max-age=86400"})


@app.get("/auth-helper.js")
async def auth_helper_js():
    from fastapi.responses import Response
    base = os.path.dirname(os.path.abspath(__file__))
    js   = open(os.path.join(base, "templates", "auth-helper.js"), "r").read()
    return Response(content=js, media_type="application/javascript")


# ── Auth page routes ──────────────────────────────────────────────────────────
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if AUTH_AVAILABLE and get_current_user(request):
        return RedirectResponse("/dashboard", status_code=302)
    return serve_html("login.html")

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    if AUTH_AVAILABLE and get_current_user(request):
        return RedirectResponse("/dashboard", status_code=302)
    return serve_html("register.html")

@app.post("/api/auth/register")
async def register(body: dict):
    if not AUTH_AVAILABLE:
        return JSONResponse({"error": "Auth not available"}, status_code=503)
    if users_col is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name     = (body.get("name") or "").strip()
    if not validate_email(email):
        return JSONResponse({"error": "Invalid email"}, status_code=400)
    pw_err = validate_password(password)
    if pw_err:
        return JSONResponse({"error": pw_err}, status_code=400)
    if not name:
        return JSONResponse({"error": "Name is required"}, status_code=400)
    existing = await users_col.find_one({"email": email})
    if existing:
        return JSONResponse({"error": "Email already registered"}, status_code=409)
    user_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    api_key = generate_api_key()
    # First user to register becomes admin automatically
    user_count = await users_col.count_documents({})
    is_first   = user_count == 0
    await users_col.insert_one({
        "user_id":       user_id,
        "email":         email,
        "name":          name,
        "password_hash": hash_password(password),
        "api_key":       api_key,
        "is_admin":      is_first,
        "created_at":    datetime.now(timezone.utc).isoformat(),
    })
    if is_first:
        print(f"  [Auth] ✅ First user '{email}' registered as admin")
    token    = create_token(user_id, email)
    response = JSONResponse({"ok": True, "name": name, "api_key": api_key, "is_admin": is_first, "token": token})
    response.set_cookie("auth_token", token, httponly=False, max_age=72*7*3600, samesite="none", secure=True, path="/")
    return response

@app.post("/api/auth/login")
async def login(body: dict):
    if not AUTH_AVAILABLE:
        return JSONResponse({"error": "Auth not available"}, status_code=503)
    if users_col is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    user     = await users_col.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        return JSONResponse({"error": "Invalid email or password"}, status_code=401)
    token    = create_token(user["user_id"], email)
    response = JSONResponse({"ok": True, "name": user.get("name",""), "api_key": user.get("api_key",""), "token": token})
    response.set_cookie("auth_token", token, httponly=False, max_age=72*7*3600, samesite="none", secure=True, path="/")
    return response

@app.post("/api/auth/promote-self")
async def promote_self(request: Request):
    """Grant admin — works if no admin exists yet, or if you are the admin."""
    if not AUTH_AVAILABLE:
        return JSONResponse({"error": "Auth not available"}, status_code=503)
    if users_col is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    user = get_current_user(request)
    if not user:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    existing_admin = await users_col.find_one({"is_admin": True})
    if existing_admin:
        if existing_admin["user_id"] == user["sub"]:
            return JSONResponse({"ok": True, "already_admin": True})
        return JSONResponse({"error": "An admin already exists"}, status_code=403)
    await users_col.update_one({"user_id": user["sub"]}, {"$set": {"is_admin": True}})
    print(f"  [Auth] ✅ {user.get('email')} promoted to admin")
    return JSONResponse({"ok": True, "promoted": True})


@app.get("/setup")
async def setup_page():
    """Bootstrap admin page — open this in browser to claim admin."""
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Admin Setup — Sarvam AI</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080c10;color:#e2eaf4;font-family:'Segoe UI',sans-serif;
     display:flex;align-items:center;justify-content:center;min-height:100vh;}
.card{background:#0f1620;border:1px solid #1e2d40;border-radius:16px;
      padding:40px;max-width:420px;width:90%;text-align:center;}
h1{font-size:22px;margin-bottom:8px;}
p{color:#6b8299;font-size:13px;line-height:1.7;margin-bottom:24px;}
input{width:100%;padding:10px 14px;background:#080c10;border:1px solid #1e2d40;
      border-radius:8px;color:#e2eaf4;font-size:14px;margin-bottom:12px;outline:none;}
input:focus{border-color:#00d4ff;}
button{width:100%;padding:12px;background:linear-gradient(135deg,#00d4ff,#7c3aed);
       border:none;border-radius:10px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;}
#msg{margin-top:16px;font-size:13px;font-family:monospace;}
</style></head>
<body><div class="card">
  <div style="font-size:40px;margin-bottom:16px;">🛡</div>
  <h1>Admin Setup</h1>
  <p>Enter your registered email to claim admin access.<br>
     The ADMIN_SECRET from your .env file is required.</p>
  <input id="email" type="email" placeholder="your@email.com"/>
  <input id="secret" type="password" placeholder="ADMIN_SECRET from .env"/>
  <button onclick="claimAdmin()">Claim Admin</button>
  <div id="msg"></div>
</div>
<script>
async function claimAdmin() {
  const email  = document.getElementById('email').value.trim();
  const secret = document.getElementById('secret').value.trim();
  const msg    = document.getElementById('msg');
  if (!email || !secret) { msg.textContent = 'Fill in both fields'; msg.style.color='#ef4444'; return; }
  msg.textContent = 'Processing...'; msg.style.color='#6b8299';
  const res  = await fetch('/setup/claim', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email, secret})
  });
  const data = await res.json();
  if (data.ok) {
    msg.innerHTML = '✅ ' + (data.message || 'You are now admin!') + '<br><a href="/admin" style="color:#00d4ff;">→ Open Admin Panel</a>';
    msg.style.color = '#22c55e';
  } else {
    msg.textContent = '❌ ' + (data.error || 'Failed');
    msg.style.color = '#ef4444';
  }
}
</script></div></body></html>"""
    from fastapi.responses import HTMLResponse as _HR
    return _HR(content=html)


@app.post("/setup/claim")
async def setup_claim(body: dict):
    """Claim admin using ADMIN_SECRET from .env — works regardless of existing admins."""
    if users_col is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)

    admin_secret = os.getenv("ADMIN_SECRET", "")
    if not admin_secret:
        return JSONResponse({"error": "ADMIN_SECRET not set in .env"}, status_code=400)

    provided = (body.get("secret") or "").strip()
    if provided != admin_secret:
        return JSONResponse({"error": "Wrong secret"}, status_code=403)

    email = (body.get("email") or "").strip().lower()
    user  = await users_col.find_one({"email": email})
    if not user:
        return JSONResponse({"error": f"No account found for {email}"}, status_code=404)

    # Grant admin unconditionally
    await users_col.update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    print(f"  [Setup] ✅ {email} granted admin via setup page")
    return JSONResponse({"ok": True, "message": f"{email} is now admin. Go to /admin"})


@app.post("/api/auth/logout")
async def logout():
    response = JSONResponse({"ok": True, "clear_token": True})
    response.delete_cookie("auth_token", path="/")
    return response

@app.get("/api/auth/me")
async def me(request: Request):
    if not AUTH_AVAILABLE:
        return JSONResponse({"user_id": "local", "email": "local@local", "name": "Local User", "is_admin": True})
    user = get_current_user(request)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if users_col is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    db_user = await users_col.find_one({"user_id": user["sub"]})
    if not db_user:
        return JSONResponse({"error": "User not found"}, status_code=404)
    return JSONResponse({
        "user_id": db_user["user_id"],
        "email": db_user["email"],
        "name": db_user.get("name", ""),
        "is_admin": bool(db_user.get("is_admin", False))
    })


# ── Protected page routes ─────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return RedirectResponse("/dashboard", status_code=302)

@app.get("/live", response_class=HTMLResponse)
async def live(request: Request):
    from fastapi.responses import HTMLResponse as _HR
    resp = _HR(content=serve_html("index.html"))
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    return resp

@app.get("/history", response_class=HTMLResponse)
async def history(request: Request):
    from fastapi.responses import HTMLResponse as _HR
    resp = _HR(content=serve_html("history.html"))
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    return resp


@app.get("/api/sessions")
async def get_sessions(request: Request):
    if db_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    query  = build_user_query(request, {})
    cursor = db_collection.find(query, {"_id": 0}).sort("started_at", -1).limit(50)
    sessions = await cursor.to_list(length=50)
    return JSONResponse(sessions)


@app.get("/api/search")
async def search_sessions(request: Request, q: str = "", field: str = "all"):
    """Full-text search across session transcripts."""
    if db_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    base_query = build_user_query(request, {})
    if not q.strip():
        cursor = db_collection.find(base_query, {"_id": 0}).sort("started_at", -1).limit(100)
        return JSONResponse(await cursor.to_list(length=100))
    pattern = {"$regex": q, "$options": "i"}
    text_query = {"$or": [
        {"transcript": pattern}, {"corrected_transcript": pattern},
        {"filtered_transcript": pattern}, {"summary": pattern},
    ]} if field == "all" else {field: pattern}
    query  = {"$and": [base_query, text_query]} if base_query else text_query
    cursor = db_collection.find(query, {"_id": 0}).sort("started_at", -1).limit(100)
    return JSONResponse(await cursor.to_list(length=100))


@app.get("/api/stats")
async def get_stats(request: Request):
    """Aggregate stats for the dashboard."""
    if db_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    query  = build_user_query(request, {})
    cursor = db_collection.find(query, {"_id": 0,
        "session_id": 1, "started_at": 1, "ended_at": 1,
        "word_count": 1, "sentence_count": 1, "language": 1, "mode": 1
    }).sort("started_at", 1).limit(500)
    return JSONResponse(await cursor.to_list(length=500))


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return serve_html("dashboard.html")


@app.get("/studio", response_class=HTMLResponse)
async def studio(request: Request):
    return serve_html("studio.html")


@app.post("/api/sessions/{session_id}/translate")
async def translate_session(session_id: str, body: dict):
    """Translate a saved session transcript to a target language."""
    if db_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    doc = await db_collection.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        return JSONResponse({"error": "Session not found"}, status_code=404)
    target_lang = body.get("target_lang", "en")
    target_lang = body.get("target_lang", "en")
    if target_lang != "same" and doc.get(f"translated_{target_lang}") and not body.get("regenerate"):
        return JSONResponse({"translated": doc.get(f"translated_{target_lang}", ""), "target_lang": target_lang, "cached": True})
    text = doc.get("corrected_transcript") or doc.get("filtered_transcript") or doc.get("transcript", "")
    if not text:
        return JSONResponse({"error": "No transcript to translate"}, status_code=400)
    if not LLM_AVAILABLE:
        return JSONResponse({"error": "LLM not available"}, status_code=503)
    translated = await generate_translation(doc, target_lang) if AI_FEATURES_AVAILABLE else await translate_transcript(text, target_lang)
    if not translated:
        return JSONResponse({"error": "Translation failed"}, status_code=500)
    # Save translated version
    await db_collection.update_one(
        {"session_id": session_id},
        {"$set": {f"translated_{target_lang}": translated}}
    )
    return JSONResponse({"translated": translated, "target_lang": target_lang, "cached": False})


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    if db_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    doc = await db_collection.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return JSONResponse(doc)


@app.post("/api/sessions/{session_id}/flashcards")
async def session_flashcards(session_id: str, body: dict, request: Request, x_api_key: str = Header(default="")):
    if not AI_FEATURES_AVAILABLE or not LLM_AVAILABLE:
        return JSONResponse({"error": "AI features are not available"}, status_code=503)
    result, error = await get_session_for_user(session_id, request, x_api_key)
    if error:
        return error
    doc, user = result
    if doc.get("flashcards") and not body.get("regenerate"):
        return JSONResponse({"flashcards": doc["flashcards"], "cached": True})
    flashcards = await generate_flashcards(doc)
    await db_collection.update_one({"session_id": session_id, "user_id": user.get("sub", "")}, {"$set": {"flashcards": flashcards}})
    return JSONResponse({"flashcards": flashcards, "cached": False})


@app.post("/api/sessions/{session_id}/quiz")
async def session_quiz(session_id: str, body: dict, request: Request, x_api_key: str = Header(default="")):
    if not AI_FEATURES_AVAILABLE or not LLM_AVAILABLE:
        return JSONResponse({"error": "AI features are not available"}, status_code=503)
    result, error = await get_session_for_user(session_id, request, x_api_key)
    if error:
        return error
    doc, user = result
    if doc.get("quiz") and not body.get("regenerate"):
        return JSONResponse({"quiz": doc["quiz"], "cached": True})
    quiz = await generate_quiz(doc)
    await db_collection.update_one({"session_id": session_id, "user_id": user.get("sub", "")}, {"$set": {"quiz": quiz}})
    return JSONResponse({"quiz": quiz, "cached": False})


@app.post("/api/sessions/{session_id}/podcast")
async def session_podcast(session_id: str, body: dict, request: Request, x_api_key: str = Header(default="")):
    if not AI_FEATURES_AVAILABLE or not LLM_AVAILABLE:
        return JSONResponse({"error": "AI features are not available"}, status_code=503)
    result, error = await get_session_for_user(session_id, request, x_api_key)
    if error:
        return error
    doc, user = result
    if doc.get("podcast") and not body.get("regenerate"):
        return JSONResponse({"podcast": doc["podcast"], "cached": True})
    podcast = await generate_podcast_script(doc)
    await db_collection.update_one({"session_id": session_id, "user_id": user.get("sub", "")}, {"$set": {"podcast": podcast}})
    return JSONResponse({"podcast": podcast, "cached": False})


@app.post("/api/sessions/{session_id}/mindmap")
async def session_mindmap(session_id: str, body: dict, request: Request, x_api_key: str = Header(default="")):
    if not AI_FEATURES_AVAILABLE or not LLM_AVAILABLE:
        return JSONResponse({"error": "AI features are not available"}, status_code=503)
    result, error = await get_session_for_user(session_id, request, x_api_key)
    if error:
        return error
    doc, user = result
    if doc.get("mind_map") and not body.get("regenerate"):
        return JSONResponse({"mind_map": doc["mind_map"], "cached": True})
    mind_map = await generate_mind_map(doc)
    await db_collection.update_one({"session_id": session_id, "user_id": user.get("sub", "")}, {"$set": {"mind_map": mind_map}})
    return JSONResponse({"mind_map": mind_map, "cached": False})


@app.post("/api/sessions/{session_id}/chat")
async def session_chat(session_id: str, body: dict, request: Request, x_api_key: str = Header(default="")):
    if not AI_FEATURES_AVAILABLE:
        return JSONResponse({"error": "AI features are not available"}, status_code=503)
    result, error = await get_session_for_user(session_id, request, x_api_key)
    if error:
        return error
    doc, _user = result
    message = (body.get("message") or "").strip()
    history = body.get("history") or doc.get("chat_history") or []
    if not message:
        return JSONResponse({"error": "Message is required"}, status_code=400)
    answer = await chat_with_transcript(doc, message, history)
    
    new_history = history + [{"role": "user", "content": message}, {"role": "assistant", "content": answer}]
    await db_collection.update_one({"session_id": session_id, "user_id": _user.get("sub", "")}, {"$set": {"chat_history": new_history}})
    
    return JSONResponse({"answer": answer, "chat_history": new_history})


@app.post("/api/youtube/import")
async def youtube_import(body: dict, request: Request, x_api_key: str = Header(default="")):
    if not AI_FEATURES_AVAILABLE:
        return JSONResponse({"error": "AI features are not available"}, status_code=503)
    if db_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    user = await get_authenticated_user(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    url = (body.get("url") or "").strip()
    if not url:
        return JSONResponse({"error": "YouTube URL is required"}, status_code=400)

    try:
        yt_data = await build_youtube_session(url)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    imported = yt_data["imported"]
    analysis = yt_data["analysis"]
    session_id = "yt_" + datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    started_at = datetime.now(timezone.utc)
    user_id = user.get("sub", "")
    final_title = await resolve_title(analysis.get("title") or imported.get("title") or "YouTube Import", user_id)

    await save_to_mongo(
        session_id,
        started_at,
        imported.get("language") or "youtube",
        "youtube",
        yt_data["sentences"],
        analysis.get("filtered_transcript", ""),
        analysis.get("summary", ""),
        analysis.get("corrected_transcript", imported.get("transcript", "")),
        final_title,
        analysis.get("notes", ""),
        user_id,
        analysis.get("speakers", []),
        extra_fields={
            "source_type": "youtube",
            "source_url": imported.get("webpage_url", url),
            "source_channel": imported.get("channel", ""),
            "thumbnail": imported.get("thumbnail", ""),
            "description": imported.get("description", ""),
            "sentiment_timeline": yt_data.get("sentiment_timeline", []),
            "sentiment_summary": summarize_sentiment_timeline(yt_data.get("sentiment_timeline", [])),
        },
    )
    return JSONResponse({"ok": True, "session_id": session_id, "title": final_title})


# ── Helpers ───────────────────────────────────────────────────────────────────
def is_sentence_end(text: str) -> bool:
    return bool(SENTENCE_ENDS.search(text.strip()))

def merge_fragments(fragments: list) -> str:
    joined = " ".join(f.strip() for f in fragments if f.strip())
    joined = re.sub(r'\s+', ' ', joined).strip()
    if joined:
        joined = joined[0].upper() + joined[1:]
    return joined

def build_paragraphs(sentences: list, size: int = 5) -> str:
    paras = []
    for i in range(0, len(sentences), size):
        para = " ".join(s.strip() for s in sentences[i:i + size])
        paras.append(para)
    return "\n\n".join(paras)

def pcm_to_wav(pcm_data: bytes, sample_rate: int, channels: int) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)
    return buf.getvalue()


def build_user_query(request: Request, extra: dict) -> dict:
    """Build MongoDB query — appends user_id filter if auth is available."""
    if not AUTH_AVAILABLE:
        return dict(extra)
    user = get_current_user(request)
    if user:
        extra["user_id"] = user["sub"]
    else:
        extra["user_id"] = "UNAUTHORIZED_USER"
    return extra


async def get_authenticated_user(request: Request, x_api_key: str = ""):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return None
    if AUTH_AVAILABLE and not user.get("sub"):
        db_user = await users_col.find_one({"email": user.get("email")}, {"user_id": 1}) if users_col is not None else None
        if db_user:
            user["sub"] = db_user.get("user_id", "")
    return user


async def get_session_for_user(session_id: str, request: Request, x_api_key: str = ""):
    if db_collection is None:
        return None, JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    user = await get_authenticated_user(request, x_api_key)
    if not user:
        return None, JSONResponse({"error": "Unauthorized"}, status_code=401)
    query = {"session_id": session_id}
    if AUTH_AVAILABLE:
        query["user_id"] = user["sub"]
    doc = await db_collection.find_one(query, {"_id": 0})
    if not doc:
        return None, JSONResponse({"error": "Session not found"}, status_code=404)
    return (doc, user), None


async def resolve_title(raw_title: str, user_id: str = "") -> str:
    """Ensure title is unique — append (2), (3)... if same title exists."""
    if not raw_title or db_collection is None:
        return raw_title
    base  = raw_title.strip()
    q     = {"title": {"$regex": f"^{re.escape(base)}", "$options": "i"}}
    if user_id:
        q["user_id"] = user_id
    count = await db_collection.count_documents(q)
    if count == 0:
        return base
    return f"{base} ({count + 1})"


async def save_to_mongo(session_id, started_at, language, mode,
                        sentences, filtered_transcript="", summary="", corrected_transcript="", title="", notes="", user_id="", speakers=None, extra_fields=None):
    if db_collection is None:
        print("  [DB] Skipped — MongoDB not connected")
        return
    if not sentences:
        print("  [DB] Skipped — no sentences to save")
        return
    try:
        doc = {
            "session_id":          session_id,
            "started_at":          started_at.isoformat(),
            "ended_at":            datetime.now(timezone.utc).isoformat(),
            "language":            language,
            "mode":                mode,
            "sentence_count":      len(sentences),
            "word_count":          sum(len(s.split()) for s in sentences),
            "transcript":          build_paragraphs(sentences),
            "filtered_transcript":  filtered_transcript,
            "corrected_transcript": corrected_transcript,
            "summary":              summary,
            "title":                title,
            "speakers":             speakers,
            "notes":                notes,
            "user_id":              user_id,
            "sentences":            sentences,
        }
        if extra_fields:
            doc.update(extra_fields)
        await db_collection.update_one(
            {"session_id": session_id},
            {"$set": doc},
            upsert=True
        )
        print(f"  [DB] ✅ Saved {session_id} — {len(sentences)} sentences")
        # Fire webhook asynchronously
        if user_id:
            asyncio.create_task(fire_webhook(user_id, doc))
        # Trigger background auto-generation of extended features
        asyncio.create_task(generate_extended_features_bg_task(session_id, user_id))
    except Exception as e:
        print(f"  [DB] ❌ Save error: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# Folders
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/folders")
async def create_folder(body: dict, request: Request):
    if db_client is None: return JSONResponse({"error":"DB not connected"},status_code=503)
    user = {"sub":"local"}
    folders_col = db_client[MONGO_DB]["folders"]
    folder = {
        "folder_id":  secrets.token_hex(8),
        "user_id":    user["sub"],
        "name":       (body.get("name") or "Untitled").strip()[:60],
        "color":      body.get("color","#00d4ff"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await folders_col.insert_one(folder)
    folder.pop("_id", None)
    return JSONResponse(folder)

@app.get("/api/folders")
async def list_folders(request: Request):
    if db_client is None: return JSONResponse([])
    user = {"sub":"local"}
    folders_col = db_client[MONGO_DB]["folders"]
    cur = folders_col.find({"user_id": user["sub"]}, {"_id":0}).sort("created_at",1)
    return JSONResponse(await cur.to_list(length=100))

@app.delete("/api/folders/{folder_id}")
async def delete_folder(folder_id: str, request: Request):
    if db_client is None: return JSONResponse({"error":"DB not connected"},status_code=503)
    user = {"sub":"local"}
    folders_col = db_client[MONGO_DB]["folders"]
    await folders_col.delete_one({"folder_id":folder_id,"user_id":user["sub"]})
    # Unassign sessions in this folder
    await db_collection.update_many({"folder_id":folder_id,"user_id":user["sub"]},{"$unset":{"folder_id":""}})
    return JSONResponse({"ok":True})

@app.patch("/api/sessions/{session_id}/folder")
async def assign_folder(session_id: str, body: dict, request: Request):
    if db_collection is None: return JSONResponse({"error":"DB not connected"},status_code=503)
    user = {"sub":"local"}
    folder_id = body.get("folder_id") or ""
    update = {"$set":{"folder_id":folder_id}} if folder_id else {"$unset":{"folder_id":""}}
    await db_collection.update_one({"session_id":session_id,"user_id":user["sub"]}, update)
    return JSONResponse({"ok":True})


# ══════════════════════════════════════════════════════════════════════════════
# Share links
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/sessions/{session_id}/share")
async def toggle_share(session_id: str, body: dict, request: Request):
    if db_collection is None: return JSONResponse({"error":"DB not connected"},status_code=503)
    user = {"sub":"local"}
    enable = body.get("enable", True)
    if enable:
        token = secrets.token_urlsafe(24)
        await db_collection.update_one(
            {"session_id":session_id,"user_id":user["sub"]},
            {"$set":{"share_token":token,"is_public":True}}
        )
        return JSONResponse({"ok":True,"share_url":f"/share/{token}"})
    else:
        await db_collection.update_one(
            {"session_id":session_id,"user_id":user["sub"]},
            {"$unset":{"share_token":""},"$set":{"is_public":False}}
        )
        return JSONResponse({"ok":True,"share_url":None})

@app.get("/share/{token}", response_class=HTMLResponse)
async def share_view(token: str):
    if db_collection is None: return HTMLResponse("Not found", status_code=404)
    doc = await db_collection.find_one({"share_token":token,"is_public":True},{"_id":0,"sentences":0,"user_id":0})
    if not doc: return HTMLResponse("<h2>Link not found or sharing disabled.</h2>", status_code=404)
    text = doc.get("corrected_transcript") or doc.get("transcript","")
    summary_html = ""
    if doc.get("summary"):
        summary_html += f'<div class="summary-box" style="margin-bottom:12px;"><strong>AI Summary:</strong><br>{doc["summary"].replace(chr(10),"<br>")}</div>'
    if doc.get("notes"):
        summary_html += f'<div class="summary-box" style="border-color:#7c3aed;background:rgba(124,58,237,0.05);"><strong>AI Study Notes:</strong><br>{doc["notes"].replace(chr(10),"<br>")}</div>'
    return serve_html("share.html").replace("__SESSION_JSON__", json.dumps(doc)).replace("__SUMMARY_HTML__", summary_html)


# ══════════════════════════════════════════════════════════════════════════════
# Webhooks
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/webhooks")
async def set_webhook(body: dict, request: Request):
    if users_col is None: return JSONResponse({"webhook_url":""},status_code=200)
    user = {"sub":"local"}
    url = (body.get("url") or "").strip()
    if url and not url.startswith("http"): return JSONResponse({"error":"Invalid URL"},status_code=400)
    await users_col.update_one({"user_id":user["sub"]},{"$set":{"webhook_url":url}})
    return JSONResponse({"ok":True,"webhook_url":url})

@app.get("/api/webhooks")
async def get_webhook(request: Request):
    if users_col is None: return JSONResponse({"webhook_url":""})
    user = {"sub":"local"}
    doc = await users_col.find_one({"user_id":user["sub"]},{"_id":0,"webhook_url":1})
    return JSONResponse({"webhook_url": doc.get("webhook_url","") if doc else ""})

async def fire_webhook(user_id: str, session_doc: dict):
    """POST session data to user's webhook URL after save."""
    if users_col is None: return
    user = await users_col.find_one({"user_id":user_id},{"webhook_url":1})
    if not user or not user.get("webhook_url"): return
    url = user["webhook_url"]
    payload = {k: v for k, v in session_doc.items() if k not in ("sentences","_id")}
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json=payload)
        print(f"  [Webhook] ✅ Fired → {url}")
    except Exception as e:
        print(f"  [Webhook] ❌ Failed → {url}: {e}")

async def generate_extended_features_bg_task(session_id: str, user_id: str):
    """Generate all AI features in the background and save to MongoDB."""
    if db_collection is None or not AI_FEATURES_AVAILABLE:
        return
    query = {"session_id": session_id}
    if user_id: query["user_id"] = user_id
    doc = await db_collection.find_one(query, {"_id": 0})
    if not doc:
        return

    print(f"  [Auto-Gen] Starting background feature generation for {session_id}...")
    
    # Run them concurrently to save time, Groq can handle multiple requests
    flashcards_task = generate_flashcards(doc)
    quiz_task = generate_quiz(doc)
    podcast_task = generate_podcast_script(doc)
    mind_map_task = generate_mind_map(doc)
    
    results = await asyncio.gather(flashcards_task, quiz_task, podcast_task, mind_map_task, return_exceptions=True)
    
    updates = {}
    if not isinstance(results[0], Exception) and results[0]: updates["flashcards"] = results[0]
    if not isinstance(results[1], Exception) and results[1]: updates["quiz"] = results[1]
    if not isinstance(results[2], Exception) and results[2]: updates["podcast"] = results[2]
    if not isinstance(results[3], Exception) and results[3]: updates["mind_map"] = results[3]
    
    if updates:
        await db_collection.update_one(query, {"$set": updates})
        print(f"  [Auto-Gen] ✅ Saved {list(updates.keys())} for {session_id}")


# ══════════════════════════════════════════════════════════════════════════════
# Admin panel
# ══════════════════════════════════════════════════════════════════════════════
async def is_admin(request: Request) -> bool:
    """Check if the current authenticated user has is_admin=True in the database."""
    if not AUTH_AVAILABLE:
        return True
    user = get_current_user(request)
    if not user or users_col is None:
        return False
    db_user = await users_col.find_one({"user_id": user["sub"]})
    return bool(db_user and db_user.get("is_admin"))

@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    from fastapi.responses import HTMLResponse as _HR
    resp = _HR(content=serve_html("admin.html"))
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    return resp

@app.get("/api/admin/users")
async def admin_list_users(request: Request):
    if not await is_admin(request): return JSONResponse({"error":"Forbidden"},status_code=403)
    if users_col is None: return JSONResponse([])
    cur = users_col.find({},{"_id":0,"password_hash":0}).sort("created_at",-1)
    users_list = await cur.to_list(length=500)
    # Add session count per user
    for u in users_list:
        u["session_count"] = await db_collection.count_documents({"user_id":u["user_id"]})
    return JSONResponse(users_list)

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    if not await is_admin(request): return JSONResponse({"error":"Forbidden"},status_code=403)
    if users_col is None: return JSONResponse({"error":"DB not connected"},status_code=503)
    await users_col.delete_one({"user_id":user_id})
    await db_collection.delete_many({"user_id":user_id})
    return JSONResponse({"ok":True})

@app.post("/api/admin/users/{user_id}/promote")
async def admin_promote_user(user_id: str, request: Request):
    if not await is_admin(request): return JSONResponse({"error":"Forbidden"},status_code=403)
    if users_col is None: return JSONResponse({"error":"DB not connected"},status_code=503)
    await users_col.update_one({"user_id":user_id},{"$set":{"is_admin":True}})
    return JSONResponse({"ok":True})

@app.get("/api/admin/check")
async def admin_check(request: Request):
    """Debug: check your current admin status."""
    if not AUTH_AVAILABLE:
        return JSONResponse({"auth": False, "is_admin": True, "note": "Auth disabled — everyone is admin"})
    user = get_current_user(request)
    if not user:
        return JSONResponse({"auth": False, "is_admin": False, "note": "Not logged in"})
    if users_col is None:
        return JSONResponse({"auth": True, "is_admin": False, "note": "MongoDB not connected"})
    db_user = await users_col.find_one({"user_id": user["sub"]}, {"_id": 0, "email": 1, "name": 1, "is_admin": 1})
    return JSONResponse({
        "auth":     True,
        "user_id":  user["sub"],
        "email":    db_user.get("email") if db_user else user.get("email"),
        "name":     db_user.get("name")  if db_user else "",
        "is_admin": bool(db_user and db_user.get("is_admin")),
        "note":     "Admin ✅" if (db_user and db_user.get("is_admin")) else "Not admin — run: python make_admin.py your@email.com"
    })


@app.post("/api/admin/self-promote")
async def self_promote(request: Request):
    """Promote yourself to admin IF no admin exists yet (first-time setup only)."""
    if not AUTH_AVAILABLE:
        return JSONResponse({"error": "Auth not available"}, status_code=503)
    if users_col is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    user = get_current_user(request)
    if not user:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    # Only allowed if zero admins exist
    existing_admin = await users_col.find_one({"is_admin": True})
    if existing_admin:
        return JSONResponse({"error": "An admin already exists — cannot self-promote"}, status_code=403)
    await users_col.update_one({"user_id": user["sub"]}, {"$set": {"is_admin": True}})
    return JSONResponse({"ok": True, "message": "You are now an admin. Visit /admin"})


@app.get("/api/admin/stats")
async def admin_stats(request: Request):
    if not await is_admin(request): return JSONResponse({"error":"Forbidden"},status_code=403)
    total_users    = await users_col.count_documents({}) if users_col is not None else 0
    total_sessions = await db_collection.count_documents({}) if db_collection is not None else 0
    pipeline = [{"$group":{"_id":None,"total_words":{"$sum":"$word_count"}}}]
    word_result = await db_collection.aggregate(pipeline).to_list(1) if db_collection is not None else []
    total_words = word_result[0]["total_words"] if word_result else 0
    return JSONResponse({"total_users":total_users,"total_sessions":total_sessions,"total_words":total_words})


# ══════════════════════════════════════════════════════════════════════════════
# REST API v1  —  authenticate with X-API-Key header or JWT cookie
# Browse at  /api/docs
# ══════════════════════════════════════════════════════════════════════════════

async def get_api_user(request: Request, x_api_key: str = Header(default="")):
    """Shared dependency: resolves user from API key or JWT."""
    user = await require_api_auth(request, x_api_key)
    if user is None:
        return JSONResponse({"error": "Unauthorized — provide X-API-Key or login"}, status_code=401)
    return user


@app.get("/api/v1/sessions",
    summary="List sessions",
    tags=["Sessions"],
    description="Returns paginated list of your sessions, newest first.")
async def v1_list_sessions(
    request: Request,
    page: int = 1, limit: int = 20,
    x_api_key: str = Header(default=""),
):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if db_collection is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    skip   = (page - 1) * limit
    query  = {"user_id": user["sub"]} if AUTH_AVAILABLE else {}
    cursor = db_collection.find(query, {"_id": 0, "sentences": 0}).sort("started_at", -1).skip(skip).limit(limit)
    total  = await db_collection.count_documents(query)
    items  = await cursor.to_list(length=limit)
    return JSONResponse({"page": page, "limit": limit, "total": total, "sessions": items})


@app.get("/api/v1/sessions/{session_id}",
    summary="Get session",
    tags=["Sessions"])
async def v1_get_session(
    session_id: str, request: Request, x_api_key: str = Header(default=""),
):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if db_collection is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    q   = {"session_id": session_id}
    if AUTH_AVAILABLE:
        q["user_id"] = user["sub"]
    doc = await db_collection.find_one(q, {"_id": 0})
    if not doc:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return JSONResponse(doc)


@app.get("/api/v1/sessions/{session_id}/transcript",
    summary="Get transcript text",
    tags=["Sessions"],
    description="Returns just the transcript. Use ?type=raw|corrected|filtered")
async def v1_get_transcript(
    session_id: str, request: Request,
    type: str = "corrected",
    x_api_key: str = Header(default=""),
):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if db_collection is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    q   = {"session_id": session_id}
    if AUTH_AVAILABLE:
        q["user_id"] = user["sub"]
    doc = await db_collection.find_one(q, {"_id": 0, "transcript": 1,
                                            "corrected_transcript": 1, "filtered_transcript": 1, "title": 1})
    if not doc:
        return JSONResponse({"error": "Not found"}, status_code=404)
    if type == "filtered":
        text = doc.get("filtered_transcript") or doc.get("transcript", "")
    elif type == "raw":
        text = doc.get("transcript", "")
    else:
        text = doc.get("corrected_transcript") or doc.get("transcript", "")
    return JSONResponse({"session_id": session_id, "type": type,
                         "title": doc.get("title",""), "transcript": text})


@app.delete("/api/v1/sessions/{session_id}",
    summary="Delete session",
    tags=["Sessions"])
async def v1_delete_session(
    session_id: str, request: Request, x_api_key: str = Header(default=""),
):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if db_collection is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    q      = {"session_id": session_id}
    if AUTH_AVAILABLE:
        q["user_id"] = user["sub"]
    result = await db_collection.delete_one(q)
    if result.deleted_count == 0:
        return JSONResponse({"error": "Not found or not yours"}, status_code=404)
    return JSONResponse({"ok": True, "deleted": session_id})


@app.get("/api/v1/search",
    summary="Search sessions",
    tags=["Sessions"])
async def v1_search(
    request: Request, q: str = "", field: str = "all", limit: int = 50,
    x_api_key: str = Header(default=""),
):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if db_collection is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    base = {"user_id": user["sub"]} if AUTH_AVAILABLE else {}
    if not q.strip():
        cursor = db_collection.find(base, {"_id": 0, "sentences": 0}).sort("started_at", -1).limit(limit)
        return JSONResponse(await cursor.to_list(length=limit))
    pattern    = {"$regex": q, "$options": "i"}
    text_query = {"$or": [{"transcript": pattern}, {"corrected_transcript": pattern},
                           {"filtered_transcript": pattern}, {"summary": pattern}]
                 } if field == "all" else {field: pattern}
    query  = {"$and": [base, text_query]} if base else text_query
    cursor = db_collection.find(query, {"_id": 0, "sentences": 0}).sort("started_at", -1).limit(limit)
    return JSONResponse(await cursor.to_list(length=limit))


@app.get("/api/v1/stats",
    summary="Dashboard stats",
    tags=["Analytics"])
async def v1_stats(request: Request, x_api_key: str = Header(default="")):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if db_collection is None:
        return JSONResponse({"error": "DB not connected"}, status_code=503)
    q      = {"user_id": user["sub"]} if AUTH_AVAILABLE else {}
    cursor = db_collection.find(q, {"_id": 0, "session_id": 1, "started_at": 1,
        "ended_at": 1, "word_count": 1, "sentence_count": 1, "language": 1, "mode": 1, "title": 1}
    ).sort("started_at", 1).limit(500)
    return JSONResponse(await cursor.to_list(length=500))


@app.post("/api/v1/sessions/{session_id}/translate",
    summary="Translate a session",
    tags=["Sessions"])
async def v1_translate(
    session_id: str, body: dict, request: Request, x_api_key: str = Header(default=""),
):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    # Delegate to existing handler
    return await translate_session(session_id, body)


@app.get("/api/v1/me",
    summary="Current user profile + API key",
    tags=["Auth"])
async def v1_me(request: Request, x_api_key: str = Header(default="")):
    user = await require_api_auth(request, x_api_key)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    if users_col is None:
        return JSONResponse(user)
    db_user = await users_col.find_one({"user_id": user.get("sub")},
                                        {"_id": 0, "password_hash": 0})
    return JSONResponse(db_user or user)


async def broadcast_event(session_id: str, client_ws: WebSocket, message: dict):
    """
    Publish event to Redis if available, else send directly to WebSocket.
    This enables WebSocket scaling across multiple worker instances.
    """
    if redis_client:
        try:
            await redis_client.publish(f"session:{session_id}", json.dumps(message))
            return
        except Exception as e:
            print(f"Redis publish error: {e}")
            pass
    # Fallback to direct send
    try:
        await client_ws.send_json(message)
    except Exception:
        pass


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/translate")
async def translate_ws(client_ws: WebSocket):
    await client_ws.accept()
    # Identify user from cookie if auth enabled
    ws_user_id = ""
    if AUTH_AVAILABLE:
        # Try query param first (browsers don't send cookies over WebSocket on HTTPS)
        token = client_ws.query_params.get("token") or client_ws.cookies.get("auth_token")
        if token:
            payload = decode_token(token)
            if payload:
                ws_user_id = payload.get("sub", "")

    try:
        settings_raw = await asyncio.wait_for(client_ws.receive_text(), timeout=10)
        settings     = json.loads(settings_raw)
    except Exception as e:
        await client_ws.send_json({"type": "error", "message": f"Settings error: {e}"})
        await client_ws.close()
        return

    mode          = settings.get("mode", "transcribe")
    language_code = settings.get("language", "hi-IN")
    target_lang   = settings.get("target_lang", "same")
    custom_vocabulary = normalize_custom_vocabulary(settings.get("custom_vocabulary", [])) if AI_FEATURES_AVAILABLE else []

    if not SARVAM_AVAILABLE:
        await client_ws.send_json({"type": "error", "message": "sarvamai not installed."})
        await client_ws.close()
        return

    if SARVAM_API_KEY == "YOUR_SARVAM_API_KEY_HERE":
        await client_ws.send_json({"type": "error", "message": "SARVAM_API_KEY not set!"})
        await client_ws.close()
        return

    session_id     = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    started_at     = datetime.now(timezone.utc)
    all_sentences  = []
    sentiment_timeline = []
    frag_buf       = []
    last_frag_t    = [0.0]
    pcm_buffer     = bytearray()
    session_active = True

    print(f"[Session] {session_id} started | mode={mode} lang={language_code}")

    sarvam_client = AsyncSarvamAI(api_subscription_key=SARVAM_API_KEY)

    # ── Flush idle fragments ──────────────────────────────────────────────────
    async def flush_idle():
        while session_active:
            await asyncio.sleep(0.3)
            if frag_buf:
                elapsed = asyncio.get_event_loop().time() - last_frag_t[0]
                if elapsed >= 1.5:
                    sentence = merge_fragments(frag_buf)
                    frag_buf.clear()
                    if sentence:
                        if AI_FEATURES_AVAILABLE and custom_vocabulary:
                            sentence = apply_custom_vocabulary(sentence, custom_vocabulary)
                        print(f"  [flush_idle] → '{sentence}'")
                        all_sentences.append(sentence)
                        if AI_FEATURES_AVAILABLE and sentiment_timeline is not None:
                            sentiment = {"text": sentence, **analyze_sentiment_text(sentence)}
                            sentiment_timeline.append(sentiment)
                            await broadcast_event(session_id, client_ws, {
                                "type": "sentiment",
                                "sentiment": sentiment,
                            })
                        await broadcast_event(session_id, client_ws, {
                            "type": "transcript", "text": sentence, "is_final": True, "mode": mode,
                        })

    # ── Sarvam streaming ──────────────────────────────────────────────────────
    async def sarvam_session():
        nonlocal pcm_buffer, session_active
        try:
            async with sarvam_client.speech_to_text_streaming.connect(
                model="saaras:v3",
                mode=mode,
                language_code=language_code,
                high_vad_sensitivity=True,
                vad_signals=True,
            ) as sarvam_ws:
                await broadcast_event(session_id, client_ws, {
                    "type": "ready", "message": "Sarvam AI connected",
                    "session_id": session_id,
                    "db": "connected" if db_collection is not None else "disconnected",
                })

                async def sender():
                    nonlocal pcm_buffer
                    while session_active:
                        if len(pcm_buffer) >= CHUNK_BYTES:
                            chunk      = bytes(pcm_buffer[:CHUNK_BYTES])
                            pcm_buffer = pcm_buffer[CHUNK_BYTES:]
                            wav_data   = pcm_to_wav(chunk, SAMPLE_RATE, CHANNELS)
                            encoded    = base64.b64encode(wav_data).decode("utf-8")
                            await sarvam_ws.transcribe(
                                audio=encoded, encoding="audio/wav", sample_rate=SAMPLE_RATE,
                            )
                        else:
                            await asyncio.sleep(0.01)

                async def receiver():
                    async for msg in sarvam_ws:
                        await process_sarvam_msg(
                            msg, client_ws, mode,
                            frag_buf, last_frag_t, all_sentences, session_id, custom_vocabulary, sentiment_timeline
                        )

                await asyncio.gather(sender(), receiver(), flush_idle())

        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"Sarvam error: {e}")
            try:
                await client_ws.send_json({"type": "error", "message": str(e)})
            except Exception:
                pass

    # ── Audio + control receiver ──────────────────────────────────────────────
    async def audio_receiver():
        nonlocal pcm_buffer, session_active
        try:
            while True:
                # Receive either bytes (audio) or text (control like "stop")
                msg = await client_ws.receive()
                if msg["type"] == "websocket.receive":
                    if "bytes" in msg and msg["bytes"]:
                        pcm_buffer.extend(msg["bytes"])
                    elif "text" in msg and msg["text"]:
                        data = json.loads(msg["text"])
                        if data.get("action") == "stop":
                            print(f"  [Control] Stop received from browser")
                            session_active = False
                            return   # exit cleanly — triggers finally in gather
        except WebSocketDisconnect:
            session_active = False
        except Exception as e:
            print(f"  [audio_receiver] {e}")
            session_active = False

    # ── Redis Subscriber ──────────────────────────────────────────────────────
    async def redis_subscriber():
        if not redis_client:
            return
        try:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(f"session:{session_id}")
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await client_ws.send_json(data)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Redis subscriber error: {e}")
        finally:
            if 'pubsub' in locals():
                await pubsub.unsubscribe(f"session:{session_id}")
                await pubsub.close()

    subscriber_task = asyncio.create_task(redis_subscriber(), name="redis_sub")

    # Run all tasks — cancel all when any one finishes (stop signal or disconnect)
    tasks = [
        asyncio.create_task(sarvam_session(), name="sarvam"),
        asyncio.create_task(audio_receiver(),  name="audio"),
    ]
    try:
        # Wait until FIRST task completes (audio_receiver exits on stop/disconnect)
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        # Cancel remaining tasks
        for t in pending:
            t.cancel()
            try:
                await t
            except asyncio.CancelledError:
                pass
    except Exception as e:
        print(f"[Session] task error: {e}")

    # ── Flush remaining fragment ──────────────────────────────────────────────
    if frag_buf:
        sentence = merge_fragments(frag_buf)
        if sentence:
            if AI_FEATURES_AVAILABLE and custom_vocabulary:
                sentence = apply_custom_vocabulary(sentence, custom_vocabulary)
            all_sentences.append(sentence)
            if AI_FEATURES_AVAILABLE:
                sentiment_timeline.append({"text": sentence, **analyze_sentiment_text(sentence)})

    print(f"[Session] {session_id} ended — {len(all_sentences)} sentences")

    # ── WebSocket is STILL OPEN here — process + send results ────────────────
    if all_sentences:
        try:
            # 1. Notify browser: processing started
            await broadcast_event(session_id, client_ws, {
                "type": "processing",
                "message": f"Analysing {len(all_sentences)} sentences with AI..."
            })
        except Exception:
            pass

        result = {"summary": "", "filtered_transcript": ""}
        if LLM_AVAILABLE and os.getenv("GROQ_API_KEY", "") not in ("", "YOUR_GROQ_API_KEY_HERE"):
            print(f"  [LLM] Calling Groq...")
            result = await process_session(all_sentences)
        else:
            print(f"  [LLM] Skipped — LLM_AVAILABLE={LLM_AVAILABLE}, key set={GROQ_API_KEY != 'YOUR_GROQ_API_KEY_HERE'}")

        # 2. Send analysis results to browser while connection is open
        try:
            await broadcast_event(session_id, client_ws, {
                "type":                "session_analysis",
                "summary":             result.get("summary", ""),
                "notes":               result.get("notes", ""),
                "filtered_transcript": result.get("filtered_transcript", ""),
                "corrected_transcript":result.get("corrected_transcript", ""),
                "title":               result.get("title", ""),
                "speakers":            result.get("speakers", []),
            })
            print(f"  [LLM] Sent → title:'{result.get('title','')}' summary:{len(result.get('summary',''))} chars notes:{len(result.get('notes',''))} chars")
        except Exception as e:
            print(f"  [LLM] Send error: {e}")

        # 3. Save to MongoDB
        raw_title   = result.get("title", "")
        final_title = await resolve_title(raw_title, ws_user_id)
        await save_to_mongo(
            session_id, started_at, language_code, mode,
            list(all_sentences),
            result.get("filtered_transcript", ""),
            result.get("summary", ""),
            result.get("corrected_transcript", ""),
            final_title,
            result.get("notes", ""),
            ws_user_id,
            result.get("speakers", []),
            extra_fields={
                "target_lang": target_lang,
                "custom_vocabulary": custom_vocabulary,
                "sentiment_timeline": sentiment_timeline,
                "sentiment_summary": summarize_sentiment_timeline(sentiment_timeline) if AI_FEATURES_AVAILABLE else {},
            },
        )

        # 4. Notify browser: saved
        try:
            await broadcast_event(session_id, client_ws, {"type": "saved", "message": "✓ Session saved to MongoDB"})
        except Exception:
            pass
    else:
        print(f"  [Session] No sentences — nothing to save")

    try:
        subscriber_task.cancel()
        await client_ws.close()
    except Exception:
        pass


async def process_sarvam_msg(msg, client_ws, mode, frag_buf, last_frag_t, all_sentences, session_id=None, custom_vocabulary=None, sentiment_timeline=None):
    try:
        if hasattr(msg, 'model_dump'):
            d = msg.model_dump()
        elif hasattr(msg, '__dict__'):
            d = vars(msg)
        elif isinstance(msg, dict):
            d = msg
        elif isinstance(msg, str):
            d = json.loads(msg)
        else:
            return

        msg_type = d.get("type", "")
        data     = d.get("data") or {}
        if hasattr(data, 'model_dump'):
            data = data.model_dump()
        elif hasattr(data, '__dict__'):
            data = vars(data)

        # VAD events
        if msg_type == "events":
            signal = data.get("signal_type", "")
            if signal == "START_SPEECH":
                if session_id: await broadcast_event(session_id, client_ws, {"type": "speech_start"})
                else: await client_ws.send_json({"type": "speech_start"})
            elif signal == "END_SPEECH":
                if session_id: await broadcast_event(session_id, client_ws, {"type": "speech_end"})
                else: await client_ws.send_json({"type": "speech_end"})
                if frag_buf:
                    sentence = merge_fragments(frag_buf)
                    frag_buf.clear()
                    if sentence:
                        if AI_FEATURES_AVAILABLE and custom_vocabulary:
                            sentence = apply_custom_vocabulary(sentence, custom_vocabulary)
                        print(f"  [END_SPEECH] → '{sentence}'")
                        all_sentences.append(sentence)
                        if AI_FEATURES_AVAILABLE and sentiment_timeline is not None:
                            sentiment = {"text": sentence, **analyze_sentiment_text(sentence)}
                            sentiment_timeline.append(sentiment)
                            sentiment_payload = {"type": "sentiment", "sentiment": sentiment}
                            if session_id: await broadcast_event(session_id, client_ws, sentiment_payload)
                            else: await client_ws.send_json(sentiment_payload)
                        payload = {"type": "transcript", "text": sentence, "is_final": True, "mode": mode}
                        if session_id: await broadcast_event(session_id, client_ws, payload)
                        else: await client_ws.send_json(payload)
            return

        # Transcript fragment
        if msg_type == "data":
            text = (data.get("transcript") or data.get("text") or data.get("translation") or "")
            if not text or not str(text).strip():
                return
            text = str(text).strip()
            if AI_FEATURES_AVAILABLE and custom_vocabulary:
                text = apply_custom_vocabulary(text, custom_vocabulary)
            if len(text) <= 2 and text[-1:] not in '.!?।':
                return

            print(f"  [fragment] '{text}'")
            frag_buf.append(text)
            last_frag_t[0] = asyncio.get_event_loop().time()

            preview = merge_fragments(frag_buf)
            payload_partial = {"type": "partial", "text": preview, "is_final": False}
            if session_id: await broadcast_event(session_id, client_ws, payload_partial)
            else: await client_ws.send_json(payload_partial)

            if is_sentence_end(text):
                sentence = merge_fragments(frag_buf)
                frag_buf.clear()
                if sentence:
                    if AI_FEATURES_AVAILABLE and custom_vocabulary:
                        sentence = apply_custom_vocabulary(sentence, custom_vocabulary)
                    print(f"  [sentence] → '{sentence}'")
                    all_sentences.append(sentence)
                    if AI_FEATURES_AVAILABLE and sentiment_timeline is not None:
                        sentiment = {"text": sentence, **analyze_sentiment_text(sentence)}
                        sentiment_timeline.append(sentiment)
                        sentiment_payload = {"type": "sentiment", "sentiment": sentiment}
                        if session_id:
                            await broadcast_event(session_id, client_ws, sentiment_payload)
                        else:
                            await client_ws.send_json(sentiment_payload)
                    payload_final = {"type": "transcript", "text": sentence, "is_final": True, "mode": mode}
                    if session_id: await broadcast_event(session_id, client_ws, payload_final)
                    else: await client_ws.send_json(payload_final)

    except Exception as e:
        print(f"process_sarvam_msg error: {e}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True, log_level="info")
