@echo off
title Montir Siaga — Buka Emulator Smartphone di PC
color 0A

echo ========================================================
echo   MEMBUKA SMARTPHONE EMULATOR DI PC
echo   Montir Siaga (Driver Gojek UI + Montir Dual HP)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Memeriksa Backend Server (Port 4000)...
netstat -ano | findstr :4000 | findstr LISTEN >nul
if %ERRORLEVEL% NEQ 0 (
    echo Menjalankan Backend Server di background...
    start /B node server/server.js
    timeout /t 2 /nobreak >nul
) else (
    echo Backend Server sudah aktif (OK)
)

echo.
echo [2/2] Membuka Smartphone Emulator di PC...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:4000/emulator" --window-size=980,950
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="http://localhost:4000/emulator" --window-size=980,950
) else (
    start http://localhost:4000/emulator
)

echo.
echo ========================================================
echo   [BERHASIL] Emulator Smartphone sedang berjalan di PC!
echo   URL: http://localhost:4000/emulator
echo ========================================================
echo.
timeout /t 5
