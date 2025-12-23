#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build configuration
const config = {
  version: process.env.npm_package_version || '1.0.0',
  buildDir: 'dist',
  executableDir: 'dist/executable',
  releaseDir: 'releases',
  packageName: 'schemock',
  productName: 'Schemock Mock Server',
  company: 'Schemock Team',
  description: 'A lightweight mock server generator from JSON schemas'
};

console.log('🚀 Starting Schemock Build Process');
console.log(`📦 Version: ${config.version}`);
console.log(`📁 Build Directory: ${config.buildDir}`);

// Clean previous builds
function cleanBuild() {
  console.log('\n🧹 Cleaning previous builds...');
  if (fs.existsSync(config.buildDir)) {
    fs.rmSync(config.buildDir, { recursive: true, force: true });
  }
  if (fs.existsSync(config.releaseDir)) {
    fs.rmSync(config.releaseDir, { recursive: true, force: true });
  }
}

// Compile TypeScript
function compileTypeScript() {
  console.log('\n📝 Compiling TypeScript...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation completed');
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
  }
}

// Run tests
function runTests() {
  console.log('\n🧪 Running tests...');
  try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('✅ All tests passed');
  } catch (error) {
    console.error('❌ Tests failed');
    process.exit(1);
  }
}

// Create executable
function createExecutable() {
  console.log('\n🏗️  Creating Windows executable...');
  try {
    execSync('npm run build:exe', { stdio: 'inherit' });
    console.log('✅ Executable created successfully');
  } catch (error) {
    console.error('❌ Executable creation failed');
    process.exit(1);
  }
}

// Create release directory structure
function createReleaseStructure() {
  console.log('\n📁 Creating release structure...');
  
  if (!fs.existsSync(config.releaseDir)) {
    fs.mkdirSync(config.releaseDir, { recursive: true });
  }

  const releaseVersionDir = path.join(config.releaseDir, `schemock-${config.version}`);
  if (fs.existsSync(releaseVersionDir)) {
    fs.rmSync(releaseVersionDir, { recursive: true, force: true });
  }
  fs.mkdirSync(releaseVersionDir, { recursive: true });

  return releaseVersionDir;
}

// Copy files to release directory
function copyReleaseFiles(releaseDir) {
  console.log('\n📋 Copying release files...');
  
  // Copy executable
  const executableSource = path.join(config.executableDir, 'schemock.exe');
  const executableDest = path.join(releaseDir, 'schemock.exe');
  fs.copyFileSync(executableSource, executableDest);

  // Copy documentation
  const docsDir = path.join(releaseDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  
  const docsFiles = [
    'installation-setup.md',
    'user-guide.md',
    'api-documentation.md',
    'technical-specifications.md',
    'troubleshooting.md'
  ];

  docsFiles.forEach(doc => {
    const sourceDoc = path.join('docs', doc);
    const destDoc = path.join(docsDir, doc);
    if (fs.existsSync(sourceDoc)) {
      fs.copyFileSync(sourceDoc, destDoc);
    }
  });

  // Copy examples and schemas
  const examplesDir = path.join(releaseDir, 'examples');
  fs.mkdirSync(examplesDir, { recursive: true });
  
  const examples = [
    {
      file: 'user-schema.json',
      content: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'User Schema',
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 0, maximum: 120 }
        },
        required: ['id', 'name', 'email']
      }
    },
    {
      file: 'product-schema.json',
      content: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Product Schema',
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 1 },
          price: { type: 'number', minimum: 0 },
          category: { type: 'string', enum: ['electronics', 'clothing', 'books'] }
        },
        required: ['id', 'name', 'price', 'category']
      }
    }
  ];

  examples.forEach(example => {
    fs.writeFileSync(
      path.join(examplesDir, example.file),
      JSON.stringify(example.content, null, 2)
    );
  });

  // Create README for release
  const readmeContent = `# Schemock ${config.version}

## Quick Start

1. Run the executable:
   \`\`\`bash
   schemock.exe start examples/user-schema.json
   \`\`\`

2. Access the mock server:
   Open http://localhost:3000 in your browser

3. View API documentation:
   Check the \`docs/\` folder for comprehensive documentation

## Features

- ✅ Generate mock APIs from JSON schemas
- ✅ Support for complex data types and relationships
- ✅ RESTful API endpoints
- ✅ Custom response generation
- ✅ Built-in CLI tools
- ✅ Cross-platform support

## Support

For detailed documentation and troubleshooting, see the \`docs/\` folder.

Version: ${config.version}
Build Date: ${new Date().toISOString()}
`;
  
  fs.writeFileSync(path.join(releaseDir, 'README.md'), readmeContent);

  console.log('✅ Release files copied successfully');
}

