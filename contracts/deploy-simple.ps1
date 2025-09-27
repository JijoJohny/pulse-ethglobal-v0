Write-Host "🚀 CLMSR Protocol CLI Deployment Guide" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

Write-Host "`n✅ Your environment is ready!" -ForegroundColor Green
Write-Host "📁 Location: $(Get-Location)" -ForegroundColor Cyan

if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file missing" -ForegroundColor Red
}

Write-Host "`n🎯 CLI Deployment Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🔥 FOUNDRY (Recommended)" -ForegroundColor Green
Write-Host "   - Best CLI tool for Solidity" -ForegroundColor White
Write-Host "   - Fast and reliable" -ForegroundColor White
Write-Host ""
Write-Host "2. 🌐 REMIX IDE (Easiest)" -ForegroundColor Blue  
Write-Host "   - No installation needed" -ForegroundColor White
Write-Host "   - Visual interface" -ForegroundColor White

Write-Host "`n🔥 To install Foundry:" -ForegroundColor Green
Write-Host "1. Install Git: https://git-scm.com/download/win"
Write-Host "2. Open Git Bash and run:"
Write-Host "   curl -L https://foundry.paradigm.xyz | bash"
Write-Host "3. Restart terminal and run: foundryup"
Write-Host "4. Deploy with: ./foundry-deploy.sh"

Write-Host "`n🌐 To use Remix IDE:" -ForegroundColor Blue
Write-Host "1. Go to: https://remix.ethereum.org"
Write-Host "2. Upload all .sol files from contracts/ folder"
Write-Host "3. Follow the deploy-remix-guide.md"

Write-Host "`n🚀 Ready to deploy!" -ForegroundColor Green
