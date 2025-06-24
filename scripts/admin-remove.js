// Script pour supprimer tous les administrateurs dans Firebase
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
 * Supprime toutes les données administrateurs
 */
async function clearAdminData() {
  try {
    console.log('Suppression des données administrateurs...');
    
    const adminsSnapshot = await db.collection('admins').get();
    
    if (adminsSnapshot.empty) {
      console.log('Aucun administrateur trouvé dans la base de données.');
      return;
    }
    
    console.log(`${adminsSnapshot.size} administrateur(s) trouvé(s). Suppression en cours...`);
    
    const deletePromises = [];
    adminsSnapshot.forEach((doc) => {
      console.log(`Suppression de l'administrateur ID: ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    
    console.log('Suppression des données administrateurs terminée !');
  } catch (error) {
    console.error('Erreur lors de la suppression des données administrateurs:', error);
  }
}

// Exécuter la fonction immédiatement
clearAdminData().then(() => {
  console.log('Script terminé.');
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
}); 