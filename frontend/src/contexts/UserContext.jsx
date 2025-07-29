import { createContext, useContext, useState, useEffect } from 'react';
import { ref, set, get, onValue, remove, update } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { database, ADMIN_EMAILS, SUPER_ADMIN_EMAIL, auth } from '../firebase/config';

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [messageHistory, setMessageHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est admin ou super admin
  useEffect(() => {
    if (currentUser) {
      const userIsAdmin = ADMIN_EMAILS.includes(currentUser.email);
      const userIsSuperAdmin = currentUser.email === SUPER_ADMIN_EMAIL;
      
      setIsAdmin(userIsAdmin || userIsSuperAdmin);
      setIsSuperAdmin(userIsSuperAdmin);
    } else {
      setIsAdmin(false);
      setIsSuperAdmin(false);
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

  // Créer un nouvel utilisateur (pour le super admin)
  const createUser = async (userData, password) => {
    if (!isSuperAdmin) {
      throw new Error("Permission refusée: Seul le super admin peut créer des utilisateurs");
    }
    
    try {
      // Créer l'utilisateur avec Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const newUser = userCredential.user;
      
      // Sauvegarder les données utilisateur dans la base de données
      await set(ref(database, `users/${newUser.uid}`), {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAdmin: userData.isAdmin || false
      });
      
      return { uid: newUser.uid, ...userData };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  };

  // Mettre à jour un utilisateur (pour le super admin)
  const updateUser = async (uid, userData) => {
    if (!isSuperAdmin) {
      throw new Error("Permission refusée: Seul le super admin peut modifier les utilisateurs");
    }
    
    try {
      await update(ref(database, `users/${uid}`), {
        ...userData,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  };

  // Changer le rôle d'un utilisateur (admin/utilisateur normal)
  const toggleUserRole = async (uid, isUserAdmin) => {
    if (!isSuperAdmin) {
      throw new Error("Permission refusée: Seul le super admin peut modifier les rôles");
    }
    
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      
      if (!userData) {
        throw new Error("Utilisateur non trouvé");
      }
      
      // Mettre à jour le rôle de l'utilisateur
      await update(userRef, {
        isAdmin: isUserAdmin,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      throw error;
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (uid) => {
    if (!isSuperAdmin) {
      throw new Error("Permission refusée: Seul le super admin peut supprimer des utilisateurs");
    }
    
    try {
      // Supprimer l'utilisateur de la base de données
      await remove(ref(database, `users/${uid}`));
      
      // Supprimer également les messages associés
      await remove(ref(database, `messages/${uid}`));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
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
    isSuperAdmin,
    allUsers,
    messageHistory,
    loading,
    updateUserProfile,
    createUser,
    updateUser,
    toggleUserRole,
    deleteUser,
    saveMessageHistory,
    isProfileComplete
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
} 