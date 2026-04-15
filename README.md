# 🎙️ Sarvam AI Live Transcription & Translation — Saaras V3

Enterprise-grade real-time speech transcription, translation, and intelligent session analysis powered by **Sarvam AI**, **Groq LLM**, and **MongoDB**.

**Features:**
- ✅ **Sub-150ms latency** — live WebSocket streaming via Saaras V3
- ✅ **11 Indian languages** — translate to English, transcribe, code-mix, or verbatim modes
- ✅ **Smart session analysis** — automatic keyword extraction, transcript filtering, and title generation via Groq AI
- ✅ **AI Study Notes & Exports** — auto-generates structured notes and allows one-click export to PDF, DOC, and TXT.
- ✅ **AI Studio** — generate interactive flashcards & quizzes (with animated carousel UI), podcast scripts, mind maps, multi-language outputs, and grounded transcript chat.
- ✅ **Rich Markdown Notes** — auto-extracts comprehensive and detailed study notes complete with Markdown tables, LaTeX equations, and Mermaid diagrams based strictly on technical content.
- ✅ **Speaker identification** — inferred multi-speaker turns shown in live analysis and saved sessions
- ✅ **Real-time sentiment analysis** — live tone tracking across captured transcript segments
- ✅ **Custom vocabulary support** — bias and normalize terminology with per-session word mappings
- ✅ **Distributed Scalability** — built-in Redis Pub/Sub for syncing WebSockets across multiple server workers.
- ✅ **User authentication** — JWT-based auth + API key management
- ✅ **Session persistence** — store transcripts, translations, and metadata in MongoDB
- ✅ **Voice Activity Detection (VAD)** — auto-detects speech start/end
- ✅ **Live waveform visualization** — real-time volume meter + animated spectrum
- ✅ **Word & segment counters** — track speaking metrics
- ✅ **Secure API key management** — environment-based configuration

