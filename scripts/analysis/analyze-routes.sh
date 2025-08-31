#!/bin/bash
# Kompleksowe sprawdzenie wszystkich plików routes

echo "=========================================="
echo "📊 KOMPLETNA ANALIZA PLIKÓW ROUTES"
echo "=========================================="

cd D:/PROJEKTY/PROGRAMOWANIE/AlpApp/services/zko-service/src/routes

echo "📁 PLIKI GŁÓWNE:"
echo "----------------"
for file in *.ts; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        size=$(du -h "$file" | cut -f1)
        
        if [ $lines -gt 300 ]; then
            echo "❌ $file"
            echo "   Linie: $lines (PRZEKROCZONY LIMIT!)"
            echo "   Rozmiar: $size"
        elif [ $lines -gt 250 ]; then
            echo "⚠️  $file"
            echo "   Linie: $lines (blisko limitu)"
            echo "   Rozmiar: $size"
        elif [ $lines -lt 10 ]; then
            echo "📄 $file (DEPRECATED/REDIRECT)"
            echo "   Linie: $lines"
        else
            echo "✅ $file"
            echo "   Linie: $lines"
            echo "   Rozmiar: $size"
        fi
        echo ""
    fi
done

echo "📁 MODUŁ ZKO:"
echo "-------------"
if [ -d "zko" ]; then
    total_lines=0
    file_count=0
    
    for file in zko/*.ts zko/*/*.ts; do
        if [ -f "$file" ]; then
            lines=$(wc -l < "$file")
            basename=$(basename "$file")
            dirname=$(dirname "$file")
            
            ((total_lines += lines))
            ((file_count++))
            
            if [ $lines -gt 300 ]; then
                echo "❌ $dirname/$basename - $lines linii"
            elif [ $lines -gt 250 ]; then
                echo "⚠️  $dirname/$basename - $lines linii"
            else
                echo "✅ $dirname/$basename - $lines linii"
            fi
        fi
    done
    
    echo ""
    echo "📊 Statystyki ZKO:"
    echo "   Plików: $file_count"
    echo "   Łącznie linii: $total_lines"
    if [ $file_count -gt 0 ]; then
        avg=$((total_lines / file_count))
        echo "   Średnia: $avg linii/plik"
    fi
fi

echo ""
echo "📁 MODUŁ PALLETS:"
echo "-----------------"
if [ -d "pallets" ]; then
    total_lines=0
    file_count=0
    
    for file in pallets/*.ts pallets/*/*.ts; do
        if [ -f "$file" ]; then
            lines=$(wc -l < "$file")
            basename=$(basename "$file")
            dirname=$(dirname "$file")
            
            ((total_lines += lines))
            ((file_count++))
            
            if [ $lines -gt 300 ]; then
                echo "❌ $dirname/$basename - $lines linii"
            elif [ $lines -gt 250 ]; then
                echo "⚠️  $dirname/$basename - $lines linii"
            else
                echo "✅ $dirname/$basename - $lines linii"
            fi
        fi
    done
    
    echo ""
    echo "📊 Statystyki Pallets:"
    echo "   Plików: $file_count"
    echo "   Łącznie linii: $total_lines"
    if [ $file_count -gt 0 ]; then
        avg=$((total_lines / file_count))
        echo "   Średnia: $avg linii/plik"
    fi
fi

echo ""
echo "=========================================="
echo "📋 PODSUMOWANIE:"
echo "=========================================="

# Policz problematyczne pliki
problems=0
warnings=0

for file in *.ts */*.ts */*/*.ts; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ $lines -gt 300 ]; then
            ((problems++))
        elif [ $lines -gt 250 ]; then
            ((warnings++))
        fi
    fi
done

echo "❌ Pliki > 300 linii: $problems"
echo "⚠️  Pliki > 250 linii: $warnings"

if [ $problems -eq 0 ]; then
    echo ""
    echo "✅ WSZYSTKIE PLIKI SPEŁNIAJĄ LIMIT 300 LINII!"
else
    echo ""
    echo "⚠️  UWAGA: Niektóre pliki wymagają refaktoryzacji!"
fi

echo ""
echo "📂 Struktura katalogów:"
ls -la | grep "^d" | awk '{print "   📁", $9}'