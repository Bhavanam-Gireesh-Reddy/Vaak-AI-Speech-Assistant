"""
LLM helper — Gemini API for session analysis, Groq for title + vision
- Analysis model : gemini-2.5-flash via Google Gemini API
- Title model    : llama-3.3-70b-versatile via Groq (dedicated, different from analysis)
- Vision model   : meta-llama/llama-4-scout-17b-16e-instruct via Groq (OCR)
"""

import os
import json
import re
import httpx

# ── Load .env if available (before reading env vars) ─────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ── Gemini API (text LLM) ────────────────────────────────────────────────────
GEMINI_URL   = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
# Force gemini-2.5-flash — ignore stale .env values like gemma-4-31b-it
_env_model = os.getenv("GEMINI_MODEL", "").strip()
GEMINI_MODEL = _env_model if _env_model and not _env_model.startswith("gemma") else "gemini-2.5-flash"

def _gemini_key() -> str:
    return os.getenv("GEMINI_API_KEY", "")

# ── Groq (vision only) ───────────────────────────────────────────────────────
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

def _groq_key() -> str:
    return os.getenv("GROQ_API_KEY", "")

# Backward compat — kept so main.py doesn't break if it sets these
GROQ_API_KEY = ""
GROQ_MODEL = GEMINI_MODEL  # alias for any code that reads this


async def call_groq(prompt: str, system: str, max_tokens: int = 2000) -> str:
    """Call Gemini API (Gemma 4). Reads API key from env at call time."""
    api_key = _gemini_key()
    if not api_key:
        print("  [LLM] ❌ GEMINI_API_KEY not set — check your .env file")
        return ""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":      GEMINI_MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt},
        ],
    }

    try:
        print(f"  [LLM] 🔷 Calling {GEMINI_MODEL} via Gemini API...")
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(GEMINI_URL, headers=headers, json=payload)

            if res.status_code == 429:
                print(f"  [LLM] ⚠️  429 rate limit on {GEMINI_MODEL} — try again in a moment")
                return ""

            res.raise_for_status()
            data    = res.json()
            content = data["choices"][0]["message"]["content"].strip()
            # Gemma 4 wraps responses in <thought>...</thought> — strip it
            content = re.sub(r"<thought>.*?</thought>\s*", "", content, flags=re.DOTALL).strip()
            print(f"  [LLM] ✅ {GEMINI_MODEL} responded ({len(content)} chars)")
            return content

    except httpx.HTTPStatusError as e:
        print(f"  [LLM] HTTP error {e.response.status_code}: {e.response.text[:200]}")
        return ""
    except Exception as e:
        print(f"  [LLM] Error: {e}")
        return ""


GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_TITLE_MODEL  = os.getenv("GROQ_TITLE_MODEL", "llama-3.3-70b-versatile")
_GROQ_VISION_MAX_B64 = 4 * 1024 * 1024  # Groq limit: 4MB base64


async def call_groq_text(prompt: str, system: str, model: str = None, max_tokens: int = 200) -> str:
    """Call Groq text chat completions. Separate from Gemini path so title uses a different model."""
    api_key = _groq_key()
    if not api_key:
        print("  [Groq Text] ❌ GROQ_API_KEY not set")
        return ""

    use_model = model or GROQ_TITLE_MODEL
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": use_model,
        "max_tokens": max_tokens,
        "temperature": 0.3,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt},
        ],
    }

    try:
        print(f"  [Groq Text] 🔶 Calling {use_model}...")
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(GROQ_URL, headers=headers, json=payload)
            if res.status_code == 429:
                print(f"  [Groq Text] ⚠️ 429 rate limit on {use_model}")
                return ""
            if res.status_code != 200:
                print(f"  [Groq Text] HTTP {res.status_code}: {res.text[:200]}")
                return ""
            data = res.json()
            content = data["choices"][0]["message"]["content"].strip()
            print(f"  [Groq Text] ✅ {use_model} responded ({len(content)} chars)")
            return content
    except httpx.TimeoutException:
        print("  [Groq Text] ⚠️ Request timed out")
        return ""
    except Exception as e:
        print(f"  [Groq Text] Error: {e}")
        return ""


_TITLE_SYSTEM = (
    "You generate concise session titles. "
    "Return ONLY a 2-5 word title describing the core topic. "
    "No quotes, no punctuation at the end, no prefixes like 'Title:'. "
    "Examples: Operating Systems Basics, CPU Pipelining, Meeting With Product Team."
)


