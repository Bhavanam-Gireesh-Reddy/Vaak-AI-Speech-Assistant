"""
Meeting platform integrations — Zoom, Google Meet (Calendar), Webex.

Handles OAuth flows, webhook processing, and meeting transcription pipelines.
"""

from __future__ import annotations

import os
import json
import hashlib
import hmac
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from pathlib import Path
from urllib.parse import urlencode

try:
    from dotenv import load_dotenv as _load_dotenv
    _load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
except ImportError:
    pass

import httpx

# ── Zoom Configuration ───────────────────────────────────────────────────────

ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID", "")
ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET", "")
ZOOM_REDIRECT_URI = os.getenv("ZOOM_REDIRECT_URI", "http://localhost:3000/meetings?provider=zoom")
ZOOM_WEBHOOK_SECRET = os.getenv("ZOOM_WEBHOOK_SECRET", "")

ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize"
ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
ZOOM_API_BASE = "https://api.zoom.us/v2"

# ── Google Configuration ─────────────────────────────────────────────────────

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/meetings?provider=google")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
]

# ── Webex Configuration ──────────────────────────────────────────────────────

WEBEX_CLIENT_ID = os.getenv("WEBEX_CLIENT_ID", "")
WEBEX_CLIENT_SECRET = os.getenv("WEBEX_CLIENT_SECRET", "")
WEBEX_REDIRECT_URI = os.getenv("WEBEX_REDIRECT_URI", "http://localhost:3000/meetings?provider=webex")
WEBEX_WEBHOOK_SECRET = os.getenv("WEBEX_WEBHOOK_SECRET", "")

WEBEX_AUTH_URL = "https://webexapis.com/v1/authorize"
WEBEX_TOKEN_URL = "https://webexapis.com/v1/access_token"
WEBEX_API_BASE = "https://webexapis.com/v1"


# ═════════════════════════════════════════════════════════════════════════════
#  ZOOM INTEGRATION
# ═════════════════════════════════════════════════════════════════════════════

def zoom_available() -> bool:
    return bool(ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET)


def get_zoom_auth_url(state: str = "") -> str:
    """Generate Zoom OAuth authorization URL."""
    params = {
        "response_type": "code",
        "client_id": ZOOM_CLIENT_ID,
        "redirect_uri": ZOOM_REDIRECT_URI,
        "state": state,
    }
    return f"{ZOOM_AUTH_URL}?{urlencode(params)}"


