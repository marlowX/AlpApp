@echo off
echo ========================================
echo   Instalacja PaletyManager V5 (Windows)
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo [1] Sprawdzam polaczenie z baza danych...
psql -h localhost -p 5432 -d alpsys -c "SELECT version();" >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Polaczenie z baza OK
) else (
    echo ✗ Brak polaczenia z baza danych
    echo   Sprawdz czy PostgreSQL dziala
    pause
    exit /b 1
)

echo.
echo [2] Sprawdzam istniejace funkcje palet...
for /f %%i in ('psql -h localhost -p 5432 -d alpsys -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'zko' AND routine_name LIKE 'pal_%%'"') do set EXISTING_COUNT=%%i
echo Istniejace funkcje palet: %EXISTING_COUNT%

echo.
echo [3] Instaluje funkcje V5...

if not exist "database\functions\palety_v5.sql" (
    echo ✗ Brak pliku palety_v5.sql
    echo   Sprawdz czy plik istnieje w database\functions\
    pause
    exit /b 1
)

echo Instaluje funkcje planowania V5...
psql -h localhost -p 5432 -d alpsys -f "database\functions\palety_v5.sql"
if %errorlevel% == 0 (
    echo ✓ Funkcje planowania V5 zainstalowane
) else (
    echo ✗ Blad instalacji funkcji planowania
    pause
    exit /b 1
)

if not exist "database\functions\palety_management_v5.sql" (
    echo ✗ Brak pliku palety_management_v5.sql
    echo   Sprawdz czy plik istnieje w database\functions\
    pause
    exit /b 1
)

echo Instaluje funkcje zarzadzania V5...
psql -h localhost -p 5432 -d alpsys -f "database\functions\palety_management_v5.sql"
if %errorlevel% == 0 (
    echo ✓ Funkcje zarzadzania V5 zainstalowane
) else (
    echo ✗ Blad instalacji funkcji zarzadzania
    pause
    exit /b 1
)

echo.
echo [4] Sprawdzam poprawnosc instalacji...
for /f %%i in ('psql -h localhost -p 5432 -d alpsys -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'zko' AND routine_name IN ('pal_planuj_inteligentnie_v5','pal_usun_inteligentnie','pal_reorganizuj_v5','pal_wyczysc_puste_v2')"') do set V5_COUNT=%%i

echo Funkcje V5 zainstalowane: %V5_COUNT%/4

if %V5_COUNT% == 4 (
    echo ✓ Wszystkie funkcje V5 zainstalowane poprawnie
) else (
    echo ⚠ Zainstalowano %V5_COUNT%/4 funkcji V5
)

echo.
echo [5] Test backendu...
curl -s http://localhost:5001/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Backend dziala
    
    echo Test endpointu funkcji V5...
    curl -s http://localhost:5001/api/pallets/functions/check | findstr "sukces" >nul
    if %errorlevel% == 0 (
        echo ✓ Endpoint funkcji V5 dziala
    ) else (
        echo ⚠ Endpoint wymaga restartu backendu
        echo   Wykonaj: restart.bat backend
    )
) else (
    echo ⚠ Backend nie dziala
    echo   Wykonaj: start.bat backend
)

echo.
echo ========================================
echo   Instalacja PaletyManager V5 zakonczona!
echo ========================================
echo.
echo Nastepne kroki:
echo 1. Restart backendu: restart.bat backend
echo 2. Test: curl http://localhost:5001/api/pallets/functions/check  
echo 3. Otworz aplikacje: http://localhost:3001
echo 4. Test w ZKO → Palety → "Planuj V5"
echo.
pause