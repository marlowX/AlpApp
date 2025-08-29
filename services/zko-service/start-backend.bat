@echo off
echo ========================================
echo   URUCHAMIANIE BACKEND ZKO SERVICE
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service

echo [1] Sprawdzam pakiety...
if not exist "node_modules" (
    echo    ! Instaluję pakiety dla backendu...
    call npm install
) else (
    echo    ✓ Pakiety zainstalowane
)

echo.
echo [2] Kompiluję TypeScript...
call npx tsc --noEmit 2>nul
if %errorlevel% neq 0 (
    echo    ⚠ Błędy kompilacji TypeScript (kontynuuję)
) else (
    echo    ✓ TypeScript OK
)

echo.
echo [3] Uruchamiam serwer...
echo ----------------------------------------
echo Port: 5001
echo Baza: alpsys
echo ----------------------------------------
echo.

npm run dev