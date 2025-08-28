@echo off
echo ====================================
echo   Uruchamianie aplikacji AlpApp
echo ====================================
echo.

REM Uruchom backend (ZKO Service) w nowym oknie
start "ZKO Service - Backend" cmd /k "cd /d %~dp0 && call start-zko-service.bat"

REM Poczekaj 3 sekundy na uruchomienie backendu
timeout /t 3 /nobreak >nul

REM Uruchom frontend w nowym oknie
start "ZKO App - Frontend" cmd /k "cd /d %~dp0\apps\zko && npm run dev"

echo.
echo ====================================
echo   Aplikacja uruchomiona!
echo ====================================
echo.
echo Backend (API): http://localhost:5000
echo Frontend (App): http://localhost:3001
echo.
echo Nacisnij dowolny klawisz aby zamknac to okno...
pause >nul