@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Installez Node.js LTS depuis https://nodejs.org puis relancez ce fichier.
  echo Aucune autre installation n'est necessaire.
  pause
  exit /b 1
)
node "%~dp0demarrer.mjs"
if errorlevel 1 pause
