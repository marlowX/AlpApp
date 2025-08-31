#!/bin/bash
cd /d/PROJEKTY/PROGRAMOWANIE/AlpApp

# Konfiguracja git
git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"

# Status
echo "📊 Status zmian:"
git status --short

# Dodaj zmiany
git add .

# Commit
git commit -m "feat: Ulepszona edycja palet z rzeczywistą zawartością i zmianą przeznaczenia

✨ Nowe funkcjonalności:
- Edycja palety pokazuje rzeczywiste formatki na palecie (nie z pozycji)
- Możliwość usunięcia formatki z palety przyciskiem Usuń
- Możliwość zmiany ilości formatek bezpośrednio w tabeli
- Możliwość zmiany przeznaczenia palety (MAGAZYN, PIŁA, OKLEJARKA, WIERTARKA, KLIENT, TRANSPORT)
- Podsumowanie zmian przed zapisem

🔧 Zmiany techniczne:
- Nowy modal EditPaletaModal z pełną edycją zawartości
- Endpoint DELETE /api/pallets/:id/clear-formatki do czyszczenia palety
- Endpoint POST /api/pallets/:id/update-formatki do aktualizacji formatek
- Automatyczne obliczanie wagi i wysokości przy aktualizacji

🔄 Naprawione odświeżanie:
- Dodano refreshCounter do wymuszenia odświeżania
- handleFullRefresh() odświeża palety, formatki i ZKO
- Przycisk Odśwież wszystko w headerze
- Automatyczne odświeżanie po każdej akcji

🐛 Poprawki błędów:
- Naprawiono błąd undefined w usePaletaLogic
- Zabezpieczenia przed brakiem danych
- Poprawiona logika znajdowania pozycja_id
- Obsługa pustej palety (tylko zmiana przeznaczenia)"

echo "✅ Zmiany zatwierdzone!"

# Push
echo "📤 Wysyłanie na serwer..."
git push

echo "✅ Wszystko gotowe!"