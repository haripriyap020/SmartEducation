@echo off
title ClassConnectAI Full Stack Launcher
echo ===================================================
echo     Launching ClassConnectAI Application
echo ===================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000...
start cmd /k "cd backend && python run.py"

echo Starting Vite React Frontend on http://localhost:5173...
start cmd /k "cd frontend && npm.cmd run dev"

echo.
echo ===================================================
echo   Both services started!
echo   Frontend: http://localhost:5173
echo   Backend API: http://127.0.0.1:8000/docs
echo ===================================================
