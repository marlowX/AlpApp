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
git commit -m "feat: Integracja zarządzania paletami w panelu piły" -m "- Status OTWARCIE_PALETY otwiera komponent PaletyZko" -m "- Operator zarządza paletami: tworzy, pakuje, zamyka" -m "- Możliwość transportu pojedynczych palet do różnych lokalizacji" -m "- Walidacja: cięcie kończy się tylko gdy wszystkie palety są zamknięte" -m "- Statystyki palet (otwarte/zamknięte) w panelu"

# Push do zdalnego repozytorium
Write-Host "`nPushing to remote..." -ForegroundColor Yellow
git push

Write-Host "`n✓ Commit completed successfully!" -ForegroundColor Green
Write-Host "Nowe funkcjonalności:" -ForegroundColor Cyan
Write-Host "1. OTWARCIE_PALETY - otwiera modal z PaletyZko"
Write-Host "2. Operator definiuje palety i rozmieszcza formatki"
Write-Host "3. Może zamknąć palety gdy są gotowe"
Write-Host "4. Transport pojedynczych palet lub całego ZKO"
Write-Host "5. Walidacja przepływu - wymaga zamknięcia wszystkich palet"
Write-Host ""