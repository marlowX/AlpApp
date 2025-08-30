@echo off
echo ========================================
echo   DIAGNOSTYKA PROBLEMU ZKO
echo ========================================
echo.

echo [1] Sprawdzam porty...
echo ----------------------------------------
netstat -ano | findstr :3001 | findstr LISTENING
if %errorlevel% == 0 (
    echo Port 3001 jest ZAJETY
) else (
    echo Port 3001 jest WOLNY
)

netstat -ano | findstr :5001 | findstr LISTENING  
if %errorlevel% == 0 (
    echo Port 5001 jest ZAJETY
) else (
    echo Port 5001 jest WOLNY
)

echo.
echo [2] Sprawdzam strukture projektu...
echo ----------------------------------------
if exist "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\package.json" (
    echo ✓ package.json istnieje
) else (
    echo ✗ BRAK package.json!
)

if exist "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service\src\index.ts" (
    echo ✓ Backend index.ts istnieje
) else (
    echo ✗ BRAK backend index.ts!
)

if exist "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\apps\zko\src\main.tsx" (
    echo ✓ Frontend main.tsx istnieje  
) else (
    echo ✗ BRAK frontend main.tsx!
)

echo.
echo [3] Sprawdzam node_modules...
echo ----------------------------------------
if exist "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\node_modules" (
    echo ✓ node_modules istnieje
    dir "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\node_modules" | find "File(s)" | find /v "0 File(s)"
) else (
    echo ✗ BRAK node_modules! Uruchom: npm install
)

echo.
echo [4] Sprawdzam .env...
echo ----------------------------------------
if exist "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\.env" (
    echo ✓ .env istnieje
    echo Zawiera:
    findstr "DB_" "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\.env"
) else (
    echo ✗ BRAK .env! Skopiuj z .env.example
)

echo.
echo ========================================
echo ZALECENIA:
echo.
echo 1. Zabij procesy na portach:
echo    kill-zko-ports.bat
echo.
echo 2. Jesli brakuje node_modules:
echo    npm install
echo.
echo 3. Uruchom serwer:
echo    npm run dev
echo ========================================
pause