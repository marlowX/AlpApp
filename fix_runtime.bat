cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "Fix: Naprawione błędy runtime w PlytySelectorV2

- Dodana funkcja formatPrice() do bezpiecznego formatowania cen
- Obsługa undefined/null wartości dla cena_za_plyte i cena_za_m2
- Sprawdzanie czy wartość jest liczbą przed wywołaniem toFixed()
- Poprawione wyświetlanie wymiarów płyt (opcjonalne)
- Lepsza obsługa edge cases dla danych z bazy"

git push
echo "Błędy runtime naprawione!"
