@echo off
echo Starting Jagesaurus Exam App...
cd /d "%~dp0"
npx electron build/
pause
