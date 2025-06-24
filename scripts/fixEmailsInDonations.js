// Script pour ajouter des emails aux dons existants qui n'en ont pas
const { initializeApp } = require('firebase/app');
const { collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const { getFirestore } = require('firebase/firestore');

// Configuration Firebase (assurez-vous que le fichier config.js est accessible)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "donacces-1a345.firebaseapp.com",
  projectId: "donacces-1a345",
  storageBucket: "donacces-1a345.appspot.com",
  messagingSenderId: "507781020125",
  appId: "1:507781020125:web:6c9f61913de3cfcc29ecb0",
  measurementId: "G-V1N6T64JCR"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Liste d'emails fictifs pour les tests
const testEmails = [
  'test1@example.com',
  'test2@example.com',
  'test3@example.com',
  'test4@example.com',
  'test5@example.com',
  'association@donacces.fr',
  'donateur@gmail.com',
  'utilisateur@outlook.com',
  'benevole@yahoo.fr',
  'membre@hotmail.com'
];

// Fonction pour mettre à jour les dons sans email
async function fixDonationsEmails() {
  try {
    console.log('Début de la mise à jour des emails de donations...');
    
    // Récupérer tous les dons
    const donationsRef = collection(db, 'donations');
    const donationsSnapshot = await getDocs(donationsRef);
    
    let totalDonations = 0;
    let updatedDonations = 0;
    
    // Parcourir tous les dons
    for (const docSnapshot of donationsSnapshot.docs) {
      totalDonations++;
      const donationData = docSnapshot.data();
      
      // Vérifier si le don n'a pas d'email
      if (!donationData.email) {
        // Attribuer un email aléatoire
        const randomEmail = testEmails[Math.floor(Math.random() * testEmails.length)];
        
        // Mettre à jour le document
        await updateDoc(doc(db, 'donations', docSnapshot.id), {
          email: randomEmail
        });
        
        updatedDonations++;
        console.log(`Don mis à jour : ${docSnapshot.id} (${donationData.amount}€) - Email ajouté : ${randomEmail}`);
      }
    }
    
    console.log(`Mise à jour terminée! ${updatedDonations} dons sur ${totalDonations} ont été mis à jour.`);
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des emails:', error);
  }
}

// Exécuter la fonction
fixDonationsEmails().then(() => {
  console.log('Script terminé.');
  process.exit(0);
}).catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
  process.exit(1);
}); 