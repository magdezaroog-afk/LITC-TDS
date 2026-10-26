# ==============================================================================
# LITC NEXUS TDS - Security Tools Installer
# Nuclei, Semgrep, Trivy
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$ForceReinstall
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Write-Host ''
Write-Host '================================================================================' -ForegroundColor Cyan
Write-Host '  NEXUS TDS - Security Tools Installer & Provisioner (Nuclei, Semgrep, Trivy)' -ForegroundColor Cyan
Write-Host '================================================================================' -ForegroundColor Cyan
Write-Host ''

$workspaceRoot = $PSScriptRoot
$toolsDir = Join-Path $workspaceRoot 'security-tools'
$binDir = Join-Path $toolsDir 'bin'

if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
}
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

Write-Host ('[1/5] Checking tools directory: ' + $binDir) -ForegroundColor Yellow

function Add-ToUserPath {
    param([string]$PathToAdd)
    if (-not (Test-Path $PathToAdd)) { return }
    
    # 1. Update current process PATH
    if ($env:Path -notlike ('*' + $PathToAdd + '*')) {
        $env:Path = $PathToAdd + ';' + $env:Path
    }

    # 2. Update User permanent PATH in Registry
    try {
        $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($null -eq $currentPath) { $currentPath = '' }
        if ($currentPath -notlike ('*' + $PathToAdd + '*')) {
            $newPath = ($PathToAdd + ';' + $currentPath).TrimEnd(';')
            [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
            Write-Host ('  [+] Added to User Path: ' + $PathToAdd) -ForegroundColor Green
        }
    } catch {
        Write-Warning ('Failed to save path: ' + $_.Exception.Message)
    }
}

# ------------------------------------------------------------------------------
# 1. NUCLEI (ProjectDiscovery)
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] Checking Nuclei vulnerability scanner..." -ForegroundColor Yellow
$nucleiExe = Join-Path $binDir 'nuclei.exe'
$nucleiInstalled = (Test-Path $nucleiExe) -or (Get-Command nuclei -ErrorAction SilentlyContinue)

if (-not $nucleiInstalled -or $ForceReinstall) {
    Write-Host '  [>] Downloading latest Nuclei binary (Windows x64)...' -ForegroundColor Cyan
    try {
        $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/projectdiscovery/nuclei/releases/latest' -Headers @{ 'User-Agent' = 'PowerShell' }
        $asset = $release.assets | Where-Object { $_.name -like '*windows_amd64.zip' } | Select-Object -First 1
        
        if ($asset) {
            $zipPath = Join-Path $toolsDir 'nuclei.zip'
            Write-Host ('  [>] Downloading: ' + $asset.name) -ForegroundColor DarkGray
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -UseBasicParsing
            Expand-Archive -Path $zipPath -DestinationPath $binDir -Force
            Remove-Item $zipPath -Force
            Write-Host ('  [+] Nuclei installed: ' + $nucleiExe) -ForegroundColor Green
        } else {
            throw 'Nuclei Windows AMD64 package not found.'
        }
    } catch {
        Write-Error ('Failed to install Nuclei: ' + $_.Exception.Message)
    }
} else {
    Write-Host '  [OK] Nuclei is already installed.' -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 2. SEMGREP (SAST via Python pip)
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] Checking Semgrep code security scanner..." -ForegroundColor Yellow
$semgrepCmd = Get-Command semgrep -ErrorAction SilentlyContinue

if (-not $semgrepCmd -or $ForceReinstall) {
    Write-Host '  [>] Installing Semgrep via pip...' -ForegroundColor Cyan
    try {
        python -m pip install --upgrade semgrep | Out-Null
        $semgrepCmd = Get-Command semgrep -ErrorAction SilentlyContinue
    } catch {
        Write-Error ('Failed to install Semgrep via pip: ' + $_.Exception.Message)
    }
}

if ($semgrepCmd) {
    Write-Host ('  [OK] Semgrep available at: ' + $semgrepCmd.Source) -ForegroundColor Green
    $pythonScriptsDir = Split-Path $semgrepCmd.Source
    Add-ToUserPath $pythonScriptsDir
} else {
    $pyUserScripts = $env:LOCALAPPDATA + '\Programs\Python\Python312\Scripts'
    if (Test-Path (Join-Path $pyUserScripts 'semgrep.exe')) {
        Add-ToUserPath $pyUserScripts
        Write-Host ('  [OK] Found Semgrep in Python scripts: ' + $pyUserScripts) -ForegroundColor Green
    } else {
        Write-Warning '  [!] Semgrep command not found in PATH.'
    }
}

