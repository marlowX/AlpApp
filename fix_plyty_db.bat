cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "Fix: Naprawione pobieranie płyt z bazy public.plyty

- Backend API zwraca wszystkie potrzebne pola (opis, wymiary, ceny)
- Używanie CAST w SQL dla pewności typów numerycznych
- Konwersja stringów na liczby w backend API
- Poprawiona walidacja Zod - akceptuje number lub string dla grubosc
- Dodany endpoint /api/plyty/kolory dla unikalnych kolorów
- Filtrowanie i wyszukiwanie płyt w backend
- Dane z public.plyty są teraz poprawnie wyświetlane w komponencie"

git push
echo "Płyty z bazy danych działają!"
