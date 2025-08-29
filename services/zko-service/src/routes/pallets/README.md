# 📁 Moduł Pallets - Struktura

## ⚠️ ZASADA: Maksymalnie 300 linii na plik!

### Struktura plików:
```
pallets/
├── README.md           # Ten plik
├── index.ts           # Agregator routerów
├── schemas.ts         # Schematy walidacji
├── plan.routes.ts     # Planowanie palet
├── manage.routes.ts   # Zarządzanie paletami (close, reorganize)
├── zko.routes.ts      # Operacje dla ZKO (lista, summary, quantity)
└── utils/
    └── helpers.ts     # Funkcje pomocnicze
```

### Endpointy:
- **POST /api/pallets/plan** - Planowanie palet dla pozycji
- **POST /api/pallets/zko/:id/plan** - Planowanie dla całego ZKO
- **GET /api/pallets/calculate** - Obliczanie parametrów
- **POST /api/pallets/:id/close** - Zamknięcie palety
- **PUT /api/pallets/reorganize** - Reorganizacja
- **GET /api/pallets/zko/:id** - Lista palet dla ZKO
- **GET /api/pallets/zko/:id/summary** - Podsumowanie
- **POST /api/pallets/zko/:id/change-quantity** - Zmiana ilości
- **DELETE /api/pallets/empty/:pozycjaId** - Usuwanie pustych