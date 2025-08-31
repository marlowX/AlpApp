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
git commit -m "fix: Naprawienie błędu edycji palet - Cannot read properties of undefined

- Dodano zabezpieczenia w usePaletaLogic.ts przed undefined formatki
- Domyślna pusta tablica dla formatki w hooku
- Poprawiono ManualPalletCreator - obsługa obu props (pozycjaFormatki i formatki)
- Dodano tryb edycji z initialPaleta
- Zabezpieczenia przed brakiem danych w obliczeniach
- Naprawiono błąd 'forEach' na undefined"

echo "✅ Zmiany zatwierdzone!"

# Push
echo "📤 Wysyłanie na serwer..."
git push

echo "✅ Wszystko gotowe!"
