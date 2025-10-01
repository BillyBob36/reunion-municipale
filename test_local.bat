@echo off
echo ========================================
echo   MENIL APP - Test Local
echo ========================================
echo.
echo Installation des dependances...
pip install -r requirements.txt
echo.
echo ========================================
echo   Demarrage du serveur...
echo ========================================
echo.
echo Le serveur va demarrer sur http://localhost:8080
echo.
echo Ouvrez votre navigateur et allez sur:
echo   http://localhost:8080
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.
python server.py
