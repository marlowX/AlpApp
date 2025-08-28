cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "Refactor: Podział AddPozycjaModal na mniejsze komponenty (max 300 linii)

- AddPozycjaModal: 494 linii -> 264 linii
- Wydzielone komponenty:
  * PozycjaStatistics - statystyki górne
  * ValidationAlerts - alertów walidacji
  * SystemInfoAlert - informacje systemowe
  * PozycjaAdditionalOptions - opcje dodatkowe
  * RozkrojPreview - podgląd rozkroju
- Nowe hooki:
  * usePozycjaValidation - logika walidacji
- Nowy serwis:
  * PozycjaService - obsługa API
- Dodany index.ts dla łatwego importu
- Lepsza organizacja kodu i łatwiejsze utrzymanie"

git push