async def exchange_zoom_code(code: str) -> dict[str, Any]:
    """Exchange Zoom authorization code for access + refresh tokens."""
    import base64
    credentials = base64.b64encode(
        f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        res = await client.post(
            ZOOM_TOKEN_URL,
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": ZOOM_REDIRECT_URI,
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()


async def refresh_zoom_token(refresh_token: str) -> dict[str, Any]:
    """Refresh Zoom access token."""
    import base64
    credentials = base64.b64encode(
        f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        res = await client.post(
            ZOOM_TOKEN_URL,
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()


async def get_zoom_meetings(access_token: str) -> list[dict]:
    """Fetch upcoming Zoom meetings."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{ZOOM_API_BASE}/users/me/meetings",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"type": "upcoming", "page_size": 30},
            timeout=15.0,
        )
        if res.status_code == 401:
            raise PermissionError("Zoom token expired")
        res.raise_for_status()
        data = res.json()

    meetings = []
    for m in data.get("meetings", []):
        meetings.append({
            "id": str(m.get("id")),
            "title": m.get("topic", "Zoom Meeting"),
            "start_time": m.get("start_time", ""),
            "duration": m.get("duration", 0),
            "join_url": m.get("join_url", ""),
            "platform": "zoom",
            "status": "scheduled",
        })
    return meetings


async def get_zoom_recording_transcript(access_token: str, meeting_id: str) -> dict[str, Any]:
    """Get recording and transcript for a completed Zoom meeting."""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{ZOOM_API_BASE}/meetings/{meeting_id}/recordings",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15.0,
        )
        if res.status_code == 404:
            return {"error": "No recordings found for this meeting"}
        res.raise_for_status()
        data = res.json()

    transcript_url = None
    audio_url = None
    for file in data.get("recording_files", []):
        if file.get("recording_type") == "audio_transcript":
            transcript_url = file.get("download_url")
        elif file.get("file_type") == "MP4" or file.get("file_type") == "M4A":
            audio_url = file.get("download_url")

    result = {
        "meeting_id": meeting_id,
        "topic": data.get("topic", ""),
        "start_time": data.get("start_time", ""),
        "duration": data.get("duration", 0),
        "transcript_url": transcript_url,
        "audio_url": audio_url,
    }

    # If Zoom has its own transcript, download it
    if transcript_url:
        async with httpx.AsyncClient() as client:
            t_res = await client.get(
                f"{transcript_url}?access_token={access_token}",
                timeout=30.0,
            )
            if t_res.status_code == 200:
                result["transcript"] = t_res.text

    return result


def verify_zoom_webhook(request_body: bytes, signature: str, timestamp: str) -> bool:
    """Verify Zoom webhook event signature."""
    if not ZOOM_WEBHOOK_SECRET:
        return False
    message = f"v0:{timestamp}:{request_body.decode()}"
    expected = "v0=" + hmac.new(
        ZOOM_WEBHOOK_SECRET.encode(), message.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ═════════════════════════════════════════════════════════════════════════════
#  GOOGLE CALENDAR INTEGRATION
# ═════════════════════════════════════════════════════════════════════════════

def google_available() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


def get_google_auth_url(state: str = "") -> str:
    """Generate Google OAuth authorization URL."""
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_google_code(code: str) -> dict[str, Any]:
    """Exchange Google authorization code for tokens."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()


async def refresh_google_token(refresh_token: str) -> dict[str, Any]:
    """Refresh Google access token."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()


async def get_google_calendar_meetings(access_token: str, days_ahead: int = 7) -> list[dict]:
    """Fetch upcoming meetings from Google Calendar."""
    now = datetime.now(timezone.utc)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days_ahead)).isoformat()

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": 50,
                "q": "",  # all events
            },
            timeout=15.0,
        )
        if res.status_code == 401:
            raise PermissionError("Google token expired")
        res.raise_for_status()
        data = res.json()

    meetings = []
    for event in data.get("items", []):
        # Detect meeting platform from conference data or description
        platform = "calendar"
        join_url = ""
        conference = event.get("conferenceData", {})
        for ep in conference.get("entryPoints", []):
            if ep.get("entryPointType") == "video":
                join_url = ep.get("uri", "")
                if "meet.google.com" in join_url:
                    platform = "google_meet"
                elif "zoom.us" in join_url:
                    platform = "zoom"
                elif "webex" in join_url:
                    platform = "webex"
                break

        # Also check description/location for meeting links
        description = event.get("description", "") or ""
        location = event.get("location", "") or ""
        if not join_url:
            for text in [description, location]:
                if "meet.google.com" in text:
                    platform = "google_meet"
                elif "zoom.us" in text:
                    platform = "zoom"
                elif "webex" in text:
                    platform = "webex"

        start = event.get("start", {})
        start_time = start.get("dateTime") or start.get("date", "")

        end = event.get("end", {})
        end_time = end.get("dateTime") or end.get("date", "")

        meetings.append({
            "id": event.get("id", ""),
            "title": event.get("summary", "Untitled Event"),
            "start_time": start_time,
            "end_time": end_time,
            "join_url": join_url,
            "platform": platform,
            "status": event.get("status", "confirmed"),
            "organizer": event.get("organizer", {}).get("email", ""),
            "attendees": [
                a.get("email", "") for a in event.get("attendees", [])[:10]
            ],
            "description": description[:500],
        })

    return meetings


# ═════════════════════════════════════════════════════════════════════════════
#  WEBEX INTEGRATION
# ═════════════════════════════════════════════════════════════════════════════

def webex_available() -> bool:
    return bool(WEBEX_CLIENT_ID and WEBEX_CLIENT_SECRET)


def get_webex_auth_url(state: str = "") -> str:
    """Generate Webex OAuth authorization URL."""
    params = {
        "response_type": "code",
        "client_id": WEBEX_CLIENT_ID,
        "redirect_uri": WEBEX_REDIRECT_URI,
        "scope": "meeting:schedules_read meeting:recordings_read meeting:transcripts_read",
        "state": state,
    }
    return f"{WEBEX_AUTH_URL}?{urlencode(params)}"


async def exchange_webex_code(code: str) -> dict[str, Any]:
    """Exchange Webex authorization code for tokens."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            WEBEX_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "client_id": WEBEX_CLIENT_ID,
                "client_secret": WEBEX_CLIENT_SECRET,
                "code": code,
                "redirect_uri": WEBEX_REDIRECT_URI,
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()


async def refresh_webex_token(refresh_token: str) -> dict[str, Any]:
    """Refresh Webex access token."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            WEBEX_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "client_id": WEBEX_CLIENT_ID,
                "client_secret": WEBEX_CLIENT_SECRET,
                "refresh_token": refresh_token,
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return res.json()


async def get_webex_meetings(access_token: str) -> list[dict]:
    """Fetch upcoming Webex meetings."""
    now = datetime.now(timezone.utc)
    from_time = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    to_time = (now + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{WEBEX_API_BASE}/meetings",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "meetingType": "scheduledMeeting",
                "from": from_time,
                "to": to_time,
                "max": 30,
            },
            timeout=15.0,
        )
        if res.status_code == 401:
            raise PermissionError("Webex token expired")
        res.raise_for_status()
        data = res.json()

    meetings = []
    for m in data.get("items", []):
        meetings.append({
            "id": m.get("id", ""),
            "title": m.get("title", "Webex Meeting"),
            "start_time": m.get("start", ""),
            "end_time": m.get("end", ""),
            "join_url": m.get("webLink", ""),
            "platform": "webex",
            "status": m.get("state", "scheduled"),
        })
    return meetings


async def get_webex_meeting_transcript(access_token: str, meeting_id: str) -> dict[str, Any]:
    """Get transcript for a completed Webex meeting."""
    async with httpx.AsyncClient() as client:
        # Get transcripts list for this meeting
        res = await client.get(
            f"{WEBEX_API_BASE}/meetingTranscripts",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"meetingId": meeting_id},
            timeout=15.0,
        )
        if res.status_code == 404:
            return {"error": "No transcripts found for this meeting"}
        res.raise_for_status()
        data = res.json()

    items = data.get("items", [])
    if not items:
        return {"error": "No transcripts available"}

    transcript_id = items[0].get("id")
    if not transcript_id:
        return {"error": "Transcript ID not found"}

    # Download the transcript content
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{WEBEX_API_BASE}/meetingTranscripts/{transcript_id}/download",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"format": "txt"},
            timeout=30.0,
        )
        res.raise_for_status()

    return {
        "meeting_id": meeting_id,
        "transcript_id": transcript_id,
        "transcript": res.text,
    }


# ═════════════════════════════════════════════════════════════════════════════
#  MEETING TRANSCRIPT PROCESSING
# ═════════════════════════════════════════════════════════════════════════════

async def process_meeting_transcript(
    transcript_text: str,
    meeting_title: str,
    platform: str,
    meeting_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Process a meeting transcript through the AI pipeline.
    Uses the same flow as live transcription — sentence splitting,
    LLM analysis, sentiment timeline.
    """
    from ai_features import (
        transcript_to_sentences,
        analyze_sentiment_text,
        has_llm_access,
        summarize_sentiment_timeline,
    )
    from llm import process_session

    sentences = transcript_to_sentences(transcript_text)

    analysis = await process_session(sentences) if has_llm_access() else {
        "summary": "",
        "filtered_transcript": "",
        "corrected_transcript": transcript_text,
        "title": meeting_title,
        "speakers": [],
        "notes": "",
    }

    sentiment_timeline = [
        {"text": s, **analyze_sentiment_text(s)} for s in sentences[:200]
    ]

    return {
        "sentences": sentences,
        "analysis": analysis,
        "sentiment_timeline": sentiment_timeline,
        "sentiment_summary": summarize_sentiment_timeline(sentiment_timeline),
        "metadata": meeting_metadata or {},
    }


# ═════════════════════════════════════════════════════════════════════════════
#  INTEGRATION STATUS CHECK
# ═════════════════════════════════════════════════════════════════════════════

def get_integration_status() -> dict[str, Any]:
    """Return which integrations are configured."""
    return {
        "zoom": {
            "configured": zoom_available(),
            "client_id_set": bool(ZOOM_CLIENT_ID),
            "client_secret_set": bool(ZOOM_CLIENT_SECRET),
        },
        "google": {
            "configured": google_available(),
            "client_id_set": bool(GOOGLE_CLIENT_ID),
            "client_secret_set": bool(GOOGLE_CLIENT_SECRET),
        },
        "webex": {
            "configured": webex_available(),
            "client_id_set": bool(WEBEX_CLIENT_ID),
            "client_secret_set": bool(WEBEX_CLIENT_SECRET),
        },
    }
