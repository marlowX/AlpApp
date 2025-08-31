#!/bin/bash

echo "==================================="
echo "Test endpointów ZKO"
echo "==================================="
echo ""

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 1. Test health check
echo "1. Health check..."
HEALTH=$(curl -s http://localhost:5001/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend działa${NC}"
    echo "Response: $HEALTH"
else
    echo -e "${RED}✗ Backend nie odpowiada${NC}"
    exit 1
fi
echo ""

# 2. Test listy ZKO
echo "2. Lista ZKO..."
LIST=$(curl -s http://localhost:5001/api/zko)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Endpoint /api/zko działa${NC}"
else
    echo -e "${RED}✗ Endpoint /api/zko nie działa${NC}"
fi
echo ""

# 3. Test szczegółów ZKO 27
echo "3. Szczegóły ZKO 27..."
DETAILS=$(curl -s http://localhost:5001/api/zko/27)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Endpoint /api/zko/27 działa${NC}"
else
    echo -e "${RED}✗ Endpoint /api/zko/27 nie działa${NC}"
fi
echo ""

# 4. Test edycji pozycji 39
echo "4. Test edycji pozycji 39..."
EDIT=$(curl -s -X PUT http://localhost:5001/api/zko/pozycje/39 \
  -H "Content-Type: application/json" \
  -d '{
    "rozkroj_id": 2,
    "ilosc_plyt": 5,
    "kolor_plyty": "TEST_KOLOR",
    "nazwa_plyty": "TEST_NAZWA",
    "kolejnosc": 1,
    "uwagi": "Test z curl"
  }')
echo "Response: $EDIT"
echo ""

# 5. Test usuwania pozycji (utworzymy testową)
echo "5. Tworzenie testowej pozycji..."
ADD=$(curl -s -X POST http://localhost:5001/api/zko/pozycje/add \
  -H "Content-Type: application/json" \
  -d '{
    "zko_id": 27,
    "rozkroj_id": 2,
    "kolory_plyty": [{"kolor": "TEST", "nazwa": "TEST_PLYTA", "ilosc": 1}],
    "kolejnosc": 999,
    "uwagi": "Pozycja testowa do usunięcia"
  }')
echo "Add response: $ADD"

# Wyciągnij ID dodanej pozycji
POZYCJA_ID=$(echo $ADD | grep -o '"pozycja_id":[0-9]*' | grep -o '[0-9]*')
echo "Utworzona pozycja ID: $POZYCJA_ID"
echo ""

# 6. Test usuwania pozycji
if [ ! -z "$POZYCJA_ID" ]; then
    echo "6. Test usuwania pozycji $POZYCJA_ID..."
    DELETE=$(curl -s -X DELETE http://localhost:5001/api/zko/pozycje/$POZYCJA_ID \
      -H "Content-Type: application/json" \
      -d '{"uzytkownik": "test"}')
    echo "Delete response: $DELETE"
else
    echo -e "${RED}✗ Nie można przetestować usuwania - brak ID pozycji${NC}"
fi

echo ""
echo "==================================="
echo "Test zakończony"
echo "===================================" 