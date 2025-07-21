import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLogOut, FiMenu, FiX, FiChevronDown, FiHome } from 'react-icons/fi';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 } 
    }
  };

  const logoVariants = {
    normal: { scale: 1 },
    hover: { 
      scale: 1.1,
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.5 }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 } 
    },
    hover: { 
      scale: 1.05,
      color: "#ffffff",
      transition: { duration: 0.2 }
    }
  };

  const mobileMenuVariants = {
    closed: { 
      opacity: 0,
      height: 0,
      transition: { 
        duration: 0.3,
        when: "afterChildren"
      }
    },
    open: { 
      opacity: 1,
      height: "auto",
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const dropdownVariants = {
    closed: { 
      opacity: 0,
      y: -10,
      pointerEvents: 'none',
      transition: { duration: 0.2 }
    },
    open: { 
      opacity: 1,
      y: 0,
      pointerEvents: 'auto',
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-30 ${
          scrolled 
            ? "bg-white bg-opacity-95 navbar-glassmorphism shadow-lg text-gray-800" 
            : "bg-gradient-to-r from-green-600 to-green-700 text-white"
        } transition-all duration-300`}
        variants={navbarVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and brand */}
            <Link to="/dashboard" className="flex items-center space-x-3">
              <motion.div 
                className="flex-shrink-0"
                variants={logoVariants}
                whileHover="hover"
              >
                <img 
                  src="/WhatsApp Image 2025-07-10 à 16.19.00_31d3e4f3.jpg" 
                  alt="Logo" 
                  className={`h-10 w-10 rounded-full ${scrolled ? 'border-2 border-green-500 shadow-md' : 'border border-white'} transition-all duration-300`} 
                />
              </motion.div>
              <motion.span 
                className={`text-xl font-bold ${scrolled ? 'text-green-600' : 'text-white'} transition-colors duration-300`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                WhatsLand
              </motion.span>
            </Link>
            
            {/* Desktop navigation */}
            {currentUser && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  to="/dashboard" 
                  className={`${scrolled ? 'text-gray-700 hover:text-green-700' : 'text-green-100 hover:text-white'} px-3 py-2 font-medium transition-colors duration-200 nav-link flex items-center space-x-1`}
                >
                  <FiHome className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="relative">
                  <motion.div 
                    className="flex items-center space-x-2 cursor-pointer btn-hover-effect px-3 py-1 rounded-full"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    whileHover={{ backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`h-9 w-9 rounded-full ${scrolled ? 'bg-green-500 shadow-md' : 'bg-white bg-opacity-20'} flex items-center justify-center transition-all duration-300`}>
                      <FiUser className="h-5 w-5 text-white" />
                    </div>
                    <span className={`${scrolled ? 'text-gray-700' : 'text-white'} font-medium transition-colors duration-300`}>
                      {currentUser.email.split('@')[0]}
                    </span>
                    <FiChevronDown className={`${scrolled ? 'text-gray-600' : 'text-green-100'} h-4 w-4 transition-colors duration-300`} />
                  </motion.div>
                  
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100 nav-dropdown-menu"
                        variants={dropdownVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500">Connecté en tant que</p>
                          <p className="text-sm font-medium text-gray-900 truncate mt-1">{currentUser.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200"
                        >
                          <FiLogOut className="h-4 w-4" />
                          <span>Déconnexion</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <motion.button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2 rounded-md ${
                  scrolled 
                    ? "text-gray-700 hover:bg-gray-100" 
                    : "text-white hover:bg-green-500"
                } transition-colors duration-300`}
                whileTap={{ scale: 0.9 }}
              >
                {showMobileMenu ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="md:hidden bg-white mobile-nav-enter"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {currentUser && (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center space-x-2"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FiHome className="h-5 w-5 text-gray-500" />
                      <span>Dashboard</span>
                    </Link>
                    <div className="px-3 py-2 border-t border-gray-100 mt-2">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-bold">
                            {currentUser.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-700 font-medium text-sm block">{currentUser.email.split('@')[0]}</span>
                          <span className="text-gray-500 text-xs">{currentUser.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-base font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md btn-glow"
                      >
                        <FiLogOut className="mr-2" /> Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      
      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16"></div>
    </>
  );
} 