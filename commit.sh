#!/bin/bash
echo "Wykonuję commit zmian..."

cd AlpApp

# Konfiguracja Git
git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"

# Dodanie wszystkich zmian
git add .

# Commit z opisem zmian
git commit -m "fix(zko): Naprawienie błędów i dodanie brakujących funkcjonalności

- Naprawiono błąd usuwania pozycji (poprawna obsługa async/await)
- Dodano przycisk edycji pozycji z walidacją statusu
- Wyświetlanie daty rozpoczęcia ZKO w informacjach podstawowych
- Dodano datę rozpoczęcia do panelu Daty planowane
- Tooltips dla przycisków akcji z informacją o ograniczeniach
- Ikona ClockCircleOutlined dla daty rozpoczęcia
- Poprawiona obsługa błędów przy usuwaniu
- Mockowane wywołanie API dla usuwania (do implementacji z rzeczywistym API)"

echo "Commit wykonany pomyślnie!"