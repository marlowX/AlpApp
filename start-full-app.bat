@echo off
echo 🚀 Uruchamianie AlpApp - Frontend i Backend
echo ==========================================

REM Sprawdź czy pnpm jest dostępny
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PNPM nie jest zainstalowany. Zainstaluj przez: npm install -g pnpm
    pause
    exit /b 1
)

echo 📦 Instalowanie zależności...
call pnpm install

echo.
echo 🎯 Dostępne endpointy:
echo Frontend ZKO: http://localhost:3001
echo Backend API: http://localhost:5000
echo Health check: http://localhost:5000/health
echo.

REM Sprawdź czy porty są wolne
echo 🔍 Sprawdzanie dostępności portów...
netstat -ano | findstr :5000 >nul
if not errorlevel 1 (
    echo ⚠️  Port 5000 jest już używany!
    netstat -ano | findstr :5000
)

netstat -ano | findstr :3001 >nul
if not errorlevel 1 (
    echo ⚠️  Port 3001 jest już używany!
    netstat -ano | findstr :3001
)

echo.
echo 🚀 Uruchamianie równolegle frontend i backend...
echo 📍 Backend będzie dostępny na: http://localhost:5000
echo 📍 Frontend będzie dostępny na: http://localhost:3001

REM Uruchom backend w osobnym oknie
start "ZKO-SERVICE Backend (Port 5000)" cmd /k "cd /d services\zko-service && echo 🌟 Startowanie ZKO-SERVICE na porcie 5000... && npm run dev"

REM Poczekaj moment na uruchomienie backendu
timeout /t 5 >nul

REM Uruchom frontend w osobnym oknie
start "ZKO Frontend (Port 3001)" cmd /k "cd /d apps\zko && echo 🌟 Startowanie Frontend na porcie 3001... && npm run dev"

echo.
echo ✅ Aplikacja uruchomiona!
echo 🌐 Otwórz http://localhost:3001 w przeglądarce
echo 🔧 Backend API: http://localhost:5000
echo.
echo 📝 Sprawdź logi w oknach terminali aby zobaczyć status uruchomienia
echo.
pause
