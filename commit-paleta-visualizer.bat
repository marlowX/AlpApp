@echo off
echo ========================================
echo Commiting: Paleta Visualizer Integration
echo ========================================
echo.

cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "feat(palety): Dodano wizualizator układu formatek na palecie

- Nowy komponent PaletaVisualizer z 3 widokami (góra, 3D, bok)
- Integracja z PaletaDetails - nowa zakładka Wizualizacja
- Obsługa rzeczywistych danych formatek z palety
- Automatyczne wykrywanie dominującego rozmiaru
- Kolorowanie według typów formatek
- Widok 3D izometryczny stosu poziomów
- Obliczanie optymalnego układania z obracaniem
- Ostrzeżenia o przekroczeniu limitów
- Tryb symulacji dla testowania parametrów"

echo.
echo ========================================
echo Commit completed!
echo ========================================
pause
