# Quick Start Guide for Schemock

Welcome to Schemock! This guide will get you up and running in minutes.

## What is Schemock?

Schemock is a lightweight mock server generator that creates RESTful APIs from JSON schemas. Perfect for:
- Frontend development without backend
- API prototyping and testing
- Demo environments
- Development and testing workflows

## Installation

**No installation required!** Schemock is a standalone executable.

1. Download `schemock.exe`
2. Place it in any folder
3. Run it!

That's it. No Node.js, no npm, no dependencies needed.

## First Steps

### 1. Start with Example Schema

The easiest way to get started:

```powershell
# Double-click start.bat OR run:
.\schemock.exe start examples\user-schema.json
```

You should see:
```
✅ Server running at http://localhost:3000
🛑 Press Ctrl+C to stop the server
```

### 2. Test the API

Open your browser or use curl:

```powershell
# Browser: http://localhost:3000/api/data

# PowerShell:
Invoke-WebRequest -Uri http://localhost:3000/api/data | Select-Object -Expand Content

# Or curl:
curl http://localhost:3000/api/data
```

You'll get automatically generated mock data based on your schema!

### 3. Stop the Server

Press `Ctrl+C` in the terminal

## Common Use Cases

### Use Case 1: Quick Mock Server

```powershell
# Start with default schema
.\schemock.exe start

# Or with your own schema
.\schemock.exe start my-api-schema.json
```

### Use Case 2: Custom Port

```powershell
# Use port 8080 instead of 3000
.\schemock.exe start user-schema.json --port 8080
```

### Use Case 3: Development with Auto-Reload

```powershell
# Enable watch mode - server reloads when schema changes
.\schemock.exe start api-schema.json --watch
```

Now edit `api-schema.json` and save - the server automatically reloads!

### Use Case 4: Debug Mode

```powershell
# See detailed logs
.\schemock.exe start schema.json --log-level debug
```

### Use Case 5: Create New Project

```powershell
# Initialize a new mock API project
.\schemock.exe init my-new-api

# Navigate to it
cd my-new-api

# Install dependencies
npm install

# Start the server
npm start
```

## Creating Your Own Schema

### Basic Schema

Create `my-schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Product",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "price": {
      "type": "number",
      "minimum": 0
    },
    "inStock": {
      "type": "boolean"
    }
  },
  "required": ["id", "name", "price"]
}
```

Run it:

```powershell
.\schemock.exe start my-schema.json
```

### Advanced Schema with Arrays

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 5
    },
    "categories": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" }
        }
      }
    }
  },
  "required": ["id", "name"]
}
```

## All Command Line Options

### Start Command

```powershell
schemock start [schema-file] [options]
```

**Options:**
- `-p, --port <number>` - Port number (default: 3000)
- `--no-cors` - Disable CORS (default: enabled)
- `--log-level <level>` - Log level: error, warn, info, debug (default: info)
- `-w, --watch` - Watch schema file for changes
- `--help` - Show help

**Examples:**
```powershell
# Start with all defaults
.\schemock.exe start

# Custom port and debug logging
.\schemock.exe start api.json --port 8080 --log-level debug

# Watch mode with custom port
.\schemock.exe start api.json --port 3001 --watch

# Disable CORS
.\schemock.exe start api.json --no-cors
```

### Init Command

```powershell
schemock init [directory] [options]
```

**Options:**
- `--name <name>` - Project name (default: my-mock-server)
- `--port <port>` - Default port (default: 3000)
- `--help` - Show help

**Examples:**
```powershell
# Create in current directory
.\schemock.exe init

# Create in specific directory
.\schemock.exe init my-api

# With custom name and port
.\schemock.exe init ecommerce --name "E-commerce API" --port 8080
```

### Other Commands

```powershell
# Show version
.\schemock.exe --version

# Show help
.\schemock.exe --help

# Command-specific help
.\schemock.exe start --help
.\schemock.exe init --help
```

## API Endpoints

By default, Schemock creates these endpoints:

### GET /api/data
Returns generated mock data based on your schema

```powershell
Invoke-WebRequest http://localhost:3000/api/data
```

### POST /api/data
Accepts data and echoes it back

```powershell
$body = @{
    name = "Test Product"
    price = 29.99
} | ConvertTo-Json

