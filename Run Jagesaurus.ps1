Write-Host "Starting Jagesaurus Exam Timetable Manager..." -ForegroundColor Green
Set-Location $PSScriptRoot
npx electron build/electron.js
