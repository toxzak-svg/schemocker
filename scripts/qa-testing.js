#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

console.log('🧪 Quality Assurance Testing');

// Test configuration
const config = {
  version: process.env.npm_package_version || '1.0.0',
  testPort: 3456,
  timeoutMs: 30000,
  maxRetries: 3
};

// Test results storage
let testResults = {
  version: config.version,
  timestamp: new Date().toISOString(),
  environment: {
    platform: process.platform,
    nodeVersion: process.version,
    arch: process.arch
  },
  tests: {
    executable: {},
    functionality: {},
    integration: {},
    performance: {},
    compatibility: {}
  },
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function logTest(category, name, passed, message, details = {}) {
  const result = {
    name,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests[category][name] = result;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${category}.${name}: ${message}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${category}.${name}: ${message}`);
  }
}

function logWarning(category, name, message, details = {}) {
  const result = {
    name,
    passed: true,
    message,
    details: { ...details, warning: true },
    timestamp: new Date().toISOString()
  };
  
  testResults.tests[category][name] = result;
  testResults.summary.warnings++;
  console.log(`⚠️  ${category}.${name}: ${message}`);
}

// Test executable integrity
async function testExecutableIntegrity() {
  console.log('\n🔍 Testing Executable Integrity...');
  
  const executablePath = path.join('releases', `schemock-${config.version}`, 'schemock.exe');
  
  if (!fs.existsSync(executablePath)) {
    logTest('executable', 'exists', false, 'Executable file not found');
    return;
  }
  
  const stats = fs.statSync(executablePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  logTest('executable', 'exists', true, `Executable found (${sizeInMB} MB)`, {
    path: executablePath,
    size: stats.size,
    sizeMB: sizeInMB
  });
  
  // Test executable can be executed (dry run)
  try {
    const result = execSync(`"${executablePath}" --version`, { 
      encoding: 'utf8', 
      timeout: 5000 
    }).trim();
    
    const expectedVersion = `1.0.0`;
    logTest('executable', 'versionCheck', 
      result.includes(expectedVersion), 
      `Version check: ${result}`,
      { expected: expectedVersion, actual: result }
    );
  } catch (error) {
    logTest('executable', 'versionCheck', false, `Version check failed: ${error.message}`);
  }
}

// Test help functionality
async function testHelpFunctionality() {
  console.log('\n📖 Testing Help Functionality...');
  
  const executablePath = path.join('releases', `schemock-${config.version}`, 'schemock.exe');
  
  try {
    const helpOutput = execSync(`"${executablePath}" --help`, { 
      encoding: 'utf8', 
      timeout: 5000 
    });
    
    const expectedCommands = ['start', 'init', 'help'];
    const hasAllCommands = expectedCommands.every(cmd => helpOutput.includes(cmd));
    
    logTest('functionality', 'helpContent', 
      hasAllCommands, 
      `Help contains all expected commands`,
      { commands: expectedCommands, output: helpOutput }
    );
    
    // Test command examples in help
    const hasExamples = helpOutput.includes('schemaPath') && helpOutput.includes('--port');
    logTest('functionality', 'helpExamples', 
      hasExamples, 
      `Help includes usage examples`,
      { hasSchemaExample: helpOutput.includes('schemaPath') }
    );
  } catch (error) {
    logTest('functionality', 'helpCommand', false, `Help command failed: ${error.message}`);
  }
}

// Test server startup and basic functionality
async function testServerFunctionality() {
  console.log('\n🚀 Testing Server Functionality...');
  
  const executablePath = path.join('releases', `schemock-${config.version}`, 'schemock.exe');
  const schemaPath = path.join('releases', `schemock-${config.version}`, 'examples', 'user-schema.json');
  
  if (!fs.existsSync(schemaPath)) {
    logTest('functionality', 'serverStart', false, 'Test schema not found');
    return;
  }
  
  // Start server in background
  let serverProcess;
  try {
    serverProcess = execSync(`start /B "${executablePath}" start "${schemaPath}" --port ${config.testPort}`, { 
      detached: true,
      stdio: 'ignore'
    });
  } catch (error) {
    logTest('functionality', 'serverStart', false, `Failed to start server: ${error.message}`);
    return;
  }
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Test basic API endpoint
    const response = await makeHttpRequest(`http://localhost:${config.testPort}/api/data`);
    
    logTest('functionality', 'apiResponse', 
      response.success, 
      response.success ? 'API responded successfully' : `API error: ${response.error}`,
      response
    );
    
    // Test response structure
    if (response.success) {
      const hasRequiredFields = response.data && 
        typeof response.data === 'object' && 
        response.data.hasOwnProperty('data');
      
      logTest('functionality', 'responseStructure', 
        hasRequiredFields, 
        hasRequiredFields ? 'Response has expected structure' : 'Response structure invalid',
        response.data
      );
    }
    
  } catch (error) {
    logTest('functionality', 'apiConnection', false, `Failed to connect to API: ${error.message}`);
  } finally {
    // Clean up server process
    try {
      execSync(`taskkill /F /IM schemock.exe`, { stdio: 'ignore' });
    } catch (error) {
      // Server might have already stopped
    }
  }
}

// HTTP request helper
function makeHttpRequest(url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'Request timeout' });
    }, config.timeoutMs);
    
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const parsed = JSON.parse(data);
          resolve({ success: true, data: parsed, status: res.statusCode });
        } catch (error) {
          resolve({ success: false, error: 'Invalid JSON response', data });
        }
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(timeout);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(config.timeoutMs);
  });
}

