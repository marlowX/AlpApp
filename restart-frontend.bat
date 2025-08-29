@echo off
echo ====================================
echo   Restart Frontend z czystym cache
echo ====================================
echo.

echo Zatrzymywanie procesow na porcie 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

cd /d "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\apps\zko"

echo.
echo Czyszczenie cache Vite...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"

echo.
echo Uruchamianie Vite dev server...
npm run dev