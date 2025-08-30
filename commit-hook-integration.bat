@echo off
echo 🎯 Commit: Integracja hooka usePaletyModular...

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add apps/zko/src/modules/zko/hooks/usePaletyModular.ts
git add apps/zko/src/modules/zko/hooks/index.ts  
git add apps/zko/src/modules/zko/components/PaletyManager/PaletyManager.tsx

git commit -m "feat: integracja hooka usePaletyModular w PaletyManager - Hook dodany, UI zintegrowane, gotowe do testow"

echo.
echo ✅ Hook zintegrowany w PaletyManager!
echo 🚀 Następny krok: restart.bat backend
echo 🧪 Test: Kliknij 'Planuj V2 ⭐' w aplikacji

pause