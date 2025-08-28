# Commit message dla nowego API

## 🚀 Dodano nowy API serwer dla formularza ZKO

### ✨ Nowe funkcjonalności:
- **Nowy API serwer** w `services/api/` (JavaScript, prostszy niż istniejący TypeScript)
- **Endpoint płyt** z sortowaniem po popularności i filtrowaniem
- **Endpoint rozkrojów** z formatkami
- **ZKO endpoints** do zarządzania zleceniami
- **Fallback data** gdy baza danych nie działa

### 🔧 Poprawki komponentów:
- **Podzielono AddPozycjaModal** na mniejsze komponenty (<300 linii każdy)
- **Nowe hooki** `usePlyty()` i `useRozkroje()` z obsługą błędów
- **Lepsze selektory** płyt z filtrowaniem w czasie rzeczywistym
- **Walidacja stanu magazynowego** i limitów płyt

### 📁 Nowa struktura:
```
services/api/           # Nowy API serwer (JavaScript)
├── server.js          # Express serwer  
├── routes/            # Endpointy
├── package.json       # Zależności
└── README.md          # Dokumentacja

apps/zko/src/modules/zko/components/AddPozycja/  # Komponenty modularnie
├── AddPozycjaModal.tsx     # Główny modal (250 linii)
├── PlytySelector.tsx       # Selector płyt (87 linii)
├── KolorePlytyTable.tsx    # Tabela kolorów (140 linii)
├── FormatkiPreview.tsx     # Podgląd formatek (57 linii)
└── types.ts               # Typy TypeScript
```

### 🎯 Rozwiązane problemy:
- ❌ "Brak danych" w formularzu dodawania pozycji
- ❌ Nie działające wyszukiwanie rozkrojów  
- ❌ Pusta lista płyt
- ✅ Teraz: Dane z PostgreSQL lub fallback
- ✅ Filtrowanie płyt w czasie rzeczywistym
- ✅ Sortowanie po popularności (stan_magazynowy DESC)

### 🚀 Uruchomienie:
```bash
# Windows
start-api.bat

# PowerShell  
.\start-api.ps1

# Linux/Mac
./start-api.sh
```

### 🔗 Endpoints:
- `GET /api/health` - Status serwera
- `GET /api/plyty/active` - Płyty z filtrowaniem
- `GET /api/rozkroje` - Rozkroje z formatkami  
- `GET /api/zko` - Lista ZKO
- `POST /api/zko/pozycje/add` - Dodawanie pozycji

Co-authored-by: Claude <assistant@anthropic.com>
