# EAS/Expo Production Build Automation Script
# Skapad för Vibzmobile projektet - PRODUCTION DEPLOYMENT

param(
    [switch]$SkipGit,
    [switch]$Force,
    [string]$CommitMessage = "Production build",
    [string]$Platform = "android"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "EAS PRODUCTION Build - Vibzmobile" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VARNING: Detta bygger en PRODUKTIONSVERSION!" -ForegroundColor Red
Write-Host ""

# Bekraftelse for production build
$confirm = Read-Host "Ar du saker pa att du vill bygga en produktionsversion? (j/n)"
if ($confirm -ne "j") {
    Write-Host "Avbryter..." -ForegroundColor Yellow
    exit 0
}

# Funktion for att kontrollera om kommando lyckades
function Test-LastCommand {
    param([string]$ErrorMessage)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FEL: $ErrorMessage" -ForegroundColor Red
        $response = Read-Host "Vill du fortsatta anda? (j/n)"
        if ($response -ne "j") {
            exit 1
        }
    }
}

# Git-hantering (om inte --SkipGit är satt)
if (-not $SkipGit) {
    Write-Host "[1/11] Initierar Git..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".git")) {
        git init
        Test-LastCommand "Kunde inte initiera git"
    } else {
        Write-Host "Git redan initierat, hoppar over..." -ForegroundColor Gray
    }
    
    Write-Host "[2/11] Lagger till remote origin..." -ForegroundColor Yellow
    $remoteExists = git remote | Select-String -Pattern "origin"
    if (-not $remoteExists) {
        git remote add origin https://github.com/MatsTornblom/Vibzmobile
        Test-LastCommand "Kunde inte lagga till remote"
    } else {
        Write-Host "Remote origin finns redan, hoppar over..." -ForegroundColor Gray
    }
    
    Write-Host "[3/11] Lagger till filer och committar..." -ForegroundColor Yellow
    git add .
    Test-LastCommand "Kunde inte lagga till filer"
    
    git commit -m "$CommitMessage"
    # Commit kan misslyckas om inga andringar finns, det ar OK
    
    Write-Host "[4/11] Pushar till GitHub..." -ForegroundColor Yellow
    if ($Force) {
        Write-Host "Anvander --force for att pusha..." -ForegroundColor Magenta
        git push -u origin master --force
    } else {
        git push -u origin master
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Push misslyckades. Vill du forsoka med --force? (j/n)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -eq "j") {
                git push -u origin master --force
                Test-LastCommand "Force push misslyckades"
            }
        }
    }
} else {
    Write-Host "[1-4/11] Hoppar over Git-steg..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[5/11] Installerar npm-paket..." -ForegroundColor Yellow
npm install
Test-LastCommand "npm install misslyckades"

Write-Host ""
Write-Host "[5.5/11] Sakerstaller kompatibel 'expo-secure-store'..." -ForegroundColor Yellow
npx expo install expo-secure-store
Test-LastCommand "Kunde inte installera 'expo-secure-store' med expo install"

# === NYA STEG TILLAGDA ===

Write-Host ""
Write-Host "[5.6/11] Uppdaterar alla paket till rätt versioner..." -ForegroundColor Yellow
npx expo install --fix
Test-LastCommand "Kunde inte fixa paketversioner"

Write-Host ""
Write-Host "[5.7/11] Atgardar sakerhetsproblem..." -ForegroundColor Yellow
npm audit fix
# Audit fix kan misslyckas om vissa sarbarheter inte kan fixas automatiskt - det ar OK

Write-Host ""
Write-Host "[5.8/11] Committar andringar fore prebuild..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Hittade ocommittade andringar, committar..." -ForegroundColor Magenta
    git add .
    git commit -m "Auto-commit: paketuppdateringar fore production build"
    if (-not $SkipGit) {
        git push origin master
    }
} else {
    Write-Host "Inga andringar att commita" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[6/11] Sakerstaller ren nativ konfiguration (prebuild --clean)..." -ForegroundColor Yellow
npx expo prebuild --clean
Test-LastCommand "Kunde inte kora expo prebuild --clean"

# === SLUT PÅ NYA STEG ===

Write-Host ""
Write-Host "[7/11] Kontrollerar EAS-inloggning..." -ForegroundColor Yellow
eas whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Du ar inte inloggad i EAS. Loggar in..." -ForegroundColor Magenta
    eas login
    Test-LastCommand "EAS login misslyckades"
}

Write-Host ""
Write-Host "[8/11] Kor expo-doctor for att kontrollera projektet..." -ForegroundColor Yellow
npx expo-doctor
if ($LASTEXITCODE -ne 0) {
    Write-Host "Expo-doctor hittade problem. Forsoker fixa..." -ForegroundColor Magenta
    npx expo install --fix
    Test-LastCommand "Kunde inte fixa problemen"
}

Write-Host ""
Write-Host "[9/11] Konfigurerar EAS build (om inte redan gjort)..." -ForegroundColor Yellow
if (-not (Test-Path "eas.json")) {
    eas build:configure
    Test-LastCommand "EAS build:configure misslyckades"
} else {
    Write-Host "eas.json finns redan, hoppar over konfiguration..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Red
Write-Host "Startar PRODUCTION build for $Platform..." -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red
Write-Host ""
Write-Host "OBS: Du kommer att fa fragor under build-processen:" -ForegroundColor Yellow
Write-Host "  - 'Generate a new Android Keystore?' -> Svara 'n' (bor redan finnas en i EAS)" -ForegroundColor Gray
Write-Host "  - Andra konfigurationsfragor beroende pa setup" -ForegroundColor Gray
Write-Host ""

eas build --platform $Platform --profile production

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "PRODUCTION BUILD KLAR!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nasta steg:" -ForegroundColor Yellow
Write-Host "1. Logga in pa https://expo.dev" -ForegroundColor White
Write-Host "2. Ga till ditt projekt 'Vibzmobile'" -ForegroundColor White
Write-Host "3. Hitta den fardiga builden under 'Builds'" -ForegroundColor White
Write-Host "4. Ladda ner APK/AAB for distribution" -ForegroundColor White
Write-Host ""
Write-Host "For Google Play Store:" -ForegroundColor Cyan
Write-Host "  - Anvand .AAB-filen (Android App Bundle)" -ForegroundColor White
Write-Host "  - Ladda upp via Google Play Console" -ForegroundColor White
Write-Host ""
Write-Host "For direkt installation:" -ForegroundColor Cyan
Write-Host "  - Anvand .APK-filen" -ForegroundColor White
Write-Host "  - Skicka till anvandare for manuell installation" -ForegroundColor White
Write-Host ""