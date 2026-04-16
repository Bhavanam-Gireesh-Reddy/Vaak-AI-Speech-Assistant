# Vaak AI — Speech Intelligence Platform

> **Vaak** (वाक्) means "speech" in Sanskrit

Real-time speech transcription, translation, and AI-powered study tools built with **Sarvam AI**, **Google Gemini**, and **Next.js**.

Live-transcribe lectures in 11 Indian languages, then auto-generate notes, flashcards, quizzes, mind maps, and podcast scripts from the transcript.

---

## Features

### Live Transcription
- Real-time speech-to-text via Sarvam AI Saaras V3 over WebSocket
- 11 Indian languages: Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, English
- 4 modes: **translate** (to English), **transcribe** (original), **code-mix** (Hindi-English), **verbatim** (with fillers)
- Live waveform visualization and volume meter
- Voice Activity Detection (VAD) with auto-silence handling
- Real-time sentiment analysis per sentence
- Custom vocabulary support for domain-specific terms
- Speaker identification from context

### AI Studio
- **Rich Notes** -- markdown with tables, LaTeX equations, and Mermaid diagrams
- **Flashcards** -- auto-generated Q&A cards with explanations and difficulty levels
- **Quizzes** -- multiple-choice questions grounded in transcript content
- **Podcast Scripts** -- turn a lecture into a two-speaker educational dialogue
- **Mind Maps** -- visual Mermaid-based knowledge maps
- **Chat with Transcript** -- ask questions about session content
- **Action Items** -- extract tasks, owners, deadlines, and priorities
- **OCR Upload** -- scan handwritten notes via Groq Vision or Tesseract

### Session Management
- Auto-save transcripts to MongoDB with AI-generated titles and summaries
- Full-text search across all sessions
- Folder organization with auto-suggestions
- Export to PDF, DOC, and TXT
- Shareable public links (token-based, no login required)
- Multi-language translation output

### Meeting Integrations
- **Zoom** -- OAuth connect, list meetings, transcribe recordings
- **Google Calendar** -- view upcoming events, transcribe Google Meet recordings
- **Webex** -- OAuth connect, list meetings, transcribe recordings
- Webhook support for automatic transcription on recording completion

### User System
- JWT authentication with 72-hour token expiry
- Bcrypt password hashing
- API key generation for programmatic access
- Admin panel for user management
- Per-user session isolation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TailwindCSS, Lucide icons |
| Backend | FastAPI, Uvicorn, WebSocket streaming |
| Speech-to-Text | Sarvam AI Saaras V3 |
| Text LLM | Google Gemini API (gemini-2.5-flash) |
| Vision/OCR | Groq (Llama 4 Scout) |
| Database | MongoDB (via Motor async driver) |
| Cache/Pub-Sub | Redis (optional, for multi-worker scaling) |
| Auth | JWT (python-jose) + Bcrypt |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional)

### 1. Clone and install

```bash
git clone https://github.com/Bhavanam-Gireesh-Reddy/Vaak-AI.git
cd Vaak-AI

# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Required
SARVAM_API_KEY=your_key          # https://dashboard.sarvam.ai
GEMINI_API_KEY=your_key          # https://aistudio.google.com/apikey
SECRET_KEY=random_32_char_string

# Database
MONGO_URI=mongodb://localhost:27017
MONGO_DB=live_transcription
MONGO_COL=sessions
MONGO_COL_USERS=users

# Optional
GROQ_API_KEY=your_key            # For Vision/OCR (https://console.groq.com)
GEMINI_MODEL=gemini-2.5-flash    # Default model
USE_REDIS=false
REDIS_URI=redis://localhost:6379
```

Also configure the frontend:

```bash
cp frontend/.env.example frontend/.env
```

```env
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 3. Start the application

```bash
# Terminal 1: Backend
python main.py
# Starts on http://localhost:8000

