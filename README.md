# 🚀 AlpApp - System ERP

System ERP do zarządzania produkcją, zleceniami kooperacyjnymi (ZKO) i procesami logistycznymi.

## 📋 Spis treści

- [Struktura projektu](#struktura-projektu)
- [Technologie](#technologie)
- [Instalacja](#instalacja)
- [Uruchomienie](#uruchomienie)
- [Rozwój](#rozwój)
- [API](#api)
- [Baza danych](#baza-danych)

## 📁 Struktura projektu

```
AlpApp/
├── apps/                 # Aplikacje frontendowe
│   ├── zko/             # Aplikacja ZKO
│   ├── zlp/             # Aplikacja ZLP (planowane)
│   └── warehouse/       # Aplikacja Magazyn (planowane)
├── packages/            # Pakiety współdzielone
│   ├── theme/          # @alp/theme - zarządzanie motywami
│   └── ui/             # @alp/ui - komponenty UI
├── services/           # Mikroserwisy backend
│   └── zko-service/    # Serwis ZKO
├── infrastructure/     # Konfiguracja infrastruktury
└── docker-compose.yml  # Orchestracja kontenerów
```

## 🛠️ Technologie

### Frontend
- **React 18** + TypeScript
- **Ant Design 5** - komponenty UI
- **TanStack Query** - zarządzanie stanem serwera
- **Zustand** - zarządzanie stanem aplikacji
- **Vite** - bundler

### Backend
- **Node.js** + Express
- **PostgreSQL** - baza danych
- **Socket.io** - real-time updates
- **Zod** - walidacja

### DevOps
- **Docker** + Docker Compose
- **PNPM** - package manager (monorepo)
- **Nginx** - reverse proxy

## 📦 Instalacja

### Wymagania
- Node.js 20+
- PNPM 8+
- Docker i Docker Compose
- PostgreSQL 15+ (lub użyj Dockera)

### Kroki instalacji

1. **Klonowanie repozytorium**
```bash
cd D:/PROJEKTY/PROGRAMOWANIE/AlpApp
```

2. **Instalacja zależności**
```bash
# Instalacja PNPM globalnie
npm install -g pnpm

# Instalacja wszystkich zależności
pnpm install
```

3. **Konfiguracja środowiska**
```bash
# Skopiuj pliki .env
cp services/zko-service/.env.example services/zko-service/.env

# Edytuj plik .env i ustaw swoje dane
```

4. **Przygotowanie bazy danych**
```bash
# Uruchom PostgreSQL przez Docker
docker-compose up -d postgres

# Poczekaj aż baza się uruchomi, potem zaimportuj schemat
# (schemat powinien być w infrastructure/postgres/init/)
```

## 🚀 Uruchomienie

### Rozwój lokalny

**Terminal 1 - Backend:**
```bash
cd services/zko-service
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/zko
pnpm dev
```

Aplikacja będzie dostępna pod:
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000
- Adminer (DB): http://localhost:8080

### Docker (wszystko razem)
```bash
# Uruchom wszystkie serwisy
docker-compose up

# Lub w tle
docker-compose up -d
```

### Uruchomienie poszczególnych części
```bash
# Tylko baza danych
docker-compose up postgres adminer

# Tylko backend
pnpm --filter @alp/zko-service dev

# Tylko frontend
pnpm --filter @alp/zko dev
```

## 💻 Rozwój

### Struktura komend
```bash
# Uruchom wszystkie aplikacje w trybie dev
pnpm dev

# Uruchom konkretną aplikację
pnpm --filter @alp/zko dev

# Budowanie
pnpm build

# Testy
pnpm test

# Linting
pnpm lint
```

### Dodawanie nowej aplikacji
```bash
# W folderze apps/
pnpm create vite@latest nazwa-aplikacji --template react-ts
```

### Dodawanie nowego pakietu
```bash
# W folderze packages/
mkdir nowy-pakiet
cd nowy-pakiet
pnpm init
```

## 📡 API

### Główne endpointy ZKO

#### ZKO Management
- `GET /api/zko` - Lista zleceń
- `GET /api/zko/:id` - Szczegóły zlecenia
- `POST /api/zko/create` - Tworzenie ZKO
- `POST /api/zko/status/change` - Zmiana statusu
- `DELETE /api/zko/:id` - Usunięcie ZKO

#### Workflow
- `GET /api/workflow/instructions` - Instrukcje workflow
- `GET /api/workflow/etapy` - Słownik etapów
- `GET /api/zko/:id/next-steps` - Następne kroki

#### Palety
- `POST /api/pallets/plan` - Planowanie palet
- `GET /api/pallets/calculate` - Kalkulacja parametrów
- `POST /api/pallets/:id/close` - Zamknięcie palety

#### Produkcja
- `POST /api/production/start` - Start produkcji
- `POST /api/production/report` - Raportowanie
- `POST /api/production/damage` - Zgłoszenie uszkodzenia

## 🗄️ Baza danych

### Główne schematy
- `zko` - Zlecenia kooperacyjne
- `zlp` - Zlecenia produkcyjne
- `tracking` - Śledzenie i etapy
- `magazyn` - Stany magazynowe

### Kluczowe funkcje PostgreSQL
```sql
-- Tworzenie ZKO
SELECT * FROM zko.utworz_puste_zko('kooperant', 5, 'user', 'komentarz');

-- Zmiana statusu
SELECT * FROM zko.zmien_status_v3(zko_id, 'CIECIE_START', 'user', null, 'operator', 'lokalizacja');

-- Planowanie palet
SELECT * FROM zko.pal_planuj_inteligentnie_v3(pozycja_id, null, 180, 700, 18);
```

## 📝 Workflow ZKO

1. **Utworzenie ZKO** → `nowe`
2. **Dodanie pozycji** → rozkroje i formatki
3. **Planowanie palet** → automatyczny podział
4. **Start produkcji** → `CIECIE_START`
5. **Pakowanie** → `PAKOWANIE_PALETY`
6. **Transport** → przez bufory
7. **Oklejanie/Wiercenie** → opcjonalnie
8. **Kompletowanie** → finalizacja
9. **Wysyłka** → `ZAKONCZONE`

## 🔒 Bezpieczeństwo

- JWT dla autoryzacji
- Walidacja danych przez Zod
- Prepared statements w SQL
- CORS skonfigurowany
- Helmet.js dla security headers

## 📚 Dokumentacja

- [Ant Design](https://ant.design/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [Socket.io](https://socket.io/)

## 👥 Zespół

Developed by AlpSys Team

## 📄 Licencja

Proprietary - All rights reserved
