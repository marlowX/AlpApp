#!/bin/bash
# Sprawdzanie rozmiarów wszystkich plików routes

echo "=========================================="
echo "📊 Analiza rozmiarów plików w routes/"
echo "=========================================="

cd D:/PROJEKTY/PROGRAMOWANIE/AlpApp/services/zko-service/src/routes

echo "Pliki główne:"
for file in *.ts; do
    if [ -f "$file" ]; then
        lines=$(cat "$file" | wc -l)
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
echo "Katalog zko/:"
for file in zko/*.ts zko/*/*.ts; do
    if [ -f "$file" ]; then
        lines=$(cat "$file" | wc -l)
        basename=$(basename "$file")
        if [ $lines -gt 300 ]; then
            echo "❌ $basename - $lines linii - ZA DUŻY!"
        elif [ $lines -gt 250 ]; then
            echo "⚠️  $basename - $lines linii - blisko limitu"
        else
            echo "✅ $basename - $lines linii"
        fi
    fi
done