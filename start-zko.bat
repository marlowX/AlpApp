@echo off
echo "=== Uruchamianie AlpApp - ZKO System ==="

echo "Sprawdzanie instalacji..."
if not exist "node_modules" (
    echo "Instalowanie zaleznosci..."
    call pnpm install
)

echo "=== Uruchamianie Backend (port 5001) ==="
start cmd /k "cd services\zko-service && npm run dev"

echo "Czekam 3 sekundy na uruchomienie backendu..."
timeout /t 3 /nobreak >nul

echo "=== Uruchamianie Frontend (port 5173) ==="
start cmd /k "cd apps\zko && npm run dev"

echo "=== System uruchomiony! ==="
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Aby zatrzymac, zamknij okna terminali."
pause
