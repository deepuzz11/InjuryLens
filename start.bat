@echo off
title InjuryLens Launcher
color 0A

echo.
echo  ================================================
echo    InjuryLens - AI Movement Analysis Platform
echo  ================================================
echo.

REM ── Resolve absolute paths (no spaces issue with %~dp0) ───────────────────
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

REM ── Check venv exists ─────────────────────────────────────────────────────
if not exist "%BACKEND%\venv\Scripts\activate.bat" (
  echo  [ERROR] Python venv not found at %BACKEND%\venv
  echo  Run this inside the backend folder first:
  echo    python -m venv venv
  echo    venv\Scripts\activate
  echo    pip install -r requirements.txt
  echo.
  pause
  exit /b 1
)

REM ── Check .env exists ─────────────────────────────────────────────────────
if not exist "%BACKEND%\.env" (
  echo  [WARNING] No .env file found at %BACKEND%\.env
  echo  AI coaching will be disabled without a GEMINI_API_KEY.
  echo  Create %BACKEND%\.env with:
  echo    GEMINI_API_KEY=your_key_here
  echo.
)

REM ── Check node_modules exist ──────────────────────────────────────────────
if not exist "%FRONTEND%\node_modules" (
  echo  [ERROR] node_modules not found. Run inside the frontend folder:
  echo    npm install
  echo.
  pause
  exit /b 1
)

echo  Starting servers...
echo.

REM ── Backend window (single-line cmd to avoid quote/continuation issues) ───
start "InjuryLens  BACKEND  :8001" cmd /k "pushd "%BACKEND%" && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8001"

REM ── Frontend window ────────────────────────────────────────────────────────
start "InjuryLens  FRONTEND :5173" cmd /k "pushd "%FRONTEND%" && npm run dev"

REM ── Open browser after servers initialise ─────────────────────────────────
echo  Waiting 6 seconds for servers to start...
timeout /t 6 /nobreak >nul
start http://localhost:5173

echo.
echo  ================================================
echo   Backend  ^>  http://localhost:8001
echo   Frontend ^>  http://localhost:5173
echo  ================================================
echo.
echo  Press any key to stop all servers and close this window.
echo.
pause >nul

echo.
echo  Stopping servers...
taskkill /FI "WINDOWTITLE eq InjuryLens  BACKEND  :8001" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq InjuryLens  FRONTEND :5173" /T /F >nul 2>&1
echo  All servers stopped.
timeout /t 1 /nobreak >nul
