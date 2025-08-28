#!/bin/bash
# Script to start ZKO-SERVICE (zaawansowany serwer)

echo "🚀 Uruchamianie ZKO-SERVICE (zaawansowany serwer)..."

cd "$(dirname "$0")/services/zko-service"

if [ ! -f "package.json" ]; then
    echo "❌ Nie znaleziono package.json"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Instalowanie zależności..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚙️ Kopiowanie .env..."
    cp .env.example .env
fi

echo "🌟 Startowanie ZKO-SERVICE na porcie 5000..."
echo "📡 Health: http://localhost:5000/health"
echo "🔗 ZKO: http://localhost:5000/api/zko"
echo "🔗 Płyty: http://localhost:5000/api/plyty"
echo "🔗 Workflow: http://localhost:5000/api/workflow"
echo "🔗 Palety: http://localhost:5000/api/pallets"
echo "🔗 Buffer: http://localhost:5000/api/buffer"

npm run dev
