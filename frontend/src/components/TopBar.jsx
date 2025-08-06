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