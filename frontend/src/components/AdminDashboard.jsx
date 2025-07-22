import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export default function AdminDashboard() {
  const { allUsers } = useUser();
  const [activeTab, setActiveTab] = useState('users');
  const [phoneStats, setPhoneStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-800 p-4">
        <h2 className="text-2xl font-bold text-white">Tableau de bord administrateur</h2>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('niches')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'niches'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stats Niches
          </button>
          <button
            onClick={() => setActiveTab('numbers')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'numbers'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Numéros
          </button>
          <button
            onClick={() => setActiveTab('phone-niches')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'phone-niches'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stats Numéros
          </button>
        </nav>
      </div>

      <div className="p-4">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière mise à jour
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.nom} {user.prenom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.telephone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {user.niche}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'niches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(getNicheStats()).map(([niche, count]) => (
              <div key={niche} className="bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold text-gray-900">{niche}</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">{count}</p>
                <p className="text-sm text-gray-500">utilisateurs</p>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'phone-niches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(getPhoneNicheStats()).map(([niche, count]) => (
              <div key={niche} className="bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold text-gray-900">{niche}</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">{count}</p>
                <p className="text-sm text-gray-500">numéros de téléphone</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'numbers' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-4">Chargement des statistiques...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">{error}</div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={exportToExcel}
                    disabled={exporting || !Array.isArray(phoneStats) || phoneStats.length === 0}
                    className={`px-4 py-2 rounded-md text-white ${
                      exporting || !Array.isArray(phoneStats) || phoneStats.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {exporting ? 'Export en cours...' : 'Exporter en Excel'}
                  </button>
                </div>
                
                {Array.isArray(phoneStats) && phoneStats.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Numéro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Niche
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Messages envoyés
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dernier envoi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {phoneStats.map((stat) => (
                        <tr key={stat.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stat.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stat.userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {stat.niche || 'Non spécifiée'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stat.messagesSent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(stat.lastUsed)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              stat.lastMessageStatus === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {stat.lastMessageStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-4">Aucune statistique disponible</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 