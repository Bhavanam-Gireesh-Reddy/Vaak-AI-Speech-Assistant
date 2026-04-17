"use client";

import {
  Copy,
  Download,
  Headphones,
  Mic,
  MicOff,
  Square,
  Upload,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ── Style tokens ───────────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const SUBCARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
};

const GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 20%, #a78bfa 60%, #00d4ff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.85)",
  colorScheme: "dark",
};

const SELECT_STYLE: React.CSSProperties = {
  background: "rgba(20,20,30,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.85)",
  colorScheme: "dark",
};

/* ── Types ─────────────────────────────────────────────────────── */
type StatusState = "idle" | "connecting" | "ready" | "speaking" | "processing" | "recording" | "error";

type TranscriptEntry = {
  time: string;
  text: string;
  ts_ms: number;
  keywords?: string[];
};

type SpeakerTurn = { speaker: string; text: string };

type SentimentItem = { label?: string; score?: number; text?: string };

type WsMessage =
  | { type: "ready"; message: string; db?: string; session_id?: string }
  | { type: "speech_start" }
  | { type: "speech_end" }
  | { type: "transcript"; text: string; keywords?: string[] }
  | { type: "partial"; text: string }
  | { type: "summary"; text: string }
  | { type: "processing"; message?: string }
  | { type: "session_analysis"; summary?: string; filtered_transcript?: string; corrected_transcript?: string; title?: string; speakers?: SpeakerTurn[] }
  | { type: "saved"; message?: string }
  | { type: "keywords"; sentence: string; keywords?: string[] }
  | { type: "sentiment"; sentiment?: SentimentItem }
  | { type: "error"; message: string };

const STORAGE_KEY = "sarvam_session";

