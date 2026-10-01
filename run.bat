@echo off
title Emergency Incident System Launcher
echo ========================================================
echo   Starting Flood ^& Emergency Response System
echo ========================================================

:: Ensure portable nodejs path is included
set "PATH=C:\Users\DELL\AppData\Local\Programs\nodejs;%PATH%"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Backend - FastAPI Server" cmd /k "python run_backend.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Frontend on http://127.0.0.1:5173 ...
start "Frontend - Vite React" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:5173/

echo ========================================================
echo   System running! Press any key to exit this launcher.
echo   (The two server windows will stay open)
echo ========================================================
pause