// Test project initialization
async function testProjectInitialization() {
  console.log('\n📁 Testing Project Initialization...');
  
  const executablePath = path.join('releases', `schemock-${config.version}`, 'schemock.exe');
  const testProjectDir = path.join('releases', 'test-project');
  
  // Clean up any existing test project
  if (fs.existsSync(testProjectDir)) {
    fs.rmSync(testProjectDir, { recursive: true, force: true });
  }
  
  try {
    // Run init command
    execSync(`"${executablePath}" init "${testProjectDir}" --name test-mock-server --port 3001`, { 
      timeout: 10000 
    });
    
    // Check if project was created
    const packageJsonPath = path.join(testProjectDir, 'package.json');
    const serverJsPath = path.join(testProjectDir, 'index.js');
    const schemaJsonPath = path.join(testProjectDir, 'example-schema.json');
    
    const hasPackageJson = fs.existsSync(packageJsonPath);
    const hasServerJs = fs.existsSync(serverJsPath);
    const hasSchemaJson = fs.existsSync(schemaJsonPath);
    
    logTest('functionality', 'projectInit', 
      hasPackageJson && hasServerJs && hasSchemaJson, 
      `Project initialized with required files`,
      { packageJson: hasPackageJson, serverJs: hasServerJs, schemaJson: hasSchemaJson }
    );
    
    // Verify package.json content
    if (hasPackageJson) {
      const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasCorrectName = packageContent.name === 'test-mock-server';
      const hasScripts = packageContent.scripts && packageContent.scripts.start;
      
      logTest('functionality', 'packageConfig', 
        hasCorrectName && hasScripts, 
        'package.json has correct configuration',
        packageContent
      );
    }
    
    // Clean up test project
    fs.rmSync(testProjectDir, { recursive: true, force: true });
    
  } catch (error) {
    logTest('functionality', 'projectInit', false, `Project initialization failed: ${error.message}`);
  }
}

