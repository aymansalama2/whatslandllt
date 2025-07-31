// Ce script peut être ajouté au frontend pour ignorer l'erreur documentPictureInPicture
// À ajouter dans le fichier main.jsx ou index.js du frontend

// Intercepter et ignorer l'erreur documentPictureInPicture
const originalConsoleError = console.error;
console.error = function(...args) {
  // Ignorer l'erreur spécifique de MetaMask
  if (args.length > 0 && 
      typeof args[0] === 'object' && 
      args[0] instanceof Error && 
      args[0].message && 
      args[0].message.includes('documentPictureInPicture')) {
    // Erreur ignorée silencieusement
    return;
  }
  
  // Pour toutes les autres erreurs, utiliser le comportement normal
  originalConsoleError.apply(console, args);
};

// Note: Cette solution est optionnelle et n'est nécessaire que si vous voulez
// supprimer l'erreur documentPictureInPicture de la console du navigateur.
// Cette erreur provient de MetaMask et n'affecte pas le fonctionnement de l'application.