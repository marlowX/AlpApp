@echo off
echo ========================================
echo   Szybka instalacja funkcji Palety V5
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo [1] Instaluje funkcje planowania V5...
echo Podaj hasło użytkownika postgres (domyślnie: postgres)
psql -U postgres -h localhost -p 5432 -d alpsys -f "database\functions\palety_v5.sql"
if %errorlevel% == 0 (
    echo ✔ Funkcje planowania V5 zainstalowane
) else (
    echo ✗ Błąd instalacji funkcji planowania
    echo   Sprawdź hasło i spróbuj ponownie
    pause
    exit /b 1
)

echo.
echo [2] Instaluje funkcje zarządzania V5...
psql -U postgres -h localhost -p 5432 -d alpsys -f "database\functions\palety_management_v5.sql"
if %errorlevel% == 0 (
    echo ✔ Funkcje zarządzania V5 zainstalowane
) else (
    echo ✗ Błąd instalacji funkcji zarządzania
    pause
    exit /b 1
)

echo.
echo [3] Sprawdzam instalację...
psql -U postgres -h localhost -p 5432 -d alpsys -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'zko' AND routine_name IN ('pal_planuj_inteligentnie_v5','pal_usun_inteligentnie','pal_reorganizuj_v5','pal_wyczysc_puste_v2')"

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