const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');

/**
 * Gestionnaire de sessions WhatsApp avec gestion robuste des verrous et nettoyage
 * Évite les conflits de sessions et optimise la stabilité de WhatsApp Web.js
 */
class WhatsAppSessionManager {
    constructor() {
        this.sessionsPath = path.join(__dirname, '../.wwebjs_auth');
        this.cachePath = path.join(__dirname, '../.wwebjs_cache');
        this.tempPath = path.join(__dirname, '../temp');
        this.lockFile = path.join(__dirname, '../whatsapp.lock');
        this.execAsync = util.promisify(exec);
        this.cleanupInterval = null;
        this.isLocked = false;
    }

    /**
     * Acquérir un verrou sur les sessions WhatsApp
     * Empêche les opérations simultanées qui peuvent corrompre les sessions
     */
    async acquireLock(timeoutMs = 30000) {
        const startTime = Date.now();
        
        while (this.isLocked && (Date.now() - startTime) < timeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (this.isLocked) {
            throw new Error('Impossible d\'acquérir le verrou WhatsApp (timeout)');
        }
        
        this.isLocked = true;
        
        try {
            await fs.writeFile(this.lockFile, JSON.stringify({
                pid: process.pid,
                timestamp: Date.now(),
                operation: 'session_management'
            }));
            console.log('🔒 Verrou WhatsApp acquis');
            return true;
        } catch (error) {
            this.isLocked = false;
            throw new Error(`Erreur acquisition verrou: ${error.message}`);
        }
    }

    /**
     * Libérer le verrou sur les sessions WhatsApp
     */
    async releaseLock() {
        try {
            if (await this.fileExists(this.lockFile)) {
                await fs.unlink(this.lockFile);
            }
            this.isLocked = false;
            console.log('🔓 Verrou WhatsApp libéré');
        } catch (error) {
            console.warn('⚠️ Erreur libération verrou:', error.message);
            this.isLocked = false;
        }
    }

    /**
     * Vérifier si un fichier existe
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Nettoyer tous les processus Chrome/Chromium
     * Compatible Windows et Linux
     */
    async forceCleanChrome() {
        try {
            console.log('🧹 Nettoyage des processus Chrome...');
            
            const commands = process.platform === 'win32' ? [
                'taskkill /F /IM chrome.exe 2>nul',
                'taskkill /F /IM chromedriver.exe 2>nul',
                'taskkill /F /IM chromium.exe 2>nul'
            ] : [
                'pkill -f chrome 2>/dev/null || true',
                'pkill -f chromium 2>/dev/null || true',
                'pkill -f "Google Chrome" 2>/dev/null || true'
            ];

            for (const cmd of commands) {
                try {
                    await this.execAsync(cmd);
                } catch (err) {
                    // Ignorer les erreurs si les processus n'existent pas
                }
            }

            // Attendre que les processus se terminent
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('✅ Processus Chrome nettoyés');

        } catch (error) {
            console.warn('⚠️ Erreur nettoyage Chrome:', error.message);
        }
    }

    /**
     * Supprimer récursivement un dossier avec retry
     */
    async removeDirectory(dirPath, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (await this.fileExists(dirPath)) {
                    await fs.rm(dirPath, { 
                        recursive: true, 
                        force: true,
                        maxRetries: 3,
                        retryDelay: 1000
                    });
                    console.log(`✅ Dossier supprimé: ${path.basename(dirPath)}`);
                }
                return;
            } catch (error) {
                if (attempt === maxRetries) {
                    console.warn(`⚠️ Échec suppression ${path.basename(dirPath)} après ${maxRetries} tentatives:`, error.message);
                } else {
                    console.log(`🔄 Tentative ${attempt}/${maxRetries} suppression ${path.basename(dirPath)}...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }
    }

    /**
     * Nettoyer les fichiers de session WhatsApp
     */
    async removeSessionFiles() {
        console.log('🧹 Nettoyage des fichiers de session...');
        
        const dirsToClean = [
            this.sessionsPath,
            this.cachePath,
            this.tempPath,
            path.join(__dirname, '../session_data'),
            path.join(__dirname, '../.chromium-browser-snapshots'),
            path.join(__dirname, '../Default')
        ];

        const filesToClean = [
            path.join(__dirname, '../chrome_debug.log'),
            path.join(__dirname, '../.DS_Store')
        ];

        // Nettoyer les dossiers
        for (const dir of dirsToClean) {
            await this.removeDirectory(dir);
        }

        // Nettoyer les fichiers
        for (const file of filesToClean) {
            try {
                if (await this.fileExists(file)) {
                    await fs.unlink(file);
                    console.log(`✅ Fichier supprimé: ${path.basename(file)}`);
                }
            } catch (error) {
                console.warn(`⚠️ Erreur suppression ${path.basename(file)}:`, error.message);
            }
        }

        console.log('✅ Nettoyage des fichiers de session terminé');
    }

    /**
     * Nettoyage complet avec verrou
     * Fonction principale pour réinitialiser proprement WhatsApp
     */
    async cleanSessions() {
        let lockAcquired = false;
        
        try {
            await this.acquireLock();
            lockAcquired = true;
            
            console.log('🔄 Début du nettoyage complet des sessions WhatsApp...');
            
            // 1. Tuer les processus Chrome
            await this.forceCleanChrome();
            
            // 2. Attendre que tout se stabilise
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 3. Nettoyer les fichiers de session
            await this.removeSessionFiles();
            
            // 4. Créer les dossiers nécessaires
            await this.initializeDirectories();
            
            console.log('✅ Nettoyage complet des sessions terminé');
            
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage des sessions:', error.message);
            throw error;
        } finally {
            if (lockAcquired) {
                await this.releaseLock();
            }
        }
    }

    /**
     * Initialiser les dossiers nécessaires
     */
    async initializeDirectories() {
        const dirs = [this.tempPath];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Dossier créé: ${path.basename(dir)}`);
            } catch (error) {
                console.warn(`⚠️ Erreur création dossier ${path.basename(dir)}:`, error.message);
            }
        }
    }