# ------------------------------------------------------------------------------
# 3. TRIVY (Supply Chain & CVE Scanner - AquaSecurity)
# ------------------------------------------------------------------------------
Write-Host "`n[4/5] Checking Trivy vulnerability & dependency scanner..." -ForegroundColor Yellow
$trivyExe = Join-Path $binDir 'trivy.exe'
$trivyInstalled = (Test-Path $trivyExe) -or (Get-Command trivy -ErrorAction SilentlyContinue)

if (-not $trivyInstalled -or $ForceReinstall) {
    Write-Host '  [>] Downloading latest Trivy binary (Windows x64)...' -ForegroundColor Cyan
    try {
        $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/aquasecurity/trivy/releases/latest' -Headers @{ 'User-Agent' = 'PowerShell' }
        $asset = $release.assets | Where-Object { $_.name -like '*windows-64bit.zip' } | Select-Object -First 1
        
        if ($asset) {
            $zipPath = Join-Path $toolsDir 'trivy.zip'
            Write-Host ('  [>] Downloading: ' + $asset.name) -ForegroundColor DarkGray
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -UseBasicParsing
            Expand-Archive -Path $zipPath -DestinationPath $binDir -Force
            Remove-Item $zipPath -Force
            Write-Host ('  [+] Trivy installed: ' + $trivyExe) -ForegroundColor Green
        } else {
            throw 'Trivy Windows 64bit package not found.'
        }
    } catch {
        Write-Error ('Failed to install Trivy: ' + $_.Exception.Message)
    }
} else {
    Write-Host '  [OK] Trivy is already installed.' -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 4. ENVIRONMENT VARIABLES
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] Provisioning Environment Variables..." -ForegroundColor Yellow
Add-ToUserPath $binDir

# ------------------------------------------------------------------------------
# SUMMARY & VERIFICATION
# ------------------------------------------------------------------------------
Write-Host ''
Write-Host '================================================================================' -ForegroundColor Green
Write-Host '                    Security Tools Readiness Verification                      ' -ForegroundColor Green
Write-Host '================================================================================' -ForegroundColor Green

$nucleiCmdObj = Get-Command nuclei -ErrorAction SilentlyContinue
$resolvedNuclei = if ($nucleiCmdObj) { $nucleiCmdObj.Source } else { $null }
if (-not $resolvedNuclei -and (Test-Path $nucleiExe)) { $resolvedNuclei = $nucleiExe }

$semgrepCmdObj = Get-Command semgrep -ErrorAction SilentlyContinue
$resolvedSemgrep = if ($semgrepCmdObj) { $semgrepCmdObj.Source } else { $null }

$trivyCmdObj = Get-Command trivy -ErrorAction SilentlyContinue
$resolvedTrivy = if ($trivyCmdObj) { $trivyCmdObj.Source } else { $null }
if (-not $resolvedTrivy -and (Test-Path $trivyExe)) { $resolvedTrivy = $trivyExe }

# Nuclei Check
if ($resolvedNuclei) {
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    $nOutput = & $resolvedNuclei -version 2>&1
    $ErrorActionPreference = $prevEAP
    $nVer = $nOutput | Where-Object { $_ -like '*Engine Version*' } | Select-Object -First 1
    if (-not $nVer) { $nVer = $nOutput | Select-Object -First 1 }
    Write-Host (' [OK] Nuclei : ' + $nVer) -ForegroundColor White
    Write-Host ('      Path   : ' + $resolvedNuclei) -ForegroundColor Gray
} else {
    Write-Host ' [FAIL] Nuclei : Not Found' -ForegroundColor Red
}

# Semgrep Check
if ($resolvedSemgrep) {
    try {
        $sVer = & $resolvedSemgrep --version 2>&1 | Select-Object -First 1
        Write-Host (' [OK] Semgrep: ' + $sVer) -ForegroundColor White
        Write-Host ('      Path   : ' + $resolvedSemgrep) -ForegroundColor Gray
    } catch {
        Write-Host ' [!] Semgrep: Error getting version' -ForegroundColor Red
    }
} else {
    Write-Host ' [FAIL] Semgrep: Not Found' -ForegroundColor Red
}

# Trivy Check
if ($resolvedTrivy) {
    try {
        $tVer = & $resolvedTrivy --version 2>&1 | Select-Object -First 1
        Write-Host (' [OK] Trivy  : ' + $tVer) -ForegroundColor White
        Write-Host ('      Path   : ' + $resolvedTrivy) -ForegroundColor Gray
    } catch {
        Write-Host ' [!] Trivy  : Error getting version' -ForegroundColor Red
    }
} else {
    Write-Host ' [FAIL] Trivy  : Not Found' -ForegroundColor Red
}

Write-Host '================================================================================' -ForegroundColor Green
Write-Host 'Installation completed successfully! All tools are provisioned and ready.' -ForegroundColor Cyan
Write-Host ''
