# Schemocker — AI-Native Rewrite Plan

> **Core Identity Shift:** Schemocker is no longer a mock server with an MCP bolt-on. It is an **AI-first API authoring tool** — describe your API in plain English, get a running mock endpoint instantly. The MCP server is the primary interface, not a feature.

> **Zero users = zero constraints.** Rip, replace, and rebuild.

---

## Repositioning

| Before | After |
|---|---|
| "Frontend devs blocked waiting on backend" | "Describe your API. Your AI agent gets a live endpoint. No schema writing, no waiting." |
| MCP server is a bolt-on feature | MCP server is the primary interface — AI agents drive everything |
| `schemock start <schema>` + examples | `schemock init "a blog with users, posts, and comments"` → live server |
| Scenario flags (`--scenario slow/error/sad-path`) | Fold into MCP `call_endpoint` as optional params |
| 6 example schemas as the onboarding | One NL command, one server |

---

## MCP Server — `src/mcp-server/index.ts`

**Current state:** 4 read/call tools — `list_routes`, `call_endpoint`, `reload_schema`, `world_snapshot`. AI can explore but not create or mutate.

**Replace with — 7 tools:**

### Keep (modified)
- `list_routes` — unchanged
- `call_endpoint` — add `scenario?: 'slow' | 'error' | 'sad-path'` as optional param (kills CLI flag surface)
- `reload_schema` — unchanged
- `world_snapshot` — unchanged

### Add
- **`generate_schema`** — natural language description → valid JSON Schema → hot-reload into running server. The killer feature. Example: `"I need a social media post with likes, comments, and author"` → live endpoint in seconds.
- **`mutate_schema`** — current schema + NL instruction → merged updated schema. Example: `"add a createdAt timestamp field"` → schema updated and hot-reloaded.
- **`seed_world`** — populate N realistic records using LLM-generated values for semantic fields (bio, description, title, review) rather than faker noise.

---

## New Module: `src/ai/` — First-Class, Not Optional

```
src/ai/
├── provider.ts       # Abstract interface: complete(prompt: string): Promise<string>
├── openai.ts         # OpenAI adapter
├── ollama.ts         # Local Ollama adapter (Zach's A5000s when available)
├── vllm.ts           # Self-hosted vLLM adapter (CAAE/EXP inference stack)
├── schema-inferrer.ts    # NL → JSON Schema via prompt template
└── field-enricher.ts    # Semantic field name → realistic LLM value
```

**`provider.ts` interface is one method:**
```typescript
export interface AIProvider {
  complete(prompt: string): Promise<string>;
}
```

Everything in `src/ai/` calls through this. OpenAI for demos, Ollama for local, vLLM for private infrastructure — same interface.

### Ollama path
No A5000 = Ollama on the laptop. Qwen2.5-3B is fast enough for schema inference and field enrichment. `ollama serve` locally, `http://localhost:11434`.

### vLLM path (for when GPU situation resolves)
Points at the Paperspace endpoint. Same adapter interface, just different base URL + auth.

---

## `src/generators/schema-routes.ts` — Semantic Field Detector

After existing faker logic runs, check each field name for semantic content:

```typescript
// if field name contains: description, bio, title, summary, comment,
//                       review, message, body, content, bio, tagline, tagline
// AND AI provider is configured
// → call fieldEnricher.generate(fieldName, parentSchema)
// ELSE → existing faker logic
```

**Zero breaking change** — only activates when AI provider is set. Makes generated data dramatically more useful for demos and screenshots.

---

## `src/generators/world-state.ts`

Strong foundation — keep it. Expose fully through MCP so AI agents can do CRUD loops against the mock world during agentic testing workflows. The `seed_world` MCP tool calls into this.

---

## Simplifications (No Users = No Constraints)

### Kill
- ~~`--scenario slow/error-heavy/sad-path`~~ → fold into `call_endpoint(scenario?)` as optional param
- ~~6 example schemas as primary onboarding~~ → replaced by `schemock init "NL description"`
- ~~`--ai-enrich` flag~~ → AI features activate automatically when `schemock.json` has `ai:` block or env vars set

### Keep
- Single binary (zero deps)
- Hot reload
- CORS on by default
- All existing test suite

---

## New CLI Entry Point

```bash
schemock init "a blog with users, posts, and comments"
# → LLM generates schema
# → Server boots with all routes live
# → MCP server running

schemock init --interactive
# → Prompt loop for iterative schema building
```

Implementation: `src/cli/commands/init.ts` — calls `schema-inferrer.ts`, writes schema to disk, boots server.

---

## `schemock.json` — AI Config Block

```json
{
  "version": "1.0.0",
  "ai": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "apiKey": "env:SCHEMOCKER_API_KEY"
  },
  "defaults": {
    "port": 3000,
    "cors": true
  }
}
```

Defaults to OpenAI `gpt-4o-mini` (cheapest, fast enough for schema work). User swaps to `ollama` or `vllm` when ready.

---

## README Repositioning

**Current pitch:** "Frontend devs blocked waiting on backend"

**New pitch:**
> **"Describe your API. Your AI agent gets a live endpoint to test against."**
>
> Drop a schema → get a mock. Or don't write one at all. Tell Schemock what you need in plain English and it generates the schema, boots the server, and exposes everything over MCP. Your AI agent (Claude, Cursor, any MCP client) can explore, create, and mutate the mock directly — no schema writing, no backend, no waiting.

---

## Priority Order

| # | Task | Why |
|---|---|---|
| 1 | Write `src/ai/provider.ts` interface | Foundation for everything |
| 2 | Write `src/ai/openai.ts` adapter | Fastest path to working |
| 3 | Add 3 MCP tools to `src/mcp-server/index.ts` | Core of the new identity |
| 4 | Wire `generate_schema` to schema-inferrer | The killer feature |
| 5 | `schemock init "NL description"` CLI command | New primary onboarding |
| 6 | Semantic field detector in `schema-routes.ts` | Quick win, high impact |
| 7 | `seed_world` MCP tool → world-state | Makes demos look real |
| 8 | `ollama.ts` adapter | Local-first when A5000 available |
| 9 | README rewrite | New positioning |
| 10 | `vllm.ts` adapter | CAAE/EXP showcase (deferred until GPU resolves) |

---

## Files to Create / Modify

```
src/ai/
+ provider.ts          [NEW — interface]
+ openai.ts            [NEW — adapter]
+ ollama.ts            [NEW — adapter]
+ vllm.ts              [NEW — adapter, deferred]
+ schema-inferrer.ts   [NEW]

src/mcp-server/
~ index.ts             [MODIFY — add 3 tools]

src/cli/commands/
+ init.ts              [NEW — schemock init]

src/generators/
~ schema-routes.ts     [MODIFY — semantic field detector]

schemock.json          [MODIFY — add ai: block]

README.md              [REWRITE]
```

---

## vLLM / A5000 Situation

Paperspace Gradient notebooks aren't a viable self-hosted path right now (session management, cold starts). When a real GPU endpoint is available, `vllm.ts` adapter drops in with the same interface. The abstraction holds regardless.

Ollama on laptop = fully functional for development + demos.

---

*Plan version: 2.0 | AI-native rewrite 2026-03-22*
