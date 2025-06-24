import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  deleteUser,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Création du contexte
const AuthContext = createContext();

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider pour encapsuler l'application
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Fonction pour s'inscrire
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mise à jour du profil
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      // Création du document utilisateur dans Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: displayName,
        email: email,
        createdAt: new Date(),
        donations: [],
        favorites: [],
        badges: [],
        emailVerified: false,
        firstLogin: true
      });
      
      // Envoyer un e-mail de vérification
      await sendEmailVerification(userCredential.user);
      
      // Déconnecter l'utilisateur immédiatement après l'inscription
      // pour qu'il soit obligé de se connecter après avoir vérifié son email
      await signOut(auth);
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour se connecter
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour vérifier si c'est la première connexion de l'utilisateur
  const checkFirstLogin = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        
        if (userDoc.exists() && userDoc.data().firstLogin === true) {
          // Mettre à jour le champ firstLogin à false
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            firstLogin: false
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de la première connexion:', error);
      return false;
    }
  };
  
  // Fonction pour se déconnecter
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour réinitialiser le mot de passe
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour mettre à jour le profil utilisateur
  const updateUserProfile = async (displayName) => {
    try {
      await updateProfile(auth.currentUser, { displayName });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: displayName
      });
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour mettre à jour l'avatar de l'utilisateur
  const updateUserAvatar = async (avatarPath) => {
    try {
      // Mettre à jour l'avatar dans Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        avatarPath: avatarPath
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      throw error;
    }
  };
  
  // Fonction pour mettre à jour l'email
  const updateUserEmail = async (email) => {
    try {
      await updateEmail(auth.currentUser, email);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        email: email
      });
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour mettre à jour le mot de passe (avec réauthentification)
  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      // Créer les informations d'identification pour la réauthentification
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email, 
        currentPassword
      );
      
      // Réauthentifier l'utilisateur
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Mettre à jour le mot de passe
      await updatePassword(auth.currentUser, newPassword);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  };
  
  // Fonction pour supprimer le compte
  const deleteUserAccount = async () => {
    try {
      // Supprimer le document utilisateur dans Firestore
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      
      // Supprimer le compte Firebase Auth
      await deleteUser(auth.currentUser);
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      
      // Propager l'erreur pour qu'elle puisse être gérée dans le composant
      throw error;
    }
  };
  
  // Fonction pour récupérer les dons de l'utilisateur
  const getUserDonations = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userDonations = userDoc.data().donations || [];
      
      // Récupérer les détails complets des dons depuis la collection 'donations'
      const donationsRef = collection(db, 'donations');
      const q = query(donationsRef, where('userId', '==', auth.currentUser.uid));
      const donationsSnapshot = await getDocs(q);
      
      const donations = [];
      donationsSnapshot.forEach((doc) => {
        donations.push({ id: doc.id, ...doc.data() });
      });
      
      return donations;
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour ajouter un don
  const addDonation = async (donationData) => {
    try {
      // Créer un nouveau document dans la collection 'donations'
      const donationRef = doc(collection(db, 'donations'));
      const donation = {
        ...donationData,
        userId: auth.currentUser.uid,
        email: donationData.email || auth.currentUser.email,
        createdAt: new Date(),
      };
      
      await setDoc(donationRef, donation);
      
      // Mettre à jour le tableau des dons dans le document utilisateur
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const donations = userData.donations || [];
      
      donations.push(donationRef.id);
      
      await updateDoc(userRef, {
        donations: donations
      });

      // Vérifier si ce don complète un objectif de collecte
      const goalCompletionResult = await checkGoalCompletion(donationData.association.id, auth.currentUser.uid);
      
      // Vérifier les autres badges potentiellement débloqués
      const badgeResults = await checkBadgesAfterDonation(donationData.association.id);
      
      // Fusionner les résultats
      const unlockedBadges = [];
      
      if (goalCompletionResult && goalCompletionResult.isNewBadge) {
        unlockedBadges.push({
          id: 'completer',
          name: 'Objectif atteint',
          image: require('../assets/dudu/dudu_chante.png')
        });
      }
      
      if (badgeResults && badgeResults.length > 0) {
        unlockedBadges.push(...badgeResults);
      }
      
      return {
        donationId: donationRef.id,
        unlockedBadges
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un don:', error);
      throw error;
    }
  };
  
  // Fonction pour vérifier les badges débloqués après un don
  const checkBadgesAfterDonation = async (associationId) => {
    try {
      // Récupérer les dons de l'utilisateur
      const donationsRef = collection(db, 'donations');
      const q = query(donationsRef, where('userId', '==', auth.currentUser.uid));
      const userDonationsSnapshot = await getDocs(q);
      
      if (userDonationsSnapshot.empty) return [];
      
      // Données pour le calcul des badges
      const userDonations = [];
      const donationsByAssociation = {};
      let totalAmount = 0;
      
      userDonationsSnapshot.forEach(doc => {
        const donation = doc.data();
        userDonations.push(donation);
        totalAmount += donation.amount || 0;
        
        // Compter les dons par association
        const assocId = donation.association.id;
        if (!donationsByAssociation[assocId]) {
          donationsByAssociation[assocId] = 0;
        }
        donationsByAssociation[assocId]++;
      });
      
      const unlockedBadges = [];
      const badgePromises = [];
      
      // Badge du premier don
      if (userDonations.length === 1) {
        badgePromises.push(
          unlockBadge('first_donation').then(result => {
            if (result.isNewBadge) {
              unlockedBadges.push({
                id: 'first_donation',
                name: 'Premier don',
                image: require('../assets/dudu/dudu_mignon_dans_un_bouquet_de_fleurs.png')
              });
            }
          })
        );
      }
      
      // Badge 100€ cumulés
      if (totalAmount >= 100) {
        badgePromises.push(
          unlockBadge('cumulated_100').then(result => {
            if (result.isNewBadge) {
              unlockedBadges.push({
                id: 'cumulated_100',
                name: 'Donateur généreux',
                image: require('../assets/dudu/dudu_a_la_muscu.png')
              });
            }
          })
        );
      }
      
      // Badge 1000€ cumulés
      if (totalAmount >= 1000) {
        badgePromises.push(
          unlockBadge('cumulated_1000').then(result => {
            if (result.isNewBadge) {
              unlockedBadges.push({
                id: 'cumulated_1000',
                name: 'Bienfaiteur',
                image: require('../assets/dudu/dudu_vole_il_est_un_ange.png')
              });
            }
          })
        );
      }
      
      // Badge 10 dons à la même association
      if (donationsByAssociation[associationId] >= 10) {
        badgePromises.push(
          unlockBadge('loyality').then(result => {
            if (result.isNewBadge) {
              unlockedBadges.push({
                id: 'loyality',
                name: 'Fidèle soutien',
                image: require('../assets/dudu/dudu_chevalier_veut_se_battre.png')
              });
            }
          })
        );
      }
      
      // Attendre que toutes les vérifications soient terminées
      await Promise.all(badgePromises);
      
      return unlockedBadges;
    } catch (error) {
      console.error('Erreur lors de la vérification des badges:', error);
      return [];
    }
  };
  
  // Fonction pour vérifier si un objectif est complété par ce don
  const checkGoalCompletion = async (associationId, userId) => {
    try {
      // Récupérer l'objectif de l'association
      const goalsRef = collection(db, 'goals');
      const q = query(goalsRef, where('associationId', '==', associationId));
      const goalsSnapshot = await getDocs(q);
      
      if (goalsSnapshot.empty) return null; // Pas d'objectif pour cette association
      
      // Récupérer le premier objectif (normalement un seul par association)
      const goalDoc = goalsSnapshot.docs[0];
      const goal = { id: goalDoc.id, ...goalDoc.data() };
      
      // Récupérer tous les dons pour cette association
      const donationsRef = collection(db, 'donations');
      const donationsQuery = query(donationsRef, where('association.id', '==', associationId));
      const donationsSnapshot = await getDocs(donationsQuery);
      
      // Calculer le total des dons depuis la création de l'objectif
      const goalCreationDate = goal.createdAt ? 
        (goal.createdAt.toDate ? goal.createdAt.toDate() : new Date(goal.createdAt)) : 
        new Date();
      
      let totalDonations = 0;
      
      donationsSnapshot.forEach((doc) => {
        const donation = doc.data();
        const donationDate = donation.createdAt && donation.createdAt.toDate 
          ? donation.createdAt.toDate() 
          : new Date(donation.createdAt || Date.now());
        
        if (donationDate.getTime() >= goalCreationDate.getTime()) {
          totalDonations += donation.amount || 0;
        }
      });
      
      // Vérifier si l'objectif est atteint exactement avec ce don
      // Nous considérons que c'est le cas si le total est supérieur ou égal à l'objectif
      // et que l'objectif n'est pas déjà marqué comme complété
      if (totalDonations >= goal.amount && !goal.completed) {
        // Marquer l'objectif comme complété
        await updateDoc(doc(db, 'goals', goalDoc.id), {
          completed: true,
          completedAt: new Date(),
          completedBy: userId
        });
        
        // Attribuer le badge 'completer' à l'utilisateur
        const badgeResult = await unlockBadge('completer');
        
        console.log(`Objectif ${goal.id} complété par l'utilisateur ${userId}`);
        
        return badgeResult;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la vérification de complétion d\'objectif:', error);
      // Ne pas propager l'erreur pour ne pas bloquer l'ajout du don
      return null;
    }
  };
  
  // Fonction pour mettre à jour le statut d'un don
  const updateDonationStatus = async (donationId, newStatus) => {
    try {
      // Mettre à jour le statut du don
      const donationRef = doc(db, 'donations', donationId);
      await updateDoc(donationRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      return donationId;
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour mettre à jour la préférence de reçu fiscal mensuel
  const updateDonationReceipt = async (donationId, monthlyReceipt) => {
    try {
      // Mettre à jour la préférence de reçu fiscal
      const donationRef = doc(db, 'donations', donationId);
      await updateDoc(donationRef, {
        monthlyReceipt: monthlyReceipt,
        updatedAt: new Date()
      });
      
      return donationId;
    } catch (error) {
      throw error;
    }
  };
  
  // Fonction pour récupérer les favoris de l'utilisateur
  const getUserFavorites = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur connecté');
      }
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const favorites = userDoc.data().favorites || [];
      
      // Récupérer les informations détaillées des associations favorites
      const favoriteAssociations = [];
      
      // Importer les données des associations
      const { associationsData } = require('../data/AssociationsData');
      
      // Parcourir toutes les catégories et associations pour trouver celles qui correspondent aux IDs favoris
      for (const category in associationsData) {
        for (const association of associationsData[category]) {
          if (favorites.includes(association.id)) {
            favoriteAssociations.push(association);
          }
        }
      }
      
      return favoriteAssociations;
    } catch (error) {
      console.error("Erreur lors de la récupération des favoris:", error);
      throw error;
    }
  };
  
  // Fonction pour ajouter une association aux favoris
  const addFavorite = async (associationId) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Veuillez vous connecter pour ajouter aux favoris');
      }
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Ajouter l'ID de l'association au tableau des favoris
      await updateDoc(userRef, {
        favorites: arrayUnion(associationId)
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout aux favoris:", error);
      throw error;
    }
  };
  
  // Fonction pour supprimer une association des favoris
  const removeFavorite = async (associationId) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Veuillez vous connecter pour supprimer des favoris');
      }
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Supprimer l'ID de l'association du tableau des favoris
      await updateDoc(userRef, {
        favorites: arrayRemove(associationId)
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression des favoris:", error);
      throw error;
    }
  };
  
  // Fonction pour récupérer les badges d'un utilisateur
  const getUserBadges = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      
      if (userDoc.exists() && userDoc.data().badges) {
        return userDoc.data().badges;
      }
      
      // Si l'utilisateur n'a pas encore de badges, initialiser un tableau vide
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des badges:', error);
      throw error;
    }
  };
  
  // Fonction pour débloquer un badge
  const unlockBadge = async (badgeId) => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Vérifier si l'utilisateur a déjà ce badge
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().badges && userDoc.data().badges.includes(badgeId)) {
        // L'utilisateur a déjà ce badge, ne rien faire
        return { success: true, isNewBadge: false };
      }
      
      // Ajouter le badge à la liste des badges de l'utilisateur
      await updateDoc(userRef, {
        badges: arrayUnion(badgeId)
      });
      
      return { success: true, isNewBadge: true, badgeId };
    } catch (error) {
      console.error('Erreur lors du déverrouillage du badge:', error);
      throw error;
    }
  };
  
  // Fonction pour mettre à jour tous les badges d'un utilisateur
  const updateUserBadges = async (badgeIds) => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Mettre à jour la liste complète des badges
      await updateDoc(userRef, {
        badges: badgeIds
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des badges:', error);
      throw error;
    }
  };
  
  // Fonction pour vérifier si l'e-mail de l'utilisateur est vérifié
  const checkEmailVerification = async () => {
    try {
      if (auth.currentUser) {
        // Recharger l'utilisateur pour obtenir le statut de vérification à jour
        await auth.currentUser.reload();
        const isVerified = auth.currentUser.emailVerified;
        
        // Mettre à jour le statut de vérification dans Firestore
        if (isVerified) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            emailVerified: true
          });
        }
        
        setEmailVerified(isVerified);
        return isVerified;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'e-mail:', error);
      return false;
    }
  };
  
  // Fonction pour renvoyer un e-mail de vérification
  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail de vérification:', error);
      throw error;
    }
  };
  
  // Observer le changement d'état d'authentification
  useEffect(() => {
    // Vérifier s'il y a un utilisateur dans AsyncStorage immédiatement
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur stocké:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Exécuter la vérification immédiatement
    checkStoredUser();
    
    // Configurer le listener pour les changements d'état d'authentification
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Créer l'objet utilisateur à stocker
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
        
        // Stocker l'utilisateur dans AsyncStorage pour la persistance de session
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        setCurrentUser(userData);
        
        // Vérifier l'état de vérification de l'e-mail à chaque connexion
        const isVerified = user.emailVerified;
        setEmailVerified(isVerified);
        
        // Mettre à jour le statut dans Firestore si nécessaire
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && isVerified && !userDoc.data().emailVerified) {
            await updateDoc(doc(db, 'users', user.uid), {
              emailVerified: true
            });
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour du statut de vérification:', error);
        }
      } else {
        // Supprimer l'utilisateur de AsyncStorage lors de la déconnexion
        await AsyncStorage.removeItem('user');
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    return () => {
      // Nettoyer le listener lors du démontage du composant
      unsubscribe();
    };
  }, []);
  
  const value = {
    currentUser,
    emailVerified,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserAvatar,
    updateUserEmail,
    updateUserPassword,
    deleteUserAccount,
    getUserDonations,
    addDonation,
    updateDonationStatus,
    updateDonationReceipt,
    getUserFavorites,
    addFavorite,
    removeFavorite,
    getUserBadges,
    unlockBadge,
    updateUserBadges,
    checkEmailVerification,
    resendVerificationEmail,
    checkFirstLogin
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 