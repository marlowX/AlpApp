@echo off
echo ========================================
echo       AlpApp - Smart Restart
echo ========================================
echo.

if "%1"=="help" goto help
if "%1"=="/?" goto help
if "%1"=="-h" goto help

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

if "%1"=="backend" goto restart_backend
if "%1"=="frontend" goto restart_frontend
if "%1"=="clean" goto clean_restart

REM Domyślnie - restart obu serwisów
goto restart_all

:help
echo Użycie: restart.bat [opcja]
echo.
echo Opcje:
echo   (brak)     - Restart backend + frontend (domyślnie)
echo   backend    - Restart tylko backend (port 5001)
echo   frontend   - Restart tylko frontend (port 3001)
echo   clean      - Restart z czyszczeniem cache
echo   help       - Pokaż tę pomoc
echo.
echo Przykłady:
echo   restart.bat              # Pełny restart
echo   restart.bat backend      # Tylko backend
echo   restart.bat clean        # Restart z czyszczeniem
goto end

:restart_backend
echo [BACKEND RESTART] Restartuje tylko backend...
echo Zabijam procesy na porcie 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
    echo ✓ Backend zatrzymany (PID: %%a)
)
timeout /t 2 /nobreak >nul
start "ZKO Backend - PORT 5001" cmd /k "cd services\zko-service && npm run dev"
echo ✓ Backend restartowany na http://localhost:5001
goto end

:restart_frontend
echo [FRONTEND RESTART] Restartuje tylko frontend...
echo Zabijam procesy na porcie 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
    echo ✓ Frontend zatrzymany (PID: %%a)
)
timeout /t 2 /nobreak >nul
start "ZKO Frontend - PORT 3001" cmd /k "cd apps\zko && npm run dev"
echo ✓ Frontend restartowany na http://localhost:3001
goto end

:clean_restart
echo [CLEAN RESTART] Restart z czyszczeniem cache...
echo.
echo [1] Zabijam wszystkie procesy Node.js...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ Procesy Node.js zatrzymane
) else (
    echo ✓ Brak procesów do zatrzymania
)

echo.
echo [2] Czyszczenie cache...
if exist "services\zko-service\dist" rmdir /s /q "services\zko-service\dist" 2>nul
if exist "services\zko-service\.tsbuildinfo" del "services\zko-service\.tsbuildinfo" 2>nul
if exist "apps\zko\dist" rmdir /s /q "apps\zko\dist" 2>nul
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul
echo ✓ Cache wyczyszczony

timeout /t 3 /nobreak >nul
goto restart_all

:restart_all
echo [FULL RESTART] Restartuje backend + frontend...
echo.
echo [1] Zabijam procesy na portach 5001 i 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
    echo ✓ Backend zatrzymany
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
    echo ✓ Frontend zatrzymany
)

echo.
echo [2] Czekam na zwolnienie portów...
timeout /t 3 /nobreak >nul

echo.
echo [3] Uruchamiam Backend (port 5001)...
start "ZKO Backend - PORT 5001" cmd /k "cd services\zko-service && npm run dev"

echo Czekam na start backendu...
timeout /t 5 /nobreak >nul

echo.
echo [4] Uruchamiam Frontend (port 3001)...
start "ZKO Frontend - PORT 3001" cmd /k "cd apps\zko && npm run dev"

echo.
echo ========================================
echo         RESTART ZAKOŃCZONY!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend:  http://localhost:5001
echo 💚 Health:   http://localhost:5001/health

:end
echo.
echo Naciśnij dowolny klawisz aby zamknąć...
pause >nul