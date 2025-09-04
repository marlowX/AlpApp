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
git commit -m "docs: Kompletne drzewo workflow ZKO - pełna dokumentacja systemu" -m "- Dodano WORKFLOW_TREE.md z pełną mapą przepływu produkcji" -m "- Opisane wszystkie statusy, funkcje i panele" -m "- Kompetencje i uprawnienia dla każdego stanowiska" -m "- Warianty przepływu produkcji" -m "- Status implementacji (co działa, co TODO)"

# Push do zdalnego repozytorium
Write-Host "`nPushing to remote..." -ForegroundColor Yellow
git push

Write-Host "`n✓ Commit completed successfully!" -ForegroundColor Green
Write-Host "Dokumentacja workflow zapisana w: apps/zko/WORKFLOW_TREE.md" -ForegroundColor Cyan