@echo off
echo ====================================
echo   Git Commit - ZKO Edit Modal Reuse
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
git commit -m "refactor(zko): Uzycie AddPozycjaModal do edycji pozycji" -m "- Rozszerzono AddPozycjaModal o tryb edycji" -m "- Usunieto niepotrzebny komponent EditPozycjaModal" -m "- Zachowano pelna funkcjonalnosc 3-krokowego procesu przy edycji" -m "- Edycja pozwala zmieniac rozkroj, plyty i opcje dodatkowe" -m "- Integracja z funkcja PostgreSQL zko.edytuj_pozycje_zko"

echo.
echo === Ostatni commit ===
git log -1 --oneline

echo.
echo === Commit wykonany pomyslnie! ===
echo.
pause