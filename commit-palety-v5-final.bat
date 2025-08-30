@echo off
echo Committing final PaletyManager V5 documentation and scripts...

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add apps/zko/src/modules/zko/components/PaletyManager/README.md
git add quick-install-palety-v5.bat
git add test-palety-v5.bat
git add commit-palety-v5-update.bat

git commit -m "docs(palety): Update PaletyManager V5 documentation with installation guide

- Added quick installation script (quick-install-palety-v5.bat)
- Added test script (test-palety-v5.bat)  
- Updated README with detailed installation instructions
- Added troubleshooting section for common issues
- Added migration guide from V4 to V5
- Version bump to 5.0.1"

echo.
echo Documentation commit completed!
echo.
echo ========================================
echo   NASTĘPNE KROKI:
echo ========================================
echo.
echo 1. Zainstaluj funkcje V5 w bazie:
echo    quick-install-palety-v5.bat
echo.
echo 2. Zrestartuj backend:
echo    restart.bat backend
echo.
echo 3. Testuj funkcje:
echo    test-palety-v5.bat
echo.
echo 4. Otwórz aplikację:
echo    http://localhost:3001
echo.
pause