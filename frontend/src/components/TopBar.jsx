<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiBell, FiMenu, FiX, FiSettings } from 'react-icons/fi';

export default function TopBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Fermer le menu mobile lors du changement de route
    return () => setIsMobileMenuOpen(false);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    // Fermer le menu mobile si ouvert
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo et titre - Toujours visible */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                WhatsLand
              </span>
            </div>
          </div>

          {/* Menu mobile - Bouton hamburger */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {isMobileMenuOpen ? (
                <FiX className="h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Menu desktop - Masqué sur mobile */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={() => setNotifications(prev => !prev)}
              >
                <FiBell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </button>
            </div>

            {/* Menu utilisateur */}
            <div className="relative">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                      {currentUser?.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {currentUser?.displayName || 'Utilisateur'}
                    </span>
                  </div>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiUser className="h-5 w-5" />
                  </button>
                </div>

                {/* Bouton déconnexion - visible sur desktop */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <FiLogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Se déconnecter</span>
                </button>
              </div>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100">
                  <div className="py-1">
                    <a
                      href="#profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                      Profil
                    </a>
                    <a
                      href="#settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiSettings className="mr-3 h-5 w-5 text-gray-400" />
                      Paramètres
                    </a>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu mobile - Panneau déroulant */}
        <div
          className={`${
            isMobileMenuOpen ? 'block' : 'hidden'
          } sm:hidden border-t border-gray-200 py-2`}
        >
          <div className="pt-2 pb-3 space-y-1">
            {/* Profil utilisateur mobile */}
            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <FiUser className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                  {currentUser?.email}
                </div>
                <div className="text-xs text-gray-500">
                  {currentUser?.displayName || 'Utilisateur'}
                </div>
              </div>
            </div>

            {/* Options du menu mobile */}
            <a
              href="#profile"
              className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiUser className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">Profil</span>
            </a>

            <a
              href="#settings"
              className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiSettings className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">Paramètres</span>
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiLogOut className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
=======
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
                    <a
                      href="/profile"
                      onClick={e => {
                        e.preventDefault();
                        setActiveTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors duration-150"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <FiUser className="mr-3" size={16} />
                      Mon Profil
                    </a>
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
>>>>>>> d9339f4a87a9dd8b0e67e9c093f4e0cf49e26be7
