# Update-Docs.ps1
# Automates documentation validation and timestamp updates for VIBES v13

$DocsDir = Join-Path $PSScriptRoot "..\..\docs"
$BackendDir = Join-Path $PSScriptRoot "..\..\apps\backend"
$FrontendDir = Join-Path $PSScriptRoot "..\..\apps\frontend"

Write-Host "Starting Documentation Validation Pipeline..." -ForegroundColor Cyan

# 1. Version Check
$CargoToml = Get-Content (Join-Path $BackendDir "Cargo.toml") -Raw
if ($CargoToml -match 'version = "13.0.0"') {
    Write-Host "[PASS] Backend Version is 13.0.0" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Backend Version mismatch!" -ForegroundColor Red
}

$PackageJson = Get-Content (Join-Path $FrontendDir "package.json") -Raw
if ($PackageJson -match '"version": "13.0.0"') {
    Write-Host "[PASS] Frontend Version is 13.0.0" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Frontend Version mismatch!" -ForegroundColor Red
}

# 2. File Existence Check
$RequiredDocs = @("ARCHITECTURE.md", "API.md")
foreach ($Doc in $RequiredDocs) {
    if (Test-Path (Join-Path $DocsDir $Doc)) {
        Write-Host "[PASS] $Doc exists." -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] $Doc missing!" -ForegroundColor Red
    }
}

# 3. Update Timestamps (Simulated CI/CD behavior)
$DateStr = Get-Date -Format "yyyy-MM-dd"
foreach ($Doc in $RequiredDocs) {
    $Path = Join-Path $DocsDir $Doc
    $Content = Get-Content $Path -Raw
    # Regex replace "Last Updated: .*" with current date
    $NewContent = $Content -replace "Last Updated: \d{4}-\d{2}-\d{2}", "Last Updated: $DateStr"
    if ($Content -ne $NewContent) {
        Set-Content -Path $Path -Value $NewContent
        Write-Host "[UPDATE] Updated timestamp in $Doc" -ForegroundColor Yellow
    }
    else {
        Write-Host "[SKIP] $Doc already up to date." -ForegroundColor Gray
    }
}

Write-Host "Documentation Validation Complete." -ForegroundColor Cyan
