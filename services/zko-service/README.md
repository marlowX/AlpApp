# ZKO Service

Mikroserwis do zarządzania zleceniami kooperacyjnymi (ZKO) w systemie AlpApp.

## 📋 Funkcjonalności

- Tworzenie i zarządzanie zleceniami ZKO
- Workflow produkcyjny
- Planowanie palet
- Zarządzanie kooperantami
- Raportowanie produkcji
- Śledzenie uszkodzeń

## 🗄️ Struktura bazy danych

### Schema: `zko`

#### Główne tabele:
- **zlecenia** - główna tabela zleceń ZKO
- **pozycje** - pozycje (rozkroje) w zleceniach
- **pozycje_formatki** - formatki przypisane do pozycji
- **palety** - zarządzanie paletami
- **palety_formatki_ilosc** - ilości formatek na paletach
- **formatki_wyprodukowane** - raportowanie produkcji
- **historia_statusow** - historia zmian statusów

#### Tabele kooperantów (NOWE):
- **kooperanci** - słownik kooperantów z ocenami i możliwościami produkcyjnymi
- **kooperanci_historia** - historia współpracy i zleceń
- **kooperanci_cennik** - cenniki usług kooperantów

### Główne funkcje PostgreSQL:

```sql
-- Tworzenie i zarządzanie ZKO
zko.utworz_puste_zko(kooperant, priorytet, uzytkownik, komentarz)
zko.dodaj_pozycje_do_zko(zko_id, rozkroj_id, ilosc_plyt, ...)
zko.usun_pozycje_zko(pozycja_id, uzytkownik, powod)
zko.edytuj_pozycje_zko(pozycja_id, ...)

-- Workflow
zko.zmien_status_v3(zko_id, nowy_etap, komentarz, operator, lokalizacja)
zko.pobierz_nastepne_etapy(zko_id)
zko.pokaz_status_zko(zko_id)

-- Palety
zko.pal_planuj_inteligentnie_v3(pozycja_id, max_wysokosc, max_waga, ...)
zko.zamknij_palete(paleta_id, operator, uwagi)

-- Produkcja
zko.raportuj_produkcje_formatek(pozycja_id, formatka_id, ilosc_ok, ...)
zko.zglos_uszkodzenie_formatki(zko_id, formatka_id, ilosc, ...)

-- Kooperanci (NOWE)
zko.pobierz_kooperantow_lista() -- lista aktywnych kooperantów dla select
```

## 🛣️ API Endpoints

### ZKO
- `GET /api/zko` - lista zleceń
- `GET /api/zko/:id` - szczegóły zlecenia
- `POST /api/zko/create` - tworzenie nowego ZKO
- `DELETE /api/zko/delete/:id` - usuwanie ZKO
- `PUT /api/zko/:id/status` - zmiana statusu

### Kooperanci (NOWE)
- `GET /api/zko/kooperanci` - lista kooperantów
- `GET /api/zko/kooperanci/:id` - szczegóły kooperanta
- `GET /api/zko/kooperanci/:id/historia` - historia współpracy
- `GET /api/zko/kooperanci/:id/cennik` - cennik kooperanta

### Pozycje
- `GET /api/zko/pozycje/:id` - szczegóły pozycji
- `PUT /api/zko/pozycje/:id` - edycja pozycji
- `DELETE /api/zko/pozycje/:id` - usuwanie pozycji

### Palety
- `GET /api/pallets` - lista palet
- `POST /api/pallets/plan` - planowanie palet
- `POST /api/pallets/:id/close` - zamykanie palety

### Produkcja
- `POST /api/production/report` - raportowanie produkcji
- `POST /api/production/damage` - zgłaszanie uszkodzeń

## 🚀 Uruchomienie

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## ⚙️ Konfiguracja

Zmienne środowiskowe w pliku `.env`:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alpsys
DB_USER=alpsys_user
DB_PASSWORD=your_password
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=info
NODE_ENV=development
```

## 📦 Struktura katalogów

```
src/
├── routes/
│   ├── zko/              # Moduł ZKO (max 300 linii/plik)
│   │   ├── index.ts      # Główny router
│   │   ├── create.routes.ts
│   │   ├── list.routes.ts
│   │   ├── kooperanci.routes.ts  # NOWE
│   │   └── ...
│   ├── pallets/          # Moduł palet
│   └── ...
├── index.ts              # Główny plik serwera
└── ...
```

## 🔧 Zasady rozwoju

1. **Maksymalnie 300 linii kodu na plik**
2. **Logika biznesowa w PostgreSQL** (funkcje składowane)
3. **Routing i walidacja w Node.js**
4. **Modularyzacja** - każdy moduł w osobnym katalogu

## 📝 Changelog

### 2025-09-01
- Dodano tabele kooperantów (kooperanci, kooperanci_historia, kooperanci_cennik)
- Dodano endpoint `/api/zko/kooperanci` do pobierania listy kooperantów
- Zintegrowano kooperantów z formularzem tworzenia ZKO
- Dodano oceny i historię współpracy z kooperantami