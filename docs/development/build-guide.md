# Schemock Build Guide

This document provides comprehensive instructions for building, testing, and deploying Schemock as a production-ready standalone executable.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10 or later (64-bit)
- **Node.js**: Version 18.x or later
- **npm**: Version 9.x or later
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk Space**: 500MB free space for build artifacts

### Development Tools
```bash
# Install dependencies
npm install

# Verify installation
npm run test
```

## Build Process

### 1. Clean Build

```bash
# Remove previous build artifacts
Remove-Item -Recurse -Force dist, releases -ErrorAction SilentlyContinue

# Clean npm cache (if needed)
npm cache clean --force
```

### 2. TypeScript Compilation

```bash
# Compile TypeScript to JavaScript
npm run build

# This will:
# - Generate UI template from source
# - Compile src/ to dist/
# - Generate type declarations
# - Output to dist/ directory
```

### 3. Run Tests

```bash
# Run full test suite with coverage
npm test

# Run specific test file
npm test -- __tests__/server-generator.test.ts

# Watch mode for development
npm run test:watch
```

### 4. Create Standalone Executable

```bash
# Build executable for Windows x64
npm run build:exe

# This creates:
# - dist/executable/schemock.exe
# - Bundles all dependencies
# - Includes Node.js runtime
# - ~50-80MB final size
```

### 5. Build Complete Release Package

```bash
# Build everything: compile, test, package, documentation
npm run build:all

# This creates in releases/schemock-1.0.0/:
# ├── schemock.exe            (Standalone executable)
# ├── README.md               (Quick start guide)
# ├── version.json            (Build metadata)
# ├── build-report.json       (Build verification)
# ├── start.bat               (Quick launch script)
# ├── help.bat                (Help launcher)
# ├── docs/                   (Full documentation)
# │   ├── installation-setup.md
# │   ├── user-guide.md
# │   ├── api-documentation.md
# │   ├── technical-specifications.md
# │   └── troubleshooting.md
# └── examples/               (Sample schemas)
#     ├── user-schema.json
#     └── product-schema.json
```

## Build Configuration

### package.json - PKG Settings

```json
{
  "pkg": {
    "scripts": "dist/**/*.js",
    "assets": [
      "package.json",
      "node_modules/chokidar/**/*",
      "node_modules/inquirer/**/*"
    ],
    "targets": ["node18-win-x64"],
    "outputPath": "dist/executable"
  }
}
```

### Key Configuration Details:

1. **scripts**: All compiled JavaScript files are bundled
2. **assets**: Runtime dependencies (chokidar, inquirer) are included
3. **targets**: Windows x64 with Node.js 18 runtime
4. **outputPath**: Final executable location

## Build Optimization

### Size Optimization

The executable is optimized for size while maintaining functionality:

- **Base size**: ~50MB (Node.js runtime)
- **Dependencies**: ~10-15MB (express, commander, etc.)
- **Assets**: ~5-10MB (chokidar, inquirer)
- **Total**: ~65-75MB

To further reduce size:

```bash
# Audit dependencies
npm ls --all

# Remove unused dependencies
npm prune --production

# Use compression (optional)
upx dist/executable/schemock.exe
```

### Performance Optimization

1. **Async Operations**: All file I/O is asynchronous
2. **Lazy Loading**: Chokidar is dynamically imported
3. **Memory Management**: Proper cleanup in event handlers
4. **Efficient Parsing**: JSON schema parsing is optimized

## Verification Steps

### 1. Verify Executable Creation

```powershell
# Check if executable exists and size
Get-Item dist\executable\schemock.exe | Select Name, Length, LastWriteTime
```

Expected output:
```
Name          Length    LastWriteTime
----          ------    -------------
schemock.exe  70000000  12/24/2025 ...
```

### 2. Test Executable

```powershell
# Test version
.\dist\executable\schemock.exe --version

# Test help
.\dist\executable\schemock.exe --help

# Test with example schema
.\dist\executable\schemock.exe start examples/user-schema.json
```

### 3. Verify All Features

```powershell
# Test server start
.\dist\executable\schemock.exe start examples/user-schema.json --port 3000

# Test in another terminal:
Invoke-WebRequest -Uri http://localhost:3000/api/data

# Test init command
.\dist\executable\schemock.exe init test-project

# Verify created files
Get-ChildItem test-project
```

## Troubleshooting

### Build Failures

#### TypeScript Compilation Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

#### PKG Bundling Errors

```bash
# Verbose output
npx pkg . --debug

# Check for missing assets
npx pkg-fetch node18-win-x64
```

### Runtime Issues

#### Missing Dependencies

If the executable reports missing modules:

1. Add to `pkg.assets` in package.json
2. Rebuild: `npm run build:exe`

#### Port Already in Use

```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <process-id> /F
```

#### File System Errors

- Ensure write permissions for output directory
- Run as administrator if needed
- Check antivirus exclusions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build executable
        run: npm run build:all
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: schemock-windows
          path: releases/schemock-*/
```

## Quality Assurance

### Pre-Release Checklist

- [ ] All tests passing (`npm test`)
- [ ] No compilation errors
- [ ] Executable builds successfully
- [ ] Version number updated in package.json
- [ ] CHANGELOG.md updated
- [ ] Documentation reviewed and updated
- [ ] Examples tested
- [ ] Security audit passed (`npm audit`)
- [ ] Performance benchmarks met

### Testing Matrix

| Test Type | Command | Success Criteria |
|-----------|---------|------------------|
| Unit Tests | `npm test` | 100% passing |
| Integration Tests | Manual | All features work |
| Performance Tests | `npm test -- performance.test.ts` | Within benchmarks |
| Security Tests | `npm test -- security.test.ts` | No vulnerabilities |

## Distribution

### Single Executable Distribution

The built executable is completely standalone and requires no installation:

1. **Package Contents**:
   - Single .exe file
   - Embedded Node.js runtime
   - All npm dependencies bundled
   - No external dependencies required

2. **Distribution Methods**:
   - Direct download (GitHub Releases)
   - ZIP archive with documentation
   - Installer (optional, using build-installer.js)

3. **User Requirements**:
   - Windows 10+ (64-bit)
   - No Node.js installation needed
   - No npm installation needed
   - Just download and run!

## Version Management

### Semantic Versioning

Schemock follows semantic versioning (MAJOR.MINOR.PATCH):

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# This automatically:
# - Updates package.json
# - Creates git tag
# - Commits version change
```

### Build Metadata

Each build generates version.json with:

```json
{
  "version": "1.0.0",
  "buildDate": "2025-12-24T...",
  "platform": "Windows x64",
  "nodeVersion": "18.5.0",
  "features": [...],
  "systemRequirements": {...}
}
```

## Support and Debugging

### Enable Debug Logging

```powershell
# Run with debug logging
.\schemock.exe start schema.json --log-level debug
```

### Collect Diagnostic Information

```powershell
# System information
Get-ComputerInfo | Select WindowsVersion, OsArchitecture

# Node.js version (if needed for dev)
node --version
npm --version

# Executable information
Get-Item .\schemock.exe | Format-List *
```

## Additional Resources

- [User Guide](docs/user-guide.md) - End user documentation
- [API Documentation](docs/api-documentation.md) - API reference
- [Technical Specifications](docs/technical-specifications.md) - Architecture details
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions

## License

MIT License - See LICENSE file for details.
