import * as vscode from 'vscode';
import { ServerInfo } from '../tree/ServerTreeProvider';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private scenarioBarItem: vscode.StatusBarItem;
  private portBarItem: vscode.StatusBarItem;

  constructor() {
    // Main status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.name = 'Schemock Server Status';
    this.statusBarItem.command = 'schemock.stop';

    // Scenario status bar item
    this.scenarioBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    this.scenarioBarItem.name = 'Schemock Scenario';
    this.scenarioBarItem.command = 'schemock.switchScenario';

    // Port status bar item
    this.portBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      98
    );
    this.portBarItem.name = 'Schemock Port';
    this.portBarItem.command = 'schemock.openPlayground';
  }

  update(servers: ServerInfo[]): void {
    if (servers.length === 0) {
      this.hideAll();
      return;
    }

    const runningServers = servers.filter(s => s.status === 'running');

    if (runningServers.length === 0) {
      this.statusBarItem.text = '$(circle-slash) Schemock';
      this.statusBarItem.tooltip = 'No servers running';
      this.statusBarItem.show();
      this.scenarioBarItem.hide();
      this.portBarItem.hide();
    } else if (runningServers.length === 1) {
      const server = runningServers[0];
      this.statusBarItem.text = '$(rocket) Schemock';
      this.statusBarItem.tooltip = `Server running on port ${server.port}\nClick to stop`;
      this.statusBarItem.show();

      this.scenarioBarItem.text = `$(symbol-misc) ${this.formatScenario(server.scenario)}`;
      this.scenarioBarItem.tooltip = `Current scenario: ${server.scenario}\nClick to switch`;
      this.scenarioBarItem.show();

      this.portBarItem.text = `$(server) :${server.port}`;
      this.portBarItem.tooltip = `Server running on port ${server.port}\nClick to open playground`;
      this.portBarItem.show();
    } else {
      // Multiple servers running
      this.statusBarItem.text = `$(rocket) Schemock (${runningServers.length})`;
      this.statusBarItem.tooltip = `${runningServers.length} servers running\nClick to stop all`;
      this.statusBarItem.command = 'schemock.stopAll';
      this.statusBarItem.show();

      this.scenarioBarItem.text = `$(symbol-misc) Multiple`;
      this.scenarioBarItem.tooltip = 'Multiple scenarios active';
      this.scenarioBarItem.show();

      const ports = runningServers.map(s => s.port).join(', ');
      this.portBarItem.text = `$(server) :${ports}`;
      this.portBarItem.tooltip = `Servers on ports: ${ports}`;
      this.portBarItem.show();
    }

    // Set context for conditional UI elements
    vscode.commands.executeCommand(
      'setContext',
      'schemock:serverRunning',
      runningServers.length > 0
    );
  }

  hideAll(): void {
    this.statusBarItem.hide();
    this.scenarioBarItem.hide();
    this.portBarItem.hide();
    vscode.commands.executeCommand('setContext', 'schemock:serverRunning', false);
  }

  dispose(): void {
    this.statusBarItem.dispose();
    this.scenarioBarItem.dispose();
    this.portBarItem.dispose();
  }

  private formatScenario(scenario: string): string {
    const scenarios: { [key: string]: string } = {
      'happy-path': 'Happy',
      'slow': 'Slow',
      'error-heavy': 'Errors',
      'sad-path': 'Sad'
    };
    return scenarios[scenario] || scenario;
  }
}
