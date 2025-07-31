#!/bin/bash

# Ajouter le système de logging au début du fichier server.js
echo 'const { logger } = require("./optimize-logs.js");' > temp.js
cat server.js >> temp.js
mv temp.js server.js

# Redémarrer les services
pm2 restart all

echo "Système de logging optimisé installé et services redémarrés"