#!/bin/bash
# Sprawdzenie czy są inne miejsca z process.env w aplikacji frontendowej

echo "=========================================="
echo "🔍 Szukanie process.env w aplikacji ZKO"
echo "=========================================="

cd D:/PROJEKTY/PROGRAMOWANIE/AlpApp/apps/zko/src

echo "Szukam plików zawierających 'process.env'..."
grep -r "process\.env" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -20

echo ""
echo "=========================================="
echo "Sprawdzam czy backend działa..."
echo ""

# Test backendu
curl -s http://localhost:5001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend działa na porcie 5001"
else
    echo "❌ Backend NIE działa"
    echo "   Uruchom: cd services/zko-service && npm run dev"
fi

echo ""
echo "Sprawdzam czy frontend działa..."
curl -s http://localhost:3001 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend działa na porcie 3001"
else
    echo "❌ Frontend NIE działa"
    echo "   Uruchom: cd apps/zko && npm run dev"
fi

echo ""
echo "=========================================="
echo "✅ Naprawiono problem z process.env"
echo "   - Usunięto process.env.REACT_APP_API_URL"
echo "   - Używamy teraz '/api' który jest przekierowany przez proxy Vite"
echo ""
echo "🔄 Odśwież przeglądarkę (Ctrl+F5) aby załadować poprawiony kod"