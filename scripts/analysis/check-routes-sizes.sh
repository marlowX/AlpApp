#!/bin/bash
# Skrypt do sprawdzania rozmiarów plików w routes

echo "=========================================="
echo "📊 Analiza plików w routes/"
echo "=========================================="

cd /d/PROJEKTY/PROGRAMOWANIE/AlpApp/services/zko-service/src/routes

echo "Sprawdzanie rozmiarów plików:"
echo ""

for file in *.ts; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ $lines -gt 300 ]; then
            echo "❌ $file - $lines linii - ZA DUŻY!"
        elif [ $lines -gt 250 ]; then
            echo "⚠️  $file - $lines linii - blisko limitu"
        else
            echo "✅ $file - $lines linii"
        fi
    fi
done

echo ""
echo "=========================================="
echo "Pliki w katalogu zko/:"
echo ""

for file in zko/*.ts zko/*/*.ts; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ $lines -gt 300 ]; then
            echo "❌ $file - $lines linii - ZA DUŻY!"
        elif [ $lines -gt 250 ]; then
            echo "⚠️  $file - $lines linii - blisko limitu"  
        else
            echo "✅ $file - $lines linii"
        fi
    fi
done