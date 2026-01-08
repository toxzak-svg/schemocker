import * as vscode from 'vscode';
import { SchemockPanel } from './webview/SchemockPanel';
import { ServerTreeProvider, ServerInfo, SchemaInfo } from './tree/ServerTreeProvider';
import { SchemaCodeLensProvider } from './codelens/SchemaCodeLensProvider';
import { StatusBarManager } from './statusbar/StatusBarManager';
import { SchemaDetector } from './utils/SchemaDetector';
import { ServerManager } from './server/ServerManager';

let serverManager: ServerManager;
let schemaDetector: SchemaDetector;
let treeProvider: ServerTreeProvider;
let codeLensProvider: SchemaCodeLensProvider;
let statusBarManager: StatusBarManager;
let treeViewServers: vscode.TreeView<ServerTreeProvider>;
let treeViewSchemas: vscode.TreeView<ServerTreeProvider>;

export function activate(context: vscode.ExtensionContext) {
  console.log('Schemock extension is now active');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  // Set context for workspace availability
  vscode.commands.executeCommand(
    'setContext',
    'schemock:hasWorkspace',
    !!workspaceRoot
  );

  // Initialize managers
  serverManager = new ServerManager(workspaceRoot);
  schemaDetector = new SchemaDetector(workspaceRoot);
  treeProvider = new ServerTreeProvider(workspaceRoot);
  codeLensProvider = new SchemaCodeLensProvider(treeProvider);
  statusBarManager = new StatusBarManager();

  // Register tree views
  treeViewServers = vscode.window.createTreeView('schemockServers', {
    treeDataProvider: treeProvider as any,
    showCollapseAll: true
  });

  treeViewSchemas = vscode.window.createTreeView('schemockSchemas', {
    treeDataProvider: treeProvider as any,
    showCollapseAll: true
  });

  // Register CodeLens provider
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: 'json' },
      codeLensProvider
    )
  );

  // Set up server change notifications
  serverManager.onServersChanged((servers: ServerInfo[]) => {
    // Update tree provider
    servers.forEach(server => {
      treeProvider.addServer(server);
    });

    // Update status bar
    statusBarManager.update(servers);

    // Update CodeLens
    codeLensProvider.refresh();

    // Notify webview if open
    if (SchemockPanel.currentPanel) {
      SchemockPanel.currentPanel.webview.postMessage({
        type: 'serverList',
        data: servers
      });
    }
  });

  // Set up schema change notifications
  schemaDetector.onSchemasChanged((schemas: SchemaInfo[]) => {
    treeProvider.setSchemas(schemas);
  });

  // Initial schema detection
  schemaDetector.detectSchemas().then(schemas => {
    treeProvider.setSchemas(schemas);
  });

  // Register commands
  registerCommands(context);

  // Register disposables
  context.subscriptions.push(
    statusBarManager,
    schemaDetector,
    serverManager,
    treeViewServers,
    treeViewSchemas
  );

  // Show welcome message on first activation
  showWelcomeMessage();
}