# Terminal 2: Frontend
cd frontend
npm run dev
# Starts on http://localhost:3000
```

### 4. First-time setup

1. Open http://localhost:3000
2. Register an account
3. The first user is auto-promoted to admin
4. Start transcribing from the **Live** page

---

## Project Structure

```
Vaak-AI/
├── main.py                 # FastAPI app, all API routes, WebSocket handler
├── llm.py                  # Gemini API (text) + Groq (vision) integration
├── ai_features.py          # AI tools: flashcards, quizzes, notes, OCR, sentiment
├── auth.py                 # JWT + Bcrypt authentication
├── meetings.py             # Zoom, Google, Webex OAuth and API wrappers
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
│
├── frontend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── (app)/              # Protected routes
│       │   │   ├── live/           # Live transcription
│       │   │   ├── studio/         # AI study tools
│       │   │   ├── dashboard/      # Analytics overview
│       │   │   ├── history/        # Session browser
│       │   │   ├── meetings/       # Meeting integrations
│       │   │   └── admin/          # User management
│       │   ├── (auth)/             # Public routes
│       │   │   ├── login/
│       │   │   └── register/
│       │   ├── share/[token]/      # Public shared transcripts
│       │   └── embed/live/         # Embeddable widget
│       ├── components/
│       │   ├── live/               # WebSocket audio + waveform
│       │   ├── studio/             # Flashcards, quizzes, mind maps
│       │   ├── dashboard/          # Stats and charts
│       │   ├── history/            # Search and filter
│       │   ├── meetings/           # Platform connectors
│       │   ├── admin/              # Admin panel
│       │   ├── auth/               # Login/register forms
│       │   └── providers/          # Auth context
│       └── lib/
│           ├── auth-types.ts       # Type definitions
│           └── server-auth.ts      # Server-side auth helpers
│
├── SECURITY.md
├── MEETING_SETUP_GUIDE.md
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user profile |

### Sessions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sessions` | List user's sessions |
| GET | `/api/sessions/{id}` | Get session details |
| DELETE | `/api/sessions` | Delete sessions |
| GET | `/api/search` | Full-text search |
| POST | `/api/sessions/{id}/translate` | Translate transcript |

### AI Features
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions/{id}/flashcards` | Generate flashcards |
| POST | `/api/sessions/{id}/quiz` | Generate quiz |
| POST | `/api/sessions/{id}/podcast` | Generate podcast script |
| POST | `/api/sessions/{id}/mindmap` | Generate mind map |
| POST | `/api/sessions/{id}/rich_notes` | Generate rich markdown notes |
| POST | `/api/sessions/{id}/chat` | Chat with transcript |
| POST | `/api/sessions/{id}/action-items` | Extract action items |
| POST | `/api/sessions/{id}/upload-notes` | OCR handwritten notes |

### Meetings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/meetings/status` | Integration status |
| GET | `/api/meetings/all` | All upcoming meetings |
| GET | `/api/meetings/{platform}/auth` | OAuth authorization URL |
| POST | `/api/meetings/{platform}/callback` | OAuth callback |
| POST | `/api/meetings/disconnect` | Disconnect platform |

### WebSocket
| Path | Description |
|------|-------------|
| `WS /ws/translate` | Live audio streaming and transcription |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List all users |
| DELETE | `/api/admin/users/{id}` | Delete user |
| POST | `/api/admin/users/{id}/promote` | Promote to admin |
| GET | `/api/admin/stats` | System statistics |

### API v1 (for programmatic access with API keys)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/sessions` | List sessions |
| GET | `/api/v1/sessions/{id}` | Get session |
| GET | `/api/v1/sessions/{id}/transcript` | Get transcript only |
| DELETE | `/api/v1/sessions/{id}` | Delete session |
| GET | `/api/v1/search` | Search sessions |
| GET | `/api/v1/me` | Get user profile |

---

## Architecture

```
Browser (Next.js)
    │
    ├── Web Audio API ──► WebSocket /ws/translate ──► FastAPI Server
    │                         │                          │
    │                         ▼                          ▼
    │                    Sarvam AI               MongoDB (sessions)
    │                    Saaras V3               MongoDB (users)
    │                  (transcription)
    │
    ├── REST API calls ──► FastAPI ──► Gemini API (notes, flashcards, quizzes)
    │                                ──► Groq Vision (OCR)
    │                                ──► Zoom/Google/Webex (meetings)
    │
    └── Auth ──► JWT tokens ──► FastAPI middleware
```

### Data Flow (Live Transcription)

