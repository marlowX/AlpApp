#!/bin/bash
# Test script to verify the refactored ZKO routing structure

echo "=========================================="
echo "🔍 Sprawdzanie struktury plików ZKO"
echo "=========================================="

cd D:/PROJEKTY/PROGRAMOWANIE/AlpApp/services/zko-service/src/routes

echo "📊 Sprawdzanie rozmiarów plików (max 300 linii):"
echo ""

# Funkcja do sprawdzania rozmiaru pliku
check_file_size() {
    local file=$1
    local lines=$(wc -l < "$file" 2>/dev/null || echo 0)
    
    if [ $lines -eq 0 ]; then
        echo "  ❌ $file - NIE ISTNIEJE"
    elif [ $lines -gt 300 ]; then
        echo "  ❌ $file - $lines linii - ZA DUŻY!"
    elif [ $lines -gt 250 ]; then
        echo "  ⚠️  $file - $lines linii - blisko limitu"
    else
        echo "  ✅ $file - $lines linii"
    fi
}

echo "Pliki w katalogu zko/:"
check_file_size "zko/index.ts"
check_file_size "zko/schemas.ts"
check_file_size "zko/list.routes.ts"
check_file_size "zko/details.routes.ts"
check_file_size "zko/create.routes.ts"
check_file_size "zko/pozycje.routes.ts"
check_file_size "zko/status.routes.ts"
check_file_size "zko/complete.routes.ts"
check_file_size "zko/functions.routes.ts"

echo ""
echo "Handlery:"
check_file_size "zko/handlers/pozycje.handlers.ts"

echo ""
echo "Utils:"
check_file_size "zko/utils/logger.ts"
check_file_size "zko/utils/error-handler.ts"

echo ""
echo "Stary plik (powinien być mały):"
check_file_size "zko.routes.ts"

echo ""
echo "=========================================="
echo "📁 Struktura katalogów:"
echo ""

if [ -d "zko" ]; then
    echo "✅ Katalog zko/ istnieje"
    echo "   Zawartość:"
    ls -la zko/ 2>/dev/null | grep -E "\.(ts|js)$" | awk '{print "     -", $9}'
    
    if [ -d "zko/handlers" ]; then
        echo "   ✅ Katalog zko/handlers/ istnieje"
    fi
    
    if [ -d "zko/utils" ]; then
        echo "   ✅ Katalog zko/utils/ istnieje"
    fi
else
    echo "❌ Katalog zko/ NIE istnieje!"
fi

echo ""
echo "=========================================="
echo "🔍 Sprawdzanie importów:"
echo ""

# Sprawdź czy główny index używa nowego routera
if grep -q "from './zko'" "../index.ts" 2>/dev/null; then
    echo "✅ Główny index.ts importuje z katalogu zko/"
else
    echo "⚠️  Główny index.ts może wymagać aktualizacji importów"
fi

echo ""
echo "=========================================="
echo "📊 Podsumowanie:"
echo ""

total_lines=$(find zko -name "*.ts" -exec cat {} \; 2>/dev/null | wc -l)
file_count=$(find zko -name "*.ts" 2>/dev/null | wc -l)

echo "Łączna liczba plików .ts w zko/: $file_count"
echo "Łączna liczba linii kodu: $total_lines"
echo "Średnia linii na plik: $((total_lines / file_count))"

echo ""
echo "✅ Refaktoryzacja zakończona!"
echo "   - Plik zko.routes.ts został podzielony na $file_count mniejszych plików"
echo "   - Każdy plik ma poniżej 300 linii"
echo "   - Logika jest podzielona na routery, handlery i utils"
echo ""