# Schemock Troubleshooting Guide

## Common Issues and Solutions

This guide covers the most common issues users encounter with Schemock and provides step-by-step solutions.

## Installation Issues

### Issue: "command not found: schemock" after global installation

**Symptoms:**
```bash
schemock --version
# zsh: command not found: schemock
```

**Solutions:**

1. **Check if npm global bin directory is in PATH:**
```bash
npm config get prefix
# Add this to your PATH if not already present
```

2. **For macOS/Linux users:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="$PATH:$(npm config get prefix)/bin"
source ~/.zshrc  # or source ~/.bashrc
```

3. **For Windows users:**
```powershell
# Add npm global directory to PATH
$env:PATH += ";$(npm config get prefix)"
# Or add permanently through System Properties > Environment Variables
```

4. **Reinstall globally:**
```bash
npm uninstall -g schemock
npm install -g schemock
```

### Issue: Permission denied during installation

**Symptoms:**
```bash
npm install -g schemock
# npm ERR! Error: EACCES: permission denied
```

**Solutions:**

1. **Use Node Version Manager (nvm):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
npm install -g schemock
```

2. **Fix npm permissions (Linux/macOS):**
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

3. **Use npx instead of global installation:**
```bash
npx schemock start schema.json
```

## Server Startup Issues

### Issue: Port already in use

**Symptoms:**
```bash
schemock start --port 3000
# Error: listen EADDRINUSE :::3000
```

**Solutions:**

1. **Find and kill the process using the port:**

   **Linux/macOS:**
```bash
lsof -ti :3000 | xargs kill -9
# Or find the process manually
lsof -i :3000
kill -9 <PID>
```

   **Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. **Use a different port:**
```bash
schemock start --port 3001
# Or set environment variable
PORT=3001 schemock start
```

3. **Check if another Schemock instance is running:**
```bash
ps aux | grep schemock  # Linux/macOS
Get-Process schemock    # Windows
```

### Issue: Schema file not found

**Symptoms:**
```bash
schemock start schema.json
# ❌ Schema file not found: /path/to/schema.json
```

**Solutions:**

1. **Use absolute path:**
```bash
schemock start /full/path/to/schema.json
# Or
schemock start ./schemas/schema.json
```

2. **Check current working directory:**
```bash
pwd
ls -la
# Ensure schema file exists in current directory
```

3. **Use relative path from project root:**
```bash
cd /path/to/your/project
schemock start schemas/schema.json
```

## Schema Validation Issues

### Issue: Invalid JSON syntax in schema file

**Symptoms:**
```bash
schemock start schema.json
# ❌ Error parsing schema file: Unexpected token } in JSON at position 123
```

**Solutions:**

1. **Validate JSON syntax:**
```bash
# Using Node.js
node -e "console.log(JSON.parse(require('fs').readFileSync('schema.json', 'utf8')))"

# Using Python
python -m json.tool schema.json

# Online validators:
# - https://jsonlint.com/
# - https://jsonformatter.curiousconcept.com/
```

2. **Common JSON syntax errors to check:**
   - Trailing commas after last property
   - Missing quotes around property names
   - Missing quotes around string values
   - Unmatched brackets or braces

3. **Example of correct vs incorrect JSON:**

   **Incorrect:**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },  // Trailing comma
  }
}
```

   **Correct:**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" }
  }
}
```

### Issue: Schema validation fails

**Symptoms:**
```bash
schemock start schema.json
# ❌ Schema validation error: Invalid schema: ...
```

**Solutions:**

1. **Check required schema fields:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    // your properties here
  },
  "required": ["id", "name"]  // Ensure these properties exist
}
```

2. **Validate against JSON Schema specification:**
   - Use online validators like [jsonschemavalidator.net](https://www.jsonschemavalidator.net/)
   - Check for unsupported features

3. **Common schema issues:**
   - Invalid `type` values
   - Circular references
   - Unsupported format values
   - Invalid regular expressions in `pattern`

## Runtime Issues

### Issue: CORS errors in browser

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/data' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```

