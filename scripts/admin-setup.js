// Script pour initialiser les administrateurs dans Firebase
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Vérifier si le dossier config existe, sinon le créer
const configDir = path.join(__dirname, '../config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir);
  console.log('Dossier config créé.');
}

// Vérifier si le fichier de clé existe
const serviceAccountPath = path.join(configDir, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Erreur: Le fichier de clé de service est manquant!');
  console.error(`Veuillez placer votre fichier serviceAccountKey.json dans le dossier ${configDir}`);
  console.error('Vous pouvez obtenir ce fichier depuis la console Firebase:');
  console.error('1. Allez sur https://console.firebase.google.com/');
  console.error('2. Ouvrez votre projet > Paramètres du projet > Comptes de service');
  console.error('3. Cliquez sur "Générer une nouvelle clé privée"');
  process.exit(1);
}

// Charger la clé de service
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialiser l'application avec les privilèges admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Initialise les données administrateurs pour les associations
 */
async function seedAdminData() {
  try {
    console.log('Initialisation des données administrateurs...');
    
    // Exemple d'administrateurs
    const admins = [
      {
        userId: 'TKF9e6BmgXaYP8AvZmhZtZsLpUh1', // Remplacer par un vrai ID Firebase Auth
        associationId: '5', // France Alzheimer
        role: 'Trésorier',
        email: 'admin@francealzheimer.org', // Pour référence uniquement
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        userId: 'jLK9aBTw5HcP2sZnYmMm7LqOiU52', // Remplacer par un vrai ID Firebase Auth
        associationId: '1', // France Assos Santé
        role: 'Président',
        email: 'president@france-assos-sante.org', // Pour référence uniquement
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        userId: 'mNO4cUMw8IdX3sZtFgHh5JpRvT63', // Remplacer par un vrai ID Firebase Auth
        associationId: '6', // APF France Handicap
        role: 'Directeur',
        email: 'directeur@apf-francehandicap.org', // Pour référence uniquement
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    // Ajouter les administrateurs à Firestore
    for (const adminUser of admins) {
      await db.collection('admins').doc(adminUser.userId).set(adminUser);
      console.log(`Administrateur ${adminUser.email} ajouté avec succès`);
    }
    
    console.log('Initialisation des données administrateurs terminée !');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données administrateurs:', error);
  }
}

// Exécuter la fonction immédiatement
seedAdminData().then(() => {
  console.log('Script terminé.');
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
}); 