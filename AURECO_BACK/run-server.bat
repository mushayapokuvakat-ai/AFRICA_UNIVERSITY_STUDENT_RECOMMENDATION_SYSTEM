@echo off
title AU Unified Server (:5000)
cd /d "%~dp0"
echo =======================================================
echo   Africa University Unified Server (Port 5000)
echo =======================================================
echo Starting node src/server.js ...
node src/server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =======================================================
    echo [ERROR] Server exited with error code %ERRORLEVEL%.
    echo Check above for error details.
    echo =======================================================
    pause
)
