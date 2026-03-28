"""
AI feature helpers for session enrichment and transcript-powered tools.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
import asyncio
from pathlib import Path
from typing import Any, Optional

try:
    import yt_dlp
    YTDLP_AVAILABLE = True
except ImportError:
    yt_dlp = None
    YTDLP_AVAILABLE = False

from llm import call_groq, process_session, translate_transcript


LANGUAGE_CHOICES = {
    "same": "Original Language",
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "or": "Odia",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "ja": "Japanese",
    "ar": "Arabic",
}

POSITIVE_WORDS = {
    "good", "great", "excellent", "clear", "helpful", "love", "like", "strong",
    "success", "confident", "win", "improve", "best", "happy", "progress",
    "awesome", "positive", "amazing", "well", "effective", "stable", "resolved",
}
NEGATIVE_WORDS = {
    "bad", "poor", "issue", "issues", "error", "errors", "fail", "failed",
    "failure", "problem", "problems", "bug", "bugs", "worse", "difficult",
    "confusing", "negative", "angry", "sad", "broken", "risk", "critical",
    "delay", "delayed", "wrong", "frustrating", "unstable", "panic",
}


def has_llm_access() -> bool:
    return os.getenv("GROQ_API_KEY", "") not in ("", "YOUR_GROQ_API_KEY_HERE")


def normalize_custom_vocabulary(raw_vocabulary: Any) -> list[dict[str, str]]:
    """Normalize vocabulary hints into a list of spoken->canonical mappings."""
    if not raw_vocabulary:
        return []

    entries: list[str] = []
    if isinstance(raw_vocabulary, str):
        entries = [line.strip() for line in re.split(r"[\n,]+", raw_vocabulary) if line.strip()]
    elif isinstance(raw_vocabulary, list):
        for item in raw_vocabulary:
            if isinstance(item, dict):
                spoken = str(item.get("spoken") or item.get("source") or item.get("term") or "").strip()
                canonical = str(item.get("canonical") or item.get("target") or item.get("value") or spoken).strip()
                if spoken:
                    entries.append(f"{spoken}={canonical}")
            else:
                text = str(item).strip()
                if text:
                    entries.append(text)
    else:
        text = str(raw_vocabulary).strip()
        if text:
            entries.append(text)

    normalized = []
    seen: set[tuple[str, str]] = set()
    for entry in entries:
        if "->" in entry:
            spoken, canonical = entry.split("->", 1)
        elif "=" in entry:
            spoken, canonical = entry.split("=", 1)
        elif ":" in entry:
            spoken, canonical = entry.split(":", 1)
        else:
            spoken, canonical = entry, entry
        spoken = spoken.strip()
        canonical = canonical.strip() or spoken
        if not spoken:
            continue
        key = (spoken.lower(), canonical)
        if key in seen:
            continue
        seen.add(key)
        normalized.append({"spoken": spoken, "canonical": canonical})
    return normalized


def apply_custom_vocabulary(text: str, raw_vocabulary: Any) -> str:
    if not text:
        return text

    mappings = normalize_custom_vocabulary(raw_vocabulary)
    if not mappings:
        return text

    updated = text
    for item in sorted(mappings, key=lambda x: len(x["spoken"]), reverse=True):
        spoken = item["spoken"]
        canonical = item["canonical"]
        pattern = re.compile(rf"\b{re.escape(spoken)}\b", re.IGNORECASE)
        updated = pattern.sub(canonical, updated)
    return updated


def analyze_sentiment_text(text: str) -> dict[str, Any]:
    """A lightweight live sentiment estimate for transcript fragments."""
    if not text:
        return {"label": "neutral", "score": 0.0}

    words = re.findall(r"[a-zA-Z']+", text.lower())
    positive = sum(1 for word in words if word in POSITIVE_WORDS)
    negative = sum(1 for word in words if word in NEGATIVE_WORDS)
    raw_score = positive - negative
    score = max(-1.0, min(1.0, raw_score / 4.0))

    if score >= 0.35:
        label = "positive"
    elif score <= -0.35:
        label = "negative"
    else:
        label = "neutral"

    return {
        "label": label,
        "score": round(score, 3),
        "positive_hits": positive,
        "negative_hits": negative,
    }


def summarize_sentiment_timeline(timeline: list[dict[str, Any]]) -> dict[str, Any]:
    if not timeline:
        return {"overall": "neutral", "average_score": 0.0, "counts": {"positive": 0, "neutral": 0, "negative": 0}}

    counts = {"positive": 0, "neutral": 0, "negative": 0}
    total = 0.0
    for item in timeline:
        label = item.get("label", "neutral")
        if label not in counts:
            label = "neutral"
        counts[label] += 1
        total += float(item.get("score", 0.0))

    avg = total / len(timeline)
    overall = "positive" if avg >= 0.2 else "negative" if avg <= -0.2 else "neutral"
    return {"overall": overall, "average_score": round(avg, 3), "counts": counts}


def transcript_to_sentences(text: str) -> list[str]:
    if not text:
        return []
    normalized = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[.!?।])\s+", normalized)
    return [part.strip() for part in parts if part.strip()]


def build_transcript_context(session_doc: dict[str, Any]) -> str:
    transcript = (
        session_doc.get("corrected_transcript")
        or session_doc.get("filtered_transcript")
        or session_doc.get("transcript")
        or ""
    )
    summary = session_doc.get("summary") or ""
    notes = session_doc.get("notes") or ""
    title = session_doc.get("title") or "Untitled Session"
    return (
        f"TITLE:\n{title}\n\n"
        f"SUMMARY:\n{summary}\n\n"
        f"NOTES:\n{notes}\n\n"
        f"TRANSCRIPT:\n{transcript}"
    ).strip()


async def _generate_json(prompt: str, system: str, fallback: Any) -> Any:
    if not has_llm_access():
        return fallback

    raw = await call_groq(prompt, system, max_tokens=2500)
    if not raw:
        return fallback

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                return fallback
        return fallback


async def generate_flashcards(session_doc: dict[str, Any]) -> list[dict[str, str]]:
    fallback = []
    system = (
        "You create concise, high-quality study flashcards from transcripts. "
        "Return valid JSON only: an array of 8 to 12 objects with keys "
        "question, answer, explanation, difficulty."
    )
    prompt = (
        "Create flashcards from this transcript context.\n\n"
        f"{build_transcript_context(session_doc)}"
    )
    data = await _generate_json(prompt, system, fallback)
    return data if isinstance(data, list) else fallback


async def generate_quiz(session_doc: dict[str, Any]) -> dict[str, Any]:
    fallback = {"title": session_doc.get("title", "Quiz"), "questions": []}
    system = (
        "You create transcript-based multiple-choice quizzes. "
        "Return valid JSON only with keys title and questions. "
        "questions must be an array of 5 to 8 objects with keys: question, options, answer_index, explanation."
    )
    prompt = (
        "Create a quiz from this transcript context.\n\n"
        f"{build_transcript_context(session_doc)}"
    )
    data = await _generate_json(prompt, system, fallback)
    if not isinstance(data, dict):
        return fallback
    if not isinstance(data.get("questions"), list):
        data["questions"] = []
    return data


async def generate_podcast_script(session_doc: dict[str, Any]) -> dict[str, Any]:
    fallback = {"title": session_doc.get("title", "Podcast"), "hook": "", "script": []}
    system = (
        "You create short educational podcast scripts from transcripts. "
        "Return valid JSON only with keys title, hook, takeaway, and script. "
        "script must be an array of dialogue objects with keys speaker and line."
    )
    prompt = (
        "Turn this transcript context into a compact educational podcast episode.\n\n"
        f"{build_transcript_context(session_doc)}"
    )
    data = await _generate_json(prompt, system, fallback)
    if not isinstance(data, dict):
        return fallback
    if not isinstance(data.get("script"), list):
        data["script"] = []
    return data


async def generate_mind_map(session_doc: dict[str, Any]) -> dict[str, Any]:
    fallback = {"title": session_doc.get("title", "Mind Map"), "mermaid": "", "outline": []}
    system = (
        "You create Mermaid mind maps from transcripts. "
        "Return valid JSON only with keys title, mermaid, outline. "
        "The mermaid value must be a valid Mermaid mindmap block without code fences."
    )
    prompt = (
        "Create a study mind map from this transcript context.\n\n"
        f"{build_transcript_context(session_doc)}"
    )
    data = await _generate_json(prompt, system, fallback)
    if not isinstance(data, dict):
        return fallback
    data["mermaid"] = str(data.get("mermaid") or "").strip()
    if not isinstance(data.get("outline"), list):
        data["outline"] = []
    return data


async def chat_with_transcript(
    session_doc: dict[str, Any],
    message: str,
    history: Optional[list[dict[str, str]]] = None,
) -> str:
    if not message.strip():
        return ""
    if not has_llm_access():
        transcript = session_doc.get("corrected_transcript") or session_doc.get("transcript") or ""
        return transcript[:1200] if transcript else "No transcript content available yet."

    prior = history or []
    compact_history = "\n".join(
        f"{item.get('role', 'user').upper()}: {item.get('content', '')}" for item in prior[-8:]
    )
    system = (
        "You answer questions grounded strictly in the provided transcript context. "
        "Be direct, helpful, and say when the transcript does not support a claim."
    )
    prompt = (
        f"Transcript context:\n\n{build_transcript_context(session_doc)}\n\n"
        f"Conversation so far:\n{compact_history}\n\n"
        f"User question:\n{message}"
    )
    return (await call_groq(prompt, system, max_tokens=1200)).strip()


def _parse_vtt_to_text(vtt_text: str) -> str:
    lines = []
    for raw_line in vtt_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("WEBVTT"):
            continue
        if "-->" in line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        if line.startswith("NOTE"):
            continue
        cleaned = re.sub(r"<[^>]+>", "", line)
        lines.append(cleaned)
    # Drop repeated caption duplicates while preserving order.
    deduped = []
    last = None
    for line in lines:
        if line != last:
            deduped.append(line)
            last = line
    return " ".join(deduped).strip()


def import_youtube_transcript(url: str) -> dict[str, Any]:
    if not YTDLP_AVAILABLE:
        raise RuntimeError("yt-dlp is not installed. Add it from requirements and reinstall dependencies.")
    if not url.strip():
        raise ValueError("YouTube URL is required.")

    with tempfile.TemporaryDirectory(prefix="sarvam_yt_") as temp_dir:
        output_template = str(Path(temp_dir) / "%(id)s.%(ext)s")
        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["en", "en-US", "en-IN", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa", "or"],
            "subtitlesformat": "vtt",
            "outtmpl": output_template,
            "noplaylist": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

        if not info:
            raise RuntimeError("Could not fetch YouTube metadata.")

        video_id = info.get("id")
        if not video_id:
            raise RuntimeError("Missing YouTube video id.")

        subtitle_files = sorted(Path(temp_dir).glob(f"{video_id}*.vtt"))
        if not subtitle_files:
            raise RuntimeError("No captions or automatic subtitles were available for this YouTube video.")

        transcript_text = ""
        picked_language = ""
        for file_path in subtitle_files:
            text = _parse_vtt_to_text(file_path.read_text(encoding="utf-8", errors="ignore"))
            if text:
                transcript_text = text
                suffix = file_path.stem.replace(video_id, "").strip(".")
                picked_language = suffix or "unknown"
                break

        if not transcript_text:
            raise RuntimeError("Captions were found but the transcript could not be parsed.")

        return {
            "title": info.get("title") or "YouTube Import",
            "channel": info.get("channel") or info.get("uploader") or "",
            "webpage_url": info.get("webpage_url") or url,
            "language": picked_language,
            "transcript": transcript_text,
            "thumbnail": info.get("thumbnail") or "",
            "duration": info.get("duration") or 0,
            "description": info.get("description") or "",
        }


async def build_youtube_session(url: str) -> dict[str, Any]:
    imported = await asyncio.to_thread(import_youtube_transcript, url)
    sentences = transcript_to_sentences(imported["transcript"])
    analysis = await process_session(sentences) if has_llm_access() else {
        "summary": "",
        "filtered_transcript": "",
        "corrected_transcript": imported["transcript"],
        "title": imported["title"],
        "speakers": [],
        "notes": "",
    }
    return {
        "imported": imported,
        "sentences": sentences,
        "analysis": analysis,
        "sentiment_timeline": [
            {"text": sentence, **analyze_sentiment_text(sentence)} for sentence in sentences[:200]
        ],
    }


async def generate_translation(session_doc: dict[str, Any], target_lang: str) -> str:
    if target_lang == "same":
        return session_doc.get("corrected_transcript") or session_doc.get("transcript") or ""
    text = session_doc.get("corrected_transcript") or session_doc.get("filtered_transcript") or session_doc.get("transcript") or ""
    return await translate_transcript(text, target_lang)
