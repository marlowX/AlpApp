@echo off
echo "=== Naprawa zko-service ==="

cd services\zko-service

echo "1. Czyszczenie node_modules..."
rmdir /s /q node_modules 2>nul

echo "2. Instalacja zaleznosci..."
npm install

echo "3. Sprawdzanie ts-node..."
npx ts-node --version

echo "=== Gotowe! ==="
echo "Uruchom: npm run dev"
pause
