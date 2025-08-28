@echo off
chcp 65001 > nul
cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

echo Konfiguracja Git UTF-8...
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global gui.encoding utf-8

echo.
echo Dodawanie zmian...
git add .

echo.
echo Zapisywanie zmian...
git commit -m "Fix: Naprawione scrollbary w tabelach i kodowanie znakow

- Usuniete niepotrzebne scroll w FormatkiPreview
- Zmienione szerokosci kolumn na procentowe
- Poprawiony RozkrojPreview dla spojnosci
- Ustawione UTF-8 dla Git i Windows
- Bez zbednych poziomych suwaków w tabelach"

echo.
echo Wysylanie na serwer...
git push

echo.
echo Gotowe! Zmiany zostaly wyslane.
pause
