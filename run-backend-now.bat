@echo off
echo ====================================
echo   Uruchom Backend i pokaz bledy
echo ====================================
echo.

cd /d "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service"

echo Sprawdzanie package.json...
if not exist "package.json" (
    echo BLAD: Brak package.json!
    pause
    exit /b 1
)

echo.
echo Sprawdzanie node_modules...
if not exist "node_modules" (
    echo Instalowanie zaleznosci...
    npm install
)

echo.
echo ====================================
echo   URUCHAMIANIE BACKEND
echo ====================================
echo.

npm run dev

pause