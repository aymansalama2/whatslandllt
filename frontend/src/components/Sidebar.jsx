import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiActivity, 
  FiUser, 
  FiMessageSquare, 
  FiSettings, 
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiWifi,
  FiBarChart
} from 'react-icons/fi';

export default function Sidebar({ activeTab, setActiveTab, onCollapseChange }) {
  const { currentUser, logout } = useAuth();
  const { isAdmin, userData } = useUser();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notify parent component when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const menuItems = [
    {
      id: 'status',
      label: 'Statut WhatsLand',
      icon: FiWifi,
      color: 'from-blue-500 to-blue-600',
      description: 'État de la connexion'
    },
    {
      id: 'statistics',
      label: 'Statistiques',
      icon: FiBarChart,
      color: 'from-purple-500 to-purple-600',
      description: 'Analytics & métriques'
    },
    {
      id: 'profile',
      label: 'Mon Profil',
      icon: FiUser,
      color: 'from-green-500 to-green-600',
      description: 'Informations personnelles'
    },
    {
      id: 'messaging',
      label: 'Envoi de messages',
      icon: FiMessageSquare,
      color: 'from-orange-500 to-orange-600',
      description: 'Campagnes WhatsApp'
    }
  ];

  if (isAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'Administration',
      icon: FiSettings,
      color: 'from-red-500 to-red-600',
      description: 'Gestion système'
    });
  }

  const sidebarVariants = {
    expanded: {
      width: 280,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    collapsed: {
      width: 80,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  const getInitials = () => {
    if (!userData?.prenom) return 'U';
    const names = userData.prenom.split(' ');
    return names.map(name => name[0]).join('').toUpperCase();
  };

  return (
    <motion.div
      className="fixed left-0 top-0 h-full bg-white/70 backdrop-blur-xl shadow-2xl z-50 flex flex-col border-r border-white/20"
      variants={sidebarVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      initial="expanded"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/20 bg-gradient-to-br from-white/10 to-white/5">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  <span className="text-white font-bold text-lg relative z-10">W</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">WhatsLand</h1>
                  <p className="text-xs text-gray-600">Dashboard</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-all duration-200 shadow-sm border border-white/30"
          >
            {isCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-white/50 hover:text-gray-800'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Active indicator background */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
              
              <Icon 
                size={20} 
                className={`flex-shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-gray-600 group-hover:text-green-600'
                }`}
              />
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`ml-3 font-medium transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-800'
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              <AnimatePresence>
                {isCollapsed && hoveredItem === item.id && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
                  >
                    {item.label}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/20 bg-gradient-to-br from-white/10 to-white/5">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="flex items-center space-x-3 p-3 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {userData?.prenom || currentUser?.displayName || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {currentUser?.email || 'utilisateur@email.com'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-3 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-2xl transition-all duration-200 group border border-red-200/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiLogOut size={20} className="group-hover:scale-110 transition-transform duration-200" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 font-medium"
              >
                Se déconnecter
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
} 