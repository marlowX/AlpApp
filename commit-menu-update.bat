@echo off
cd D:\PROJEKTY\PROGRAMOWANIE\AlpApp
git add .
git commit -m "feat: Add Worker Panels to navigation menu" -m "- Added 'Panele pracownikow' section in sidebar" -m "- Links to Pila and Okleiniarka panels are active" -m "- Other panels marked as disabled (coming soon)"
git push
echo.
echo Commit completed!
pause