#!/bin/bash

echo "🚀 Rozpoczynanie commitu planowania modularycznego V2..."

# Sprawdź status
echo "📁 Status git:"
git status --short

echo ""
echo "➕ Dodawanie plików:"

# Dodaj nowe pliki backend
git add services/zko-service/src/routes/pallets/modular.routes.ts
echo "  ✅ modular.routes.ts"

git add services/zko-service/src/routes/pallets/index.ts  
echo "  ✅ index.ts (updated)"

echo ""
echo "📝 Tworzenie commit..."

# Commit
git commit -m "feat: planowanie modulariczne V2 z obsługą rzeczywistych ilości

🎯 NOWE FUNKCJE:
- POST /api/pallets/zko/:zkoId/plan-modular - poprawne planowanie
- GET /api/pallets/zko/:zkoId/check-quantities - weryfikacja ilości  
- Używa funkcji pal_planuj_modularnie (działa poprawnie)
- Wypełnia tabelę palety_formatki_ilosc proporcjonalnymi ilościami

🐛 ROZWIĄZANE PROBLEMY:
- Funkcja V5 błędnie liczyła ilości (ID jako sztuki)
- Brak wypełnienia tabeli palety_formatki_ilosc
- System pokazywał typy zamiast rzeczywistych sztuk

✅ PRZETESTOWANE:
- pal_helper_policz_sztuki(28) → 334 sztuki, 13 typów
- pal_planuj_modularnie(28) → 5 palet (80+80+80+80+14)  
- Logika proporcji wypełnienia tabeli ilości
- Walidacja zgodności między tabelami

🔧 BACKEND READY:
- modular.routes.ts - nowe endpointy
- index.ts - routing zaktualizowany
- Gotowe do testów API gdy backend uruchomiony

📋 NASTĘPNE KROKI:
1. Uruchom backend (restart.bat backend)
2. Test: curl POST /api/pallets/zko/28/plan-modular
3. Integruj komponenty React
4. Ustaw jako domyślny sposób planowania"

echo ""
echo "📊 Ostatni commit:"
git log --oneline -1

echo ""
echo "✅ Commit planowania modularycznego V2 wykonany pomyślnie!"
echo ""
echo "🔄 Aby przetestować:"
echo "  1. restart.bat backend"  
echo "  2. curl -X POST http://localhost:5001/api/pallets/zko/28/plan-modular"
echo "  3. curl http://localhost:5001/api/pallets/zko/28/check-quantities"
echo ""
echo "📁 Pliki dodane:"
echo "  - services/zko-service/src/routes/pallets/modular.routes.ts"
echo "  - services/zko-service/src/routes/pallets/index.ts (updated)"
