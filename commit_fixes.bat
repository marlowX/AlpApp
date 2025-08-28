@echo off
cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

REM Konfiguracja git
git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"

REM Dodaj wszystkie zmiany
git add .

REM Commit z opisem zmian
git commit -m "Poprawki obsługi błędów i dodanie skryptów pomocniczych

- Dodane szczegółowe logowanie błędów w zko.routes.ts
- Ulepszone zwracanie błędów z dodatkowymi szczegółami w trybie development
- Dodany skrypt start-app.bat do uruchomienia całej aplikacji
- Dodany skrypt restart-backend.bat do restartu serwera backend
- Poprawione logowanie w wszystkich endpointach API"

REM Push do repozytorium
git push

echo Zmiany zostaly zatwierdzone i wypchniete do repozytorium
pause