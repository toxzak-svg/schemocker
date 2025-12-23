#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Digital Signing Process');

// Configuration
const config = {
  timestampServer: 'http://timestamp.digicert.com',
  algorithm: 'SHA256',
  description: 'Schemock Mock Server',
  url: 'https://github.com/yourusername/schemock'
};

function checkPrerequisites() {
  console.log('🔍 Checking signing prerequisites...');
  
  // Check for signtool.exe (part of Windows SDK)
  try {
    execSync('signtool /?', { stdio: 'pipe' });
    console.log('✅ signtool.exe found');
  } catch (error) {
    console.error('❌ signtool.exe not found');
    console.error('Please install Windows SDK or Visual Studio with signing tools');
    console.error('Download from: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/');
    process.exit(1);
  }
  
  // Check for certificate
  const certPath = process.env.CODE_SIGNING_CERT;
  if (!certPath) {
    console.error('❌ CODE_SIGNING_CERT environment variable not set');
    console.error('Please set the path to your code signing certificate');
    process.exit(1);
  }
  
  if (!fs.existsSync(certPath)) {
    console.error(`❌ Certificate not found: ${certPath}`);
    process.exit(1);
  }
  
  console.log('✅ Certificate found');
  
  // Check for certificate password
  const certPassword = process.env.CODE_SIGNING_PASSWORD;
  if (!certPassword) {
    console.error('❌ CODE_SIGNING_PASSWORD environment variable not set');
    process.exit(1);
  }
  
  console.log('✅ All prerequisites satisfied');
}

function signExecutable(filePath, outputPath) {
  console.log(`🔐 Signing: ${filePath}`);
  
  try {
    const command = [
      'signtool',
      'sign',
      '/f', process.env.CODE_SIGNING_CERT,
      '/p', process.env.CODE_SIGNING_PASSWORD,
      '/t', config.timestampServer,
      '/a', config.algorithm,
      '/d', `"${config.description}"`,
      '/du', `"${config.url}"`,
      filePath
    ].join(' ');
    
    execSync(command, { stdio: 'inherit' });
    
    // Verify signature
    console.log('🔍 Verifying signature...');
    const verifyCommand = `signtool verify /pa "${filePath}"`;
    execSync(verifyCommand, { stdio: 'inherit' });
    
    console.log('✅ Executable signed successfully');
    
  } catch (error) {
    console.error('❌ Signing failed:', error.message);
    process.exit(1);
  }
}

function signAllExecutables(releasesDir, version) {
  console.log('📦 Signing all executables...');
  
  const versionedDir = path.join(releasesDir, `schemock-${version}`);
  
  if (!fs.existsSync(versionedDir)) {
    console.error(`❌ Release directory not found: ${versionedDir}`);
    process.exit(1);
  }
  
  // Sign main executable
  const mainExe = path.join(versionedDir, 'schemock.exe');
  if (fs.existsSync(mainExe)) {
    signExecutable(mainExe, versionedDir);
  }
  
  // Sign installer if it exists
  const installerPath = path.join(releasesDir, `Schemock-${version}-Setup.exe`);
  if (fs.existsSync(installerPath)) {
    signExecutable(installerPath, releasesDir);
  }
  
  console.log('✅ All executables signed');
}

function generateSigningReport(releasesDir, version) {
  console.log('📊 Generating signing report...');
  
  const report = {
    signingInfo: {
      timestamp: new Date().toISOString(),
      algorithm: config.algorithm,
      timestampServer: config.timestampServer,
      description: config.description,
      url: config.url
    },
    signedFiles: [],
    verificationResults: {}
  };
  
  const versionedDir = path.join(releasesDir, `schemock-${version}`);
  const filesToSign = [
    path.join(versionedDir, 'schemock.exe'),
    path.join(releasesDir, `Schemock-${version}-Setup.exe`)
  ];
  
  filesToSign.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const fileName = path.basename(filePath);
      report.signedFiles.push({
        file: fileName,
        path: filePath,
        size: fs.statSync(filePath).size
      });
      
      try {
        // Get signature info
        const result = execSync(`signtool verify /v "${filePath}"`, { encoding: 'utf8' });
        report.verificationResults[fileName] = {
          verified: true,
          details: result
        };
      } catch (error) {
        report.verificationResults[fileName] = {
          verified: false,
          error: error.message
        };
      }
    }
  });
  
  const reportPath = path.join(releasesDir, `signing-report-${version}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`✅ Signing report generated: ${reportPath}`);
}

function createUnsignedWarning(releasesDir, version) {
  console.log('⚠️  Creating unsigned version warning...');
  
  const warningContent = `# ⚠️  Unsigned Version Warning

This is an **UNSIGNED** version of Schemock ${version}.

## Security Notice

When you run this executable, Windows may show a security warning because the executable is not digitally signed. This is normal for development or unsigned releases.

## Recommendations

1. **Download Signed Version**: Always prefer signed releases from official sources
2. **Verify Source**: Only download from trusted repositories
3. **Scan for Viruses**: Run antivirus scan before execution
4. **Sandbox**: Run in isolated environment first

## Installation

To bypass the security warning (at your own risk):

1. Right-click on \`schemock.exe\`
2. Select "Properties"
3. Check "Unblock" at the bottom of the General tab
4. Click OK and run the executable

## For Production Use

For production environments, please obtain a signed version from:
https://github.com/yourusername/schemock/releases

---

Generated on: ${new Date().toISOString()}
Version: ${version}
Status: UNSIGNED
`;

  fs.writeFileSync(path.join(releasesDir, `UNSIGNED-WARNING-${version}.md`), warningContent);
  console.log('✅ Unsigned warning created');
}

function main() {
  const version = process.argv[2] || require('../package.json').version;
  const releasesDir = 'releases';
  
  console.log(`🔐 Signing Schemock ${version}\n`);
  
  // Check if we have signing credentials
  const hasSigningCert = process.env.CODE_SIGNING_CERT && process.env.CODE_SIGNING_PASSWORD;
  
  if (!hasSigningCert) {
    console.log('⚠️  No signing credentials found');
    console.log('📝 Creating unsigned warning instead...');
    createUnsignedWarning(releasesDir, version);
    console.log('✅ Processed unsigned version');
    return;
  }
  
  checkPrerequisites();
  signAllExecutables(releasesDir, version);
  generateSigningReport(releasesDir, version);
  
  console.log('\n🎉 Digital signing completed!');
  console.log('🔒 All executables are now digitally signed and verified');
}

// Run the signing process
if (require.main === module) {
  main();
}

module.exports = { main, checkPrerequisites, signExecutable };