async def generate_title_groq(transcript: str, fallback: str = "") -> str:
    """Dedicated Groq title generation — uses a different model than the main analysis LLM."""
    text = (transcript or "").strip()
    if not text:
        return fallback

    excerpt = text[:4000]
    raw = await call_groq_text(
        f"Transcript excerpt:\n\n{excerpt}\n\nGive the title.",
        _TITLE_SYSTEM,
        max_tokens=40,
    )

    if not raw:
        return fallback

    title = raw.strip().strip('"').strip("'")
    title = re.sub(r"^(title|topic)\s*[:\-]\s*", "", title, flags=re.IGNORECASE)
    title = title.splitlines()[0].strip()
    title = title.rstrip(".!?,;:")
    words = title.split()
    if len(words) > 8:
        title = " ".join(words[:8])
    return title or fallback


async def call_groq_vision(image_base64: str, file_type: str = "image/png", prompt: str = "", system: str = "") -> str:
    """Send an image to Groq Vision API (Llama 4 Scout) for OCR / image understanding."""
    api_key = _groq_key() or GROQ_API_KEY
    if not api_key:
        print("  [Groq Vision] ❌ GROQ_API_KEY not set")
        return ""

    if len(image_base64) > _GROQ_VISION_MAX_B64:
        print(f"  [Groq Vision] ⚠️ Image too large ({len(image_base64)//1024}KB > 4MB limit), skipping")
        return ""

    if not prompt:
        prompt = (
            "Extract ALL text from this image exactly as written. "
            "Preserve the original structure: line breaks, paragraphs, bullet points, numbering, indentation. "
            "If handwritten, do your best to read every word accurately. "
            "Return ONLY the extracted text, nothing else."
        )

    # Build the multimodal message
    media_type = file_type if file_type in ("image/png", "image/jpeg", "image/gif", "image/webp") else "image/png"
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_base64}"}},
        ],
    })

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_VISION_MODEL,
        "max_tokens": 4000,
        "messages": messages,
    }

    try:
        print(f"  [Groq Vision] Calling {GROQ_VISION_MODEL}...")
        async with httpx.AsyncClient(timeout=90) as client:
            res = await client.post(GROQ_URL, headers=headers, json=payload)
            if res.status_code == 429:
                print("  [Groq Vision] ⚠️ 429 rate limit")
                return ""
            if res.status_code != 200:
                print(f"  [Groq Vision] HTTP {res.status_code}: {res.text[:200]}")
                return ""
            data = res.json()
            content = data["choices"][0]["message"]["content"].strip()
            print(f"  [Groq Vision] ✅ Extracted {len(content)} chars")
            return content
    except httpx.TimeoutException:
        print("  [Groq Vision] ⚠️ Request timed out (90s)")
        return ""
    except Exception as e:
        print(f"  [Groq Vision] Error: {e}")
        return ""


# ── Combined analysis: summary + filtered + corrected + title + speakers ──────
COMBINED_SYSTEM = """You are an expert transcript analyzer for engineering lectures.
Given a full transcript, return a JSON object with exactly these six fields:

1. "summary": a highly detailed and comprehensive summary of the entire session.
   Instead of just 3 bullet points, provide a thorough overview of all topics discussed,
   key arguments, technical concepts, context, and important takeaways.
   Break it down into well-structured paragraphs or extensive bullet points.
   Use \\n for line breaks.

2. "filtered_transcript": keep ONLY educational/technical content.
   Remove: casual talk, filler words, greetings, off-topic remarks, repeated fragments.
   Keep: technical explanations, definitions, concepts, formulas, procedures, equations, and specific examples.
   Format as clean paragraphs separated by \\n\\n.
   If nothing is technical, use empty string "".

3. "corrected_transcript": the FULL transcript with punctuation and capitalization fixed.
   Fix: missing periods, commas, question marks, capitalize sentence starts and proper nouns.
   Do NOT change any words, only fix punctuation and capitalization.
   Format as clean paragraphs separated by \\n\\n.

4. "title": a short 2-5 word topic title describing what this session is about.
   Examples: "Operating Systems Basics", "Virtual Machines Setup", "CPU Architecture"
   Be specific to the actual content. No quotes, no punctuation at end.

5. "speakers": infer speaker changes from context. Look for: topic shifts, question-answer
   patterns, different speaking styles, direct address changes. Return an array of objects:
   [{"speaker": "Speaker 1", "text": "sentence or group of sentences"}, ...]
   Group consecutive sentences by the same inferred speaker.
   If only one speaker detected, return all as "Speaker 1".

6. "notes": comprehensive and structured study preparation notes based extensively on the filtered technical content.
   If the valid content is sparse, use your extensive knowledge to generate high-level, comprehensive notes related
   to the inferred topic. Use detailed bullet points, subheadings, and clear explanations. Format as clean text with \\n for line breaks.

CRITICAL: Return ONLY valid JSON on a single line. Use \\n for newlines inside strings.
No markdown fences, no explanation, no extra text."""


