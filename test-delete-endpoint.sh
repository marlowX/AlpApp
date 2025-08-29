#!/bin/bash

echo "Testing ZKO DELETE endpoint..."
echo "================================"

# Test direct backend endpoint
echo "1. Testing direct backend (port 5001):"
curl -X DELETE http://localhost:5001/api/zko/pozycje/45 \
  -H "Content-Type: application/json" \
  -d '{"uzytkownik": "test"}' \
  -v

echo ""
echo "================================"
echo "2. Testing through Vite proxy (port 3001):"
curl -X DELETE http://localhost:3001/api/zko/pozycje/45 \
  -H "Content-Type: application/json" \
  -d '{"uzytkownik": "test"}' \
  -v

echo ""
echo "================================"
echo "3. Testing GET to check if routing works:"
curl http://localhost:5001/api/zko -v

echo ""
echo "================================"
echo "4. Testing health endpoint:"
curl http://localhost:5001/health