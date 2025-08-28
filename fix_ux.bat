cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "UX Fix: Lepsze doświadczenie użytkownika przy dodawaniu pozycji

- Brak błędów przy otwarciu formularza - zamiast tego przyjazna instrukcja
- Walidacja rozpoczyna się dopiero po interakcji użytkownika
- Wprowadzony stan 'hasBeenTouched' do śledzenia czy użytkownik coś już zrobił
- Informacyjny alert z krokami do wykonania zamiast czerwonych błędów
- Numeracja kroków (1, 2, 3) dla lepszej nawigacji
- Przycisk Dodaj pozycję aktywny od początku
- Błędy pokazują się dopiero gdy użytkownik wybierze rozkrój lub płytę"

git push
echo "UX naprawiony - bez straszenia błędami!"
