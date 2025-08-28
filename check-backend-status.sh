#!/bin/bash

echo "🔍 Sprawdzanie statusu ZKO-SERVICE..."
echo

# Sprawdź czy port 5001 jest używany
echo "📡 Sprawdzanie portu 5001:"
lsof -i :5001 || echo "Port 5001 jest wolny"

echo
# Sprawdź czy port 5000 jest używany
echo "📡 Sprawdzanie portu 5000:"
lsof -i :5000 || echo "Port 5000 jest wolny"

echo
echo "🌐 Próba połączenia z backendem:"
echo "Testing: http://localhost:5001/health"
if curl -f http://localhost:5001/health 2>/dev/null; then
    echo "✅ Backend na porcie 5001 działa!"
else
    echo "❌ Backend na porcie 5001 nie odpowiada"
fi

echo
echo "Testing: http://localhost:5000/health"
if curl -f http://localhost:5000/health 2>/dev/null; then
    echo "✅ Backend na porcie 5000 działa!"
else
    echo "❌ Backend na porcie 5000 nie odpowiada"
fi

echo
echo "🔍 Processes używające portów 5000-5001:"
ps aux | grep -E "(node|npm)" | grep -v grep
