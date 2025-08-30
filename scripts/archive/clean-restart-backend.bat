@echo off
echo ====================================
echo   Czyszczenie i restart ZKO Service
echo ====================================
echo.

cd /d "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service"

echo Zatrzymywanie procesow na porcie 5001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

echo Czyszczenie cache TypeScript...
if exist "dist" rmdir /s /q dist
if exist ".tsbuildinfo" del .tsbuildinfo

echo.
echo Ponowna instalacja (opcjonalnie)...
REM npm ci

echo.
echo Uruchamianie serwera...
npm run dev