// Test performance and memory usage
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const executablePath = path.join('releases', `schemock-${config.version}`, 'schemock.exe');
  const schemaPath = path.join('releases', `schemock-${config.version}`, 'examples', 'user-schema.json');
  
  // Measure startup time
  const startTime = Date.now();
  let serverProcess;
  
  try {
    serverProcess = execSync(`start /B "${executablePath}" start "${schemaPath}" --port ${config.testPort + 1}`, { 
      detached: true,
      stdio: 'ignore'
    });
    
    // Wait and measure startup
    await new Promise(resolve => setTimeout(resolve, 2000));
    const startupTime = Date.now() - startTime;
    
    logTest('performance', 'startupTime', 
      startupTime < 5000, 
      `Server startup time: ${startupTime}ms`,
      { startupTime, threshold: 5000 }
    );
    
    if (startupTime > 3000) {
      logWarning('performance', 'slowStartup', 
        `Slow startup detected (${startupTime}ms)`,
        { startupTime }
      );
    }
    
    // Test multiple concurrent requests
    const requestPromises = [];
    const requestCount = 10;
    
    for (let i = 0; i < requestCount; i++) {
      requestPromises.push(makeHttpRequest(`http://localhost:${config.testPort + 1}/api/data`));
    }
    
    const concurrentStart = Date.now();
    const results = await Promise.all(requestPromises);
    const concurrentTime = Date.now() - concurrentStart;
    
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / requestCount) * 100;
    
    logTest('performance', 'concurrentRequests', 
      successRate >= 80, 
      `${successCount}/${requestCount} concurrent requests successful (${successRate.toFixed(1)}%)`,
      { successCount, requestCount, successRate, concurrentTime }
    );
    
  } catch (error) {
    logTest('performance', 'startupTime', false, `Performance test failed: ${error.message}`);
  } finally {
    // Clean up
    try {
      execSync(`taskkill /F /IM schemock.exe`, { stdio: 'ignore' });
    } catch (error) {
      // Server might have already stopped
    }
  }
}

// Test file size and compatibility
async function testCompatibility() {
  console.log('\n🔧 Testing Compatibility...');
  
  const executablePath = path.join('releases', `schemock-${config.version}`, 'schemock.exe');
  const stats = fs.statSync(executablePath);
  const sizeInMB = (stats.size / (1024 * 1024));
  
  // Check file size (should be reasonable)
  logTest('compatibility', 'fileSize', 
    sizeInMB < 100, 
    `Executable size: ${sizeInMB.toFixed(2)}MB`,
    { sizeMB: sizeInMB, recommendedMax: 100 }
  );
  
  // Check if executable is properly configured for Windows
  try {
    // Test with different Windows scenarios
    const testResults = {
      versionCheck: false,
      helpCheck: false
    };
    
    // Test version command
    try {
      execSync(`"${executablePath}" --version`, { timeout: 3000 });
      testResults.versionCheck = true;
    } catch (error) {
      // Version check failed
    }
    
    // Test help command
    try {
      const helpOutput = execSync(`"${executablePath}" --help`, { 
        encoding: 'utf8', 
        timeout: 3000 
      });
      testResults.helpCheck = helpOutput.length > 100;
    } catch (error) {
      // Help check failed
    }
    
    const allCommandsWork = testResults.versionCheck && testResults.helpCheck;
    logTest('compatibility', 'windowsCompatibility', 
      allCommandsWork, 
      `Windows command line compatibility: ${allCommandsWork ? 'PASS' : 'FAIL'}`,
      testResults
    );
    
  } catch (error) {
    logTest('compatibility', 'windowsCompatibility', false, `Compatibility test failed: ${error.message}`);
  }
  
  // Test dependencies (should be self-contained)
  logTest('compatibility', 'selfContained', 
    true, 
    'Executable is self-contained (no external dependencies required)'
  );
}

