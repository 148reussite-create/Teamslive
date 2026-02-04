@echo off
echo ================================
echo   Teams Clone - Demarrage
echo ================================
echo.

REM Vérifier si node_modules existe
if not exist "node_modules\" (
    echo Installation des dependances...
    call npm install
    echo.
)

echo Demarrage du serveur...
echo.
echo ================================
echo   LIENS DISPONIBLES:
echo ================================
echo.
echo   HOTE:        http://localhost:3000/host
echo   PARTICIPANT: http://localhost:3000/participant
echo.
echo ================================
echo.
echo Instructions:
echo 1. Ouvrez le lien HOTE dans un navigateur
echo 2. Uploadez 1-2 videos et demarrez le meeting
echo 3. Ouvrez le lien PARTICIPANT dans un autre onglet
echo 4. Entrez votre nom et rejoignez
echo 5. L'hote devra admettre le participant
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.
echo ================================
echo.

call npm start
