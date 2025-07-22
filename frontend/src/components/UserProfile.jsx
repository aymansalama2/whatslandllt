import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`}`}`}`;
const NICHE_OPTIONS = [
  'E-commerce',
  'Immobilier',
  'Formation',
  'Santé et Bien-être',
  'Services aux entreprises',
  'Restauration',
  'Mode et Beauté',
  'Technologie',
  'Autre'
];

export default function UserProfile() {
  const { currentUser } = useAuth();
  const { userData, updateUserProfile } = useUser();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    niche: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        telephone: userData.telephone || '',
        email: userData.email || '',
        niche: userData.niche || ''
      });
    }
    
    if (currentUser?.email) {
      // Generate avatar with initials
      const initials = currentUser.email.charAt(0).toUpperCase();
      setAvatar(initials);
    }
  }, [userData, currentUser]);

  // Fonction pour synchroniser le profil avec le backend
  const syncProfileWithBackend = async (profileData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          ...profileData
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.warn("Avertissement: Synchronisation backend non réussie", data.message);
      } else {
        console.log("Profil synchronisé avec le backend");
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation avec le backend:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Mettre à jour le profil dans Firebase
      await updateUserProfile(formData);
      
      // Synchroniser avec le backend SQLite
      await syncProfileWithBackend(formData);
      
      setSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Mon Profil
        </h2>
      </div>

      <div className="p-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center mb-8 pb-6 border-b border-gray-200">
          <div className="flex-shrink-0 mb-4 md:mb-0">
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {avatar}
            </div>
          </div>
          <div className="md:ml-6 text-center md:text-left">
            <h3 className="text-xl font-semibold text-gray-800">
              {formData.prenom ? `${formData.prenom} ${formData.nom}` : currentUser?.email}
            </h3>
            <p className="text-gray-600">{currentUser?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {formData.niche || "Niche non spécifiée"}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Inscrit depuis {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('fr-FR') : "N/A"}
              </span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg flex items-center animate-pulse">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Profil mis à jour avec succès!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  placeholder="Votre prénom"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  placeholder="Votre nom de famille"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                  placeholder="+212 6XX XXX XXX"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Format international recommandé</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email || currentUser?.email}
                  onChange={handleChange}
                  required
                  disabled
                  className="pl-10 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Email non modifiable (lié à votre compte)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niche
            </label>
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <select
                name="niche"
                value={formData.niche}
                onChange={handleChange}
                required
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                <option value="">Sélectionnez votre niche</option>
                {NICHE_OPTIONS.map(niche => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">La niche vous permet de segmenter vos campagnes</p>
          </div>

          <div className="border-t pt-6 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mise à jour en cours...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mettre à jour le profil
                </>
              )}
            </button>
          </div>

          <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 flex items-center">
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pourquoi ces informations ?
            </h3>
            <p className="mt-1 text-xs text-blue-600">
              Ces informations sont utilisées pour personnaliser votre expérience et segmenter vos campagnes WhatsApp. 
              Votre niche permet de mieux organiser vos listes de numéros et d'adapter vos messages.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 