import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildBackendUrl } from "@/lib/backend";

const templatesRoot = path.resolve(process.cwd(), "legacy");
const liveLightThemeOverrides = `
<style id="next-light-overrides">
  :root {
    --bg: #f1f5f9 !important;
    --surface: #ffffff !important;
    --border: #e2e8f0 !important;
    --accent: #0284c7 !important;
    --accent2: #0f766e !important;
    --success: #15803d !important;
    --warn: #b45309 !important;
    --danger: #b91c1c !important;
    --text: #0f172a !important;
    --muted: #64748b !important;
    --glow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  }

  html,
  body {
    background: #f1f5f9 !important;
    color: var(--text) !important;
  }

  body::before {
    display: none !important;
  }

  .page,
  .hero-card,
  .status-card,
  .control-card,
  .panel,
  .transcript-card,
  .translation-card,
  .sidebar-card,
  .history-card,
  .metric-card,
  .floating-panel {
    border: 1px solid var(--border) !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) !important;
    border-radius: 16px !important;
  }

  .btn.primary,
  .btn-primary {
    color: #ffffff !important;
  }

  .btn-nav.active,
  .btn-nav:hover {
    background: #eff6ff !important;
  }

  header {
    display: none !important;
  }

  .app {
    max-width: 1400px !important;
    padding-top: 5px !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
</style>
`;

function getBackendWebSocketBase() {
  const backendUrl = buildBackendUrl("/");

  if (backendUrl.startsWith("https://")) {
    return backendUrl.replace("https://", "wss://").replace(/\/$/, "");
  }

  return backendUrl.replace("http://", "ws://").replace(/\/$/, "");
}

export async function loadLegacyTemplate(name: "index.html") {
  const filePath = path.join(templatesRoot, name);
  return readFile(filePath, "utf8");
}

export async function buildLegacyLiveHtml(authToken: string) {
  const backendWsBase = getBackendWebSocketBase();
  let html = await loadLegacyTemplate("index.html");

  html = html.replace("<head>", `<head><base target="_top">${liveLightThemeOverrides}`);
  html = html.replace('<script src="/auth-helper.js"></script>', "");
  html = html.replace(
    "const authToken = localStorage.getItem('auth_token') || '';",
    `const authToken = ${JSON.stringify(authToken)};`,
  );
  html = html.replace(
    "const uploadToken = localStorage.getItem('auth_token') || '';",
    `const uploadToken = ${JSON.stringify(authToken)};`,
  );
  html = html.replaceAll(
    "${wsProto}//${location.host}/ws/translate",
    `${backendWsBase}/ws/translate`,
  );
  html = html.replaceAll(
    "${proto}://${location.host}/ws/translate",
    `${backendWsBase}/ws/translate`,
  );
  html = html.replaceAll("window.location.href =", "window.top.location.href =");

  return html;
}
