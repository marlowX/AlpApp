@echo off
echo ========================================
echo    GIT COMMIT - Reorganizacja projektu
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo Sprawdzam status git...
git status --porcelain
echo.

echo Dodaję wszystkie zmiany...
git add .

echo.
echo Commituje zmiany...
git commit -m "major refactor: konsolidacja i reorganizacja skryptów

- Przeniesiono skrypty pomocnicze do scripts/ (analysis/, testing/, diagnostics/)
- Zastąpiono 8 duplikujących się skryptów startowych 2 inteligentnymi: start.bat i restart.bat
- Dodano run-scripts.sh dla łatwego dostępu do skryptów pomocniczych
- Zaktualizowano .gitignore dla plików tymczasowych
- Przeniesiono stare skrypty do scripts/archive/
- Zaktualizowano dokumentację README.md

Korzyści:
- Główny katalog jest czysty i uporządkowany
- Łatwiejsza konserwacja (2 skrypty zamiast 8)
- Lepsze UX z opcjami i pomocą
- Zorganizowane skrypty pomocnicze według funkcji"

echo.
echo Pushuje do remote...
git push

echo.
echo ========================================
echo ✅ COMMIT ZAKOŃCZONY POMYŚLNIE!
echo ========================================
echo.
echo Reorganizacja projektu została ukończona:
echo.
echo 📁 Główny katalog - tylko najważniejsze pliki
echo 🎯 start.bat - uniwersalny launcher z opcjami
echo 🔄 restart.bat - inteligentny restart z opcjami  
echo 🛠️ scripts/ - wszystkie skrypty pomocnicze zorganizowane
echo 📦 scripts/archive/ - stare skrypty (można usunąć)
echo.
echo Używaj:
echo   start.bat [opcja]           - do uruchamiania
echo   restart.bat [opcja]         - do restartu
echo   ./run-scripts.sh [komenda]  - dla skryptów pomocniczych
echo.
pause