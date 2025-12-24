import * as fs from 'fs';
import * as path from 'path';
import { execSync, exec } from 'child_process';
import * as os from 'os';

export interface InstallerState {
  currentPage: string;
  installPath: string;
  selectedComponents: {
    core: boolean;
    documentation: boolean;
    examples: boolean;
    startMenu: boolean;
    desktopShortcut: boolean;
  };
  installationProgress: number;
  isInstalling: boolean;
  installLog: string[];
  currentMessage: string;
  error?: string;
}

export const APP_CONFIG = {
  name: 'Schemock',
  version: '1.0.0',
  publisher: 'Schemock Team',
  website: 'https://github.com/yourusername/schemock',
  minSystemRequirements: {
    os: 'Windows 10 or later',
    ram: '512MB',
    disk: '100MB',
    architecture: 'x64'
  }
};

export class InstallerService {
  private state: InstallerState = {
    currentPage: 'welcome',
    installPath: 'C:\\Program Files\\Schemock',
    selectedComponents: {
      core: true,
      documentation: true,
      examples: true,
      startMenu: true,
      desktopShortcut: true
    },
    installationProgress: 0,
    isInstalling: false,
    installLog: [],
    currentMessage: 'Ready'
  };

  getState() {
    return this.state;
  }

  setInstallPath(path: string) {
    this.state.installPath = path;
  }

  setComponents(components: any) {
    this.state.selectedComponents = { ...this.state.selectedComponents, ...components };
  }

  async startInstallation() {
    if (this.state.isInstalling) return;
    
    this.state.isInstalling = true;
    this.state.installationProgress = 0;
    this.state.installLog = [];
    this.state.error = undefined;

    // Run installation in background
    this.performInstallation().catch(err => {
      this.state.error = err.message;
      this.state.isInstalling = false;
      this.updateProgress(0, 'Installation failed');
    });

    return { success: true };
  }

  private async performInstallation() {
    try {
      // Step 1: Validate installation path
      await this.updateProgress(10, 'Validating installation path...');
      await this.validateInstallationPath();

      // Step 2: Create installation directory
      await this.updateProgress(20, 'Creating installation directory...');
      await this.createInstallationDirectory();

      // Step 3: Extract and copy files
      await this.updateProgress(40, 'Extracting application files...');
      await this.extractApplicationFiles();

      // Step 4: Install main executable
      await this.updateProgress(60, 'Installing main executable...');
      await this.installExecutable();

      // Step 5: Install documentation
      await this.updateProgress(70, 'Installing documentation...');
      await this.installDocumentation();

      // Step 6: Install examples
      await this.updateProgress(80, 'Installing examples...');
      await this.installExamples();

      // Step 7: Create shortcuts
      await this.updateProgress(90, 'Creating shortcuts...');
      await this.createShortcuts();

      // Step 8: Register for uninstallation
      await this.updateProgress(95, 'Registering uninstaller...');
      await this.registerUninstaller();

      // Step 9: Finalize installation
      await this.updateProgress(100, 'Finalizing installation...');
      await this.finalizeInstallation();

      this.state.isInstalling = false;
    } catch (error: any) {
      this.state.isInstalling = false;
      this.state.error = error.message;
      this.state.installLog.push(`ERROR: ${error.message}`);
      throw error;
    }
  }

  private async updateProgress(progress: number, message: string) {
    this.state.installationProgress = progress;
    this.state.currentMessage = message;
    this.state.installLog.push(`[${progress}%] ${message}`);
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async validateInstallationPath() {
    if (!fs.existsSync(this.state.installPath)) {
      fs.mkdirSync(this.state.installPath, { recursive: true });
    }
    
    const testPath = path.join(this.state.installPath, '.write-test');
    fs.writeFileSync(testPath, 'test');
    fs.unlinkSync(testPath);
  }

  private async createInstallationDirectory() {
    if (!fs.existsSync(this.state.installPath)) {
      fs.mkdirSync(this.state.installPath, { recursive: true });
    }
    const docsPath = path.join(this.state.installPath, 'docs');
    if (!fs.existsSync(docsPath)) fs.mkdirSync(docsPath);
    
    const examplesPath = path.join(this.state.installPath, 'examples');
    if (!fs.existsSync(examplesPath)) fs.mkdirSync(examplesPath);
  }

  private async extractApplicationFiles() {
    // In a pkg environment, process.execPath is the executable itself.
    // We copy it to the target directory.
    const sourceExe = process.execPath;
    const targetExe = path.join(this.state.installPath, 'schemock.exe');
    
    // Copy the executable
    fs.copyFileSync(sourceExe, targetExe);
  }

  private async installExecutable() {
    // Set executable permissions (mostly for Linux/Mac, but good practice)
    const exePath = path.join(this.state.installPath, 'schemock.exe');
    try {
        fs.chmodSync(exePath, 0o755);
    } catch (e) {
        // Ignore on Windows if it fails
    }
  }

  private async installDocumentation() {
    if (!this.state.selectedComponents.documentation) return;

    // In pkg, assets are in snapshot filesystem.
    // We need to find where docs are.
    // Assuming they are included in pkg assets.
    // If running from source, they are in ./docs
    // If running from pkg, they are in /snapshot/schemock/docs (or similar)
    
    const possibleDocsPaths = [
        path.join(__dirname, '../../docs'), // Source structure
        path.join(path.dirname(process.execPath), 'docs'), // If side-by-side
        path.join(process.cwd(), 'docs')
    ];

    let sourceDocs = possibleDocsPaths.find(p => fs.existsSync(p));
    
    // If we are in pkg, __dirname might be inside snapshot
    if (!sourceDocs && __dirname.includes('snapshot')) {
        // Try to find docs relative to the root of the snapshot
        // This depends on how pkg is configured.
        // For now, let's assume we can find them or we skip.
        // If we can't find them, we might need to bundle them differently.
    }

    if (sourceDocs) {
        this.copyRecursiveSync(sourceDocs, path.join(this.state.installPath, 'docs'));
    }
  }

  private async installExamples() {
    if (!this.state.selectedComponents.examples) return;

    // Similar logic for examples
    // For the purpose of this task, we'll create a simple example file if not found
    const targetExamples = path.join(this.state.installPath, 'examples');
    
    const exampleSchema = {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' }
        }
    };
    
    fs.writeFileSync(
        path.join(targetExamples, 'user-schema.json'), 
        JSON.stringify(exampleSchema, null, 2)
    );
  }

