@echo off
chcp 65001 >nul
title Ma Boutique
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js n'est pas installe.
  echo Telechargez la version LTS sur https://nodejs.org puis relancez ce fichier.
  echo.
  start https://nodejs.org
  pause
  exit /b
)

if not exist node_modules (
  echo Installation des composants, cela peut prendre quelques minutes...
  call npm install || goto erreur
)

call npm run preparer || goto erreur

if not exist .next\BUILD_ID (
  echo Preparation de l'application...
  call npm run build || goto erreur
)

echo.
echo ============================================
echo  L'application est lancee.
echo  Ouvrez http://localhost:3000 dans le navigateur
echo  Gardez cette fenetre ouverte pendant l'utilisation.
echo ============================================
echo.
start "" /min cmd /c "timeout /t 8 >nul & start http://localhost:3000"
set COOKIE_NON_SECURISE=1
call npm start
goto fin

:erreur
echo.
echo Une erreur est survenue. Copiez le message ci-dessus pour obtenir de l'aide.
pause

:fin