def _heuristic_title(text: str) -> str:
    """Derive a short title from transcript text when the LLM is unavailable."""
    words = re.findall(r"\S+", (text or "").strip())
    if not words:
        return "Session"
    snippet = " ".join(words[:6])
    snippet = snippet.rstrip(".!?,;:")
    return snippet or "Session"


def _heuristic_summary(text: str) -> str:
    """Clip the raw transcript to a short preview as a summary fallback."""
    t = (text or "").strip()
    if not t:
        return ""
    if len(t) <= 320:
        return t
    return t[:320].rsplit(" ", 1)[0] + "…"


async def process_session(sentences: list) -> dict:
    """Called once when session stops. Returns all analysis fields."""
    empty = {"summary": "", "filtered_transcript": "", "corrected_transcript": "", "title": "", "speakers": [], "notes": ""}
    if not sentences:
        return empty

    text = " ".join(sentences)
    print(f"  [LLM] Processing {len(sentences)} sentences ({len(text)} chars) with {GEMINI_MODEL}...")

    fallback_title   = _heuristic_title(text)
    fallback_summary = _heuristic_summary(text)

    result = await call_groq(
        f"Analyze this transcript:\n\n{text}",
        COMBINED_SYSTEM,
        max_tokens=4000
    )

    if not result:
        # Gemini failed — still try Groq for the title alone, and hand back a
        # heuristic summary so the frontend always has something to render.
        groq_title = await generate_title_groq(text, fallback=fallback_title)
        return {
            "summary": fallback_summary,
            "filtered_transcript": "",
            "corrected_transcript": text,
            "title": groq_title or fallback_title,
            "speakers": [],
            "notes": "",
        }

    try:
        cleaned = result.strip()

        # Strip markdown fences if model adds them
        if cleaned.startswith("```"):
            parts   = cleaned.split("```")
            cleaned = parts[1] if len(parts) > 1 else cleaned
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        cleaned = cleaned.strip()

        import json_repair
        data = json_repair.repair_json(cleaned, return_objects=True)
        if not isinstance(data, dict):
            data = {}
            
        summary   = data.get("summary",   "")
        filtered  = data.get("filtered_transcript",  "")
        corrected = data.get("corrected_transcript", "")
        gemini_title = data.get("title",     "")
        speakers  = data.get("speakers",  [])
        notes     = data.get("notes",     "")

        groq_title = await generate_title_groq(corrected or filtered or text, fallback=gemini_title)
        title = groq_title or gemini_title or fallback_title
        if not summary:
            summary = fallback_summary

        print(f"  [LLM] ✅ {GEMINI_MODEL} + {GROQ_TITLE_MODEL} → Title:'{title}' Speakers:{len(speakers)} Notes:{len(notes)} chars Summary:{len(summary)} chars")
        return {
            "summary":              summary,
            "filtered_transcript":  filtered,
            "corrected_transcript": corrected,
            "title":                title,
            "speakers":             speakers,
            "notes":                notes,
        }

    except Exception as e:
        print(f"  [LLM] JSON parse error: {e} — trying regex fallback...")
        try:
            sm_match = re.search(r'"summary"\s*:\s*"(.*?)"(?=\s*,)',              result, re.DOTALL)
            ft_match = re.search(r'"filtered_transcript"\s*:\s*"(.*?)"(?=\s*[,}])', result, re.DOTALL)
            ct_match = re.search(r'"corrected_transcript"\s*:\s*"(.*?)"(?=\s*[,}])', result, re.DOTALL)
            ti_match = re.search(r'"title"\s*:\s*"(.*?)"(?=\s*[,}])',             result, re.DOTALL)
            nt_match = re.search(r'"notes"\s*:\s*"(.*?)"(?=\s*[,}])',             result, re.DOTALL)

            summary   = sm_match.group(1).replace("\\n", "\n") if sm_match else ""
            filtered  = ft_match.group(1).replace("\\n", "\n") if ft_match else ""
            corrected = ct_match.group(1).replace("\\n", "\n") if ct_match else ""
            gemini_title = ti_match.group(1)                       if ti_match else ""
            notes     = nt_match.group(1).replace("\\n", "\n") if nt_match else ""

            title = await generate_title_groq(corrected or filtered or text, fallback=gemini_title or fallback_title)
            if not summary:
                summary = fallback_summary

            print(f"  [LLM] Regex fallback — title:'{title}' (Groq) notes:{len(notes)} chars summary:{len(summary)} chars")
            return {
                "summary":              summary or fallback_summary,
                "filtered_transcript":  filtered,
                "corrected_transcript": corrected or text,
                "title":                title or fallback_title,
                "speakers":             [],
                "notes":                notes,
            }
        except Exception as e2:
            print(f"  [LLM] Regex fallback failed: {e2}")
            return {
                "summary": fallback_summary,
                "filtered_transcript": "",
                "corrected_transcript": text,
                "title": fallback_title,
                "speakers": [],
                "notes": "",
            }


