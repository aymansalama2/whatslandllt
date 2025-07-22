import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`}`}`}`;

export default function MessageSender({ whatsappReady }) {
  const { userData, isProfileComplete } = useUser();
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [mediaFile, setMediaFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [numbersCount, setNumbersCount] = useState(0);
  const [selectedFileInfo, setSelectedFileInfo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Count valid numbers when input changes
    if (phoneNumbers) {
      const lines = phoneNumbers.split('\n').filter(line => line.trim().length > 0);
      setNumbersCount(lines.length);
    } else {
      setNumbersCount(0);
    }
  }, [phoneNumbers]);

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split(/\r?\n/);
      const numbers = lines
        .map(line => {
          if (!line.trim()) return null;
          const parts = line.includes(',') ? line.split(',') : [line];
          for (let part of parts) {
            const cleaned = part.trim().replace(/[^0-9+]/g, '');
            if (cleaned && (cleaned.startsWith('06') || cleaned.startsWith('07') || 
                cleaned.startsWith('+212') || cleaned.startsWith('212'))) {
              return cleaned;
            }
          }
          return null;
        })
        .filter(Boolean);
      
      if (numbers.length > 0) {
        setPhoneNumbers(numbers.join('\n'));
        setNumbersCount(numbers.length);
        alert(`${numbers.length} numéros importés avec succès!`);
      } else {
        alert('Aucun numéro valide trouvé dans le fichier.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleMediaFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMediaFile(file);
      
      // Display file information
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setSelectedFileInfo({
        name: file.name,
        type: file.type,
        size: `${fileSizeMB} MB`,
        lastModified: new Date(file.lastModified).toLocaleDateString('fr-FR'),
      });

      // For image previews
      if (messageType === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setShowPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setShowPreview(false);
      }
    } else {
      setSelectedFileInfo(null);
      setShowPreview(false);
    }
  };
  
  const clearForm = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les champs?')) {
      setPhoneNumbers('');
      setMessage('');
      setMediaFile(null);
      setSelectedFileInfo(null);
      setShowPreview(false);
      setSendResult(null);
    }
  };

  const handleSendBulkMessages = async (e) => {
    e.preventDefault();
    
    if (!isProfileComplete()) {
      alert('Veuillez compléter votre profil avant d\'envoyer des messages');
      return;
    }

    if (messageType !== 'text' && !mediaFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    if (!message.trim() && messageType === 'text') {
      alert('Veuillez saisir un message');
      return;
    }
    
    const numbersArray = phoneNumbers.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (numbersArray.length === 0) {
      alert('Veuillez saisir au moins un numéro de téléphone');
      return;
    }

    // Confirm before sending to many numbers
    if (numbersArray.length > 25) {
      if (!confirm(`Vous allez envoyer un message à ${numbersArray.length} numéros. Êtes-vous sûr de vouloir continuer?`)) {
        return;
      }
    }
    
    setIsSending(true);
    setSendResult(null);

    const formData = new FormData();
    formData.append('numbers', numbersArray);
    formData.append('message', message);
    formData.append('messageType', messageType);
    
    // Ajouter les informations de l'utilisateur et la niche
    if (userData) {
      formData.append('uid', userData.uid);
      formData.append('niche', userData.niche || "default");
    }
    
    if (mediaFile) {
      formData.append('media', mediaFile);
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/send`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setSendResult(data);
      
      if (data.success) {
        setMessage('');
        setMediaFile(null);
        setSelectedFileInfo(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des messages:', error);
      
      // Message d'erreur spécifique pour les problèmes de base de données
      let errorMessage = 'Erreur de connexion au serveur';
      
      // Vérifier si l'erreur est liée à une contrainte de clé étrangère
      if (error.message && (
          error.message.includes('SQLITE_CONSTRAINT') || 
          error.message.includes('SequelizeForeignKeyConstraintError') ||
          error.message.includes('foreign key constraint failed')
      )) {
        errorMessage = 'Problème avec la base de données. Contactez l\'administrateur pour exécuter le script de correction "fix_database.js".';
      }
      
      setSendResult({
        success: false,
        message: errorMessage,
        error: error.message,
        note: 'Si vous rencontrez des problèmes de contrainte de clé étrangère, exécutez le script de correction de la base de données.'
      });
    } finally {
      setIsSending(false);
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('sendResultsSection');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  if (!whatsappReady) {
    return (
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Envoi de messages
          </h2>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 p-6 border border-yellow-200 rounded-lg shadow-sm flex items-center">
            <svg className="h-12 w-12 text-yellow-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800 text-lg mb-1">WhatsLand n'est pas connecté</h3>
              <p className="text-yellow-700">
                Veuillez d'abord connecter WhatsLand pour envoyer des messages. 
                Allez à l'onglet "Statut WhatsLand" et scannez le QR code avec votre téléphone.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Envoi de messages
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="text-white hover:text-green-200 transition-colors duration-200 p-2 rounded-full hover:bg-green-700"
              title={showHelp ? "Masquer l'aide" : "Afficher l'aide"}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={clearForm}
              className="text-white hover:text-green-200 transition-colors duration-200 p-2 rounded-full hover:bg-green-700"
              title="Effacer le formulaire"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {showHelp && (
          <div className="bg-blue-50 p-6 rounded-lg mb-6 transform transition-all duration-300 hover:shadow-lg border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-3 flex items-center text-lg">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Guide d'utilisation
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">Instructions pour les numéros</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
                  <li>Entrez vos numéros de téléphone (un par ligne) ou importez-les depuis un fichier</li>
                  <li>Formats acceptés: +212612345678, 06 12 34 56 78, 07XXXXXXXX</li>
                  <li>Les numéros seront automatiquement convertis au format international (+212)</li>
                  <li>Limitez vos envois (max 50-100 numéros à la fois) pour éviter les blocages</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">Types de messages supportés</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
                  <li><strong>Texte</strong>: Messages texte simples (max 4096 caractères)</li>
                  <li><strong>Image</strong>: Formats JPG, PNG, GIF (max 16MB)</li>
                  <li><strong>Document</strong>: PDF, DOC, DOCX, XLS, XLSX, TXT</li>
                  <li><strong>Vidéo</strong>: MP4 recommandé (max 16MB)</li>
                  <li><strong>Audio</strong>: MP3, WAV, OGG (max 16MB)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-600 bg-blue-100 p-3 rounded-md">
              <strong>Note:</strong> Pour des envois plus efficaces, assurez-vous que votre téléphone est connecté à Internet et que l'application reste ouverte.
              Les messages sont envoyés avec un délai d'une seconde entre chaque numéro pour éviter les restrictions de l'application.
            </div>
          </div>
        )}
        
        <form onSubmit={handleSendBulkMessages} className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Destinataires</h3>
                {numbersCount > 0 && (
                  <p className="text-sm text-gray-600">
                    {numbersCount} numéro{numbersCount > 1 ? 's' : ''} saisi{numbersCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <label className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg cursor-pointer transition-colors duration-200 transform hover:scale-105 flex items-center shadow-sm">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Importer CSV
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  className="hidden" 
                  onChange={handleFileImport}
                />
              </label>
            </div>
            <div className="relative">
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                rows="5"
                placeholder="+212612345678&#10;06 12 34 56 78&#10;07 98 76 54 32"
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                required
              />
              {numbersCount > 25 && (
                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-md flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Envoi massif ({numbersCount})
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Format: +212XXXXXXXXX</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Format: 06XXXXXXXX</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Format: 07XXXXXXXX</span>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contenu du message</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Type de message
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  value={messageType}
                  onChange={(e) => {
                    setMessageType(e.target.value);
                    setMediaFile(null);
                    setSelectedFileInfo(null);
                    setShowPreview(false);
                  }}
                >
                  <option value="text">Texte</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="video">Vidéo</option>
                  <option value="audio">Audio</option>
                </select>
              </div>

              {messageType !== 'text' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {messageType === 'image' ? 'Image' : messageType === 'document' ? 'Document' : messageType === 'video' ? 'Vidéo' : 'Audio'}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept={
                        messageType === 'image' ? 'image/*' :
                        messageType === 'document' ? '.pdf,.doc,.docx,.xls,.xlsx,.txt' :
                        messageType === 'video' ? 'video/*' :
                        messageType === 'audio' ? 'audio/*' : '*/*'
                      }
                      onChange={handleMediaFileChange}
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    {selectedFileInfo && (
                      <button
                        type="button"
                        onClick={() => {
                          setMediaFile(null);
                          setSelectedFileInfo(null);
                          setShowPreview(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700"
                        title="Supprimer le fichier"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedFileInfo && (
              <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">Fichier sélectionné</h4>
                  {showPreview && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
                    </button>
                  )}
                </div>
                
                <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600">Nom: <span className="text-gray-800">{selectedFileInfo.name}</span></p>
                    <p className="text-gray-600">Type: <span className="text-gray-800">{selectedFileInfo.type}</span></p>
                  </div>
                  <div>
                    <p className="text-gray-600">Taille: <span className="text-gray-800">{selectedFileInfo.size}</span></p>
                    <p className="text-gray-600">Date: <span className="text-gray-800">{selectedFileInfo.lastModified}</span></p>
                  </div>
                </div>

                {showPreview && (
                  <div className="mt-3 flex justify-center border-t pt-3">
                    <img 
                      src={showPreview} 
                      alt="Aperçu" 
                      className="max-h-40 object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {messageType === 'text' ? 'Message' : 'Légende (optionnelle)'}
              </label>
              <div className="relative">
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  rows="4"
                  placeholder={messageType === 'text' 
                    ? "Écrivez votre message ici..." 
                    : "Ajoutez une légende à votre média (optionnel)"
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required={messageType === 'text'}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {message.length} caractères
                </div>
              </div>
              {messageType === 'text' && (
                <p className="text-xs text-gray-500 mt-1">Maximum 4096 caractères</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Niche:</span> {userData?.niche || "Non spécifiée"}
            </div>

            <button 
              type="submit"
              disabled={isSending}
              className="flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Envoyer {numbersCount > 0 ? `(${numbersCount} numéros)` : 'les messages'}
                </>
              )}
            </button>
          </div>
        </form>

        {sendResult && (
          <div id="sendResultsSection" className="mt-8 p-6 rounded-lg border shadow-md transition-all duration-300 transform hover:shadow-lg scroll-mt-8 relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${sendResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  {sendResult.success ? (
                    <svg className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  Résultats de l'envoi
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {sendResult.success ? 'Succès' : 'Échec'}
                </span>
              </div>
              
              <div className="mb-4 text-lg font-medium text-gray-700">{sendResult.message}</div>
              
              {sendResult.note && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <p className="flex items-start">
                    <svg className="h-5 w-5 mr-1 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{sendResult.note}</span>
                  </p>
                </div>
              )}
              
              {sendResult.results && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700">Détails par numéro</h4>
                    <div className="flex space-x-2 text-sm">
                      <span className="flex items-center">
                        <span className="w-3 h-3 inline-block bg-green-500 rounded-full mr-1"></span>
                        Succès: {sendResult.results.filter(r => r.status === 'success').length}
                      </span>
                      <span className="flex items-center">
                        <span className="w-3 h-3 inline-block bg-red-500 rounded-full mr-1"></span>
                        Échecs: {sendResult.results.filter(r => r.status === 'error').length}
                      </span>
                    </div>
                  </div>
                
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détail</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sendResult.results.map((result, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{result.originalNumber}</td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {result.status === 'success' ? 'Envoyé' : 'Échec'}
                              </span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{result.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 