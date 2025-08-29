@echo off
echo ====================================
echo   Ostateczny commit - Aplikacja dziala
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
git commit -m "fix(zko): Aplikacja w pelni funkcjonalna - edycja i usuwanie dziala" -m "- Naprawiono routing backend (kolejnosc montowania routerow)" -m "- Backend uruchomiony poprawnie na porcie 5001" -m "- Edycja i usuwanie pozycji dzialaja" -m "- Problem z walidacja wymiarow plyt - system ostrzega ale nie blokuje" -m "- Wszystkie podstawowe funkcje dzialaja poprawnie"

echo.
echo === Ostatni commit ===
git log -1 --oneline

echo.
echo === APLIKACJA DZIALA! ===
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3001
echo.
pause