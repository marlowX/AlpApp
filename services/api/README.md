# AlpApp API Server

## 🚀 Quick Start

### 1. Uruchomienie API serwera

```bash
# Z głównego katalogu AlpApp
chmod +x start-api.sh
./start-api.sh
```

### 2. Konfiguracja bazy danych

Edytuj plik `services/api/.env`:

```env
DB_USER=alpsys_user
DB_HOST=localhost
DB_NAME=alpsys
DB_PASSWORD=your_password_here
DB_PORT=5432
PORT=5000
```

### 3. Test API

```bash
# Health check
curl http://localhost:5000/api/health

# Płyty
curl http://localhost:5000/api/plyty/active

# Rozkroje
curl http://localhost:5000/api/rozkroje
```

## 📡 Dostępne endpoints

### Płyty
- `GET /api/plyty/active` - Lista aktywnych płyt
  - Query params: `search`, `grubosc`, `limit`
  - Sortowanie: `stan_magazynowy DESC, struktura DESC, kolor_nazwa ASC`

### Rozkroje  
- `GET /api/rozkroje` - Lista rozkrojów
  - Query params: `search`, `limit`
- `GET /api/rozkroje/:id/formatki` - Formatki dla rozkroju

### ZKO
- `GET /api/zko` - Lista ZKO
- `GET /api/zko/:id` - Szczegóły ZKO z pozycjami i paletami
- `POST /api/zko/pozycje/add` - Dodanie pozycji do ZKO

## 🗃️ Struktura bazy danych

### Tabele wykorzystywane:
- `public.plyty` - płyty z stanami magazynowymi
- `zko.rozkroje` - definicje rozkrojów
- `zko.rozkroje_formatki` - formatki w rozkrojach
- `zko.zlecenia` - główna tabela ZKO
- `zko.pozycje` - pozycje w ZKO
- `zko.palety` - palety

### Funkcje PostgreSQL:
- `zko.dodaj_pozycje_do_zko()` - dodawanie pozycji
- `zko.pokaz_status_zko()` - status ZKO
- `zko.pal_planuj_inteligentnie_v3()` - planowanie palet

## 🛠️ Development

```bash
# Instalacja zależności
cd services/api
npm install

# Uruchomienie w trybie dev (auto-restart)
npm run dev

# Uruchomienie produkcyjne
npm start
```

## 🔧 Rozwiązywanie problemów

### "Brak danych" w formularzu
1. Sprawdź czy API serwer działa: `curl http://localhost:5000/api/health`
2. Sprawdź połączenie z bazą danych w logach serwera
3. Sprawdź konfigurację CORS - frontend musi być na porcie 3000 lub 5173

### Błędy bazy danych
1. Sprawdź dane połączenia w `.env`
2. Sprawdź czy użytkownik ma uprawnienia do schematów `public` i `zko`
3. Sprawdź czy tabele istnieją

### CORS errors
- API automatycznie pozwala na `http://localhost:3000` i `http://localhost:5173`
- Można dodać więcej w zmiennej `CORS_ORIGINS`

## 📦 Fallback data

Jeśli API nie może połączyć się z bazą, używa danych testowych:
- 6 przykładowych płyt z różnymi grubościami
- 4 przykładowe rozkroje z formatkami
- Pozwala na testowanie interfejsu bez bazy danych
