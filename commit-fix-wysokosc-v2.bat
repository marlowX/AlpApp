@echo off
echo ========================================
echo Commiting: Fix wysokosc calculation in V2
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "fix(palety): Naprawiono liczenie wysokości w planowaniu V2

- Funkcja pal_helper_oblicz_parametry teraz prawidłowo liczy poziomy
- Formatki układane obok siebie (4/poziom), nie jedna na drugiej
- Wysokość = liczba_poziomów × grubość_płyty (nie sztuki × grubość)
- Test: 80 sztuk = 20 poziomów × 18mm = 360mm (zamiast błędnych 1440mm)
- Funkcja pal_planuj_modularnie używa prawidłowej wysokości z pomocniczej

PRZED: 80 sztuk × 18mm = 1440mm (błąd!)
PO: 80 sztuk ÷ 4/poziom = 20 poziomów × 18mm = 360mm (OK!)"

echo.
echo ========================================
echo Commit completed!
echo ========================================
pause
