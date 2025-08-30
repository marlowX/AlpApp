@echo off
echo ==========================================
echo Starting ZKO Application - Full Stack
echo ==========================================
echo.

REM Przejdź do katalogu głównego
cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

REM Sprawdź czy node_modules istnieje
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install
)

REM Uruchom backend w nowym oknie
echo Starting Backend on port 5001...
start "ZKO Backend" cmd /k "cd services\zko-service && npm run dev"

REM Poczekaj 3 sekundy na start backendu
timeout /t 3 /nobreak > nul

REM Uruchom frontend w nowym oknie
echo Starting Frontend on port 3001...
start "ZKO Frontend" cmd /k "cd apps\zko && npm run dev"

REM Poczekaj na uruchomienie
timeout /t 5 /nobreak > nul

echo.
echo ==========================================
echo Application started successfully!
echo ==========================================
echo.
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:5001
echo Health:   http://localhost:5001/health
echo.
echo Press any key to open the application in browser...
pause > nul

REM Otwórz przeglądarkę
start http://localhost:3001