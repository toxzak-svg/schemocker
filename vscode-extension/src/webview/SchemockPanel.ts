import * as vscode from 'vscode';

export class SchemockPanel {
  public static currentPanel: SchemockPanel | undefined;
  public static readonly viewType = 'schemock.panel';

  public readonly webview: vscode.Webview;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SchemockPanel.currentPanel) {
      SchemockPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      SchemockPanel.viewType,
      'Schemock Control Panel',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media')
        ]
      }
    );

    SchemockPanel.currentPanel = new SchemockPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this.webview = panel.webview;

    // Set the webview's initial HTML content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'startServer':
            vscode.commands.executeCommand('schemock.start', message.schemaPath);
            return;
          case 'stopServer':
            vscode.commands.executeCommand('schemock.stop');
            return;
          case 'restartServer':
            vscode.commands.executeCommand('schemock.restart');
            return;
          case 'openPlayground':
            vscode.commands.executeCommand('schemock.openPlayground');
            return;
          case 'switchScenario':
            vscode.commands.executeCommand('schemock.switchScenario', message.scenario);
            return;
          case 'startAll':
            vscode.commands.executeCommand('schemock.startAll');
            return;
          case 'stopAll':
            vscode.commands.executeCommand('schemock.stopAll');
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    SchemockPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Schemock Control Panel';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Schemock Control Panel</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--vscode-textLink-foreground);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    h2 {
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 12px 0;
      color: var(--vscode-editor-foreground);
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
    }

    .section {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .status-indicator.running {
      background-color: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-background);
    }

    .status-indicator.stopped {
      background-color: var(--vscode-testing-iconFailed);
      color: var(--vscode-editor-background);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .info-item {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 12px;
      border-radius: 6px;
    }

    .info-label {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-editor-foreground);
    }

    .button-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    button:active {
      transform: translateY(0);
    }

    .btn-primary {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .btn-danger {
      background-color: var(--vscode-errorBackground);
      color: var(--vscode-errorForeground);
    }

    .btn-danger:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .select-wrapper {
      position: relative;
      margin-bottom: 16px;
    }

    select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background-color: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      font-size: 14px;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 30px;
    }

    select:focus {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }

    .scenario-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .scenario-badge.happy-path {
      background-color: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-background);
    }

    .scenario-badge.slow {
      background-color: var(--vscode-editorWarning-foreground);
      color: var(--vscode-editor-background);
    }

    .scenario-badge.error-heavy {
      background-color: var(--vscode-errorForeground);
      color: var(--vscode-editor-background);
    }

    .scenario-badge.sad-path {
      background-color: var(--vscode-editorInfo-foreground);
      color: var(--vscode-editor-background);
    }

    .server-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .server-item {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .server-info {
      flex: 1;
      min-width: 200px;
    }

    .server-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .server-url {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .server-actions {
      display: flex;
      gap: 8px;
    }

    .server-actions button {
      padding: 6px 12px;
      font-size: 12px;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }

    .quick-action-card {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .quick-action-card:hover {
      border-color: var(--vscode-focusBorder);
      transform: translateY(-2px);
    }

    .quick-action-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .quick-action-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .quick-action-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state-text {
      font-size: 16px;
      margin-bottom: 8px;
    }

    .empty-state-subtext {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <span>🚀</span>
      Schemock Control Panel
    </h1>

    <div class="section">
      <div class="status-indicator stopped">
        <div class="status-dot"></div>
        <span id="serverStatus">Server Stopped</span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Port</div>
          <div class="info-value" id="serverPort">-</div>
        </div>
        <div class="info-item">
          <div class="info-label">Scenario</div>
          <div class="info-value">
            <span class="scenario-badge happy-path" id="currentScenario">Happy Path</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Schema</div>
          <div class="info-value" id="currentSchema">None</div>
        </div>
      </div>

      <div class="button-group">
        <button class="btn-primary" onclick="sendMessage('startServer')">
          <span>▶</span> Start Server
        </button>
        <button class="btn-danger" onclick="sendMessage('stopServer')">
          <span>⏹</span> Stop Server
        </button>
        <button class="btn-secondary" onclick="sendMessage('restartServer')">
          <span>↻</span> Restart
        </button>
        <button class="btn-secondary" onclick="sendMessage('openPlayground')">
          <span>🌐</span> Open Playground
        </button>
      </div>
    </div>

    <div class="section">
      <h2>Scenario Selection</h2>
      <div class="select-wrapper">
        <select id="scenarioSelect" onchange="sendMessage('switchScenario', this.value)">
          <option value="happy-path">Happy Path (Normal operation)</option>
          <option value="slow">Slow (Simulate network delays)</option>
          <option value="error-heavy">Error Heavy (High error rate)</option>
          <option value="sad-path">Sad Path (Edge cases and failures)</option>
        </select>
      </div>
    </div>

    <div class="section">
      <h2>Quick Actions</h2>
      <div class="quick-actions">
        <div class="quick-action-card" onclick="sendMessage('startAll')">
          <div class="quick-action-icon">▶️</div>
          <div class="quick-action-title">Start All Servers</div>
          <div class="quick-action-description">Start all detected mock servers</div>
        </div>
        <div class="quick-action-card" onclick="sendMessage('stopAll')">
          <div class="quick-action-icon">⏹️</div>
          <div class="quick-action-title">Stop All Servers</div>
          <div class="quick-action-description">Stop all running mock servers</div>
        </div>
        <div class="quick-action-card" onclick="sendMessage('openPlayground')">
          <div class="quick-action-icon">🌐</div>
          <div class="quick-action-title">Open Playground</div>
          <div class="quick-action-description">Launch interactive API playground</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Active Servers</h2>
      <ul class="server-list" id="serverList">
        <li class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No servers running</div>
          <div class="empty-state-subtext">Start a server to see it here</div>
        </li>
      </ul>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function sendMessage(command, data = null) {
      vscode.postMessage({
        command,
        data
      });
    }

    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'serverStatus':
          updateServerStatus(message.data);
          break;
        case 'serverList':
          updateServerList(message.data);
          break;
      }
    });

    function updateServerStatus(status) {
      const statusIndicator = document.querySelector('.status-indicator');
      const statusText = document.getElementById('serverStatus');
      const portEl = document.getElementById('serverPort');
      const scenarioEl = document.getElementById('currentScenario');
      const schemaEl = document.getElementById('currentSchema');

      if (status.running) {
        statusIndicator.classList.remove('stopped');
        statusIndicator.classList.add('running');
        statusText.textContent = 'Server Running';
        portEl.textContent = status.port || '3000';
        scenarioEl.textContent = formatScenario(status.scenario);
        schemaEl.textContent = status.schema || 'Default';
      } else {
        statusIndicator.classList.remove('running');
        statusIndicator.classList.add('stopped');
        statusText.textContent = 'Server Stopped';
        portEl.textContent = '-';
        schemaEl.textContent = 'None';
      }
    }

    function updateServerList(servers) {
      const serverList = document.getElementById('serverList');

      if (!servers || servers.length === 0) {
        serverList.innerHTML = \`
          <li class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">No servers running</div>
            <div class="empty-state-subtext">Start a server to see it here</div>
          </li>
        \`;
        return;
      }

      serverList.innerHTML = servers.map(server => \`
        <li class="server-item">
          <div class="server-info">
            <div class="server-name">\${server.name}</div>
            <div class="server-url">\${server.url}</div>
          </div>
          <div class="server-actions">
            <button class="btn-secondary" onclick="sendMessage('openPlayground')">
              🌐 Open
            </button>
            <button class="btn-danger" onclick="sendMessage('stopServer')">
              ⏹ Stop
            </button>
          </div>
        </li>
      \`).join('');
    }

    function formatScenario(scenario) {
      const scenarios = {
        'happy-path': 'Happy Path',
        'slow': 'Slow',
        'error-heavy': 'Error Heavy',
        'sad-path': 'Sad Path'
      };
      return scenarios[scenario] || scenario;
    }

    // Initialize with default state
    updateServerStatus({ running: false });
  </script>
</body>
</html>`;
  }
}
