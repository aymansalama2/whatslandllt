#!/bin/bash

# Script d'optimisation des ressources système pour WhatsLand
# Ce script doit être exécuté avec les privilèges root

echo "🔧 Démarrage de l'optimisation du système..."

# Nettoyage des processus zombies et orphelins
echo "🧹 Nettoyage des processus zombies..."
pkill -f chrome
pkill -f chromium
pkill -f node

# Nettoyage des fichiers temporaires
echo "🧹 Nettoyage des fichiers temporaires..."
find /tmp -type f -atime +1 -delete
find /var/tmp -type f -atime +1 -delete
find /var/www/whatslandllt/backend/.wwebjs_auth -type f -name "*.log" -delete
find /var/www/whatslandllt/backend/.wwebjs_cache -type f -mtime +1 -delete

# Optimisation du système
echo "⚙️ Optimisation du système..."
echo 1 > /proc/sys/vm/drop_caches
echo 2 > /proc/sys/vm/drop_caches
echo 3 > /proc/sys/vm/drop_caches

# Optimisation de la mémoire virtuelle
echo "⚙️ Optimisation de la mémoire virtuelle..."
echo "vm.swappiness=10" > /etc/sysctl.d/99-swappiness.conf
sysctl -p /etc/sysctl.d/99-swappiness.conf

# Redémarrage des services
echo "🔄 Redémarrage des services..."
cd /var/www/whatslandllt
pm2 restart all

echo "✅ Optimisation terminée!"