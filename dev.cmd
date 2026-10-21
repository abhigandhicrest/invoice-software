@echo off
setlocal
set "NODE_DIR=D:\laragon\bin\nodejs\node-v18"
set "PATH=%NODE_DIR%;%PATH%"

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found at %NODE_DIR%
  echo Install Node.js 18+ or update NODE_DIR in dev.cmd
  exit /b 1
)

echo Using Node.js:
node -v
npm -v
echo.
echo Starting Invoice Editor from %CD%
echo Frontend: http://localhost:5173
echo API:      http://localhost:5000
echo.

call npm run dev
