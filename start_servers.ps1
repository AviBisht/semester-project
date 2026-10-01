# Flood & Emergency Response System - Start Servers Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Emergency Incident Response & Dispatch System   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$env:Path = "C:\Users\DELL\AppData\Local\Programs\nodejs;" + $env:Path

# Start backend in a separate background job or window
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "run_backend.py" -WorkingDirectory $PSScriptRoot

Start-Sleep -Seconds 2

# Start frontend Vite server
Write-Host "[2/2] Launching React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
