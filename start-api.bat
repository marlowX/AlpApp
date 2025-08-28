@echo off
REM Batch script to start API server - start-api.bat

echo 🚀 Uruchamianie API serwera dla AlpApp...

REM Sprawdź czy Node.js jest zainstalowany
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js nie jest zainstalowany
    echo Zainstaluj Node.js z: https://nodejs.org/
    pause
    exit /b 1
)

REM Przejdź do katalogu API
cd /d "%~dp0services\api"
if not exist "package.json" (
    echo ❌ Nie znaleziono package.json
    pause
    exit /b 1
)

REM Zainstaluj zależności jeśli node_modules nie istnieje
if not exist "node_modules" (
    echo 📦 Instalowanie zależności...
    call npm install
)

REM Skopiuj .env.example do .env jeśli nie istnieje
if not exist ".env" (
    echo ⚙️ Tworzenie pliku konfiguracji .env...
    copy ".env.example" ".env"
    echo 📝 WAŻNE: Edytuj plik services/api/.env z danymi PostgreSQL!
)

echo.
echo 🌟 Startowanie API serwera na porcie 5000...
echo 📡 Health check: http://localhost:5000/api/health
echo 🔗 Płyty: http://localhost:5000/api/plyty/active  
echo 🔗 Rozkroje: http://localhost:5000/api/rozkroje
echo.
echo Aby zatrzymać serwer, naciśnij Ctrl+C
echo ============================================

call npm run dev
pause
