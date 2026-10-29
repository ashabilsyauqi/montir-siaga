@echo off
title Push Montir Siaga ke GitHub
color 0A
echo ========================================================
echo   PUSH MONTIR SIAGA KE GITHUB
echo   Repository: https://github.com/ashabilsyauqi/montir-siaga.git
echo ========================================================
echo.
cd /d "D:\IT-ONLY!\project-dutaglobaltech\project-montir-siaga"

echo Status Git terkini:
git status
echo.
echo Melakukan push ke origin main...
echo (Jika muncul pop-up Git Credential Manager / Browser, silakan klik Sign In / Authorize)
echo.

git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [BERHASIL] Push ke GitHub sukses!
    echo ========================================================
) else (
    echo ========================================================
    echo   [PERHATIAN] Push memerlukan autentikasi GitHub.
    echo   Silakan login via pop-up browser atau gunakan Token PAT.
    echo ========================================================
)
echo.
pause
