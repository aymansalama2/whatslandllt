import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function StatisticsWidget() {
  const [stats, setStats] = useState({
    globalStats: {
      total_recipients: 0,
      successful_deliveries: 0,
      failed_deliveries: 0,
      total_campaigns: 0
    },
    recentStats: {
      recent_recipients: 0,
      recent_successful: 0,
      recent_campaigns: 0
    },
    recentCampaigns: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/api/stats${currentUser ? `?uid=${currentUser.uid}` : ''}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des statistiques');
        }
        
        const data = await response.json();
        if (data.success) {
          // Vérifier et normaliser les données pour éviter les valeurs null
          const globalStats = data.globalStats || {};
          const recentStats = data.recentStats || {};
          
          setStats({
            globalStats: {
              total_recipients: globalStats.total_recipients || 0,
              successful_deliveries: globalStats.successful_deliveries || 0,
              failed_deliveries: globalStats.failed_deliveries || 0,
              total_campaigns: globalStats.total_campaigns || 0
            },
            recentStats: {
              recent_recipients: recentStats.recent_recipients || 0,
              recent_successful: recentStats.recent_successful || 0,
              recent_campaigns: recentStats.recent_campaigns || 0
            },
            recentCampaigns: data.recentCampaigns || []
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Actualiser les statistiques toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);
  
  // Calcul du taux de succès
  const successRate = stats.globalStats.total_recipients > 0
    ? Math.round((stats.globalStats.successful_deliveries / stats.globalStats.total_recipients) * 100)
    : 0;
    
  // Calcul du taux de succès récent
  const recentSuccessRate = stats.recentStats.recent_recipients > 0
    ? Math.round((stats.recentStats.recent_successful / stats.recentStats.recent_recipients) * 100)
    : 0;

  // Fonction pour afficher un indicateur de tendance
  const renderTrendIndicator = (value, good = true) => {
    if (value === 0) return null;
    
    const isPositive = value > 0;
    const color = (isPositive && good) || (!isPositive && !good) ? 'text-green-500' : 'text-red-500';
    
    return (
      <span className={`ml-1 ${color} flex items-center`}>
        {isPositive ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-28 bg-gray-100 rounded-xl"></div>
          <div className="h-28 bg-gray-100 rounded-xl"></div>
          <div className="h-28 bg-gray-100 rounded-xl"></div>
          <div className="h-28 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mt-8 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-20 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 border border-red-200 mb-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-600 font-medium">Une erreur est survenue lors du chargement des statistiques</p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm text-center border border-gray-100">
            <p className="text-sm text-gray-500">Total destinataires</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm text-center border border-gray-100">
            <p className="text-sm text-gray-500">Envois réussis</p>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm text-center border border-gray-100">
            <p className="text-sm text-gray-500">Taux de succès</p>
            <p className="text-2xl font-bold text-green-600">0%</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm text-center border border-gray-100">
            <p className="text-sm text-gray-500">Campagnes</p>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md transition-colors flex items-center mx-auto"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Vérifier si les données sont disponibles
  const noData = !stats.globalStats.total_campaigns && !stats.globalStats.total_recipients;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <h3 className="text-lg font-semibold">Statistiques d'envoi</h3>
      </div>
      
      <div className="p-6">
        {noData ? (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl mb-6 border border-blue-200">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 font-medium">Aucune donnée de campagne disponible. Les statistiques apparaîtront après votre premier envoi de messages.</p>
            </div>
          </div>
        ) : null}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl text-center border border-green-200 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-green-200 opacity-50"></div>
            <p className="text-sm text-green-600 mb-1">Total destinataires</p>
            <p className="text-3xl font-bold text-green-700">{stats.globalStats.total_recipients || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl text-center border border-blue-200 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-blue-200 opacity-50"></div>
            <p className="text-sm text-blue-600 mb-1">Envois réussis</p>
            <p className="text-3xl font-bold text-blue-700">{stats.globalStats.successful_deliveries || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl text-center border border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-emerald-200 opacity-50"></div>
            <p className="text-sm text-emerald-600 mb-1">Taux de succès</p>
            <div className="flex items-center justify-center">
              <p className="text-3xl font-bold text-emerald-700">{successRate}%</p>
              {renderTrendIndicator(successRate - 50)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full" 
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl text-center border border-purple-200 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-purple-200 opacity-50"></div>
            <p className="text-sm text-purple-600 mb-1">Campagnes</p>
            <p className="text-3xl font-bold text-purple-700">{stats.globalStats.total_campaigns || 0}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
            <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activité récente (24h)
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
              <div className="flex justify-between items-start">
                <svg className="h-6 w-6 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs text-blue-700 font-medium bg-blue-200 px-2 py-0.5 rounded-full">24h</span>
              </div>
              <p className="text-sm text-blue-600">Destinataires</p>
              <p className="text-2xl font-bold text-blue-700">{stats.recentStats.recent_recipients || 0}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm border border-green-200">
              <div className="flex justify-between items-start">
                <svg className="h-6 w-6 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-green-700 font-medium bg-green-200 px-2 py-0.5 rounded-full">24h</span>
              </div>
              <p className="text-sm text-green-600">Taux de succès</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-green-700">{recentSuccessRate}%</p>
                {renderTrendIndicator(recentSuccessRate - successRate)}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm border border-purple-200">
              <div className="flex justify-between items-start">
                <svg className="h-6 w-6 text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs text-purple-700 font-medium bg-purple-200 px-2 py-0.5 rounded-full">24h</span>
              </div>
              <p className="text-sm text-purple-600">Campagnes</p>
              <p className="text-2xl font-bold text-purple-700">{stats.recentStats.recent_campaigns || 0}</p>
            </div>
          </div>
        </div>
        
        {stats.recentCampaigns && stats.recentCampaigns.length > 0 ? (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Dernières campagnes
            </h4>
            
            <div className="overflow-hidden bg-gray-50 rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Destinataires</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Réussite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stats.recentCampaigns.map((campaign) => {
                      // Calculer le taux de succès
                      const campaignSuccess = campaign.totalRecipients > 0 
                        ? Math.round((campaign.successfulDeliveries / campaign.totalRecipients) * 100)
                        : 0;
                      
                      return (
                        <tr key={campaign.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                            {campaign.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(campaign.startDate).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {campaign.totalRecipients}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                campaignSuccess >= 80 ? 'bg-green-100 text-green-800' :
                                campaignSuccess >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {campaignSuccess}%
                              </span>
                              <div className="ml-2 w-12 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    campaignSuccess >= 80 ? 'bg-green-500' :
                                    campaignSuccess >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${campaignSuccess}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
        
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Les statistiques sont optimisées pour réduire le stockage. Seul le nombre de messages envoyés est enregistré, pas leur contenu.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 