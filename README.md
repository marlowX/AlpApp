# AlpApp - Instrukcje Uruchomienia

## 🚀 Szybki Start

### ⚡ Nowe, uproszczone skrypty

**Uruchamianie aplikacji:**
```bash
# Pełne uruchomienie (backend + frontend)
start.bat

# Tylko backend (port 5001)
start.bat backend

# Tylko frontend (port 3001)  
start.bat frontend

# Restart z czyszczeniem procesów
start.bat clean

# Pomoc i opcje
start.bat help
```

**Restart aplikacji:**
```bash
# Pełny restart
restart.bat

# Restart tylko backendu
restart.bat backend

# Restart z czyszczeniem cache
restart.bat clean
```

### 🎯 Jeden skrypt zamiast ośmiu!

Zastąpiliśmy wszystkie duplikujące się skrypty (`start-all.bat`, `start-app.bat`, `start-zko-app.bat`, `start-zko-service.bat`, `restart-backend.bat`, etc.) dwoma inteligentnymi skryptami z opcjami.

## 🌐 Dostępne Endpointy

- **Frontend ZKO:** http://localhost:3001
- **Backend API:** http://localhost:5001  
- **Health Check:** http://localhost:5001/health

## 🔧 Architektura

### Frontend (Port 3001)
- React + TypeScript + Vite
- Ant Design UI
- React Query + Zustand
- Proxy na backend (/api -> localhost:5001)

### Backend (Port 5001)
- Express.js + TypeScript
- PostgreSQL database
- WebSocket support
- RESTful API

## 📁 Uporządkowana Struktura

```
AlpApp/
├── start.bat                    # 🆕 Uniwersalny launcher
├── restart.bat                  # 🆕 Inteligentny restart
├── run-scripts.sh              # 🆕 Uruchamianie skryptów pomocniczych
│
├── apps/zko/                    # Frontend aplikacji ZKO
│   ├── src/
│   │   ├── modules/zko/         # Moduły ZKO
│   │   │   ├── components/      # Komponenty React
│   │   │   ├── hooks/           # React hooks
│   │   │   └── pages/           # Strony aplikacji
│   │   └── layout/              # Layout aplikacji
│
├── services/zko-service/        # Backend API
│   └── src/
│       └── routes/zko/          # 🎯 Dobrze zorganizowane routes
│           ├── handlers/        # Handlery logiki biznesowej
│           ├── utils/           # Utilities
│           └── *.routes.ts      # Poszczególne routery
│
├── packages/                    # Wspólne biblioteki
│
└── scripts/                     # 🆕 Uporządkowane skrypty pomocnicze
    ├── analysis/                # Skrypty analizy kodu
    ├── testing/                 # Skrypty testowe
    ├── diagnostics/             # Diagnostyka problemów
    └── archive/                 # Stare, zastąpione skrypty
```

## 🛠️ Skrypty Pomocnicze

### Szybkie uruchomienie:
```bash
# Zobacz dostępne skrypty
./run-scripts.sh help

# Analiza struktury routes
./run-scripts.sh analyze-routes

# Test endpointów ZKO  
./run-scripts.sh test-zko

# Diagnostyka problemów
./run-scripts.sh diagnose

# Sprawdź niepotrzebne pliki
./run-scripts.sh cleanup
```

## 🆕 Kluczowe Ulepszenia

### ✅ Eliminacja Duplikacji
- **Przed:** 8 różnych skryptów startowych
- **Po:** 2 inteligentne skrypty z opcjami
- **Korzyść:** Łatwiejsza konserwacja i użytkowanie

### ✅ Uporządkowanie Skryptów Pomocniczych  
- **Przed:** Skrypty rozrzucone w głównym katalogu
- **Po:** Zorganizowane w `scripts/` według funkcji
- **Korzyść:** Czytelna struktura projektu

### ✅ Moduł ZKO Routes
- Podzielony na mniejsze pliki (< 300 linii każdy)
- Handlers oddzielone od routingu
- Utilities w osobnym katalogu
- Dokumentacja w README.md

## 🐛 Rozwiązywanie Problemów

### Problem: "Cannot GET /"
```bash
start.bat frontend
```

### Problem: "Proxy error" lub błędy API
```bash  
start.bat backend
```

### Problem: Aplikacja nie odpowiada
```bash
restart.bat clean
```

### Problem: Port zajęty
```bash
start.bat debug  # Sprawdź co zajmuje porty
```

## 📊 Baza Danych

Aplikacja używa PostgreSQL z schematem `zko`:
- `zlecenia` - Zlecenia kooperantów (główna tabela ZKO)
- `pozycje` - Pozycje w ramach ZKO
- `rozkroje` - Definicje rozkrojów płyt
- `palety` - Zarządzanie paletami
- `bufor_okleiniarka` - Bufory oklejarni

## 🎯 Dostępne Funkcje ZKO

- `utworz_puste_zko()` - Tworzenie nowego ZKO
- `dodaj_pozycje_do_zko()` - Dodawanie pozycji
- `zmien_status_v3()` - Zmiana statusu workflow  
- `pobierz_nastepne_etapy()` - Następne kroki
- `pokaz_status_zko()` - Pełny status
- `pal_planuj_inteligentnie_v3()` - Inteligentne palety
- `raportuj_produkcje_formatek()` - Raportowanie
- `zglos_uszkodzenie_formatki()` - Uszkodzenia
- `zakoncz_zlecenie()` - Finalizacja
- `stan_bufora_okleiniarka()` - Status buforów

## 🔄 Workflow Development

```bash
# 1. Uruchom aplikację
start.bat

# 2. Rozwój i testowanie
./run-scripts.sh test-zko

# 3. Commit zmian
git add .
git commit -m "opis zmian"
git push

# 4. Restart po zmianach
restart.bat clean
```

## 📞 Wsparcie

1. **Podstawowa diagnostyka:** `./run-scripts.sh diagnose`
2. **Sprawdź porty:** `start.bat debug`
3. **Wyczyść cache:** `restart.bat clean`
4. **Sprawdź logi:** W oknach terminala backend/frontend