# ── Translate a transcript ────────────────────────────────────────────────────
LANG_NAMES = {
    "en": "English", "hi": "Hindi",   "ta": "Tamil",    "te": "Telugu",
    "kn": "Kannada", "ml": "Malayalam","bn": "Bengali",  "mr": "Marathi",
    "gu": "Gujarati","pa": "Punjabi",  "or": "Odia",     "as": "Assamese",
    "fr": "French",  "es": "Spanish",  "de": "German",   "ja": "Japanese",
    "zh": "Chinese", "ar": "Arabic",
}

# Indian languages routed to Sarvam AI translation; everything else goes to Gemini.
INDIAN_LANGS = {"hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa", "or", "as"}

# Sarvam expects BCP-47 style codes like "hi-IN", "ta-IN".
_SARVAM_LANG = {
    "hi": "hi-IN", "ta": "ta-IN", "te": "te-IN", "kn": "kn-IN",
    "ml": "ml-IN", "bn": "bn-IN", "mr": "mr-IN", "gu": "gu-IN",
    "pa": "pa-IN", "or": "od-IN", "as": "as-IN", "en": "en-IN",
}

SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/translate"
# Sarvam limits each request to ~1000 chars — chunk longer text.
_SARVAM_CHUNK = 900


def _sarvam_key() -> str:
    return os.getenv("SARVAM_API_KEY", "")


def _chunk_text(text: str, size: int) -> list:
    text = text or ""
    if len(text) <= size:
        return [text] if text else []
    chunks, buf = [], []
    length = 0
    for part in re.split(r"(?<=[\.\!\?\n])\s+", text):
        if length + len(part) + 1 > size and buf:
            chunks.append(" ".join(buf).strip())
            buf, length = [], 0
        buf.append(part)
        length += len(part) + 1
    if buf:
        chunks.append(" ".join(buf).strip())
    return [c for c in chunks if c]


async def translate_sarvam(text: str, target_lang: str, source_lang: str = "auto") -> str:
    """Translate Indian-language text using Sarvam AI translation API."""
    api_key = _sarvam_key()
    if not api_key:
        print("  [Sarvam TL] ❌ SARVAM_API_KEY not set")
        return ""

    target = _SARVAM_LANG.get(target_lang, target_lang)
    source = _SARVAM_LANG.get(source_lang, "auto") if source_lang != "auto" else "auto"

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json",
    }

    out_parts = []
    for chunk in _chunk_text(text, _SARVAM_CHUNK):
        payload = {
            "input": chunk,
            "source_language_code": source,
            "target_language_code": target,
            "speaker_gender": "Male",
            "mode": "formal",
            "enable_preprocessing": False,
        }
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                res = await client.post(SARVAM_TRANSLATE_URL, headers=headers, json=payload)
                if res.status_code != 200:
                    print(f"  [Sarvam TL] HTTP {res.status_code}: {res.text[:200]}")
                    return ""
                data = res.json()
                out_parts.append(data.get("translated_text") or "")
        except Exception as e:
            print(f"  [Sarvam TL] Error: {e}")
            return ""

    translated = "\n\n".join(p for p in out_parts if p).strip()
    print(f"  [Sarvam TL] ✅ Translated {len(text)} → {len(translated)} chars ({target})")
    return translated


async def translate_transcript(text: str, target_lang: str) -> str:
    """Translate transcript text. Indian languages go through Sarvam AI;
    all other languages use Gemini."""
    if not text or not target_lang or target_lang == "same":
        return text or ""

    if target_lang in INDIAN_LANGS:
        sarvam_out = await translate_sarvam(text, target_lang)
        if sarvam_out:
            return sarvam_out
        print("  [Translate] ⚠️ Sarvam failed — falling back to Gemini")

    lang_name = LANG_NAMES.get(target_lang, target_lang)
    system = (
        f"You are a professional translator. Translate the given text to {lang_name}. "
        "Preserve paragraph structure and formatting. Return only the translated text, nothing else."
    )
    result = await call_groq(f"Translate to {lang_name}:\n\n{text}", system, max_tokens=3000)
    return result or ""