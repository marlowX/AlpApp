cd /d D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "Fix: Usunięty niepotrzebny poziomy scrollbar w tabeli płyt

- Usunięte scroll={{ x: 800 }} z Table - to powodowało pojawienie się suwaka
- Zmienione szerokości kolumn na procentowe zamiast pixeli
- Dodany style={{ overflow: 'hidden' }} jako zabezpieczenie
- Tabela teraz poprawnie dopasowuje się do dostępnej szerokości"

git push
