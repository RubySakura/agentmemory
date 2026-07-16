import { HttpsProxyAgent } from "https-proxy-agent";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { getEnvVar } from "../config.js";

let cachedAgent: HttpsProxyAgent<string> | undefined;
let agentChecked = false;

function getProxyAgent(): HttpsProxyAgent<string> | undefined {
  if (agentChecked) return cachedAgent;
  agentChecked = true;

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

function proxiedFetch(
  url: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const reqFn = isHttps ? httpsRequest : httpRequest;
    const agent = getProxyAgent();

    const headers: Record<string, string> = {};
    if (init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => { headers[k] = v; });
      } else if (Array.isArray(init.headers)) {
        for (const [k, v] of init.headers) headers[k] = v;
      } else {
        Object.assign(headers, init.headers);
      }
    }

    const req = reqFn(
      url,
      {
        method: init.method || "GET",
        headers,
        ...(agent ? { agent } : {}),
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          const respHeaders = new Headers();
          for (const [k, v] of Object.entries(res.headers)) {
            if (v) respHeaders.set(k, Array.isArray(v) ? v.join(", ") : v);
          }
          resolve(
            new Response(body, {
              status: res.statusCode ?? 0,
              statusText: res.statusMessage ?? "",
              headers: respHeaders,
            }),
          );
        });
        res.on("error", reject);
      },
    );

    req.on("error", reject);
    signal.addEventListener("abort", () => {
      req.destroy(new DOMException("The operation was aborted.", "AbortError"));
      reject(new DOMException("The operation was aborted.", "AbortError"));
    });

    if (init.body) {
      req.write(
        typeof init.body === "string"
          ? init.body
          : init.body instanceof Uint8Array
            ? Buffer.from(init.body)
            : JSON.stringify(init.body),
      );
    }
    req.end();
  });
}

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

  const hasProxy = getProxyAgent() !== undefined;

  const doFetch = hasProxy
    ? proxiedFetch(url, init, signal)
    : fetch(url, { ...init, signal });

  return doFetch.finally(() => clearTimeout(t));
}