**Solutions:**

1. **Enable CORS in Schemock:**
```bash
schemock start schema.json --cors  # CORS is enabled by default
# Or ensure --no-cors is NOT used
```

2. **For custom servers, ensure CORS middleware:**
```javascript
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());  // Add this line
```

3. **Check browser network tab for detailed CORS errors**

### Issue: Slow response times

**Symptoms:**
- API calls take several seconds to respond
- Browser shows long loading times

**Solutions:**

1. **Check for intentional delays:**
```javascript
// In your route configuration
{
  path: '/api/data',
  method: 'get',
  response: { data: 'test' },
  delay: 5000  // Remove or reduce this delay
}
```

2. **Optimize complex schema generation:**
```json
{
  "type": "object",
  "properties": {
    // Avoid deeply nested structures for better performance
    "simpleArray": {
      "type": "array",
      "maxItems": 10  // Limit array size
    }
  }
}
```

3. **Check system resources:**
```bash
# Check CPU and memory usage
top  # Linux/macOS
tasklist  # Windows
```

### Issue: Memory usage keeps growing

**Symptoms:**
- Process memory increases over time
- Eventually crashes with out-of-memory error

**Solutions:**

1. **Avoid storing request data in global variables:**
```javascript
// Bad - accumulates data
const allRequests = [];
app.post('/api/data', (req, res) => {
  allRequests.push(req.body);  // This grows indefinitely
  res.json({ received: true });
});

// Good - process and discard
app.post('/api/data', (req, res) => {
  processData(req.body);  // Process without storing
  res.json({ received: true });
});
```

2. **Limit mock data generation:**
```javascript
{
  "type": "array",
  "maxItems": 100,  // Prevent huge arrays
  "items": { "type": "string" }
}
```

3. **Restart server periodically during development**

## CLI Issues

### Issue: Command line options not working

**Symptoms:**
```bash
schemock start schema.json --port 4000
# Server still starts on port 3000
```

**Solutions:**

1. **Check command syntax:**
```bash
# Correct syntax
schemock start schema.json -p 4000
schemock start schema.json --port 4000

# Ensure options come after the command
schemock --port 4000 start schema.json  # WRONG
```

2. **Update to latest version:**
```bash
npm update -g schemock
# Or
npm install -g schemock@latest
```

3. **Clear npm cache:**
```bash
npm cache clean --force
npm install -g schemock
```

### Issue: Help command not working

**Symptoms:**
```bash
schemock --help
# Shows nothing or error
```

**Solutions:**

1. **Reinstall Schemock:**
```bash
npm uninstall -g schemock
npm install -g schemock
```

2. **Check if binary is executable:**
```bash
# Linux/macOS
chmod +x $(which schemock)

# Windows - check file association
assoc .js
```

## Development Environment Issues

### Issue: TypeScript compilation errors

**Symptoms:**
```bash
npm run build
# TS2307: Cannot find module 'schemock' or its corresponding type declarations
```

**Solutions:**

1. **Install type definitions:**
```bash
npm install --save-dev @types/node
npm install schemock  # Ensure it's installed as dependency
```

2. **Check tsconfig.json configuration:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

3. **Clean and rebuild:**
```bash
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

### Issue: Tests failing

**Symptoms:**
```bash
npm test
# Test suite failed to run
```

**Solutions:**

1. **Check Jest configuration:**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts']
};
```

2. **Install missing test dependencies:**
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

3. **Check test file structure:**
```
src/
├── __tests__/
│   ├── api.test.ts
│   └── server.test.ts
├── index.ts
└── types/
    └── index.ts
```

## Performance Issues

### Issue: Large schema generation is slow

**Symptoms:**
- Complex schemas take seconds to generate
- Browser timeouts on large responses

**Solutions:**

