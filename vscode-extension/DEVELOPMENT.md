# Schemock VS Code Extension - Development Guide

This guide covers building, testing, and developing the Schemock VS Code extension.

## 🛠️ Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- VS Code
- TypeScript (v4.9.5 or higher)

## 📦 Setup

### 1. Clone the Repository

```bash
git clone https://github.com/toxzak-svg/schemock-app.git
cd schemock-app/vscode-extension
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Schemock CLI (for local testing)

```bash
cd ..
npm install -g .
cd vscode-extension
```

## 🏗️ Building

### Compile TypeScript

```bash
npm run compile
```

This compiles the TypeScript source files to JavaScript in the `dist/` directory.

### Watch Mode (for development)

```bash
npm run watch
```

This continuously compiles TypeScript files as you make changes.

### Linting

```bash
npm run lint
```

Check code quality and style issues.

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Watch Tests

```bash
npm run test:watch
```

## 🚀 Running the Extension

### Method 1: Using VS Code Extension Development Host

1. Open the extension folder in VS Code:
   ```bash
   code .
   ```

2. Press `F5` (or click "Run > Start Debugging")

3. A new VS Code window will open with your extension loaded

4. Test the extension in the new window

### Method 2: Using `vscode-test`

```bash
npm run pretest
```

### Method 3: Packaging and Installing

1. Build the extension:
   ```bash
   npm run compile
   ```

2. Package as `.vsix`:
   ```bash
   vsce package
   ```

3. Install the `.vsix` file:
   ```bash
   code --install-extension schemock-vscode-1.0.0.vsix
   ```

## 📁 Project Structure

```
vscode-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── webview/
│   │   └── SchemockPanel.ts    # Webview panel provider
│   ├── tree/
│   │   └── ServerTreeProvider.ts # Tree view data provider
│   ├── codelens/
│   │   └── SchemaCodeLensProvider.ts # CodeLens provider
│   ├── statusbar/
│   │   └── StatusBarManager.ts  # Status bar management
│   ├── server/
│   │   └── ServerManager.ts      # Server lifecycle management
│   └── utils/
│       └── SchemaDetector.ts       # Schema file detection
├── resources/
│   └── icon.svg                 # Extension icon
├── package.json                  # Extension manifest
├── tsconfig.json                # TypeScript configuration
├── README.md                    # User documentation
└── DEVELOPMENT.md               # This file
```

## 🔧 Development Workflow

### Adding a New Command

1. Register the command in [`package.json`](package.json:18-34):
   ```json
   {
     "command": "schemock.myCommand",
     "title": "Schemock: My Command",
     "category": "Schemock"
   }
   ```

2. Implement the command handler in [`extension.ts`](extension.ts:1):
   ```typescript
   const myCommand = vscode.commands.registerCommand(
     'schemock.myCommand',
     async () => {
       // Your implementation
     }
   );
   context.subscriptions.push(myCommand);
   ```

3. Test the command via Command Palette (`Ctrl+Shift+P`)

### Adding a New Configuration Setting

1. Add to [`package.json`](package.json:95-131):
   ```json
   {
     "schemock.mySetting": {
       "type": "string",
       "default": "value",
       "description": "Description of the setting"
     }
   }
   ```

2. Access in code:
   ```typescript
   const config = vscode.workspace.getConfiguration('schemock');
   const mySetting = config.get<string>('mySetting', 'default');
   ```

### Modifying the Webview UI

1. Edit the HTML in [`SchemockPanel.ts`](webview/SchemockPanel.ts:1)
2. The HTML is embedded in the `_getHtmlForWebview()` method
3. CSS and JavaScript are also embedded in the same file
4. Changes are reflected when you reopen the panel

### Adding Tree View Items

1. Modify [`ServerTreeProvider.ts`](tree/ServerTreeProvider.ts:1)
2. Update `getChildren()` method to return new items
3. Create new `ServerTreeItem` instances with appropriate context values
4. Add icons and commands as needed

## 🐛 Debugging

### Using VS Code Debugger

1. Set breakpoints in your TypeScript files
2. Press `F5` to launch the Extension Development Host
3. Trigger the code you want to debug
4. Debugger will stop at your breakpoints

### Logging

Use `console.log()` for debugging:
```typescript
console.log('Server started:', serverInfo);
```

View logs in:
- **Extension Development Host**: View > Output > Select "Extension Host"
- **Running Extension**: View > Output > Select "Schemock"

### Common Issues

**Extension doesn't activate:**
- Check activation events in [`package.json`](package.json:13-15)
- Verify `main` field points to compiled file
- Check for errors in Output panel

**Commands not appearing:**
- Verify command is registered in [`package.json`](package.json:18-34)
- Check command is registered in [`extension.ts`](extension.ts:1)
- Reload VS Code window

**Webview not showing:**
- Check webview HTML is valid
- Verify `localResourceRoots` is set correctly
- Check for JavaScript errors in browser console

**Tree view empty:**
- Verify `getChildren()` returns items
- Check `treeDataProvider` is registered
- Refresh tree view manually

## 📝 Code Style

### TypeScript Best Practices

- Use strict type checking
- Avoid `any` types
- Use interfaces for data structures
- Add JSDoc comments for public APIs

### VS Code Extension API

- Use `vscode` namespace for all API calls
- Dispose of resources in `deactivate()`
- Use `context.subscriptions.push()` for cleanup
- Follow the [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

### Error Handling

```typescript
try {
  // Your code
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  vscode.window.showErrorMessage(`Operation failed: ${message}`);
}
```

## 🚢 Publishing

### Preparation

1. Update version in [`package.json`](package.json:5)
2. Update [`CHANGELOG.md`](../CHANGELOG.md)
3. Test thoroughly
4. Run `npm run lint` and fix issues

### Using vsce

1. Install `vsce`:
   ```bash
   npm install -g vsce
   ```

2. Package:
   ```bash
   vsce package
   ```

3. Publish:
   ```bash
   vsce publish
   ```

### Using VS Code Marketplace

1. Go to [VS Code Marketplace](https://marketplace.visualstudio.com/)
2. Sign in with your publisher account
3. Upload the `.vsix` file
4. Fill in marketplace information

## 🧪 Testing Checklist

Before releasing, test:

- [ ] Extension activates correctly
- [ ] Commands appear in Command Palette
- [ ] Server starts from context menu
- [ ] Server starts from CodeLens
- [ ] Server starts from command palette
- [ ] Server starts from control panel
- [ ] Server stops correctly
- [ ] Server restarts correctly
- [ ] Scenario switching works
- [ ] Status bar updates correctly
- [ ] Tree view shows servers
- [ ] Tree view shows schemas
- [ ] Schema detection works
- [ ] Watch mode reloads servers
- [ ] Multi-server support works
- [ ] Configuration settings apply
- [ ] Webview displays correctly
- [ ] Playground opens correctly
- [ ] Error messages are helpful
- [ ] Extension deactivates cleanly

## 📚 Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)
- [vscode-test](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [vsce](https://github.com/microsoft/vscode-vsce)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details
