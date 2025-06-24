import { 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';

// Collection Firebase des administrateurs
const ADMINS_COLLECTION = 'admins';

/**
 * Vérifie si un utilisateur est administrateur d'une association
 * 
 * @param {string} userId - ID de l'utilisateur Firebase
 * @returns {Promise<Object|null>} - Données administrateur ou null
 */
export const checkIfAdmin = async (userId) => {
  try {
    const adminRef = doc(db, ADMINS_COLLECTION, userId);
    const adminDoc = await getDoc(adminRef);
    
    if (adminDoc.exists()) {
      return { id: adminDoc.id, ...adminDoc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la vérification admin:', error);
    throw error;
  }
};

/**
 * Récupère tous les dons pour une association spécifique
 * 
 * @param {string} associationId - ID de l'association
 * @returns {Promise<Array>} - Liste des dons
 */
export const getAssociationDonations = async (associationId) => {
  try {
    const donationsRef = collection(db, 'donations');
    const q = query(
      donationsRef, 
      where('association.id', '==', associationId),
      orderBy('createdAt', 'desc')
    );
    
    const donationsSnapshot = await getDocs(q);
    const donations = [];
    
    donationsSnapshot.forEach((doc) => {
      donations.push({ id: doc.id, ...doc.data() });
    });
    
    return donations;
  } catch (error) {
    console.error('Erreur lors de la récupération des dons de l\'association:', error);
    throw error;
  }
};

/**
 * Récupère le montant total des dons pour une association par année
 * 
 * @param {string} associationId - ID de l'association
 * @returns {Promise<Object>} - Montant total par année
 */
export const getDonationTotalsByYear = async (associationId) => {
  try {
    const donations = await getAssociationDonations(associationId);
    const totalsByYear = {};
    
    donations.forEach((donation) => {
      // Conversion de la date de Firestore
      const donationDate = donation.createdAt instanceof Timestamp 
        ? donation.createdAt.toDate() 
        : new Date(donation.createdAt);
      
      const year = donationDate.getFullYear();
      
      if (!totalsByYear[year]) {
        totalsByYear[year] = 0;
      }
      
      totalsByYear[year] += donation.amount;
    });
    
    return totalsByYear;
  } catch (error) {
    console.error('Erreur lors du calcul des totaux par année:', error);
    throw error;
  }
};

/**
 * Récupère les dons récurrents pour une association
 * 
 * @param {string} associationId - ID de l'association
 * @returns {Promise<Array>} - Liste des dons récurrents
 */
export const getRecurringDonations = async (associationId) => {
  try {
    const donationsRef = collection(db, 'donations');
    const q = query(
      donationsRef,
      where('association.id', '==', associationId),
      where('isRecurrent', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const donationsSnapshot = await getDocs(q);
    const recurringDonations = [];
    
    donationsSnapshot.forEach((doc) => {
      recurringDonations.push({ id: doc.id, ...doc.data() });
    });
    
    return recurringDonations;
  } catch (error) {
    console.error('Erreur lors de la récupération des dons récurrents:', error);
    throw error;
  }
};

/**
 * Ajoute un nouvel administrateur pour une association
 * 
 * @param {string} userId - ID de l'utilisateur Firebase
 * @param {string} associationId - ID de l'association
 * @param {string} role - Rôle de l'administrateur (ex: "trésorier", "président")
 * @returns {Promise<void>}
 */
export const addAssociationAdmin = async (userId, associationId, role) => {
  try {
    await setDoc(doc(db, ADMINS_COLLECTION, userId), {
      userId,
      associationId,
      role,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un administrateur:', error);
    throw error;
  }
};

/**
 * Récupère l'objectif de dons pour une association
 * 
 * @param {string} associationId - ID de l'association
 * @returns {Promise<Object|null>} - Données de l'objectif ou null
 */
export const getAssociationGoal = async (associationId) => {
  try {
    const goalsRef = collection(db, 'goals');
    const q = query(goalsRef, where('associationId', '==', associationId));
    
    const goalsSnapshot = await getDocs(q);
    
    if (goalsSnapshot.empty) {
      return null;
    }
    
    // Retourner le premier objectif trouvé (normalement un seul par association)
    const goalDoc = goalsSnapshot.docs[0];
    return { id: goalDoc.id, ...goalDoc.data() };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'objectif:', error);
    throw error;
  }
};

/**
 * Met à jour ou crée l'objectif de dons pour une association
 * 
 * @param {string} associationId - ID de l'association
 * @param {Object} goalData - Données de l'objectif
 * @returns {Promise<string>} - ID de l'objectif
 */
export const updateAssociationGoal = async (associationId, goalData) => {
  try {
    // Vérifier si un objectif existe déjà
    const existingGoal = await getAssociationGoal(associationId);
    
    if (existingGoal) {
      // Mettre à jour l'objectif existant
      const goalRef = doc(db, 'goals', existingGoal.id);
      await updateDoc(goalRef, goalData);
      return existingGoal.id;
    } else {
      // Créer un nouvel objectif
      const goalsRef = collection(db, 'goals');
      const newGoalRef = doc(goalsRef);
      await setDoc(newGoalRef, {
        ...goalData,
        createdAt: serverTimestamp()
      });
      return newGoalRef.id;
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'objectif:', error);
    throw error;
  }
};

/**
 * Supprime l'objectif de dons d'une association
 * 
 * @param {string} associationId - ID de l'association
 * @returns {Promise<boolean>} - true si supprimé avec succès, false si aucun objectif trouvé
 */
export const deleteAssociationGoal = async (associationId) => {
  try {
    // Récupérer l'objectif existant
    const existingGoal = await getAssociationGoal(associationId);
    
    if (existingGoal) {
      // Supprimer l'objectif
      const goalRef = doc(db, 'goals', existingGoal.id);
      await deleteDoc(goalRef);
      return true;
    } else {
      // Aucun objectif trouvé
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'objectif:', error);
    throw error;
  }
}; 