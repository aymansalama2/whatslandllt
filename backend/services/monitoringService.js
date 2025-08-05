const os = require('os');
const fs = require('fs').promises;
const path = require('path');

/**
 * Service de monitoring pour WhatsApp, Firebase et métriques système
 * Collecte et analyse les données de performance et d'état
 */
class MonitoringService {
    constructor() {
        this.metrics = {
            whatsapp: {
                connectionAttempts: 0,
                successfulConnections: 0,
                qrCodesGenerated: 0,
                messagessSent: 0,
                messagesFailed: 0,
                lastQRGenerated: null,
                lastConnection: null,
                sessionDuration: 0,
                errors: [],
                status: 'disconnected'
            },
            firebase: {
                authAttempts: 0,
                successfulAuths: 0,
                failedAuths: 0,
                lastAuthTime: null,
                tokenVerifications: 0,
                errors: []
            },
            system: {
                memoryUsage: [],
                cpuUsage: [],
                diskUsage: [],
                activeConnections: 0,
                uptime: 0,
                errors: []
            },
            database: {
                connections: 0,
                queries: 0,
                errors: [],
                avgResponseTime: 0,
                lastOptimization: null
            }
        };
        
        this.alerts = {
            memory: { threshold: 80, active: false },
            cpu: { threshold: 85, active: false },
            disk: { threshold: 90, active: false },
            errors: { threshold: 10, active: false }
        };
        
        this.monitoringInterval = null;
        this.metricsHistory = [];
        this.maxHistorySize = 100; // Garder 100 points de données
        this.startTime = Date.now();
    }

    /**
     * Démarrer le monitoring automatique
     */
    startMonitoring(intervalMs = 30000) { // 30 secondes par défaut
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(async () => {
            await this.collectSystemMetrics();
            await this.checkAlerts();
            this.cleanupOldMetrics();
        }, intervalMs);

        console.log(`✅ Monitoring démarré (intervalle: ${intervalMs/1000}s)`);
    }

    /**
     * Arrêter le monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('✅ Monitoring arrêté');
        }
    }

    /**
     * Collecter les métriques système
     */
    async collectSystemMetrics() {
        try {
            const timestamp = Date.now();
            
            // Métriques mémoire
            const memoryUsage = process.memoryUsage();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryPercent = (usedMemory / totalMemory) * 100;

            this.metrics.system.memoryUsage.push({
                timestamp,
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss,
                systemUsed: usedMemory,
                systemTotal: totalMemory,
                percentage: memoryPercent
            });

            // Métriques CPU (approximation)
            const cpuUsage = process.cpuUsage();
            this.metrics.system.cpuUsage.push({
                timestamp,
                user: cpuUsage.user,
                system: cpuUsage.system,
                loadAverage: os.loadavg()
            });

            // Métriques disque
            await this.collectDiskMetrics(timestamp);

            // Uptime
            this.metrics.system.uptime = Date.now() - this.startTime;

            // Limiter la taille des tableaux
            this.limitArraySize(this.metrics.system.memoryUsage, 50);
            this.limitArraySize(this.metrics.system.cpuUsage, 50);
            this.limitArraySize(this.metrics.system.diskUsage, 50);

        } catch (error) {
            this.trackSystemError('metrics_collection', error);
        }
    }

    /**
     * Collecter les métriques disque
     */
    async collectDiskMetrics(timestamp) {
        try {
            const projectRoot = path.join(__dirname, '../..');
            const stats = await fs.stat(projectRoot);
            
            // Approximation de l'utilisation disque (nécessiterait une lib spécifique pour plus de précision)
            this.metrics.system.diskUsage.push({
                timestamp,
                path: projectRoot,
                // Note: Pour des métriques disque précises, utiliser 'diskusage' ou 'node-disk-info'
                available: os.freemem(), // Approximation
                used: os.totalmem() - os.freemem() // Approximation
            });
        } catch (error) {
            // Ignorer les erreurs de métriques disque
        }
    }

    /**
     * Limiter la taille d'un tableau
     */
    limitArraySize(array, maxSize) {
        while (array.length > maxSize) {
            array.shift();
        }
    }

    /**
     * Vérifier les alertes
     */
    async checkAlerts() {
        const latest = this.getLatestMetrics();
        
        if (latest) {
            // Alerte mémoire
            if (latest.system.memoryUsage && latest.system.memoryUsage.percentage > this.alerts.memory.threshold) {
                if (!this.alerts.memory.active) {
                    this.alerts.memory.active = true;
                    console.warn(`⚠️ ALERTE MÉMOIRE: ${latest.system.memoryUsage.percentage.toFixed(1)}% utilisée`);
                    await this.handleMemoryAlert();
                }
            } else {
                this.alerts.memory.active = false;
            }

            // Alerte erreurs
            const totalErrors = this.metrics.whatsapp.errors.length + 
                               this.metrics.firebase.errors.length + 
                               this.metrics.system.errors.length;
            
            if (totalErrors > this.alerts.errors.threshold) {
                if (!this.alerts.errors.active) {
                    this.alerts.errors.active = true;
                    console.warn(`⚠️ ALERTE ERREURS: ${totalErrors} erreurs détectées`);
                }
            } else {
                this.alerts.errors.active = false;
            }
        }
    }

