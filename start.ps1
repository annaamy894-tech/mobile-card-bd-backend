$base = "C:\Users\oasis computer\Documents\aiyan dhaka tools"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TrackMaster - Starting Services" -ForegroundColor White
Write-Host "  Backend:  http://localhost:6000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:6200" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting Backend on port 6000..." -ForegroundColor Yellow
$job1 = Start-Job -ScriptBlock { param($p) Set-Location "$p\backend"; node server.js } -ArgumentList $base

Write-Host "[2/2] Starting Frontend on port 6200..." -ForegroundColor Yellow
$job2 = Start-Job -ScriptBlock { param($p) Set-Location "$p\frontend"; npm run dev } -ArgumentList $base

Write-Host ""
Write-Host "Waiting 8 seconds for servers to start..." -ForegroundColor Magenta
Start-Sleep -Seconds 8
Start-Process "http://localhost:6200"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ALL SERVICES RUNNING" -ForegroundColor White
Write-Host "  Press ENTER to STOP all services" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Read-Host

Stop-Job $job1, $job2 -ErrorAction SilentlyContinue
Remove-Job $job1, $job2 -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "All services stopped." -ForegroundColor Red
Start-Sleep -Seconds 2