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
git commit -m "fix: Naprawienie błędu 400 w endpoint /api/zko/:id/pozycje

- Usunięto JOIN z nieistniejącą tabelą zko.plyty
- Endpoint details.routes.ts teraz używa tylko istniejących tabel
- Zachowano wszystkie komponenty UI (PozycjaSelector, PaletyTable)
- Dodano TableColumns.tsx jako helper dla PaletyTable"

echo "✅ Zmiany zatwierdzone!"

# Restart backendu
echo ""
echo "🔄 Restartuję backend..."
cd services/zko-service
npm run dev &

echo ""
echo "✅ Backend uruchomiony! Odśwież przeglądarkę."