// Create version info file
function createVersionInfo(releaseDir) {
  console.log('\n📄 Creating version information...');
  
  const versionInfo = {
    version: config.version,
    buildDate: new Date().toISOString(),
    productName: config.productName,
    company: config.company,
    description: config.description,
    platform: 'Windows x64',
    nodeVersion: '18.5.0',
    dependencies: {
      express: '^4.18.2',
      commander: '^11.1.0',
      chalk: '^4.1.2',
      cors: '^2.8.5',
      uuid: '^9.0.1'
    },
    features: [
      'JSON Schema to Mock API Generation',
      'RESTful Endpoint Creation',
      'CLI Interface',
      'Custom Response Handlers',
      'CORS Support',
      'Request Logging',
      'Error Handling'
    ],
    systemRequirements: {
      os: 'Windows 10 or later',
      architecture: 'x64',
      memory: '512MB RAM minimum',
      disk: '100MB free space'
    }
  };

  fs.writeFileSync(
    path.join(releaseDir, 'version.json'),
    JSON.stringify(versionInfo, null, 2)
  );

  console.log('✅ Version information created');
}

// Create batch file for easy execution
function createBatchFiles(releaseDir) {
  console.log('\n⚡ Creating batch files...');
  
  // Start with default schema
  const startBatchContent = `@echo off
title Schemock Mock Server
echo Starting Schemock Mock Server...
echo.
echo Usage:
echo   schemock.exe start [schema-file.json]
echo   schemock.exe --help
echo.
echo Starting with example schema...
schemock.exe start examples/user-schema.json
pause
`;

  // Help batch file
  const helpBatchContent = `@echo off
title Schemock Help
echo Schemock Mock Server - Help
echo ==========================
echo.
schemock.exe --help
pause
`;

  fs.writeFileSync(path.join(releaseDir, 'start.bat'), startBatchContent);
  fs.writeFileSync(path.join(releaseDir, 'help.bat'), helpBatchContent);

  console.log('✅ Batch files created');
}

// Generate build report
function generateBuildReport(releaseDir) {
  console.log('\n📊 Generating build report...');
  
  const report = {
    buildInfo: {
      version: config.version,
      buildDate: new Date().toISOString(),
      buildNumber: process.env.BUILD_NUMBER || 'local',
      gitCommit: process.env.GIT_COMMIT || 'unknown',
      gitBranch: process.env.GIT_BRANCH || 'main'
    },
    files: {
      executable: 'schemock.exe',
      documentation: 'docs/',
      examples: 'examples/',
      readme: 'README.md',
      versionInfo: 'version.json'
    },
    testResults: {
      passed: true,
      coverage: 'collected during build',
      timestamp: new Date().toISOString()
    },
    checksums: {}
  };

  // Add file checksums
  const crypto = require('crypto');
  const executablePath = path.join(releaseDir, 'schemock.exe');
  if (fs.existsSync(executablePath)) {
    const fileContent = fs.readFileSync(executablePath);
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    report.checksums['schemock.exe'] = hash;
  }

  fs.writeFileSync(
    path.join(releaseDir, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('✅ Build report generated');
}

// Main build process
function main() {
  try {
    cleanBuild();
    compileTypeScript();
    runTests();
    createExecutable();
    
    const releaseDir = createReleaseStructure();
    copyReleaseFiles(releaseDir);
    createVersionInfo(releaseDir);
    createBatchFiles(releaseDir);
    generateBuildReport(releaseDir);

    console.log('\n🎉 Build completed successfully!');
    console.log(`📦 Release package created at: ${releaseDir}`);
    console.log(`📏 Package size: ${getDirectorySize(releaseDir)} bytes`);
    
    console.log('\n🚀 Ready for distribution!');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Helper function to calculate directory size
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        calculateSize(path.join(currentPath, file));
      }
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

// Run the build process
if (require.main === module) {
  main();
}

module.exports = { main, config };