@echo off
echo ============================================
echo    Instalacja funkcji obliczania wysokosci
echo ============================================
echo.

set PGPASSWORD=postgres

echo Instaluje funkcje naprawy wysokosci palet...
psql -U postgres -h localhost -p 5432 -d alpsys -f "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\database\functions\palety_wysokosc_fix.sql"

echo.
echo ============================================
echo    INSTALACJA ZAKONCZONA
echo ============================================
echo.
echo Test funkcji:
psql -U postgres -h localhost -p 5432 -d alpsys -c "SELECT * FROM zko.pal_oblicz_wysokosc_palety('[{\"id\": 1, \"ilosc\": 80, \"dlugosc\": 600, \"szerokosc\": 300}]'::JSONB, 18, 1200, 800);"

echo.
pause
