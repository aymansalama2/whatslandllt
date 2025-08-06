import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase/config';
import apiService from '../services/apiService';
import frontendMonitoringService from '../services/monitoringService';
import { UserProvider } from './UserContext';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tokenRefreshAttempts, setTokenRefreshAttempts] = useState(0);

  /**
   * Gérer le rafraîchissement automatique des tokens
   */
  const handleTokenRefresh = useCallback(async (user) => {
    if (!user) return null;

    try {
      setTokenRefreshAttempts(prev => prev + 1);
      
      // Forcer le rafraîchissement du token
      const token = await user.getIdToken(true);
      
      // Mettre à jour le token dans le service API
      apiService.setAuthToken(token);
      
      // Vérifier le token côté backend
      await apiService.verifyFirebaseToken(token);
      
      // Émettre un événement pour notifier que le token est rafraîchi
      window.dispatchEvent(new CustomEvent('token-refreshed', { 
        detail: { token, user } 
      }));
      
      setTokenRefreshAttempts(0);
      setAuthError(null);
      
      console.log('✅ Token Firebase rafraîchi avec succès');
      return token;
      
    } catch (error) {
      console.error('❌ Erreur rafraîchissement token:', error);
      setAuthError('Erreur de rafraîchissement de session');
      
      // Si on a trop de tentatives, déconnecter l'utilisateur
      if (tokenRefreshAttempts >= 3) {
        console.warn('⚠️ Trop de tentatives de rafraîchissement, déconnexion...');
        await logout();
      }
      
      throw error;
    }
  }, [tokenRefreshAttempts]);

  /**
   * Inscription avec validation et profil
   */
  const signup = async (email, password, additionalInfo = {}) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      // Créer le compte
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le profil si des infos supplémentaires sont fournies
      if (additionalInfo.displayName) {
        await updateProfile(result.user, {
          displayName: additionalInfo.displayName
        });
      }
      
      // Tracker l'événement
      frontendMonitoringService.trackEvent('user_signup', {
        email: email,
        hasDisplayName: !!additionalInfo.displayName
      });
      
      console.log('✅ Inscription réussie:', email);
      return result;
      
    } catch (error) {
      const formattedError = formatAuthError(error);
      setAuthError(formattedError);
      
      frontendMonitoringService.trackError('auth', error, {
        action: 'signup',
        email: email
      });
      
      throw formattedError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion avec gestion d'erreurs améliorée
   */
  const login = async (email, password) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtenir le token immédiatement
      const token = await result.user.getIdToken();
      apiService.setAuthToken(token);
      
      // Vérifier avec le backend (mode graceful)
      try {
        await apiService.verifyFirebaseToken(token);
        console.log('✅ Token vérifié avec le backend lors du login');
      } catch (verifyError) {
        console.warn('⚠️ Vérification backend échouée lors du login, mais authentification Firebase réussie:', verifyError.message);
        
        // Ne pas échouer le login si c'est juste un problème de backend
        if (verifyError.status === 503) {
          console.log('🔄 Backend indisponible, login en mode local réussi');
        } else {
          // Pour d'autres erreurs, on peut choisir de continuer ou d'échouer
          console.warn('⚠️ Erreur de vérification non-503, mais on continue:', verifyError.message);
        }
      }
      
      // Tracker l'événement
      frontendMonitoringService.trackEvent('user_login', {
        email: email,
        loginMethod: 'email_password'
      });
      
      console.log('✅ Connexion réussie:', email);
      return result;
      
    } catch (error) {
      const formattedError = formatAuthError(error);
      setAuthError(formattedError);
      
      frontendMonitoringService.trackError('auth', error, {
        action: 'login',
        email: email
      });
      
      throw formattedError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion propre
   */
  const logout = async () => {
    try {
      setLoading(true);
      
      // Nettoyer le token de l'API service
      apiService.clearAuthToken();
      
      // Déconnexion Firebase
      await signOut(auth);
      
      // Tracker l'événement
      frontendMonitoringService.trackEvent('user_logout');
      
      console.log('✅ Déconnexion réussie');
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      setAuthError('Erreur lors de la déconnexion');
      
      frontendMonitoringService.trackError('auth', error, {
        action: 'logout'
      });
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réinitialisation de mot de passe
   */
  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      
      await sendPasswordResetEmail(auth, email);
      
      frontendMonitoringService.trackEvent('password_reset_requested', {
        email: email
      });
      
      console.log('✅ Email de réinitialisation envoyé à:', email);
      
    } catch (error) {
      const formattedError = formatAuthError(error);
      setAuthError(formattedError);
      
      frontendMonitoringService.trackError('auth', error, {
        action: 'password_reset',
        email: email
      });
      
      throw formattedError;
    }
  };

  /**
   * Réauthentification pour actions sensibles
   */
  const reauthenticate = async (currentPassword) => {
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email, 
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      console.log('✅ Réauthentification réussie');
      
    } catch (error) {
      const formattedError = formatAuthError(error);
      frontendMonitoringService.trackError('auth', error, {
        action: 'reauthenticate'
      });
      throw formattedError;
    }
  };

  /**
   * Mettre à jour le profil utilisateur
   */
  const updateUserProfile = async (updates) => {
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      await updateProfile(currentUser, updates);
      
      frontendMonitoringService.trackEvent('profile_updated', {
        updatedFields: Object.keys(updates)
      });
      
      console.log('✅ Profil mis à jour');
      
    } catch (error) {
      frontendMonitoringService.trackError('auth', error, {
        action: 'update_profile'
      });
      throw formatAuthError(error);
    }
  };

  /**
   * Obtenir un token frais
   */
  const getFreshToken = async () => {
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    return handleTokenRefresh(currentUser);
  };

  /**
   * Vérifier si l'utilisateur est admin
   */
  const isAdmin = useCallback(() => {
    if (!currentUser?.email) return false;
    
    const adminEmails = ['houssnijob@gmail.com', 'ayman@gmail.com'];
    return adminEmails.includes(currentUser.email);
  }, [currentUser]);

  /**
   * Obtenir les informations utilisateur étendues
   */
  const getUserInfo = useCallback(() => {
    if (!currentUser) return null;

    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      emailVerified: currentUser.emailVerified,
      isAdmin: isAdmin(),
      lastSignInTime: currentUser.metadata?.lastSignInTime,
      creationTime: currentUser.metadata?.creationTime
    };
  }, [currentUser, isAdmin]);

  // Écouteurs d'événements
  useEffect(() => {
    // Statut de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Demande de rafraîchissement de token
    const handleTokenRefreshNeeded = () => {
      if (currentUser) {
        handleTokenRefresh(currentUser);
      }
    };
    
    window.addEventListener('token-refresh-needed', handleTokenRefreshNeeded);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('token-refresh-needed', handleTokenRefreshNeeded);
    };
  }, [currentUser, handleTokenRefresh]);

  // Écouteur principal d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          // Obtenir et configurer le token
          const token = await user.getIdToken();
          apiService.setAuthToken(token);
          
          // Vérifier avec le backend (mode graceful)
          try {
            await apiService.verifyFirebaseToken(token);
            console.log('✅ Token vérifié avec le backend');
          } catch (verifyError) {
            console.warn('⚠️ Vérification token backend échouée, mode dégradé activé:', verifyError.message);
            
            // En mode dégradé, on continue sans la vérification backend
            // L'authentification Firebase reste valide
            if (verifyError.status === 503) {
              console.log('🔄 Backend temporairement indisponible, utilisation de l\'authentification locale');
            }
          }
          
          console.log('✅ Utilisateur authentifié:', user.email);
          
          frontendMonitoringService.trackEvent('auth_state_changed', {
            authenticated: true,
            email: user.email
          });
        } else {
          // Nettoyer le token
          apiService.clearAuthToken();
          
          console.log('ℹ️ Utilisateur non authentifié');
          
          frontendMonitoringService.trackEvent('auth_state_changed', {
            authenticated: false
          });
        }
        
      } catch (error) {
        console.error('❌ Erreur dans onAuthStateChanged:', error);
        setAuthError('Erreur d\'authentification');
        
        frontendMonitoringService.trackError('auth', error, {
          action: 'auth_state_change'
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [handleTokenRefresh]);

  const value = {
    // État
    currentUser,
    loading,
    authError,
    isOnline,
    
    // Actions
    signup,
    login,
    logout,
    resetPassword,
    reauthenticate,
    updateUserProfile,
    getFreshToken,
    
    // Utilitaires
    isAdmin,
    getUserInfo,
    
    // Contrôle des erreurs
    clearError: () => setAuthError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && (
        <UserProvider currentUser={currentUser}>
          {children}
        </UserProvider>
      )}
    </AuthContext.Provider>
  );
}

/**
 * Formater les erreurs d'authentification
 */
function formatAuthError(error) {
  const errorMessages = {
    'auth/user-not-found': 'Aucun compte trouvé avec cet email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
    'auth/invalid-email': 'Adresse email invalide',
    'auth/too-many-requests': 'Trop de tentatives, veuillez réessayer plus tard',
    'auth/network-request-failed': 'Erreur de connexion réseau',
    'auth/requires-recent-login': 'Cette action nécessite une reconnexion récente'
  };

  const message = errorMessages[error.code] || error.message || 'Erreur d\'authentification';
  
  return {
    code: error.code,
    message,
    originalError: error
  };
} 