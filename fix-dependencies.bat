@echo off
echo "=== Naprawianie zaleznosci projektu AlpApp ==="

echo "1. Czyszczenie cache pnpm..."
pnpm store prune

echo "2. Instalacja wszystkich zaleznosci..."
pnpm install

echo "3. Budowanie pakietow..."
pnpm run build:packages

echo "=== Gotowe! ==="
echo "Teraz uruchom:"
echo "  - Backend: cd services\zko-service && npm run dev"
echo "  - Frontend: cd apps\zko && npm run dev"
pause
