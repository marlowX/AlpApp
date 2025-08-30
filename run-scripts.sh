#!/bin/bash
# Skrypt pomocniczy do uruchamiania skryptów z katalogu scripts/

echo "=========================================="
echo "🛠️  AlpApp - Skrypty pomocnicze"  
echo "=========================================="
echo ""

show_help() {
    echo "Dostępne komendy:"
    echo ""
    echo "📊 ANALIZA:"
    echo "  analyze-routes    - Kompleksowa analiza plików routes"
    echo "  check-routes      - Sprawdzanie rozmiarów plików routes"
    echo "  check-env         - Wyszukiwanie process.env w kodzie"
    echo ""
    echo "🧪 TESTOWANIE:"
    echo "  test-delete       - Test endpointów DELETE"
    echo "  test-pozycje      - Test API pozycji"
    echo "  test-refactor     - Weryfikacja struktury po refaktoryzacji"
    echo "  test-zko          - Kompleksowy test endpointów ZKO"
    echo ""
    echo "🔧 DIAGNOSTYKA:"
    echo "  diagnose          - Diagnostyka problemów (Windows)"
    echo "  cleanup           - Sprawdź niepotrzebne pliki"
    echo ""
    echo "💡 GŁÓWNE SKRYPTY (w głównym katalogu):"
    echo "  ../start.bat [opcja]     - Uruchamianie aplikacji"
    echo "  ../restart.bat [opcja]   - Restart aplikacji"
    echo ""
    echo "Użycie: ./run-scripts.sh [komenda]"
    echo "Przykład: ./run-scripts.sh analyze-routes"
    echo ""
}

if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

case $1 in
    "analyze-routes")
        bash scripts/analysis/analyze-routes.sh
        ;;
    "check-routes") 
        bash scripts/analysis/check-all-routes.sh
        ;;
    "check-env")
        bash scripts/analysis/check-process-env.sh
        ;;
    "test-delete")
        bash scripts/testing/test-delete-endpoint.sh
        ;;
    "test-pozycje")
        bash scripts/testing/test-pozycje-api.sh
        ;;
    "test-refactor")
        bash scripts/testing/test-refactor.sh
        ;;
    "test-zko")
        bash scripts/testing/test-zko-endpoints.sh
        ;;
    "diagnose")
        scripts/diagnostics/diagnose-zko.bat
        ;;
    "cleanup")
        bash scripts/cleanup-project.sh
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Nieznana komenda: $1"
        echo ""
        show_help
        exit 1
        ;;
esac