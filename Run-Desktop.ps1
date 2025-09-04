# Jagesaurus Desktop Application Launcher
Write-Host "🦕 Starting Jagesaurus Desktop Application..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules not found. Installing dependencies..." -ForegroundColor Red
    npm install
}

# Build the application
Write-Host "🔨 Building the application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please check the errors above." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Start Electron
Write-Host "🚀 Starting Electron desktop application..." -ForegroundColor Green
npx electron build/electron.js

Write-Host ""
Write-Host "👋 Application closed. Press Enter to exit." -ForegroundColor Cyan
Read-Host
