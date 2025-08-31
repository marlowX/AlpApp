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
git commit -m "fix: Wyświetlanie ID pozycji z bazy danych w kaflach

- PozycjaCard teraz pokazuje ID z bazy (np. 72) zamiast numeru kolejnego
- Dodano Badge z ID pozycji (duży, widoczny)
- Dodano informację o kolejności jako małą notatkę
- PozycjaSelector przekazuje prawidłowe ID z bazy
- Dodano ikonę DatabaseOutlined dla lepszej czytelności
- Poprawione kolory dla WOTAN w getKolorBadge"

echo "✅ Zmiany zatwierdzone!"
echo ""
echo "📋 Co teraz działa:"
echo "- Kafle pokazują ID pozycji z bazy (62, 63, 68, 69, 70, 72)"
echo "- Numer kolejny (1-6) wyświetlany jako dodatkowa informacja"
echo "- Badge z ID jest duży i widoczny"
echo "- Tooltip pokazuje 'ID w bazie danych'"
