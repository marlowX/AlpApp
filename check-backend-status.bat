@echo off
echo 🔍 Sprawdzanie statusu ZKO-SERVICE...
echo.

REM Sprawdź czy port 5000 jest używany
echo 📡 Sprawdzanie portu 5000:
netstat -ano | findstr :5000

echo.
REM Sprawdź czy port 3001 jest używany
echo 📡 Sprawdzanie portu 3001:
netstat -ano | findstr :3001

echo.
echo 🌐 Próba połączenia z backendem:
echo Testing: http://localhost:5000/health
curl -f http://localhost:5000/health 2>nul
if errorlevel 1 (
    echo ❌ Backend na porcie 5000 nie odpowiada
) else (
    echo ✅ Backend na porcie 5000 działa!
)

echo.
echo Testing: http://localhost:5000/api/zko
curl -f http://localhost:5000/api/zko 2>nul
if errorlevel 1 (
    echo ❌ API ZKO na porcie 5000 nie odpowiada
) else (
    echo ✅ API ZKO na porcie 5000 działa!
)

echo.
echo 🔍 Processes używające portów 5000-3001:
wmic process where "Name='node.exe'" get ProcessId,CommandLine /format:table

pause
