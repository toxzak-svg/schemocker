#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Creating Windows Installer...');

// Configuration
const config = {
  version: require('../package.json').version,
  productName: 'Schemock',
  publisher: 'Schemock Team',
  website: 'https://github.com/toxzak-svg/schemock-app',
  installerScript: 'scripts/installer.nsi',
  releasesDir: 'releases',
  distDir: 'dist'
};

function createLicenseFile() {
  console.log('📄 Creating license file...');
  
  const licenseContent = `Schemock License Agreement
========================

MIT License

Copyright (c) 2023 ${config.publisher}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

For more information, visit: ${config.website}
`;
  
  fs.writeFileSync('LICENSE.txt', licenseContent);
  console.log('✅ License file created');
}

function createIcon() {
  console.log('🎨 Creating application icon...');
  
  // For now, create a placeholder - in production, use a real icon file
  if (!fs.existsSync('icon.ico')) {
    console.log('⚠️  Warning: icon.ico not found. Using placeholder.');
    
    // Create a simple text-based placeholder (this won't work as actual icon)
    const placeholderContent = '; This is a placeholder for icon.ico file';
    fs.writeFileSync('icon.ico', placeholderContent);
  }
  
  console.log('✅ Icon file ready');
}

function runBuild() {
  console.log('🔨 Running main build process...');
  
  try {
    // Ensure build directory exists
    if (!fs.existsSync(config.releasesDir)) {
      fs.mkdirSync(config.releasesDir, { recursive: true });
    }
    
    // Run the main build script
    execSync('node scripts/build.js', { stdio: 'inherit' });
    console.log('✅ Main build completed');
  } catch (error) {
    console.error('❌ Main build failed');
    process.exit(1);
  }
}

