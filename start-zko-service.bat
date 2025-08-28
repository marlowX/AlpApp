@echo off
REM Start ZKO-SERVICE na porcie 5000

echo 🚀 Uruchamianie ZKO-SERVICE (port 5000)...

cd /d "%~dp0services\zko-service"

if not exist "package.json" (
    echo ❌ Nie znaleziono package.json
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Instalowanie zależności...
    call npm install
)

echo.
echo 🌟 Startowanie ZKO-SERVICE na porcie 5000...
echo 📡 Health: http://localhost:5000/health
echo 🔗 ZKO: http://localhost:5000/api/zko
echo 🔗 Płyty: http://localhost:5000/api/plyty  
echo 🔗 Workflow: http://localhost:5000/api/workflow
echo 🔗 Palety: http://localhost:5000/api/pallets
echo 🔗 Buffer: http://localhost:5000/api/buffer
echo.
echo Używa .env z PORT=5000
echo ============================================

call npm run dev
pause
