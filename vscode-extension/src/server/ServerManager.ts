import * as vscode from 'vscode';
import * as path from 'path';
import { ServerInfo } from '../tree/ServerTreeProvider';

export class ServerManager {
  private servers: Map<string, ServerInfo> = new Map();
  private terminals: Map<string, vscode.Terminal> = new Map();
  private onServersChangedCallback: ((servers: ServerInfo[]) => void) | undefined;

  constructor(private workspaceRoot: string | undefined) {}

  async startServer(
    schemaPath: string,
    options: {
      port?: number;
      scenario?: string;
      watch?: boolean;
    } = {}
  ): Promise<ServerInfo> {
    const config = vscode.workspace.getConfiguration('schemock');
    const defaultPort = config.get<number>('defaultPort', 3000);
    const defaultScenario = config.get<string>('defaultScenario', 'happy-path');
    const watchMode = config.get<boolean>('watchMode', true);
    const enableCORS = config.get<boolean>('enableCORS', true);
    const logLevel = config.get<string>('logLevel', 'info');

    const port = options.port || defaultPort;
    const scenario = options.scenario || defaultScenario;
    const watch = options.watch !== undefined ? options.watch : watchMode;

    // Check if server already exists for this schema
    const existingServer = Array.from(this.servers.values()).find(
      s => s.schemaPath === schemaPath
    );

    if (existingServer) {
      // Update existing server
      return this.updateServer(existingServer.id, { port, scenario, status: 'running' });
    }

    // Create new server
    const serverId = this.generateServerId(schemaPath, port);
    const serverName = this.getServerName(schemaPath);

    const serverInfo: ServerInfo = {
      id: serverId,
      name: serverName,
      port,
      scenario,
      schemaPath,
      status: 'running',
      url: `http://localhost:${port}`
    };

    // Create terminal and start server
    const terminal = vscode.window.createTerminal({
      name: `Schemock: ${serverName}`,
      iconPath: new vscode.ThemeIcon('server')
    });

    // Build command
    const command = this.buildCommand(schemaPath, {
      port,
      scenario,
      watch,
      cors: enableCORS,
      logLevel
    });

    terminal.sendText(command);
    terminal.show();

    // Store server and terminal
    this.servers.set(serverId, serverInfo);
    this.terminals.set(serverId, terminal);

    // Notify listeners
    this.notifyServersChanged();

    return serverInfo;
  }

  stopServer(serverId: string): void {
    const terminal = this.terminals.get(serverId);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(serverId);
    }

    const server = this.servers.get(serverId);
    if (server) {
      this.servers.set(serverId, { ...server, status: 'stopped' });
      this.notifyServersChanged();
    }
  }

  stopAllServers(): void {
    for (const serverId of this.terminals.keys()) {
      this.stopServer(serverId);
    }
  }

  async restartServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      return;
    }

    // Stop current server
    this.stopServer(serverId);

    // Start new server with same configuration
    await this.startServer(server.schemaPath, {
      port: server.port,
      scenario: server.scenario
    });
  }

  async restartAllServers(): Promise<void> {
    const servers = Array.from(this.servers.values());
    for (const server of servers) {
      if (server.status === 'running') {
        await this.restartServer(server.id);
      }
    }
  }

  updateServer(serverId: string, updates: Partial<ServerInfo>): ServerInfo {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const updatedServer = { ...server, ...updates };
    this.servers.set(serverId, updatedServer);
    this.notifyServersChanged();

    return updatedServer;
  }

  switchScenario(serverId: string, scenario: string): void {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Update scenario in server info
    this.updateServer(serverId, { scenario });

    // Restart server with new scenario
    this.restartServer(serverId);
  }

  getServers(): ServerInfo[] {
    return Array.from(this.servers.values());
  }

  getServer(serverId: string): ServerInfo | undefined {
    return this.servers.get(serverId);
  }

  getServerBySchema(schemaPath: string): ServerInfo | undefined {
    return Array.from(this.servers.values()).find(s => s.schemaPath === schemaPath);
  }

  onServersChanged(callback: (servers: ServerInfo[]) => void): void {
    this.onServersChangedCallback = callback;
  }

  private notifyServersChanged(): void {
    if (this.onServersChangedCallback) {
      this.onServersChangedCallback(this.getServers());
    }
  }

  private generateServerId(schemaPath: string, port: number): string {
    const hash = Buffer.from(schemaPath).toString('base64').slice(0, 8);
    return `${hash}-${port}`;
  }

  private getServerName(schemaPath: string): string {
    const filename = path.basename(schemaPath, '.json');
    return filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private buildCommand(
    schemaPath: string,
    options: {
      port: number;
      scenario: string;
      watch: boolean;
      cors: boolean;
      logLevel: string;
    }
  ): string {
    const parts = ['npx schemock start'];

    parts.push(`"${schemaPath}"`);
    parts.push(`--port ${options.port}`);
    parts.push(`--scenario ${options.scenario}`);
    parts.push(`--log-level ${options.logLevel}`);

    if (options.watch) {
      parts.push('--watch');
    }

    if (!options.cors) {
      parts.push('--no-cors');
    }

    return parts.join(' ');
  }

  dispose(): void {
    // Stop all servers
    this.stopAllServers();
  }
}
