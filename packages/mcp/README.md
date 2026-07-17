# @ruby_sakura/mcp

Standalone MCP server for [agentmemory](https://github.com/rohitg00/agentmemory).

This is a thin shim package that re-exposes the standalone MCP entrypoint from
[`@ruby_sakura/agentmemory`](https://www.npmjs.com/package/@ruby_sakura/agentmemory),
so MCP client configs that say `npx @ruby_sakura/mcp` work out of the box
without installing the full package first.

## Usage

```bash
npx -y @ruby_sakura/mcp
```

Or wire it into your MCP client (Claude Desktop, OpenClaw, Cursor, Codex, etc.):

```json
{
  "mcpServers": {
    "agentmemory": {
      "command": "npx",
      "args": ["-y", "@ruby_sakura/mcp"]
    }
  }
}
```

This package depends on `@ruby_sakura/agentmemory` and forwards to its
`dist/standalone.mjs` entrypoint. If you already have `@ruby_sakura/agentmemory`
installed, you can call the same entrypoint directly:

```bash
npx @ruby_sakura/agentmemory mcp
```

Both commands do the same thing.

## Why does this package exist?

The original plan in [issue #120](https://github.com/rohitg00/agentmemory/issues/120)
was to publish `agentmemory-mcp` as an unscoped package, but npm's name-similarity
policy blocks that name because of an unrelated package called `agent-memory-mcp`.
Publishing under the `@agentmemory` scope sidesteps the conflict and keeps the
"dedicated standalone package" UX — `npx @ruby_sakura/mcp` is one character
longer than `npx agentmemory-mcp` and works on the live registry.

## License

Apache-2.0
