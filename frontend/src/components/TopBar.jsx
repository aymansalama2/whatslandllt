import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiChevronDown,
  FiGlobe,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';

export default function TopBar({ activeTab, sidebarCollapsed }) {
  const { currentUser } = useAuth();
  const { userData } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = (tab) => {
    const titles = {
      status: 'Statut WhatsLand',
      statistics: 'Tableau de bord - Statistiques',
      profile: 'Mon Profil',
      messaging: 'Envoi de messages',
      admin: 'Administration système'
    };
    return titles[tab] || 'Dashboard';
  };

  const getPageDescription = (tab) => {
    const descriptions = {
      status: 'Vérifiez le statut de vos messages et de vos utilisateurs.',
      statistics: 'Analysez les performances de votre plateforme.',
      profile: 'Modifiez vos informations personnelles et votre mot de passe.',
      messaging: 'Envoyez des messages personnalisés à vos utilisateurs.',
      admin: 'Gérez les paramètres du système et les utilisateurs.'
    };
    return descriptions[tab] || 'Bienvenue sur votre tableau de bord.';
  };

  const getInitials = () => {
    const name = userData?.prenom || currentUser?.displayName;
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleLogout = () => {
    // Implement your logout logic here
    console.log('Logging out...');
    // For now, just close the menu
    setShowUserMenu(false);
  };

  return (
    <motion.header
      className="fixed top-0 right-0 h-16 bg-white/70 backdrop-blur-xl shadow-lg z-40 border-b border-white/20"
      style={{
        left: sidebarCollapsed ? '80px' : '280px'
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Page Title */}
        <div className="flex items-center space-x-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">
                {getPageTitle(activeTab).charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {getPageTitle(activeTab)}
              </h1>
              <p className="text-xs text-gray-600">
                {getPageDescription(activeTab)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Current Time */}
          <motion.div
            className="hidden md:flex items-center space-x-2 text-sm text-gray-600 bg-white/50 px-3 py-2 rounded-xl border border-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FiGlobe size={16} className="text-green-500" />
            <span className="font-medium">
              {currentTime.toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <span className="text-gray-400">•</span>
            <span>
              {currentTime.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </motion.div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 bg-white/50 hover:bg-white/70 rounded-xl transition-all duration-200 border border-white/30 shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">
                  {getInitials()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800">
                  {userData?.prenom || currentUser?.displayName || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-600">En ligne</p>
              </div>
              <FiChevronDown 
                size={16} 
                className={`text-gray-600 transition-transform duration-200 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 py-2 z-50"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-white/20 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">
                          {getInitials()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {userData?.prenom || currentUser?.displayName || 'Utilisateur'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors duration-150"
                    >
                      <FiUser className="mr-3" size={16} />
                      Mon Profil
                    </button>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors duration-150"
                    >
                      <FiSettings className="mr-3" size={16} />
                      Paramètres
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-white/20 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors duration-150"
                    >
                      <FiLogOut className="mr-3" size={16} />
                      Se déconnecter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
} 