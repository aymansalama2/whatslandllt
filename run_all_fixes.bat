@echo off
echo 📋 WhatsLand - Script de correction complète
echo ----------------------------------------

echo 🛑 Arrêt des processus Node.js en cours...
taskkill /F /IM node.exe >nul 2>&1

echo ⏳ Attente de l'arrêt complet des processus...
timeout /t 2 >nul

echo 🔧 Lancement de la correction de la base de données...
node fix_database.js

if %ERRORLEVEL% EQU 0 (
  echo ✅ Correction de la base de données terminée
  echo.
  echo 🚀 Vous pouvez maintenant redémarrer l'application avec 'npm start'
) else (
  echo ❌ Échec de la correction de la base de données
  exit /b 1
)

pause 