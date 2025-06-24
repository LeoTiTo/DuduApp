// Script pour ajouter un administrateur personnalisé dans Firebase
const admin = require('firebase-admin');
const readline = require('readline');
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

// Créer une interface de lecture pour demander des informations
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Liste des associations disponibles
const associations = [
  { id: '1', name: 'FRANCE ASSOS SANTÉ' },
  { id: '2', name: 'AFM-TÉLÉTHON' },
  { id: '3', name: 'LIGUE CONTRE LE CANCER' },
  { id: '4', name: 'AIDES' },
  { id: '5', name: 'FRANCE ALZHEIMER' },
  { id: '6', name: 'APF FRANCE HANDICAP' },
  { id: '7', name: 'UNAPEI' },
  { id: '8', name: 'VOIR ENSEMBLE' },
  { id: '9', name: 'FFAIMC' },
  { id: '10', name: 'AFSEP' },
];

/**
 * Demande une information à l'utilisateur via la console
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Ajoute un administrateur personnalisé dans Firebase
 */
async function addCustomAdmin() {
  try {
    console.log('=== CRÉATION D\'UN ADMINISTRATEUR PERSONNALISÉ ===\n');
    
    // Afficher la liste des associations
    console.log('Associations disponibles:');
    associations.forEach(assoc => {
      console.log(`${assoc.id}. ${assoc.name}`);
    });
    console.log('');
    
    // Récupérer les informations de l'administrateur
    const userId = await askQuestion('ID Firebase Auth de l\'utilisateur: ');
    const associationId = await askQuestion('ID de l\'association (1-10): ');
    const role = await askQuestion('Rôle de l\'administrateur (ex: Trésorier): ');
    const email = await askQuestion('Email de l\'administrateur: ');
    
    // Vérifier que l'ID d'association est valide
    const association = associations.find(a => a.id === associationId);
    if (!association) {
      console.error(`Erreur: L'ID d'association ${associationId} n'existe pas.`);
      return;
    }
    
    // Créer l'objet administrateur
    const adminData = {
      userId,
      associationId,
      role,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Ajouter l'administrateur à Firestore
    await db.collection('admins').doc(userId).set(adminData);
    
    console.log(`\nAdministrateur créé avec succès :`);
    console.log(`- Email: ${email}`);
    console.log(`- Association: ${association.name}`);
    console.log(`- Rôle: ${role}`);
    console.log(`- ID Firebase: ${userId}`);
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  } finally {
    rl.close();
  }
}

// Exécuter la fonction immédiatement
addCustomAdmin().then(() => {
  console.log('\nScript terminé.');
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
}); 