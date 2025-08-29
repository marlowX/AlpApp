@echo off
echo ====================================
echo   Git Commit - Fix Delete Function
echo ====================================
echo.

cd /d "%~dp0"

REM Konfiguracja git
git config user.name "marlowX"
git config user.email "biuro@alpmeb.pl"

REM Status
echo === Sprawdzanie statusu ===
git status

REM Dodaj pliki
echo.
echo === Dodawanie plikow ===
git add .

REM Commit
echo.
echo === Tworzenie commita ===
git commit -m "fix(zko): Naprawiono funkcje usun_pozycje_zko w PostgreSQL" -m "- Poprawiono odwolania do nieistniejacych kolumn (paleta_id)" -m "- Dostosowano do struktury tabeli historia_statusow" -m "- Dodano wlasciwe nazwy kolumn: status_przed, status_po" -m "- Funkcja teraz poprawnie usuwa pozycje w statusie 'oczekuje'" -m "- Dodano lepsze logowanie w backend dla debugowania"

echo.
echo === Ostatni commit ===
git log -1 --oneline

echo.
echo === Commit wykonany pomyslnie! ===
echo.
pause