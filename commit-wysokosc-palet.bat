@echo off
echo ============================================
echo    COMMIT: Naprawa wysokosci palet
echo ============================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo [1/3] Dodawanie plikow...
git add .

echo.
echo [2/3] Tworzenie commita...
git commit -m "fix(palety): Naprawiono obliczanie wysokosci palet - formatki ukladane obok siebie na poziomach, nie jedna na drugiej. ZKO 28: wysokosci od 90-360mm zamiast 990-1170mm"

echo.
echo [3/3] Status:
git status

echo.
echo ============================================
echo    COMMIT WYKONANY!
echo ============================================
echo.
echo NAPRAWIONE:
echo - Funkcja napraw_wysokosc_palet() oblicza prawidlowa wysokosc
echo - Formatki ukladane obok siebie (np. 4 formatki 600x300 na poziom)
echo - Wysokosc = liczba_poziomow x grubosc_plyty
echo.
echo WYNIKI DLA ZKO 28:
echo - Palety LANCELOT: 126-234mm (bylo 990-1170mm)
echo - Paleta SONOMA: 90mm (bylo 378mm)
echo - Paleta SUROWA: 360mm (bylo 1080mm)
echo.
pause
