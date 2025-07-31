import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WhatsLandStatus from '../components/WhatsLandStatus';
import MessageSender from '../components/MessageSender';
import UserProfile from '../components/UserProfile';
import AdminDashboard from '../components/AdminDashboard';
import StatisticsWidget from '../components/StatisticsWidget';
import DashboardOverview from '../components/DashboardOverview';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/apiConfig';

export default function Dashboard() {
  const { isAdmin, isSuperAdmin, isProfileComplete, userData } = useUser();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('status');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [whatsappReady, setWhatsappReady] = useState(false);

  // Listen to sidebar collapse state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check WhatsApp status
  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`);
        const data = await response.json();
        console.log('WhatsApp Status:', data); // Debug log
        setWhatsappReady(data.whatsappReady || false);
      } catch (error) {
        console.error('Erreur lors de la vérification du statut WhatsApp:', error);
        setWhatsappReady(false);
      }
    };

    checkWhatsAppStatus();
    
    // Vérifier le statut toutes les 5 secondes
    const interval = setInterval(checkWhatsAppStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    const contentVariants = {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.2 }
      }
    };

    switch (activeTab) {
      case 'status':
        return (
          <motion.div
            key="status"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <WhatsLandStatus />
          </motion.div>
        );
      case 'statistics':
        return (
          <motion.div
            key="statistics"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <DashboardOverview />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div
            key="profile"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <UserProfile />
          </motion.div>
        );
      case 'messaging':
        if (!isProfileComplete()) {
          return (
            <motion.div
              key="messaging-blocked"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Profil incomplet
                </h3>
                <p className="text-gray-600 mb-6">
                  Veuillez compléter votre profil avant d'accéder à la messagerie.
                </p>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
                >
                  Compléter mon profil
                </button>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div
            key="messaging"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <MessageSender whatsappReady={whatsappReady} />
          </motion.div>
        );
      case 'admin':
        if (!isAdmin) {
          return (
            <motion.div
              key="admin-blocked"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Accès restreint
                </h3>
                <p className="text-gray-600">
                  Vous n'avez pas les permissions nécessaires pour accéder à cette section.
                </p>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div
            key="admin"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <AdminDashboard />
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="default"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <WhatsLandStatus />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Top Bar */}
      <TopBar 
        activeTab={activeTab} 
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className="transition-all duration-200 pt-20 pb-8 px-4 md:px-6"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px'
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/30 relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full transform translate-x-16 -translate-y-16"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Bonjour, {userData?.prenom || currentUser?.displayName || 'Utilisateur'} 👋
                  </h2>
                  <p className="text-gray-600">
                    Bienvenue sur votre tableau de bord WhatsLand. Gérez vos campagnes et suivez vos performances.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg relative">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                    <svg className="w-10 h-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* WhatsApp Status Card */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={`bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border relative overflow-hidden ${
              whatsappReady 
                ? 'border-green-200/50 bg-gradient-to-br from-green-50/30 to-emerald-50/30' 
                : 'border-red-200/50 bg-gradient-to-br from-red-50/30 to-orange-50/30'
            }`}>
              {/* Status indicator background */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full transform translate-x-12 -translate-y-12 ${
                whatsappReady 
                  ? 'bg-gradient-to-br from-green-300/20 to-emerald-300/20' 
                  : 'bg-gradient-to-br from-red-300/20 to-orange-300/20'
              }`}></div>
              
              <div className="relative z-10 flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  whatsappReady 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {whatsappReady ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Statut de WhatsLand
                  </h3>
                  <p className={`text-sm ${whatsappReady ? 'text-green-600' : 'text-red-600'}`}>
                    {whatsappReady ? 'WhatsLand est connecté et prêt!' : 'WhatsLand n\'est pas connecté'}
                  </p>
                </div>
                {whatsappReady && (
                  <div className="ml-auto">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              
              {!whatsappReady && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <p className="text-sm text-gray-600 mb-3">
                    Instructions
                  </p>
                  <p className="text-sm text-gray-500">
                    Vous pouvez maintenant envoyer des messages.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Content based on active tab */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {activeTab === 'status' && <WhatsLandStatus />}
            {activeTab === 'statistics' && <DashboardOverview />}
            {activeTab === 'profile' && <UserProfile />}
            {activeTab === 'messaging' && <MessageSender whatsappReady={whatsappReady} />}
            {activeTab === 'admin' && <AdminDashboard />}
          </motion.div>
        </div>
      </main>
    </div>
  );
} 