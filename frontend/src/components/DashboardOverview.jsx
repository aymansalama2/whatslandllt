import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import { 
  FiMessageSquare, 
  FiUsers, 
  FiTrendingUp, 
  FiActivity,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiClock
} from 'react-icons/fi';
import { useUser } from '../contexts/UserContext';
import { API_URL } from '../config/apiConfig';

export default function DashboardOverview() {
  const { userData } = useUser();
  const [stats, setStats] = useState({
    total_recipients: 0,
    successful_deliveries: 0,
    failed_deliveries: 0,
    total_campaigns: 0,
    recent_recipients: 0,
    recent_successful: 0,
    recent_campaigns: 0
  });
  const [phoneStats, setPhoneStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchPhoneStats();
  }, [userData]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats${userData ? `?uid=${userData.uid}` : ''}`);
      const data = await response.json();
      
      // Vérifier et nettoyer les données reçues
      const cleanedData = {
        total_recipients: Number(data.total_recipients) || 0,
        successful_deliveries: Number(data.successful_deliveries) || 0,
        failed_deliveries: Number(data.failed_deliveries) || 0,
        total_campaigns: Number(data.total_campaigns) || 0,
        recent_recipients: Number(data.recent_recipients) || 0,
        recent_successful: Number(data.recent_successful) || 0,
        recent_campaigns: Number(data.recent_campaigns) || 0
      };
      
      setStats(cleanedData);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      // Garder les valeurs par défaut en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const fetchPhoneStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/phone-stats${userData ? `?uid=${userData.uid}` : ''}`);
      const data = await response.json();
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setPhoneStats(data.slice(0, 5));
      } else {
        setPhoneStats([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques téléphoniques:', error);
      setPhoneStats([]);
    }
  };

  // Calculer les taux de succès avec vérification
  const successRate = stats.total_recipients > 0 
    ? ((stats.successful_deliveries || 0) / (stats.total_recipients || 1) * 100).toFixed(1)
    : 0;

  const recentSuccessRate = stats.recent_recipients > 0 
    ? ((stats.recent_successful || 0) / (stats.recent_recipients || 1) * 100).toFixed(1)
    : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm sm:text-base">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-6 lg:space-y-8"
    >
      {/* Header - Responsive */}
      <motion.div variants={itemVariants} className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-3">
          Tableau de bord
        </h2>
        <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
          Vue d'ensemble de vos performances et statistiques
        </p>
      </motion.div>

      {/* Main Stats Grid - Responsive */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
      >
        <StatsCard
          key="messages-sent"
          title="Messages envoyés"
          value={(stats.total_recipients || 0).toLocaleString()}
          icon={FiMessageSquare}
          color="blue"
          trend={stats.recent_recipients > 0 ? `+${stats.recent_recipients}` : '0'}
          trendLabel="cette semaine"
        />
        
        <StatsCard
          key="successful-deliveries"
          title="Livraisons réussies"
          value={(stats.successful_deliveries || 0).toLocaleString()}
          icon={FiCheckCircle}
          color="green"
          trend={`${successRate}%`}
          trendLabel="taux de succès"
        />
        
        <StatsCard
          key="failed-deliveries"
          title="Échecs de livraison"
          value={(stats.failed_deliveries || 0).toLocaleString()}
          icon={FiXCircle}
          color="red"
          trend={stats.total_recipients > 0 ? `${(100 - parseFloat(successRate)).toFixed(1)}%` : '0%'}
          trendLabel="taux d'échec"
        />
        
        <StatsCard
          key="total-campaigns"
          title="Campagnes totales"
          value={(stats.total_campaigns || 0).toLocaleString()}
          icon={FiActivity}
          color="purple"
          trend={stats.recent_campaigns > 0 ? `+${stats.recent_campaigns}` : '0'}
          trendLabel="récemment"
        />
      </motion.div>

      {/* Performance Section - Responsive */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
      >
        {/* Performance Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 flex items-center">
                <FiTrendingUp className="mr-2 sm:mr-3 text-green-500" size={window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28} />
                Performance
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Analyse des dernières activités</p>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                {recentSuccessRate}%
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Succès récent</div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl border border-green-100">
              <div className="flex items-center mb-2 sm:mb-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <FiCheckCircle className="text-green-600" size={window.innerWidth < 640 ? 16 : 20} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm sm:text-base">Messages réussis</p>
                  <p className="text-xs sm:text-sm text-gray-600">Dernière semaine</p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-green-600 text-right sm:text-left">
                {(stats.recent_successful || 0).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-100">
              <div className="flex items-center mb-2 sm:mb-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FiUsers className="text-blue-600" size={window.innerWidth < 640 ? 16 : 20} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm sm:text-base">Destinataires récents</p>
                  <p className="text-xs sm:text-sm text-gray-600">Dernière semaine</p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-blue-600 text-right sm:text-left">
                {(stats.recent_recipients || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Top Phone Numbers Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/30">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
            <FiPhone className="mr-2 sm:mr-3 text-purple-500" size={window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28} />
            Top numéros
          </h3>
          
          {phoneStats.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {phoneStats.map((phone, index) => (
                <motion.div
                  key={phone.phone_number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-purple-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center mb-2 sm:mb-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-purple-600 font-bold text-xs sm:text-sm">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                        {phone.phone_number}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {phone.success_count || 0} succès / {phone.total_count || 0} total
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 justify-end sm:justify-start">
                    <div className="text-right sm:text-left">
                      <div className="text-sm sm:text-base font-bold text-purple-600">
                        {phone.total_count > 0 ? 
                          `${((phone.success_count / phone.total_count) * 100).toFixed(0)}%` : 
                          '0%'
                        }
                      </div>
                      <div className="text-xs text-gray-500">succès</div>
                    </div>
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                      phone.total_count > 0 && (phone.success_count / phone.total_count) > 0.8 
                        ? 'bg-green-400' 
                        : phone.total_count > 0 && (phone.success_count / phone.total_count) > 0.5 
                        ? 'bg-yellow-400' 
                        : 'bg-red-400'
                    }`}></div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FiPhone className="text-gray-400" size={window.innerWidth < 640 ? 20 : 24} />
              </div>
              <p className="text-gray-500 text-sm sm:text-base">Aucune donnée disponible</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Commencez à envoyer des messages pour voir les statistiques</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions - Responsive */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/30"
      >
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <FiClock className="mr-2 sm:mr-3 text-orange-500" size={window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28} />
          Actions rapides
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <motion.div
            key="new-message"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl border border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <FiMessageSquare className="text-white" size={window.innerWidth < 640 ? 16 : 20} />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Nouveau message</h4>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Envoyer un message à vos contacts</p>
          </motion.div>

          <motion.div
            key="manage-contacts"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl border border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <FiUsers className="text-white" size={window.innerWidth < 640 ? 16 : 20} />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Gérer contacts</h4>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Organiser votre liste de contacts</p>
          </motion.div>

          <motion.div
            key="view-reports"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl border border-purple-200 cursor-pointer hover:shadow-lg transition-all duration-200 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <FiTrendingUp className="text-white" size={window.innerWidth < 640 ? 16 : 20} />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Voir rapports</h4>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Analyser vos performances détaillées</p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
} 