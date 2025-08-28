#!/bin/bash
# Script to start API server - start-api.sh

echo "🚀 Uruchamianie API serwera dla AlpApp..."

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie jest zainstalowany"
    exit 1
fi

# Przejdź do katalogu API
cd "$(dirname "$0")/services/api"

# Sprawdź czy package.json istnieje
if [ ! -f "package.json" ]; then
    echo "❌ Nie znaleziono package.json"
    exit 1
fi

# Zainstaluj zależności jeśli node_modules nie istnieje
if [ ! -d "node_modules" ]; then
    echo "📦 Instalowanie zależności..."
    npm install
fi

# Skopiuj .env.example do .env jeśli nie istnieje
if [ ! -f ".env" ]; then
    echo "⚙️  Tworzenie pliku konfiguracji .env..."
    cp .env.example .env
    echo "📝 Edytuj plik services/api/.env z danymi swojej bazy PostgreSQL"
fi

# Uruchom serwer
echo "🌟 Startowanie API serwera na porcie 5000..."
echo "📡 Health check: http://localhost:5000/api/health"
echo "🔗 Płyty: http://localhost:5000/api/plyty/active"
echo "🔗 Rozkroje: http://localhost:5000/api/rozkroje"
echo ""
echo "Aby zatrzymać serwer, naciśnij Ctrl+C"
echo ""

npm run dev
