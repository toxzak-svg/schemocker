# Schemock VS Code Extension

[![Version](https://img.shields.io/visual-studio-marketplace/v/schemock.schemock-vscode?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=schemock.schemock-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/schemock.schemock-vscode?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=schemock.schemock-vscode)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/schemock.schemock-vscode?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=schemock.schemock-vscode)

Turn JSON schemas into live mock REST APIs in seconds - directly from your editor!

## 🚀 Features

### Quick Start
- **One-click server startup** - Right-click any JSON schema file and start a mock server instantly
- **CodeLens integration** - Start, stop, and restart servers directly from your schema files
- **Auto-detection** - Automatically finds schema files in `mocks/`, `examples/`, and `schemas/` directories

### Server Management
- **Multi-server support** - Run multiple mock servers on different ports simultaneously
- **Status bar indicators** - See running servers, ports, and scenarios at a glance
- **Tree view panel** - Visual overview of all servers and schema files in your workspace
- **Quick actions** - Start/stop/restart all servers with a single command

### Scenario Testing
- **Scenario switching** - Switch between happy-path, slow, error-heavy, and sad-path scenarios
- **Dropdown controls** - Easy scenario selection in the control panel
- **Command palette access** - Change scenarios without leaving your keyboard

### Control Panel
- **Webview interface** - Beautiful, responsive UI for managing all your mock servers
- **Real-time status** - Live updates of server status, port, and scenario
- **Quick actions** - One-click access to common operations
- **Server list** - View all active servers with their URLs

### Integration
- **Playground access** - Open the interactive API playground with one click
- **Watch mode** - Automatically reload servers when schemas change
- **Configuration** - Customize default ports, scenarios, and more

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
3. Search for "Schemock"
4. Click "Install"

### From Command Palette
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Extensions: Install Extensions"
3. Search for "Schemock"
4. Click "Install"

### Manual Installation
1. Download the latest `.vsix` file from the [Releases](https://github.com/toxzak-svg/schemock-app/releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded file

## 🎯 Quick Start

### Starting a Server

**Method 1: Right-click Context Menu**
1. Right-click on any JSON schema file in the explorer
2. Select "Schemock: Start Mock Server"

**Method 2: CodeLens**
1. Open a JSON schema file
2. Click the "▶ Start Mock Server" button at the top of the file

**Method 3: Command Palette**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Schemock: Start Mock Server"
3. Select a schema file

**Method 4: Control Panel**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Schemock: Show Control Panel"
3. Click "Start Server" and select a schema

### Managing Servers

**View Running Servers**
- Check the status bar (bottom right) for server status
- Open the "Schemock" sidebar to see all servers
- Use the Control Panel for a visual overview

**Switch Scenarios**
- Click the scenario indicator in the status bar
- Use the dropdown in the Control Panel
- Run "Schemock: Switch Scenario" from the command palette

**Stop/Restart Servers**
- Click the stop button in the Control Panel
- Use "Schemock: Stop Mock Server" from the command palette
- Use the CodeLens buttons in your schema files

## ⚙️ Configuration

Open VS Code settings (`Ctrl+,` or `Cmd+,`) and search for "Schemock" to configure:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `schemock.defaultPort` | number | `3000` | Default port for mock servers |
| `schemock.defaultScenario` | string | `happy-path` | Default scenario (happy-path, slow, error-heavy, sad-path) |
| `schemock.autoDetectSchemas` | boolean | `true` | Automatically detect schema files in workspace |
| `schemock.schemaDirectories` | array | `["mocks", "examples", "schemas"]` | Directories to scan for schema files |
| `schemock.watchMode` | boolean | `true` | Enable watch mode by default |
| `schemock.enableCORS` | boolean | `true` | Enable CORS by default |
| `schemock.logLevel` | string | `info` | Log level (error, warn, info, debug) |

### Example Configuration

```json
{
  "schemock.defaultPort": 3001,
  "schemock.defaultScenario": "happy-path",
  "schemock.autoDetectSchemas": true,
  "schemock.schemaDirectories": ["mocks", "api-schemas", "test-data"],
  "schemock.watchMode": true,
  "schemock.enableCORS": true,
  "schemock.logLevel": "info"
}
```

## 🎨 UI Components

### Status Bar
Located at the bottom right of VS Code:
- **🚀 Schemock** - Main status indicator (click to stop)
- **🎭 Happy** - Current scenario (click to switch)
- **🖥️ :3000** - Server port (click to open playground)

### Sidebar
Two tree views in the Schemock activity bar:
- **Mock Servers** - List of running servers with status
- **Schema Files** - Detected schema files in your workspace

### Control Panel
A webview panel with:
- Server status and information
- Start/Stop/Restart buttons
- Scenario selector dropdown
- Quick action cards
- Active servers list

### CodeLens
Buttons appearing at the top of JSON schema files:
- `▶ Start Mock Server` - Start a server for this schema
- `⏹ Stop Server (3000)` - Stop the running server
- `↻ Restart Server` - Restart the server
- `🌐 Open Playground` - Open the API playground
- `🎭 Scenario: Happy Path` - Current scenario (click to switch)

## 📋 Commands

All commands are available via `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac):

### Server Commands
- `Schemock: Start Mock Server` - Start a server for a schema
- `Schemock: Stop Mock Server` - Stop a running server
- `Schemock: Restart Mock Server` - Restart a server
- `Schemock: Start All Servers` - Start all detected schemas
- `Schemock: Stop All Servers` - Stop all running servers

### Scenario Commands
- `Schemock: Switch Scenario` - Choose a scenario from a list
- `Schemock: Set Scenario to Happy Path` - Set happy-path scenario
- `Schemock: Set Scenario to Slow` - Set slow scenario
- `Schemock: Set Scenario to Error Heavy` - Set error-heavy scenario
- `Schemock: Set Scenario to Sad Path` - Set sad-path scenario

### UI Commands
- `Schemock: Show Control Panel` - Open the webview control panel
- `Schemock: Show Servers Tree` - Show the sidebar tree view
- `Schemock: Open Playground` - Open the API playground
- `Schemock: Refresh Schema Files` - Refresh the schema file list

## 🎯 Use Cases

### Frontend Development
```bash
# Create a schema for your API
# mocks/user-api.json

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User API",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  }
}
```

Right-click the file and start the server. Your frontend can now call `http://localhost:3000`!

### Testing Scenarios
1. Start your server with the happy-path scenario
2. Test your frontend with normal responses
3. Switch to the "slow" scenario to test loading states
4. Switch to "error-heavy" to test error handling
5. Switch to "sad-path" to test edge cases

### Multi-API Projects
```bash
project/
├── mocks/
│   ├── users.json
│   ├── products.json
│   └── orders.json
```

Start all three servers with different ports:
- Users: `http://localhost:3000`
- Products: `http://localhost:3001`
- Orders: `http://localhost:3002`

### Team Collaboration
- Share your schema files in version control
- Team members can start servers with one click
- Consistent mock APIs across all environments
- No need to remember CLI commands

## 🔧 Advanced Usage

### Custom Schema Directories
Add custom directories to scan for schemas:

```json
{
  "schemock.schemaDirectories": [
    "mocks",
    "api-specs",
    "test-fixtures",
    "documentation"
  ]
}
```

### Watch Mode
Enable watch mode to automatically reload servers when schemas change:

```json
{
  "schemock.watchMode": true
}
```

Now edit your schema and the server will automatically restart!

### Multiple Workspaces
Each workspace maintains its own set of servers and schemas. Switch between workspaces and your servers will be preserved.

## 🐛 Troubleshooting

### Server won't start
- Check if the port is already in use
- Verify the schema file is valid JSON
- Check the terminal output for error messages

### Schema not detected
- Ensure the file is in a configured schema directory
- Check that `schemock.autoDetectSchemas` is enabled
- Run "Schemock: Refresh Schema Files"

### Port conflicts
- Change the default port in settings
- Specify a different port when starting the server
- Stop conflicting servers

### Extension not working
- Reload VS Code window (`Ctrl+Shift+P` > "Developer: Reload Window")
- Check the VS Code Output panel for errors
- Ensure Schemock CLI is installed (`npm install -g schemock`)

## 📚 Resources

- [Schemock Documentation](https://github.com/toxzak-svg/schemock-app)
- [JSON Schema Specification](https://json-schema.org/)
- [VS Code Extension API](https://code.visualstudio.com/api)

## 🤝 Contributing

Contributions are welcome! Please see the [main repository](https://github.com/toxzak-svg/schemock-app) for guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

## 🙏 Acknowledgments

Built with ❤️ using:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript](https://www.typescriptlang.org/)
- [Schemock CLI](https://github.com/toxzak-svg/schemock-app)

---

Made with ❤️ by the Schemock team
