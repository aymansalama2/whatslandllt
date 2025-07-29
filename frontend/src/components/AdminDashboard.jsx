import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { 
  FiUsers, 
  FiSettings, 
  FiBarChart, 
  FiPhone, 
  FiPieChart,
  FiUserPlus,
  FiEdit3,
  FiTrash2,
  FiShield,
  FiUserCheck,
  FiDownload,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiEye,
  FiSave,
  FiPlus,
  FiMinus
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { allUsers, isSuperAdmin, toggleUserRole, deleteUser, updateUser, createUser } = useUser();
  const [activeTab, setActiveTab] = useState('users');
  const [phoneStats, setPhoneStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({});
  const [newUserFormData, setNewUserFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    niche: '',
    customNiche: '',
    password: '',
    confirmPassword: '',
    isAdmin: false
  });
  const [actionStatus, setActionStatus] = useState({ type: '', message: '' });

  // Options prédéfinies pour les niches
  const nicheOptions = [
    'E-commerce',
    'Marketing Digital',
    'Immobilier',
    'Finance',
    'Santé',
    'Éducation',
    'Technologie',
    'Restauration',
    'Mode et Beauté',
    'Sport et Fitness',
    'Autre'
  ];

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: FiUsers, color: 'blue' },
    ...(isSuperAdmin ? [{ id: 'user-management', label: 'Gestion', icon: FiSettings, color: 'purple' }] : []),
    { id: 'niches', label: 'Stats Niches', icon: FiPieChart, color: 'green' },
    { id: 'numbers', label: 'Numéros', icon: FiPhone, color: 'orange' },
    { id: 'phone-niches', label: 'Stats Numéros', icon: FiBarChart, color: 'red' }
  ];

  useEffect(() => {
    fetchPhoneStats();
  }, []);

  const fetchPhoneStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`}`}`}/api/phone-stats`);
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setPhoneStats(data);
      } else {
        console.error('API returned non-array data:', data);
        setPhoneStats([]);
        setError('Les données reçues sont dans un format invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setPhoneStats([]);
      setError(`Erreur: ${error.message || 'Impossible de charger les statistiques'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const exportToExcel = async () => {
    try {
      setExporting(true);
      window.location.href = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`}`}`}/api/export-phone-numbers`;
      setTimeout(() => {
        setExporting(false);
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      setError('Erreur lors de l\'export Excel');
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getNicheStats = () => {
    const stats = {};
    allUsers.forEach(user => {
      if (user.niche) {
        stats[user.niche] = (stats[user.niche] || 0) + 1;
      }
    });
    return stats;
  };
  
  // Statistiques par niche pour les numéros
  const getPhoneNicheStats = () => {
    const stats = {};
    if (Array.isArray(phoneStats)) {
      phoneStats.forEach(phone => {
        const niche = phone.niche || 'Non spécifiée';
        stats[niche] = (stats[niche] || 0) + 1;
      });
    }
    return stats;
  };

  // Gérer le changement de rôle d'un utilisateur
  const handleToggleRole = async (user) => {
    try {
      setActionStatus({ type: 'loading', message: 'Modification du rôle en cours...' });
      const newIsAdmin = !user.isAdmin;
      await toggleUserRole(user.uid, newIsAdmin);
      setActionStatus({ 
        type: 'success', 
        message: `L'utilisateur ${user.email} est maintenant ${newIsAdmin ? 'administrateur' : 'utilisateur normal'}`
      });
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setActionStatus({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setActionStatus({ type: 'error', message: `Erreur: ${error.message}` });
    }
  };

  // Gérer la suppression d'un utilisateur
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ? Cette action est irréversible.`)) {
      return;
    }
    
    try {
      setActionStatus({ type: 'loading', message: 'Suppression de l\'utilisateur en cours...' });
      await deleteUser(user.uid);
      setActionStatus({ type: 'success', message: `L'utilisateur ${user.email} a été supprimé avec succès` });
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setActionStatus({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setActionStatus({ type: 'error', message: `Erreur: ${error.message}` });
    }
  };

  // Gérer l'édition d'un utilisateur
  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      telephone: user.telephone || '',
      niche: user.niche || '',
      email: user.email || ''
    });
  };

  // Gérer la soumission du formulaire d'édition
  const handleSubmitUserEdit = async (e) => {
    e.preventDefault();
    
    try {
      setActionStatus({ type: 'loading', message: 'Mise à jour de l\'utilisateur en cours...' });
      await updateUser(editingUser.uid, userFormData);
      setActionStatus({ type: 'success', message: `L'utilisateur ${userFormData.email} a été mis à jour avec succès` });
      setEditingUser(null);
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setActionStatus({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setActionStatus({ type: 'error', message: `Erreur: ${error.message}` });
    }
  };

  // Gérer le changement des champs du formulaire d'édition
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gérer le changement des champs du formulaire de création
  const handleNewUserFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUserFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gérer la création d'un nouvel utilisateur
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation des mots de passe
    if (newUserFormData.password !== newUserFormData.confirmPassword) {
      setActionStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }
    
    if (newUserFormData.password.length < 6) {
      setActionStatus({ type: 'error', message: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }
    
    try {
      setActionStatus({ type: 'loading', message: 'Création de l\'utilisateur en cours...' });
      
      const { password, confirmPassword, customNiche, ...userData } = newUserFormData;
      
      // Utiliser la niche personnalisée si "Autre" est sélectionné
      const finalNiche = userData.niche === 'Autre' ? customNiche : userData.niche;
      
      await createUser({ ...userData, niche: finalNiche }, password);
      
      setActionStatus({ type: 'success', message: `L'utilisateur ${userData.email} a été créé avec succès` });
      setCreatingUser(false);
      setNewUserFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        niche: '',
        customNiche: '',
        password: '',
        confirmPassword: '',
        isAdmin: false
      });
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setActionStatus({ type: '', message: '' });
      }, 3000);
    } catch (error) {
      setActionStatus({ type: 'error', message: `Erreur: ${error.message}` });
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

  const getTabColor = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    return tab ? tab.color : 'blue';
  };

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
        className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-3xl p-4 sm:p-6 lg:p-8 overflow-hidden shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white rounded-full transform translate-x-16 sm:translate-x-24 lg:translate-x-32 -translate-y-16 sm:-translate-y-24 lg:-translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-white rounded-full transform -translate-x-12 sm:-translate-x-18 lg:-translate-x-24 translate-y-12 sm:translate-y-18 lg:translate-y-24"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full lg:w-auto">
            <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 sm:mb-0 sm:mr-4 lg:mr-6 shadow-xl flex-shrink-0">
              <FiShield className="text-white" size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 break-words">Administration</h1>
              <p className="text-purple-100 text-sm sm:text-base lg:text-lg">Tableau de bord administrateur</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full sm:w-auto">
            {isSuperAdmin && (
              <div className="bg-yellow-400/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-yellow-400/30 flex-shrink-0">
                <span className="text-yellow-100 font-semibold text-xs sm:text-sm">Super Admin</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-white/80 flex-shrink-0">
              <FiUsers size={16} className="sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">{allUsers.length} utilisateurs</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {actionStatus.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border shadow-lg ${
              actionStatus.type === 'success' ? 'bg-green-50 border-green-200' :
              actionStatus.type === 'error' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                actionStatus.type === 'success' ? 'bg-green-100' :
                actionStatus.type === 'error' ? 'bg-red-100' :
                'bg-blue-100'
              }`}>
                {actionStatus.type === 'success' ? (
                  <FiCheck className="text-green-600" size={20} />
                ) : actionStatus.type === 'error' ? (
                  <FiX className="text-red-600" size={20} />
                ) : (
                  <FiRefreshCw className="text-blue-600 animate-spin" size={20} />
                )}
              </div>
              <div>
                <h4 className={`font-medium ${
                  actionStatus.type === 'success' ? 'text-green-800' :
                  actionStatus.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {actionStatus.type === 'success' ? 'Succès' :
                   actionStatus.type === 'error' ? 'Erreur' :
                   'En cours...'}
                </h4>
                <p className={`text-sm ${
                  actionStatus.type === 'success' ? 'text-green-600' :
                  actionStatus.type === 'error' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {actionStatus.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="relative">
          {/* Scroll indicators for mobile */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none sm:hidden"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none sm:hidden"></div>
          
          <div className="flex overflow-x-auto scrollbar-hide touch-pan-x">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-none sm:flex-1 min-w-max px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-center space-x-1.5 sm:space-x-2 border-b-2 transition-all duration-200 text-xs sm:text-sm ${
                    isActive
                      ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TabIcon size={16} className="sm:w-5 sm:h-5" />
                  <span className="font-medium whitespace-nowrap">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUsers className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Liste des utilisateurs</h3>
                    <p className="text-gray-600">Aperçu de tous les utilisateurs inscrits</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {allUsers.length} utilisateurs
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200">
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Nom complet
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                          Téléphone
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                          Niche
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">
                          Dernière mise à jour
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allUsers.map((user, index) => (
                        <motion.tr
                          key={user.uid}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                {(user.prenom?.[0] || user.email?.[0] || 'U').toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">
                                {user.nom} {user.prenom}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                            {user.email}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600 text-sm hidden md:table-cell">
                            {user.telephone || 'Non renseigné'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {user.niche || 'Non spécifiée'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.isAdmin 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.isAdmin ? (
                                <>
                                  <FiShield className="mr-1" size={10} />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <FiUserCheck className="mr-1" size={10} />
                                  User
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600 text-xs hidden xl:table-cell">
                            {user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden">
                  {allUsers.map((user, index) => (
                    <motion.div
                      key={user.uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="table-mobile-card"
                    >
                      <div className="table-mobile-card-header">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          {(user.prenom?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {user.nom} {user.prenom}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          user.isAdmin 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.isAdmin ? (
                            <>
                              <FiShield className="mr-1" size={10} />
                              Admin
                            </>
                          ) : (
                            <>
                              <FiUserCheck className="mr-1" size={10} />
                              User
                            </>
                          )}
                        </span>
                      </div>
                      
                      <div className="table-mobile-card-content">
                        <div className="table-mobile-field">
                          <span className="table-mobile-label">Téléphone</span>
                          <span className="table-mobile-value">{user.telephone || 'Non renseigné'}</span>
                        </div>
                        <div className="table-mobile-field">
                          <span className="table-mobile-label">Niche</span>
                          <span className="table-mobile-value">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {user.niche || 'Non spécifiée'}
                            </span>
                          </span>
                        </div>
                        <div className="table-mobile-field" style={{gridColumn: '1 / -1'}}>
                          <span className="table-mobile-label">Dernière mise à jour</span>
                          <span className="table-mobile-value text-xs">{user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* Mobile actions */}
                      <div className="table-mobile-actions">
                        <motion.button
                          onClick={() => handleToggleRole(user)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                            user.isAdmin
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {user.isAdmin ? <FiMinus size={12} /> : <FiPlus size={12} />}
                          <span>{user.isAdmin ? 'Rétrograder' : 'Promouvoir'}</span>
                        </motion.button>
                        
                        <motion.button
                          onClick={() => handleEditUser(user)}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-xs font-medium transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiEdit3 size={12} />
                          <span>Modifier</span>
                        </motion.button>
                        
                        <motion.button
                          onClick={() => handleDeleteUser(user)}
                          className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-xs font-medium transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiTrash2 size={12} />
                          <span>Supprimer</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'user-management' && isSuperAdmin && (
            <motion.div
              key="user-management"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FiSettings className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Gestion des utilisateurs</h3>
                    <p className="text-gray-600">Créer, modifier et gérer les utilisateurs</p>
                  </div>
                </div>
                
                <motion.button
                  onClick={() => setCreatingUser(true)}
                  className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiUserPlus size={16} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Nouvel utilisateur</span>
                  <span className="sm:hidden">Nouveau</span>
                </motion.button>
              </div>

              <AnimatePresence>
                {creatingUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-green-800">Créer un nouvel utilisateur</h4>
                      <button
                        onClick={() => setCreatingUser(false)}
                        className="p-2 hover:bg-green-100 rounded-full transition-colors duration-200"
                      >
                        <FiX className="text-green-600" size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={handleCreateUser}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                            <input
                              type="text"
                              name="nom"
                              value={newUserFormData.nom}
                              onChange={handleNewUserFormChange}
                              required
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
                            <input
                              type="text"
                              name="prenom"
                              value={newUserFormData.prenom}
                              onChange={handleNewUserFormChange}
                              required
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={newUserFormData.email}
                            onChange={handleNewUserFormChange}
                            required
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                          <input
                            type="text"
                            name="telephone"
                            value={newUserFormData.telephone}
                            onChange={handleNewUserFormChange}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Niche</label>
                          <select
                            name="niche"
                            value={newUserFormData.niche}
                            onChange={handleNewUserFormChange}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Sélectionnez une niche</option>
                            {nicheOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {newUserFormData.niche === 'Autre' && (
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Niche personnalisée *</label>
                            <input
                              type="text"
                              name="customNiche"
                              value={newUserFormData.customNiche}
                              onChange={handleNewUserFormChange}
                              required
                              placeholder="Saisissez votre niche"
                              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe *</label>
                          <input
                            type="password"
                            name="password"
                            value={newUserFormData.password}
                            onChange={handleNewUserFormChange}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe *</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={newUserFormData.confirmPassword}
                            onChange={handleNewUserFormChange}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        
                        <div className="sm:col-span-2 flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                          <input
                            type="checkbox"
                            name="isAdmin"
                            checked={newUserFormData.isAdmin}
                            onChange={handleNewUserFormChange}
                            className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500"
                          />
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            <FiShield className="mr-2" size={16} />
                            Administrateur
                          </label>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                        <motion.button
                          type="button"
                          onClick={() => {
                            setCreatingUser(false);
                            setNewUserFormData({
                              nom: '',
                              prenom: '',
                              email: '',
                              telephone: '',
                              niche: '',
                              customNiche: '',
                              password: '',
                              confirmPassword: '',
                              isAdmin: false
                            });
                          }}
                          className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Annuler
                        </motion.button>
                        <motion.button
                          type="submit"
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg font-medium"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Créer l'utilisateur
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {editingUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-blue-800">Modifier l'utilisateur</h4>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-2 hover:bg-blue-100 rounded-full transition-colors duration-200"
                      >
                        <FiX className="text-blue-600" size={20} />
                      </button>
                    </div>
                    
                    <form onSubmit={handleSubmitUserEdit}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                          <input
                            type="text"
                            name="nom"
                            value={userFormData.nom}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                          <input
                            type="text"
                            name="prenom"
                            value={userFormData.prenom}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                          <input
                            type="text"
                            name="telephone"
                            value={userFormData.telephone}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Niche</label>
                          <input
                            type="text"
                            name="niche"
                            value={userFormData.niche}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                        <motion.button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Annuler
                        </motion.button>
                        <motion.button
                          type="submit"
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg font-medium flex items-center justify-center"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FiSave className="mr-2" size={16} />
                          Enregistrer
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {!creatingUser && !editingUser && (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Rôle
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allUsers.map((user, index) => (
                          <motion.tr
                            key={user.uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4">
                                  {(user.prenom?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {user.nom} {user.prenom}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.niche || 'Aucune niche'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                user.isAdmin 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.isAdmin ? (
                                  <>
                                    <FiShield className="mr-1" size={12} />
                                    Admin
                                  </>
                                ) : (
                                  <>
                                    <FiUserCheck className="mr-1" size={12} />
                                    Utilisateur
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <motion.button
                                  onClick={() => handleToggleRole(user)}
                                  className={`flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                                    user.isAdmin
                                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {user.isAdmin ? <FiMinus size={10} /> : <FiPlus size={10} />}
                                  <span className="hidden sm:inline">{user.isAdmin ? 'Rétrograder' : 'Promouvoir'}</span>
                                </motion.button>
                                
                                <motion.button
                                  onClick={() => handleEditUser(user)}
                                  className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-xs font-medium transition-colors duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <FiEdit3 size={10} />
                                  <span className="hidden sm:inline">Modifier</span>
                                </motion.button>
                                
                                <motion.button
                                  onClick={() => handleDeleteUser(user)}
                                  className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-xs font-medium transition-colors duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <FiTrash2 size={10} />
                                  <span className="hidden sm:inline">Supprimer</span>
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'niches' && (
            <motion.div
              key="niches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiPieChart className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Statistiques par niche</h3>
                  <p className="text-gray-600">Répartition des utilisateurs par secteur d'activité</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Object.entries(getNicheStats()).map(([niche, count], index) => (
                  <motion.div
                    key={niche}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6 border border-green-200 hover:shadow-lg transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base lg:text-lg truncate pr-2">{niche}</h4>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUsers className="text-green-600" size={12} />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">{count}</div>
                    <div className="text-xs sm:text-sm text-green-700">
                      {count === 1 ? 'utilisateur' : 'utilisateurs'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'phone-niches' && (
            <motion.div
              key="phone-niches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiBarChart className="text-red-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Statistiques des numéros</h3>
                  <p className="text-gray-600">Répartition des numéros de téléphone par niche</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Object.entries(getPhoneNicheStats()).map(([niche, count], index) => (
                  <motion.div
                    key={niche}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 sm:p-6 border border-red-200 hover:shadow-lg transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base lg:text-lg truncate pr-2">{niche}</h4>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiPhone className="text-red-600" size={12} />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1 sm:mb-2">{count}</div>
                    <div className="text-xs sm:text-sm text-red-700">
                      {count === 1 ? 'numéro' : 'numéros'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'numbers' && (
            <motion.div
              key="numbers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <FiPhone className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Gestion des numéros</h3>
                    <p className="text-gray-600">Liste complète des numéros de téléphone</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <motion.button
                    onClick={fetchPhoneStats}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiRefreshCw size={14} />
                    <span>Actualiser</span>
                  </motion.button>
                  
                  <motion.button 
                    onClick={exportToExcel}
                    disabled={exporting || !Array.isArray(phoneStats) || phoneStats.length === 0}
                    className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                      exporting || !Array.isArray(phoneStats) || phoneStats.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg'
                    }`}
                    whileHover={!exporting && Array.isArray(phoneStats) && phoneStats.length > 0 ? { scale: 1.05 } : {}}
                    whileTap={!exporting && Array.isArray(phoneStats) && phoneStats.length > 0 ? { scale: 0.95 } : {}}
                  >
                    {exporting ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={14} />
                        <span className="hidden sm:inline">Export...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <FiDownload size={14} />
                        <span className="hidden sm:inline">Exporter Excel</span>
                        <span className="sm:hidden">Export</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <FiRefreshCw className="animate-spin text-orange-600" size={24} />
                    <span className="text-gray-600">Chargement des statistiques...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3 text-red-600">
                    <FiAlertCircle size={24} />
                    <span>{error}</span>
                  </div>
                </div>
              ) : Array.isArray(phoneStats) && phoneStats.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Numéro
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                            Niche
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Messages
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                            Dernier envoi
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {phoneStats.map((stat, index) => (
                          <motion.tr
                            key={stat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                  <FiPhone className="text-orange-600" size={14} />
                                </div>
                                <span className="font-medium text-gray-900 text-sm">
                                  {stat.number}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                              {stat.userName}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {stat.niche || 'Non spécifiée'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className="font-semibold text-gray-900 text-sm">
                                {stat.messagesSent}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600 text-xs hidden lg:table-cell">
                              {formatDate(stat.lastUsed)}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                stat.lastMessageStatus === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {stat.lastMessageStatus === 'success' ? (
                                  <>
                                    <FiCheck className="mr-1" size={10} />
                                    Succès
                                  </>
                                ) : (
                                  <>
                                    <FiX className="mr-1" size={10} />
                                    Échec
                                  </>
                                )}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden">
                    {phoneStats.map((stat, index) => (
                      <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="table-mobile-card"
                      >
                        <div className="table-mobile-card-header">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            <FiPhone className="text-orange-600" size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {stat.number}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">{stat.userName}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                            stat.lastMessageStatus === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {stat.lastMessageStatus === 'success' ? (
                              <>
                                <FiCheck className="mr-1" size={10} />
                                Succès
                              </>
                            ) : (
                              <>
                                <FiX className="mr-1" size={10} />
                                Échec
                              </>
                            )}
                          </span>
                        </div>
                        
                        <div className="table-mobile-card-content">
                          <div className="table-mobile-field">
                            <span className="table-mobile-label">Niche</span>
                            <span className="table-mobile-value">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {stat.niche || 'Non spécifiée'}
                              </span>
                            </span>
                          </div>
                          <div className="table-mobile-field">
                            <span className="table-mobile-label">Messages</span>
                            <span className="table-mobile-value font-semibold">{stat.messagesSent}</span>
                          </div>
                          <div className="table-mobile-field" style={{gridColumn: '1 / -1'}}>
                            <span className="table-mobile-label">Dernier envoi</span>
                            <span className="table-mobile-value text-xs">{formatDate(stat.lastUsed)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FiEye className="mx-auto text-gray-400 mb-4" size={48} />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">Aucune donnée disponible</h4>
                    <p className="text-gray-500">Aucune statistique de numéro n'a été trouvée.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
} 