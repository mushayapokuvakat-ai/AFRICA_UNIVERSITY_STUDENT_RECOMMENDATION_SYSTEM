@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Africa University Student Portfolio - Live Showcase (v9 - Opportunities & Applicant Dossier)
echo ========================================================
echo   Africa University Student Portfolio ^& Recommendation
echo             LIVE PUBLIC SHOWCASE LAUNCHER (v9)
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

echo Starting showcase environment...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-public-showcase.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =======================================================
    echo Showcase launcher finished.
    echo =======================================================
    pause
)