function registerCommands(context: vscode.ExtensionContext) {
  // Start server command
  const startCommand = vscode.commands.registerCommand(
    'schemock.start',
    async (uri?: vscode.Uri) => {
      try {
        let schemaPath: string;

        if (uri) {
          schemaPath = uri.fsPath;
        } else {
          // Prompt user to select a schema file
          const file = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
              'JSON Schema': ['json'],
              'All Files': ['*']
            },
            title: 'Select a JSON schema file'
          });

          if (!file) {
            return;
          }

          schemaPath = file[0].fsPath;
        }

        // Check if server already exists for this schema
        const existingServer = serverManager.getServerBySchema(schemaPath);
        if (existingServer && existingServer.status === 'running') {
          vscode.window.showWarningMessage(
            `Server already running for ${existingServer.name} on port ${existingServer.port}`
          );
          return;
        }

        // Start server
        const server = await serverManager.startServer(schemaPath);
        vscode.window.showInformationMessage(
          `✅ Schemock server started for ${server.name} on port ${server.port}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to start server: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Stop server command
  const stopCommand = vscode.commands.registerCommand(
    'schemock.stop',
    async (serverId?: string) => {
      try {
        if (serverId) {
          serverManager.stopServer(serverId);
          vscode.window.showInformationMessage('Server stopped');
        } else {
          // Stop the most recently started server
          const servers = serverManager.getServers();
          if (servers.length === 0) {
            vscode.window.showInformationMessage('No servers running');
            return;
          }

          if (servers.length === 1) {
            serverManager.stopServer(servers[0].id);
            vscode.window.showInformationMessage('Server stopped');
          } else {
            // Let user choose which server to stop
            const selected = await vscode.window.showQuickPick(
              servers.map(s => ({
                label: `${s.name} (Port ${s.port})`,
                description: s.status === 'running' ? 'Running' : 'Stopped',
                server: s
              })),
              { placeHolder: 'Select a server to stop' }
            );

            if (selected) {
              serverManager.stopServer(selected.server.id);
              vscode.window.showInformationMessage(`${selected.server.name} stopped`);
            }
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to stop server: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Restart server command
  const restartCommand = vscode.commands.registerCommand(
    'schemock.restart',
    async (serverId?: string) => {
      try {
        if (serverId) {
          await serverManager.restartServer(serverId);
          vscode.window.showInformationMessage('Server restarted');
        } else {
          const servers = serverManager.getServers().filter(s => s.status === 'running');
          if (servers.length === 0) {
            vscode.window.showInformationMessage('No servers running');
            return;
          }

          if (servers.length === 1) {
            await serverManager.restartServer(servers[0].id);
            vscode.window.showInformationMessage('Server restarted');
          } else {
            const selected = await vscode.window.showQuickPick(
              servers.map(s => ({
                label: `${s.name} (Port ${s.port})`,
                server: s
              })),
              { placeHolder: 'Select a server to restart' }
            );

            if (selected) {
              await serverManager.restartServer(selected.server.id);
              vscode.window.showInformationMessage(`${selected.server.name} restarted`);
            }
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to restart server: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Open playground command
  const playgroundCommand = vscode.commands.registerCommand(
    'schemock.openPlayground',
    async (serverId?: string) => {
      try {
        let url: string;

        if (serverId) {
          const server = serverManager.getServer(serverId);
          if (!server) {
            vscode.window.showErrorMessage('Server not found');
            return;
          }
          url = server.url;
        } else {
          const servers = serverManager.getServers().filter(s => s.status === 'running');
          if (servers.length === 0) {
            vscode.window.showInformationMessage('No servers running');
            return;
          }

          if (servers.length === 1) {
            url = servers[0].url;
          } else {
            const selected = await vscode.window.showQuickPick(
              servers.map(s => ({
                label: `${s.name} (Port ${s.port})`,
                description: s.url,
                server: s
              })),
              { placeHolder: 'Select a server to open' }
            );

            if (!selected) {
              return;
            }
            url = selected.server.url;
          }
        }

        vscode.env.openExternal(vscode.Uri.parse(url));
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open playground: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Show panel command
  const showPanelCommand = vscode.commands.registerCommand(
    'schemock.showPanel',
    () => {
      SchemockPanel.createOrShow(context.extensionUri);
    }
  );

  // Show tree command
  const showTreeCommand = vscode.commands.registerCommand(
    'schemock.showTree',
    () => {
      vscode.commands.executeCommand('workbench.view.extension.schemock');
    }
  );

  // Switch scenario command
  const switchScenarioCommand = vscode.commands.registerCommand(
    'schemock.switchScenario',
    async (serverIdOrScenario?: string | { serverId: string; scenario: string }) => {
      try {
        let serverId: string;
        let scenario: string;

        if (serverIdOrScenario === undefined) {
          vscode.window.showWarningMessage('Please select a server first');
          return;
        }

        if (typeof serverIdOrScenario === 'string') {
          // It's a server ID, prompt for scenario
          serverId = serverIdOrScenario;
          const selected = await vscode.window.showQuickPick(
            [
              { label: 'Happy Path', description: 'Normal operation', value: 'happy-path' },
              { label: 'Slow', description: 'Simulate network delays', value: 'slow' },
              { label: 'Error Heavy', description: 'High error rate', value: 'error-heavy' },
              { label: 'Sad Path', description: 'Edge cases and failures', value: 'sad-path' }
            ],
            { placeHolder: 'Select a scenario' }
          );

          if (!selected) {
            return;
          }
          scenario = selected.value;
        } else {
          // It's an object with both serverId and scenario
          serverId = serverIdOrScenario.serverId;
          scenario = serverIdOrScenario.scenario;
        }

        serverManager.switchScenario(serverId, scenario);
        vscode.window.showInformationMessage(`Scenario switched to ${scenario}`);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to switch scenario: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Set specific scenario commands
  const setScenarioHappyPath = vscode.commands.registerCommand(
    'schemock.setScenarioHappyPath',
    async () => {
      const servers = serverManager.getServers().filter(s => s.status === 'running');
      if (servers.length === 0) {
        vscode.window.showInformationMessage('No servers running');
        return;
      }
      const serverId = servers[0].id;
      serverManager.switchScenario(serverId, 'happy-path');
    }
  );

  const setScenarioSlow = vscode.commands.registerCommand(
    'schemock.setScenarioSlow',
    async () => {
      const servers = serverManager.getServers().filter(s => s.status === 'running');
      if (servers.length === 0) {
        vscode.window.showInformationMessage('No servers running');
        return;
      }
      const serverId = servers[0].id;
      serverManager.switchScenario(serverId, 'slow');
    }
  );

  const setScenarioErrorHeavy = vscode.commands.registerCommand(
    'schemock.setScenarioErrorHeavy',
    async () => {
      const servers = serverManager.getServers().filter(s => s.status === 'running');
      if (servers.length === 0) {
        vscode.window.showInformationMessage('No servers running');
        return;
      }
      const serverId = servers[0].id;
      serverManager.switchScenario(serverId, 'error-heavy');
    }
  );

  const setScenarioSadPath = vscode.commands.registerCommand(
    'schemock.setScenarioSadPath',
    async () => {
      const servers = serverManager.getServers().filter(s => s.status === 'running');
      if (servers.length === 0) {
        vscode.window.showInformationMessage('No servers running');
        return;
      }
      const serverId = servers[0].id;
      serverManager.switchScenario(serverId, 'sad-path');
    }
  );

  // Start all servers command
  const startAllCommand = vscode.commands.registerCommand(
    'schemock.startAll',
    async () => {
      try {
        const schemas = await schemaDetector.detectSchemas();
        if (schemas.length === 0) {
          vscode.window.showInformationMessage('No schema files found');
          return;
        }

        const selected = await vscode.window.showQuickPick(
          schemas.map(s => ({
            label: s.name,
            description: s.relativePath,
            schema: s
          })),
          {
            placeHolder: 'Select schemas to start (select multiple)',
            canPickMany: true
          }
        );

        if (!selected || selected.length === 0) {
          return;
        }

        let started = 0;
        for (const item of selected) {
          try {
            await serverManager.startServer(item.schema.path);
            started++;
          } catch (error) {
            vscode.window.showWarningMessage(
              `Failed to start ${item.schema.name}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        vscode.window.showInformationMessage(`Started ${started} server(s)`);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to start servers: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Stop all servers command
  const stopAllCommand = vscode.commands.registerCommand(
    'schemock.stopAll',
    () => {
      serverManager.stopAllServers();
      vscode.window.showInformationMessage('All servers stopped');
    }
  );

  // Refresh schemas command
  const refreshSchemasCommand = vscode.commands.registerCommand(
    'schemock.refreshSchemas',
    async () => {
      await schemaDetector.refresh();
      vscode.window.showInformationMessage('Schema files refreshed');
    }
  );

  // Register all disposables
  context.subscriptions.push(
    startCommand,
    stopCommand,
    restartCommand,
    playgroundCommand,
    showPanelCommand,
    showTreeCommand,
    switchScenarioCommand,
    setScenarioHappyPath,
    setScenarioSlow,
    setScenarioErrorHeavy,
    setScenarioSadPath,
    startAllCommand,
    stopAllCommand,
    refreshSchemasCommand
  );
}

function showWelcomeMessage() {
  vscode.window.showInformationMessage(
    '🚀 Schemock extension is ready! Right-click a JSON schema file to start a mock server.',
    'Open Control Panel',
    'Learn More'
  ).then(selection => {
    if (selection === 'Open Control Panel') {
      vscode.commands.executeCommand('schemock.showPanel');
    } else if (selection === 'Learn More') {
      vscode.env.openExternal(
        vscode.Uri.parse('https://github.com/toxzak-svg/schemock-app')
      );
    }
  });
}

export function deactivate() {
  if (serverManager) {
    serverManager.dispose();
  }
  if (schemaDetector) {
    schemaDetector.dispose();
  }
}
