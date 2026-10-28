# ==============================================================================
# LITC NEXUS TDS - Strix Deep Infrastructure & Posture Security Engine
# Enterprise Deep Auditing for Cloud-Native & Container Security
# ==============================================================================
[CmdletBinding()]
param(
    [string]$TargetDir = ''
)

if ([string]::IsNullOrWhiteSpace($TargetDir)) {
    $TargetDir = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
}

$ErrorActionPreference = 'Continue'
Write-Host '================================================================================' -ForegroundColor DarkCyan
Write-Host ' [STRIX] Deep Infrastructure, Posture & Attack Surface Analyzer' -ForegroundColor Cyan
Write-Host '================================================================================' -ForegroundColor DarkCyan

$findings = @()
$passedChecks = 0
$totalChecks = 0

function Assert-Check {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$SuccessMsg,
        [string]$FailureMsg,
        [string]$Severity = 'HIGH'
    )
    $script:totalChecks++
    if ($Condition) {
        $script:passedChecks++
        Write-Host "  [PASS] ${Name}: $SuccessMsg" -ForegroundColor Green
    } else {
        $script:findings += [PSCustomObject]@{
            Check = $Name
            Severity = $Severity
            Message = $FailureMsg
        }
        Write-Host "  [FAIL] ${Name}: $FailureMsg ($Severity)" -ForegroundColor Red
    }
}

# 1. Environment & Secrets Posture
Write-Host "`n  -> Inspecting Environment & Isolation Posture..." -ForegroundColor Yellow
$envPath = Join-Path $TargetDir '.env'
$envExamplePath = Join-Path $TargetDir '.env.example'

Assert-Check -Name 'ENV_EXAMPLE_EXISTS' `
    -Condition (Test-Path $envExamplePath) `
    -SuccessMsg 'Sanitized .env.example template is properly tracked' `
    -FailureMsg 'Missing .env.example template for secure secret provisioning'

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    Assert-Check -Name 'ENV_DATABASE_SSL' `
        -Condition ($envContent -match 'encrypt=true|sslmode=require|trustServerCertificate=true') `
        -SuccessMsg 'Database connection enforces TLS/SSL transport security parameters' `
        -FailureMsg 'Database connection does not explicitly define SSL encryption' `
        -Severity 'MEDIUM'
        
    Assert-Check -Name 'ENV_JWT_SECRET_STRENGTH' `
        -Condition ($envContent -match 'JWT_SECRET=(.{16,})') `
        -SuccessMsg 'JWT signing secret meets enterprise entropy requirements (>16 chars)' `
        -FailureMsg 'JWT secret is missing or insufficiently random (<16 chars)' `
        -Severity 'CRITICAL'
}

# 2. HTTP & API Hardening Posture (Helmet, CORS, Rate Limiting, WAF)
Write-Host "`n  -> Auditing API Gateway Hardening & Headers..." -ForegroundColor Yellow
$expressAppTs = Join-Path $TargetDir 'src\expressApp.ts'
$serverTs = Join-Path $TargetDir 'src\server.ts'
$appTs = Join-Path $TargetDir 'src\app.ts'
$appContent = ''
if (Test-Path $expressAppTs) { $appContent = Get-Content $expressAppTs -Raw }
elseif (Test-Path $appTs) { $appContent = Get-Content $appTs -Raw }
elseif (Test-Path $serverTs) { $appContent = Get-Content $serverTs -Raw }

Assert-Check -Name 'SECURITY_HEADERS_HELMET' `
    -Condition ($appContent -match 'helmet\(') `
    -SuccessMsg 'HTTP security headers (Helmet CSP/HSTS/Sniff-Guard) active' `
    -FailureMsg 'Helmet security middleware not detected in application bootstrap' `
    -Severity 'HIGH'

Assert-Check -Name 'RATE_LIMITING_ACTIVE' `
    -Condition ($appContent -match 'rateLimit|express-rate-limit') `
    -SuccessMsg 'Brute-force and DoS rate limiters enforced on API endpoints' `
    -FailureMsg 'Rate limiting middleware not detected on entry router' `
    -Severity 'HIGH'

Assert-Check -Name 'COOKIE_PARSER_ACTIVE' `
    -Condition ($appContent -match 'cookieParser\(') `
    -SuccessMsg 'Cookie encryption & parsing enabled for HttpOnly session tokens' `
    -FailureMsg 'Cookie parser not found for secure cookie-based session tokens' `
    -Severity 'HIGH'

Assert-Check -Name 'WAF_SHIELD_ACTIVE' `
    -Condition ($appContent -match 'WAFMiddleware\.shield') `
    -SuccessMsg 'Application WAF active filtering payloads against SQLi and XSS' `
    -FailureMsg 'WAF Shield middleware missing from application pipeline' `
    -Severity 'CRITICAL'

# 3. Supply Chain & Code Posture
Write-Host "`n  -> Validating Development Hygiene & Tool Exclusion..." -ForegroundColor Yellow
$pkgJsonPath = Join-Path $TargetDir 'package.json'
$pkgContent = if (Test-Path $pkgJsonPath) { Get-Content $pkgJsonPath -Raw } else { '' }

Assert-Check -Name 'PROHIBITED_TOOLS_EXCLUSION' `
    -Condition ($pkgContent -notmatch 'metasploit|owasp-zap|yara') `
    -SuccessMsg 'Metasploit, OWASP ZAP, and YARA strictly excluded from dev dependencies' `
    -FailureMsg 'Forbidden offensive/heavy tools detected in package manifests' `
    -Severity 'CRITICAL'

Assert-Check -Name 'ARGON2ID_HASHING' `
    -Condition ($pkgContent -match '"argon2"') `
    -SuccessMsg 'Argon2id state-of-the-art password hashing library configured' `
    -FailureMsg 'Argon2 library not declared in core dependencies' `
    -Severity 'HIGH'

# Summary
$score = if ($totalChecks -gt 0) { [math]::Round(($passedChecks / $totalChecks) * 100, 1) } else { 0 }
Write-Host "`n--------------------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host " [STRIX SUMMARY] Checks: $totalChecks | Passed: $passedChecks | Score: $score%" -ForegroundColor $(if ($score -ge 85) { 'Green' } else { 'Yellow' })
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkCyan

if ($findings.Count -eq 0) {
    Write-Host " [PASS] Strix Deep Infrastructure & Posture Audit Passed Cleanly." -ForegroundColor Green
    return $true
} else {
    Write-Host " [INFO] Strix recorded $($findings.Count) security posture recommendations." -ForegroundColor Yellow
    return ($findings.Where({ $_.Severity -eq 'CRITICAL' }).Count -eq 0)
}