1. Browser captures microphone audio at 16 kHz mono PCM
2. Audio chunks sent over WebSocket to FastAPI
3. Server streams chunks to Sarvam AI Saaras V3
4. Partial and final transcripts returned in real-time
5. Custom vocabulary normalization applied
6. Sentiment analyzed per sentence
7. On session stop: Gemini generates title, summary, speakers, filtered transcript, notes
8. Full session saved to MongoDB

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SARVAM_API_KEY` | Yes | Sarvam AI API key for speech transcription |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for text LLM |
| `SECRET_KEY` | Yes | JWT signing key (min 32 chars) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `MONGO_DB` | No | Database name (default: `live_transcription`) |
| `MONGO_COL` | No | Sessions collection (default: `sessions`) |
| `MONGO_COL_USERS` | No | Users collection (default: `users`) |
| `GEMINI_MODEL` | No | LLM model (default: `gemini-2.5-flash`) |
| `GROQ_API_KEY` | No | Groq API key for Vision/OCR features |
| `USE_REDIS` | No | Enable Redis Pub/Sub (default: `false`) |
| `REDIS_URI` | No | Redis connection string |
| `ZOOM_CLIENT_ID` | No | Zoom OAuth client ID |
| `ZOOM_CLIENT_SECRET` | No | Zoom OAuth client secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `WEBEX_CLIENT_ID` | No | Webex OAuth client ID |
| `WEBEX_CLIENT_SECRET` | No | Webex OAuth client secret |

### Get API Keys

| Service | URL | Tier |
|---------|-----|------|
| Sarvam AI | https://dashboard.sarvam.ai | Paid |
| Google Gemini | https://aistudio.google.com/apikey | Free (15 RPM, 1M tokens/day) |
| Groq | https://console.groq.com/keys | Free (vision/OCR) |

---

## Supported Languages

| Language | Code | Transcription | Translation |
|----------|------|:---:|:---:|
| Hindi | hi-IN | Yes | Yes |
| Tamil | ta-IN | Yes | Yes |
| Telugu | te-IN | Yes | Yes |
| Kannada | kn-IN | Yes | Yes |
| Malayalam | ml-IN | Yes | Yes |
| Bengali | bn-IN | Yes | Yes |
| Marathi | mr-IN | Yes | Yes |
| Gujarati | gu-IN | Yes | Yes |
| Punjabi | pa-IN | Yes | Yes |
| Odia | or-IN | Yes | Yes |
| English | en-IN | Yes | Yes |

Additional translation outputs: French, Spanish, German, Japanese, Chinese, Arabic.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY not set` | Add your Gemini key to `.env` |
| `Connection refused - MongoDB` | Ensure `mongod` is running on localhost:27017 |
| No summary/title after stop | Check server logs for `[LLM]` errors; restart server after `.env` changes |
| Quiz/flashcards empty | Session needs at least ~100 characters of transcript |
| Microphone not working | Allow mic permission in browser; HTTPS required in production |
| 429 rate limit | Wait a moment; Gemini free tier allows 15 requests/minute |
| OCR not working | Set `GROQ_API_KEY` or install Tesseract |

---

## Security

- API keys stored in `.env` (git-ignored)
- JWT tokens with configurable expiry
- Bcrypt password hashing
- Per-user session isolation (localStorage and database)
- CORS configured for trusted origins
- Admin role-based access control
- API key authentication for programmatic access

### Production Checklist

- [ ] Set a strong random `SECRET_KEY` (32+ chars)
- [ ] Use MongoDB Atlas or authenticated MongoDB instance
- [ ] Enable HTTPS/SSL
- [ ] Set `CORS_ORIGINS` to your frontend domain
- [ ] Use environment variables or a secrets manager (not `.env` files)
- [ ] Enable Redis for multi-worker WebSocket scaling
- [ ] Monitor API usage and rate limits

---

## Dependencies

### Backend (Python)
| Package | Purpose |
|---------|---------|
| fastapi | Web framework and WebSocket |
| uvicorn | ASGI server |
| sarvamai | Sarvam AI SDK |
| motor | Async MongoDB driver |
| httpx | Async HTTP client |
| bcrypt | Password hashing |
| python-jose | JWT tokens |
| python-dotenv | Environment config |
| redis | Pub/Sub scaling |
| json-repair | LLM JSON output repair |
| Pillow | Image processing |

### Frontend (Node.js)
| Package | Purpose |
|---------|---------|
| next | React framework (SSR) |
| react | UI library |
| tailwindcss | Utility CSS |
| lucide-react | Icons |
| typescript | Type safety |

---

**Status:** Active Development
