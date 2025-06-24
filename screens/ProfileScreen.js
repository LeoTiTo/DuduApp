import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Switch,
  LogBox,
  Image,
  width,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import SpeechService from '../services/SpeechService';
import { checkIfAdmin } from '../firebase/models/AdminModel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Désactiver l'avertissement spécifique pour les listes virtualisées imbriquées
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

// Clé pour stocker les badges dans AsyncStorage
const BADGES_STORAGE_KEY = 'dudu_badges_';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { settings } = useAccessibility();
  const { 
    currentUser, 
    logout, 
    deleteUserAccount, 
    getUserDonations, 
    updateDonationStatus, 
    updateDonationReceipt,
    getUserBadges,
    unlockBadge,
    updateUserBadges,
    updateUserAvatar
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState('actifs');
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [badges, setBadges] = useState([
    {
      id: 'first_donation',
      name: 'Premier don',
      description: 'Faites votre premier don pour obtenir ce badge',
      image: require('../assets/dudu/dudu_mignon_dans_un_bouquet_de_fleurs.png'),
      unlocked: false,
      condition: 'Premier don effectué'
    },
    {
      id: 'cumulated_100',
      name: 'Donateur généreux',
      description: 'Faites 100€ cumulés de dons toutes associations confondues',
      image: require('../assets/dudu/dudu_a_la_muscu.png'),
      unlocked: false,
      condition: '100€ cumulés de dons',
      target: 100
    },
    {
      id: 'cumulated_1000',
      name: 'Bienfaiteur',
      description: 'Faites 1000€ cumulés de dons toutes associations confondues',
      image: require('../assets/dudu/dudu_vole_il_est_un_ange.png'),
      unlocked: false,
      condition: '1000€ cumulés de dons',
      target: 1000
    },
    {
      id: 'loyality',
      name: 'Fidèle soutien',
      description: 'Faites 10 dons à la même association',
      image: require('../assets/dudu/dudu_chevalier_veut_se_battre.png'),
      unlocked: false,
      condition: '10 dons à la même association',
      target: 10
    },
    {
      id: 'completer',
      name: 'Objectif atteint',
      description: 'Soyez la personne qui termine un objectif de don d\'une association',
      image: require('../assets/dudu/dudu_chante.png'),
      unlocked: false,
      condition: 'Terminer un objectif de don'
    }
  ]);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // État pour le modal de sélection d'avatar
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  
  // Liste des avatars Dudu disponibles
  const avatarOptions = [
    { id: 'dudu_docteur', path: require('../assets/dudu/dudu_docteur.png') },
    { id: 'dudu_assis_mignon_bienvenue', path: require('../assets/dudu/dudu_assis_mignon_bienvenue.png') },
    { id: 'dudu_a_la_muscu', path: require('../assets/dudu/dudu_a_la_muscu.png') },
    { id: 'dudu_ballon_helium_reflechit_inquiet', path: require('../assets/dudu/dudu_ballon_helium_reflechit_inquiet.png') },
    { id: 'dudu_cadeau_dans_les_mains', path: require('../assets/dudu/dudu_cadeau_dans_les_mains.png') },
    { id: 'dudu_chante', path: require('../assets/dudu/dudu_chante.png') },
    { id: 'dudu_chevalier_veut_se_battre', path: require('../assets/dudu/dudu_chevalier_veut_se_battre.png') },
    { id: 'dudu_clin_doeil_et_bisous', path: require('../assets/dudu/dudu_clin_doeil_et_bisous.png') },
    { id: 'dudu_cupidon', path: require('../assets/dudu/dudu_cupidon.png') },
    { id: 'dudu_icone_coeur_rougit', path: require('../assets/dudu/dudu_icone_coeur_rougit.png') },
    { id: 'dudu_mignon_dans_un_bouquet_de_fleurs', path: require('../assets/dudu/dudu_mignon_dans_un_bouquet_de_fleurs.png') },
    { id: 'dudu_timide_baton_de_glace', path: require('../assets/dudu/dudu_timide_baton_de_glace.png') },
    { id: 'dudu_vole_il_est_un_ange', path: require('../assets/dudu/dudu_vole_il_est_un_ange.png') },
  ];
  
  // Charger les dons de l'utilisateur et vérifier s'il est administrateur
  useEffect(() => {
    loadDonations();
    
    // Vérifier si l'utilisateur est administrateur
    if (currentUser) {
      checkAdminStatus();
      // Charger les badges depuis Firebase
      loadBadgesFromFirebase();
      // Charger l'avatar de l'utilisateur
      loadUserAvatar();
      // Charger le nom d'utilisateur
      loadUserDisplayName();
    }
  }, [currentUser]);
  
  // Charger les badges depuis Firebase
  const loadBadgesFromFirebase = async () => {
    try {
      // Récupérer les badges débloqués dans Firebase
      const unlockedBadgesIds = await getUserBadges();
      
      // Mettre à jour l'état local des badges avec ceux débloqués dans Firebase
      const updatedBadges = badges.map(badge => ({
        ...badge,
        unlocked: unlockedBadgesIds.includes(badge.id)
      }));
      
      setBadges(updatedBadges);
      
      // Sauvegarder aussi dans AsyncStorage pour le chargement rapide
      saveBadgesToStorage(updatedBadges);
    } catch (error) {
      console.error('Erreur lors du chargement des badges depuis Firebase:', error);
      // Fallback sur les données locales si disponibles
      loadBadgesFromStorage();
    }
  };
  
  // Sauvegarder les badges dans AsyncStorage (pour chargement rapide)
  const saveBadgesToStorage = async (updatedBadges) => {
    try {
      if (!currentUser) return;
      
      const badgesKey = BADGES_STORAGE_KEY + currentUser.uid;
      await AsyncStorage.setItem(badgesKey, JSON.stringify(updatedBadges));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des badges dans AsyncStorage:', error);
    }
  };
  
  // Charger les badges depuis AsyncStorage (fallback)
  const loadBadgesFromStorage = async () => {
    try {
      if (!currentUser) return;
      
      const badgesKey = BADGES_STORAGE_KEY + currentUser.uid;
      const savedBadges = await AsyncStorage.getItem(badgesKey);
      if (savedBadges) {
        setBadges(JSON.parse(savedBadges));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des badges depuis AsyncStorage:', error);
    }
  };
  
  // Mettre à jour les badges dans Firebase
  const updateBadgesInFirebase = async (unlockedBadgeIds) => {
    try {
      await updateUserBadges(unlockedBadgeIds);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des badges dans Firebase:', error);
    }
  };

  // Charger les dons de l'utilisateur
  const loadDonations = async () => {
    try {
      if (!currentUser) return;
      
      setLoading(true);
      const userDonations = await getUserDonations();
      setDonations(userDonations);
      
      // Une fois les dons chargés, vérifier les badges
      if (userDonations.length > 0) {
        setTimeout(() => checkUnlockedBadges(), 500);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des dons:', error);
      Alert.alert('Erreur', 'Impossible de charger votre historique de dons.');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier les badges déverrouillés
  const checkUnlockedBadges = async () => {
    if (!currentUser || !donations.length) return;
    
    const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const donationsByAssociation = {};
    
    // Compter les dons par association pour le badge de fidélité
    donations.forEach(donation => {
      const assocId = donation.association.id;
      if (!donationsByAssociation[assocId]) {
        donationsByAssociation[assocId] = 0;
      }
      donationsByAssociation[assocId]++;
    });
    
    // Trouver le nombre maximum de dons pour une même association
    const maxDonationsForSameAssociation = Math.max(
      0, 
      ...Object.values(donationsByAssociation)
    );
    
    // Vérification des badges
    const updatedBadges = badges.map(badge => {
      let unlocked = badge.unlocked;
      // Ajout d'un champ de progression pour les badges qui en ont besoin
      let progress = 0;
      
      switch(badge.id) {
        case 'first_donation':
          unlocked = donations.length > 0;
          break;
        case 'cumulated_100':
          unlocked = totalDonations >= 100;
          // Calculer la progression (maximum 100%)
          progress = Math.min(100, (totalDonations / 100) * 100);
          break;
        case 'cumulated_1000':
          unlocked = totalDonations >= 1000;
          // Calculer la progression (maximum 100%)
          progress = Math.min(100, (totalDonations / 1000) * 100);
          break;
        case 'loyality':
          // Vérifier si une association a au moins 10 dons
          unlocked = Object.values(donationsByAssociation).some(count => count >= 10);
          // Calculer la progression en utilisant le nombre maximum de dons
          progress = Math.min(100, (maxDonationsForSameAssociation / 10) * 100);
          break;
        // Le badge 'completer' est géré côté serveur quand un objectif est atteint
      }
      
      return { ...badge, unlocked, progress };
    });
    
    setBadges(updatedBadges);
    
    // Sauvegarder localement pour accès rapide
    saveBadgesToStorage(updatedBadges);
    
    // Sauvegarder dans Firebase pour persistance à long terme
    const unlockedBadgeIds = updatedBadges
      .filter(badge => badge.unlocked)
      .map(badge => badge.id);
    
    updateBadgesInFirebase(unlockedBadgeIds);
  };

  // Vérifier si l'utilisateur est administrateur
  const checkAdminStatus = async () => {
    try {
      if (!currentUser) return;
      
      const adminData = await checkIfAdmin(currentUser.uid);
      if (adminData) {
        setIsAdmin(true);
        setAdminData(adminData);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut admin:', error);
    }
  };
  
  // Naviguer vers le tableau de bord administrateur
  const navigateToAdminDashboard = () => {
    navigation.navigate('AdminDashboardScreen', { adminData });
  };
  
  // Gérer la désactivation d'un don récurrent
  const handleCancelRecurringDonation = async () => {
    if (!selectedDonation) return;
    
    try {
      setLoading(true);
      await updateDonationStatus(selectedDonation.id, 'cancelled');
      
      // Mettre à jour la liste des dons
      loadDonations();
      
      // Fermer le modal
      setModalVisible(false);
      setSelectedDonation(null);
      
      Alert.alert(
        'Don récurrent désactivé',
        'Votre don récurrent a été désactivé avec succès.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur lors de la désactivation du don récurrent:', error);
      Alert.alert(
        'Erreur',
        'Impossible de désactiver votre don récurrent. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal pour confirmer la désactivation
  const openCancelModal = (donation) => {
    setSelectedDonation(donation);
    setModalVisible(true);
  };

  // Gérer la modification du reçu fiscal mensuel
  const handleMonthlyReceiptToggle = async (donationId, currentValue) => {
    try {
      setLoading(true);
      await updateDonationReceipt(donationId, !currentValue);
      
      // Mettre à jour la liste des dons
      loadDonations();
      
      Alert.alert(
        'Préférence mise à jour',
        `Vous ${!currentValue ? 'recevrez' : 'ne recevrez plus'} de reçu fiscal pour chaque prélèvement mensuel.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur lors de la modification des préférences de reçu:', error);
      Alert.alert(
        'Erreur',
        'Impossible de modifier vos préférences de reçu fiscal. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les dons selon l'onglet actif
  const filteredDonations = donations.filter(donation => {
    if (activeTab === 'terminés') {
      return donation.type === 'single' || (donation.type === 'recurrent' && donation.status === 'cancelled');
    } else {
      return donation.type === 'recurrent' && donation.status === 'active';
    }
  });
  
  // Déconnexion
  const handleLogout = async () => {
    try {
      if (!currentUser) return;
      await logout();
      navigation.replace('HomeScreen');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      Alert.alert('Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
    }
  };
  
  // Supprimer le compte
  const handleDeleteAccount = () => {
    if (!currentUser) return;
    
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            // Montrer Dudu blessé dans un modal avant de supprimer le compte
            setModalContent({
              title: 'Dudu est triste de vous voir partir',
              icon: require('../assets/dudu/dudu_blessé_et_pleure.png'),
              message: 'Votre compte va être supprimé définitivement dans quelques instants...',
              onConfirm: async () => {
                try {
                  await deleteUserAccount();
                  navigation.replace('HomeScreen');
                } catch (error) {
                  console.error('Erreur lors de la suppression du compte:', error);
                  
                  // Si l'erreur est liée à une authentification non récente
                  if (error.code === 'auth/requires-recent-login') {
                    Alert.alert(
                      'Reconnexion nécessaire',
                      'Pour des raisons de sécurité, vous devez vous reconnecter avant de supprimer votre compte.',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { 
                          text: 'Se reconnecter', 
                          onPress: async () => {
                            await logout();
                            navigation.replace('LoginScreen', { 
                              redirectAfterLogin: 'ProfileScreen',
                              showDeleteMessage: true
                            });
                          }
                        }
                      ]
                    );
                  } else {
                    Alert.alert('Erreur', 'Impossible de supprimer votre compte. Veuillez réessayer.');
                  }
                }
              }
            });
            setCustomModalVisible(true);
          }
        }
      ]
    );
  };
  
  // Rendu d'un élément de don
  const renderDonationItem = ({ item }) => {
    const date = new Date(item.createdAt.seconds * 1000);
    const formattedDate = date.toLocaleDateString('fr-FR');
    
    return (
      <View style={[
        styles.donationItem,
        settings.highContrast && styles.highContrastItem
      ]}>
        <View style={styles.donationHeader}>
          <Text style={[
            styles.donationAssociation,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            {item.association.name}
          </Text>
          <Text style={[
            styles.donationAmount,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            {item.amount}€
          </Text>
        </View>
        
        <View style={styles.donationDetails}>
          <Text style={[
            styles.donationDate,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            {formattedDate}
          </Text>
          <View style={styles.donationTypeContainer}>
            <Text style={[
              styles.donationType,
              item.type === 'recurrent' ? styles.recurrentType : styles.singleType,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              {item.type === 'single' ? 'Don unique' : 'Don récurrent'}
            </Text>
            {item.type === 'recurrent' && item.status === 'active' && (
              <Text style={[
                styles.statusBadge,
                settings.highContrast && styles.highContrastBadge,
                settings.largeText && styles.largeTextDescription
              ]}>
                Actif
              </Text>
            )}
            {item.type === 'recurrent' && item.status === 'cancelled' && (
              <Text style={[
                styles.statusBadge,
                styles.cancelledBadge,
                settings.highContrast && styles.highContrastBadge,
                settings.largeText && styles.largeTextDescription
              ]}>
                Annulé
              </Text>
            )}
          </View>
        </View>
        
        {/* Afficher la date de facturation pour les dons récurrents */}
        {item.type === 'recurrent' && item.recurringDay && (
          <View style={styles.recurringInfoContainer}>
            <Ionicons 
              name="calendar" 
              size={14} 
              color="#666" 
              style={styles.recurringIcon} 
            />
            <Text style={[
              styles.recurringInfoText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              Facturé le {item.recurringDay} de chaque mois
            </Text>
          </View>
        )}
        
        {/* Option pour modifier le reçu fiscal mensuel pour les dons récurrents actifs */}
        {item.type === 'recurrent' && item.status === 'active' && (
          <View style={styles.receiptPreferenceContainer}>
            <Text style={[
              styles.receiptPreferenceText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              Recevoir un reçu fiscal pour chaque prélèvement mensuel
            </Text>
            <Switch
              value={item.monthlyReceipt || false}
              onValueChange={() => handleMonthlyReceiptToggle(item.id, item.monthlyReceipt || false)}
              trackColor={{ false: '#d1d1d1', true: '#e5e0fa' }}
              thumbColor={item.monthlyReceipt ? '#5e48e8' : '#f4f3f4'}
              ios_backgroundColor="#d1d1d1"
              accessible={true}
              accessibilityLabel="Activer ou désactiver le reçu fiscal pour chaque prélèvement mensuel"
              accessibilityRole="switch"
              accessibilityState={{ checked: item.monthlyReceipt || false }}
            />
          </View>
        )}
        
        {/* Bouton de désactivation pour les dons récurrents actifs */}
        {item.type === 'recurrent' && item.status === 'active' && (
          <TouchableOpacity 
            style={[
              styles.cancelDonationButton,
              settings.highContrast && styles.highContrastCancelButton
            ]}
            onPress={() => openCancelModal(item)}
            accessible={true}
            accessibilityLabel="Désactiver ce don récurrent"
            accessibilityRole="button"
          >
            <Text style={[
              styles.cancelDonationButtonText,
              settings.highContrast && styles.highContrastCancelText,
              settings.largeText && styles.largeText
            ]}>
              Désactiver
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Ouvrir le modal des informations du badge
  const openBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setBadgeModalVisible(true);
  };
  
  // Rendu d'un badge
  const renderBadgeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.badgeItem}
      onPress={() => openBadgeModal(item)}
      accessible={true}
      accessibilityLabel={`Badge ${item.name}${item.unlocked ? ' déverrouillé' : ' verrouillé'}`}
    >
      <View style={[
        styles.badgeImageContainer,
        !item.unlocked && styles.badgeLocked
      ]}>
        <Image
          source={item.image}
          style={[
            styles.badgeImage,
            !item.unlocked && styles.badgeImageLocked
          ]}
          resizeMode="contain"
        />
      </View>
      <Text style={[
        styles.badgeName,
        settings.highContrast && styles.highContrastText,
        settings.largeText && styles.largeTextDescription
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Calculer la progression pour le badge actuellement sélectionné
  const calculateBadgeProgress = () => {
    if (!selectedBadge || selectedBadge.unlocked) return null;
    
    // Si le badge ne nécessite pas de progression (premier don ou objectif atteint)
    if (selectedBadge.id === 'first_donation' || selectedBadge.id === 'completer') {
      return null;
    }
    
    // Pour les badges qui nécessitent une progression
    const progress = selectedBadge.progress || 0;
    
    return {
      progress,
      current: selectedBadge.id === 'loyality' 
        ? Math.round((progress / 100) * 10) // Nombre de dons pour loyality (sur 10)
        : Math.round((progress / 100) * selectedBadge.target) // Montant pour les badges cumulés
    };
  };

  // Charger l'avatar de l'utilisateur
  const loadUserAvatar = async () => {
    try {
      // Si l'utilisateur est connecté et a un document dans Firestore
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.avatarPath) {
            // Trouver l'avatar correspondant dans notre liste
            const avatarOption = avatarOptions.find(option => option.id === userData.avatarPath);
            if (avatarOption) {
              setUserAvatar(avatarOption.path);
              setSelectedAvatar(avatarOption.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'avatar:', error);
    }
  };
  
  // Mettre à jour l'avatar de l'utilisateur
  const handleAvatarChange = async () => {
    if (!selectedAvatar) return;
    
    try {
      setLoading(true);
      await updateUserAvatar(selectedAvatar);
      
      // Mettre à jour l'avatar local
      const avatarOption = avatarOptions.find(option => option.id === selectedAvatar);
      if (avatarOption) {
        setUserAvatar(avatarOption.path);
      }
      
      setAvatarModalVisible(false);
      setLoading(false);
      
      // Afficher le modal personnalisé de confirmation au lieu de l'alerte
      setModalContent({
        title: 'Avatar mis à jour !',
        icon: avatarOption ? avatarOption.path : require('../assets/dudu/dudu_clin_doeil_et_bisous.png'),
        message: 'Votre nouveau Dudu vous accompagnera désormais dans toutes vos aventures !',
        onConfirm: () => {
          setCustomModalVisible(false);
        }
      });
      setCustomModalVisible(true);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      setLoading(false);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour votre avatar. Veuillez réessayer.'
      );
    }
  };
  
  // Rendu d'un élément d'avatar
  const renderAvatarItem = ({ item }) => {
    const isSelected = selectedAvatar === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.avatarOption,
          isSelected && styles.selectedAvatarOption,
          settings.highContrast && styles.highContrastItem,
          isSelected && settings.highContrast && styles.highContrastSelectedItem
        ]}
        onPress={() => setSelectedAvatar(item.id)}
        accessible={true}
        accessibilityLabel={`Sélectionner l'avatar ${item.id}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Image 
          source={item.path} 
          style={styles.avatarImage}
          resizeMode="contain"
        />
        {isSelected && (
          <View style={styles.selectedCheckmark}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={settings.highContrast ? "#000" : "#5e48e8"} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Charger le nom d'utilisateur depuis Firestore si nécessaire
  const loadUserDisplayName = async () => {
    try {
      if (currentUser) {
        // Si le nom d'utilisateur est déjà défini dans Auth, l'utiliser
        if (currentUser.displayName) {
          setUserDisplayName(currentUser.displayName);
          return;
        }
        
        // Sinon, essayer de le récupérer depuis Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.displayName) {
            setUserDisplayName(userData.displayName);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du nom d\'utilisateur:', error);
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Rediriger vers l'écran de connexion si aucun utilisateur n'est connecté */}
      {!currentUser && (
        <View style={styles.notLoggedInContainer}>
          <Text style={[
            styles.notLoggedInText,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Veuillez vous connecter pour accéder à votre profil
          </Text>
          <TouchableOpacity 
            style={[
              styles.loginButton,
              settings.highContrast && styles.highContrastActionButton
            ]}
            onPress={() => navigation.replace('LoginScreen')}
            accessible={true}
            accessibilityLabel="Se connecter"
            accessibilityRole="button"
          >
            <Text style={[
              styles.loginButtonText,
              settings.highContrast && styles.highContrastButtonText,
              settings.largeText && styles.largeText
            ]}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {currentUser && (
        <>
          {/* Modal pour les badges */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={badgeModalVisible}
            onRequestClose={() => setBadgeModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContainer,
                settings.highContrast && styles.highContrastSection
              ]}>
                {selectedBadge && (
                  <>
                    <TouchableOpacity 
                      style={styles.closeIconButton}
                      onPress={() => setBadgeModalVisible(false)}
                      accessible={true}
                      accessibilityLabel="Fermer"
                      accessibilityRole="button"
                    >
                      <Ionicons 
                        name="close" 
                        size={24} 
                        color={settings.highContrast ? "#000" : "#666"} 
                      />
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.modalTitle,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeText
                    ]}>
                      {selectedBadge.name}
                    </Text>
                    
                    <View style={styles.badgeModalImageContainer}>
                      <Image
                        source={selectedBadge.image}
                        style={[
                          styles.badgeModalImage,
                          !selectedBadge.unlocked && styles.badgeImageLocked
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                    
                    <Text style={[
                      styles.modalText,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeText
                    ]}>
                      {selectedBadge.unlocked 
                        ? 'Badge déverrouillé ! Félicitations !' 
                        : `À déverrouiller : ${selectedBadge.condition}`}
                    </Text>
                    
                    {/* Barre de progression pour les badges qui le nécessitent */}
                    {!selectedBadge.unlocked && calculateBadgeProgress() && (
                      <View style={styles.badgeProgressContainer}>
                        <View style={styles.badgeProgressBarContainer}>
                          <View 
                            style={[
                              styles.badgeProgressBar,
                              { width: `${calculateBadgeProgress().progress}%` }
                            ]} 
                          />
                        </View>
                        <Text style={[
                          styles.badgeProgressText,
                          settings.highContrast && styles.highContrastSubtext,
                          settings.largeText && styles.largeTextDescription
                        ]}>
                          {selectedBadge.id.includes('cumulated') 
                            ? `${calculateBadgeProgress().current}€ / ${selectedBadge.target}€` 
                            : `${calculateBadgeProgress().current} / ${selectedBadge.target} dons`}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          </Modal>
          
          {/* Modal de confirmation pour désactiver un don récurrent */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContainer,
                settings.highContrast && styles.highContrastSection
              ]}>
                <Text style={[
                  styles.modalTitle,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Désactiver le don récurrent
                </Text>
                
                <Text style={[
                  styles.modalText,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Êtes-vous sûr de vouloir désactiver votre don récurrent de {selectedDonation?.amount}€ pour {selectedDonation?.association?.name} ?
                </Text>
                
                <View style={styles.duduContainer}>
                  <Image 
                    source={require('../assets/dudu/dudu_assis_pleure.png')} 
                    style={styles.duduCancelImage} 
                    resizeMode="contain"
                  />
                </View>
                
                <Text style={[
                  styles.modalSubtext,
                  settings.highContrast && styles.highContrastSubtext,
                  settings.largeText && styles.largeTextDescription
                ]}>
                  Cette action arrêtera les futurs prélèvements mais ne remboursera pas les dons déjà effectués.
                </Text>
                
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.modalButton,
                      styles.modalCancelButton,
                      settings.highContrast && styles.highContrastCancelModal
                    ]}
                    onPress={() => setModalVisible(false)}
                    accessible={true}
                    accessibilityLabel="Annuler et fermer cette fenêtre"
                    accessibilityRole="button"
                  >
                    <Text style={[
                      styles.modalButtonText,
                      styles.modalCancelButtonText,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeText
                    ]}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modalButton,
                      styles.modalConfirmButton,
                      settings.highContrast && styles.highContrastConfirmModal
                    ]}
                    onPress={handleCancelRecurringDonation}
                    accessible={true}
                    accessibilityLabel="Confirmer la désactivation du don récurrent"
                    accessibilityRole="button"
                  >
                    <Text style={[
                      styles.modalButtonText,
                      styles.modalConfirmButtonText,
                      settings.highContrast && styles.highContrastConfirmButtonText,
                      settings.largeText && styles.largeText
                    ]}>
                      Désactiver
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal personnalisé pour Dudu */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={customModalVisible}
            onRequestClose={() => setCustomModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContainer,
                styles.avatarSuccessModal,
                settings.highContrast && styles.highContrastSection
              ]}>
                {modalContent && (
                  <>
                    <TouchableOpacity 
                      style={styles.closeIconButton}
                      onPress={() => {
                        setCustomModalVisible(false);
                        modalContent.onConfirm && modalContent.onConfirm();
                      }}
                      accessible={true}
                      accessibilityLabel="Fermer"
                      accessibilityRole="button"
                    >
                      <Ionicons 
                        name="close" 
                        size={24} 
                        color={settings.highContrast ? "#000" : "#666"} 
                      />
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.modalTitle,
                      styles.avatarSuccessTitle,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeTitle
                    ]}>
                      {modalContent.title}
                    </Text>
                    
                    <View style={styles.avatarSuccessContainer}>
                      <Image 
                        source={modalContent.icon} 
                        style={styles.avatarSuccessImage} 
                        resizeMode="contain"
                      />
                      <View style={styles.avatarSuccessCheck}>
                        <Ionicons 
                          name="checkmark-circle" 
                          size={36} 
                          color={settings.highContrast ? "#000" : "#4caf50"} 
                        />
                      </View>
                    </View>
                    
                    <Text style={[
                      styles.modalText,
                      styles.avatarSuccessMessage,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeText
                    ]}>
                      {modalContent.message}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Modal>

          {/* Modal de sélection d'avatar */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={avatarModalVisible}
            onRequestClose={() => setAvatarModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.avatarModalContainer,
                settings.highContrast && styles.highContrastSection
              ]}>
                <Text style={[
                  styles.modalTitle,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Choisissez votre avatar Dudu
                </Text>
                
                <View style={styles.avatarGridContainer}>
                  <View style={styles.avatarGridRow}>
                    {avatarOptions.slice(0, 3).map(item => (
                      <React.Fragment key={item.id}>
                        {renderAvatarItem({ item })}
                      </React.Fragment>
                    ))}
                  </View>
                  <View style={styles.avatarGridRow}>
                    {avatarOptions.slice(3, 6).map(item => (
                      <React.Fragment key={item.id}>
                        {renderAvatarItem({ item })}
                      </React.Fragment>
                    ))}
                  </View>
                  <View style={styles.avatarGridRow}>
                    {avatarOptions.slice(6, 9).map(item => (
                      <React.Fragment key={item.id}>
                        {renderAvatarItem({ item })}
                      </React.Fragment>
                    ))}
                  </View>
                  <View style={styles.avatarGridRow}>
                    {avatarOptions.slice(9, 12).map(item => (
                      <React.Fragment key={item.id}>
                        {renderAvatarItem({ item })}
                      </React.Fragment>
                    ))}
                  </View>
                  <View style={styles.avatarGridRow}>
                    {avatarOptions.slice(12).map(item => (
                      <React.Fragment key={item.id}>
                        {renderAvatarItem({ item })}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
                
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton}
                    onPress={() => setAvatarModalVisible(false)}
                    accessible={true}
                    accessibilityLabel="Annuler la sélection d'avatar"
                    accessibilityRole="button"
                  >
                    <Text style={[
                      styles.modalCancelButtonText,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeText
                    ]}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalConfirmButton}
                    onPress={handleAvatarChange}
                    disabled={!selectedAvatar || loading}
                    accessible={true}
                    accessibilityLabel="Confirmer la sélection d'avatar"
                    accessibilityRole="button"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[
                        styles.modalConfirmButtonText,
                        settings.highContrast && styles.highContrastConfirmButtonText,
                        settings.largeText && styles.largeText
                      ]}>
                        Confirmer
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
              Mon Profil
            </Text>
            <View style={styles.placeholderView} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[
              styles.profileSection,
              settings.highContrast && styles.highContrastSection
            ]}>
              <View style={styles.avatarContainer}>
                {userAvatar ? (
                  <Image 
                    source={userAvatar}
                    style={styles.profileAvatar}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={require('../assets/dudu/dudu_docteur.png')}
                    style={styles.profileAvatar}
                    resizeMode="contain"
                  />
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.editAvatarButton,
                    settings.highContrast && styles.highContrastEditButton
                  ]}
                  onPress={() => setAvatarModalVisible(true)}
                  accessible={true}
                  accessibilityLabel="Changer d'avatar"
                  accessibilityRole="button"
                >
                  <Ionicons 
                    name="pencil" 
                    size={16} 
                    color={settings.highContrast ? '#000' : '#fff'} 
                  />
                </TouchableOpacity>
              </View>
              
              <Text style={[
                styles.profileName,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                {userDisplayName || currentUser?.displayName || "Utilisateur"}
              </Text>
              
              <Text style={[
                styles.profileEmail,
                settings.highContrast && styles.highContrastSubtext,
                settings.largeText && styles.largeText
              ]}>
                {currentUser?.email || ""}
              </Text>
              
              <View style={styles.profileActions}>
                <TouchableOpacity 
                  style={[
                    styles.profileActionButton,
                    settings.highContrast && styles.highContrastActionButton
                  ]}
                  onPress={() => navigation.navigate('EditProfileScreen')}
                  accessible={true}
                  accessibilityLabel="Modifier le profil"
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.profileActionButtonText,
                    settings.highContrast && styles.highContrastButtonText,
                    settings.largeText && styles.largeText
                  ]}>
                    Modifier le profil
                  </Text>
                </TouchableOpacity>
                
                {/* Bouton Admin qui n'apparaît que si l'utilisateur est administrateur */}
                {isAdmin && (
                  <TouchableOpacity 
                    style={[
                      styles.profileActionButton,
                      styles.adminButton,
                      settings.highContrast && styles.highContrastAdminButton
                    ]}
                    onPress={navigateToAdminDashboard}
                    accessible={true}
                    accessibilityLabel="Accéder au tableau de bord administrateur"
                    accessibilityRole="button"
                  >
                    <Text style={[
                      styles.profileActionButtonText,
                      styles.adminButtonText,
                      settings.highContrast && styles.highContrastAdminText,
                      settings.largeText && styles.largeText
                    ]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.profileActionButton,
                    styles.logoutButton,
                    settings.highContrast && styles.highContrastLogoutButton
                  ]}
                  onPress={handleLogout}
                  accessible={true}
                  accessibilityLabel="Se déconnecter"
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.profileActionButtonText,
                    styles.logoutButtonText,
                    settings.highContrast && styles.highContrastLogoutText,
                    settings.largeText && styles.largeText
                  ]}>
                    Se déconnecter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Section des badges Dudu */}
            <View style={[
              styles.badgesSection,
              settings.highContrast && styles.highContrastSection
            ]}>
              <Text style={[
                styles.sectionTitle,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Mes badges Dudu
              </Text>
              
              <Text style={[
                styles.badgesDescription,
                settings.highContrast && styles.highContrastSubtext,
                settings.largeText && styles.largeTextDescription
              ]}>
                Collectionnez les badges en réalisant différentes actions. Touchez un badge pour voir comment l'obtenir.
              </Text>
              
              <View style={styles.badgesGrid}>
                {badges.map((badge) => (
                  <View key={badge.id}>
                    {renderBadgeItem({ item: badge })}
                  </View>
                ))}
              </View>
            </View>
            
            <View style={[
              styles.donationsSection,
              settings.highContrast && styles.highContrastSection
            ]}>
              <Text style={[
                styles.sectionTitle,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Historique des dons
              </Text>
              
              <View style={styles.tabsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.tab,
                    activeTab === 'terminés' && styles.activeTab,
                    settings.highContrast && styles.highContrastTab,
                    activeTab === 'terminés' && settings.highContrast && styles.highContrastActiveTab
                  ]}
                  onPress={() => setActiveTab('terminés')}
                  accessible={true}
                  accessibilityLabel="Dons terminés"
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'terminés' }}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === 'terminés' && styles.activeTabText,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}>
                    Dons ponctuels
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.tab,
                    activeTab === 'avenir' && styles.activeTab,
                    settings.highContrast && styles.highContrastTab,
                    activeTab === 'avenir' && settings.highContrast && styles.highContrastActiveTab
                  ]}
                  onPress={() => setActiveTab('avenir')}
                  accessible={true}
                  accessibilityLabel="Dons à venir"
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'avenir' }}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === 'avenir' && styles.activeTabText,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}>
                    Dons récurrents
                  </Text>
                </TouchableOpacity>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator 
                    size="large" 
                    color={settings.highContrast ? '#000' : '#5e48e8'} 
                  />
                  <Text style={[
                    styles.loadingText,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}>
                    Chargement de vos dons...
                  </Text>
                </View>
              ) : filteredDonations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[
                    styles.emptyText,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}>
                    {activeTab === 'terminés' 
                      ? "Vous n'avez pas encore effectué de dons ponctuels." 
                      : "Vous n'avez pas de dons récurrents actifs."}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredDonations}
                  renderItem={renderDonationItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  removeClippedSubviews={true}
                  key={activeTab}
                  contentContainerStyle={styles.donationsList}
                  style={styles.donationsListContainer}
                />
              )}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.deleteAccountButton,
                settings.highContrast && styles.highContrastDeleteButton
              ]}
              onPress={handleDeleteAccount}
              accessible={true}
              accessibilityLabel="Supprimer mon compte"
              accessibilityRole="button"
            >
              <Text style={[
                styles.deleteAccountButtonText,
                settings.highContrast && styles.highContrastDeleteText,
                settings.largeText && styles.largeText
              ]}>
                Supprimer mon compte
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highContrastButton: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 2,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  highContrastText: {
    color: '#000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  placeholderView: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  highContrastSection: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  profileIcon: {
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  highContrastSubtext: {
    color: '#333',
  },
  profileActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 15,
  },
  profileActionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 120,
  },
  highContrastActionButton: {
    backgroundColor: '#000',
  },
  profileActionButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  highContrastButtonText: {
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderColor: '#d32f2f',
  },
  logoutButtonText: {
    color: '#d32f2f',
  },
  highContrastLogoutButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  highContrastLogoutText: {
    color: '#000',
  },
  donationsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  highContrastTab: {
    borderColor: '#000',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5e48e8',
  },
  highContrastActiveTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#5e48e8',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  donationsList: {
    paddingTop: 5,
  },
  donationsListContainer: {
    maxHeight: 300, // Hauteur fixe pour la liste des dons
  },
  donationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  highContrastItem: {
    borderColor: '#000',
    borderWidth: 1,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  donationAssociation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  donationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  donationDate: {
    fontSize: 14,
    color: '#666',
  },
  donationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donationType: {
    fontSize: 14,
    color: '#666',
  },
  recurrentType: {
    color: '#5e48e8',
  },
  singleType: {
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#5e48e8',
    borderRadius: 8,
    padding: 4,
    paddingHorizontal: 8,
    marginLeft: 5,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cancelledBadge: {
    backgroundColor: '#d32f2f',
  },
  highContrastBadge: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 1,
    color: '#fff',
  },
  largeTextDescription: {
    fontSize: 12,
  },
  deleteAccountButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  highContrastDeleteButton: {
    borderColor: '#000',
    borderWidth: 2,
  },
  deleteAccountButtonText: {
    color: '#d32f2f',
    fontSize: 16,
  },
  highContrastDeleteText: {
    color: '#000',
  },
  largeText: {
    fontSize: 18,
  },
  cancelDonationButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  highContrastCancelButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  cancelDonationButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  highContrastCancelText: {
    color: '#000',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  closeIconButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 8,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
    borderRadius: 5,
    padding: 8,
    marginLeft: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
  },
  highContrastCancelModal: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  highContrastConfirmModal: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 2,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 2,
  },
  modalCancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  highContrastConfirmButtonText: {
    color: '#fff',
  },
  recurringInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 15,
  },
  recurringIcon: {
    marginRight: 5,
  },
  recurringInfoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  receiptPreferenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
    paddingTop: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  receiptPreferenceText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    paddingRight: 10,
  },
  adminButton: {
    backgroundColor: '#5e48e8',
    borderColor: '#5e48e8',
  },
  adminButtonText: {
    color: '#fff',
  },
  highContrastAdminButton: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 2,
  },
  highContrastAdminText: {
    color: '#fff',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    color: '#666',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#5e48e8',
    borderColor: '#5e48e8',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour les badges
  badgesSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginVertical: 15,
  },
  badgesDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  badgeItem: {
    alignItems: 'center',
    width: width / 3 - 30,
    marginBottom: 15,
  },
  badgeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  badgeLocked: {
    borderColor: '#ccc',
  },
  badgeImage: {
    width: 70,
    height: 70,
  },
  badgeImageLocked: {
    opacity: 0.5,
    tintColor: '#999',
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  badgeModalImageContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    alignSelf: 'center',
  },
  badgeModalImage: {
    width: 150,
    height: 150,
  },
  // Styles pour la barre de progression des badges
  badgeProgressContainer: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
    width: '100%',
  },
  badgeProgressBarContainer: {
    height: 12,
    width: '90%',
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeProgressBar: {
    height: '100%',
    backgroundColor: '#5e48e8',
    borderRadius: 6,
  },
  badgeProgressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  // Styles pour les badges et Dudu
  duduContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  duduCancelImage: {
    width: 100,
    height: 100,
  },
  duduDeleteImage: {
    width: 150,
    height: 150,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f0f0',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5e48e8',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  highContrastEditButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
  },
  avatarModalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    width: '85%',
    maxWidth: 300,
    alignItems: 'center',
  },
  avatarGridContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  avatarOption: {
    width: 65,
    height: 65,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '70%',
    height: '70%',
  },
  selectedAvatarOption: {
    borderColor: '#5e48e8',
    borderWidth: 3,
  },
  highContrastSelectedItem: {
    borderColor: '#000',
    borderWidth: 3,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 0,
  },
  avatarSuccessModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 320,
  },
  avatarSuccessTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 10,
    textAlign: 'center',
  },
  avatarSuccessContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  avatarSuccessImage: {
    width: 150,
    height: 150,
  },
  avatarSuccessCheck: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarSuccessMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarSuccessButton: {
    backgroundColor: '#5e48e8',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  avatarSuccessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  largeTitle: {
    fontSize: 28,
  },
}); 