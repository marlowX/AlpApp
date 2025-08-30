# Archiwum - Stare skrypty

Ten katalog zawiera stare wersje skryptów, które zostały zastąpione przez nowe, skonsolidowane wersje.

## 🗂️ Zastąpione skrypty

### Stare skrypty startowe (zastąpione przez `start.bat`):
- `start-all.bat` - Pełny restart aplikacji
- `start-app.bat` - Uruchamianie aplikacji  
- `start-zko-app.bat` - Start ZKO z otwarciem przeglądarki
- `start-zko-service.bat` - Tylko backend
- `start-backend-debug.bat` - Backend z diagnostyką

**Nowy skrypt:** `../start.bat` - Jeden skrypt z opcjami

### Stare skrypty restart (zastąpione przez `restart.bat`):
- `restart-backend.bat` - Restart backendu
- `clean-restart-backend.bat` - Restart z czyszczeniem
- `restart-zko-safe.bat` - Bezpieczny restart

**Nowy skrypt:** `../restart.bat` - Jeden skrypt z opcjami

## 🚀 Nowe uproszczone skrypty

Zamiast 8 różnych skryptów startowych, teraz masz tylko 2:

### `start.bat` - Uniwersalny launcher
```bash
start.bat              # Uruchom backend + frontend
start.bat backend      # Tylko backend
start.bat frontend     # Tylko frontend  
start.bat clean        # Zabij procesy i uruchom od nowa
start.bat debug        # Uruchom z diagnostyką portów
```

### `restart.bat` - Inteligentny restart
```bash
restart.bat            # Restart backend + frontend
restart.bat backend    # Restart tylko backend
restart.bat frontend   # Restart tylko frontend
restart.bat clean      # Restart z czyszczeniem cache
```

## ♻️ Można usunąć

Te pliki są już niepotrzebne, ponieważ ich funkcjonalność została przeniesiona do nowych skryptów. Można je usunąć po upewnieniu się, że nowe skrypty działają poprawnie.

## 🎯 Korzyści

- **Mniej plików** - 8 skryptów → 2 skrypty
- **Więcej opcji** - każdy skrypt ma wiele trybów
- **Lepsze UX** - jasne opcje i pomoc
- **Łatwiejsza konserwacja** - jeden skrypt do aktualizowania zamiast wielu