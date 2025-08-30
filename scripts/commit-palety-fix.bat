@echo off
echo Committing pallet quantity fixes...

cd D:\PROJEKTY\PROGRAMOWANIE\AlpApp

git add .
git commit -m "fix: Naprawiono obsługę ilości formatek w systemie palet

- Dodano tabelę palety_formatki_ilosc do przechowywania rzeczywistych ilości
- Utworzono endpoint /api/pallets/zko/:zkoId/details z pełnymi danymi
- Zaktualizowano PaletyManager i PaletyTable o obsługę ilości
- Poprawiono funkcje pal_usun_inteligentnie i pal_planuj_inteligentnie_v5
- Naprawiono błąd foreign key constraint przy usuwaniu palet
- System teraz prawidłowo obsługuje 175 sztuk formatek dla ZKO 27"

echo Commit completed!
pause