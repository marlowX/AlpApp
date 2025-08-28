cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git config --global user.name "marlowX"
git config --global user.email "biuro@alpmeb.pl"

git add .
git commit -m "Fix: Naprawione wyszukiwanie płyt i walidacja w AddPozycjaModal - Ulepszone wyszukiwanie płyt obsługa części frazy, Poprawiona walidacja formularza w czasie rzeczywistym, Dodane szczegółowe komunikaty błędów z backendu, Backend: dodana obsługa fallback gdy funkcja PostgreSQL nie istnieje, UI: lepsze wizualne oznaczenie błędów i stanów magazynowych"
git push
