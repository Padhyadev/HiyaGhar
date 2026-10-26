@echo off
setlocal
cd /d "%~dp0"
title Publishing HiyaGhar Project...

echo ========================================================
echo         HIYAGHAR - ONE-CLICK PROJECT PUBLISH
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1" %*

echo.
echo ========================================================
echo Finished. Press any key to exit.
echo ========================================================
pause >nul
