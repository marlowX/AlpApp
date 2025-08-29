@echo off
echo ====================================
echo   Test połączenia z bazą danych
echo ====================================
echo.

echo Test ping do serwera bazy danych...
ping -n 1 192.168.188.100

echo.
echo Test połączenia PostgreSQL...
cd /d "D:\PROJEKTY\PROGRAMOWANIE\AlpApp\services\zko-service"

echo.
echo Uruchamianie testu...
node -e "const { Pool } = require('pg'); const db = new Pool({ host: '192.168.188.100', port: 5432, database: 'alpsys_db', user: 'alpsys_user', password: 'OPXRnhDXNbp3UiAnrbrd' }); db.query('SELECT NOW()', (err, res) => { if (err) { console.error('BŁĄD:', err.message); process.exit(1); } else { console.log('SUKCES! Połączono z bazą:', res.rows[0].now); process.exit(0); } });"

echo.
pause