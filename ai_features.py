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


from llm import call_groq, call_groq_vision, process_session, translate_transcript


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
        import json_repair
        res = json_repair.repair_json(cleaned, return_objects=True)
        if isinstance(res, (dict, list)):
            return res
        return fallback
    except Exception as e:
        print(f"JSON repair failed: {e}")
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


def _clean_mind_map_label(value: Any) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    text = re.sub(r"[`\"]", "", text)
    text = text.strip("-:> ")
    return text[:120]


def _normalize_mind_map_outline(raw_items: Any, depth: int = 0) -> list[dict[str, Any]]:
    if depth > 2 or not isinstance(raw_items, list):
        return []

    normalized: list[dict[str, Any]] = []
    for item in raw_items:
        text = ""
        children_raw: Any = []

        if isinstance(item, str):
            text = item
        elif isinstance(item, dict):
            text = (
                item.get("text")
                or item.get("title")
                or item.get("label")
                or item.get("name")
                or ""
            )
            for key in ("children", "items", "nodes", "subtopics"):
                if isinstance(item.get(key), list):
                    children_raw = item.get(key)
                    break
        else:
            continue

        cleaned_text = _clean_mind_map_label(text)
        if not cleaned_text:
            continue

        normalized.append(
            {
                "text": cleaned_text,
                "children": _normalize_mind_map_outline(children_raw, depth + 1),
            }
        )

        if len(normalized) >= (6 if depth == 0 else 4):
            break

    return normalized


def _strip_mermaid_markup(line: str) -> str:
    cleaned = line.strip()
    cleaned = re.sub(r"^[A-Za-z0-9_]+\(\((.*)\)\)$", r"\1", cleaned)
    cleaned = re.sub(r"^[A-Za-z0-9_]+\[(.*)\]$", r"\1", cleaned)
    cleaned = re.sub(r"^[A-Za-z0-9_]+\{(.*)\}$", r"\1", cleaned)
    cleaned = re.sub(r"^[A-Za-z0-9_]+$", "", cleaned) or cleaned
    return _clean_mind_map_label(cleaned)


