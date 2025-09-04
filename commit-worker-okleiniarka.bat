@echo off
cd D:\PROJEKTY\PROGRAMOWANIE\AlpApp
git add .
git commit -m "feat: Add WorkerViewOkleiniarka component for edge banding operator"
git push
echo.
echo Commit completed!
echo Changes:
echo - Added WorkerViewOkleiniarka component
echo - Created WorkerOkleiniarkaPage
echo - Updated routing for /worker/okleiniarka
echo - Added buffer warning alerts
echo.
pause
