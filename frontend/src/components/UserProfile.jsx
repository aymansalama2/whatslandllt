import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiTag, 
  FiCheck, 
  FiAlertCircle,
  FiCalendar,
  FiEdit3,
  FiSave,
  FiX
} from 'react-icons/fi';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`}`}`}`;
const NICHE_OPTIONS = [
  'E-commerce',
  'Immobilier',
  'Formation',
  'Santé et Bien-être',
  'Services aux entreprises',
  'Restauration',
  'Mode et Beauté',
  'Technologie',
  'Autre'
];

export default function UserProfile() {
  const { currentUser } = useAuth();
  const { userData, updateUserProfile } = useUser();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    niche: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        telephone: userData.telephone || '',
        email: userData.email || '',
        niche: userData.niche || ''
      });
    }
  }, [userData, currentUser]);

  // Fonction pour synchroniser le profil avec le backend
  const syncProfileWithBackend = async (profileData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          ...profileData
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.warn("Avertissement: Synchronisation backend non réussie", data.message);
      } else {
        console.log("Profil synchronisé avec le backend");
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation avec le backend:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Mettre à jour le profil dans Firebase
      await updateUserProfile(formData);
      
      // Synchroniser avec le backend SQLite
      await syncProfileWithBackend(formData);
      
      setSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getInitials = () => {
    if (formData.prenom && formData.nom) {
      return `${formData.prenom[0]}${formData.nom[0]}`.toUpperCase();
    }
    return currentUser?.email?.[0]?.toUpperCase() || 'U';
  };

  const getJoinDate = () => {
    if (currentUser?.metadata?.creationTime) {
      return new Date(currentUser.metadata.creationTime).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return 'Date inconnue';
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Profile Header Card */}
      <motion.div
        variants={itemVariants}
        className="relative bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-3xl p-8 overflow-hidden shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center">
          {/* Avatar */}
          <motion.div
            className="relative mb-6 md:mb-0 md:mr-8"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white/30">
              {getInitials()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <FiUser className="text-yellow-800" size={20} />
            </div>
          </motion.div>

          {/* User Info */}
          <div className="text-center md:text-left text-white flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {formData.prenom && formData.nom 
                ? `${formData.prenom} ${formData.nom}` 
                : 'Profil utilisateur'
              }
            </h1>
            <p className="text-green-100 text-lg mb-4">{currentUser?.email}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <FiTag className="mr-2" size={16} />
                <span className="text-sm font-medium">
                  {formData.niche || "Niche non spécifiée"}
                </span>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <FiCalendar className="mr-2" size={16} />
                <span className="text-sm font-medium">
                  Inscrit le {getJoinDate()}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <motion.button
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isEditing ? <FiX size={20} /> : <FiEdit3 size={20} />}
          </motion.button>
        </div>
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center shadow-lg"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <FiAlertCircle className="text-red-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium text-red-800">Erreur</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center shadow-lg"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <FiCheck className="text-green-600" size={20} />
            </div>
            <div>
              <h4 className="font-medium text-green-800">Succès</h4>
              <p className="text-green-600 text-sm">Profil mis à jour avec succès!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Form */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Informations personnelles</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
            >
              <FiEdit3 size={16} />
              <span>Modifier</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Prénom */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Prénom
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  placeholder="Votre prénom"
                  className={`pl-12 w-full py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'
                  }`}
                />
              </div>
            </motion.div>

            {/* Nom */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Nom
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  placeholder="Votre nom"
                  className={`pl-12 w-full py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'
                  }`}
                />
              </div>
            </motion.div>

            {/* Téléphone */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiPhone className="text-gray-400" size={20} />
                </div>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  placeholder="Votre numéro de téléphone"
                  className={`pl-12 w-full py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    !isEditing ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'
                  }`}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Format international recommandé</p>
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="pl-12 w-full py-4 bg-gray-100 border-2 border-gray-200 rounded-xl cursor-not-allowed text-gray-600"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Email non modifiable (lié à votre compte)</p>
            </motion.div>
          </div>

          {/* Niche */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Niche
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiTag className="text-gray-400" size={20} />
              </div>
              <select
                name="niche"
                value={formData.niche}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className={`pl-12 w-full py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                  !isEditing ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-300'
                }`}
              >
                <option value="">Sélectionnez votre niche</option>
                {NICHE_OPTIONS.map((niche) => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-500">La niche vous permet de segmenter vos campagnes</p>
          </motion.div>

          {/* Actions */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200"
            >
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={20} />
                    <span>Mettre à jour le profil</span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 flex items-center justify-center space-x-2 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiX size={20} />
                <span>Annuler</span>
              </motion.button>
            </motion.div>
          )}
        </form>
      </motion.div>

      {/* Info Card */}
      <motion.div
        variants={itemVariants}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <FiAlertCircle className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Pourquoi ces informations ?</h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              Ces informations sont utilisées pour personnaliser votre expérience et segmenter vos campagnes WhatsApp. 
              Votre niche permet de mieux organiser vos listes de numéros et d'adapter vos messages.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 