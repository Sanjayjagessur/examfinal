@echo off
echo Starting Jagesaurus Exam App...
echo.
echo Current directory: %CD%
echo.
echo Checking if Electron is available...
if exist "node_modules\.bin\electron.cmd" (
    echo Electron found, starting app...
    echo.
    node_modules\.bin\electron.cmd build\
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Error running Electron. Error code: %ERRORLEVEL%
        echo.
        echo Possible solutions:
        echo 1. Check if Windows Defender is blocking the app
        echo 2. Try running as Administrator
        echo 3. Check if antivirus is blocking execution
        echo.
    )
) else (
    echo Electron not found in node_modules\.bin\
    echo.
    echo Please run: npm install
    echo.
)
echo.
echo Press any key to exit...
pause >nul
