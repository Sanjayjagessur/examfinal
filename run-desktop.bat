@echo off
echo Starting Jagesaurus Desktop Application...
echo.

echo Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo Starting Electron desktop application...
call npx electron build/electron.js

pause
