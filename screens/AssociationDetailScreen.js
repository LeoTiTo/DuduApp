import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
  Linking,
  Modal,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import AccessibleImage from '../components/AccessibleImage';
import SimplifiedText from '../components/SimplifiedText';
import SpeechService from '../services/SpeechService';
import PlaceholderImage, { getDefaultImage } from '../components/DefaultImages';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAssociationGoal } from '../firebase/models/AdminModel';

const { width, height } = Dimensions.get('window');

export default function AssociationDetailScreen({ navigation, route }) {
  const { association } = route.params;
  const [donationAmount, setDonationAmount] = useState(10);
  const { settings } = useAccessibility();
  const { currentUser, addFavorite, removeFavorite, getUserFavorites } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [goalData, setGoalData] = useState(null);
  const [totalDonationsThisYear, setTotalDonationsThisYear] = useState(0);
  const [showDonationUpdate, setShowDonationUpdate] = useState(false);
  const [newDonationAmount, setNewDonationAmount] = useState(0);
  const donationUpdateTimeout = useRef(null);
  const favoriteAnimation = useRef(new Animated.Value(1)).current;

  // Créer les bulles animées pour l'arrière-plan
  const bubbles = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;
  
  // Animer les bulles en arrière-plan
  useEffect(() => {
    if (!settings.reducedMotion && !settings.highContrast) {
      bubbles.forEach((anim, index) => {
        // Animation très lente et subtile pour les détails d'association
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 25000 + index * 3000, // Très lent (25-43 secondes)
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Courbe d'animation douce
            useNativeDriver: true,
          })
        ).start();
      });
    }
    
    return () => {
      bubbles.forEach((anim) => {
        anim.stopAnimation();
      });
    };
  }, [settings.reducedMotion, settings.highContrast]);

  // Options de dons prédéfinies
  const donationOptions = [5, 10, 20, 50, 100];

  // Descriptions des images pour l'accessibilité
  const imageDescriptions = {
    '1': 'Femme vérifiant son taux de glycémie avec un glucomètre. Elle porte une montre et mesure son glucose sanguin.',
    '2': 'Une femme âgée marchant dans un parc avec sa fille. Elles semblent heureuses et détendues.',
    '3': 'Un jeune homme aidant une personne âgée à faire ses courses, montrant du soutien et de l\'entraide.',
    '4': 'Ruban rouge, symbole de la sensibilisation au SIDA, posé sur une surface blanche.',
    '5': 'Fauteuil roulant vide garé dans un couloir d\'hôpital, symbolisant l\'accessibilité et les soins de santé.',
    '6': 'Gros plan sur un cœur rouge et un stéthoscope, représentant les soins cardiaques.',
    '7': 'Dame âgée avec assistance respiratoire profitant d\'un moment de détente en banlieue.',
    '8': 'Médecin tenant un modèle de rein, illustrant les soins et traitements des maladies rénales.',
    '9': 'Plan rapproché d\'un homme âgé dont les mains tremblent, symptôme de la maladie de Parkinson.',
    '10': 'Médecin examinant les réflexes neurologiques d\'un patient avec ses doigts.'
  };

  // Descriptions simplifiées
  const simplifiedDescriptions = {
    '1': `${association.name} aide les personnes qui ont du diabète. Ils donnent des infos et du soutien.`,
    '2': `${association.name} aide les personnes qui ont la maladie d'Alzheimer et leurs familles.`,
    '3': `${association.name} lutte contre le SIDA et les hépatites. Ils aident les malades.`,
    '4': `${association.name} aide à la recherche sur le cancer et soutient les malades.`,
    '5': `${association.name} défend les droits des personnes handicapées et les aide au quotidien.`,
    '6': `${association.name} aide les personnes qui ont des problèmes de cœur.`,
    '7': `${association.name} soutient les personnes qui ont du mal à respirer.`,
    '8': `${association.name} aide les personnes qui ont des problèmes de reins.`,
    '9': `${association.name} aide les personnes atteintes de la maladie de Parkinson et leurs proches.`,
    '10': `${association.name} soutient les personnes épileptiques et leur donne des infos utiles.`
  };

  // Description longue par défaut et simplifiée
  const defaultLongDesc = `${association.name} est une association qui œuvre au quotidien pour améliorer la vie des personnes touchées par des problématiques de santé. Grâce à vos dons, l'association peut continuer ses actions d'accompagnement, de sensibilisation et de recherche.`;
  
  const simplifiedLongDesc = `${association.name} aide les personnes malades tous les jours. Avec vos dons, ils peuvent continuer à aider les malades, informer les gens et faire de la recherche.`;

  // Animation de la notification
  const notificationAnimation = useRef(new Animated.Value(0)).current;

  // Vérifier si l'association est dans les favoris
  useEffect(() => {
    // Générer les bulles
    createBubbles();
    
    // Vérifier si l'association est dans les favoris
    checkFavoriteStatus();
    
    // Charger l'objectif de dons
    loadAssociationGoal();
    
    // Effet pour la synthèse vocale
    if (settings.textToSpeech) {
      SpeechService.speak(`Détails de l'association ${association.name}`);
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech, association.id]);

  // Configurer l'écouteur de dons quand l'objectif change
  useEffect(() => {
    if (!goalData) return;
    
    console.log("Configuration de l'écouteur de dons avec le nouvel objectif:", JSON.stringify(goalData));
    console.log("Date de création de l'objectif:", goalData.createdAt ? (goalData.createdAt.toDate ? goalData.createdAt.toDate() : new Date(goalData.createdAt)) : "Aucune date");
    
    // Ne pas réinitialiser le montant des dons pour éviter le flash à zéro
    // setTotalDonationsThisYear(0);
    
    // Fonction pour forcer la mise à jour des dons
    const forceUpdateDonations = async () => {
      console.log("Forçage de la mise à jour des dons...");
      try {
        // Récupérer la date de création de l'objectif
        const goalCreationDate = goalData.createdAt ?
          (goalData.createdAt.toDate ? goalData.createdAt.toDate() : new Date(goalData.createdAt)) :
          new Date();
        
        const donationsRef = collection(db, 'donations');
        const q = query(donationsRef, where('association.id', '==', association.id));
        const snapshot = await getDocs(q);
        
        console.log(`Forçage - Nombre de documents récupérés: ${snapshot.size}`);
        
        // Calculer directement le total filtré
        let filteredTotal = 0;
        
        snapshot.forEach((doc) => {
          const donation = doc.data();
          // Récupérer la date du don de manière sûre
          const donationDate = donation.createdAt && donation.createdAt.toDate 
            ? donation.createdAt.toDate() 
            : new Date(donation.createdAt || Date.now());
          
          // Comparer les dates en utilisant getTime() pour une comparaison fiable
          if (donationDate.getTime() >= goalCreationDate.getTime()) {
            filteredTotal += donation.amount || 0;
            console.log(`Don de ${donation.amount}€ comptabilisé (date: ${donationDate})`);
          } else {
            console.log(`Don de ${donation.amount}€ ignoré car antérieur à l'objectif (date: ${donationDate})`);
          }
        });
        
        console.log(`Total FORCÉ des dons depuis la création de l'objectif: ${filteredTotal}€`);
        
        // Mettre à jour l'état uniquement si le total est différent
        // pour éviter de déclencher un re-render inutile
        if (filteredTotal !== totalDonationsThisYear) {
          setTotalDonationsThisYear(filteredTotal);
        }
      } catch (error) {
        console.error("Erreur lors du forçage de la mise à jour des dons:", error);
      }
    };
    
    // Mettre en place un écouteur pour les changements de dons
    const setupDonationListener = () => {
      try {
        console.log("Mise en place de l'écouteur pour les dons de l'association:", association.id);
        
        // Ne pas réinitialiser le montant des dons à chaque changement d'écouteur
        // setTotalDonationsThisYear(0);
        
        const donationsRef = collection(db, 'donations');
        const q = query(donationsRef, where('association.id', '==', association.id));
        
        // Créer un écouteur en temps réel
        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`Changement détecté dans les dons - ${snapshot.size} documents`);
          forceUpdateDonations();
        }, (error) => {
          console.error("Erreur lors de l'écoute des dons:", error);
        });
        
        // Retourner la fonction de nettoyage pour désabonner l'écouteur
        return unsubscribe;
      } catch (error) {
        console.error("Erreur lors de la configuration de l'écouteur:", error);
        return () => {}; // Retourner une fonction vide en cas d'erreur
      }
    };
    
    // Configurer l'écouteur et stocker la fonction de nettoyage
    const unsubscribeDonations = setupDonationListener();
    
    // Forcer la mise à jour immédiatement mais sans réinitialiser à zéro
    forceUpdateDonations();
    
    // Forcer périodiquement la mise à jour, 
    // mais pas besoin de nombreuses tentatives ni de délais trop courts
    setTimeout(() => forceUpdateDonations(), 2000);
    
    return () => {
      // Nettoyer l'écouteur de dons
      if (unsubscribeDonations) {
        unsubscribeDonations();
      }
    };
  }, [goalData, association.id]);

  // Vérifier si l'association est dans les favoris
  const checkFavoriteStatus = async () => {
    if (currentUser) {
      try {
        const favorites = await getUserFavorites();
        const isAssociationFavorite = favorites.some(fav => fav.id === association.id);
        setIsFavorite(isAssociationFavorite);
      } catch (error) {
        console.error("Erreur lors de la vérification des favoris:", error);
      }
    }
  };

  // Créer des bulles animées pour l'arrière-plan
  const createBubbles = () => {
    if (!settings.reducedMotion && !settings.highContrast) {
      bubbles.forEach((anim, index) => {
        // Animation très lente et subtile pour les détails d'association
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 25000 + index * 3000, // Très lent (25-43 secondes)
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Courbe d'animation douce
            useNativeDriver: true,
          })
        ).start();
      });
    }
  };

  // État pour le modal "Pourquoi créer un compte"
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Naviguer vers la page de connexion
  const navigateToLogin = () => {
    setShowLoginModal(false);
    navigation.navigate('LoginScreen', {
      redirectTo: 'AssociationDetailScreen',
      redirectParams: { association },
      message: 'Veuillez vous connecter pour ajouter des favoris'
    });
  };
  
  // Naviguer vers la page d'inscription
  const navigateToRegister = () => {
    setShowLoginModal(false);
    navigation.navigate('RegisterScreen');
  };
  
  // Fermer le modal et rester sur la page
  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  // Gérer l'ajout ou la suppression des favoris
  const handleFavoriteToggle = async () => {
    // Animation au clic
    Animated.sequence([
      // Réduire légèrement la taille
      Animated.timing(favoriteAnimation, {
        toValue: 0.8,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Puis agrandir avec effet de rebond
      Animated.spring(favoriteAnimation, {
        toValue: isFavorite ? 1 : 1.35, // Plus grand si on ajoute aux favoris
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      // Revenir à la taille normale
      Animated.spring(favoriteAnimation, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      })
    ]).start();

    if (!currentUser) {
      // Afficher le modal de connexion plutôt que de rediriger directement
      setShowLoginModal(true);
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFavorite(association.id);
        setIsFavorite(false);
        if (settings.textToSpeech) {
          SpeechService.speak(`${association.name} a été retiré de vos favoris`);
        }
      } else {
        await addFavorite(association.id);
        setIsFavorite(true);
        if (settings.textToSpeech) {
          SpeechService.speak(`${association.name} a été ajouté à vos favoris`);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la gestion des favoris:", error);
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    }
  };

  // Charger l'objectif de dons de l'association
  const loadAssociationGoal = async () => {
    try {
      setLoading(true);
      
      // Ne pas réinitialiser totalDonationsThisYear au début
      // setTotalDonationsThisYear(0);
      console.log(`Chargement de l'objectif pour l'association: ${association.id}`);
      
      // Tentative de récupération via la fonction importée
      try {
        const goal = await getAssociationGoal(association.id);
        
        if (goal) {
          console.log(`Objectif trouvé:`, JSON.stringify(goal));
          
          // Vérifier la date de création
          if (goal.createdAt) {
            const creationDate = goal.createdAt.toDate ? goal.createdAt.toDate() : new Date(goal.createdAt);
            console.log(`Date de création de l'objectif: ${creationDate}`);
          } else {
            console.warn("L'objectif n'a pas de date de création!");
            // Ajouter une date de création si manquante
            goal.createdAt = new Date();
            console.log(`Date de création ajoutée: ${goal.createdAt}`);
          }
          
          // D'abord définir le goalData
          setGoalData(goal);
          console.log(`objectif défini: ${JSON.stringify(goal)}`);
          
          // Les dons seront mis à jour automatiquement via l'effet qui surveille goalData
          return; // Sortir de la fonction si réussi
        } else {
          console.log("Aucun objectif trouvé avec getAssociationGoal");
        }
      } catch (error) {
        console.log('Erreur avec getAssociationGoal, tentative alternative...', error);
        // En cas d'erreur d'autorisation, on passe à la méthode alternative ci-dessous
      }
      
      // Méthode alternative : essayer de récupérer directement depuis la collection 'associations'
      try {
        console.log("Tentative alternative pour récupérer l'objectif...");
        const associationRef = doc(db, 'associations', association.id);
        const associationDoc = await getDoc(associationRef);
        
        if (associationDoc.exists() && associationDoc.data().goal) {
          // Si l'association a des informations d'objectif intégrées
          const goal = associationDoc.data().goal;
          console.log(`Objectif trouvé (méthode alternative):`, JSON.stringify(goal));
          
          // Vérifier la date de création
          if (goal.createdAt) {
            const creationDate = goal.createdAt.toDate ? goal.createdAt.toDate() : new Date(goal.createdAt);
            console.log(`Date de création de l'objectif (méthode alternative): ${creationDate}`);
          } else {
            console.warn("L'objectif n'a pas de date de création! (méthode alternative)");
            // Ajouter une date de création si manquante
            goal.createdAt = new Date();
            console.log(`Date de création ajoutée (méthode alternative): ${goal.createdAt}`);
          }
          
          setGoalData(goal);
          console.log(`Objectif défini (méthode alternative): ${JSON.stringify(goal)}`);
          
          // Les dons seront mis à jour automatiquement via l'effet qui surveille goalData
        } else {
          // Créer des données factices (si applicable dans votre contexte)
          // Ou laisser goalData à null
          console.log('Aucun objectif trouvé pour cette association');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération alternative:', err);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'objectif:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Récupérer le montant total des dons pour l'année en cours
  const loadTotalDonations = async (associationId) => {
    try {
      // Si l'objectif n'est pas défini, on ne peut pas filtrer les dons
      if (!goalData) {
        console.log("Pas d'objectif défini, impossible de charger les dons");
        setTotalDonationsThisYear(0);
        return;
      }
      
      // Récupérer la date de création de l'objectif
      const goalCreationDate = goalData.createdAt ?
        (goalData.createdAt.toDate ? goalData.createdAt.toDate() : new Date(goalData.createdAt)) :
        new Date();
      
      const donationsRef = collection(db, 'donations');
      const q = query(donationsRef, where('association.id', '==', associationId));
      
      try {
        // Obtenir un snapshot unique pour le chargement initial
        const donationsSnapshot = await getDocs(q);
        console.log(`loadTotalDonations - Nombre de documents récupérés: ${donationsSnapshot.size}`);
        
        // Calculer directement le total filtré
        let filteredTotal = 0;
        
        donationsSnapshot.forEach((doc) => {
          const donation = doc.data();
          // Récupérer la date du don de manière sûre
          const donationDate = donation.createdAt && donation.createdAt.toDate 
            ? donation.createdAt.toDate() 
            : new Date(donation.createdAt || Date.now());
          
          // Comparer les dates en utilisant getTime() pour une comparaison fiable
          if (donationDate.getTime() >= goalCreationDate.getTime()) {
            filteredTotal += donation.amount || 0;
            console.log(`Don de ${donation.amount}€ comptabilisé (date: ${donationDate})`);
          } else {
            console.log(`Don de ${donation.amount}€ ignoré car antérieur à l'objectif (date: ${donationDate})`);
          }
        });
        
        console.log(`Total des dons depuis la création de l'objectif (loadTotalDonations): ${filteredTotal}€`);
        
        // Mettre à jour l'état
        setTotalDonationsThisYear(filteredTotal);
      } catch (authError) {
        console.log('Erreur d\'autorisation lors du calcul des dons:', authError);
        // Fallback: utiliser une valeur par défaut ou stockée localement
        setTotalDonationsThisYear(0);
      }
    } catch (error) {
      console.error('Erreur lors du calcul des dons totaux:', error);
      setTotalDonationsThisYear(0);
    }
  };
  
  // Calculer le pourcentage d'avancement
  const calculateProgress = () => {
    if (!goalData || goalData.amount === 0) return 0;
    
    // Utiliser le montant total depuis la création de l'objectif
    const percentage = (totalDonationsThisYear / goalData.amount) * 100;
    return Math.min(percentage, 100); // Limiter à 100%
  };

  // Calculer le total des dons depuis la création de l'objectif
  const calculateTotalSinceGoalCreation = () => {
    // Retourner directement la valeur mise à jour par forceUpdateDonations
    return totalDonationsThisYear;
  };

  // Formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Afficher la notification de nouveau don
  useEffect(() => {
    if (showDonationUpdate) {
      // Réinitialiser l'animation
      notificationAnimation.setValue(0);
      
      // Animer l'apparition
      Animated.sequence([
        Animated.timing(notificationAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(4000), // Attendre 4 secondes
        Animated.timing(notificationAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Cacher la notification une fois l'animation terminée
        setShowDonationUpdate(false);
      });
    }
  }, [showDonationUpdate]);

  // Ajouter la section d'objectif après la description
  const renderGoalSection = () => {
    if (!goalData) return null;
    
    // Calculer le pourcentage d'avancement pour l'affichage
    const progressPercent = calculateProgress();
    const formattedPercent = Math.round(progressPercent);
    
    // Générer un message d'encouragement en fonction du progrès
    const getMotivationMessage = () => {
      if (progressPercent >= 100) {
        return "Objectif atteint ! Merci à tous les donateurs !";
      } else if (progressPercent >= 75) {
        return "Plus que quelques dons pour atteindre l'objectif !";
      } else if (progressPercent >= 50) {
        return "Déjà à mi-chemin ! Continuons ensemble !";
      } else if (progressPercent >= 25) {
        return "Un bon début ! Aidez-nous à poursuivre cette campagne.";
      } else {
        return "Soutenez cette initiative en faisant un don aujourd'hui.";
      }
    };
    
    // Transformations pour l'animation de la notification
    const notificationTranslateY = notificationAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 0],
    });
    
    const notificationOpacity = notificationAnimation;
    
    return (
      <View style={[
        styles.goalContainer,
        settings.highContrast && styles.highContrastSection
      ]}>
        {/* Notification de nouveau don */}
        {showDonationUpdate && (
          <Animated.View 
            style={[
              styles.donationUpdateNotification,
              {
                opacity: notificationOpacity,
                transform: [{ translateY: notificationTranslateY }]
              }
            ]}
          >
            <View style={styles.donationUpdateContent}>
              <Ionicons 
                name="heart" 
                size={20} 
                color="#FFFFFF" 
                style={styles.donationUpdateIcon}
              />
              <Text style={styles.donationUpdateText}>
                Nouveau don reçu : +{newDonationAmount}€ !
              </Text>
            </View>
          </Animated.View>
        )}
        
        <View style={styles.goalHeaderRow}>
          <Ionicons 
            name="trophy" 
            size={24} 
            color={settings.highContrast ? "#000" : "#5e48e8"} 
            style={styles.goalIcon}
          />
          <Text style={[
            styles.goalTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            {goalData.title}
          </Text>
        </View>
        
        {goalData.description && (
          <Text style={[
            styles.goalDescription,
            settings.highContrast && styles.highContrastSecondaryText,
            settings.largeText && styles.largeText
          ]}>
            {goalData.description}
          </Text>
        )}
        
        <View style={styles.goalProgressContainer}>
          <View style={styles.goalStatsRow}>
            <View style={styles.goalStatItem}>
              <Text style={[
                styles.goalStatValue,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                {calculateTotalSinceGoalCreation()}€
              </Text>
              <Text style={[
                styles.goalStatLabel,
                settings.highContrast && styles.highContrastSecondaryText
              ]}>
                collectés
              </Text>
            </View>
            
            <View style={[styles.goalProgressCircle, progressPercent >= 100 && styles.goalCompleted]}>
              <Text style={[
                styles.goalProgressText,
                progressPercent >= 100 && styles.goalCompletedText,
                settings.highContrast && styles.highContrastProgressText
              ]}>
                {formattedPercent}%
              </Text>
            </View>
            
            <View style={styles.goalStatItem}>
              <Text style={[
                styles.goalStatValue,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                {goalData.amount}€
              </Text>
              <Text style={[
                styles.goalStatLabel,
                settings.highContrast && styles.highContrastSecondaryText
              ]}>
                objectif
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressPercent}%` },
                settings.highContrast && styles.highContrastProgressBar,
                progressPercent >= 100 && styles.progressBarCompleted
              ]} 
            />
          </View>
          
          <Text style={[
            styles.motivationMessage,
            progressPercent >= 100 && styles.successMessage,
            settings.highContrast && styles.highContrastDescription,
            settings.largeText && styles.largeText
          ]}>
            {getMotivationMessage()}
          </Text>
          
          {goalData.endDate && (
            <View style={styles.goalFooter}>
              <Ionicons 
                name="calendar-outline" 
                size={16} 
                color={settings.highContrast ? "#000" : "#666"} 
                style={styles.goalCalendarIcon}
              />
              <Text style={[
                styles.goalEndDate,
                settings.highContrast && styles.highContrastSecondaryText,
                settings.largeText && styles.largeText
              ]}>
                Date limite : {formatDate(goalData.endDate)}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.donateToCampaignButton,
              settings.highContrast && styles.highContrastDonateButton
            ]}
            onPress={() => navigation.navigate('DonationSingle', { 
              association: association
            })}
            accessible={true}
            accessibilityLabel={`Contribuer à l'objectif de ${goalData.title}`}
            accessibilityRole="button"
          >
            <Text style={[
              styles.donateToCampaignText,
              settings.highContrast && styles.highContrastDonateButtonText,
              settings.largeText && styles.largeText
            ]}>
              {progressPercent >= 100 ? "Continuer à soutenir" : "Contribuer à cet objectif"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Modal "Pourquoi créer un compte"
  const renderLoginModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLoginModal}
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          settings.highContrast && styles.highContrastModal
        ]}>
          <View style={styles.modalImageContainer}>
            <Image 
              source={require('../assets/dudu/dudu_ballon_helium_reflechit_inquiet.png')} 
              style={styles.modalDuduImage}
              resizeMode="contain"
            />
          </View>
          
          <Text style={[
            styles.modalTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeTitle
          ]}>
            Oups ! Un compte est nécessaire
          </Text>
          
          <Text style={[
            styles.modalMessage,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Dudu a besoin de savoir qui vous êtes pour garder trace de vos associations préférées.
          </Text>
          
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.modalButton,
                styles.loginButton,
                settings.highContrast && styles.highContrastConfirmButton
              ]}
              onPress={navigateToLogin}
              accessible={true}
              accessibilityLabel="Se connecter"
              accessibilityRole="button"
            >
              <Text style={[
                styles.modalButtonText,
                settings.highContrast && styles.highContrastConfirmButtonText,
                settings.largeText && styles.largeText
              ]}>
                J'ai déjà un compte
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalButton,
                styles.registerButton,
                settings.highContrast && styles.highContrastSection
              ]}
              onPress={navigateToRegister}
              accessible={true}
              accessibilityLabel="Créer un compte"
              accessibilityRole="button"
            >
              <Text style={[
                styles.modalButtonText,
                styles.registerButtonText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={handleCloseModal}
              accessible={true}
              accessibilityLabel="Continuer sans compte"
              accessibilityRole="button"
            >
              <Text style={[
                styles.modalCancelButtonText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeTextDescription
              ]}>
                Pas maintenant
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Fond animé avec bulles - masquées en mode contraste élevé */}
      {!settings.highContrast && (
        <View style={StyleSheet.absoluteFillObject}>
          {bubbles.map((anim, index) => {
            // Mouvement horizontal très limité
            const translateX = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                0, 
                (index % 2 === 0) ? 15 : -15, 
                0
              ],
            });
            
            // Mouvement vertical très limité
            const translateY = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                0, 
                (index % 2 === 0) ? -20 : 20, 
                0
              ],
            });
            
            // Variation de taille très légère
            const scale = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                1, 
                index % 2 === 0 ? 1.05 : 0.98,
                1
              ],
            });
            
            // Palette de couleurs très douce adaptée au contexte d'information détaillée
            const colors = [
              '#c1e1ff', '#dbc4ff', '#c3ffcb', '#ffe9b5', '#ffcbdb', '#b5d7ff'
            ];

            // Positionnement plus esthétique et plus harmonieux
            return (
              <Animated.View
                key={index}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: colors[index % colors.length],
                    // Disposition plus harmonieuse en forme de diagonale
                    top: [
                      -100, 
                      height * 0.25, 
                      height * 0.45, 
                      -150, 
                      height * 0.65, 
                      height * 0.85
                    ][index],
                    left: [
                      width * 0.75, 
                      -100, 
                      width * 0.8, 
                      width * 0.1, 
                      -80, 
                      width * 0.55
                    ][index],
                    // Bulles plus variées en taille
                    width: [250, 300, 220, 280, 320, 240][index],
                    height: [250, 300, 220, 280, 320, 240][index],
                    borderRadius: 300,
                    transform: [
                      { translateX }, 
                      { translateY }, 
                      { scale }
                    ],
                    opacity: 0.08 + (index % 3) * 0.01, // Opacité légèrement plus visible (0.08-0.10)
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity 
          style={[
            styles.backButton,
            settings.highContrast && styles.highContrastButton
          ]}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Retour à l'écran précédent"
          accessibilityRole="button"
          accessibilityHint="Navigue vers l'écran précédent"
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={settings.highContrast ? "#000" : "#444"} 
          />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          settings.highContrast && styles.highContrastText,
          settings.largeText && styles.largeText
        ]}>
          {association.name}
        </Text>
        
        {/* Bouton Favoris */}
        <Animated.View
          style={{
            transform: [{ scale: favoriteAnimation }]
          }}
        >
          <TouchableOpacity 
            style={[
              styles.favoriteButton,
              settings.highContrast && styles.highContrastButton,
              isFavorite && styles.activeFavoriteButton
            ]}
            onPress={handleFavoriteToggle}
            accessible={true}
            accessibilityLabel={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            accessibilityRole="button"
          >
            <Image 
              source={require('../assets/dudu/dudu_icone_coeur_rougit.png')}
              style={[
                styles.duduFavoriteIcon,
                !isFavorite && styles.duduFavoriteIconInactive,
                isFavorite && styles.duduFavoriteIconActive
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image principale avec style amélioré */}
        <View style={styles.imageContainer}>
          {/* Utiliser l'image de remplacement en cas d'erreur ou si l'ID n'existe pas */}
          {imageError ? (
            <View style={styles.placeholderContainer}>
              {getDefaultImage(association.id, association.name, association)}
            </View>
          ) : (
            <View style={styles.imageWrapper}>
              <PlaceholderImage 
                text={association.name} 
                size={{ width: width, height: 220 }}
                association={association}
              />
            </View>
          )}
          <View style={styles.imageOverlay}>
            <View style={styles.categoriesContainer}>
              {association.categories && association.categories.map((category, index) => (
                <View key={index} style={[
                  styles.categoryTag,
                  settings.highContrast && styles.highContrastCategoryTag
                ]}>
                  <Text style={[
                    styles.categoryText,
                    settings.highContrast && styles.highContrastText
                  ]}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Section Description avec style amélioré */}
        <View style={[
          styles.section,
          settings.highContrast && styles.highContrastSection
        ]}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons 
              name="document-text-outline" 
              size={22} 
              color={settings.highContrast ? "#000" : "#5e48e8"} 
              style={styles.sectionIcon} 
            />
            <Text style={[
              styles.sectionTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Description
            </Text>
          </View>
          <View style={styles.sectionContent}>
            <SimplifiedText 
              style={[
                styles.descriptionText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}
              simplified={simplifiedDescriptions[association.id]}
            >
              {association.description}
            </SimplifiedText>
            <SimplifiedText 
              style={[
                styles.longDescriptionText,
                settings.highContrast && styles.highContrastDescription,
                settings.largeText && styles.largeTextDescription
              ]}
              simplified={simplifiedLongDesc}
            >
              {association.longDescription || defaultLongDesc}
            </SimplifiedText>
          </View>
        </View>

        {/* Section Actions avec style amélioré */}
        <View style={[
          styles.section,
          settings.highContrast && styles.highContrastSection
        ]}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons 
              name="checkmark-circle-outline" 
              size={22} 
              color={settings.highContrast ? "#000" : "#5e48e8"} 
              style={styles.sectionIcon}
            />
            <Text style={[
              styles.sectionTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Actions principales
            </Text>
          </View>
          
          <View style={styles.actionsList}>
            <View style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="search-outline" size={24} color={settings.highContrast ? "#000" : "#5e48e8"} />
              </View>
              <View style={styles.actionTextContainer}>
                <SimplifiedText 
                  style={[
                    styles.actionTitle,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}
                >
                  Recherche
                </SimplifiedText>
                <SimplifiedText 
                  style={[
                    styles.actionDescription,
                    settings.highContrast && styles.highContrastDescription,
                    settings.largeText && styles.largeTextDescription
                  ]}
                  simplified="Aide à payer des projets de recherche"
                >
                  Financement de projets de recherche
                </SimplifiedText>
              </View>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="people-outline" size={24} color={settings.highContrast ? "#000" : "#5e48e8"} />
              </View>
              <View style={styles.actionTextContainer}>
                <SimplifiedText 
                  style={[
                    styles.actionTitle,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}
                >
                  Soutien
                </SimplifiedText>
                <SimplifiedText 
                  style={[
                    styles.actionDescription,
                    settings.highContrast && styles.highContrastDescription,
                    settings.largeText && styles.largeTextDescription
                  ]}
                  simplified="Aide les personnes malades"
                >
                  Accompagnement des personnes touchées
                </SimplifiedText>
              </View>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="megaphone-outline" size={24} color={settings.highContrast ? "#000" : "#5e48e8"} />
              </View>
              <View style={styles.actionTextContainer}>
                <SimplifiedText 
                  style={[
                    styles.actionTitle,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}
                >
                  Sensibilisation
                </SimplifiedText>
                <SimplifiedText 
                  style={[
                    styles.actionDescription,
                    settings.highContrast && styles.highContrastDescription,
                    settings.largeText && styles.largeTextDescription
                  ]}
                  simplified="Informe le public et aide à éviter les problèmes"
                >
                  Prévention et information du public
                </SimplifiedText>
              </View>
            </View>

            {/* Bouton pour accéder au site web avec style amélioré */}
            {association.website && (
              <TouchableOpacity 
                style={[
                  styles.websiteButton,
                  settings.highContrast && styles.highContrastWebsiteButton
                ]}
                onPress={() => Linking.openURL(association.website)}
                accessible={true}
                accessibilityLabel={`Visiter le site web de ${association.name}`}
                accessibilityRole="link"
                accessibilityHint="Ouvre le site web de l'association dans votre navigateur"
              >
                <Ionicons name="globe-outline" size={20} color={settings.highContrast ? "#000" : "#5e48e8"} style={styles.websiteButtonIcon} />
                <Text style={[
                  styles.websiteButtonText,
                  settings.highContrast && styles.highContrastWebsiteButtonText,
                  settings.largeText && styles.largeText
                ]}>
                  Visiter le site web
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[
          styles.donationSection,
          settings.highContrast && styles.highContrastDonationSection
        ]}>
          <View style={styles.donationHeader}>
            <Ionicons 
              name="heart-circle" 
              size={40} 
              color={settings.highContrast ? "#000" : "#ff6b6b"} 
              style={styles.donationHeaderIcon}
            />
          </View>
          
          <Text style={[
            styles.donationTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Faire un don
          </Text>
          
          <Text style={[
            styles.donationSubtitle,
            settings.highContrast && styles.highContrastDescription,
            settings.largeText && styles.largeText
          ]}>
            Votre générosité fait la différence
          </Text>
          
          <View style={styles.donationButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.donateButtonOption,
                settings.highContrast && styles.highContrastDonateButton
              ]}
              onPress={() => navigation.navigate('DonationSingle', { 
                association: association
              })}
              accessible={true}
              accessibilityLabel={`Faire un don unique à ${association.name}`}
              accessibilityRole="button"
            >
              <Text style={[
                styles.donateButtonText,
                settings.highContrast && styles.highContrastDonateButtonText,
                settings.largeText && styles.largeText
              ]}>
                Don unique
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.donateButtonOption,
                styles.donateButtonRecurrent,
                settings.highContrast && styles.highContrastDonateButton
              ]}
              onPress={() => navigation.navigate('DonationRecurrent', { 
                association: association
              })}
              accessible={true}
              accessibilityLabel={`Faire un don récurrent à ${association.name}`}
              accessibilityRole="button"
            >
              <Text style={[
                styles.donateButtonText,
                settings.highContrast && styles.highContrastDonateButtonText,
                settings.largeText && styles.largeText
              ]}>
                Don mensuel
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.taxInfoContainer}>
            <Ionicons 
              name="information-circle-outline" 
              size={18} 
              color={settings.highContrast ? "#000" : "#666"} 
              style={styles.taxInfoIcon}
            />
            <Text style={[
              styles.taxInfoText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              66% de votre don est déductible des impôts
            </Text>
          </View>
        </View>

        {/* Objectif de dons */}
        {renderGoalSection()}
      </ScrollView>

      {/* Modal pour se connecter */}
      {renderLoginModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  highContrastContainer: {
    backgroundColor: '#FFFFFF',
  },
  bubble: {
    position: 'absolute',
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  highContrastButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  activeFavoriteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(94, 72, 232, 0.3)',
    transform: [{ scale: 1.05 }],
  },
  duduFavoriteIcon: {
    width: 40,
    height: 40,
  },
  duduFavoriteIconInactive: {
    opacity: 0.5,
    tintColor: '#888',
    transform: [{ scale: 0.9 }],
  },
  duduFavoriteIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: width,
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 15,
    borderRadius: 0,
  },
  imageWrapper: {
    width: width,
    height: 220,
    overflow: 'hidden',
    borderRadius: 0,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 0,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  highContrastCategoryTag: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
  },
  associationHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  associationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 25,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  highContrastSection: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 10,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionContent: {
    paddingHorizontal: 5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 14,
  },
  highContrastDescription: {
    color: '#333',
  },
  longDescriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  largeText: {
    fontSize: 20,
  },
  largeTextDescription: {
    fontSize: 16,
  },
  actionsList: {
    marginTop: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 12,
    borderRadius: 12,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(94, 72, 232, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    display: 'flex',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  donationSection: {
    marginHorizontal: 20,
    backgroundColor: '#f8f8ff',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#e5e5fa',
    shadowColor: "#6c63ff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 30,
  },
  highContrastDonationSection: {
    backgroundColor: '#333333',
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  donationHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  donationHeaderIcon: {
    marginBottom: 5,
  },
  donationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  donationSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  donationButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 22,
  },
  donateButtonOption: {
    backgroundColor: '#5e48e8',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#472dc5",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  donateButtonRecurrent: {
    backgroundColor: '#ff7e67',
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  highContrastDonateButton: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
  },
  highContrastDonateButtonText: {
    color: '#000000',
  },
  taxInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.15)',
    marginTop: 5,
  },
  taxInfoIcon: {
    marginRight: 8,
  },
  taxInfoText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  websiteButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(94, 72, 232, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  highContrastWebsiteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  websiteButtonIcon: {
    marginRight: 10,
  },
  websiteButtonText: {
    color: '#5e48e8',
    fontSize: 15,
    fontWeight: '500',
  },
  highContrastWebsiteButtonText: {
    color: '#000000',
  },
  goalContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#5e48e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(94, 72, 232, 0.1)',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  goalDescription: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 22,
  },
  goalProgressContainer: {
    marginTop: 10,
  },
  goalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalStatItem: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  goalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 4,
  },
  goalStatLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5e48e8',
    borderRadius: 7,
  },
  highContrastProgressBar: {
    backgroundColor: '#000000',
  },
  progressBarCompleted: {
    backgroundColor: '#4CAF50',
  },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  goalCalendarIcon: {
    marginRight: 8,
  },
  goalEndDate: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  goalProgressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 3,
    borderColor: '#5e48e8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  goalCompletedText: {
    color: '#4CAF50',
  },
  goalProgressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  highContrastProgressText: {
    color: '#000000',
  },
  donateToCampaignButton: {
    backgroundColor: '#5e48e8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#472dc5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  donateToCampaignText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  motivationMessage: {
    textAlign: 'center',
    marginVertical: 14,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#5e48e8',
    padding: 10,
    backgroundColor: 'rgba(94, 72, 232, 0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  successMessage: {
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  donationUpdateNotification: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 10,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  donationUpdateIcon: {
    marginRight: 8,
  },
  donationUpdateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  donationUpdateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  modalImageContainer: {
    marginTop: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  modalDuduImage: {
    width: 150,
    height: 150,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5e48e8',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalButton: {
    width: '90%',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#5e48e8',
  },
  registerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#5e48e8',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  registerButtonText: {
    color: '#5e48e8',
  },
  modalCancelButton: {
    marginTop: 5,
    padding: 10,
  },
  modalCancelButtonText: {
    color: '#888',
    fontSize: 14,
  },
  largeTitle: {
    fontSize: 24,
  },
}); 