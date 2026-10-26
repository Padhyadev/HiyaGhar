# ==============================================================================
# HIYAGHAR - ONE-CLICK PRODUCTION PUBLISH SCRIPT
# ==============================================================================
# Usage:
#   .\publish.ps1
# Or double-click publish.bat from Windows Explorer.
# ==============================================================================

[CmdletBinding()]
param(
    [string]$OutputDir = "",
    [switch]$SkipZip = $false
)

$ErrorActionPreference = "Stop"

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
    $scriptRoot = (Get-Item -Path ".").FullName
}

if (-not $OutputDir) {
    $OutputDir = Join-Path $scriptRoot "publish"
}

function Write-Step {
    param([string]$Text)
    Write-Host "`n[STEP] $Text" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[WARNING] $Text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Text)
    Write-Host "[ERROR] $Text" -ForegroundColor Red
}

$startTime = Get-Date

Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "             HIYAGHAR PROJECT PUBLISH PIPELINE              " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "Project Root : $scriptRoot"
Write-Host "Publish Dest : $OutputDir"
Write-Host "Started At   : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# 1. PREREQUISITES CHECK
Write-Step "Checking prerequisites (dotnet, node, npm)..."
try {
    $dotnetVersion = & dotnet --version
    Write-Host " - .NET SDK: $dotnetVersion" -ForegroundColor Gray
} catch {
    Write-Err ".NET SDK is not installed or not in PATH."
    exit 1
}

try {
    $nodeVersion = & node --version
    Write-Host " - Node.js:  $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Err "Node.js is not installed or not in PATH."
    exit 1
}

# 2. CLIENT DEPENDENCY CHECK & BUILD
Write-Step "Building React + Vite Client (hiya2.client)..."
$clientDir = Join-Path $scriptRoot "hiya2.client"

if (-not (Test-Path (Join-Path $clientDir "node_modules"))) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Yellow
    Push-Location $clientDir
    try {
        & cmd.exe /c npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
    } finally {
        Pop-Location
    }
}

Push-Location $clientDir
try {
    & cmd.exe /c npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Client build failed."
    }
    Write-Success "Frontend build complete."
} finally {
    Pop-Location
}

# 3. DOTNET PUBLISH (Release Configuration)
Write-Step "Publishing ASP.NET Core Backend (Hiya2.Server) in Release mode..."
$serverProj = Join-Path $scriptRoot "Hiya2.Server\Hiya2.Server.csproj"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

& dotnet publish $serverProj -c Release -o $OutputDir
if ($LASTEXITCODE -ne 0) {
    Write-Err "dotnet publish failed."
    exit 1
}
Write-Success "ASP.NET Core publish complete to $OutputDir"

# 4. VERIFY CRITICAL FILES
Write-Step "Verifying publish artifacts..."
$criticalFiles = @(
    "Hiya2.Server.dll",
    "web.config",
    "appsettings.json",
    "wwwroot\index.html"
)

$allFound = $true
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $OutputDir $file
    if (Test-Path $fullPath) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Warn "  [MISSING] $file"
        $allFound = $false
    }
}

# 5. CREATE DEPLOYMENT ZIP ARCHIVE
if (-not $SkipZip) {
    Write-Step "Creating deployment ZIP package..."
    $zipPath = Join-Path $OutputDir "publish.zip"
    
    # Remove existing zip if present
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    # Gather all items in publish directory except .zip files
    $itemsToZip = Get-ChildItem -Path $OutputDir | Where-Object { $_.Extension -ne ".zip" }
    
    Compress-Archive -Path $itemsToZip.FullName -DestinationPath $zipPath -CompressionLevel Optimal -Force
    
    $zipItem = Get-Item $zipPath
    $zipSizeMb = [math]::Round($zipItem.Length / 1MB, 2)
    Write-Success "Deployment zip created: $zipPath ($zipSizeMb MB)"
}

$duration = (Get-Date) - $startTime
$durationSec = [math]::Round($duration.TotalSeconds, 1)

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "                PUBLISH COMPLETED SUCCESSFULLY!             " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Destination Directory : $OutputDir"
if (-not $SkipZip) {
    Write-Host "Deployable ZIP File   : $OutputDir\publish.zip"
}
Write-Host "Elapsed Time          : $durationSec seconds"
Write-Host "Hosting Deployment    : Ready to upload to GrabWeb / IIS server`n"
