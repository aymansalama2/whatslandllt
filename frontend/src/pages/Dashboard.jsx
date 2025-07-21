import { useState, useEffect } from 'react';
import WhatsLandStatus from '../components/WhatsLandStatus';
import MessageSender from '../components/MessageSender';
import UserProfile from '../components/UserProfile';
import AdminDashboard from '../components/AdminDashboard';
import StatisticsWidget from '../components/StatisticsWidget';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { isAdmin, isProfileComplete, userData } = useUser();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('status');
  const [stats, setStats] = useState({
    messagesSent: 0,
    phoneNumbers: 0,
    lastSent: null
  });

  useEffect(() => {
    // Get basic stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/status`);
        const data = await response.json();
        // Additional stats could be fetched here in a real implementation
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
      }
    };

    fetchStats();
  }, []);

  const renderTabs = () => {
    const tabs = [
      { id: 'status', label: 'Statut WhatsLand', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'statistics', label: 'Statistiques', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { id: 'profile', label: 'Mon Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
    ];

    if (isProfileComplete()) {
      tabs.push({ 
        id: 'messaging', 
        label: 'Envoi de messages', 
        icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' 
      });
    }

    if (isAdmin) {
      tabs.push({ 
        id: 'admin', 
        label: 'Administration',
        icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
      });
    }

    return (
      <div className="flex mb-6 space-x-3 bg-white p-3 rounded-xl shadow-md overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-103'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderDashboardHeader = () => {
    return (
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 shadow-xl col-span-2 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-400 opacity-20"></div>
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white opacity-10"></div>
          <h2 className="text-2xl font-bold relative z-10">Bienvenue, {userData?.prenom || currentUser?.email?.split('@')[0] || 'Utilisateur'} !</h2>
          <p className="mt-2 opacity-90 relative z-10">Utilisez cette plateforme pour votre connectivité sans frontières</p>
          
          <div className="mt-4 flex flex-wrap gap-2 relative z-10">
            {isProfileComplete() ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Profil complet
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-200 text-yellow-800"
                onClick={() => setActiveTab('profile')}
                style={{cursor: 'pointer'}}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Profil incomplet
              </span>
            )}
            
            {isAdmin && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Administrateur
              </span>
            )}
            
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {userData?.niche || "Niche non spécifiée"}
            </span>
          </div>
        </div>
        
        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-md p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Aperçu rapide</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-xl font-bold text-gray-800">
                {new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'})}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">Heure</p>
              <div className="flex items-center">
                <p className="text-xl font-bold text-gray-800">
                  {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                </p>
                <div className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'status':
        return (
          <>
            {renderDashboardHeader()}
            <WhatsLandStatus />
          </>
        );
      case 'statistics':
        return (
          <>
            {renderDashboardHeader()}
            <StatisticsWidget />
          </>
        );
      case 'profile':
        return <UserProfile />;
      case 'messaging':
        if (!isProfileComplete()) {
          return (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-xl shadow-md">
              <div className="flex items-center">
                <svg className="h-8 w-8 mr-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-bold text-lg">Profil incomplet</p>
                  <p>Veuillez compléter votre profil avant d'envoyer des messages.</p>
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-colors shadow-md"
                  >
                    Compléter mon profil
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return <MessageSender whatsappReady={true} />;
      case 'admin':
        if (!isAdmin) {
          return (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-700 p-6 rounded-xl shadow-md">
              <div className="flex items-center">
                <svg className="h-8 w-8 mr-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-bold text-lg">Accès refusé</p>
                  <p>Vous n'avez pas les droits d'accès à cette section administrative.</p>
                </div>
              </div>
            </div>
          );
        }
        return <AdminDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {renderTabs()}
      <div className="transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
} 