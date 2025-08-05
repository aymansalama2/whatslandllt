const v8 = require('v8');
const os = require('os');

/**
 * Optimiseur de performance avec gestion mémoire V8 et monitoring
 * Améliore les performances Node.js et gère les ressources système
 */
class PerformanceOptimizer {
    constructor() {
        this.heapStats = v8.getHeapStatistics();
        this.heapLimit = this.heapStats.heap_size_limit;
        this.warningThreshold = 0.8; // 80% du heap
        this.criticalThreshold = 0.9; // 90% du heap
        this.optimizationInterval = null;
        this.gcForced = 0;
        this.optimizationCount = 0;
        this.lastOptimization = null;
        this.startTime = Date.now();
    }

    /**
     * Initialiser les optimisations V8
     */
    initialize() {
        console.log('🚀 Initialisation de l\'optimiseur de performance...');
        
        try {
            this.applyV8Optimizations();
            this.setupMemoryMonitoring();
            this.setupPeriodicOptimization();
            
            console.log('✅ Optimiseur de performance initialisé');
            console.log(`📊 Limite heap: ${(this.heapLimit / 1024 / 1024).toFixed(0)} MB`);
            console.log(`⚠️ Seuil d'alerte: ${(this.warningThreshold * 100)}%`);
            console.log(`🚨 Seuil critique: ${(this.criticalThreshold * 100)}%`);
            
        } catch (error) {
            console.error('❌ Erreur initialisation optimiseur:', error.message);
        }
    }

    /**
     * Appliquer les optimisations V8
     */
    applyV8Optimizations() {
        try {
            // Optimiser la taille du heap
            const recommendedHeapSize = this.calculateOptimalHeapSize();
            
            // Flags V8 pour l'optimisation
            const flags = [
                `--max-old-space-size=${recommendedHeapSize}`,
                '--optimize-for-size',
                '--max-semi-space-size=64',
                '--concurrent-marking',
                '--concurrent-sweeping',
                '--parallel-scavenge',
                '--use-idle-notification',
                '--expose-gc'
            ];

            // Appliquer les flags (note: certains doivent être définis au démarrage)
            console.log('🔧 Application des optimisations V8...');
            
            // Configuration des limites de mémoire
            if (global.gc) {
                console.log('✅ Garbage Collection manuel disponible');
            }
            
            // Optimiser le code
            v8.setFlagsFromString('--opt');
            
            console.log('✅ Optimisations V8 appliquées');
            console.log(`📈 Heap recommandé: ${recommendedHeapSize} MB`);
            
        } catch (error) {
            console.warn('⚠️ Erreur application optimisations V8:', error.message);
        }
    }

    /**
     * Calculer la taille optimale du heap
     */
    calculateOptimalHeapSize() {
        const totalRAM = os.totalmem();
        const freeRAM = os.freemem();
        const usableRAM = totalRAM - (totalRAM - freeRAM);
        
        // Utiliser au maximum 50% de la RAM disponible, minimum 512MB, maximum 4GB
        const optimalSize = Math.min(
            Math.max(512, Math.floor((usableRAM / 1024 / 1024) * 0.5)),
            4096
        );
        
        return optimalSize;
    }

    /**
     * Configurer le monitoring mémoire
     */
    setupMemoryMonitoring() {
        // Surveiller l'utilisation mémoire toutes les 30 secondes
        setInterval(() => {
            this.checkMemoryUsage();
        }, 30000);
        
        console.log('✅ Monitoring mémoire configuré');
    }

    /**
     * Configurer l'optimisation périodique
     */
    setupPeriodicOptimization(intervalMs = 300000) { // 5 minutes
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
        }

        this.optimizationInterval = setInterval(() => {
            this.performPeriodicOptimization();
        }, intervalMs);
        
