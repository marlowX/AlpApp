@echo off
echo ========================================
echo   RESTART SERWERA ZKO (BEZPIECZNY)
echo ========================================
echo.

echo [1] Szukam procesow ZKO na portach 3001 i 5001...
echo ----------------------------------------

REM Znajdz PID procesu na porcie 3001 (frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    set PID_3001=%%a
)

REM Znajdz PID procesu na porcie 5001 (backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    set PID_5001=%%a
)

REM Zabij tylko procesy ZKO
if defined PID_3001 (
    echo    Znaleziono frontend na porcie 3001 (PID: %PID_3001%)
    taskkill /PID %PID_3001% /F >nul 2>&1
    echo    ✓ Frontend zatrzymany
) else (
    echo    ✓ Frontend nie byl uruchomiony
)

if defined PID_5001 (
    echo    Znaleziono backend na porcie 5001 (PID: %PID_5001%)
    taskkill /PID %PID_5001% /F >nul 2>&1
    echo    ✓ Backend zatrzymany
) else (
    echo    ✓ Backend nie byl uruchomiony
)

echo.
echo [2] Czekam 2 sekundy na zwolnienie portow...
timeout /t 2 /nobreak >nul

echo.
echo [3] Czyszczenie cache...
if exist "node_modules\.cache" (
    rd /s /q "node_modules\.cache" 2>nul
    echo    ✓ Cache wyczyszczony
) else (
    echo    ✓ Brak cache do wyczyszczenia
)

echo.
echo [4] Uruchamiam serwer ZKO...
echo ----------------------------------------
cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp
echo Katalog: %CD%
echo.

echo Uruchamiam: npm run dev
echo (Frontend: http://localhost:3001)
echo (Backend:  http://localhost:5001)
echo.
echo Nacisnij Ctrl+C aby zatrzymac serwer
echo ========================================
echo.

npm run dev