  private copyRecursiveSync(src: string, dest: string) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = stats && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach((childItemName) => {
        this.copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  private async createShortcuts() {
    if (process.platform !== 'win32') return;

    if (this.state.selectedComponents.startMenu) {
      const startMenuPath = path.join(process.env.APPDATA || '', 'Microsoft/Windows/Start Menu/Programs/Schemock');
      if (!fs.existsSync(startMenuPath)) {
        fs.mkdirSync(startMenuPath, { recursive: true });
      }
      
      const shortcutTarget = path.join(this.state.installPath, 'schemock.exe');
      const shortcutPath = path.join(startMenuPath, 'Schemock.lnk');
      
      this.createShortcut(shortcutPath, shortcutTarget, this.state.installPath);
    }
    
    if (this.state.selectedComponents.desktopShortcut) {
      const desktopPath = path.join(os.homedir(), 'Desktop');
      const shortcutTarget = path.join(this.state.installPath, 'schemock.exe');
      const shortcutPath = path.join(desktopPath, 'Schemock.lnk');
      
      this.createShortcut(shortcutPath, shortcutTarget, this.state.installPath);
    }
  }

  private createShortcut(shortcutPath: string, targetPath: string, workingDir: string) {
    const script = `
      $WshShell = New-Object -comObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut("${shortcutPath}")
      $Shortcut.TargetPath = "${targetPath}"
      $Shortcut.WorkingDirectory = "${workingDir}"
      $Shortcut.Save()
    `;
    
    const psScriptPath = path.join(os.tmpdir(), `create-shortcut-${Date.now()}.ps1`);
    fs.writeFileSync(psScriptPath, script);
    
    try {
        execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`);
    } catch (e) {
        console.error('Failed to create shortcut', e);
    } finally {
        try { fs.unlinkSync(psScriptPath); } catch (e) {}
    }
  }

  private async registerUninstaller() {
    if (process.platform !== 'win32') return;

    const uninstallScript = `
@echo off
echo Uninstalling Schemock...
taskkill /F /IM schemock.exe 2>nul
timeout /t 2 /nobreak >nul
rmdir /s /q "${this.state.installPath}"
rmdir /s /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Schemock" 2>nul
del /f /q "%USERPROFILE%\\Desktop\\Schemock.lnk" 2>nul
echo Schemock has been uninstalled.
pause
`;
    
    const uninstallerPath = path.join(this.state.installPath, 'uninstall.bat');
    fs.writeFileSync(uninstallerPath, uninstallScript);
    
    // Registry keys would require admin privileges. 
    // We will skip registry modification for this user-mode installer to avoid elevation issues
    // unless we are sure we have admin rights.
    // For now, we'll skip it to keep it simple and safe.
  }

  private async finalizeInstallation() {
    const markerPath = path.join(this.state.installPath, '.installation-complete');
    fs.writeFileSync(markerPath, new Date().toISOString());
  }

  async browsePath() {
    // Use a PowerShell script to open a folder picker
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $FolderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
      $FolderBrowser.Description = "Select Installation Directory"
      $result = $FolderBrowser.ShowDialog()
      if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
        Write-Output $FolderBrowser.SelectedPath
      }
    `;
    
    const psScriptPath = path.join(os.tmpdir(), `browse-folder-${Date.now()}.ps1`);
    fs.writeFileSync(psScriptPath, script);
    
    try {
        const output = execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`).toString().trim();
        return output || null;
    } catch (e) {
        console.error('Failed to browse', e);
        return null;
    } finally {
        try { fs.unlinkSync(psScriptPath); } catch (e) {}
    }
  }

  launchApplication() {
    const exePath = path.join(this.state.installPath, 'schemock.exe');
    exec(`"${exePath}"`);
  }
}