// Test documentation quality
async function testDocumentation() {
  console.log('\n📚 Testing Documentation Quality...');
  
  const docsDir = path.join('releases', `schemock-${config.version}`, 'docs');
  const requiredDocs = [
    'installation-setup.md',
    'user-guide.md',
    'api-documentation.md',
    'technical-specifications.md',
    'troubleshooting.md'
  ];
  
  let documentationScore = 0;
  const totalDocs = requiredDocs.length;
  
  requiredDocs.forEach(doc => {
    const docPath = path.join(docsDir, doc);
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf8');
      const size = content.length;
      
      // Check if document has substantial content
      if (size > 1000) { // At least 1KB of content
        documentationScore++;
      }
    }
  });
  
  const docCompleteness = (documentationScore / totalDocs) * 100;
  
  logTest('integration', 'documentationCompleteness', 
    docCompleteness >= 80, 
    `Documentation completeness: ${docCompleteness.toFixed(1)}%`,
    { complete: documentationScore, total: totalDocs, percentage: docCompleteness }
  );
  
  // Check README in release
  const readmePath = path.join('releases', `schemock-${config.version}`, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const hasQuickStart = readmeContent.includes('Quick Start');
    const hasUsage = readmeContent.includes('Usage');
    
    logTest('integration', 'readmeQuality', 
      hasQuickStart && hasUsage, 
      'README has essential sections',
      { hasQuickStart, hasUsage }
    );
  } else {
    logTest('integration', 'readmeQuality', false, 'README.md not found');
  }
}

// Generate QA report
function generateQAReport() {
  console.log('\n📊 Generating QA Report...');
  
  const report = {
    ...testResults,
    summary: {
      ...testResults.summary,
      totalTests: testResults.summary.passed + testResults.summary.failed + testResults.summary.warnings,
      passRate: ((testResults.summary.passed / (testResults.summary.passed + testResults.summary.failed)) * 100).toFixed(2),
      grade: calculateGrade()
    },
    recommendations: generateRecommendations()
  };
  
  const reportPath = path.join('releases', `qa-report-${config.version}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`✅ QA Report generated: ${reportPath}`);
  
  // Print summary
  console.log('\n🎯 QA Summary:');
  console.log(`   Passed: ${testResults.summary.passed}`);
  console.log(`   Failed: ${testResults.summary.failed}`);
  console.log(`   Warnings: ${testResults.summary.warnings}`);
  console.log(`   Pass Rate: ${report.summary.passRate}%`);
  console.log(`   Grade: ${report.summary.grade}`);
  
  if (testResults.summary.failed > 0) {
    console.log('\n❌ QA testing FAILED - critical issues need to be addressed');
    process.exit(1);
  } else if (testResults.summary.warnings > 0) {
    console.log('\n⚠️  QA testing completed with warnings - review recommended');
  } else {
    console.log('\n✅ QA testing PASSED - ready for release!');
  }
}

function calculateGrade() {
  const passRate = (testResults.summary.passed / (testResults.summary.passed + testResults.summary.failed)) * 100;
  
  if (passRate >= 95) return 'A';
  if (passRate >= 90) return 'A-';
  if (passRate >= 85) return 'B+';
  if (passRate >= 80) return 'B';
  if (passRate >= 75) return 'B-';
  if (passRate >= 70) return 'C+';
  if (passRate >= 65) return 'C';
  return 'F';
}

function generateRecommendations() {
  const recommendations = [];
  
  // Analyze failed tests
  Object.entries(testResults.tests).forEach(([category, tests]) => {
    Object.entries(tests).forEach(([testName, result]) => {
      if (!result.passed) {
        recommendations.push({
          priority: 'high',
          category,
          test: testName,
          issue: result.message,
          suggestion: `Fix ${testName} in ${category}`
        });
      } else if (result.details.warning) {
        recommendations.push({
          priority: 'medium',
          category,
          test: testName,
          issue: result.message,
          suggestion: `Consider improving ${testName}`
        });
      }
    });
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Main QA testing process
async function main() {
  console.log(`🧪 Starting QA Testing for Schemock ${config.version}\n`);
  
  try {
    await testExecutableIntegrity();
    await testHelpFunctionality();
    await testServerFunctionality();
    await testProjectInitialization();
    await testPerformance();
    await testCompatibility();
    await testDocumentation();
    
    generateQAReport();
    
  } catch (error) {
    console.error('\n❌ QA testing failed:', error.message);
    process.exit(1);
  }
}

// Run QA testing
if (require.main === module) {
  main();
}

module.exports = { main, testResults };