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
git commit -m "feat: Dodano wybór celu transportu w panelu piły" -m "- Modal z wyborem: Okleiniarka / Wiertarka / Magazyn" -m "- Operator decyduje o dalszej ścieżce produkcji" -m "- Zaktualizowana dokumentacja workflow z punktami decyzyjnymi" -m "- Wizualne karty do wyboru z opisami każdej opcji"

# Push do zdalnego repozytorium
Write-Host "`nPushing to remote..." -ForegroundColor Yellow
git push

Write-Host "`n✓ Commit completed successfully!" -ForegroundColor Green
Write-Host "Nowe funkcjonalności:" -ForegroundColor Cyan
Write-Host "- Panel piły ma teraz modal wyboru celu transportu"
Write-Host "- 3 opcje: Okleiniarka, Wiertarka, Magazyn"
Write-Host "- Operator sam decyduje na podstawie typu formatek"
Write-Host ""