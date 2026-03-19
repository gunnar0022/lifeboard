@echo off
title LifeBoard Launcher
cd /d "%~dp0"

echo.
echo  ========================================
echo   LifeBoard - Starting up...
echo  ========================================
echo.

:: ── Check ports and kill anything occupying them ──
echo [1/4] Clearing ports 8000 and 5173...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    echo       Killing process on port 8000 (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo       Killing process on port 5173 (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo       Ports clear.
echo.

:: ── Check dependencies ──
echo [2/4] Checking dependencies...

python -m uvicorn --version >nul 2>&1
if errorlevel 1 (
    echo       ERROR: uvicorn not found. Run: pip install uvicorn[standard] aiosqlite fastapi python-telegram-bot anthropic python-dotenv
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo       Installing frontend dependencies...
    cd frontend && npm install && cd ..
) else (
    echo       Frontend deps OK.
)

echo.

:: ── Start backend ──
echo [3/4] Starting backend on port 8000...
start "LifeBoard Backend" /min cmd /c "cd /d %~dp0 && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 2>&1"

:: Give backend time to initialize (DB + Telegram + schedulers)
timeout /t 5 /nobreak >nul

:: ── Start frontend ──
echo [4/4] Starting frontend on port 5173...
start "LifeBoard Frontend" /min cmd /c "cd /d %~dp0\frontend && npm run dev 2>&1"

:: Wait for frontend to be ready
timeout /t 3 /nobreak >nul

echo.
echo  ========================================
echo   LifeBoard is running!
echo.
echo   Dashboard:  http://localhost:5173
echo   API:        http://localhost:8000
echo.
echo   Backend and frontend are in minimized
echo   windows. Close them to stop the servers.
echo  ========================================
echo.

:: Open the dashboard in the default browser
start http://localhost:5173

pause
