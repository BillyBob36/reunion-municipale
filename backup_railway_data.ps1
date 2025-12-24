# Script PowerShell de backup des donnees Railway
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup des donnees Railway" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Creer le dossier de backup
if (-not (Test-Path "data_backup")) {
    New-Item -ItemType Directory -Path "data_backup" | Out-Null
}

$files = @(
    "meetings.json",
    "votes.json",
    "residents.json",
    "reports.json",
    "participant_stats.json",
    "past_meetings.json"
)

$count = 1
$total = $files.Count + 1

foreach ($file in $files) {
    Write-Host "[$count/$total] Backup de $file..." -ForegroundColor Yellow

    $output = railway run --service web cat /app/data/$file 2>&1

    if ($LASTEXITCODE -eq 0 -and $output) {
        $output | Out-File -FilePath "data_backup\$file" -Encoding UTF8
        Write-Host "    OK $file sauvegarde" -ForegroundColor Green
    } else {
        Write-Host "    ERREUR lors du backup de $file" -ForegroundColor Red
    }

    $count++
}

Write-Host ""
Write-Host "[$count/$total] Verification des fichiers..." -ForegroundColor Yellow
Write-Host ""

Get-ChildItem -Path "data_backup\*.json" | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host "    - $($_.Name) : $size KB" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup termine !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Les donnees sont dans le dossier: data_backup" -ForegroundColor White
Write-Host ""
