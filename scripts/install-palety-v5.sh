#!/bin/bash
# Skrypt instalacji funkcji PaletyManager V5

echo "=========================================="
echo "🚀 Instalacja PaletyManager V5"
echo "=========================================="
echo ""

# Kolory dla czytelności
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="alpsys"
DB_SCHEMA="zko"

echo -e "${BLUE}[1/6] Sprawdzam połączenie z bazą danych...${NC}"
psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Połączenie z bazą danych OK${NC}"
else
    echo -e "${RED}❌ Brak połączenia z bazą danych${NC}"
    echo "Sprawdź czy PostgreSQL działa i czy masz dostęp do bazy '$DB_NAME'"
    exit 1
fi

echo ""
echo -e "${BLUE}[2/6] Sprawdzam istniejące funkcje palet...${NC}"
EXISTING_FUNCTIONS=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = '$DB_SCHEMA' 
AND routine_name LIKE 'pal_%'
ORDER BY routine_name;
" | tr '\n' ' ')

echo "Znalezione funkcje: $EXISTING_FUNCTIONS"

# Sprawdź czy są funkcje V5
V5_COUNT=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.routines 
WHERE routine_schema = '$DB_SCHEMA' 
AND routine_name IN (
    'pal_planuj_inteligentnie_v5',
    'pal_usun_inteligentnie',
    'pal_reorganizuj_v5',
    'pal_wyczysc_puste_v2'
);
" | tr -d ' ')

echo "Funkcje V5 dostępne: $V5_COUNT/4"

echo ""
echo -e "${BLUE}[3/6] Instaluję nowe funkcje V5...${NC}"

# Sprawdź czy pliki funkcji istnieją
FUNCTIONS_DIR="D:/PROJEKTY/PROGRAMOWANIE/AlpApp/database/functions"

if [ ! -f "$FUNCTIONS_DIR/palety_v5.sql" ]; then
    echo -e "${RED}❌ Brak pliku palety_v5.sql${NC}"
    echo "Ścieżka: $FUNCTIONS_DIR/palety_v5.sql"
    exit 1
fi

if [ ! -f "$FUNCTIONS_DIR/palety_management_v5.sql" ]; then
    echo -e "${RED}❌ Brak pliku palety_management_v5.sql${NC}"
    echo "Ścieżka: $FUNCTIONS_DIR/palety_management_v5.sql"
    exit 1
fi

echo "Instaluję funkcje planowania V5..."
psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -f "$FUNCTIONS_DIR/palety_v5.sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Funkcje planowania V5 zainstalowane${NC}"
else
    echo -e "${RED}❌ Błąd instalacji funkcji planowania V5${NC}"
    exit 1
fi

echo "Instaluję funkcje zarządzania V5..."
psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -f "$FUNCTIONS_DIR/palety_management_v5.sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Funkcje zarządzania V5 zainstalowane${NC}"
else
    echo -e "${RED}❌ Błąd instalacji funkcji zarządzania V5${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}[4/6] Sprawdzam poprawność instalacji...${NC}"

NEW_V5_COUNT=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.routines 
WHERE routine_schema = '$DB_SCHEMA' 
AND routine_name IN (
    'pal_planuj_inteligentnie_v5',
    'pal_usun_inteligentnie',
    'pal_reorganizuj_v5',
    'pal_wyczysc_puste_v2'
);
" | tr -d ' ')

if [ "$NEW_V5_COUNT" = "4" ]; then
    echo -e "${GREEN}✅ Wszystkie funkcje V5 zainstalowane poprawnie${NC}"
else
    echo -e "${YELLOW}⚠️  Zainstalowano $NEW_V5_COUNT/4 funkcji V5${NC}"
fi

echo ""
echo -e "${BLUE}[5/6] Testuję funkcje V5...${NC}"

# Test funkcji planowania V5
echo "Test pal_planuj_inteligentnie_v5..."
TEST_RESULT=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "
SELECT sukces 
FROM zko.pal_planuj_inteligentnie_v5(
    1,              -- test ZKO ID
    'inteligentna', -- strategia
    1440,           -- max wysokość  
    200,            -- max formatki
    700,            -- max waga
    18,             -- grubość
    'EURO',         -- typ palety
    true,           -- oklejanie
    'test',         -- operator
    false           -- nie nadpisuj
);
" 2>/dev/null | tr -d ' ')

if [ "$TEST_RESULT" = "t" ] || [ "$TEST_RESULT" = "f" ]; then
    echo -e "${GREEN}✅ Funkcja pal_planuj_inteligentnie_v5 działa${NC}"
else
    echo -e "${YELLOW}⚠️  Funkcja pal_planuj_inteligentnie_v5 zwróciła: $TEST_RESULT${NC}"
fi

echo ""
echo -e "${BLUE}[6/6] Sprawdzam endpoint API V5...${NC}"

# Test czy backend działa
curl -s http://localhost:5001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend działa${NC}"
    
    # Test endpointu sprawdzania funkcji
    API_CHECK=$(curl -s http://localhost:5001/api/pallets/functions/check)
    if [[ $API_CHECK == *"\"sukces\":true"* ]]; then
        echo -e "${GREEN}✅ Endpoint /api/pallets/functions/check działa${NC}"
    else
        echo -e "${YELLOW}⚠️  Endpoint może wymagać restartu backendu${NC}"
        echo "Wykonaj: restart.bat backend"
    fi
else
    echo -e "${YELLOW}⚠️  Backend nie działa - nie można przetestować API${NC}"
    echo "Wykonaj: start.bat backend"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Instalacja PaletyManager V5 zakończona!${NC}"
echo "=========================================="
echo ""
echo "📋 Podsumowanie:"
echo "• Funkcje V5 w bazie: $NEW_V5_COUNT/4"
if [ "$NEW_V5_COUNT" = "4" ]; then
    echo -e "• Status: ${GREEN}GOTOWE DO UŻYCIA${NC}"
else
    echo -e "• Status: ${YELLOW}WYMAGA SPRAWDZENIA${NC}"
fi
echo ""
echo "🎯 Następne kroki:"
echo "1. Restart backendu: restart.bat backend"
echo "2. Test w przeglądarce: http://localhost:3001"
echo "3. Idź do dowolnego ZKO → Palety → 'Planuj V5'"
echo "4. Przetestuj nowe strategie planowania"
echo ""
echo "📖 Dokumentacja: ./src/modules/zko/components/PaletyManager/README.md"
echo ""
echo "🐛 W razie problemów:"
echo "   ./run-scripts.sh test-zko"
echo "   curl http://localhost:5001/api/pallets/functions/check"
echo ""