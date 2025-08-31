#!/bin/bash
# Test endpointów usuwania i edycji pozycji

echo "=========================================="
echo "🧪 Test API usuwania i edycji pozycji"
echo "=========================================="

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:5001/api"

echo -e "\n${YELLOW}1. Test health check:${NC}"
curl -s "$API_URL/../health" | python -m json.tool

echo -e "\n${YELLOW}2. Pobierz listę ZKO:${NC}"
curl -s "$API_URL/zko" | python -m json.tool | head -20

echo -e "\n${YELLOW}3. Test usuwania pozycji (nieistniejąca):${NC}"
echo "DELETE /api/zko/pozycje/99999"
response=$(curl -s -X DELETE "$API_URL/zko/pozycje/99999" \
  -H "Content-Type: application/json" \
  -d '{"uzytkownik":"test","powod":"test usunięcia"}')
echo "$response" | python -m json.tool

echo -e "\n${YELLOW}4. Test edycji pozycji (nieistniejąca):${NC}"
echo "PUT /api/zko/pozycje/99999"
response=$(curl -s -X PUT "$API_URL/zko/pozycje/99999" \
  -H "Content-Type: application/json" \
  -d '{"ilosc_plyt":3,"kolor_plyty":"TEST"}')
echo "$response" | python -m json.tool

echo -e "\n${YELLOW}5. Pobierz istniejące pozycje:${NC}"
# Najpierw znajdź ZKO
zko_response=$(curl -s "$API_URL/zko" | python -c "import sys, json; data = json.load(sys.stdin); print(data['data'][0]['id'] if data['data'] else 0)")

if [ "$zko_response" != "0" ]; then
    echo "Znaleziono ZKO ID: $zko_response"
    
    # Pobierz szczegóły ZKO
    echo -e "\n${YELLOW}6. Szczegóły ZKO:${NC}"
    curl -s "$API_URL/zko/$zko_response" | python -m json.tool | grep -A 5 "pozycje"
else
    echo -e "${RED}Brak ZKO w bazie danych${NC}"
fi

echo -e "\n${GREEN}=========================================="
echo "✅ Test zakończony"
echo "==========================================${NC}"
echo ""
echo "Instrukcje dalszego testowania:"
echo "1. Otwórz przeglądarkę: http://localhost:3001"
echo "2. Przejdź do szczegółów dowolnego ZKO"
echo "3. Spróbuj usunąć lub edytować pozycję"
echo "4. Sprawdź konsolę przeglądarki (F12) dla szczegółów"