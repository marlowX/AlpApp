# AlpApp - Instrukcje Uruchomienia

## 🚀 Szybki Start

### Opcja 1: Automatyczne uruchomienie (Rekomendowane)

**Windows:**
```bash
# Uruchom skrypt automatycznego startu
./start-full-app.bat
```

**Linux/Mac:**
```bash
# Ustaw uprawnienia
chmod +x start-full-app.sh

# Uruchom aplikację
./start-full-app.sh
```

### Opcja 2: Ręczne uruchomienie

**1. Zainstaluj zależności:**
```bash
pnpm install
```

**2. Uruchom backend (ZKO-SERVICE):**
```bash
# Terminal 1 - Backend na porcie 5000
pnpm --filter @alp/zko-service dev
```

**3. Uruchom frontend:**
```bash
# Terminal 2 - Frontend na porcie 3001  
pnpm run dev:zko
```

## 🌐 Dostępne Endpointy

- **Frontend ZKO:** http://localhost:3001
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 🔧 Architektura

### Frontend (Port 3001)
- React + TypeScript + Vite
- Ant Design UI
- React Query + Zustand
- Proxy na backend (/api -> localhost:5000)

### Backend (Port 5000)
- Express.js + TypeScript
- PostgreSQL database
- WebSocket support
- RESTful API

## 📁 Kluczowe Katalogi

```
AlpApp/
├── apps/zko/                    # Frontend aplikacji ZKO
│   ├── src/
│   │   ├── modules/zko/         # Moduły ZKO
│   │   │   ├── components/      # Komponenty React
│   │   │   │   └── AddPozycja/  # 🆕 Nowy formularz dodawania pozycji
│   │   │   ├── hooks/           # React hooks
│   │   │   └── pages/           # Strony aplikacji
│   │   └── layout/              # Layout aplikacji
├── services/zko-service/        # Backend API
│   └── src/                     # Kod źródłowy backend
└── packages/                    # Wspólne biblioteki
```

## 🆕 Nowe Funkcjonalności

### PlytySelectorV2 - Nowoczesny wybór płyt
- ✅ Karty zamiast długich Selectów
- ✅ Inteligentne filtrowanie po opisie
- ✅ Kolorowe statusy magazynowe
- ✅ Podgląd wybranej płyty
- ✅ Responsywny design

### Ulepszona Tabela Kolorów
- ✅ Walidacja w czasie rzeczywistym
- ✅ Automatyczne limity (5 szt. dla 18mm+)
- ✅ Statystyki na górze formularza
- ✅ Lepsze UX z błędami

## 🐛 Rozwiązywanie Problemów

### Problem: "Cannot GET /"
**Przyczyna:** Frontend nie działa
**Rozwiązanie:**
```bash
cd apps/zko
npm run dev
```

### Problem: "Proxy error" lub błędy API
**Przyczyna:** Backend nie działa  
**Rozwiązanie:**
```bash
cd services/zko-service
npm run dev
```

### Problem: "PNPM not found"
**Rozwiązanie:**
```bash
npm install -g pnpm
```

### Problem: Stary cache przeglądarki
**Rozwiązanie:**
- Ctrl+Shift+R (force refresh)
- Wyczyść cache przeglądarki
- DevTools -> Network -> Disable cache

## 📊 Baza Danych

Aplikacja używa PostgreSQL z następującymi schematami:

### Schema: `zko`
- `zlecenia` - Zlecenia kooperantów  
- `pozycje` - Pozycje w ramach ZKO
- `rozkroje` - Definicje rozkrojów płyt
- `rozkroje_formatki` - Formatki w rozkrojach
- `palety` - Zarządzanie paletami
- `bufor_okleiniarka` - Bufory oklejarni

### Schema: `public`  
- `plyty` - Katalog płyt
- `kolory` - Kolory płyt
- `produkty` - Produkty systemowe

## 🔄 Workflow Development

1. **Commitowanie zmian:**
```bash
git add .
git commit -m "opis zmian"  
git push
```

2. **Konfiguracja Git:**
```bash
git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"
```

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

## 📞 Wsparcie

Jeśli masz problemy:
1. Sprawdź konsolę przeglądarki (F12)
2. Sprawdź logi backendu  
3. Zrestartuj aplikację
4. Wyczyść cache przeglądarki
