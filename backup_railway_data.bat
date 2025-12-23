@echo off
REM Script de backup des données Railway
echo ========================================
echo Backup des donnees Railway
echo ========================================
echo.

REM Créer le dossier de backup
if not exist "data_backup" mkdir data_backup

echo [1/7] Backup de meetings.json...
railway run -- cat /app/data/meetings.json > data_backup\meetings.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ meetings.json sauvegarde
) else (
    echo     ✗ Erreur lors du backup de meetings.json
)

echo [2/7] Backup de votes.json...
railway run -- cat /app/data/votes.json > data_backup\votes.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ votes.json sauvegarde
) else (
    echo     ✗ Erreur lors du backup de votes.json
)

echo [3/7] Backup de residents.json...
railway run -- cat /app/data/residents.json > data_backup\residents.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ residents.json sauvegarde
) else (
    echo     ✗ Erreur lors du backup de residents.json
)

echo [4/7] Backup de reports.json...
railway run -- cat /app/data/reports.json > data_backup\reports.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ reports.json sauvegarde
) else (
    echo     ✗ Erreur lors du backup de reports.json
)

echo [5/7] Backup de participant_stats.json...
railway run -- cat /app/data/participant_stats.json > data_backup\participant_stats.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ participant_stats.json sauvegarde
) else (
    echo     ✗ Erreur lors du backup de participant_stats.json
)

echo [6/7] Backup de past_meetings.json...
railway run -- cat /app/data/past_meetings.json > data_backup\past_meetings.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ past_meetings.json sauvegarde
) else (
    echo     ✗ Erreur lors du backup de past_meetings.json
)

echo.
echo [7/7] Verification des fichiers...
echo.

for %%F in (data_backup\*.json) do (
    echo     - %%~nxF : %%~zF octets
)

echo.
echo ========================================
echo Backup termine !
echo ========================================
echo.
echo Les donnees sont dans le dossier: data_backup\
echo.
pause