Invoke-WebRequest -Method Post -Uri http://localhost:3000/api/data -Body $body -ContentType "application/json"
```

### GET /health
Health check endpoint

```powershell
Invoke-WebRequest http://localhost:3000/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-24T10:30:00.123Z",
  "uptime": 3600
}
```

## Troubleshooting

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```powershell
# Use a different port
.\schemock.exe start schema.json --port 3001

# Or find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <process-id> /F
```

### Schema File Not Found

**Error**: `File not found: schema.json`

**Solution**:
```powershell
# Use full path
.\schemock.exe start C:\path\to\schema.json

# Or navigate to the directory first
cd C:\path\to\schemas
C:\tools\schemock.exe start my-schema.json
```

### Invalid JSON

**Error**: `Invalid JSON in schema file`

**Solution**:
- Check JSON syntax (commas, brackets, quotes)
- Use a JSON validator: https://jsonlint.com
- Common issues:
  - Trailing commas
  - Missing quotes on keys
  - Unmatched brackets

### Server Not Responding

**Solutions**:
1. Check if server is running (should see startup message)
2. Verify correct port number
3. Check firewall settings
4. Try localhost and 127.0.0.1
5. Use debug mode: `--log-level debug`

## Tips and Best Practices

### 1. Use Version Control
```powershell
# Track your schemas
git init
git add *.json
git commit -m "Add API schemas"
```

### 2. Organize Schemas
```
project/
├── schemock.exe
└── schemas/
    ├── user.json
    ├── product.json
    ├── order.json
    └── README.md
```

### 3. Document Your Schemas
Add descriptions to your schema:

```json
{
  "title": "User API",
  "description": "User management endpoints",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique user identifier"
    }
  }
}
```

### 4. Use Enums for Fixed Values
```json
{
  "status": {
    "type": "string",
    "enum": ["active", "inactive", "pending"]
  }
}
```

### 5. Combine with Frontend Development

```powershell
# Terminal 1: Frontend dev server
npm run dev

# Terminal 2: Mock API
.\schemock.exe start api-schema.json --port 3001 --watch
```

### 6. Test Different Scenarios

Create multiple schemas for different test scenarios:
- `schema-success.json` - Happy path
- `schema-error.json` - Error conditions
- `schema-empty.json` - Empty states
- `schema-large.json` - Large datasets

## Getting Help

### Built-in Help
```powershell
# General help
.\schemock.exe --help

# Command help
.\schemock.exe start --help
.\schemock.exe init --help
```

### Documentation
- **User Guide**: `docs\user-guide.md`
- **API Reference**: `docs\api-documentation.md`
- **Troubleshooting**: `docs\troubleshooting.md`
- **Deployment**: `DEPLOYMENT-GUIDE.md`

### Support Resources
- GitHub Issues: Report bugs and request features
- Documentation: Comprehensive guides in `docs/` folder
- Examples: Sample schemas in `examples/` folder

## Next Steps

1. ✅ Start the server with example schema
2. ✅ Test the API in your browser
3. ✅ Create your own schema
4. ✅ Enable watch mode for development
5. ✅ Integrate with your frontend application

## Example Workflow

```powershell
# 1. Create a new project
.\schemock.exe init my-ecommerce-api

# 2. Navigate to it
cd my-ecommerce-api

# 3. Edit the example schema (or create your own)
notepad example-schema.json

# 4. Start the server with watch mode
..\schemock.exe start example-schema.json --watch --port 3000

# 5. In another terminal, test it
Invoke-WebRequest http://localhost:3000/api/data

# 6. Make changes to the schema and save
# The server automatically reloads!

# 7. When done, press Ctrl+C to stop
```

## Advanced Features

### Custom Response Delay
Simulate network latency (requires custom configuration)

### CORS Configuration
- Default: CORS enabled for all origins
- Disable: Use `--no-cors` flag

### Log Levels
- **error**: Only critical errors
- **warn**: Warnings and errors
- **info**: General information (default)
- **debug**: Detailed debugging information

```powershell
# Production: minimal logging
.\schemock.exe start schema.json --log-level error

# Development: detailed logging
.\schemock.exe start schema.json --log-level debug
```

## Success Checklist

- [ ] Downloaded schemock.exe
- [ ] Started server with example schema
- [ ] Accessed API in browser
- [ ] Created custom schema
- [ ] Tested with your application
- [ ] Read documentation for advanced features

---

**Congratulations!** You're now ready to use Schemock for rapid API development and testing.

For more advanced usage and deployment scenarios, see the full documentation in the `docs/` folder.

Happy mocking! 🚀
