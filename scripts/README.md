# Skrypty pomocnicze AlpApp

Ten katalog zawiera skrypty pomocnicze używane podczas rozwoju aplikacji AlpApp.

## Struktura

### 📊 `/analysis/` - Skrypty analizy kodu
- `analyze-routes.sh` - Kompleksowa analiza wszystkich plików routes
- `check-all-routes.sh` - Sprawdzanie rozmiarów plików routes  
- `check-process-env.sh` - Wyszukiwanie użycia process.env w aplikacji
- `check-routes-sizes.sh` - Szybka analiza rozmiarów plików routes

### 🧪 `/testing/` - Skrypty testowe
- `test-delete-endpoint.sh` - Test endpointów DELETE dla ZKO
- `test-pozycje-api.sh` - Test API pozycji (usuwanie, edycja)
- `test-refactor.sh` - Weryfikacja struktury po refaktoryzacji
- `test-zko-endpoints.sh` - Kompleksowy test endpointów ZKO

### 🔧 `/diagnostics/` - Skrypty diagnostyczne
- `diagnose-zko.bat` - Diagnostyka problemów z aplikacją ZKO

## Użycie

Aby uruchomić dowolny skrypt, przejdź do głównego katalogu projektu i wykonaj:

```bash
# Przykład - analiza routes
bash scripts/analysis/analyze-routes.sh

# Przykład - test endpointów  
bash scripts/testing/test-zko-endpoints.sh

# Przykład - diagnostyka (Windows)
scripts/diagnostics/diagnose-zko.bat
```

## Zasady

- Skrypty pomocnicze używane tylko czasowo trafiają tutaj
- Skrypty uruchamiania (start-*.bat) pozostają w głównym katalogu
- Każdy skrypt powinien mieć opis w komentarzu na górze
- Używaj kolorów w output dla lepszej czytelności

## Wskazówki

- Przed usunięciem skryptu upewnij się, że nie jest używany w CI/CD
- Skrypty bash działają w Git Bash na Windows
- Dla skryptów .bat używaj polskich znaków z ostrożnością