1. **Simplify schema structure:**
```json
// Instead of deeply nested objects
{
  "type": "object",
  "properties": {
    "user": { "$ref": "#/definitions/User" }
  },
  "definitions": {
    "User": { /* user schema */ }
  }
}

// Use flat structure when possible
{
  "type": "object",
  "properties": {
    "userName": { "type": "string" },
    "userEmail": { "type": "string" }
  }
}
```

2. **Add constraints to limit data size:**
```json
{
  "type": "array",
  "maxItems": 10,  // Limit array size
  "items": {
    "type": "object",
    "properties": {
      "name": { "maxLength": 50 }  // Limit string length
    }
  }
}
```

3. **Use response caching for repeated requests:**

```javascript
const cache = new Map();

app.get('/api/expensive', (req, res) => {
  const cacheKey = JSON.stringify(req.query);
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const data = generateExpensiveData();
  cache.set(cacheKey, data);
  res.json(data);
});
```

## Debugging Tips

### Enable Debug Logging

1. **Use verbose logging:**
```bash
schemock start schema.json --log-level debug
```

2. **Add custom logging to your routes:**
```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
```

### Test Schema Separately

1. **Test schema parsing:**
```javascript
const { SchemaParser } = require('schemock');
const schema = require('./schema.json');

try {
  const mockData = SchemaParser.parse(schema);
  console.log('Generated data:', JSON.stringify(mockData, null, 2));
} catch (error) {
  console.error('Schema error:', error.message);
}
```

2. **Validate with external tools:**
```bash
# Use json-schema-validator
npm install -g json-schema-validator
json-schema-validator schema.json
```

### Network Debugging

1. **Use curl for testing:**
```bash
# Verbose curl output
curl -v http://localhost:3000/api/data

# Include headers
curl -i http://localhost:3000/api/data

# POST with data
curl -X POST -H "Content-Type: application/json" \
     -d '{"test": "data"}' \
     http://localhost:3000/api/data
```

2. **Browser DevTools:**
   - Network tab for request/response details
   - Console for JavaScript errors
   - Application tab for local storage and cookies

## Getting Help

### Community Resources

1. **GitHub Issues**: [https://github.com/yourusername/schemock/issues](https://github.com/yourusername/schemock/issues)
2. **Documentation**: Check the full documentation set
3. **Examples**: Browse the examples directory

### Creating Effective Bug Reports

When reporting issues, include:

1. **System Information:**
```bash
node --version
npm --version
schemock --version
# Operating system and version
```

2. **Minimal Reproduction:**
```javascript
// Minimal code that reproduces the issue
const { createMockServer } = require('schemock');

const schema = {
  type: 'object',
  properties: { name: { type: 'string' } }
};

const server = createMockServer(schema, { port: 3000 });
server.start();
```

3. **Error Messages:**
   - Full error stack traces
   - Console output
   - Browser console errors

4. **Steps to Reproduce:**
   - Clear, numbered steps
   - Expected vs actual behavior

### Performance Profiling

For performance issues, profile your application:

1. **Node.js profiling:**
```bash
# Start with profiling
node --prof server.js

# Analyze results
node --prof-process isolate-*.log > processed.txt
```

2. **Memory profiling:**
```bash
# Heap snapshot
node --inspect server.js
# Then use Chrome DevTools to take heap snapshots
```

3. **Browser profiling:**
   - Use Performance tab in Chrome DevTools
   - Network waterfall analysis
   - JavaScript CPU profiling

## Preventive Measures

### Best Practices

1. **Always validate schemas before use**
2. **Use version control for schema files**
3. **Test with small schemas first**
4. **Monitor memory usage during development**
5. **Use appropriate log levels in production**

### Regular Maintenance

1. **Update dependencies regularly:**
```bash
npm outdated
npm update
```

2. **Clean up old files:**
```bash
npm cache clean --force
rm -rf dist node_modules package-lock.json
npm install
```

3. **Backup schema files:**
```bash
# Git is your friend
git add schemas/
git commit -m "Update schemas"
git push origin main
```

By following these troubleshooting steps and best practices, you should be able to resolve most common issues with Schemock and maintain a smooth development experience.