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
git commit -m "fix: Naprawienie PaletyTable (300 linii) i PozycjaSelector

- Rozbicie PaletyTable.tsx na dwa pliki (było 530 linii)
- Utworzenie TableColumns.tsx z helperami renderowania
- PaletyTable.tsx teraz ma tylko 260 linii (zgodnie z zasadą 300 linii)
- Poprawienie PozycjaSelector - prawidłowy endpoint /api/zko/:id/pozycje
- Dodanie lepszego UI dla wyboru pozycji (kafle)
- Poprawienie ExistingPalettes - full width tabeli
- Eksport nowych komponentów w index.ts"

echo "✅ Zmiany zatwierdzone!"
