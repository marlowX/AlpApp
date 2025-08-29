@echo off
echo ========================================
echo   PELNY RESTART APLIKACJI ALPAPP
echo ========================================
echo.

echo [1] Zabijam wszystkie procesy Node.js...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo    ✓ Procesy Node.js zatrzymane
) else (
    echo    ✓ Brak uruchomionych procesów Node.js
)

timeout /t 2 /nobreak >nul

echo.
echo [2] Sprawdzam instalację pakietów...
cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

if not exist "node_modules" (
    echo    ! Brak node_modules - instaluję pakiety...
    call npm install
) else (
    echo    ✓ Pakiety już zainstalowane
)

echo.
echo [3] Uruchamiam backend (port 5001)...
start "Backend ZKO Service" cmd /k "cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service && npm run dev"

echo    Czekam na uruchomienie backendu...
timeout /t 5 /nobreak >nul

echo.
echo [4] Uruchamiam frontend (port 3001)...
start "Frontend AlpApp" cmd /k "cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp && npm run dev"

echo.
echo ========================================
echo   APLIKACJA URUCHOMIONA!
echo ========================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:3001
echo Health:   http://localhost:5001/health
echo.
echo Aby zatrzymać, zamknij okna lub użyj Ctrl+C
echo.
pause