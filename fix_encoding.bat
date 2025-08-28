#!/bin/bash
cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

# Ustaw kodowanie UTF-8 dla Git
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8

# Ustaw kodowanie konsoli Windows
chcp 65001

git add .
git commit -m "Fix: Poprawione kodowanie polskich znaków w Git

- Ustawione UTF-8 dla commitów
- core.quotepath false dla poprawnego wyświetlania nazw plików
- Kodowanie konsoli Windows na UTF-8 (65001)"

git push
