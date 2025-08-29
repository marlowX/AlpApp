#!/bin/bash
cd /d/PROJEKTY/PROGRAMOWANIE/AlpApp

# Konfiguracja git
git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"

# Dodaj wszystkie zmiany
git add .

# Commit
git commit -m "Dodanie parametrów wagi i oklejania do planowania palet

- Dodano pole max_waga_kg jako wymagany parametr (100-1000 kg)
- Zmieniono zakres wysokości palety: 400-1500mm (zamiast 800-2000mm)
- Dodano strategię układania według oklejania
- Dodano switch 'Uwzględnij oklejanie' TAK/NIE
- Zaktualizowano typy TypeScript o nowe pola
- Dodano walidację wagi przy planowaniu
- Rozszerzono interfejs Formatka o wymaga_oklejania i krawedzie_oklejane
- Zaktualizowano limity systemowe w types.ts
- Dodano stałe DOMYSLNA_WYSOKOSC_MM i DOMYSLNA_WAGA_KG
- Poprawiono layout formularza z użyciem Divider dla lepszej czytelności"

echo "Commit wykonany pomyślnie!"