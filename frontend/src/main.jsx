import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/dashboard.css';

// Correctifs de compatibilité navigateur
(function() {
  'use strict';
  
  console.log('🔧 Application des correctifs de compatibilité...');
  
  // Polyfill pour documentPictureInPicture
  if (typeof documentPictureInPicture === 'undefined') {
    console.log('📱 Ajout du polyfill documentPictureInPicture');
    window.documentPictureInPicture = {
      requestWindow: function() {
        return Promise.reject(new Error('Picture-in-Picture non supporté'));
      }
    };
  }
  
  // Gestion des erreurs MetaMask
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filtrer les erreurs MetaMask non critiques
    if (message.includes('MetaMask') && 
        (message.includes('extension not found') || 
         message.includes('Failed to connect'))) {
      console.warn('⚠️ Erreur MetaMask ignorée (non critique):', message);
      return;
    }
    
    // Filtrer les erreurs de Picture-in-Picture
    if (message.includes('documentPictureInPicture')) {
      console.warn('⚠️ Erreur Picture-in-Picture ignorée:', message);
      return;
    }
    
    // Appeler la fonction originale pour les autres erreurs
    originalConsoleError.apply(console, args);
  };
  
  // Amélioration de la gestion des erreurs de réseau
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message) {
      const message = event.error.message;
      
      // Ignorer les erreurs MetaMask non critiques
      if (message.includes('MetaMask') && 
          (message.includes('extension not found') || 
           message.includes('Failed to connect'))) {
        event.preventDefault();
        console.warn('⚠️ Erreur MetaMask interceptée:', message);
        return false;
      }
      
      // Ignorer les erreurs de Picture-in-Picture
      if (message.includes('documentPictureInPicture')) {
        event.preventDefault();
        console.warn('⚠️ Erreur Picture-in-Picture interceptée:', message);
        return false;
      }
    }
  });
  
  // Amélioration de la gestion des promesses rejetées
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    
    // Ignorer les erreurs MetaMask non critiques
    if (reason && reason.message && 
        reason.message.includes('MetaMask') && 
        (reason.message.includes('extension not found') || 
         reason.message.includes('Failed to connect'))) {
      event.preventDefault();
      console.warn('⚠️ Promesse MetaMask rejetée interceptée:', reason.message);
      return false;
    }
    
    // Ignorer les erreurs de Picture-in-Picture
    if (reason && reason.message && reason.message.includes('documentPictureInPicture')) {
      event.preventDefault();
      console.warn('⚠️ Promesse Picture-in-Picture rejetée interceptée:', reason.message);
      return false;
    }
  });
  
  console.log('✅ Correctifs de compatibilité appliqués avec succès');
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
