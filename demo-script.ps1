# Schemock Demo Script - Screenshot & Testing Guide
# Run this to test all features and take screenshots

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SCHEMOCK DEMO & SCREENSHOT GUIDE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This script will guide you through creating professional screenshots." -ForegroundColor Yellow
Write-Host "Have your screen recorder/screenshot tool ready!`n" -ForegroundColor Yellow

# Check if executable exists
if (-not (Test-Path ".\schemock.exe")) {
    Write-Host "❌ schemock.exe not found!" -ForegroundColor Red
    Write-Host "   Please build it first: npm run build:exe`n" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found schemock.exe`n" -ForegroundColor Green

# Function to pause for screenshots
function Pause-ForScreenshot {
    param([string]$Description)
    Write-Host "`n📸 SCREENSHOT OPPORTUNITY: $Description" -ForegroundColor Magenta
    Write-Host "   Press any key when ready to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# ========================================
# DEMO 1: Basic Help Command
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO 1: Show Help & Version" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Command: .\schemock.exe --help`n" -ForegroundColor Yellow
Start-Sleep -Seconds 2

.\schemock.exe --help

Pause-ForScreenshot "Help output showing all commands and options"

Write-Host "`nCommand: .\schemock.exe --version`n" -ForegroundColor Yellow
.\schemock.exe --version

Pause-ForScreenshot "Version information"

# ========================================
# DEMO 2: Simple User API
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO 2: Simple User API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Schema: examples\simple-user.json" -ForegroundColor Yellow
Write-Host "Command: .\schemock.exe start examples\simple-user.json`n" -ForegroundColor Yellow

Start-Sleep -Seconds 2

Write-Host "📋 Starting server... (will run for 30 seconds)" -ForegroundColor Green
Write-Host "   Open browser to: http://localhost:3000/api/data`n" -ForegroundColor Green

$job = Start-Job -ScriptBlock {
    param($exe)
    Set-Location $using:PWD
    & $exe start examples\simple-user.json
} -ArgumentList (Resolve-Path ".\schemock.exe").Path

Start-Sleep -Seconds 3

Pause-ForScreenshot "Server running - show terminal with startup message"

Write-Host "`n🌐 Test the API in your browser:" -ForegroundColor Cyan
Write-Host "   1. GET  http://localhost:3000/api/data" -ForegroundColor White
Write-Host "   2. GET  http://localhost:3000/health" -ForegroundColor White
Write-Host "`n   Or use PowerShell:" -ForegroundColor Cyan
Write-Host "   Invoke-RestMethod http://localhost:3000/api/data | ConvertTo-Json`n" -ForegroundColor White

Pause-ForScreenshot "Browser showing JSON response from /api/data"
Pause-ForScreenshot "Health check endpoint /health"

Write-Host "`nStopping server..." -ForegroundColor Yellow
Stop-Job $job
Remove-Job $job
Start-Sleep -Seconds 2

# ========================================
# DEMO 3: E-commerce API (Complex Schema)
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO 3: E-commerce Product API (Complex)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Schema: examples\ecommerce-product.json" -ForegroundColor Yellow
Write-Host "Command: .\schemock.exe start examples\ecommerce-product.json --port 3001`n" -ForegroundColor Yellow

Start-Sleep -Seconds 2

Write-Host "📋 Starting server on port 3001..." -ForegroundColor Green

$job = Start-Job -ScriptBlock {
    param($exe)
    Set-Location $using:PWD
    & $exe start examples\ecommerce-product.json --port 3001
} -ArgumentList (Resolve-Path ".\schemock.exe").Path

Start-Sleep -Seconds 3

Write-Host "`n🌐 Test the complex schema:" -ForegroundColor Cyan
Write-Host "   http://localhost:3001/api/data" -ForegroundColor White
Write-Host "`n   Notice the realistic data:" -ForegroundColor Cyan
Write-Host "   - UUIDs for id" -ForegroundColor White
Write-Host "   - Numbers with decimals for price" -ForegroundColor White
Write-Host "   - Enum values for category" -ForegroundColor White
Write-Host "   - Arrays for tags and images" -ForegroundColor White
Write-Host "   - ISO date-time for createdAt`n" -ForegroundColor White

Pause-ForScreenshot "Complex schema response showing nested objects, arrays, enums"

Write-Host "`nStopping server..." -ForegroundColor Yellow
Stop-Job $job
Remove-Job $job
Start-Sleep -Seconds 2

# ========================================
# DEMO 4: Custom Port & Log Level
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO 4: Custom Configuration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Command: .\schemock.exe start examples\social-user.json --port 8080 --log-level debug`n" -ForegroundColor Yellow

Start-Sleep -Seconds 2

$job = Start-Job -ScriptBlock {
    param($exe)
    Set-Location $using:PWD
    & $exe start examples\social-user.json --port 8080 --log-level debug
} -ArgumentList (Resolve-Path ".\schemock.exe").Path

Start-Sleep -Seconds 3

Write-Host "📋 Server running on custom port 8080 with debug logging" -ForegroundColor Green
Write-Host "   http://localhost:8080/api/data`n" -ForegroundColor White

Pause-ForScreenshot "Server with custom port and debug logging"

Write-Host "`nStopping server..." -ForegroundColor Yellow
Stop-Job $job
Remove-Job $job
Start-Sleep -Seconds 2

# ========================================
# DEMO 5: Project Initialization
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO 5: Initialize New Project" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$testDir = "test-demo-project"

if (Test-Path $testDir) {
    Write-Host "Removing old test project..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $testDir
}

Write-Host "Command: .\schemock.exe init $testDir --name 'My Demo API'`n" -ForegroundColor Yellow

.\schemock.exe init $testDir --name "My Demo API"

Pause-ForScreenshot "Project initialization output"

Write-Host "`nProject structure created:" -ForegroundColor Green
Get-ChildItem $testDir -Recurse | Select-Object FullName | Format-Table -AutoSize

Pause-ForScreenshot "Project folder structure in File Explorer"

Write-Host "`nCleaning up test project..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $testDir

# ========================================
# DEMO 6: Error Handling
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO 6: Error Handling Examples" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Example 1: File not found" -ForegroundColor Yellow
.\schemock.exe start nonexistent-file.json 2>&1

Pause-ForScreenshot "Helpful error message for missing file"

Write-Host "`nExample 2: Invalid port" -ForegroundColor Yellow
.\schemock.exe start examples\simple-user.json --port 99999 2>&1

Pause-ForScreenshot "Error handling for invalid port number"

# ========================================
# FINAL DEMO: POST Request Echo
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO 7: POST Request Echo" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Starting server for POST demo..." -ForegroundColor Yellow

$job = Start-Job -ScriptBlock {
    param($exe)
    Set-Location $using:PWD
    & $exe start examples\simple-user.json --port 3000
} -ArgumentList (Resolve-Path ".\schemock.exe").Path

Start-Sleep -Seconds 3

Write-Host "`n📋 Server ready. Testing POST request...`n" -ForegroundColor Green

$body = @{
    name = "John Doe"
    email = "john@example.com"
    message = "Testing Schemock!"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Cyan
Write-Host $body -ForegroundColor White

Write-Host "`nSending POST request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/data" -Body $body -ContentType "application/json"
    Write-Host "`nResponse:" -ForegroundColor Green
    $response | ConvertTo-Json
    
    Pause-ForScreenshot "POST request and echo response"
} catch {
    Write-Host "Error making POST request: $_" -ForegroundColor Red
}

Write-Host "`nStopping server..." -ForegroundColor Yellow
Stop-Job $job
Remove-Job $job

# ========================================
# SUMMARY & NEXT STEPS
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEMO COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ All demos completed!" -ForegroundColor Green
Write-Host "`nScreenshots you should have:" -ForegroundColor Yellow
Write-Host "  1. Help command output" -ForegroundColor White
Write-Host "  2. Version information" -ForegroundColor White
Write-Host "  3. Server startup message" -ForegroundColor White
Write-Host "  4. Simple API response in browser" -ForegroundColor White
Write-Host "  5. Health check endpoint" -ForegroundColor White
Write-Host "  6. Complex schema with nested data" -ForegroundColor White
Write-Host "  7. Custom port and debug logging" -ForegroundColor White
Write-Host "  8. Project initialization" -ForegroundColor White
Write-Host "  9. Error handling messages" -ForegroundColor White
Write-Host " 10. POST request echo" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review and optimize screenshots" -ForegroundColor White
Write-Host "  2. Create animated GIF of basic workflow" -ForegroundColor White
Write-Host "  3. Add screenshots to README.md" -ForegroundColor White
Write-Host "  4. Create GitHub release with assets" -ForegroundColor White
Write-Host "  5. See MARKETING-GUIDE.md for launch strategy" -ForegroundColor White

Write-Host "`n📚 Documentation Files:" -ForegroundColor Cyan
Write-Host "  - MARKETING-GUIDE.md   - Complete marketing strategy" -ForegroundColor White
Write-Host "  - GITHUB-SETUP.md      - Repository setup guide" -ForegroundColor White
Write-Host "  - examples/            - Demo schema files" -ForegroundColor White

Write-Host "`n🚀 Ready to launch!" -ForegroundColor Green
Write-Host ""