---

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Development](#development)
- [Security](#security)

---

## Quick Start

### 1. Clone & Install Dependencies
```bash
cd Sarvam
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with your API keys and database settings:

```env
# Sarvam AI
SARVAM_API_KEY=your_sarvam_api_key_here

# Groq LLM (for session analysis)
GROQ_API_KEY=your_groq_api_key_here

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=live_transcription
MONGO_COL=sessions
MONGO_COL_USERS=users

# Security (change this in production!)
SECRET_KEY=your_secret_key_here_min_32_chars
```

> ⚠️ **NEVER commit `.env` to version control** — it's in `.gitignore` for your protection.

### 3. Start Database & Cache
You need MongoDB and Redis running for the application to work correctly:
- Install and run [MongoDB](https://www.mongodb.com/try/download/community) locally on port `27017`
- Install and run [Redis](https://redis.io/download/) locally on port `6379`

*(Alternatively, you can use cloud instances by updating your `.env` connection URIs).*

### 4. Run the Server
```bash
python main.py
```

Server starts on `http://localhost:8000`

### 5. Access the Application
- **Web UI:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs
- **Alternative Docs:** http://localhost:8000/api/redoc

---

## Project Structure

```
Sarvam/
├── .env                 # ⚠️ API keys & secrets (NOT in git)
├── .gitignore          # Excludes .env and Python cache
│
├── main.py             # FastAPI app, WebSocket streaming, auth routes
├── llm.py              # Groq LLM integration for session analysis
├── auth.py             # JWT, bcrypt, API key generation & validation
│
├── templates/
│   ├── index.html      # Main live transcription UI
│   ├── dashboard.html  # Session history & analytics
│   ├── login.html      # User login page
│   ├── register.html   # User registration page
│   └── history.html    # Transcript history
│
├── requirements.txt    # Python dependencies
├── README.md          # This file
└── __pycache__/       # Python bytecode (auto-generated)
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SARVAM_API_KEY` | *(required)* | Sarvam AI API key for speech transcription |
| `GROQ_API_KEY` | *(required)* | Groq API key for LLM-based session analysis |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | `live_transcription` | MongoDB database name |
| `MONGO_COL` | `sessions` | MongoDB collection for transcription sessions |
| `MONGO_COL_USERS` | `users` | MongoDB collection for user accounts |
| `REDIS_URI` | `redis://localhost:6379` | Redis connection for WebSocket Pub/Sub scaling |
| `SECRET_KEY` | *(required)* | JWT signing key (min 32 chars, change in production) |

### Optional: OCR Setup (for Handwritten Notes)

The OCR feature supports **two methods** for extracting text from handwritten notes and images:

#### Option 1: Tesseract OCR (System-installed, high accuracy)
Install system-wide for best performance:

**Windows:**
```bash
# Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
# Or use Chocolatey:
choco install tesseract
```

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

#### Option 2: EasyOCR (pip-installable, recommended for cloud)
Pre-installed in `requirements.txt`. Downloads model (~100MB) on first use:
```bash
pip install easyocr
```

**Note:** If neither is available, the app provides helpful error messages with setup instructions directly in the UI.

### Get API Keys

1. **Sarvam AI** → https://sarvam.ai (sign up for API access)
2. **Groq** → https://console.groq.com (free tier available, 14,400 reqs/day)

---

## API Endpoints

### Public Routes
- `GET /` — Main transcription UI
- `GET /login` — User login page
- `GET /register` — User registration page
- `POST /api/register` — Register new user
- `POST /api/login` — Login (returns JWT)

### WebSocket (Live Transcription)
- `WS /ws/translate` — Stream audio, receive transcriptions

### Protected Routes (Requires JWT or API Key)
- `GET /dashboard` — User session dashboard
- `GET /api/sessions` — List user's past sessions
- `GET /api/sessions/{session_id}` — Get session details
- `POST /api/logout` — Logout

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Browser (Web Audio API)                                     │
│ • Captures microphone at 16 kHz (PCM mono)                  │
│ • Sends ~256ms chunks every 50ms (low latency)             │
└──────────────────┬──────────────────────────────────────────┘
                   │ WebSocket /ws/translate (Base64 chunks)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│ FastAPI Server (main.py)                                     │
│ • Receives audio chunks                                      │
│ • Forwards to Sarvam AI Saaras V3                           │
│ • Returns transcript/partial results in real-time          │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌─────────────────────────────┐
│ Sarvam AI        │  │ MongoDB (session storage)   │
│ (Transcription)  │  │ • Sessions & transcripts    │
└──────────────────┘  │ • Users & API keys          │
        ▲             │ • Metadata                  │
        │             └─────────────────────────────┘
        │                     ▲
        └─────────────────────┘
              (when session ends)
                      │
        ┌─────────────┴──────────────┐
        ▼                            ▼
┌──────────────────┐  ┌──────────────────────────────┐
│ Browser (UI)     │  │ Groq LLM (llm.py)            │
│ • Live updates  │  │ • Extract keywords           │
│ • Waveform viz  │  │ • Generate Study Notes       │
│ • Session recap │  │ • Generate Title & Summary   │
└──────────────────┘  │ • Fix punctuation & caps     │
                      └──────────────────────────────┘
```

### Key Components

1. **FastAPI Server** (`main.py`)
   - WebSocket endpoint for live audio streaming
   - JWT-based user authentication
   - Session management & MongoDB integration

2. **LLM Module** (`llm.py`)
   - Groq API integration for intelligent transcript analysis
   - Keyword extraction, filtering, and title generation
   - Runs automatically when session ends

3. **Auth Module** (`auth.py`)
   - Bcrypt password hashing
   - JWT token generation (72-hour expiry)
   - API key management for programmatic access

4. **Frontend** (`templates/`)
   - Real-time transcription UI with live waveform
   - User dashboard with session history
   - Authentication pages (login/register)

---

## Usage Guide

### 1. Register & Login
- Navigate to `http://localhost:8000/register`
- Create account (email + password)
- Login to get JWT token

### 2. Start Transcription
- Go to main UI: `http://localhost:8000`
- Select **Mode**:
  - `translate` — English output (from any Indian language)
  - `transcribe` — Original language output
  - `codemix` — Hindi-English mixed speech
  - `verbatim` — Exact words including filler sounds

- Select **Source Language**: Hindi, Tamil, Telugu, etc.
- Click **▶ Start** (or press `Enter`)
- Allow microphone access
- Start speaking!

### 3. Session Ends When
- You click **⏹ Stop**
- 30+ seconds of silence (VAD threshold)

### 4. Post-Session
- Transcript automatically enhanced with:
  - Keywords extracted
  - Technical content filtered
  - Session title generated
  - Punctuation & capitalization fixed
- Data saved to MongoDB
- View in **Dashboard**

---

## Advanced: Using the API Programmatically

### Get API Key
```bash
# Login & get JWT
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpass"}'
```

### Stream Audio via WebSocket
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/translate?mode=translate&lang=hi&api_key=YOUR_API_KEY');

// Send audio chunk (Base64 WAV)
ws.send(base64AudioChunk);

// Receive transcription
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Partial:', data.partial);
  console.log('Final:', data.final);
};
```

---

## Development

### Environment Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run Application
```bash
# Run server
python main.py
```

### Logs & Debugging
- Server logs printed to console
- Check MongoDB using `mongosh`:
  ```bash
  mongosh
  > use live_transcription
  > db.sessions.find().pretty()
  ```

---

## Security

### Best Practices Implemented
✅ **API keys in `.env`** — Never hardcoded in source  
✅ **JWT tokens** — 72-hour expiry, cryptographically signed  
✅ **Bcrypt hashing** — Passwords never stored in plaintext  
✅ **`.gitignore`** — Prevents accidental commits of `.env`  
✅ **CORS enabled** — Configured for trusted origins  

### Production Deployment Checklist
- [ ] Change `SECRET_KEY` to strong random string (32+ chars)
- [ ] Use MongoDB Atlas (or secure MongoDB instance)
- [ ] Enable HTTPS/SSL on FastAPI
- [ ] Validate/refresh API keys in credential manager
- [ ] Set `SARVAM_API_KEY` & `GROQ_API_KEY` via secure secrets (not `.env`)
- [ ] Monitor API usage & rate limits
- [ ] Implement rate limiting on WebSocket connections
- [ ] Enable MongoDB authentication
- [ ] Use environment-specific configs (dev/staging/prod)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'dotenv'` | Run `pip install python-dotenv` |
| `404 Not Found` on `/` | Check `templates/` folder exists |
| `Connection refused - MongoDB` | Ensure `mongod` is running on localhost:27017 |
| `API key not set` warning | Add `SARVAM_API_KEY` to `.env` |
| `GROQ 429 rate limit` | Free tier has 14,400 requests/day; upgrade plan if needed |
| Microphone not working | Check browser permissions, HTTPS required in production |

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Transcription latency | <150ms | Via WebSocket streaming |
| Session startup | <1s | Depends on browser/mic permission |
| Database insert | <100ms | MongoDB local |
| LLM processing | <5s | Groq API response time |
| UI responsiveness | 60 FPS | HTML5 Web Audio API |

---

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `fastapi` | Web framework | ≥0.110.0 |
| `uvicorn` | ASGI server | ≥0.29.0 |
| `sarvamai` | Sarvam AI SDK | ≥0.1.11 |
| `motor` | Async MongoDB | ≥3.3.0 |
| `pymongo` | MongoDB driver | ≥4.6.0 |
| `httpx` | Async HTTP client | ≥0.27.0 |
| `bcrypt` | Password hashing | ≥4.0.0 |
| `python-jose` | JWT support | ≥3.3.0 |
| `python-dotenv` | `.env` loader | ≥1.0.0 |

---


## Support & Contributing

For issues, suggestions, or contributions:
1. Check existing issues on GitHub
2. Open a new issue with clear description
3. Submit pull requests with tests

---

## Roadmap

- [ ] Multi-language output (not just English)
- [x] Multi-language output (not just English)
- [x] Voice profiles (speaker identification)
- [ ] Conversation threading (multi-speaker support)
- [x] Real-time sentiment analysis
- [x] Custom vocabulary/terminology support
- [x] Export to PDF/DOC/TXT
- [x] Flashcards (Animated Carousel UI)
- [x] Quizzes (Stacked interactive mode)
- [x] AI Podcast generation
- [x] Chat with your transcript
- [x] Mind Maps (Mermaid format)
- [x] Rich Notes (Tables & Equations)
- [ ] Mobile app (React Native)
- [ ] Docker containerization

---

**Last Updated:** March 2026  
**Status:** Active Development
