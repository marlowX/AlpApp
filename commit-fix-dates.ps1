# PowerShell script for git operations
cd D:\PROJEKTY\PROGRAMOWANIE\AlpApp

# Sprawdź status
Write-Host "Checking git status..." -ForegroundColor Yellow
git status --short

# Dodaj wszystkie zmiany
Write-Host "`nAdding all changes..." -ForegroundColor Yellow
git add .

# Commit ze szczegółowym opisem
Write-Host "`nCreating commit..." -ForegroundColor Yellow
git commit -m "fix: Replace date-fns with dayjs in WorkerView components" -m "- Fixed import errors by using dayjs instead of date-fns" -m "- dayjs is already installed in the project" -m "- Added Polish locale support for relative dates"

# Push do zdalnego repozytorium
Write-Host "`nPushing to remote..." -ForegroundColor Yellow
git push

Write-Host "`n✓ Commit completed successfully!" -ForegroundColor Green
Write-Host "Changes:" -ForegroundColor Cyan
Write-Host "- Fixed WorkerViewPila component (replaced date-fns with dayjs)"
Write-Host "- Fixed WorkerViewOkleiniarka component (replaced date-fns with dayjs)"
Write-Host "- Added Polish locale for relative date display"
Write-Host ""
