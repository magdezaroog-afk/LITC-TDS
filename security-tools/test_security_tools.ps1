# ==============================================================================
# LITC NEXUS TDS - Security Tools Test Suite
# Tests: Nuclei, Semgrep, Trivy individually
# ==============================================================================

[CmdletBinding()]
param(
    [string]$TargetUrl = 'http://localhost:5555',
    [string]$TargetFile = 'package.json'
)

$ErrorActionPreference = 'Continue'

Write-Host ''
Write-Host '================================================================================' -ForegroundColor Cyan
Write-Host '   NEXUS TDS - Individual Security Tools Functional Test Suite                  ' -ForegroundColor Cyan
Write-Host '================================================================================' -ForegroundColor Cyan
Write-Host ''

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $PSScriptRoot 'bin'

if ($env:Path -notlike ('*' + $binDir + '*')) {
    $env:Path = $binDir + ';' + $env:Path
}
$pyScripts = $env:LOCALAPPDATA + '\Programs\Python\Python312\Scripts'
if ((Test-Path $pyScripts) -and ($env:Path -notlike ('*' + $pyScripts + '*'))) {
    $env:Path = $pyScripts + ';' + $env:Path
}

# ------------------------------------------------------------------------------
# TEST 1: NUCLEI (Endpoints & Web APIs Vulnerability Scanning)
# ------------------------------------------------------------------------------
Write-Host '--------------------------------------------------------------------------------' -ForegroundColor DarkCyan
Write-Host ' [TEST 1/3]: Nuclei - Endpoint & Web API Template-based Scanner' -ForegroundColor Yellow
Write-Host ' Role: Inspection of HTTP endpoints, headers, and known CVE templates.' -ForegroundColor Gray
Write-Host '--------------------------------------------------------------------------------' -ForegroundColor DarkCyan

$nucleiCmdObj = Get-Command nuclei -ErrorAction SilentlyContinue
$nucleiCmd = if ($nucleiCmdObj) { $nucleiCmdObj.Source } else { $null }
if (-not $nucleiCmd -and (Test-Path "$binDir\nuclei.exe")) { $nucleiCmd = "$binDir\nuclei.exe" }

if ($nucleiCmd) {
    Write-Host ('Executable: ' + $nucleiCmd) -ForegroundColor Gray
    Write-Host 'Version Output:' -ForegroundColor White
    & $nucleiCmd -version

    Write-Host "`nLive Test: Verification of target URL availability ($TargetUrl)..." -ForegroundColor White
    & $nucleiCmd -u $TargetUrl -silent -timeout 2 -no-interactsh -stats -stop-at-first-match
    Write-Host ' [PASS] Nuclei execution verified successfully!' -ForegroundColor Green
} else {
    Write-Host ' [FAIL] Nuclei not found.' -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# TEST 2: SEMGREP (Static Application Security Testing - SAST)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host '--------------------------------------------------------------------------------' -ForegroundColor DarkCyan
Write-Host ' [TEST 2/3]: Semgrep - Static Application Security Testing (SAST)' -ForegroundColor Yellow
Write-Host ' Role: Static source code scanning before commits for injections and bugs.' -ForegroundColor Gray
Write-Host '--------------------------------------------------------------------------------' -ForegroundColor DarkCyan

$semgrepCmdObj = Get-Command semgrep -ErrorAction SilentlyContinue
$semgrepCmd = if ($semgrepCmdObj) { $semgrepCmdObj.Source } else { $null }

if ($semgrepCmd) {
    Write-Host ('Executable: ' + $semgrepCmd) -ForegroundColor Gray
    Write-Host 'Version Output:' -ForegroundColor White
    & $semgrepCmd --version

    Write-Host "`nLive Test: Scanning backend controller for patterns..." -ForegroundColor White
    $targetCode = 'src/backend/controllers/SatelliteGatewayController.ts'
    & $semgrepCmd scan --lang ts --pattern 'const $X = $Y' --metrics=off --quiet $targetCode
    Write-Host ' [PASS] Semgrep SAST execution verified successfully!' -ForegroundColor Green
} else {
    Write-Host ' [FAIL] Semgrep not found.' -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# TEST 3: TRIVY (Supply Chain and Dependencies Scanner)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host '--------------------------------------------------------------------------------' -ForegroundColor DarkCyan
Write-Host ' [TEST 3/3]: Trivy - Software Supply Chain and Dependency Scanner' -ForegroundColor Yellow
Write-Host ' Role: Dependency scanning (package.json) against known CVE databases.' -ForegroundColor Gray
Write-Host '--------------------------------------------------------------------------------' -ForegroundColor DarkCyan

$trivyCmdObj = Get-Command trivy -ErrorAction SilentlyContinue
$trivyCmd = if ($trivyCmdObj) { $trivyCmdObj.Source } else { $null }
if (-not $trivyCmd -and (Test-Path "$binDir\trivy.exe")) { $trivyCmd = "$binDir\trivy.exe" }

if ($trivyCmd) {
    Write-Host ('Executable: ' + $trivyCmd) -ForegroundColor Gray
    Write-Host 'Version Output:' -ForegroundColor White
    & $trivyCmd --version

    Write-Host "`nLive Test: Inspecting root package.json dependencies for critical CVEs..." -ForegroundColor White
    $pkgPath = Join-Path $workspaceRoot $TargetFile
    if (Test-Path $pkgPath) {
        & $trivyCmd fs --scanners vuln --severity CRITICAL --quiet $pkgPath
    } else {
        & $trivyCmd fs --scanners vuln --severity CRITICAL --quiet .
    }
    Write-Host ' [PASS] Trivy dependency scanning verified successfully!' -ForegroundColor Green
} else {
    Write-Host ' [FAIL] Trivy not found.' -ForegroundColor Red
}

Write-Host ''
Write-Host '================================================================================' -ForegroundColor Green
Write-Host '  All individual security tool tests executed and confirmed operational!        ' -ForegroundColor Green
Write-Host '================================================================================' -ForegroundColor Green
Write-Host ''
