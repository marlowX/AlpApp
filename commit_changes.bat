@echo off
echo Dodawanie zmian do Git...

git add .
git commit -m "feat(zko): Ulepszone komponenty AddPozycja z wizualizacją wymiarów i limitem 5 płyt

- Dodano wizualną analizę wymiarów płyt (WymiaryInfo)
- Implementacja globalnego limitu 5 płyt na pozycję
- Rozbicie komponentów na mniejsze (max 300 linii)
- Dodano funkcjonalność usuwania pozycji
- Nowy layout strony szczegółów ZKO
- Dokumentacja logiki biznesowej PostgreSQL
- Komponenty: WymiaryColumn, ParametryColumn, IloscColumn
- Alerty i Badge'e pokazujące limity i przekroczenia"

echo.
echo Commit wykonany!
echo.
pause