    /**
     * Gérer l'alerte mémoire
     */
    async handleMemoryAlert() {
        try {
            // Forcer le garbage collection si disponible
            if (global.gc) {
                global.gc();
                console.log('🧹 Garbage collection forcé');
            }

            // Notifier les autres services
            process.emit('memoryAlert', {
                usage: this.getLatestMetrics().system.memoryUsage,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('❌ Erreur gestion alerte mémoire:', error.message);
        }
    }

    /**
     * Tracker un événement WhatsApp
     */
    trackWhatsAppEvent(event, data = {}) {
        const timestamp = Date.now();
        
        switch (event) {
            case 'connection_attempt':
                this.metrics.whatsapp.connectionAttempts++;
                break;
                
            case 'connection_success':
                this.metrics.whatsapp.successfulConnections++;
                this.metrics.whatsapp.lastConnection = timestamp;
                this.metrics.whatsapp.status = 'connected';
                break;
                
            case 'qr_generated':
                this.metrics.whatsapp.qrCodesGenerated++;
                this.metrics.whatsapp.lastQRGenerated = timestamp;
                this.metrics.whatsapp.status = 'qr_ready';
                break;
                
            case 'message_sent':
                this.metrics.whatsapp.messagessSent++;
                break;
                
            case 'message_failed':
                this.metrics.whatsapp.messagesFailed++;
                break;
                
            case 'disconnected':
                this.metrics.whatsapp.status = 'disconnected';
                break;
                
            case 'error':
                this.trackWhatsAppError(data.error || 'Erreur inconnue', data);
                break;
        }

        console.log(`📊 WhatsApp event: ${event}`, data.message || '');
    }

    /**
     * Tracker une erreur WhatsApp
     */
    trackWhatsAppError(error, context = {}) {
        const errorInfo = {
            timestamp: Date.now(),
            error: error.toString(),
            context,
            stack: error.stack || null
        };

        this.metrics.whatsapp.errors.push(errorInfo);
        this.limitArraySize(this.metrics.whatsapp.errors, 20);
        
        console.error('❌ WhatsApp Error tracked:', error);
    }

    /**
     * Tracker un événement Firebase
     */
    trackFirebaseEvent(event, data = {}) {
        const timestamp = Date.now();
        
        switch (event) {
            case 'auth_attempt':
                this.metrics.firebase.authAttempts++;
                break;
                
            case 'auth_success':
                this.metrics.firebase.successfulAuths++;
                this.metrics.firebase.lastAuthTime = timestamp;
                break;
                
            case 'auth_failed':
                this.metrics.firebase.failedAuths++;
                break;
                
            case 'token_verified':
                this.metrics.firebase.tokenVerifications++;
                break;
                
            case 'error':
                this.trackFirebaseError(data.error || 'Erreur Firebase inconnue', data);
                break;
        }

        console.log(`🔥 Firebase event: ${event}`, data.message || '');
    }

    /**
     * Tracker une erreur Firebase
     */
    trackFirebaseError(error, context = {}) {
        const errorInfo = {
            timestamp: Date.now(),
            error: error.toString(),
            context,
            stack: error.stack || null
        };

        this.metrics.firebase.errors.push(errorInfo);
        this.limitArraySize(this.metrics.firebase.errors, 20);
        
        console.error('🔥 Firebase Error tracked:', error);
    }

    /**
     * Tracker une erreur système
     */
    trackSystemError(type, error, context = {}) {
        const errorInfo = {
            timestamp: Date.now(),
            type,
            error: error.toString(),
            context,
            stack: error.stack || null
        };

        this.metrics.system.errors.push(errorInfo);
        this.limitArraySize(this.metrics.system.errors, 20);
        
        console.error(`⚙️ System Error tracked (${type}):`, error);
    }

    /**
     * Obtenir les métriques complètes
     */
    getMetrics() {
        return {
            ...this.metrics,
            alerts: this.alerts,
            monitoring: {
                isActive: !!this.monitoringInterval,
                startTime: this.startTime,
                uptime: Date.now() - this.startTime
            },
            timestamp: Date.now()
        };
    }

    /**
     * Obtenir les dernières métriques
     */
    getLatestMetrics() {
        const latest = {};
        
        // Dernières métriques système
        if (this.metrics.system.memoryUsage.length > 0) {
            latest.system = {
                memoryUsage: this.metrics.system.memoryUsage[this.metrics.system.memoryUsage.length - 1],
                cpuUsage: this.metrics.system.cpuUsage[this.metrics.system.cpuUsage.length - 1]
            };
        }
        
        return latest;
    }

    /**
     * Vérifier l'état de santé du système
     */
    async checkSystemHealth() {
        const metrics = this.getMetrics();
        const issues = [];
        let healthScore = 100;

        // Vérifier la mémoire
        const latestMemory = this.getLatestMetrics()?.system?.memoryUsage;
        if (latestMemory && latestMemory.percentage > 80) {
            issues.push(`Mémoire élevée: ${latestMemory.percentage.toFixed(1)}%`);
            healthScore -= 20;
        }

        // Vérifier les erreurs WhatsApp
        if (metrics.whatsapp.errors.length > 5) {
            issues.push(`Erreurs WhatsApp: ${metrics.whatsapp.errors.length}`);
            healthScore -= 15;
        }

        // Vérifier les erreurs Firebase
        if (metrics.firebase.errors.length > 3) {
            issues.push(`Erreurs Firebase: ${metrics.firebase.errors.length}`);
            healthScore -= 10;
        }

        // Vérifier la connectivité WhatsApp
        if (metrics.whatsapp.status === 'disconnected') {
            issues.push('WhatsApp déconnecté');
            healthScore -= 25;
        }

        const isHealthy = healthScore >= 70;
        
        return {
            healthy: isHealthy,
            score: Math.max(0, healthScore),
            issues,
            metrics: this.getMetrics(),
            recommendations: this.getRecommendations(issues),
            timestamp: Date.now()
        };
    }

    /**
     * Obtenir des recommandations basées sur les problèmes détectés
     */
    getRecommendations(issues) {
        const recommendations = [];
        
        if (issues.some(issue => issue.includes('Mémoire'))) {
            recommendations.push('Redémarrer l\'application pour libérer la mémoire');
            recommendations.push('Vérifier les fuites mémoire potentielles');
        }
        
        if (issues.some(issue => issue.includes('WhatsApp'))) {
            recommendations.push('Réinitialiser la session WhatsApp');
            recommendations.push('Vérifier la connexion Internet');
        }
        
        if (issues.some(issue => issue.includes('Firebase'))) {
            recommendations.push('Vérifier les credentials Firebase');
            recommendations.push('Contrôler les quotas Firebase');
        }
        
        return recommendations;
    }

    /**
     * Nettoyer les anciennes métriques
     */
    cleanupOldMetrics() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        
        // Nettoyer les erreurs anciennes
        this.metrics.whatsapp.errors = this.metrics.whatsapp.errors.filter(
            error => (now - error.timestamp) < maxAge
        );
        
        this.metrics.firebase.errors = this.metrics.firebase.errors.filter(
            error => (now - error.timestamp) < maxAge
        );
        
        this.metrics.system.errors = this.metrics.system.errors.filter(
            error => (now - error.timestamp) < maxAge
        );
    }

    /**
     * Exporter les métriques vers un fichier
     */
    async exportMetrics(filePath) {
        try {
            const metrics = this.getMetrics();
            const exportData = {
                exportDate: new Date().toISOString(),
                ...metrics
            };
            
            await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
            console.log(`✅ Métriques exportées vers: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur export métriques:', error.message);
            return false;
        }
    }

    /**
     * Réinitialiser toutes les métriques
     */
    reset() {
        const timestamp = Date.now();
        
        this.metrics = {
            whatsapp: {
                connectionAttempts: 0,
                successfulConnections: 0,
                qrCodesGenerated: 0,
                messagessSent: 0,
                messagesFailed: 0,
                lastQRGenerated: null,
                lastConnection: null,
                sessionDuration: 0,
                errors: [],
                status: 'disconnected'
            },
            firebase: {
                authAttempts: 0,
                successfulAuths: 0,
                failedAuths: 0,
                lastAuthTime: null,
                tokenVerifications: 0,
                errors: []
            },
            system: {
                memoryUsage: [],
                cpuUsage: [],
                diskUsage: [],
                activeConnections: 0,
                uptime: 0,
                errors: []
            },
            database: {
                connections: 0,
                queries: 0,
                errors: [],
                avgResponseTime: 0,
                lastOptimization: null
            }
        };
        
        this.startTime = timestamp;
        console.log('✅ Métriques réinitialisées');
    }
}

// Instance singleton
const monitoringService = new MonitoringService();

// Démarrer le monitoring automatique
monitoringService.startMonitoring();

module.exports = monitoringService;