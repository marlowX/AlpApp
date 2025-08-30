@echo off
echo ========================================
echo    GIT COMMIT - PaletyManager V5
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo Sprawdzam status git...
git status --porcelain
echo.

echo Dodaję wszystkie zmiany...
git add .

echo.
echo Commituje PaletyManager V5...
git commit -m "feat: PaletyManager V5 - nowe funkcje zarządzania paletami

NOWE FUNKCJONALNOŚCI V5:
- pal_planuj_inteligentnie_v5() z 6 strategiami planowania
- pal_usun_inteligentnie() z automatycznym transferem formatek  
- pal_reorganizuj_v5() z optymalizacją układów
- pal_wyczysc_puste_v2() z szczegółowymi statystykami

STRATEGIE PLANOWANIA:
- inteligentna: kombinacja wszystkich kryteriów (zalecana)
- kolor: grupowanie po kolorach
- rozmiar: stabilność (duże na dół)
- oklejanie: priorytet dla formatek do oklejania
- optymalizacja: maksymalne wykorzystanie przestrzeni
- mieszane: mieszane podejście

KOMPONENTY REACT:
- PaletyManager.tsx: główny komponent z nowymi funkcjami V5
- PlanowanieModal.tsx: presets i wizualne strategie
- PaletaPrzeniesFormatki.tsx: ulepszone przenoszenie z walidacją
- hooks/usePaletyManager.ts: centralne zarządzanie stanem
- types.ts: nowe interfejsy i typy V5

BACKEND API:
- routes/pallets/v5.routes.ts: nowe endpointy V5
- /plan-v5: planowanie z strategiami
- /delete-smart: inteligentne usuwanie
- /reorganize: reorganizacja palet
- /transfer-v5: ulepszone przenoszenie
- /functions/check: sprawdzenie dostępności funkcji

FUNKCJE POSTGRESQL:
- database/functions/palety_v5.sql: główne funkcje planowania
- database/functions/palety_management_v5.sql: zarządzanie i usuwanie

SKRYPTY:
- scripts/install-palety-v5.sh: instalacja funkcji w bazie
- scripts/testing/test-palety-v5.sh: kompleksowe testy V5

KORZYŚCI:
- Lepsze wykorzystanie przestrzeni palet
- Inteligentne grupowanie formatek  
- Automatyczne przenoszenie przy usuwaniu
- Szczegółowe statystyki i metryki
- Presets dla różnych typów produkcji
- Lepsze UX z walidacjami i podglądami

KOMPATYBILNOŚĆ:
- Stare funkcje V4 nadal działają
- Nowe endpointy V5 są dodatkowe
- Płynna migracja bez przerwy w pracy"

echo.
echo Pushuje do remote...
git push

echo.
echo ========================================
echo ✅ COMMIT PaletyManager V5 ZAKOŃCZONY!
echo ========================================
echo.
echo 🎯 PaletyManager V5 został pomyślnie zacommitowany
echo.
echo NASTĘPNE KROKI:
echo.
echo 1. Instalacja funkcji w bazie danych:
echo    ./run-scripts.sh install-palety-v5
echo.
echo 2. Test funkcjonalności:
echo    ./run-scripts.sh test-palety-v5
echo.
echo 3. Restart aplikacji:
echo    restart.bat clean
echo.
echo 4. Test w przeglądarce:
echo    http://localhost:3001
echo    → Idź do ZKO → Palety → "Planuj V5"
echo.
echo 📚 Dokumentacja szczegółowa:
echo    apps/zko/src/modules/zko/components/PaletyManager/README.md
echo.
pause