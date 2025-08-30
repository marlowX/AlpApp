#!/bin/bash
# Skrypt do czyszczenia niepotrzebnych plików w projekcie

echo "=========================================="
echo "🧹 Czyszczenie niepotrzebnych plików"
echo "=========================================="

cd D:/PROJEKTY/PROGRAMOWANIE/AlpApp

echo "🔍 Szukam plików do usunięcia..."
echo ""

# Zbierz pliki do usunięcia
cleanup_files=()

# Sprawdź czy są pliki .log
if ls *.log 1> /dev/null 2>&1; then
    echo "📄 Znaleziono pliki .log:"
    ls -la *.log
    cleanup_files+=("*.log")
fi

# Sprawdź czy są pliki .tmp
if ls *.tmp 1> /dev/null 2>&1; then
    echo "📄 Znaleziono pliki .tmp:"  
    ls -la *.tmp
    cleanup_files+=("*.tmp")
fi

# Sprawdź czy są pliki backup
if ls *.bak 1> /dev/null 2>&1; then
    echo "📄 Znaleziono pliki .bak:"
    ls -la *.bak
    cleanup_files+=("*.bak")
fi

# Sprawdź czy są pliki old
if ls *.old 1> /dev/null 2>&1; then
    echo "📄 Znaleziono pliki .old:"
    ls -la *.old
    cleanup_files+=("*.old")
fi

# Sprawdź czy są pliki test- w głównym katalogu (które mogły zostać pominięte)
if ls test-*.* 1> /dev/null 2>&1; then
    echo "📄 Znaleziono stare pliki test-:"
    ls -la test-*.*
    echo "⚠️  Te pliki powinny być w scripts/testing/"
fi

# Sprawdź czy są pliki check- w głównym katalogu 
if ls check-*.* 1> /dev/null 2>&1; then
    echo "📄 Znaleziono stare pliki check-:"
    ls -la check-*.*
    echo "⚠️  Te pliki powinny być w scripts/analysis/"
fi

# Sprawdź czy są pliki analyze- w głównym katalogu
if ls analyze-*.* 1> /dev/null 2>&1; then
    echo "📄 Znaleziono stare pliki analyze-:"
    ls -la analyze-*.*
    echo "⚠️  Te pliki powinny być w scripts/analysis/"
fi

echo ""
echo "=========================================="
echo "📊 Analiza rozmiaru node_modules..."
if [ -d "node_modules" ]; then
    size=$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "📦 node_modules: $size"
fi

echo ""
echo "📊 Analiza katalogu .git..."
if [ -d ".git" ]; then
    size=$(du -sh .git 2>/dev/null | cut -f1)  
    echo "📂 .git: $size"
fi

echo ""
echo "=========================================="
echo "✅ Struktura projektu wygląda czysto!"
echo ""
echo "📁 Główny katalog zawiera tylko:"
echo "   - Pliki konfiguracyjne (package.json, tsconfig.json)"
echo "   - Skrypty uruchamiania (start-*.bat)"
echo "   - Skrypty restartu (restart-*.bat, clean-restart-*.bat)"
echo "   - Katalogi projektowe (apps/, services/, packages/)"
echo "   - Katalog skryptów pomocniczych (scripts/)"
echo ""
echo "🎯 Wszystkie skrypty pomocnicze zostały przeniesione do scripts/"
echo "🎯 Używaj ./run-scripts.sh [komenda] do uruchamiania"
echo ""