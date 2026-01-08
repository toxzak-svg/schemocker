import * as vscode from 'vscode';
import { ServerTreeProvider, ServerInfo } from '../tree/ServerTreeProvider';

export class SchemaCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(private treeProvider: ServerTreeProvider) {}

  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    // Only provide CodeLens for JSON files
    if (document.languageId !== 'json') {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];
    const filePath = document.uri.fsPath;

    // Check if there's a server running for this schema
    const servers = this.treeProvider.getServers();
    const serverForSchema = servers.find(s => s.schemaPath === filePath);

    // Add CodeLens at the top of the file
    const startRange = new vscode.Range(0, 0, 0, 0);

    // Start/Stop server button
    if (serverForSchema && serverForSchema.status === 'running') {
      codeLenses.push(
        new vscode.CodeLens(startRange, {
          title: `⏹ Stop Server (${serverForSchema.port})`,
          command: 'schemock.stop',
          arguments: [serverForSchema.id]
        })
      );
      codeLenses.push(
        new vscode.CodeLens(startRange, {
          title: `↻ Restart Server`,
          command: 'schemock.restart',
          arguments: [serverForSchema.id]
        })
      );
      codeLenses.push(
        new vscode.CodeLens(startRange, {
          title: `🌐 Open Playground`,
          command: 'schemock.openPlayground',
          arguments: [serverForSchema.id]
        })
      );
    } else {
      codeLenses.push(
        new vscode.CodeLens(startRange, {
          title: '▶ Start Mock Server',
          command: 'schemock.start',
          arguments: [document.uri]
        })
      );
    }

    // Scenario selector (only show if server is running)
    if (serverForSchema && serverForSchema.status === 'running') {
      codeLenses.push(
        new vscode.CodeLens(startRange, {
          title: `🎭 Scenario: ${this.formatScenario(serverForSchema.scenario)}`,
          command: 'schemock.switchScenario',
          arguments: [serverForSchema.id]
        })
      );
    }

    return codeLenses;
  }

  private formatScenario(scenario: string): string {
    const scenarios: { [key: string]: string } = {
      'happy-path': 'Happy Path',
      'slow': 'Slow',
      'error-heavy': 'Error Heavy',
      'sad-path': 'Sad Path'
    };
    return scenarios[scenario] || scenario;
  }

  resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    return codeLens;
  }
}
