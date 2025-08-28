# PowerShell script to start API server - start-api.ps1

Write-Host "🚀 Uruchamianie API serwera dla AlpApp..." -ForegroundColor Green

# Sprawdź czy Node.js jest zainstalowany
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js nie jest zainstalowany" -ForegroundColor Red
    Write-Host "Zainstaluj Node.js z: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# Przejdź do katalogu API
$apiPath = Join-Path $PSScriptRoot "services\api"
if (-not (Test-Path $apiPath)) {
    Write-Host "❌ Nie znaleziono katalogu: $apiPath" -ForegroundColor Red
    exit 1
}
Set-Location $apiPath

# Sprawdź czy package.json istnieje
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Nie znaleziono package.json w: $(Get-Location)" -ForegroundColor Red
    exit 1
}

# Zainstaluj zależności jeśli node_modules nie istnieje
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalowanie zależności..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Błąd instalacji zależności" -ForegroundColor Red
        exit 1
    }
}

# Skopiuj .env.example do .env jeśli nie istnieje
if (-not (Test-Path ".env")) {
    Write-Host "⚙️  Tworzenie pliku konfiguracji .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 WAŻNE: Edytuj plik services/api/.env z danymi swojej bazy PostgreSQL!" -ForegroundColor Cyan
    Write-Host "   Przykład: DB_PASSWORD=twoje_haslo_postgresql" -ForegroundColor Gray
}

# Sprawdź konfigurację .env
Write-Host "`n⚙️  Sprawdzanie konfiguracji..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
if ($envContent -like "*your_password_here*") {
    Write-Host "⚠️  UWAGA: Zaktualizuj hasło PostgreSQL w pliku .env" -ForegroundColor Yellow
    Write-Host "   Edytuj: services/api/.env" -ForegroundColor Gray
}

# Uruchom serwer
Write-Host "`n🌟 Startowanie API serwera..." -ForegroundColor Green
Write-Host "📡 Health check: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "🔗 Płyty: http://localhost:5000/api/plyty/active" -ForegroundColor Cyan
Write-Host "🔗 Rozkroje: http://localhost:5000/api/rozkroje" -ForegroundColor Cyan
Write-Host "🔗 ZKO: http://localhost:5000/api/zko" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aby zatrzymać serwer, naciśnij Ctrl+C" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Gray

# Sprawdź czy port 5000 jest wolny
$portTest = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portTest) {
    Write-Host "⚠️  Port 5000 jest już używany! Sprawdź czy inny serwer nie działa." -ForegroundColor Yellow
}

npm run dev
