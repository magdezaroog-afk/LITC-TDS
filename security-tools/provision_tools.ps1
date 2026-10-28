# ==============================================================================
# LITC NEXUS TDS - DevSecOps Provisioner for Gitleaks & Nmap
# ==============================================================================
$ErrorActionPreference = 'Stop'
$binDir = Join-Path $PSScriptRoot 'bin'
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force | Out-Null }

# 1. Gitleaks Provisioning
$gitleaksExe = Join-Path $binDir 'gitleaks.exe'
if (-not (Test-Path $gitleaksExe)) {
    Write-Host 'Downloading Gitleaks (Windows x64)...' -ForegroundColor Cyan
    $gitleaksZip = Join-Path $PSScriptRoot 'gitleaks.zip'
    $rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/gitleaks/gitleaks/releases/latest' -Headers @{ 'User-Agent' = 'PowerShell' }
    $asset = $rel.assets | Where-Object { $_.name -like '*windows_x64.zip' } | Select-Object -First 1
    if ($asset) {
        Write-Host "  Asset: $($asset.name)" -ForegroundColor Gray
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $gitleaksZip -UseBasicParsing
        Expand-Archive -Path $gitleaksZip -DestinationPath $binDir -Force
        Remove-Item $gitleaksZip -Force
        Write-Host '  [OK] Gitleaks installed successfully.' -ForegroundColor Green
    } else {
        Write-Warning 'Could not find Gitleaks Windows release.'
    }
} else {
    Write-Host '  [OK] Gitleaks already present.' -ForegroundColor Green
}

# 2. Nmap Provisioning (Portable Win32)
$nmapExe = Join-Path $binDir 'nmap.exe'
$nmapSubDir = Join-Path $binDir 'nmap-7.92'
if (-not (Test-Path $nmapExe) -and -not (Test-Path (Join-Path $nmapSubDir 'nmap.exe'))) {
    Write-Host 'Downloading Portable Nmap 7.92...' -ForegroundColor Cyan
    $nmapZip = Join-Path $PSScriptRoot 'nmap.zip'
    $nmapUrl = 'https://nmap.org/dist/nmap-7.92-win32.zip'
    try {
        Invoke-WebRequest -Uri $nmapUrl -OutFile $nmapZip -UseBasicParsing
        Expand-Archive -Path $nmapZip -DestinationPath $binDir -Force
        Remove-Item $nmapZip -Force
        if (Test-Path (Join-Path $nmapSubDir 'nmap.exe')) {
            Copy-Item (Join-Path $nmapSubDir 'nmap.exe') $binDir -Force
            # Also copy supporting files if needed
            Get-ChildItem $nmapSubDir | Copy-Item -Destination $binDir -Force -Recurse -ErrorAction SilentlyContinue
        }
        Write-Host '  [OK] Nmap installed successfully.' -ForegroundColor Green
    } catch {
        Write-Warning "Could not download Nmap zip: $_"
    }
} else {
    Write-Host '  [OK] Nmap already present.' -ForegroundColor Green
}

Write-Host 'Provisioning complete.' -ForegroundColor Cyan
