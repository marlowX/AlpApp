#!/bin/bash

echo "🚀 Uruchamianie AlpApp - Frontend i Backend"
echo "=========================================="

# Sprawdź czy pnpm jest zainstalowany
if ! command -v pnpm &> /dev/null; then
    echo "❌ PNPM nie jest zainstalowany. Zainstaluj przez: npm install -g pnpm"
    exit 1
fi

echo "📦 Instalowanie zależności..."
pnpm install

echo ""
echo "🎯 Dostępne endpointy:"
echo "Frontend ZKO: http://localhost:3001"
echo "Backend API: http://localhost:5000"
echo "Health check: http://localhost:5000/health"
echo ""

# Uruchom równolegle frontend i backend
echo "🚀 Uruchamianie równolegle frontend i backend..."
pnpm run dev:zko & pnpm --filter @alp/zko-service dev

wait
