#!/bin/bash
# Test funkcji PaletyManager V5

echo "=========================================="
echo "🧪 Test PaletyManager V5"
echo "=========================================="
echo ""

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:5001/api"

echo -e "${BLUE}[1/7] Test health check backendu...${NC}"
HEALTH=$(curl -s "$API_URL/../health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend działa${NC}"
    echo "Response: $HEALTH"
else
    echo -e "${RED}❌ Backend nie odpowiada${NC}"
    echo "Uruchom: start.bat backend"
    exit 1
fi

echo ""
echo -e "${BLUE}[2/7] Test dostępności funkcji V5...${NC}"
FUNCTIONS_CHECK=$(curl -s "$API_URL/pallets/functions/check")
echo "Response: $FUNCTIONS_CHECK"

if echo "$FUNCTIONS_CHECK" | grep -q '"sukces":true'; then
    echo -e "${GREEN}✅ Funkcje V5 są dostępne${NC}"
else
    echo -e "${RED}❌ Funkcje V5 nie są dostępne${NC}"
    echo "Uruchom: ./run-scripts.sh install-palety-v5"
    exit 1
fi

echo ""
echo -e "${BLUE}[3/7] Test planowania palet V5...${NC}"

# Znajdź testowe ZKO
ZKO_LIST=$(curl -s "$API_URL/zko" | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('data'):
        print(data['data'][0]['id'])
    else:
        print('0')
except:
    print('0')
" 2>/dev/null)

if [ "$ZKO_LIST" != "0" ]; then
    TEST_ZKO_ID=$ZKO_LIST
    echo "Używam ZKO ID: $TEST_ZKO_ID"
    
    # Test planowania V5
    PLAN_V5_RESULT=$(curl -s -X POST "$API_URL/pallets/zko/$TEST_ZKO_ID/plan-v5" \
      -H "Content-Type: application/json" \
      -d '{
        "strategia": "inteligentna",
        "max_wysokosc_mm": 1440,
        "max_formatek_na_palete": 200,
        "max_waga_kg": 700,
        "grubosc_plyty": 18,
        "typ_palety": "EURO",
        "uwzglednij_oklejanie": true,
        "nadpisz_istniejace": false
      }')
    
    echo "Plan V5 result:"
    echo "$PLAN_V5_RESULT" | python -m json.tool 2>/dev/null || echo "$PLAN_V5_RESULT"
    
    if echo "$PLAN_V5_RESULT" | grep -q '"sukces":true'; then
        echo -e "${GREEN}✅ Planowanie V5 działa${NC}"
    else
        echo -e "${YELLOW}⚠️  Planowanie V5 zwróciło ostrzeżenie lub błąd${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Brak ZKO do testowania${NC}"
    TEST_ZKO_ID="27" # Fallback
fi

echo ""
echo -e "${BLUE}[4/7] Test statystyk palet...${NC}"
STATS_RESULT=$(curl -s "$API_URL/pallets/stats/$TEST_ZKO_ID")
echo "Statystyki:"
echo "$STATS_RESULT" | python -m json.tool 2>/dev/null || echo "$STATS_RESULT"

echo ""
echo -e "${BLUE}[5/7] Test czyszczenia pustych palet...${NC}"
CLEAN_RESULT=$(curl -s -X POST "$API_URL/pallets/clean-empty" \
  -H "Content-Type: application/json" \
  -d "{\"zko_id\": $TEST_ZKO_ID, \"operator\": \"test\"}")

echo "Czyszczenie pustych:"
echo "$CLEAN_RESULT" | python -m json.tool 2>/dev/null || echo "$CLEAN_RESULT"

echo ""
echo -e "${BLUE}[6/7] Test pobierania palet dla ZKO...${NC}"
PALLETS_LIST=$(curl -s "$API_URL/pallets/zko/$TEST_ZKO_ID")
PALLETS_COUNT=$(echo "$PALLETS_LIST" | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('palety'):
        print(len(data['palety']))
    else:
        print('0')
except:
    print('0')
" 2>/dev/null)

echo "Liczba palet dla ZKO $TEST_ZKO_ID: $PALLETS_COUNT"
if [ "$PALLETS_COUNT" != "0" ]; then
    echo -e "${GREEN}✅ Pobieranie palet działa${NC}"
    
    # Pokaż pierwszą paletę
    echo "Przykład palety:"
    echo "$PALLETS_LIST" | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('palety') and len(data['palety']) > 0:
        paleta = data['palety'][0]
        print(f\"  ID: {paleta.get('id')}\")
        print(f\"  Numer: {paleta.get('numer_palety')}\")
        print(f\"  Status: {paleta.get('status')}\")
        print(f\"  Formatki: {paleta.get('ilosc_formatek', 0)}\")
        print(f\"  Wysokość: {paleta.get('wysokosc_stosu', 0)}mm\")
except:
    print('  Błąd parsowania')
" 2>/dev/null
else
    echo -e "${YELLOW}⚠️  Brak palet (to normalne dla pustego ZKO)${NC}"
fi

echo ""
echo -e "${BLUE}[7/7] Test reorganizacji (jeśli są palety)...${NC}"
if [ "$PALLETS_COUNT" != "0" ] && [ "$PALLETS_COUNT" -gt 1 ]; then
    REORGANIZE_RESULT=$(curl -s -X POST "$API_URL/pallets/zko/$TEST_ZKO_ID/reorganize" \
      -H "Content-Type: application/json" \
      -d '{"strategia": "optymalizacja", "operator": "test"}')
    
    echo "Reorganizacja:"
    echo "$REORGANIZE_RESULT" | python -m json.tool 2>/dev/null || echo "$REORGANIZE_RESULT"
    
    if echo "$REORGANIZE_RESULT" | grep -q '"sukces":true'; then
        echo -e "${GREEN}✅ Reorganizacja działa${NC}"
    else
        echo -e "${YELLOW}⚠️  Reorganizacja zwróciła ostrzeżenie${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Za mało palet do testowania reorganizacji${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Test PaletyManager V5 zakończony!${NC}"
echo "=========================================="
echo ""

# Podsumowanie
echo "📊 Podsumowanie testów:"
if echo "$FUNCTIONS_CHECK" | grep -q '"sukces":true'; then
    echo -e "• Funkcje V5: ${GREEN}✅ DOSTĘPNE${NC}"
else
    echo -e "• Funkcje V5: ${RED}❌ NIEDOSTĘPNE${NC}"
fi

if echo "$PLAN_V5_RESULT" | grep -q '"sukces":true'; then
    echo -e "• Planowanie V5: ${GREEN}✅ DZIAŁA${NC}"
else
    echo -e "• Planowanie V5: ${YELLOW}⚠️  WYMAGA SPRAWDZENIA${NC}"
fi

if [ "$PALLETS_COUNT" != "0" ]; then
    echo -e "• Pobieranie palet: ${GREEN}✅ DZIAŁA${NC}"
else
    echo -e "• Pobieranie palet: ${YELLOW}⚠️  BRAK DANYCH TESTOWYCH${NC}"
fi

echo ""
echo "🎯 Następne kroki:"
echo "1. Otwórz aplikację: http://localhost:3001"
echo "2. Przejdź do dowolnego ZKO"
echo "3. Kliknij zakładkę 'Palety'"
echo "4. Przetestuj 'Planuj V5' z różnymi strategiami"
echo "5. Sprawdź działanie 'Reorganizuj' i 'Usuń inteligentnie'"
echo ""
echo "📖 Dokumentacja: apps/zko/src/modules/zko/components/PaletyManager/README.md"
echo ""

# Sprawdź czy frontend działa
curl -s http://localhost:3001 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}🌐 Frontend działa na: http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend nie działa - uruchom: start.bat frontend${NC}"
fi

echo ""