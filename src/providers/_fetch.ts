import { HttpsProxyAgent } from "https-proxy-agent";
import { getEnvVar } from "../config.js";

let cachedAgent: HttpsProxyAgent<string> | undefined;

function getProxyAgent(): HttpsProxyAgent<string> | undefined {
  if (cachedAgent) return cachedAgent;

  const proxyUrl =
    getEnvVar("HTTPS_PROXY") ||
    getEnvVar("https_proxy") ||
    getEnvVar("HTTP_PROXY") ||
    getEnvVar("http_proxy") ||
    getEnvVar("AGENTMEMORY_PROXY") ||
    undefined;

  if (!proxyUrl) return undefined;

  try {
    cachedAgent = new HttpsProxyAgent(proxyUrl);
    return cachedAgent;
  } catch {
    return undefined;
  }
}

export { getProxyAgent };

export function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs?: number,
): Promise<Response> {
  const parsed =
    timeoutMs ??
    Number.parseInt(getEnvVar("AGENTMEMORY_LLM_TIMEOUT_MS") ?? "60000", 10);
  const ms = Number.isFinite(parsed) && parsed > 0 ? parsed : 60000;

  const ctl = new AbortController();
  const signal = init.signal
    ? AbortSignal.any([init.signal, ctl.signal])
    : ctl.signal;
  const t = setTimeout(() => ctl.abort(), ms);

  const agent = getProxyAgent();
  const extra = agent
    ? ({ dispatcher: agent } as Record<string, unknown>)
    : {};

  return fetch(url, { ...init, ...extra, signal } as RequestInit).finally(() =>
    clearTimeout(t),
  );
}
