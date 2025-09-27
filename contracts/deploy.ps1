# PowerShell deployment script for Windows
# Run with: powershell -ExecutionPolicy Bypass -File deploy.ps1

Write-Host "🚀 CLMSR Protocol Deployment Script" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your private key" -ForegroundColor Yellow
    exit 1
}

# Read environment variables from .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$RPC_URL = $env:ROOTSTOCK_RPC_URL
$PRIVATE_KEY = $env:CONTRACT_DEPLOYER_PRIVATE_KEY

if (-not $PRIVATE_KEY) {
    Write-Host "❌ CONTRACT_DEPLOYER_PRIVATE_KEY not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "📝 RPC URL: $RPC_URL" -ForegroundColor Cyan
Write-Host "🔑 Private Key: [HIDDEN]" -ForegroundColor Cyan

Write-Host "`n🎯 Deployment Options:" -ForegroundColor Yellow
Write-Host "1. Install Foundry (recommended)" -ForegroundColor White
Write-Host "2. Use Remix IDE" -ForegroundColor White
Write-Host "3. Use Hardhat (if dependencies work)" -ForegroundColor White

Write-Host "`n🔥 To install Foundry:" -ForegroundColor Green
Write-Host "1. Install Git: https://git-scm.com/download/win" -ForegroundColor White
Write-Host "2. Install Rust: https://rustup.rs/" -ForegroundColor White
Write-Host "3. Run in Git Bash: curl -L https://foundry.paradigm.xyz | bash" -ForegroundColor White
Write-Host "4. Run: foundryup" -ForegroundColor White
Write-Host "5. Run: ./foundry-deploy.sh" -ForegroundColor White

Write-Host "`n✅ Your environment is configured and ready!" -ForegroundColor Green
Write-Host "Choose your deployment method above." -ForegroundColor Yellow
