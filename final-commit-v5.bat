@echo off
echo Final commit for PaletyManager V5...

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add -A
git commit -m "fix(palety): Add complete V5 installation SQL and fix auth issues

- Created INSTALL_PALETY_V5_COMPLETE.sql with all functions
- Fixed psql authentication in quick-install script  
- Added pgAdmin installation instructions
- Updated README with troubleshooting for current error
- Ready-to-use SQL file for direct pgAdmin execution"

echo.
echo ========================================
echo   INSTRUKCJA NAPRAWY BŁĘDU:
echo ========================================
echo.
echo 1. Otwórz pgAdmin
echo 2. Połącz się z bazą 'alpsys'
echo 3. Kliknij prawym na 'alpsys' -> Query Tool
echo 4. Otwórz plik: INSTALL_PALETY_V5_COMPLETE.sql
echo 5. Skopiuj całą zawartość i wklej do Query Tool
echo 6. Kliknij Execute (F5)
echo 7. Zrestartuj backend: restart.bat backend
echo 8. Gotowe! Funkcja "Planuj V5" będzie działać
echo.
pause