const SPEAKER_COLORS = [
  { bg: "rgba(0,212,255,0.12)", border: "rgba(0,212,255,0.35)", text: "#00d4ff" },
  { bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.35)", text: "#a78bfa" },
  { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.35)", text: "#34d399" },
  { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)", text: "#fbbf24" },
];

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function msToSRT(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(mil).padStart(3, "0")}`;
}

/* ── Component ─────────────────────────────────────────────────── */
export function LivePage() {
  /* ── Settings ── */
  const [mode, setMode] = useState("translate");
  const [srcLang, setSrcLang] = useState("hi-IN");
  const [targetLang, setTargetLang] = useState("same");
  const [vocab, setVocab] = useState("");

  /* ── Status ── */
  const [status, setStatus] = useState<StatusState>("idle");
  const [statusLabel, setStatusLabel] = useState("Idle");
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  /* ── Transcript entries ── */
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [partial, setPartial] = useState<string>("");

  /* ── Stats ── */
  const [segCount, setSegCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [duration, setDuration] = useState("0s");

  /* ── Panels ── */
  const [liveSummary, setLiveSummary] = useState<{ text: string; meta: string } | null>(null);
  const [aiSummary, setAiSummary] = useState<{ text: string; meta: string } | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerTurn[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState({ tag: "NEUTRAL", avg: "0.00", counts: "0 / 0 / 0", meta: "Waiting for speech" });
  const [translationOutput, setTranslationOutput] = useState<{ text: string; lang: string } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  /* ── Upload ── */
  const [uploadProgress, setUploadProgress] = useState<{ name: string; pct: number } | null>(null);

  /* ── Volume ── */
  const [volPct, setVolPct] = useState(0);

  /* ── Toast ── */
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  /* ── Scroll indicator ── */
  const [userScrolled, setUserScrolled] = useState(false);

  /* ── Refs ── */
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveAnimRef = useRef<number | null>(null);
  const sentimentHistoryRef = useRef<SentimentItem[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const selectedTargetLangRef = useRef("same");
  const filteredTranscriptRef = useRef<string | null>(null);
  const correctedTranscriptRef = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entriesRef = useRef<TranscriptEntry[]>([]);

  /* keep entriesRef in sync with state for callbacks */
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  /* ── Toast helper ── */
  const showToast = useCallback((msg: string, type = "") => {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Status helper ── */
  const applyStatus = useCallback((s: StatusState, label: string) => {
    setStatus(s);
    setStatusLabel(label);
  }, []);

  /* ── Smart scroll ── */
  const smartScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el && !userScrolled) el.scrollTop = el.scrollHeight;
  }, [userScrolled]);

  /* ── Waveform canvas ── */
  const startWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufLen = analyser.frequencyBinCount;
    const wavData = new Uint8Array(bufLen);
    function draw() {
      waveAnimRef.current = requestAnimationFrame(draw);
      analyser!.getByteTimeDomainData(wavData);
      const W = canvas!.width, H = canvas!.height;
      ctx!.clearRect(0, 0, W, H);
      const grad = ctx!.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#7c3aed");
      grad.addColorStop(0.5, "#00d4ff");
      grad.addColorStop(1, "#22c55e");
      ctx!.lineWidth = 2;
      ctx!.strokeStyle = grad;
      ctx!.shadowColor = "#00d4ff";
      ctx!.shadowBlur = 8;
      ctx!.beginPath();
      const sliceW = W / bufLen; let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const y = (wavData[i] / 128.0 * H) / 2;
        i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
        x += sliceW;
      }
      ctx!.lineTo(W, H / 2);
      ctx!.stroke();
    }
    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (waveAnimRef.current) { cancelAnimationFrame(waveAnimRef.current); waveAnimRef.current = null; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(0,212,255,0.12)";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }, []);

  /* ── Session persistence ── */
  const saveToStorage = useCallback(() => {
    try {
      const payload = {
        transcriptLog: entriesRef.current,
        segmentCount: entriesRef.current.length,
        wordCount: entriesRef.current.reduce((a, e) => a + e.text.trim().split(/\s+/).length, 0),
        filteredTranscript: filteredTranscriptRef.current,
        correctedTranscript: correctedTranscriptRef.current,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }
  }, []);

  /* ── Generate translated output ── */
  const generateTranslation = useCallback(async (sessionId: string, tLang: string) => {
    setTranslationOutput({ text: "Generating translated output…", lang: tLang.toUpperCase() });
    try {
      const res = await fetch(`/api/sessions/${sessionId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_lang: tLang }),
      });
      const data = await res.json() as { translated?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Translation failed");
      setTranslationOutput({ text: data.translated ?? "", lang: `${tLang.toUpperCase()} output ready` });
    } catch (e) {
      setTranslationOutput({ text: e instanceof Error ? e.message : "Translation error", lang: tLang.toUpperCase() });
    }
  }, []);

  /* ── WebSocket message handler ── */
  const handleMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "ready":
        applyStatus("ready", "Ready");
        setDbConnected(msg.db === "connected");
        if (msg.session_id) sessionIdRef.current = msg.session_id;
        showToast("✓ " + msg.message, "ok");
        break;
      case "speech_start":
        applyStatus("speaking", "Speaking…");
        break;
      case "speech_end":
        applyStatus("ready", "Ready");
        break;
      case "transcript": {
        setPartial("");
        const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
        const entry: TranscriptEntry = { time: now, text: msg.text, ts_ms: Date.now(), keywords: msg.keywords };
        setEntries((prev) => [...prev, entry]);
        setSegCount((c) => c + 1);
        setWordCount((c) => c + msg.text.trim().split(/\s+/).length);
        setTimeout(smartScroll, 50);
        saveToStorage();
        break;
      }
      case "partial":
        setPartial(msg.text);
        setTimeout(smartScroll, 50);
        break;
      case "summary":
        setLiveSummary({ text: msg.text, meta: "Updated at " + new Date().toLocaleTimeString("en-IN", { hour12: false }) });
        break;
      case "processing":
        setProcessing(msg.message ?? "Analysing transcript with AI…");
        break;
      case "session_analysis":
        setProcessing(null);
        if (msg.summary?.trim()) {
          setAiSummary({ text: msg.summary, meta: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) });
        }
        if (msg.filtered_transcript) filteredTranscriptRef.current = msg.filtered_transcript;
        if (msg.corrected_transcript) correctedTranscriptRef.current = msg.corrected_transcript;
        if (msg.title?.trim()) setSessionTitle(msg.title);
        if (msg.speakers?.length) setSpeakers(msg.speakers);
        saveToStorage();
        showToast("✓ AI analysis complete", "ok");
        break;
      case "saved":
        applyStatus("idle", "Idle");
        if (sessionIdRef.current && selectedTargetLangRef.current !== "same") {
          void generateTranslation(sessionIdRef.current, selectedTargetLangRef.current);
        }
        showToast(msg.message ?? "✓ Saved", "ok");
        break;
      case "sentiment": {
        const s = msg.sentiment ?? {};
        sentimentHistoryRef.current.push(s);
        const counts = { positive: 0, neutral: 0, negative: 0 };
        let total = 0;
        sentimentHistoryRef.current.forEach((item) => {
          const lbl = (item.label ?? "neutral") as keyof typeof counts;
          counts[lbl] = (counts[lbl] ?? 0) + 1;
          total += Number(item.score ?? 0);
        });
        const avg = sentimentHistoryRef.current.length ? total / sentimentHistoryRef.current.length : 0;
        setSentiment({
          tag: (s.label ?? "neutral").toUpperCase(),
          avg: avg.toFixed(2),
          counts: `${counts.positive} / ${counts.neutral} / ${counts.negative}`,
          meta: s.text ? `Latest: ${s.text.slice(0, 64)}${s.text.length > 64 ? "…" : ""}` : "Updated",
        });
        break;
      }
      case "error":
        showToast("❌ " + msg.message, "error");
        applyStatus("error", "Error");
        void stopTranslation();
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyStatus, showToast, smartScroll, saveToStorage, generateTranslation]);

  /* ── Stop translation ── */
  async function stopTranslation() {
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (audioCtxRef.current) { await audioCtxRef.current.close(); audioCtxRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
    stopWaveform();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "stop" }));
    } else {
      wsRef.current = null;
    }
    if (durationIntervalRef.current) { clearInterval(durationIntervalRef.current); durationIntervalRef.current = null; }
    applyStatus("processing", "Processing…");
    setVolPct(0);
  }

  /* ── Start translation ── */
  async function startTranslation() {
    selectedTargetLangRef.current = targetLang;
    sentimentHistoryRef.current = [];
    setLiveSummary(null);
    setAiSummary(null);
    setSpeakers([]);
    setProcessing(null);
    setTranslationOutput(null);
    setSessionTitle(null);
    filteredTranscriptRef.current = null;
    correctedTranscriptRef.current = null;
    applyStatus("connecting", "Connecting…");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      showToast("⚠️ Microphone access denied: " + (e instanceof Error ? e.message : ""), "error");
      applyStatus("error", "Mic denied");
      return;
    }
    mediaStreamRef.current = stream;

    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProto}//${window.location.host}/ws/translate`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ mode, language: srcLang, target_lang: targetLang, custom_vocabulary: vocab }));
    };
    ws.onmessage = (ev) => handleMessage(JSON.parse(ev.data as string) as WsMessage);
    ws.onerror = () => {
      showToast("WebSocket error — is the server running?", "error");
      applyStatus("error", "WS Error");
      void stopTranslation();
    };
    ws.onclose = () => {
      wsRef.current = null;
      applyStatus("idle", "Idle");
    };

    const ac = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = ac;
    const source = ac.createMediaStreamSource(stream);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    source.connect(analyser);
    startWaveform();

    const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() { super(); this._buf = []; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) this._buf.push(ch[i]);
    if (this._buf.length >= 4096) {
      this.port.postMessage(new Float32Array(this._buf.splice(0, 4096)));
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;
    const blob = new Blob([workletCode], { type: "application/javascript" });
    const workletUrl = URL.createObjectURL(blob);
    await ac.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    const proc = new AudioWorkletNode(ac, "pcm-processor");
    processorRef.current = proc;
    analyser.connect(proc);
    proc.connect(ac.destination);

    proc.port.onmessage = (e) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      const f32 = e.data as Float32Array;
      wsRef.current.send(float32ToInt16(f32).buffer);
      let sum = 0;
      for (let i = 0; i < f32.length; i++) sum += f32[i] * f32[i];
      setVolPct(Math.min(100, Math.sqrt(sum / f32.length) * 400));
    };

    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const s = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const m = Math.floor(s / 60);
      setDuration(m > 0 ? `${m}m ${s % 60}s` : `${s}s`);
    }, 1000);
  }

  /* ── Audio file upload ── */
  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (wsRef.current) { showToast("Stop current session first", ""); return; }
    setUploadProgress({ name: file.name, pct: 0 });
    setEntries([]);
    filteredTranscriptRef.current = null;
    correctedTranscriptRef.current = null;
    applyStatus("connecting", "Processing file…");

    try {
      const arrayBuf = await file.arrayBuffer();
      const decoded = await new AudioContext().decodeAudioData(arrayBuf);
      const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
      const src = offline.createBufferSource();
      src.buffer = decoded; src.connect(offline.destination); src.start();
      const resampled = await offline.startRendering();
      const pcmData = resampled.getChannelData(0);

      const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${wsProto}://${window.location.host}/ws/translate`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = async () => {
        applyStatus("recording", "Transcribing file…");
        ws.send(JSON.stringify({ action: "start", language: srcLang, mode, target_lang: targetLang, custom_vocabulary: vocab }));
        const CHUNK = 8000, total = pcmData.length;
        for (let i = 0; i < total; i += CHUNK) {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) break;
          const slice = pcmData.slice(i, i + CHUNK);
          const int16 = new Int16Array(slice.length);
          for (let j = 0; j < slice.length; j++) {
            int16[j] = Math.max(-32768, Math.min(32767, Math.round(slice[j] * 32767)));
          }
          ws.send(int16.buffer);
          const pct = Math.round(((i + CHUNK) / total) * 100);
          setUploadProgress({ name: file.name, pct: Math.min(pct, 95) });
          await new Promise((r) => setTimeout(r, 20));
        }
        if (wsRef.current?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "stop" }));
        setUploadProgress({ name: file.name, pct: 100 });
      };
      ws.onmessage = (ev) => handleMessage(JSON.parse(ev.data as string) as WsMessage);
      ws.onerror = () => { showToast("Upload failed", ""); setTimeout(() => setUploadProgress(null), 1500); };
      ws.onclose = () => { applyStatus("idle", "Idle"); setTimeout(() => setUploadProgress(null), 1500); };
    } catch (err) {
      showToast("Could not decode audio: " + (err instanceof Error ? err.message : ""), "error");
      applyStatus("idle", "Idle");
      setTimeout(() => setUploadProgress(null), 1500);
    }
    e.target.value = "";
  }

  /* ── Restore session from localStorage on mount ── */
  useEffect(() => {
    stopWaveform();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as {
        transcriptLog?: TranscriptEntry[];
        segmentCount?: number;
        wordCount?: number;
        filteredTranscript?: string | null;
        correctedTranscript?: string | null;
        savedAt?: number;
      };
      if (!payload.transcriptLog?.length) return;
      setEntries(payload.transcriptLog);
      setSegCount(payload.segmentCount ?? payload.transcriptLog.length);
      setWordCount(payload.wordCount ?? 0);
      filteredTranscriptRef.current = payload.filteredTranscript ?? null;
      correctedTranscriptRef.current = payload.correctedTranscript ?? null;
      const ageMin = Math.round((Date.now() - (payload.savedAt ?? 0)) / 60000);
      const ageStr = ageMin < 1 ? "just now" : ageMin < 60 ? `${ageMin}m ago` : `${Math.round(ageMin / 60)}h ago`;
      showToast(`✓ Session restored (${ageStr})`, "ok");
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Scroll listener ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setUserScrolled(dist > 80);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  /* ── Copy transcript ── */
  function copyTranscript() {
    if (!entries.length) { showToast("Nothing to copy yet", ""); return; }
    const sentences = entries.map((e) => e.text.trim());
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 5) paragraphs.push(sentences.slice(i, i + 5).join(" "));
    void navigator.clipboard.writeText(paragraphs.join("\n\n")).then(() => showToast("✓ Copied!", "ok"));
  }

  /* ── Export functions ── */
  function exportTXT() {
    if (!entries.length) { showToast("Nothing to export yet", ""); return; }
    const sentences = entries.map((e) => e.text.trim());
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 5) paragraphs.push(sentences.slice(i, i + 5).join(" "));
    const body = (filteredTranscriptRef.current?.trim() || paragraphs.join("\n\n"));
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✓ Downloaded transcript.txt", "ok");
  }

  function exportSRT() {
    if (!entries.length) { showToast("Nothing to export yet", ""); return; }
    const start = entries[0].ts_ms;
    let srt = "";
    entries.forEach((entry, i) => {
      const startMs = entry.ts_ms - start;
      const endMs = startMs + Math.max(2000, entry.text.split(" ").length * 400);
      srt += `${i + 1}\n${msToSRT(startMs)} --> ${msToSRT(endMs)}\n${entry.text}\n\n`;
    });
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.srt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✓ Downloaded transcript.srt", "ok");
  }

  function clearTranscript() {
    if (!confirm("Clear the current transcript? This cannot be undone.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    filteredTranscriptRef.current = null; correctedTranscriptRef.current = null;
    setEntries([]); setPartial(""); setSegCount(0); setWordCount(0); setDuration("0s");
    setLiveSummary(null); setAiSummary(null); setSpeakers([]); setProcessing(null);
    setTranslationOutput(null); setSessionTitle(null);
    showToast("✓ Transcript cleared", "ok");
  }

  /* ── Derived ── */
  const isRecording = status === "ready" || status === "speaking" || status === "recording";
  const canStart = status === "idle" || status === "error";
  const canStop = isRecording || status === "connecting";

  const statusColor: Record<StatusState, string> = {
    idle: "rgba(255,255,255,0.25)",
    connecting: "#fbbf24",
    ready: "#34d399",
    speaking: "#00d4ff",
    processing: "#a78bfa",
    recording: "#00d4ff",
    error: "#f87171",
  };

  const uniqueSpeakers = [...new Set(speakers.map((s) => s.speaker))];
  const speakerColorMap: Record<string, typeof SPEAKER_COLORS[0]> = {};
  uniqueSpeakers.forEach((sp, i) => { speakerColorMap[sp] = SPEAKER_COLORS[i % SPEAKER_COLORS.length]; });

  const sentimentColor = status === "speaking"
    ? { POSITIVE: "#34d399", NEUTRAL: "rgba(255,255,255,0.45)", NEGATIVE: "#f87171" }[sentiment.tag] ?? "rgba(255,255,255,0.45)"
    : "rgba(255,255,255,0.35)";

  /* ── Keyboard shortcut (Enter to toggle) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat) {
        if (canStart) void startTranslation();
        else if (canStop) void stopTranslation();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStart, canStop, mode, srcLang, targetLang, vocab]);

  return (
    <div className="grid gap-6 md:gap-8">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl transition-all"
          style={{
            background: toast.type === "ok" ? "rgba(52,211,153,0.15)" : toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
            border: toast.type === "ok" ? "1px solid rgba(52,211,153,0.3)" : toast.type === "error" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.12)",
            color: toast.type === "ok" ? "#34d399" : toast.type === "error" ? "#fca5a5" : "rgba(255,255,255,0.8)",
            backdropFilter: "blur(20px)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Page hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 md:p-10"
        style={{
          ...CARD,
          border: "1px solid rgba(0,212,255,0.18)",
          boxShadow: "0 0 60px rgba(0,212,255,0.07), 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at top left, rgba(0,212,255,0.1) 0%, transparent 55%)" }} />
        <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48" style={{ background: "radial-gradient(circle at bottom right, rgba(124,58,237,0.08) 0%, transparent 60%)" }} />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)", color: "#00d4ff" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: isRecording ? "#00d4ff" : "rgba(255,255,255,0.35)", boxShadow: isRecording ? "0 0 8px #00d4ff" : "none", animation: isRecording ? "pulse 1s infinite" : "none" }}
              />
              Live · Real-time Transcription
            </div>
            <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight" style={GRADIENT_TEXT}>
              Live transcription
              <br />workspace
            </h2>
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
              Real-time speech-to-text with AI post-processing — supports multilingual translation,
              sentiment analysis, speaker diarization, and audio file upload.
            </p>
          </div>

          {/* Status indicator */}
          <div
            className="flex shrink-0 items-center gap-3 rounded-2xl px-5 py-3"
            style={{ ...SUBCARD }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full transition-all duration-300"
              style={{ background: statusColor[status], boxShadow: `0 0 8px ${statusColor[status]}` }}
            />
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
              {statusLabel}
            </span>
            {dbConnected !== null && (
              <span
                className="text-[10px] font-bold rounded-full px-2 py-0.5"
                style={dbConnected
                  ? { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }
                  : { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }
                }
              >
                DB {dbConnected ? "●" : "○"}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Controls bar ── */}
      <section className="relative overflow-hidden rounded-3xl p-5 md:p-6" style={CARD}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Mode</label>
            <select
              className="h-10 rounded-xl px-3 text-sm font-medium outline-none transition"
              onChange={(e) => setMode(e.target.value)}
              style={SELECT_STYLE}
              value={mode}
            >
              <option value="translate">Translate → English</option>
              <option value="transcribe">Transcribe (same lang)</option>
              <option value="codemix">Code-Mix</option>
              <option value="verbatim">Verbatim</option>
            </select>
          </div>

          <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Source language */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Source Language</label>
            <select
              className="h-10 rounded-xl px-3 text-sm font-medium outline-none transition"
              onChange={(e) => setSrcLang(e.target.value)}
              style={SELECT_STYLE}
              value={srcLang}
            >
              <option value="hi-IN">Hindi</option>
              <option value="en-IN">English (Indian)</option>
              <option value="ta-IN">Tamil</option>
              <option value="te-IN">Telugu</option>
              <option value="kn-IN">Kannada</option>
              <option value="ml-IN">Malayalam</option>
              <option value="bn-IN">Bengali</option>
              <option value="mr-IN">Marathi</option>
              <option value="gu-IN">Gujarati</option>
              <option value="pa-IN">Punjabi</option>
              <option value="or-IN">Odia</option>
            </select>
          </div>

          <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Target output */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Target Output</label>
            <select
              className="h-10 rounded-xl px-3 text-sm font-medium outline-none transition"
              onChange={(e) => setTargetLang(e.target.value)}
              style={SELECT_STYLE}
              value={targetLang}
            >
              <option value="same">Original Language</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
              <option value="bn">Bengali</option>
              <option value="mr">Marathi</option>
              <option value="gu">Gujarati</option>
              <option value="pa">Punjabi</option>
              <option value="or">Odia</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="ar">Arabic</option>
            </select>
          </div>

          <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Action buttons */}
          <div className="flex items-end gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canStart}
              onClick={() => void startTranslation()}
              style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)", color: "#fff", boxShadow: canStart ? "0 0 20px rgba(124,58,237,0.4)" : "none" }}
              type="button"
            >
              <Mic className="h-3.5 w-3.5" />
              Start
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canStop}
              onClick={() => void stopTranslation()}
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
              type="button"
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </button>
            <label
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
              <input ref={fileInputRef} accept="audio/*" className="hidden" onChange={(e) => void handleAudioUpload(e)} type="file" />
            </label>
          </div>

          {/* Volume meter */}
          <div
            className="ml-auto hidden h-2 w-24 overflow-hidden rounded-full sm:block"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{ width: `${volPct}%`, background: "linear-gradient(90deg,#7c3aed,#00d4ff)" }}
            />
          </div>
        </div>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          className="mt-4 w-full rounded-xl"
          height={48}
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          width={800}
        />

        {/* Upload progress */}
        {uploadProgress && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>{uploadProgress.name}</span>
              <span>{uploadProgress.pct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${uploadProgress.pct}%`, background: "linear-gradient(90deg,#f59e0b,#00d4ff)" }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Config grid: Vocab + Sentiment ── */}
      <section className="grid gap-5 md:grid-cols-2">
        {/* Custom vocabulary */}
        <div className="relative overflow-hidden rounded-3xl p-5" style={CARD}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
            🧩 Custom Vocabulary <span className="ml-2 font-normal" style={{ color: "rgba(255,255,255,0.3)" }}>optional</span>
          </p>
          <textarea
            className="mt-2 min-h-[120px] w-full resize-y rounded-2xl px-4 py-3 font-mono text-xs outline-none transition placeholder:text-white/20"
            onChange={(e) => setVocab(e.target.value)}
            placeholder={"Example:\nGPU\nlang chain=LangChain\ngrok → Groq"}
            style={INPUT_STYLE}
            value={vocab}
          />
          <p className="mt-2 text-[10px] leading-5" style={{ color: "rgba(255,255,255,0.3)" }}>
            Enter one term per line. Use `spoken=canonical` or `spoken → canonical` to normalize technical words.
          </p>
        </div>

        {/* Real-time sentiment */}
        <div className="relative overflow-hidden rounded-3xl p-5" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f87171" }}>
              💓 Real-Time Sentiment
            </p>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{sentiment.meta}</span>
          </div>
          {[
            { label: "Current tone", value: sentiment.tag, color: sentimentColor },
            { label: "Average score", value: sentiment.avg, color: "rgba(255,255,255,0.7)" },
            { label: "Positive / Neutral / Negative", value: sentiment.counts, color: "rgba(255,255,255,0.6)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live summary panel ── */}
      {liveSummary && (
        <div className="relative overflow-hidden rounded-3xl p-5" style={{ ...CARD, border: "1px solid rgba(0,212,255,0.12)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00d4ff" }}>⚡ Live Summary</p>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{liveSummary.meta}</span>
          </div>
          <p className="text-sm leading-7" style={{ color: "rgba(255,255,255,0.65)" }}>{liveSummary.text}</p>
        </div>
      )}

      {/* ── Processing bar ── */}
      {processing && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
          <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "#a78bfa", borderTopColor: "transparent" }} />
          <span className="text-sm font-medium" style={{ color: "#c4b5fd" }}>{processing}</span>
        </div>
      )}

      {/* ── Session title ── */}
      {sessionTitle && (
        <div className="rounded-2xl px-5 py-3" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
          <span className="text-sm font-semibold" style={{ color: "#00d4ff" }}>📌 {sessionTitle}</span>
        </div>
      )}

      {/* ── AI Summary result ── */}
      {aiSummary && (
        <div className="relative overflow-hidden rounded-3xl p-5" style={{ ...CARD, border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>📝 AI Summary</p>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{aiSummary.meta}</span>
          </div>
          <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.65)" }}>{aiSummary.text}</p>
        </div>
      )}

      {/* ── Speakers panel ── */}
      {speakers.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl p-5" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#34d399" }}>🎤 Speakers Detected</p>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{uniqueSpeakers.length} speaker{uniqueSpeakers.length !== 1 ? "s" : ""} detected</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {speakers.map((turn, i) => {
              const c = speakerColorMap[turn.speaker] ?? SPEAKER_COLORS[0];
              return (
                <div key={i} className="flex items-start gap-3 flex-wrap">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold shrink-0"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                  >
                    {turn.speaker}
                  </span>
                  <span className="text-sm leading-6 pt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{turn.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Translation output ── */}
      {translationOutput && (
        <div className="relative overflow-hidden rounded-3xl p-5" style={{ ...CARD, border: "1px solid rgba(251,191,36,0.12)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#fbbf24" }}>🌐 Multi-Language Output</p>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{translationOutput.lang}</span>
          </div>
          <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.65)" }}>{translationOutput.text}</p>
        </div>
      )}

      {/* ── Transcript area ── */}
      <section className="relative overflow-hidden rounded-3xl" style={CARD}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            {/* Waveform indicator */}
            <div className="flex items-center gap-0.5 h-4">
              {[4, 8, 12, 8, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full transition-all duration-150"
                  style={{
                    height: isRecording && status === "speaking" ? `${h}px` : "3px",
                    background: "#00d4ff",
                    opacity: status === "speaking" ? 1 : 0.25,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              Transcript
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition hover:brightness-110"
              onClick={copyTranscript}
              style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition hover:brightness-110"
              onClick={exportTXT}
              style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}
            >
              <Download className="h-3 w-3" /> TXT
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition hover:brightness-110"
              onClick={exportSRT}
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
            >
              <Download className="h-3 w-3" /> SRT
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition hover:brightness-110"
              onClick={clearTranscript}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
            >
              ✕ Clear
            </button>
          </div>
        </div>

        {/* Scroll area */}
        <div
          ref={scrollRef}
          className="relative min-h-[320px] max-h-[500px] overflow-y-auto p-5 space-y-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
        >
          {/* Scroll-to-bottom indicator */}
          {userScrolled && (
            <button
              className="absolute bottom-4 right-4 z-10 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide"
              onClick={() => { setUserScrolled(false); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }}
              style={{ background: "#00d4ff", color: "#060a0e", boxShadow: "0 4px 16px rgba(0,212,255,0.35)" }}
            >
              ↓ New lines
            </button>
          )}

          {entries.length === 0 && !partial ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Headphones className="h-12 w-12 mb-4" style={{ color: "rgba(0,212,255,0.3)" }} />
              <h3 className="text-base font-semibold text-white mb-2">Ready to listen</h3>
              <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Click Start, allow microphone access, and begin speaking. Transcription appears here in real-time.
              </p>
            </div>
          ) : (
            <>
              {entries.map((entry, i) => (
                <div
                  key={i}
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="mb-1 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {entry.time} · {mode.toUpperCase()}
                  </div>
                  <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {entry.keywords?.length
                      ? entry.text.split(new RegExp(`(${entry.keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")).map((part, pi) =>
                          entry.keywords!.some((k) => k.toLowerCase() === part.toLowerCase())
                            ? <mark key={pi} style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff", borderRadius: "4px", padding: "0 3px" }}>{part}</mark>
                            : part
                        )
                      : entry.text
                    }
                  </p>
                </div>
              ))}
              {partial && (
                <div
                  className="rounded-2xl px-4 py-3 opacity-60"
                  style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.08)" }}
                >
                  <div className="mb-1 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {new Date().toLocaleTimeString("en-IN", { hour12: false })} · PARTIAL
                  </div>
                  <p className="text-sm italic leading-6" style={{ color: "rgba(255,255,255,0.45)" }}>{partial}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Footer stats ── */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {[
          { label: "Segments", value: segCount },
          { label: "Words", value: wordCount },
          { label: "Duration", value: duration },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{label}:</span>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{value}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Powered by Sarvam AI · Saaras v3
        </span>
      </div>
    </div>
  );
}
