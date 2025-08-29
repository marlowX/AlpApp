@echo off
echo ====================================
echo   Git Commit - Fix Edit & Delete
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
git commit -m "fix(zko): Naprawiono edycje i usuwanie pozycji" -m "- Poprawiono funkcje PostgreSQL usun_pozycje_zko i edytuj_pozycje_zko" -m "- Naprawiono obsługe kolumn historia_statusow (status_przed, status_po)" -m "- Poprawiono utrate danych plyt przy edycji - zawsze wysylaj wszystkie pola" -m "- Dodano obsluge formatek przy zmianie rozkroju" -m "- Poprawiono parsowanie kolorow plyt z formatu 'KOLOR x2'" -m "- Dodano lepsze logowanie w backend dla debugowania"

echo.
echo === Ostatni commit ===
git log -1 --oneline

echo.
echo === Commit wykonany pomyslnie! ===
echo.
pause