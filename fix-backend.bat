@echo off
echo ====================================
echo   Naprawa Backend - Reinstalacja
echo ====================================
echo.

cd /d "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service"

echo Usuwanie starych node_modules...
if exist "node_modules" rmdir /s /q node_modules

echo Usuwanie package-lock.json...
if exist "package-lock.json" del package-lock.json

echo.
echo Instalowanie wszystkich zaleznosci...
npm install

echo.
echo Instalowanie ts-node osobno...
npm install --save-dev ts-node

echo.
echo ====================================
echo   Uruchamianie Backend
echo ====================================
echo.

npm run dev

pause