@echo off
echo ====================================
echo   Git Commit - ZKO Fix
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
git commit -m "fix(zko): Naprawiono usuwanie i dodano edycje pozycji ZKO" -m "- Poprawiono obsluge API dla usuwania pozycji" -m "- Dodano komponent EditPozycjaModal do edycji pozycji" -m "- Zaktualizowano zkoApi.ts z poprawnymi typami i obsluga bledow" -m "- Integracja z funkcjami PostgreSQL: usun_pozycje_zko, edytuj_pozycje_zko" -m "- Dodano walidacje biznesowe (tylko status 'oczekuje' moze byc edytowany/usuwany)" -m "- Poprawiono UI/UX z odpowiednimi komunikatami i stanami przyciskow"

echo.
echo === Ostatni commit ===
git log -1 --oneline

echo.
echo === Commit wykonany pomyslnie! ===
echo.
pause