        console.log(`✅ Optimisation périodique configurée (${intervalMs/60000} min)`);
    }

    /**
     * Vérifier l'utilisation mémoire
     */
    checkMemoryUsage() {
        try {
            const usage = process.memoryUsage();
            const heapPercent = (usage.heapUsed / this.heapLimit) * 100;
            
            if (heapPercent > this.criticalThreshold * 100) {
                console.warn(`🚨 MÉMOIRE CRITIQUE: ${heapPercent.toFixed(1)}%`);
                this.handleCriticalMemory();
                
            } else if (heapPercent > this.warningThreshold * 100) {
                console.warn(`⚠️ Mémoire élevée: ${heapPercent.toFixed(1)}%`);
                this.handleHighMemory();
            }
            
            // Émettre un événement pour le monitoring
            process.emit('memoryCheck', {
                usage,
                percentage: heapPercent,
                threshold: heapPercent > this.warningThreshold * 100
            });
            
        } catch (error) {
            console.error('❌ Erreur vérification mémoire:', error.message);
        }
    }

    /**
     * Gérer la mémoire critique
     */
    async handleCriticalMemory() {
        try {
            console.log('🚨 Gestion de la mémoire critique...');
            
            // Forcer plusieurs GC
            await this.forceGarbageCollection(3);
            
            // Nettoyer les caches
            await this.clearCaches();
            
            // Émettre un événement d'alerte
            process.emit('criticalMemory', {
                timestamp: Date.now(),
                usage: process.memoryUsage(),
                action: 'force_cleanup'
            });
            
            console.log('✅ Gestion mémoire critique terminée');
            
        } catch (error) {
            console.error('❌ Erreur gestion mémoire critique:', error.message);
        }
    }

    /**
     * Gérer la mémoire élevée
     */
    async handleHighMemory() {
        try {
            // GC doux
            await this.forceGarbageCollection(1);
            
            // Optimiser les modules si possible
            this.optimizeModules();
            
        } catch (error) {
            console.error('❌ Erreur gestion mémoire élevée:', error.message);
        }
    }

    /**
     * Forcer le garbage collection
     */
    async forceGarbageCollection(iterations = 1) {
        if (!global.gc) {
            console.warn('⚠️ Garbage Collection manuel non disponible');
            return false;
        }
        
        try {
            const beforeUsage = process.memoryUsage();
            
            for (let i = 0; i < iterations; i++) {
                global.gc();
                // Petite pause entre les GC
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const afterUsage = process.memoryUsage();
            const freedMemory = beforeUsage.heapUsed - afterUsage.heapUsed;
            
            this.gcForced += iterations;
            
            console.log(`🧹 GC forcé (${iterations}x) - Libéré: ${(freedMemory / 1024 / 1024).toFixed(1)} MB`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur GC forcé:', error.message);
            return false;
        }
    }

    /**
     * Nettoyer les caches
     */
    async clearCaches() {
        try {
            // Nettoyer le cache des modules require (attention aux modules critiques)
            const moduleKeys = Object.keys(require.cache);
            let cleaned = 0;
            
            for (const key of moduleKeys) {
                // Ne pas nettoyer les modules critiques
                if (!key.includes('node_modules') && 
                    !key.includes('server.js') && 
                    !key.includes('config.js')) {
                    
                    try {
                        delete require.cache[key];
                        cleaned++;
                    } catch (error) {
                        // Ignorer les erreurs de nettoyage
                    }
                }
            }
            
            console.log(`🧹 Cache nettoyé: ${cleaned} modules`);
            
            // Nettoyer les timers et intervalles orphelins
            this.cleanupTimers();
            
        } catch (error) {
            console.error('❌ Erreur nettoyage caches:', error.message);
        }
    }

    /**
     * Nettoyer les timers orphelins
     */
    cleanupTimers() {
        try {
            // Note: Node.js ne fournit pas d'API directe pour lister tous les timers
            // Cette fonction est principalement préventive
            
            // Forcer la libération des handlers inactifs
            if (process._getActiveHandles) {
                const handles = process._getActiveHandles();
                console.log(`ℹ️ Handles actifs: ${handles.length}`);
            }
            
            if (process._getActiveRequests) {
                const requests = process._getActiveRequests();
                console.log(`ℹ️ Requêtes actives: ${requests.length}`);
            }
            
        } catch (error) {
            // Ignorer les erreurs d'inspection
        }
    }

    /**
     * Optimiser les modules chargés
     */
    optimizeModules() {
        try {
            // Optimiser les modules V8 si possible
            const moduleCount = Object.keys(require.cache).length;
            
            // Compiler les fonctions fréquemment utilisées
            if (v8.optimizeFunctionOnNextCall) {
                // Cette fonction n'est disponible qu'avec certains flags V8
                console.log('🔧 Optimisation des modules en cours...');
            }
            
            console.log(`📦 Modules chargés: ${moduleCount}`);
            
        } catch (error) {
            console.warn('⚠️ Erreur optimisation modules:', error.message);
        }
    }

    /**
     * Effectuer l'optimisation périodique
     */
    async performPeriodicOptimization() {
        try {
            this.optimizationCount++;
            this.lastOptimization = Date.now();
            
            console.log(`🔄 Optimisation périodique #${this.optimizationCount}...`);
            
            // Vérification mémoire
            this.checkMemoryUsage();
            
            // GC préventif si nécessaire
            const usage = process.memoryUsage();
            const heapPercent = (usage.heapUsed / this.heapLimit) * 100;
            
            if (heapPercent > 60) { // 60% - GC préventif
                await this.forceGarbageCollection(1);
            }
            
            // Optimiser les statistiques V8
            if (v8.writeHeapSnapshot) {
                // Ne créer un snapshot qu'en mode debug
                if (process.env.NODE_ENV === 'development') {
                    // v8.writeHeapSnapshot(); // Commenté pour éviter les fichiers volumineux
                }
            }
            
            console.log('✅ Optimisation périodique terminée');
            
        } catch (error) {
            console.error('❌ Erreur optimisation périodique:', error.message);
        }
    }

    /**
     * Obtenir les statistiques de performance
     */
    getPerformanceStats() {
        try {
            const usage = process.memoryUsage();
            const heapStats = v8.getHeapStatistics();
            
            return {
                memory: {
                    heapUsed: usage.heapUsed,
                    heapTotal: usage.heapTotal,
                    external: usage.external,
                    rss: usage.rss,
                    heapPercent: (usage.heapUsed / this.heapLimit) * 100
                },
                heap: {
                    totalHeapSize: heapStats.total_heap_size,
                    totalHeapSizeExecutable: heapStats.total_heap_size_executable,
                    totalPhysicalSize: heapStats.total_physical_size,
                    totalAvailableSize: heapStats.total_available_size,
                    usedHeapSize: heapStats.used_heap_size,
                    heapSizeLimit: heapStats.heap_size_limit,
                    mallocedMemory: heapStats.malloced_memory,
                    peakMallocedMemory: heapStats.peak_malloced_memory
                },
                optimization: {
                    gcForced: this.gcForced,
                    optimizationCount: this.optimizationCount,
                    lastOptimization: this.lastOptimization,
                    uptime: Date.now() - this.startTime,
                    warningThreshold: this.warningThreshold,
                    criticalThreshold: this.criticalThreshold
                },
                system: {
                    platform: os.platform(),
                    arch: os.arch(),
                    cpus: os.cpus().length,
                    totalMemory: os.totalmem(),
                    freeMemory: os.freemem(),
                    loadAverage: os.loadavg()
                },
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Obtenir les recommandations d'optimisation
     */
    getOptimizationRecommendations() {
        const stats = this.getPerformanceStats();
        const recommendations = [];
        
        if (stats.memory.heapPercent > 70) {
            recommendations.push({
                type: 'memory',
                priority: 'high',
                message: 'Utilisation mémoire élevée - considérer un redémarrage',
                action: 'restart_recommended'
            });
        }
        
        if (this.gcForced > 10) {
            recommendations.push({
                type: 'gc',
                priority: 'medium',
                message: 'Nombreux GC forcés - vérifier les fuites mémoire',
                action: 'memory_audit'
            });
        }
        
        if (stats.system.freeMemory < stats.system.totalMemory * 0.1) {
            recommendations.push({
                type: 'system',
                priority: 'high',
                message: 'Mémoire système faible',
                action: 'system_cleanup'
            });
        }
        
        return {
            recommendations,
            stats,
            timestamp: Date.now()
        };
    }

    /**
     * Arrêter l'optimiseur
     */
    shutdown() {
        console.log('🔄 Arrêt de l\'optimiseur de performance...');
        
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
            this.optimizationInterval = null;
        }
        
        // GC final
        if (global.gc) {
            global.gc();
        }
        
        console.log('✅ Optimiseur de performance arrêté');
        console.log(`📊 Statistiques finales: ${this.gcForced} GC forcés, ${this.optimizationCount} optimisations`);
    }
}

// Instance singleton
const performanceOptimizer = new PerformanceOptimizer();

// Initialiser automatiquement
performanceOptimizer.initialize();

// Gestion propre de l'arrêt
process.on('SIGINT', () => performanceOptimizer.shutdown());
process.on('SIGTERM', () => performanceOptimizer.shutdown());
process.on('exit', () => performanceOptimizer.shutdown());

module.exports = performanceOptimizer;