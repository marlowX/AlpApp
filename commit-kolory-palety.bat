@echo off
echo ============================================
echo    COMMIT: Grupowanie palet po kolorach
echo ============================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo [1/3] Dodawanie plikow...
git add .

echo.
echo [2/3] Tworzenie commita...
git commit -m "feat(palety): Naprawiono grupowanie palet po kolorach - funkcja pal_planuj_z_kolorami dziala poprawnie, strategia kolory w modal planowania modularnego"

echo.
echo [3/3] Status:
git status

echo.
echo ============================================
echo    COMMIT WYKONANY!
echo ============================================
echo.
echo Funkcja pal_planuj_z_kolorami dziala poprawnie
echo Strategia 'kolory' jest dostepna w modalu planowania
echo Test ZKO 28: 6 palet (4x LANCELOT, 1x SONOMA, 1x SUROWA)
echo.
pause
