# PowerShell script for git commit
cd D:\PROJEKTY\PROGRAMOWANIE\AlpApp

# Sprawdź status
Write-Host "Checking git status..." -ForegroundColor Yellow
git status --short

# Dodaj wszystkie zmiany
Write-Host "`nAdding all changes..." -ForegroundColor Yellow
git add .

# Commit ze szczegółowym opisem
Write-Host "`nCreating commit..." -ForegroundColor Yellow
git commit -m "fix: Naprawiono panel piły - właściwe statusy i parametry API" -m "- Dodano obsługę wszystkich statusów cięcia: NOWE, CIECIE_START, OTWARCIE_PALETY, PAKOWANIE_PALETY, ZAMKNIECIE_PALETY, CIECIE_STOP" -m "- Poprawiono parametry w wywołaniu API: zko_id zamiast zkoId, nowy_etap_kod zamiast nowyStatus" -m "- Dodano obsługę błędów z backendu" -m "- Poprawione mapowanie przepływu statusów zgodnie z bazą danych"

# Push do zdalnego repozytorium
Write-Host "`nPushing to remote..." -ForegroundColor Yellow
git push

Write-Host "`n✓ Commit completed successfully!" -ForegroundColor Green
Write-Host "Changes:" -ForegroundColor Cyan
Write-Host "- Fixed WorkerViewPila component with correct status flow"
Write-Host "- Fixed API parameter names for status change"
Write-Host "- Added proper error handling"
Write-Host ""