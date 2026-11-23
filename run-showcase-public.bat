@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Africa University Student Portfolio - Live Public Server (v10 - Verified Tunnel, LAN & Email Sync)
echo ========================================================
echo   Africa University Student Portfolio ^& Recommendation
echo          LIVE PUBLIC SERVER ^& SHOWCASE LAUNCHER (v10)
echo ========================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js was not detected in your system PATH.
    echo Please install Node.js from https://nodejs.org/ and restart this launcher.
    echo.
    pause
    exit /b 1
)

REM Flush stale DNS cache so newly created public tunnel URLs always resolve immediately
ipconfig /flushdns >nul 2>&1

echo Starting live server and verified public tunnel on this machine...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-public-showcase.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =======================================================
    echo Showcase launcher finished.
    echo =======================================================
    pause
)
