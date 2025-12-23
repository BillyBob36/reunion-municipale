@echo off
REM Script d'upload des données vers Render
echo ========================================
echo Upload des donnees vers Render
echo ========================================
echo.

REM Vérifier que l'URL Render est définie
set /p RENDER_URL="Entrez l'URL de votre service Render (ex: https://menil-app-backend.onrender.com): "

if "%RENDER_URL%"=="" (
    echo Erreur: URL Render non definie
    pause
    exit /b 1
)

echo.
echo URL Render: %RENDER_URL%
echo.

REM Vérifier que les fichiers de backup existent
if not exist "data_backup\residents.json" (
    echo Erreur: Les fichiers de backup n'existent pas
    echo Executez d'abord backup_railway_data.bat
    pause
    exit /b 1
)

echo [1/6] Upload de residents.json...
curl -X POST %RENDER_URL%/api/residents -H "Content-Type: application/json" -d @data_backup\residents.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ residents.json upload
) else (
    echo     ✗ Erreur lors de l'upload de residents.json
)
echo.

echo [2/6] Upload de meetings.json (si non vide)...
for %%A in (data_backup\meetings.json) do set size=%%~zA
if %size% GTR 10 (
    curl -X POST %RENDER_URL%/api/meetings -H "Content-Type: application/json" -d @data_backup\meetings.json
    echo     ✓ meetings.json upload
) else (
    echo     - meetings.json vide, ignore
)
echo.

echo [3/6] Upload de reports.json...
REM Les reports sont uploadés via l'endpoint /api/reports/{meetingId}
REM Ce script ne peut pas les uploader automatiquement
echo     ℹ reports.json doit etre upload manuellement via le Shell Render
echo.

echo [4/6] Upload de participant_stats.json...
curl -X POST %RENDER_URL%/api/participant-stats -H "Content-Type: application/json" -d @data_backup\participant_stats.json
if %ERRORLEVEL% EQU 0 (
    echo     ✓ participant_stats.json upload
) else (
    echo     ✗ Erreur lors de l'upload
)
echo.

echo [5/6] Verification - Test API residents...
curl %RENDER_URL%/api/residents
echo.
echo.

echo [6/6] Verification - Health check...
curl %RENDER_URL%/health
echo.
echo.

echo ========================================
echo Upload termine !
echo ========================================
echo.
echo Note: Les votes et reports doivent etre uploads manuellement
echo via le Shell Render ou l'interface web.
echo.
pause
