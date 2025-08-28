#!/bin/bash
cd D:/PROJEKTY/PROGRAMOWANIE/AlpApp

# Konfiguracja użytkownika git
git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"

# Dodaj wszystkie zmiany
git add .

# Commit z komunikatem
git commit -m "Fix: Naprawione wyszukiwanie płyt i walidacja w AddPozycjaModal

- Ulepszone wyszukiwanie płyt - obsługa części frazy (wyszukiwanie po wielu słowach)
- Poprawiona walidacja formularza w czasie rzeczywistym
- Dodane szczegółowe komunikaty błędów z backendu
- Backend: dodana obsługa fallback gdy funkcja PostgreSQL nie istnieje
- UI: lepsze wizualne oznaczenie błędów i stanów magazynowych
- Wyszukiwarka pokazuje więcej informacji o płytach (ceny, wymiary)
- Automatyczne sortowanie wyników wyszukiwania po stanie magazynowym"

# Push do zdalnego repozytorium
git push origin main

echo "Zmiany zostały zatwierdzone i wysłane!"
