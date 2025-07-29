import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { 
  FiSend, 
  FiUpload, 
  FiUsers, 
  FiMessageSquare, 
  FiImage, 
  FiFile, 
  FiVideo,
  FiMusic,
  FiTrash2,
  FiInfo,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`}`}`}`;

const MESSAGE_TYPES = [
  { value: 'text', label: 'Texte', icon: FiMessageSquare, color: 'blue' },
  { value: 'image', label: 'Image', icon: FiImage, color: 'green' },
  { value: 'document', label: 'Document', icon: FiFile, color: 'purple' },
  { value: 'video', label: 'Vidéo', icon: FiVideo, color: 'red' },
  { value: 'audio', label: 'Audio', icon: FiMusic, color: 'yellow' }
];

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
        // Show success notification instead of alert
        setSendResult({
          success: true,
          message: `${numbers.length} numéros importés avec succès!`,
          temporary: true
        });
        setTimeout(() => setSendResult(null), 3000);
      } else {
        setSendResult({
          success: false,
          message: 'Aucun numéro valide trouvé dans le fichier.',
          temporary: true
        });
        setTimeout(() => setSendResult(null), 3000);
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
    setPhoneNumbers('');
    setMessage('');
    setMediaFile(null);
    setSelectedFileInfo(null);
    setShowPreview(false);
    setSendResult(null);
  };

  const handleSendBulkMessages = async (e) => {
    e.preventDefault();
    
    if (!isProfileComplete()) {
      setSendResult({
        success: false,
        message: 'Veuillez compléter votre profil avant d\'envoyer des messages',
        temporary: true
      });
      setTimeout(() => setSendResult(null), 5000);
      return;
    }

    if (messageType !== 'text' && !mediaFile) {
      setSendResult({
        success: false,
        message: 'Veuillez sélectionner un fichier',
        temporary: true
      });
      setTimeout(() => setSendResult(null), 3000);
      return;
    }

    if (!message.trim() && messageType === 'text') {
      setSendResult({
        success: false,
        message: 'Veuillez saisir un message',
        temporary: true
      });
      setTimeout(() => setSendResult(null), 3000);
      return;
    }
    
    const numbersArray = phoneNumbers.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (numbersArray.length === 0) {
      setSendResult({
        success: false,
        message: 'Veuillez saisir au moins un numéro de téléphone',
        temporary: true
      });
      setTimeout(() => setSendResult(null), 3000);
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!whatsappReady) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-3xl p-8 overflow-hidden shadow-2xl border border-yellow-200"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400 rounded-full transform -translate-x-24 translate-y-24"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center">
          <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
              <FiAlertCircle className="text-white" size={40} />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">WhatsLand n'est pas connecté</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Veuillez d'abord connecter WhatsLand pour envoyer des messages. 
              Allez à l'onglet "Statut WhatsLand" et scannez le QR code avec votre téléphone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw size={20} />
                <span>Vérifier la connexion</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header Card */}
      <motion.div
        variants={itemVariants}
        className="relative bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-3xl p-8 overflow-hidden shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-6 shadow-xl">
              <FiSend className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Envoi de messages</h1>
              <p className="text-green-100 text-lg">
                {numbersCount > 0 ? `${numbersCount} destinataire${numbersCount > 1 ? 's' : ''} sélectionné${numbersCount > 1 ? 's' : ''}` : 'Aucun destinataire'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => setShowHelp(!showHelp)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={showHelp ? "Masquer l'aide" : "Afficher l'aide"}
            >
              <FiInfo className="text-white" size={20} />
            </motion.button>
            
            <motion.button
              onClick={clearForm}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Effacer le formulaire"
            >
              <FiTrash2 className="text-white" size={20} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {sendResult?.temporary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${sendResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-2xl p-4 flex items-center shadow-lg`}
          >
            <div className={`flex-shrink-0 w-10 h-10 ${sendResult.success ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mr-4`}>
              {sendResult.success ? (
                <FiCheck className="text-green-600" size={20} />
              ) : (
                <FiAlertCircle className="text-red-600" size={20} />
              )}
            </div>
            <div>
              <h4 className={`font-medium ${sendResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {sendResult.success ? 'Succès' : 'Erreur'}
              </h4>
              <p className={`${sendResult.success ? 'text-green-600' : 'text-red-600'} text-sm`}>
                {sendResult.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Section */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-3xl p-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-800 flex items-center">
                <FiInfo className="mr-3" size={24} />
                Guide d'utilisation
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-blue-100 rounded-full transition-colors duration-200"
              >
                <FiX className="text-blue-600" size={20} />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-blue-700 text-lg mb-3">📱 Instructions pour les numéros</h4>
                <ul className="space-y-3 text-blue-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Entrez vos numéros de téléphone (un par ligne) ou importez-les depuis un fichier</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Formats acceptés: +212612345678, 06 12 34 56 78, 07XXXXXXXX</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Les numéros seront automatiquement convertis au format international (+212)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Limitez vos envois (max 50-100 numéros à la fois) pour éviter les blocages</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-blue-700 text-lg mb-3">📄 Types de messages supportés</h4>
                <ul className="space-y-3 text-blue-700">
                  <li className="flex items-start">
                    <FiMessageSquare className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={16} />
                    <span><strong>Texte</strong>: Messages texte simples (max 4096 caractères)</span>
                  </li>
                  <li className="flex items-start">
                    <FiImage className="text-green-500 mt-1 mr-3 flex-shrink-0" size={16} />
                    <span><strong>Image</strong>: Formats JPG, PNG, GIF (max 16MB)</span>
                  </li>
                  <li className="flex items-start">
                    <FiFile className="text-purple-500 mt-1 mr-3 flex-shrink-0" size={16} />
                    <span><strong>Document</strong>: PDF, DOC, DOCX, XLS, XLSX, TXT</span>
                  </li>
                  <li className="flex items-start">
                    <FiVideo className="text-red-500 mt-1 mr-3 flex-shrink-0" size={16} />
                    <span><strong>Vidéo</strong>: MP4 recommandé (max 16MB)</span>
                  </li>
                  <li className="flex items-start">
                    <FiMusic className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={16} />
                    <span><strong>Audio</strong>: MP3, WAV, OGG (max 16MB)</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-100 rounded-2xl">
              <p className="text-blue-800 text-sm">
                <strong>💡 Conseil:</strong> Pour des envois plus efficaces, assurez-vous que votre téléphone est connecté à Internet et que l'application reste ouverte.
                Les messages sont envoyés avec un délai d'une seconde entre chaque numéro pour éviter les restrictions de l'application.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSendBulkMessages} className="space-y-8">
        {/* Recipients Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <FiUsers className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Destinataires</h3>
                <p className="text-gray-600">
                  {numbersCount > 0 ? `${numbersCount} numéro${numbersCount > 1 ? 's' : ''} saisi${numbersCount > 1 ? 's' : ''}` : 'Aucun destinataire'}
                </p>
              </div>
            </div>
            
            <motion.label
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl cursor-pointer hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiUpload size={20} />
              <span>Importer CSV</span>
              <input 
                type="file" 
                accept=".csv,.txt" 
                className="hidden" 
                onChange={handleFileImport}
              />
            </motion.label>
          </div>
          
          <div className="relative">
            <textarea 
              className="w-full p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
              rows="6"
              placeholder="+212612345678&#10;06 12 34 56 78&#10;07 98 76 54 32"
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              required
            />
            {numbersCount > 25 && (
              <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-sm px-3 py-2 rounded-xl flex items-center shadow-lg">
                <FiAlertCircle className="mr-2" size={16} />
                Envoi massif ({numbersCount})
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-full">Format: +212XXXXXXXXX</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-full">Format: 06XXXXXXXX</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-full">Format: 07XXXXXXXX</span>
          </div>
        </motion.div>

        {/* Message Content Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <FiMessageSquare className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Contenu du message</h3>
              <p className="text-gray-600">Choisissez le type et rédigez votre message</p>
            </div>
          </div>

          {/* Message Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">Type de message</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {MESSAGE_TYPES.map((type) => {
                const IconComponent = type.icon;
                const isSelected = messageType === type.value;
                return (
                  <motion.button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setMessageType(type.value);
                      setMediaFile(null);
                      setSelectedFileInfo(null);
                      setShowPreview(false);
                    }}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected 
                        ? `border-${type.color}-500 bg-${type.color}-50` 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected ? `bg-${type.color}-100` : 'bg-gray-100'
                      }`}>
                        <IconComponent 
                          className={isSelected ? `text-${type.color}-600` : 'text-gray-600'} 
                          size={20} 
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        isSelected ? `text-${type.color}-700` : 'text-gray-700'
                      }`}>
                        {type.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className={`absolute -top-1 -right-1 w-6 h-6 bg-${type.color}-500 rounded-full flex items-center justify-center`}>
                        <FiCheck className="text-white" size={14} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* File Upload for Media Messages */}
          {messageType !== 'text' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8"
            >
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Fichier {messageType === 'image' ? 'image' : messageType === 'document' ? 'document' : messageType === 'video' ? 'vidéo' : 'audio'}
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
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {selectedFileInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setSelectedFileInfo(null);
                      setShowPreview(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                    title="Supprimer le fichier"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>

              {/* File Info Display */}
              {selectedFileInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700">Fichier sélectionné</h4>
                    {messageType === 'image' && showPreview && (
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {showPreview ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        <span>{showPreview ? "Masquer" : "Aperçu"}</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Nom: <span className="text-gray-800 font-medium">{selectedFileInfo.name}</span></p>
                      <p className="text-gray-600">Type: <span className="text-gray-800 font-medium">{selectedFileInfo.type}</span></p>
                    </div>
                    <div>
                      <p className="text-gray-600">Taille: <span className="text-gray-800 font-medium">{selectedFileInfo.size}</span></p>
                      <p className="text-gray-600">Date: <span className="text-gray-800 font-medium">{selectedFileInfo.lastModified}</span></p>
                    </div>
                  </div>

                  {showPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-200 flex justify-center"
                    >
                      <img 
                        src={showPreview} 
                        alt="Aperçu" 
                        className="max-h-48 object-contain rounded-xl shadow-lg"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Message Text Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              {messageType === 'text' ? 'Message' : 'Légende (optionnelle)'}
            </label>
            <div className="relative">
              <textarea 
                className="w-full p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                rows="5"
                placeholder={messageType === 'text' 
                  ? "Écrivez votre message ici..." 
                  : "Ajoutez une légende à votre média (optionnel)"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required={messageType === 'text'}
              />
              <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                {message.length} caractères
              </div>
            </div>
            {messageType === 'text' && (
              <p className="text-xs text-gray-500 mt-2">Maximum 4096 caractères</p>
            )}
          </div>
        </motion.div>

        {/* Send Button Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Niche:</span> {userData?.niche || "Non spécifiée"}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Prêt à envoyer:</span> {numbersCount} message{numbersCount > 1 ? 's' : ''}
              </div>
            </div>

            <motion.button 
              type="submit"
              disabled={isSending}
              className="flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg min-w-[200px]"
              whileHover={{ scale: isSending ? 1 : 1.05 }}
              whileTap={{ scale: isSending ? 1 : 0.95 }}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <FiSend size={20} />
                  <span>Envoyer {numbersCount > 0 ? `(${numbersCount})` : ''}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </form>

      {/* Results Section */}
      {sendResult && !sendResult.temporary && (
        <motion.div
          id="sendResultsSection"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              {sendResult.success ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <FiCheck className="text-green-600" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FiAlertCircle className="text-red-600" size={24} />
                </div>
              )}
              Résultats de l'envoi
            </h3>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {sendResult.success ? 'Succès' : 'Échec'}
            </span>
          </div>
          
          <div className="mb-6 text-lg text-gray-700">{sendResult.message}</div>
          
          {sendResult.note && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-start">
                <FiInfo className="text-blue-500 mr-3 mt-1 flex-shrink-0" size={20} />
                <p className="text-blue-700">{sendResult.note}</p>
              </div>
            </div>
          )}
          
          {sendResult.results && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700 text-lg">Détails par numéro</h4>
                <div className="flex space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Succès: {sendResult.results.filter(r => r.status === 'success').length}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>Échecs: {sendResult.results.filter(r => r.status === 'error').length}</span>
                  </div>
                </div>
              </div>
            
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Numéro</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Détail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sendResult.results.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.originalNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.status === 'success' ? (
                                <>
                                  <FiCheck className="mr-1" size={12} />
                                  Envoyé
                                </>
                              ) : (
                                <>
                                  <FiX className="mr-1" size={12} />
                                  Échec
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{result.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
} 