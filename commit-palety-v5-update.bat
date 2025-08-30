@echo off
echo Committing PaletyManager V5 files...

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add database/functions/palety_v5.sql
git add database/functions/palety_management_v5.sql
git add services/zko-service/src/routes/pallets/v5.routes.ts
git add services/zko-service/src/routes/pallets/index.ts
git add apps/zko/src/modules/zko/components/PaletyManager/
git add quick-install-palety-v5.bat
git add test-palety-v5.bat

git commit -m "feat(palety): Add PaletyManager V5 with intelligent planning strategies

- New pal_planuj_inteligentnie_v5 function with 6 strategies
- Smart delete with formatki transfer (pal_usun_inteligentnie)
- Pallet reorganization (pal_reorganizuj_v5)
- Enhanced empty pallet cleanup (pal_wyczysc_puste_v2)
- New V5 API endpoints with validation
- Updated React components with V5 features
- Installation and test scripts"

echo.
echo Commit completed!
pause