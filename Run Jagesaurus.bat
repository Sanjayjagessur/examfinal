@echo off
echo Starting Jagesaurus Exam Timetable Manager...
cd /d "%~dp0"
npx electron build/electron.js
pause
