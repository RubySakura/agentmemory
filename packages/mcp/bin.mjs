#!/usr/bin/env node
import("@ruby_sakura/agentmemory/dist/standalone.mjs").catch((err) => {
  console.error(
    "[@agentmemory/mcp] Failed to load standalone entrypoint from @ruby_sakura/agentmemory.",
  );
  console.error(
    "[@agentmemory/mcp] Try installing manually: npm i -g @ruby_sakura/agentmemory",
  );
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
