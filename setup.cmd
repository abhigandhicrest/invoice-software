@echo off
setlocal
set "NODE_DIR=D:\laragon\bin\nodejs\node-v18"
set "PATH=%NODE_DIR%;%PATH%"

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found at %NODE_DIR%
  echo Install Node.js 18+ or update NODE_DIR in setup.cmd
  exit /b 1
)

echo Using Node.js:
node -v
npm -v
echo.
echo Installing dependencies...
call npm install
if errorlevel 1 exit /b 1

if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo Created server\.env from server\.env.example
)

echo.
echo Setup complete. Next, run:
echo   dev.cmd
echo.
echo MongoDB must be running before saving invoices.
echo Set MONGODB_URI in server\.env if needed.
