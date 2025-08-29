@echo off
echo ====================================
echo   Git Commit - Final Fixes
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
git commit -m "fix(zko): Ostateczne poprawki edycji i usuwania pozycji" -m "- Poprawione parsowanie kolorow plyt z formatu 'KOLOR xN'" -m "- Dodana funkcja parseKoloryPlyty do obslugi roznych formatow" -m "- Naprawiono zachowywanie danych plyt przy edycji" -m "- Zawsze wysylamy wszystkie pola przy edycji, nie tylko zmienione" -m "- Dodane testy API (test-api.html, test-zko-endpoints.sh)" -m "- Poprawiona obsluga bledow w AddPozycjaModal"

echo.
echo === Ostatni commit ===
git log -1 --oneline

echo.
echo === Commit wykonany pomyslnie! ===
echo.
pause