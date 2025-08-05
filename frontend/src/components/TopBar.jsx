import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { FiUser, FiLogOut, FiBell } from 'react-icons/fi';

export default function TopBar({ activeTab, sidebarCollapsed }) {
  const { currentUser, logout } = useAuth();
  const { userData } = useUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'status':
        return 'État du Système';
      case 'statistics':
        return 'Statistiques';
      case 'profile':
        return 'Profil Utilisateur';
      case 'messaging':
        return 'Messagerie';
      case 'admin':
        return 'Administration';
      default:
        return 'Dashboard';
    }
  };

  return (
    <motion.div
      className="fixed top-0 right-0 z-40 h-16 bg-white/70 backdrop-blur-xl shadow-sm border-b border-white/20"
      style={{
        left: sidebarCollapsed ? '80px' : '280px'
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Page Title */}
        <h1 className="text-xl font-semibold text-gray-800">
          {getPageTitle()}
        </h1>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <FiBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-medium">
                {userData?.prenom?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-700">
                {userData?.prenom || currentUser?.email?.split('@')[0] || 'Utilisateur'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2"
              >
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Naviguer vers le profil
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <FiUser className="w-4 h-4" />
                  <span>Profil</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}