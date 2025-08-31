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
git commit -m "fix: Naprawienie przycisku edycji palety

- Dodano endpoint GET /api/pallets/:id dla pobierania szczegółów palety
- Poprawiono handleEditPaleta w PaletyManager - lepsza logika znajdowania pozycja_id
- Dodano console.log dla debugowania
- Poprawiono obsługę pozycja_id z różnych źródeł (pozycje_lista, formatki_szczegoly)
- Naprawiono błąd isNan -> isNaN w manage.routes.ts"

echo "✅ Zmiany zatwierdzone!"
