@echo off
echo ====================================
echo   ZKO Service - Backend
echo ====================================
echo.

cd /d "%~dp0services\zko-service"

echo Sprawdzanie node_modules...
if not exist "node_modules" (
    echo Instalowanie zaleznosci...
    call npm install
)

echo.
echo Uruchamianie serwera na porcie 5001...
npm run dev