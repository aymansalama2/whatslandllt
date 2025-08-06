/**
 * Service de vérification du statut du backend
 * Permet de gérer les modes dégradés et d'informer l'utilisateur
 */

class BackendStatusService {
  constructor() {
    this.isBackendAvailable = true;
    this.lastCheck = null;
    this.checkInterval = null;
    this.listeners = new Set();
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Démarrer la surveillance du backend
   */
  startMonitoring(apiService, intervalMs = 30000) {
    this.apiService = apiService;
    
    // Vérification initiale
    this.checkBackendStatus();
    
    // Vérifications périodiques
    this.checkInterval = setInterval(() => {
      this.checkBackendStatus();
    }, intervalMs);
  }

  /**
   * Arrêter la surveillance
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Vérifier le statut du backend
   */
  async checkBackendStatus() {
    try {
      const result = await this.apiService.testConnection();
      
      if (result.success) {
        if (!this.isBackendAvailable) {
          console.log('✅ Backend de nouveau disponible');
          this.isBackendAvailable = true;
          this.retryCount = 0;
          this.notifyListeners('backend-available');
        }
      } else {
        this.handleBackendUnavailable();
      }
      
      this.lastCheck = new Date();
    } catch (error) {
      this.handleBackendUnavailable();
    }
  }

  /**
   * Gérer l'indisponibilité du backend
   */
  handleBackendUnavailable() {
    this.retryCount++;
    
    if (this.isBackendAvailable) {
      console.warn('⚠️ Backend temporairement indisponible');
      this.isBackendAvailable = false;
      this.notifyListeners('backend-unavailable');
    }

    // Si on dépasse le nombre de tentatives, on considère le backend comme vraiment indisponible
    if (this.retryCount >= this.maxRetries) {
      console.error('❌ Backend indisponible après plusieurs tentatives');
      this.notifyListeners('backend-failed');
    }
  }

  /**
   * Ajouter un écouteur de changement de statut
   */
  addStatusListener(callback) {
    this.listeners.add(callback);
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifier tous les écouteurs
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback({
          status,
          isAvailable: this.isBackendAvailable,
          lastCheck: this.lastCheck,
          retryCount: this.retryCount
        });
      } catch (error) {
        console.error('Erreur lors de la notification de statut:', error);
      }
    });
  }

  /**
   * Obtenir le statut actuel
   */
  getStatus() {
    return {
      isAvailable: this.isBackendAvailable,
      lastCheck: this.lastCheck,
      retryCount: this.retryCount,
      isMonitoring: !!this.checkInterval
    };
  }

  /**
   * Forcer une vérification
   */
  async forceCheck() {
    await this.checkBackendStatus();
    return this.getStatus();
  }
}

// Instance singleton
const backendStatusService = new BackendStatusService();

export default backendStatusService;