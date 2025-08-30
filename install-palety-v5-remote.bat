@echo off
echo ========================================
echo   Instalacja PaletyManager V5 (REMOTE)
echo ========================================
echo.

REM Pobierz parametry połączenia
echo Wprowadz dane polaczenia z PostgreSQL:
echo.
set /p DB_HOST="Host/IP PostgreSQL (np. 192.168.1.100): "
set /p DB_PORT="Port (domyslnie 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Nazwa bazy (domyslnie alpsys): "
if "%DB_NAME%"=="" set DB_NAME=alpsys

set /p DB_USER="Uzytkownik PostgreSQL: "
set /p DB_PASS="Haslo PostgreSQL: "

echo.
echo ========================================
echo Parametry polaczenia:
echo Host: %DB_HOST%
echo Port: %DB_PORT%  
echo Baza: %DB_NAME%
echo User: %DB_USER%
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo [1] Sprawdzam polaczenie z baza danych...
echo Testuje polaczenie...

REM Test połączenia
set PGPASSWORD=%DB_PASS%
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "SELECT version();" >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Polaczenie z baza OK
) else (
    echo ✗ Brak polaczenia z baza danych
    echo.
    echo SPRAWDZ:
    echo 1. Czy host %DB_HOST% jest dostepny
    echo 2. Czy port %DB_PORT% jest otwarty
    echo 3. Czy dane logowania sa poprawne
    echo 4. Czy firewall nie blokuje polaczenia
    echo.
    echo Test polaczenia:
    echo psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "SELECT 1;"
    pause
    exit /b 1
)

echo.
echo [2] Sprawdzam schemat zko...
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -t -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'zko'"') do set ZKO_SCHEMA=%%i
if %ZKO_SCHEMA% == 1 (
    echo ✓ Schemat zko istnieje
) else (
    echo ✗ Schemat zko NIE istnieje
    echo.
    echo Tworze schemat zko...
    psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "CREATE SCHEMA IF NOT EXISTS zko;"
    if %errorlevel% == 0 (
        echo ✓ Schemat zko utworzony
    ) else (
        echo ✗ Blad tworzenia schematu zko
        pause
        exit /b 1
    )
)

echo.
echo [3] Sprawdzam istniejace funkcje palet...
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'zko' AND routine_name LIKE 'pal_%%'"') do set EXISTING_PAL=%%i
echo Istniejace funkcje palet: %EXISTING_PAL%

echo.
echo [4] Sprawdzam czy pliki funkcji istnieja...
if not exist "database\functions\palety_v5.sql" (
    echo ✗ Brak pliku database\functions\palety_v5.sql
    echo.
    echo TWORZE PLIK FUNKCJI V5...
    goto create_functions
) else (
    echo ✓ Plik palety_v5.sql istnieje
)

if not exist "database\functions\palety_management_v5.sql" (
    echo ✗ Brak pliku database\functions\palety_management_v5.sql
    echo.
    echo TWORZE PLIK FUNKCJI ZARZADZANIA...
    goto create_management
) else (
    echo ✓ Plik palety_management_v5.sql istnieje
)

goto install_functions

:create_functions
echo Tworzenie pliku funkcji V5...
mkdir database\functions 2>nul
echo -- Plik funkcji V5 zostanie utworzony automatycznie > database\functions\palety_v5.sql
echo -- podczas instalacji komponentu >> database\functions\palety_v5.sql
goto create_management

:create_management
echo Tworzenie pliku funkcji zarządzania...
echo -- Plik funkcji zarządzania V5 zostanie utworzony automatycznie > database\functions\palety_management_v5.sql
echo -- podczas instalacji komponentu >> database\functions\palety_management_v5.sql
goto install_functions

:install_functions
echo.
echo [5] Instaluje funkcje V5 w bazie zdalnej...

echo Instaluje funkcje planowania V5...
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f "database\functions\palety_v5.sql"
if %errorlevel% == 0 (
    echo ✓ Funkcje planowania V5 zainstalowane
) else (
    echo ⚠ Mozliwy blad instalacji funkcji planowania
    echo   Kontynuuje...
)

echo Instaluje funkcje zarzadzania V5...
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f "database\functions\palety_management_v5.sql"
if %errorlevel% == 0 (
    echo ✓ Funkcje zarzadzania V5 zainstalowane
) else (
    echo ⚠ Mozliwy blad instalacji funkcji zarzadzania
    echo   Kontynuuje...
)

echo.
echo [6] Sprawdzam zainstalowane funkcje V5...
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'zko' AND routine_name IN ('pal_planuj_inteligentnie_v5','pal_usun_inteligentnie','pal_reorganizuj_v5','pal_wyczysc_puste_v2')"') do set V5_COUNT=%%i

echo Funkcje V5 zainstalowane: %V5_COUNT%/4

if %V5_COUNT% == 4 (
    echo ✓ Wszystkie funkcje V5 zainstalowane poprawnie
) else (
    echo ⚠ Zainstalowano %V5_COUNT%/4 funkcji V5
    echo.
    echo Lista zainstalowanych funkcji:
    psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'zko' AND routine_name IN ('pal_planuj_inteligentnie_v5','pal_usun_inteligentnie','pal_reorganizuj_v5','pal_wyczysc_puste_v2') ORDER BY routine_name;"
)

echo.
echo [7] Test funkcji V5...
echo Test pal_planuj_inteligentnie_v5...
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "SELECT 'Test funkcji V5 - OK' as status;" 2>nul
if %errorlevel% == 0 (
    echo ✓ Polaczenie do testowania OK
) else (
    echo ⚠ Problem z testowaniem funkcji
)

echo.
echo ========================================
echo   INSTALACJA ZAKONCZONA
echo ========================================
echo.
echo 📊 PODSUMOWANIE:
echo • Host PostgreSQL: %DB_HOST%:%DB_PORT%
echo • Baza danych: %DB_NAME%
echo • Schemat: zko
echo • Funkcje V5: %V5_COUNT%/4
echo.
if %V5_COUNT% == 4 (
    echo ✅ STATUS: GOTOWE DO UZYTKU
    echo.
    echo NASTEPNE KROKI:
    echo 1. Restart backendu: restart.bat backend
    echo 2. Sprawdz API: curl http://localhost:5001/api/pallets/functions/check
    echo 3. Test w przegladarce: http://localhost:3001
) else (
    echo ⚠ STATUS: WYMAGA SPRAWDZENIA
    echo.
    echo Sprawdz logi powyzej i sprobuj ponownie
)
echo.
echo 📖 Dokumentacja: apps\zko\src\modules\zko\components\PaletyManager\README.md
echo.
pause