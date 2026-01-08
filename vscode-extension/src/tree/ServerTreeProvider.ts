import * as vscode from 'vscode';
import * as path from 'path';

export interface ServerInfo {
  id: string;
  name: string;
  port: number;
  scenario: string;
  schemaPath: string;
  status: 'running' | 'stopped';
  url: string;
}

export interface SchemaInfo {
  id: string;
  name: string;
  path: string;
  relativePath: string;
}

export class ServerTreeProvider implements vscode.TreeDataProvider<ServerTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ServerTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private servers: Map<string, ServerInfo> = new Map();
  private schemas: SchemaInfo[] = [];

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ServerTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ServerTreeItem): Thenable<ServerTreeItem[]> {
    if (!element) {
      // Root level - show servers and schemas
      const items: ServerTreeItem[] = [];

      // Add servers section
      if (this.servers.size > 0) {
        items.push(new ServerTreeItem(
          'Running Servers',
          vscode.TreeItemCollapsibleState.Expanded,
          'servers-group'
        ));
      }

      // Add schemas section
      if (this.schemas.length > 0) {
        items.push(new ServerTreeItem(
          'Schema Files',
          vscode.TreeItemCollapsibleState.Expanded,
          'schemas-group'
        ));
      }

      return Promise.resolve(items);
    }

    if (element.contextValue === 'servers-group') {
      // Show individual servers
      const serverItems = Array.from(this.servers.values()).map(server =>
        new ServerTreeItem(
          `${server.name} (${server.status === 'running' ? '●' : '○'})`,
          vscode.TreeItemCollapsibleState.None,
          'server',
          server
        )
      );
      return Promise.resolve(serverItems);
    }

    if (element.contextValue === 'schemas-group') {
      // Show individual schemas
      const schemaItems = this.schemas.map(schema =>
        new ServerTreeItem(
          schema.name,
          vscode.TreeItemCollapsibleState.None,
          'schema',
          undefined,
          schema
        )
      );
      return Promise.resolve(schemaItems);
    }

    return Promise.resolve([]);
  }

  addServer(server: ServerInfo): void {
    this.servers.set(server.id, server);
    this.refresh();
  }

  removeServer(serverId: string): void {
    this.servers.delete(serverId);
    this.refresh();
  }

  updateServer(serverId: string, updates: Partial<ServerInfo>): void {
    const server = this.servers.get(serverId);
    if (server) {
      this.servers.set(serverId, { ...server, ...updates });
      this.refresh();
    }
  }

  setSchemas(schemas: SchemaInfo[]): void {
    this.schemas = schemas;
    this.refresh();
  }

  getServers(): ServerInfo[] {
    return Array.from(this.servers.values());
  }

  getServer(serverId: string): ServerInfo | undefined {
    return this.servers.get(serverId);
  }

  getSchema(schemaPath: string): SchemaInfo | undefined {
    return this.schemas.find(s => s.path === schemaPath);
  }
}

export class ServerTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly server?: ServerInfo,
    public readonly schema?: SchemaInfo
  ) {
    super(label, collapsibleState);

    this.tooltip = this.getTooltip();
    this.iconPath = this.getIcon();
    this.command = this.getCommand();
  }

  private getTooltip(): string {
    if (this.contextValue === 'server' && this.server) {
      return `${this.server.name}\nPort: ${this.server.port}\nScenario: ${this.server.scenario}\nStatus: ${this.server.status}\nURL: ${this.server.url}`;
    }
    if (this.contextValue === 'schema' && this.schema) {
      return `${this.schema.name}\nPath: ${this.schema.relativePath}`;
    }
    return this.label;
  }

  private getIcon(): vscode.ThemeIcon | undefined {
    if (this.contextValue === 'servers-group') {
      return new vscode.ThemeIcon('server');
    }
    if (this.contextValue === 'schemas-group') {
      return new vscode.ThemeIcon('file-code');
    }
    if (this.contextValue === 'server' && this.server) {
      return this.server.status === 'running'
        ? new vscode.ThemeIcon('server', new vscode.ThemeColor('terminal.ansiGreen'))
        : new vscode.ThemeIcon('server', new vscode.ThemeColor('terminal.ansiRed'));
    }
    if (this.contextValue === 'schema') {
      return new vscode.ThemeIcon('json');
    }
    return undefined;
  }

  private getCommand(): vscode.Command | undefined {
    if (this.contextValue === 'schema' && this.schema) {
      return {
        command: 'vscode.open',
        title: 'Open Schema',
        arguments: [vscode.Uri.file(this.schema.path)]
      };
    }
    return undefined;
  }
}
