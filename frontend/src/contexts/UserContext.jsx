import { createContext, useContext, useState, useEffect } from 'react';
import { ref, set, get, onValue } from 'firebase/database';
import { useAuth } from './AuthContext';
import { database, ADMIN_EMAIL } from '../firebase/config';

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [messageHistory, setMessageHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (currentUser) {
      setIsAdmin(currentUser.email === ADMIN_EMAIL);
    }
  }, [currentUser]);

  // Charger les données de l'utilisateur
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      setUserData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Charger tous les utilisateurs si admin
  useEffect(() => {
    if (!isAdmin) return;

    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.entries(data).map(([uid, userData]) => ({
          uid,
          ...userData
        }));
        setAllUsers(usersArray);
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Charger l'historique des messages
  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = isAdmin 
      ? ref(database, 'messages')
      : ref(database, `messages/${currentUser.uid}`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.entries(data).map(([id, messageData]) => ({
          id,
          ...messageData
        }));
        setMessageHistory(messagesArray);
      }
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  // Sauvegarder les informations de l'utilisateur
  const updateUserProfile = async (profileData) => {
    if (!currentUser) return;
    
    try {
      await set(ref(database, `users/${currentUser.uid}`), {
        ...profileData,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  };

  // Sauvegarder l'historique des messages
  const saveMessageHistory = async (messageData) => {
    if (!currentUser) return;
    
    try {
      const messageRef = ref(database, `messages/${currentUser.uid}/${Date.now()}`);
      await set(messageRef, {
        ...messageData,
        timestamp: new Date().toISOString(),
        userEmail: currentUser.email
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
      throw error;
    }
  };

  // Vérifier si le profil est complet
  const isProfileComplete = () => {
    if (!userData) return false;
    return !!(
      userData.nom &&
      userData.prenom &&
      userData.telephone &&
      userData.email
    );
  };

  const value = {
    userData,
    isAdmin,
    allUsers,
    messageHistory,
    loading,
    updateUserProfile,
    saveMessageHistory,
    isProfileComplete
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
} 