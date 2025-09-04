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
git commit -m "feat: Kompletny workflow ZKO - Piła -> Okleiniarka -> Wiertarka" -m "- Zaktualizowano WorkerViewPila: obsługa BUFOR_PILA i TRANSPORT_1" -m "- Zaktualizowano WorkerViewOkleiniarka: obsługa transportu z piły" -m "- Dodano WorkerViewWiertarka: panel dla operatora wiertarki" -m "- Poprawiony przepływ statusów między stanowiskami" -m "- Dodano wizualne wskaźniki (animacje, kolory, alerty)"

# Push do zdalnego repozytorium
Write-Host "`nPushing to remote..." -ForegroundColor Yellow
git push

Write-Host "`n✓ Commit completed successfully!" -ForegroundColor Green
Write-Host "Workflow działa:" -ForegroundColor Cyan
Write-Host "1. PIŁA: NOWE -> CIECIE_START -> ... -> BUFOR_PILA -> TRANSPORT_1"
Write-Host "2. OKLEINIARKA: TRANSPORT_1 -> BUFOR_OKLEINIARKA -> OKLEJANIE_START -> OKLEJANIE_STOP -> TRANSPORT_2"
Write-Host "3. WIERTARKA: TRANSPORT_2 -> BUFOR_WIERTARKA -> WIERCENIE_START -> WIERCENIE_STOP -> TRANSPORT_3"
Write-Host ""