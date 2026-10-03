# ResQFlow - Frontend S3 Sync & Deployment Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   ResQFlow -- Deploying Frontend to Amazon S3" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$BucketName = "resqflow-app-621962614200"
$Region = "ap-south-2"
$FrontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host ""
Write-Host "[1/3] Building production bundle with Vite..." -ForegroundColor Yellow
Push-Location $FrontendDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Aborting deployment." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host ""
Write-Host "[2/3] Syncing dist/ assets to Amazon S3 bucket: $BucketName..." -ForegroundColor Yellow
$DistDir = Join-Path $FrontendDir "dist"
aws s3 sync $DistDir "s3://$BucketName" --delete --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[3/3] Deployment Successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Live Public Website URL:" -ForegroundColor Cyan
    Write-Host "http://$BucketName.s3-website.$Region.amazonaws.com" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "S3 Sync failed. Please verify AWS credentials." -ForegroundColor Red
}
