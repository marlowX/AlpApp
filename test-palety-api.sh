#!/bin/bash

# Test API endpoint dla zapisywania palet
# Uruchom: bash test-palety-api.sh

echo "🧪 Test API endpoint /api/pallets/manual/batch"
echo "=============================================="

# Test data
POZYCJA_ID=68
FORMATKA_ID=288
ILOSC=3

echo "📋 Dane testowe:"
echo "  pozycja_id: $POZYCJA_ID"
echo "  formatka_id: $FORMATKA_ID" 
echo "  ilosc: $ILOSC"
echo ""

# Prepare JSON payload
JSON_PAYLOAD="{
  \"pozycja_id\": $POZYCJA_ID,
  \"palety\": [
    {
      \"formatki\": [
        {
          \"formatka_id\": $FORMATKA_ID,
          \"ilosc\": $ILOSC
        }
      ],
      \"przeznaczenie\": \"MAGAZYN\",
      \"max_waga\": 700,
      \"max_wysokosc\": 1440,
      \"operator\": \"test_script\"
    }
  ]
}"

echo "📤 Wysyłam POST do http://localhost:5001/api/pallets/manual/batch"
echo ""

# Make the API call
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$JSON_PAYLOAD" \
  http://localhost:5001/api/pallets/manual/batch \
  --verbose \
  --show-error

echo ""
echo "=============================================="
echo "🔍 Sprawdź logi backend serwera dla więcej szczegółów"
