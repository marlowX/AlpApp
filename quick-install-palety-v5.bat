@echo off
echo ========================================
echo   Szybka instalacja funkcji Palety V5
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo [1] Instaluje funkcje planowania V5...
psql -h localhost -p 5432 -d alpsys -f "database\functions\palety_v5.sql"
if %errorlevel% == 0 (
    echo ✔ Funkcje planowania V5 zainstalowane
) else (
    echo ✗ Błąd instalacji funkcji planowania
    pause
    exit /b 1
)

echo.
echo [2] Instaluje funkcje zarządzania V5...
psql -h localhost -p 5432 -d alpsys -f "database\functions\palety_management_v5.sql"
if %errorlevel% == 0 (
    echo ✔ Funkcje zarządzania V5 zainstalowane
) else (
    echo ✗ Błąd instalacji funkcji zarządzania
    pause
    exit /b 1
)

echo.
echo [3] Sprawdzam instalację...
for /f %%i in ('psql -h localhost -p 5432 -d alpsys -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'zko' AND routine_name IN ('pal_planuj_inteligentnie_v5','pal_usun_inteligentnie','pal_reorganizuj_v5','pal_wyczysc_puste_v2')"') do set V5_COUNT=%%i

echo Funkcje V5 zainstalowane: %V5_COUNT%/4

if %V5_COUNT% == 4 (
    echo ✔ Wszystkie funkcje V5 zainstalowane poprawnie!
    echo.
    echo [4] Test API...
    curl -s http://localhost:5001/api/pallets/functions/check
) else (
    echo ⚠ Zainstalowano tylko %V5_COUNT%/4 funkcji V5
)

echo.
echo ========================================
echo   Instalacja zakończona!
echo ========================================
echo.
echo Następne kroki:
echo 1. Restart backendu: restart.bat backend
echo 2. Otworz aplikacje: http://localhost:3001
echo 3. Przejdz do ZKO i testuj "Planuj V5"
echo.
pause