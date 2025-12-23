# Installation and Setup Guide

## System Requirements

### Minimum Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Disk Space**: 100MB for installation, 500MB for development

### Recommended Requirements
- **Node.js**: Latest LTS version (18.x, 20.x)
- **npm**: Latest version
- **IDE**: Visual Studio Code, WebStorm, or similar
- **Git**: For version control

## Installation Methods

### Method 1: Global Installation (Recommended for CLI usage)

Install Schemock globally to use the CLI from any directory:

```bash
npm install -g schemock
```

**Verification:**
```bash
schemock --version
# Expected output: 1.0.0

schemock --help
# Shows available commands and options
```

### Method 2: Local Installation (Recommended for development)

Install Schemock in your project:

```bash
npm install schemock --save
```

**Add to package.json scripts:**
```json
{
  "scripts": {
    "mock:start": "schemock start schemas/api.json",
    "mock:dev": "schemock start schemas/api.json --log-level debug"
  }
}
```

### Method 3: Development Installation

Clone and install from source for development:

```bash
git clone https://github.com/yourusername/schemock.git
cd schemock
npm install
npm run build
npm link
```

## Development Environment Setup

### 1. Prerequisites Installation

#### Node.js Installation

**Windows:**
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer (MSI file)
3. Follow the installation wizard
4. Restart your terminal/command prompt

**macOS:**
```bash
# Using Homebrew (recommended)
brew install node

# Using MacPorts
sudo port install nodejs18

# Using nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Linux (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### Git Installation

**Windows:**
1. Download Git from [git-scm.com](https://git-scm.com/)
2. Run the installer
3. Use Git Bash or Windows Terminal

**macOS:**
```bash
# Using Homebrew
brew install git

# Using Xcode Command Line Tools
xcode-select --install
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

### 2. Project Setup

#### Create New Project Directory

```bash
mkdir my-mock-api
cd my-mock-api
npm init -y
```

#### Install Dependencies

```bash
# Install schemock
npm install schemock

# Install development dependencies
npm install --save-dev typescript @types/node ts-node nodemon
npm install --save-dev jest @types/jest ts-jest
```

#### Initialize TypeScript Configuration

```bash
# Initialize TypeScript
npx tsc --init

# Create tsconfig.json with recommended settings
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
EOF
```

#### Initialize Jest Configuration

```bash
# Create jest.config.js
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
EOF
```

#### Create Project Structure

```bash
# Create directory structure
mkdir -p src/{generators,parsers,types,schemas}
mkdir -p schemas
mkdir -p docs
mkdir -p tests

# Create basic files
touch src/index.ts
touch README.md
touch .gitignore
```

#### Update package.json

```json
{
  "name": "my-mock-api",
  "version": "1.0.0",
  "description": "Mock API server using Schemock",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "mock:start": "schemock start schemas/api.json",
    "mock:dev": "schemock start schemas/api.json --log-level debug",
    "clean": "rm -rf dist",
    "prebuild": "npm run clean"
  },
  "keywords": ["mock", "api", "schemock"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "schemock": "^1.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.10",
    "@types/node": "^20.10.5",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.3"
  }
}
```

### 3. IDE Setup

#### Visual Studio Code

**Recommended Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

**Workspace Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

**Tasks (.vscode/tasks.json):**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build",
      "type": "npm",
      "script": "build",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "silent",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Test",
      "type": "npm",
      "script": "test",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Start Mock Server",
      "type": "npm",
      "script": "mock:start",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "dedicated"
      }
    }
  ]
}
```

#### WebStorm

**Configuration:**
1. Open Settings/Preferences
2. Navigate to Languages & Frameworks → TypeScript
3. Enable TypeScript Compiler Service
4. Set TypeScript Service directory to project node_modules
5. Configure Node.js interpreter

### 4. Git Configuration

#### .gitignore

```bash
# Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Coverage
coverage/

# Temporary files
*.tmp
*.temp

# Executable builds
dist/executable/
EOF
```

#### Git Hooks (Optional)

```bash
# Install husky for git hooks
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook for linting
npx husky add .husky/pre-commit "npm run lint"

# Add pre-push hook for testing
npx husky add .husky/pre-push "npm run test"
```

## Verification Steps

### 1. Environment Verification

```bash
# Check Node.js version
node --version
# Should be v18.0.0 or higher

# Check npm version
npm --version
# Should be 8.0.0 or higher

# Check schemock installation
schemock --version
# Should show 1.0.0
```

### 2. Project Verification

```bash
# Run build
npm run build

# Run tests
npm run test

# Start mock server
npm run mock:start
# Should output: Server running at http://localhost:3000
```

### 3. Schema Verification

Create a test schema file:

```bash
cat > schemas/test.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0, "maximum": 120 }
  },
  "required": ["id", "name", "email"]
}
EOF
```

Test the schema:

```bash
schemock start schemas/test.json --log-level debug
```

## Common Setup Issues

### Port Already in Use

```bash
# Find process using port 3000
netstat -tulpn | grep :3000  # Linux
lsof -i :3000                # macOS
netstat -ano | findstr :3000 # Windows

# Kill the process
kill -9 <PID>                # Linux/macOS
taskkill /PID <PID> /F       # Windows

# Or use a different port
schemock start --port 3001
```

### Permission Errors

```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm to avoid permission issues
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Network Issues

```bash
# Check if npm registry is accessible
npm config get registry

# Use alternative registry if needed
npm config set registry https://registry.npmjs.org/

# Clear npm cache
npm cache clean --force
```

## Advanced Setup

### Docker Setup

Create Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Create docker-compose.yml:

```yaml
version: '3.8'
services:
  mock-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./schemas:/app/schemas:ro
```

### CI/CD Setup

GitHub Actions (.github/workflows/ci.yml):

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    - run: npm run test -- --coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

## Next Steps

After successful installation and setup:

1. Review the [User Guide](./user-guide.md) for detailed usage instructions
2. Check the [API Documentation](./api-documentation.md) for advanced features
3. Visit the [Troubleshooting Guide](./troubleshooting.md) for common issues
4. Explore example schemas in the `schemas/` directory
5. Start building your mock APIs!