function createInstaller() {
  console.log('📦 Creating installer with NSIS...');
  
  try {
    // Check if NSIS is available
    execSync('makensis -version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ NSIS not found. Please install NSIS:');
    console.error('   Download from: https://nsis.sourceforge.io/');
    console.error('   Or use chocolatey: choco install nsis');
    process.exit(1);
  }
  
  try {
    const versionedDir = `schemock-${config.version}`;
    const installerOutput = path.join(config.releasesDir, `Schemock-${config.version}-Setup.exe`);
    
    // Run NSIS
    const command = `makensis /DPRODUCT_VERSION=${config.version} /DPRODUCT_PUBLISHER="${config.publisher}" /DPRODUCT_WEB_SITE="${config.website}" /DOUTPUT_DIR="${config.releasesDir}" ${config.installerScript}`;
    
    execSync(command, { stdio: 'inherit' });
    
    // Move installer to releases directory if needed
    if (fs.existsSync('Schemock-Setup.exe')) {
      fs.renameSync('Schemock-Setup.exe', installerOutput);
    }
    
    console.log(`✅ Installer created: ${installerOutput}`);
    
    // Get file size
    const stats = fs.statSync(installerOutput);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📏 Installer size: ${sizeInMB} MB`);
    
  } catch (error) {
    console.error('❌ Installer creation failed');
    console.error(error.message);
    process.exit(1);
  }
}

function createPortablePackage() {
  console.log('📱 Creating portable package...');
  
  const portableDir = path.join(config.releasesDir, `schemock-${config.version}-portable`);
  
  if (fs.existsSync(portableDir)) {
    fs.rmSync(portableDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(portableDir, { recursive: true });
  
  const versionedSource = path.join(config.releasesDir, `schemock-${config.version}`);
  
  // Copy all files except installer-specific ones
  const files = fs.readdirSync(versionedSource);
  files.forEach(file => {
    if (!file.includes('installer')) {
      const sourcePath = path.join(versionedSource, file);
      const destPath = path.join(portableDir, file);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        fs.cpSync(sourcePath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  });
  
  // Create portable launcher
  const portableLauncher = `@echo off
title Schemock Portable Mode
echo Schemock Mock Server - Portable Version
echo ===================================
echo.
echo This is a portable version of Schemock.
echo No installation required.
echo.
schemock.exe %*
pause
`;
  
  fs.writeFileSync(path.join(portableDir, 'schemock-portable.bat'), portableLauncher);
  
  // Create zip archive
  const archiver = require('archiver');
  const output = fs.createWriteStream(path.join(config.releasesDir, `schemock-${config.version}-portable.zip`));
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    const sizeInMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
    console.log(`✅ Portable package created: schemock-${config.version}-portable.zip (${sizeInMB} MB)`);
  });
  
  archive.pipe(output);
  archive.directory(portableDir, false);
  archive.finalize();
}

function generateReleaseNotes() {
  console.log('📝 Generating release notes...');
  
  const releaseNotes = `# Schemock ${config.version}

## 🚀 What's New

### Features
- **Windows Executable**: Standalone executable with no dependencies required
- **Professional Installer**: NSIS-based installer with Start Menu and Desktop shortcuts
- **Portable Version**: Zip-based portable distribution
- **Complete Documentation**: Comprehensive docs including user guides and troubleshooting
- **Example Schemas**: Ready-to-use example schemas for common use cases

### Improvements
- Enhanced error handling and user feedback
- Improved performance for large schemas
- Better support for complex data structures
- Enhanced logging and debugging capabilities

### Bug Fixes
- Fixed ES module compatibility issues
- Resolved path handling on Windows
- Improved CORS configuration
- Better handling of special characters in schemas

## 📦 Installation Options

### Option 1: Installer (Recommended)
1. Download \`Schemock-${config.version}-Setup.exe\`
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Option 2: Portable
1. Download \`schemock-${config.version}-portable.zip\`
2. Extract to any folder
3. Run \`schemock-portable.bat\` or \`schemock.exe\`

## 🚀 Quick Start

After installation:

1. Open Command Prompt or PowerShell
2. Type \`schemock --help\` to see available commands
3. Start with example: \`schemock start examples/user-schema.json\`
4. Open http://localhost:3000 in your browser

## 📚 Documentation

- **Installation Guide**: \`docs/installation-setup.md\`
- **User Guide**: \`docs/user-guide.md\`
- **API Documentation**: \`docs/api-documentation.md\`
- **Technical Specs**: \`docs/technical-specifications.md\`
- **Troubleshooting**: \`docs/troubleshooting.md\`

## 🔧 System Requirements

- **OS**: Windows 10 or later (x64)
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Disk**: 100MB free space
- **Network**: Internet connection for documentation and examples

## 🐛 Bug Reports

Found an issue? Please report it at:
https://github.com/toxzak-svg/schemock-app/issues

## 📄 License

MIT License - see LICENSE.txt for details.

---

Build Date: ${new Date().toISOString()}
Version: ${config.version}
Platform: Windows x64
`;

  fs.writeFileSync(path.join(config.releasesDir, `RELEASE-NOTES-${config.version}.md`), releaseNotes);
  console.log('✅ Release notes generated');
}

function main() {
  try {
    console.log(`🎯 Building Schemock ${config.version} for Windows\n`);
    
    createLicenseFile();
    createIcon();
    runBuild();
    createInstaller();
    createPortablePackage();
    generateReleaseNotes();
    
    console.log('\n🎉 Windows distribution build completed!');
    console.log('\n📦 Generated files:');
    
    const files = fs.readdirSync(config.releasesDir)
      .filter(file => file.includes(config.version))
      .sort();
    
    files.forEach(file => {
      const filePath = path.join(config.releasesDir, file);
      const stats = fs.statSync(filePath);
      const size = stats.isDirectory() ? '<DIR>' : `${(stats.size / 1024).toFixed(1)} KB`;
      console.log(`   📁 ${file} (${size})`);
    });
    
    console.log(`\n🚀 Ready for Windows distribution!`);
    
  } catch (error) {
    console.error('\n❌ Build process failed:', error.message);
    process.exit(1);
  }
}

// Check if required modules are available
try {
  require('archiver');
} catch (error) {
  console.log('📦 Installing archiver for package creation...');
  execSync('npm install archiver --save-dev', { stdio: 'inherit' });
}

// Run the build
if (require.main === module) {
  main();
}

module.exports = { main };