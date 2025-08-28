@echo off
echo ====================================
echo   Restartowanie ZKO Service
echo ====================================
echo.

REM Zabij wszystkie procesy node na porcie 5000
echo Zatrzymywanie poprzedniej instancji...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

REM Uruchom ponownie
echo Uruchamianie ZKO Service...
cd /d "%~dp0"
call start-zko-service.bat