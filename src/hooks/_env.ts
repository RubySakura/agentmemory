import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

let cached: Record<string, string> | undefined;

function loadDotEnv(): Record<string, string> {
  if (cached) return cached;
  cached = {};
  try {
    const content = readFileSync(
      join(homedir(), ".agentmemory", ".env"),
      "utf-8",
    );
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      cached[key] = value;
    }
  } catch {
    // .env file missing or unreadable — continue with process.env only
  }
  return cached;
}

export function hookEnv(key: string): string | undefined {
  return process.env[key] ?? loadDotEnv()[key];
}