    /**
     * Vérifier l'état des sessions
     */
    async getSessionStatus() {
        try {
            const status = {
                sessionsExists: await this.fileExists(this.sessionsPath),
                cacheExists: await this.fileExists(this.cachePath),
                lockExists: await this.fileExists(this.lockFile),
                isLocked: this.isLocked,
                timestamp: new Date().toISOString()
            };

            if (status.sessionsExists) {
                try {
                    const stats = await fs.stat(this.sessionsPath);
                    status.sessionSize = stats.size;
                    status.sessionModified = stats.mtime;
                } catch (error) {
                    status.sessionError = error.message;
                }
            }

            return status;
        } catch (error) {
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Démarrer le nettoyage automatique périodique
     */
    startPeriodicCleanup(intervalMs = 3600000) { // 1 heure par défaut
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(async () => {
            try {
                console.log('🔄 Nettoyage automatique périodique...');
                
                // Nettoyer les fichiers temporaires uniquement
                await this.removeDirectory(this.tempPath);
                await this.initializeDirectories();
                
                // Optimiser si possible
                if (process.platform !== 'win32') {
                    try {
                        await this.execAsync('sync');
                    } catch (error) {
                        // Ignorer les erreurs sync
                    }
                }
                
                console.log('✅ Nettoyage automatique terminé');
            } catch (error) {
                console.warn('⚠️ Erreur nettoyage automatique:', error.message);
            }
        }, intervalMs);

        console.log(`✅ Nettoyage automatique configuré (${intervalMs/60000} min)`);
    }

    /**
     * Arrêter le nettoyage automatique
     */
    stopPeriodicCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('✅ Nettoyage automatique arrêté');
        }
    }

    /**
     * Nettoyage final lors de la fermeture de l'application
     */
    async shutdown() {
        console.log('🔄 Arrêt du gestionnaire de sessions WhatsApp...');
        
        this.stopPeriodicCleanup();
        
        try {
            await this.forceCleanChrome();
            await this.releaseLock();
            console.log('✅ Gestionnaire de sessions WhatsApp arrêté proprement');
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'arrêt du gestionnaire:', error.message);
        }
    }
}

// Instance singleton
const sessionManager = new WhatsAppSessionManager();

// Gestion propre de l'arrêt
process.on('SIGINT', () => sessionManager.shutdown());
process.on('SIGTERM', () => sessionManager.shutdown());
process.on('exit', () => sessionManager.shutdown());

module.exports = sessionManager;