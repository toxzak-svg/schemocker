# Schemock

**JSON Schema → Fake REST API in 60 seconds.**

Drop a JSON Schema in. Get a full mock REST API out. Single binary, zero deps, works offline — built for frontend devs who are blocked waiting on backend.

[![GitHub release](https://img.shields.io/github/v/release/toxzak-svg/schemock-app)](https://github.com/toxzak-svg/schemock-app/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-176%20passing-success)](.)
[![Coverage](https://img.shields.io/badge/coverage-76.88%25-green)](.)

---

## TL;DR

```bash
# 1. Install (one command, pick your OS)
curl -fsSL https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.sh | bash

# 2. Start a mock server
schemock start examples/simple-user.json

# 3. Fetch in your frontend — that's it
fetch('http://localhost:3000/api/data')
```

No account. No Node.js. No config files. No waiting.

---

## One-liner pitch

**The problem:** You need a backend that doesn't exist yet. You could hardcode JSON (gets stale fast), use MSW (lives in your app code, hard to share), or spin up a full mock server (minutes of setup).

**Schemock:** Your JSON Schema is the spec. Use it to generate the mock, validate the API later, and document it — one source of truth. Start in 60 seconds.

---

## Quick Start

### 1. Install

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.ps1 | iex
```

**Or download a binary directly:**
📥 [Latest release](https://github.com/toxzak-svg/schemock-app/releases)

### 2. Write a schema

```json
// user-schema.json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "fullName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["id", "fullName", "email"]
}
```

### 3. Start the server and use it

```bash
schemock start user-schema.json
# → http://localhost:3000/api/data is live
```

```javascript
// React / Vue / Next.js / anything with fetch
const res = await fetch('http://localhost:3000/api/data');
const user = await res.json();
// → { id: "550e8400-e29b-...", fullName: "Sarah Chen", email: "sarah.chen@example.com", age: 28 }
```

**Done.** No backend. No hardcoded JSON. No waiting.

---

## Key features

| Feature | What it means |
|---------|---------------|
| **Single binary** | Download → run. No Node, no Docker, no runtime install |
| **JSON Schema first-class** | Your schema is the source of truth — mock data, validation, docs all from one file |
| **Hot reload** | Edit the schema, server auto-restarts |
| **Realistic data** | UUIDs, emails, dates generated to match your formats — not "John Doe 1" |
| **Scenario testing** | Flip between slow/error/happy-path with `--scenario` flags |
| **CORS on by default** | Works with any frontend, no config |
| **Built-in MCP server** | Let Claude or Cursor explore and call your mock API automatically |
| **176 tests passing** | Tested, not just shipped |

---

## Scenario flags — test your UI in different conditions

```bash
schemock start schema.json                        # fast, no errors (default)
schemock start schema.json --scenario slow        # 1-3s delays — test loading states
schemock start schema.json --scenario error-heavy # random 4xx/5xx — test error handling
schemock start schema.json --scenario sad-path    # slow + errors combined
```

```bash
schemock start schema.json --watch               # auto-reload on schema change
schemock start schema.json --port 8080           # custom port
schemock start schema.json --log-level debug      # verbose output
```

---

## 🤖 AI + MCP (the differentiator)

Schemock ships with a built-in MCP server. This is what sets it apart from every other mock tool.

**What this means:** Your AI assistant (Claude, Cursor, any MCP client) can connect to Schemock, discover your endpoints, make requests, and generate matching frontend code — all from your JSON Schema.

```bash
# Build the MCP server
npm run build

# Add to your MCP config (Claude Desktop, Cursor, etc.)
```

```json
{
  "mcpServers": {
    "schemocker": {
      "command": "node",
      "args": ["/absolute/path/to/schemocker/dist/mcp-server/index.js"],
      "env": {
        "SCHEMOCKER_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

Then ask your AI: *"Generate a React component that fetches from my /api/data endpoint"* — it uses the real schema and can make live requests to your mock server.

See [`src/mcp-server/README.md`](src/mcp-server/README.md) for full setup docs.

---

## Ready-made example schemas

Not feeling like writing a schema from scratch? These are included:

| Schema | What it models | Port |
|--------|---------------|------|
| `simple-user.json` | Basic user profile | 3000 |
| `auth-user-profile.json` | Auth + profile | 3001 |
| `product-list.json` | Product catalog | 3002 |
| `cart.json` | Shopping cart | 3003 |
| `dashboard-cards.json` | Admin dashboard | 3004 |
| `activity-feed.json` | Social feed | 3005 |

```bash
schemock start examples/auth-user-profile.json --port 3001
```

---

## Using with React / Next.js / Vue

### React + Vite

```bash
schemock start examples/auth-user-profile.json --port 3001 --watch
# then in your React app:
fetch('http://localhost:3001/api/data').then(r => r.json()).then(setUser);
```

### Next.js App Router (Server Component)

```javascript
// app/users/page.jsx
async function getUsers() {
  const res = await fetch('http://localhost:3001/api/data', { cache: 'no-store' });
  return res.json();
}

export default async function UsersPage() {
  const { users } = await getUsers();
  return (
    <ul>{users.map(u => <li key={u.id}>{u.fullName}</li>)}</ul>
  );
}
```

### Cypress / Playwright E2E

```bash
# Terminal 1
schemock start tests/api/schema.json --port 3001 --scenario slow

# Terminal 2
npm run cy:run
```

Full integration guides: [docs/user-guide.md](docs/user-guide.md)

---

## vs Alternatives

| | Schemock | Mockoon | MSW | JSON Server |
|--|:--:|:--:|:--:|:--:|
| Binary, zero deps | ✅ | ❌ desktop app | ❌ npm | ❌ Node |
| JSON Schema first-class | ✅ primary input | ⚠️ partial | ❌ | ❌ |
| Works offline | ✅ | ✅ | ❌ | ❌ |
| MCP server built-in | ✅ | ❌ | ❌ | ❌ |
| Setup time | **<60s** | 2–5 min | 15+ min | 10+ min |

The honest answer: if you don't need JSON Schema or MCP, Mockoon is fine. If you want a single binary that "just works" with your schema and your AI tools — that's Schemock.

---

## Supported JSON Schema features

- All basic types: `string`, `number`, `integer`, `boolean`, `object`, `array`
- Formats: `uuid`, `email`, `date-time`, `date`, `uri`
- Constraints: `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`, `enum`
- `required` fields, nested objects, `array` with `items`
- `$ref` (internal refs within the same schema)
- `oneOf` / `anyOf` / `allOf`

---

## All commands

```bash
schemock start [schema] [options]   # Start mock server
schemock validate [schema]           # Check schema validity
schemock init [name]                 # Scaffold a new project
schemock crud [resource]             # Generate CRUD schema for a resource
schemock init-vite                   # Add Schemock to a Vite project
schemock --help                      # Full help
```

```bash
-p, --port <n>        Port (default: 3000)
-w, --watch           Auto-reload on schema change
--scenario <name>     happy-path | slow | error-heavy | sad-path
--no-cors             Disable CORS
--log-level <level>   error | warn | info | debug
```

---

## Install

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/install.ps1 | iex
```

**Scoop:**
```powershell
scoop install https://raw.githubusercontent.com/toxzak-svg/schemock-app/main/schemock.json
```

**Download a binary:**
📥 [github.com/toxzak-svg/schemock-app/releases](https://github.com/toxzak-svg/schemock-app/releases)

---

## Docs

| Guide | What it covers |
|-------|---------------|
| [Quick Start](QUICK-START.md) | 5-minute setup walkthrough |
| [User Guide](docs/user-guide.md) | Full feature reference |
| [API Docs](docs/api-documentation.md) | HTTP endpoints and response format |
| [MCP Server](src/mcp-server/README.md) | AI integration setup |
| [Deployment](DEPLOYMENT-GUIDE.md) | CI/CD, production considerations |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and fixes |

---

## Build from source

```bash
git clone https://github.com/toxzak-svg/schemock-app.git
cd schemock-app
npm install
npm run build       # Compile TypeScript
npm test            # Run 176 tests
npm run build:exe   # Build Windows executable
```

Prerequisites: Node.js 18+ for development only.

---

## Project stats

- **176 tests** — 100% pass
- **76.88% coverage**
- **~1.5s startup time**
- **~15ms GET response latency**
- **MIT License** — free to use, commercial use allowed

---

## License

MIT License. Use it however you want. Commercial licensing available for teams that need it — see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

---

<div align="center">

**Stop waiting on backend teams. Start building.**

[⭐ Star on GitHub](https://github.com/toxzak-svg/schemock-app) · [📥 Download](https://github.com/toxzak-svg/schemock-app/releases) · [📖 Docs](docs/)

</div>
