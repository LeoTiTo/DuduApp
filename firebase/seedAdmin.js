import { db } from './config';
import { doc, setDoc, collection, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Initialise les données administrateurs pour les associations
 * Note: Ce script est à exécuter manuellement en développement pour créer les premiers administrateurs
 * 
 * @returns {Promise<void>}
 */
export const seedAdminData = async () => {
  try {
    console.log('Initialisation des données administrateurs...');
    
    // Exemple d'administrateurs
    const admins = [
      {
        userId: '2KEosjhR6NXXLuew85eg9K7dfIg1', // Remplacer par un vrai ID Firebase Auth
        associationId: '5', // France Alzheimer
        role: 'Trésorier',
        email: 'leo-harlay@outlook.fr', // Pour référence uniquement
        createdAt: serverTimestamp()
      }
    //   ,{
    //     userId: 'jLK9aBTw5HcP2sZnYmMm7LqOiU52', // Remplacer par un vrai ID Firebase Auth
    //     associationId: '1', // France Assos Santé
    //     role: 'Président',
    //     email: 'president@france-assos-sante.org', // Pour référence uniquement
    //     createdAt: serverTimestamp()
    //   },
    //   {
    //     userId: 'mNO4cUMw8IdX3sZtFgHh5JpRvT63', // Remplacer par un vrai ID Firebase Auth
    //     associationId: '6', // APF France Handicap
    //     role: 'Directeur',
    //     email: 'directeur@apf-francehandicap.org', // Pour référence uniquement
    //     createdAt: serverTimestamp()
    //   }
    ];
    
    // Ajouter les administrateurs à Firestore
    for (const admin of admins) {
      await setDoc(doc(db, 'admins', admin.userId), admin);
      console.log(`Administrateur ${admin.email} ajouté avec succès`);
    }
    
    console.log('Initialisation des données administrateurs terminée !');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données administrateurs:', error);
    throw error;
  }
};

/**
 * Supprime toutes les données administrateurs (à utiliser avec précaution, seulement en développement)
 * 
 * @returns {Promise<void>}
 */
export const clearAdminData = async () => {
  try {
    console.log('Suppression des données administrateurs...');
    
    const adminsRef = collection(db, 'admins');
    const adminsSnapshot = await getDocs(adminsRef);
    
    const deletePromises = [];
    adminsSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    
    console.log('Suppression des données administrateurs terminée !');
  } catch (error) {
    console.error('Erreur lors de la suppression des données administrateurs:', error);
    throw error;
  }
}; 