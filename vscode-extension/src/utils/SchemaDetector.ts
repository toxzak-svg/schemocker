import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SchemaInfo } from '../tree/ServerTreeProvider';

export class SchemaDetector {
  private schemaDirectories: string[] = [];
  private watcher: vscode.FileSystemWatcher | undefined;
  private onSchemasChangedCallback: ((schemas: SchemaInfo[]) => void) | undefined;

  constructor(private workspaceRoot: string | undefined) {
    this.loadConfiguration();
    this.setupWatcher();
  }

  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('schemock');
    this.schemaDirectories = config.get<string[]>('schemaDirectories', ['mocks', 'examples', 'schemas']);
  }

  private setupWatcher(): void {
    if (this.workspaceRoot) {
      // Watch for changes in schema directories
      const pattern = new vscode.RelativePattern(this.workspaceRoot, '**/*.json');
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

      this.watcher.onDidCreate(() => this.refresh());
      this.watcher.onDidDelete(() => this.refresh());
      this.watcher.onDidChange(() => this.refresh());

      // Watch for configuration changes
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('schemock.schemaDirectories')) {
          this.loadConfiguration();
          this.refresh();
        }
      });
    }
  }

  async detectSchemas(): Promise<SchemaInfo[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    const schemas: SchemaInfo[] = [];
    const autoDetect = vscode.workspace.getConfiguration('schemock').get<boolean>('autoDetectSchemas', true);

    if (!autoDetect) {
      return schemas;
    }

    // Scan each configured directory
    for (const dir of this.schemaDirectories) {
      const dirPath = path.join(this.workspaceRoot, dir);

      if (fs.existsSync(dirPath)) {
        const schemasInDir = await this.scanDirectory(dirPath);
        schemas.push(...schemasInDir);
      }
    }

    return schemas;
  }

  private async scanDirectory(dirPath: string): Promise<SchemaInfo[]> {
    const schemas: SchemaInfo[] = [];

    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          const subSchemas = await this.scanDirectory(filePath);
          schemas.push(...subSchemas);
        } else if (file.endsWith('.json')) {
          // Check if it's a valid JSON schema
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const json = JSON.parse(content);

            // Basic validation - check if it has schema-like properties
            if (this.isValidSchema(json)) {
              const relativePath = path.relative(this.workspaceRoot || '', filePath);
              schemas.push({
                id: filePath,
                name: file,
                path: filePath,
                relativePath: relativePath
              });
            }
          } catch (error) {
            // Skip invalid JSON files
            continue;
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return schemas;
  }

  private isValidSchema(json: any): boolean {
    // Basic checks for JSON Schema
    if (typeof json !== 'object' || json === null) {
      return false;
    }

    // Check for common JSON Schema properties
    const schemaProperties = ['$schema', 'type', 'properties', 'definitions', 'items'];
    const hasSchemaProperty = schemaProperties.some(prop => prop in json);

    // Check for Schemock-specific properties
    const hasSchemockProperty = 'x-schemock-routes' in json;

    return hasSchemaProperty || hasSchemockProperty || json.type === 'object' || json.type === 'array';
  }

  async refresh(): Promise<void> {
    const schemas = await this.detectSchemas();
    if (this.onSchemasChangedCallback) {
      this.onSchemasChangedCallback(schemas);
    }
  }

  onSchemasChanged(callback: (schemas: SchemaInfo[]) => void): void {
    this.onSchemasChangedCallback = callback;
  }

  dispose(): void {
    if (this.watcher) {
      this.watcher.dispose();
    }
  }
}
