@echo off
REM Start ZKO-SERVICE na porcie 5001

echo 🚀 Uruchamianie ZKO-SERVICE (port 5001)...

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
echo 🌟 Startowanie ZKO-SERVICE na porcie 5001...
echo 📡 Health: http://localhost:5001/health
echo 🔗 Test DB: http://localhost:5001/api/test/connection
echo 🔗 ZKO: http://localhost:5001/api/zko
echo 🔗 Płyty: http://localhost:5001/api/plyty  
echo 🔗 Workflow: http://localhost:5001/api/workflow
echo 🔗 Palety: http://localhost:5001/api/pallets
echo 🔗 Buffer: http://localhost:5001/api/buffer
echo.
echo Używa .env z PORT=5001
echo ============================================

call npm run dev
pause