@echo off
echo ========================================
echo       AlpApp - Unified Launcher
echo ========================================
echo.

if "%1"=="help" goto help
if "%1"=="/?" goto help
if "%1"=="-h" goto help

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

if "%1"=="backend" goto backend_only
if "%1"=="frontend" goto frontend_only
if "%1"=="clean" goto clean_start
if "%1"=="debug" goto debug_start

REM Domyślnie - pełne uruchomienie
goto full_start

:help
echo Użycie: start.bat [opcja]
echo.
echo Opcje:
echo   (brak)     - Uruchom backend + frontend (domyślnie)
echo   backend    - Uruchom tylko backend (port 5001)
echo   frontend   - Uruchom tylko frontend (port 3001)
echo   clean      - Zabij procesy i uruchom od nowa
echo   debug      - Uruchom z diagnostyką portów
echo   help       - Pokaż tę pomoc
echo.
echo Przykłady:
echo   start.bat              # Pełne uruchomienie
echo   start.bat backend      # Tylko backend
echo   start.bat clean        # Restart z czyszczeniem
goto end

:backend_only
echo [BACKEND ONLY] Uruchamiam ZKO Service...
if not exist "services\zko-service\node_modules" (
    echo Instaluję dependencies dla backend...
    cd services\zko-service
    call npm install
    cd ..\..
)
start "ZKO Backend - PORT 5001" cmd /k "cd services\zko-service && npm run dev"
echo ✓ Backend uruchomiony na http://localhost:5001
goto end

:frontend_only
echo [FRONTEND ONLY] Uruchamiam ZKO App...
if not exist "apps\zko\node_modules" (
    echo Instaluję dependencies dla frontend...
    cd apps\zko
    call npm install
    cd ..\..
)
start "ZKO Frontend - PORT 3001" cmd /k "cd apps\zko && npm run dev"
echo ✓ Frontend uruchomiony na http://localhost:3001
goto end

:clean_start
echo [CLEAN START] Zabijam stare procesy...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ Stare procesy zabite
) else (
    echo ✓ Brak starych procesów
)
timeout /t 2 /nobreak >nul
goto full_start

:debug_start
echo [DEBUG] Sprawdzam porty...
echo Port 5001 (backend):
netstat -ano | findstr :5001 | findstr LISTENING
echo Port 3001 (frontend):
netstat -ano | findstr :3001 | findstr LISTENING
echo.
echo Kontynuuje uruchomienie...
timeout /t 3 /nobreak >nul
goto full_start

:full_start
echo [FULL START] Uruchamiam kompletną aplikację...

REM Sprawdź dependencies
if not exist "node_modules" (
    echo Instaluję główne dependencies...
    call pnpm install
)

echo.
echo [1/2] Uruchamiam Backend (port 5001)...
start "ZKO Backend - PORT 5001" cmd /k "cd services\zko-service && npm run dev"

echo Czekam na uruchomienie backendu...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Uruchamiam Frontend (port 3001)...
start "ZKO Frontend - PORT 3001" cmd /k "cd apps\zko && npm run dev"

echo.
echo ========================================
echo         APLIKACJA URUCHOMIONA!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend:  http://localhost:5001
echo 💚 Health:   http://localhost:5001/health
echo.
echo Otwieranie przeglądarki za 5 sekund...
timeout /t 5 /nobreak >nul
start http://localhost:3001

:end
echo.
echo Naciśnij dowolny klawisz aby zamknąć...
pause >nul