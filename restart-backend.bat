@echo off
echo Restarting ZKO Backend...

:: Znajdź i zabij proces na porcie 5001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    echo Killing process on port 5001...
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

:: Uruchom backend
echo Starting backend...
cd services\zko-service
start cmd /k "npm run dev"

echo.
echo Backend restarted!
echo Check: http://localhost:5001/health
echo.
pause