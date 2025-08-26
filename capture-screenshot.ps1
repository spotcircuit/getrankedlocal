# PowerShell script to capture screenshot of the sales funnel
# Run this in PowerShell after the dev server is running

Write-Host "Opening sales funnel in browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`nThe page should now be open in your browser." -ForegroundColor Yellow
Write-Host "Please take screenshots of:" -ForegroundColor Yellow
Write-Host "1. Hero section (top of page)" -ForegroundColor Cyan
Write-Host "2. Problem section with calculator" -ForegroundColor Cyan
Write-Host "3. Competitor analysis section" -ForegroundColor Cyan
Write-Host "4. Solution section" -ForegroundColor Cyan
Write-Host "5. Social proof section" -ForegroundColor Cyan
Write-Host "6. CTA section (bottom)" -ForegroundColor Cyan

Write-Host "`nYou can use Windows+Shift+S to capture screenshots" -ForegroundColor Green
Write-Host "Save them to the public/screenshots folder" -ForegroundColor Green