#!/bin/bash

# Script pour configurer un cron job d'optimisation

# Rendre le script exécutable
chmod +x optimize-vps.sh

# Copier le script sur le serveur
scp optimize-vps.sh root@92.113.31.157:/root/

# Configurer le cron job
ssh root@92.113.31.157 "chmod +x /root/optimize-vps.sh && (crontab -l 2>/dev/null; echo '0 */4 * * * /root/optimize-vps.sh > /root/optimize.log 2>&1') | crontab -"

echo "✅ Cron job configuré pour exécuter le script d'optimisation toutes les 4 heures"