@echo off
echo ============================================
echo NAPRAWIANIE BLEDOW MODULU PALETY V5
echo ============================================
echo.
echo Ten skrypt naprawi bledy 500 przy usuwaniu/dodawaniu palet
echo.

set PGPASSWORD=postgres

echo [1/2] Wykonywanie poprawek funkcji...
psql -U postgres -h localhost -p 5432 -d alpsys -f "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\database\functions\fix_palety_v5.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Nie udalo sie wykonac poprawek!
    echo Sprawdz czy PostgreSQL dziala i sprobuj ponownie.
    pause
    exit /b 1
)

echo.
echo [2/2] Testowanie poprawionych funkcji...
psql -U postgres -h localhost -p 5432 -d alpsys -c "SELECT routine_name FROM information_schema.