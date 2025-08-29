@echo off
echo ====================================
echo   Debug Backend - Zobacz bledy
echo ====================================
echo.

cd /d "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service"

echo Zatrzymywanie starego procesu...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

echo.
echo Uruchamianie w trybie DEBUG...
set LOG_LEVEL=debug
set NODE_ENV=development

echo.
echo UWAGA: Zobacz dokladne bledy w konsoli
echo =====================================
echo.

npm run dev