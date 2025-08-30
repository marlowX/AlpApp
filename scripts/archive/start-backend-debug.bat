@echo off
echo ====================================
echo   Sprawdzanie Backend ZKO Service
echo ====================================
echo.

echo Sprawdzanie procesow na porcie 5001...
netstat -ano | findstr :5001

echo.
echo Jesli nie ma zadnych procesow, backend nie dziala!
echo.
echo ====================================
echo   Uruchamianie ZKO Service
echo ====================================

cd /d "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service"

echo Instalowanie zaleznosci (jesli potrzeba)...
call npm install

echo.
echo Uruchamianie serwera...
npm run dev

pause