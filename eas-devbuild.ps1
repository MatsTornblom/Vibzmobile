# EAS/Expo Development Build Automation Script
# Skapad för Vibzmobile projektet

param(
    [switch]$SkipGit,
    [switch]$Force,
    [string]$CommitMessage = "New project sources",
    [string]$Platform = "android"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "EAS Build Automation - Vibzmobile" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Funktion för att kontrollera om kommando lyckades
function Test-LastCommand {
    param([string]$ErrorMessage)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FEL: $ErrorMessage" -ForegroundColor Red
        $response = Read-Host "Vill du fortsätta ändå? (j/n)"
        if ($response -ne "j") {
            exit 1
        }
    }
}

# Git-hantering (om inte --SkipGit är satt)
if (-not $SkipGit) {
    Write-Host "[1/8] Initierar Git..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".git")) {
        git init
        Test-LastCommand "Kunde inte initiera git"
    } else {
        Write-Host "Git redan initierat, hoppar över..." -ForegroundColor Gray
    }
    
    Write-Host "[2/8] Lägger till remote origin..." -ForegroundColor Yellow
    $remoteExists = git remote | Select-String -Pattern "origin"
    if (-not $remoteExists) {
        git remote add origin https://github.com/MatsTornblom/Vibzmobile
        Test-LastCommand "Kunde inte lägga till remote"
    } else {
        Write-Host "Remote origin finns redan, hoppar över..." -ForegroundColor Gray
    }
    
    Write-Host "[3/8] Lägger till filer och committar..." -ForegroundColor Yellow
    git add .
    Test-LastCommand "Kunde inte lägga till filer"
    
    git commit -m "$CommitMessage"
    # Commit kan misslyckas om inga ändringar finns, det är OK
    
    Write-Host "[4/8] Pushar till GitHub..." -ForegroundColor Yellow
    if ($Force) {
        Write-Host "Använder --force för att pusha..." -ForegroundColor Magenta
        git push -u origin master --force
    } else {
        git push -u origin master
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Push misslyckades. Vill du försöka med --force? (j/n)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -eq "j") {
                git push -u origin master --force
                Test-LastCommand "Force push misslyckades"
            }
        }
    }
} else {
    Write-Host "[1-4/8] Hoppar över Git-steg..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[5/8] Installerar npm-paket..." -ForegroundColor Yellow
npm install
Test-LastCommand "npm install misslyckades"

Write-Host ""
Write-Host "[6/8] Kontrollerar EAS-inloggning..." -ForegroundColor Yellow
eas whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Du är inte inloggad i EAS. Loggar in..." -ForegroundColor Magenta
    eas login
    Test-LastCommand "EAS login misslyckades"
}

Write-Host ""
Write-Host "[7/8] Kör expo-doctor för att kontrollera projektet..." -ForegroundColor Yellow
npx expo-doctor
if ($LASTEXITCODE -ne 0) {
    Write-Host "Expo-doctor hittade problem. Försöker fixa..." -ForegroundColor Magenta
    npx expo install --fix
    Test-LastCommand "Kunde inte fixa problemen"
}

Write-Host ""
Write-Host "[8/8] Konfigurerar EAS build (om inte redan gjort)..." -ForegroundColor Yellow
if (-not (Test-Path "eas.json")) {
    eas build:configure
    Test-LastCommand "EAS build:configure misslyckades"
} else {
    Write-Host "eas.json finns redan, hoppar över konfiguration..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Startar EAS build för $Platform..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OBS: Du kan få följande frågor under build-processen:" -ForegroundColor Yellow
Write-Host "  - 'Generate a new Android Keystore?' -> Svara 'n' (bör redan finnas en i EAS)" -ForegroundColor Gray
Write-Host "  - 'Run in simulator?' -> Svara 'n'" -ForegroundColor Gray
Write-Host ""

eas build --platform $Platform --profile development

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Build klar! Startar development server..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Instruktioner:" -ForegroundColor Yellow
Write-Host "1. Scanna den ÖVRE QR-koden med din mobil" -ForegroundColor White
Write-Host "2. Appen ska starta automatiskt" -ForegroundColor White
Write-Host "3. Om den inte startar: välj 'Scan' och scanna den NEDRE QR-koden" -ForegroundColor White
Write-Host ""
Write-Host "Tryck Ctrl+C för att stoppa servern" -ForegroundColor Gray
Write-Host ""

npx expo start --tunnel