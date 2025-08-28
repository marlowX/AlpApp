cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "Fix: Naprawione błędy TypeScript w refaktoryzowanych komponentach

- Usunięte JSX z pliku PozycjaService.ts (używamy czystych stringów)
- Dodane brakujące właściwości do typu Plyta (cena_za_m2, dlugosc, szerokosc)
- Dodany index.ts dla services
- Poprawione importy i eksporty
- Wszystkie pliki TypeScript kompilują się bez błędów"

git push
echo "Naprawione błędy kompilacji!"