def _outline_from_mermaid_text(raw_mermaid: str) -> list[dict[str, Any]]:
    cleaned = re.sub(r"(?i)^mermaid(?: version [^\n]+)?\n?", "", raw_mermaid or "").strip()
    cleaned = re.sub(r"(?i)^```(mermaid)?\n?", "", cleaned).strip()
    cleaned = re.sub(r"\n?```$", "", cleaned).strip()
    lines = [line.rstrip() for line in cleaned.splitlines() if line.strip()]
    if lines and lines[0].strip().lower() == "mindmap":
        lines = lines[1:]

    root: list[dict[str, Any]] = []
    stack: list[tuple[int, dict[str, Any]]] = []

    for raw_line in lines:
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        level = max(indent // 2, 0)
        label = _strip_mermaid_markup(raw_line)
        if not label:
            continue

        node = {"text": label, "children": []}
        while stack and stack[-1][0] >= level:
            stack.pop()

        if not stack:
            root.append(node)
        else:
            stack[-1][1]["children"].append(node)
        stack.append((level, node))

    if root and root[0]["text"].lower() in {"root", "mindmap"}:
        root = root[0]["children"]

    return _normalize_mind_map_outline(root)


def _fallback_outline_from_context(session_doc: dict[str, Any]) -> list[dict[str, Any]]:
    source = (
        session_doc.get("summary")
        or session_doc.get("notes")
        or session_doc.get("corrected_transcript")
        or session_doc.get("transcript")
        or ""
    )
    nodes: list[dict[str, Any]] = []
    for sentence in transcript_to_sentences(source)[:5]:
        cleaned = _clean_mind_map_label(sentence)
        if cleaned:
            nodes.append({"text": cleaned, "children": []})
    return nodes


def _build_mermaid_mind_map(title: str, outline: list[dict[str, Any]]) -> str:
    root_title = _clean_mind_map_label(title) or "Mind Map"
    lines = ["mindmap", f"  root(({root_title}))"]

    def append_nodes(nodes: list[dict[str, Any]], depth: int) -> None:
        indent = "  " * (depth + 1)
        for node in nodes:
            label = _clean_mind_map_label(node.get("text"))
            if not label:
                continue
            lines.append(f"{indent}{label}")
            children = node.get("children")
            if isinstance(children, list) and children:
                append_nodes(children, depth + 1)

    append_nodes(outline, 1)
    return "\n".join(lines)


async def generate_mind_map(session_doc: dict[str, Any]) -> dict[str, Any]:
    fallback_title = _clean_mind_map_label(session_doc.get("title", "Mind Map")) or "Mind Map"
    fallback_outline = _fallback_outline_from_context(session_doc)
    fallback = {
        "title": fallback_title,
        "mermaid": _build_mermaid_mind_map(fallback_title, fallback_outline),
        "outline": fallback_outline,
    }
    system = (
        "You create high-quality study mind maps from transcripts. "
        "Return valid JSON only with keys title, mermaid, outline. "
        "outline must be an array of 4 to 7 main topic objects with keys text and children. "
        "children must be short supporting points, with a maximum depth of 3 total levels. "
        "The mermaid value must be a valid Mermaid mindmap block without code fences."
    )
    prompt = (
        "Create a study mind map from this transcript context.\n"
        "Use short, meaningful branch labels. Avoid dumping full paragraphs into nodes.\n"
        "Keep the structure clean and hierarchical with a small number of strong branches.\n\n"
        f"{build_transcript_context(session_doc)}"
    )
    data = await _generate_json(prompt, system, fallback)
    if not isinstance(data, dict):
        return fallback

    title = _clean_mind_map_label(data.get("title") or fallback_title) or fallback_title
    outline = _normalize_mind_map_outline(data.get("outline"))
    if not outline:
        outline = _outline_from_mermaid_text(str(data.get("mermaid") or ""))
    if not outline:
        outline = fallback_outline

    return {
        "title": title,
        "outline": outline,
        "mermaid": _build_mermaid_mind_map(title, outline),
    }


async def generate_rich_notes(session_doc: dict[str, Any]) -> str:
    fallback = "Could not generate rich notes."
    if not has_llm_access():
        return fallback

    transcript = session_doc.get("filtered_transcript") or session_doc.get("corrected_transcript") or session_doc.get("transcript") or ""
    if not transcript:
        return fallback

    system = (
        "You create highly detailed 'Rich Notes' from a given transcript. "
        "Your notes MUST include rich formatting such as Markdown tables, equations (using $$), "
        "and Mermaid.js diagrams (using ```mermaid blocks) to explain concepts visually. "
        "Extract all examples, equations, and technical specifics strictly from the provided text. "
        "Return ONLY the raw markdown content. Do not use JSON. "
        "Format cleanly with Headings and Bullet Points."
    )
    prompt = f"Transcript Context:\n\n{transcript}\n\nGenerate Rich Notes now:"
    
    raw = await call_groq(prompt, system, max_tokens=3000)
    if not raw:
        return fallback
    
    cleaned = raw.strip()
    if cleaned.startswith("```markdown"):
        cleaned = cleaned[11:].strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
    elif cleaned.startswith("```\n") and cleaned.endswith("```"):
        cleaned = cleaned[4:-3].strip()
            
    return cleaned


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


# ── NEW FEATURES: Action Items, OCR, Search, Folder Organization ──


async def extract_action_items(session_doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract action items and tasks from session transcript."""
    fallback: list[dict[str, Any]] = []
    if not has_llm_access():
        return fallback

    system = (
        "Extract action items, tasks, and assignments from the transcript. "
        "Return valid JSON only: an array of 5 to 15 objects with keys: "
        "action (task description), owner (person responsible if mentioned), "
        "due_date (if mentioned), priority (high/medium/low), status (open)"
    )
    prompt = (
        "Extract all action items and tasks from this meeting transcript.\n\n"
        f"{build_transcript_context(session_doc)}"
    )
    data = await _generate_json(prompt, system, fallback)
    return data if isinstance(data, list) else fallback


async def process_ocr_from_image(image_base64: str, file_type: str = "image/png") -> dict[str, Any]:
    """Process OCR from uploaded image or handwritten notes.

    Strategy (in order):
    1. Groq Vision API  – best for handwritten text, uses existing API key
    2. Tesseract         – fast, system-installed
    3. EasyOCR           – Python-only fallback
    """

    # ── 1. Groq Vision (primary — best for handwritten notes) ────────────────
    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key and groq_key != "YOUR_GROQ_API_KEY_HERE":
        try:
            text = await call_groq_vision(image_base64, file_type)
            if text and text.strip():
                # Preserve structure: collapse only runs of spaces (not newlines)
                cleaned = re.sub(r"[^\S\n]+", " ", text).strip()
                # Collapse 3+ blank lines into 2
                cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
                return {
                    "success": True,
                    "text": cleaned,
                    "confidence": "high",
                    "file_type": file_type,
                    "character_count": len(cleaned),
                    "method": "groq_vision",
                }
        except Exception as e:
            print(f"  [OCR] ⚠️ Groq Vision failed, trying fallbacks: {e}")

    # ── 2. Tesseract (system-installed) ──────────────────────────────────────
    try:
        import base64 as b64
        import io
        from PIL import Image

        image_data = b64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))

        try:
            import pytesseract
            text = pytesseract.image_to_string(image, lang="eng")
            if text and text.strip():
                cleaned = re.sub(r"[^\S\n]+", " ", text).strip()
                cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
                return {
                    "success": True,
                    "text": cleaned,
                    "confidence": "medium",
                    "file_type": file_type,
                    "character_count": len(cleaned),
                    "method": "tesseract",
                }
        except (ImportError, Exception) as e:
            print(f"  [OCR] ⚠️ Tesseract unavailable: {str(e)[:100]}")

        # ── 3. EasyOCR (Python-only fallback) ────────────────────────────────
        try:
            import easyocr
            import numpy as np

            reader = easyocr.Reader(["en"], gpu=False)
            img_array = np.array(image)
            result = reader.readtext(img_array, detail=0)
            text = "\n".join(result) if result else ""
            if text and text.strip():
                cleaned = re.sub(r"[^\S\n]+", " ", text).strip()
                return {
                    "success": True,
                    "text": cleaned,
                    "confidence": "medium",
                    "file_type": file_type,
                    "character_count": len(cleaned),
                    "method": "easyocr",
                }
        except ImportError:
            print("  [OCR] ⚠️ EasyOCR not installed")
        except Exception as e:
            print(f"  [OCR] ⚠️ EasyOCR error: {str(e)[:100]}")

    except ImportError:
        print("  [OCR] ⚠️ Pillow not installed — skipping Tesseract/EasyOCR fallbacks")
    except Exception as e:
        print(f"  [OCR] ❌ Image decode error: {e}")

    # ── All methods failed ───────────────────────────────────────────────────
    return {
        "success": False,
        "error": (
            "OCR failed. Set GROQ_API_KEY in .env (recommended) "
            "or install Tesseract/EasyOCR as fallback."
        ),
        "text": "",
        "setup_guide": {
            "recommended": "Set GROQ_API_KEY in your .env file (free at console.groq.com)",
            "option1": "Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki",
            "option2": "pip install easyocr (100MB download on first use)",
        },
    }



def search_sessions_by_keyword(sessions: list[dict[str, Any]], keyword: str) -> list[dict[str, Any]]:
    """Search sessions by keyword across multiple fields."""
    if not keyword or not keyword.strip():
        return sessions
    
    query = keyword.lower().strip()
    results = []
    
    for session in sessions:
        # Search across multiple fields
        searchable_fields = [
            session.get("title", ""),
            session.get("transcript", ""),
            session.get("corrected_transcript", ""),
            session.get("filtered_transcript", ""),
            session.get("summary", ""),
            session.get("notes", ""),
        ]
        
        # Check if keyword appears in any field
        if any(query in field.lower() for field in searchable_fields if isinstance(field, str)):
            results.append(session)
    
    return results


def suggest_folder_for_session(session_doc: dict[str, Any], existing_folders: list[str]) -> str:
    """Suggest a folder for session based on content."""
    title = (session_doc.get("title") or "").lower()
    transcript = (session_doc.get("transcript") or "").lower()[:500]
    notes = (session_doc.get("notes") or "").lower()
    
    # Simple heuristic-based suggestions
    content = f"{title} {transcript} {notes}"
    
    if any(word in content for word in ["meeting", "standup", "sync", "sync-up"]):
        return "meetings"
    elif any(word in content for word in ["review", "code review", "pr", "pull request"]):
        return "code-reviews"
    elif any(word in content for word in ["training", "onboarding", "learn", "tutorial"]):
        return "training"
    elif any(word in content for word in ["brainstorm", "idea", "planning", "sprint"]):
        return "planning"
    elif any(word in content for word in ["client", "customer", "stakeholder", "presentation"]):
        return "client"
    
    return "general"


async def generate_translation(session_doc: dict[str, Any], target_lang: str) -> str:
    if target_lang == "same":
        return session_doc.get("corrected_transcript") or session_doc.get("transcript") or ""
    text = session_doc.get("corrected_transcript") or session_doc.get("filtered_transcript") or session_doc.get("transcript") or ""
    return await translate_transcript(text, target_lang)
