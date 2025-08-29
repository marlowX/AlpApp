#!/bin/bash
cd /d/PROJEKTY/PROGRAMOWANIE/AlpApp

# Konfiguracja git
git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"

# Dodaj wszystkie zmiany
git add .

# Commit
git commit -m "Refaktoryzacja PaletyManager - podział na komponenty <300 linii

- Utworzono kompleksową dokumentację README dla modułu PaletyManager
- Rozbito główny komponent PaletyManager.tsx (295 linii -> 250 linii)
- Wydzielono podkomponenty:
  * PaletyStats.tsx - statystyki palet (75 linii)
  * PaletyTable.tsx - tabela palet (120 linii)  
  * PlanowanieModal.tsx - modal planowania (135 linii)
- Utworzono types.ts z definicjami TypeScript
- Dodano custom hook usePaletyData do zarządzania danymi
- Stworzono utils/paletaHelpers.ts z funkcjami pomocniczymi
- Zaktualizowano index.ts z eksportami modułu
- Dokumentacja zawiera:
  * Listę wszystkich funkcji PostgreSQL dla palet (30+ funkcji)
  * Algorytmy planowania (pal_planuj_inteligentnie_v4)
  * Limity i ograniczenia fizyczne palet
  * Workflow pracy z paletami
  * Przykłady integracji z PostgreSQL
  * KPI i metryki do monitorowania
- Przestrzeganie zasady max 300 linii na plik"

echo "Commit wykonany pomyślnie!"