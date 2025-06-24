import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SpeechService from '../../services/SpeechService';
import { 
  getAssociationDonations, 
  getDonationTotalsByYear, 
  getRecurringDonations,
  getAssociationGoal,
  updateAssociationGoal,
  deleteAssociationGoal
} from '../../firebase/models/AdminModel';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation, route }) {
  const { adminData } = route.params;
  const { settings } = useAccessibility();
  const { logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [totalsByYear, setTotalsByYear] = useState({});
  const [recurringDonations, setRecurringDonations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalEndDate, setGoalEndDate] = useState('');
  const [currentGoal, setCurrentGoal] = useState(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [associationName, setAssociationName] = useState('Association');
  
  // Nouvelles variables pour le tri et la recherche
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' ou 'desc'
  const [sortPeriod, setSortPeriod] = useState('all'); // 'all', 'day', 'week', 'month', 'year'
  const [searchEmail, setSearchEmail] = useState('');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Charger les données au montage du composant
  useEffect(() => {
    loadAdminData();
    loadAssociationGoal();
  }, []);
  
  // Effet pour la synthèse vocale
  useEffect(() => {
    if (settings.textToSpeech) {
      SpeechService.speak(`Tableau de bord administrateur de l'association`);
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech]);
  
  // Récupérer les données d'administration
  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les dons de l'association
      const associationDonations = await getAssociationDonations(adminData.associationId);
      setDonations(associationDonations);
      
      // Récupérer le nom de l'association à partir du premier don si disponible
      if (associationDonations.length > 0 && associationDonations[0].association && associationDonations[0].association.name) {
        setAssociationName(associationDonations[0].association.name);
      }
      
      // Déboguer les dons pour voir les emails
      logDonationsForDebug(associationDonations);
      
      // Calculer les totaux par année
      const yearlyTotals = await getDonationTotalsByYear(adminData.associationId);
      setTotalsByYear(yearlyTotals);
      
      // Récupérer les dons récurrents
      const recurringDons = await getRecurringDonations(adminData.associationId);
      setRecurringDonations(recurringDons);
    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour déboguer les dons et leurs emails
  const logDonationsForDebug = (donationsArray) => {
    if (donationsArray && donationsArray.length > 0) {
      console.log(`Nombre total de dons: ${donationsArray.length}`);
      donationsArray.forEach((donation, index) => {
        console.log(`Don #${index+1} - Montant: ${donation.amount}€, Email: ${donation.email || 'Non renseigné'}`);
      });
    } else {
      console.log('Aucun don trouvé pour déboguer');
    }
  };
  
  // Charger l'objectif de dons
  const loadAssociationGoal = async () => {
    try {
      const goal = await getAssociationGoal(adminData.associationId);
      if (goal) {
        setCurrentGoal(goal);
        // Préremplir les champs avec les valeurs actuelles
        setGoalAmount(goal.amount.toString());
        setGoalTitle(goal.title || '');
        setGoalDescription(goal.description || '');
        setGoalEndDate(goal.endDate ? formatDate(goal.endDate) : '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'objectif:', error);
    }
  };
  
  // Sauvegarder l'objectif de dons
  const saveAssociationGoal = async () => {
    try {
      setSavingGoal(true);
      
      // Validation des champs
      if (!goalAmount || isNaN(parseFloat(goalAmount)) || parseFloat(goalAmount) <= 0) {
        Alert.alert('Erreur', 'Veuillez saisir un montant valide supérieur à 0.');
        setSavingGoal(false);
        return;
      }
      
      if (!goalTitle.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir un titre pour l\'objectif.');
        setSavingGoal(false);
        return;
      }
      
      // Préparer les données
      const goalData = {
        amount: parseFloat(goalAmount),
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        associationId: adminData.associationId,
        updatedAt: new Date()
      };
      
      // Si c'est un nouvel objectif ou remplacement d'un objectif, créer une nouvelle date de création
      if (!currentGoal) {
        goalData.createdAt = new Date();
      }
      
      // Ajouter la date de fin si spécifiée
      if (goalEndDate && goalEndDate.trim()) {
        // Format attendu: JJ/MM/AAAA
        const parts = goalEndDate.split('/');
        if (parts.length === 3) {
          const endDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (!isNaN(endDate.getTime())) {
            goalData.endDate = endDate;
          }
        }
      }
      
      // Mise à jour dans Firebase
      await updateAssociationGoal(adminData.associationId, goalData);
      
      // Fermer la modal
      setGoalModalVisible(false);
      
      // Recharger l'objectif
      await loadAssociationGoal();
      
      Alert.alert('Succès', 'L\'objectif de dons a été mis à jour avec succès.');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'objectif:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde de l\'objectif.');
    } finally {
      setSavingGoal(false);
    }
  };
  
  // Après la fonction saveAssociationGoal, ajouter cette nouvelle fonction
  const handleDeleteGoal = async () => {
    try {
      // Demander confirmation avant de supprimer
      Alert.alert(
        "Supprimer l'objectif",
        "Êtes-vous sûr de vouloir supprimer cet objectif de don ? Cette action est irréversible.",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              
              // Supprimer l'objectif
              const deleted = await deleteAssociationGoal(adminData.associationId);
              
              if (deleted) {
                // Réinitialiser les états
                setCurrentGoal(null);
                setGoalAmount('');
                setGoalTitle('');
                setGoalDescription('');
                setGoalEndDate('');
                
                Alert.alert("Succès", "L'objectif de don a été supprimé avec succès.");
              } else {
                Alert.alert("Erreur", "Aucun objectif trouvé pour cette association.");
              }
              
              setLoading(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'objectif:', error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la suppression de l'objectif.");
      setLoading(false);
    }
  };
  
  // Calculer le pourcentage d'avancement de l'objectif
  const calculateGoalProgress = () => {
    if (!currentGoal || !totalsByYear) return 0;
    
    // Récupérer la date de création de l'objectif
    const goalCreationDate = currentGoal.createdAt ? 
      (currentGoal.createdAt.toDate ? currentGoal.createdAt.toDate() : new Date(currentGoal.createdAt)) : 
      (currentGoal.updatedAt ? (currentGoal.updatedAt.toDate ? currentGoal.updatedAt.toDate() : new Date(currentGoal.updatedAt)) : new Date());
    
    // Filtrer les dons après la création de l'objectif
    const relevantDonations = donations.filter(donation => {
      const donationDate = donation.createdAt.toDate ? donation.createdAt.toDate() : new Date(donation.createdAt);
      return donationDate >= goalCreationDate;
    });
    
    // Calculer le total des dons pertinents
    const totalSinceGoalCreation = relevantDonations.reduce((sum, donation) => sum + donation.amount, 0);
    
    // Calculer le pourcentage
    const percentage = (totalSinceGoalCreation / currentGoal.amount) * 100;
    return Math.min(percentage, 100); // Limiter à 100%
  };
  
  // Ajouter une nouvelle fonction pour calculer le montant total depuis la création de l'objectif
  const calculateTotalSinceGoalCreation = () => {
    if (!currentGoal || !donations.length) return 0;
    
    // Récupérer la date de création de l'objectif
    const goalCreationDate = currentGoal.createdAt ? 
      (currentGoal.createdAt.toDate ? currentGoal.createdAt.toDate() : new Date(currentGoal.createdAt)) : 
      (currentGoal.updatedAt ? (currentGoal.updatedAt.toDate ? currentGoal.updatedAt.toDate() : new Date(currentGoal.updatedAt)) : new Date());
    
    // Filtrer les dons après la création de l'objectif
    const relevantDonations = donations.filter(donation => {
      const donationDate = donation.createdAt.toDate ? donation.createdAt.toDate() : new Date(donation.createdAt);
      return donationDate >= goalCreationDate;
    });
    
    // Calculer le total des dons pertinents
    return relevantDonations.reduce((sum, donation) => sum + donation.amount, 0);
  };
  
  // Formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  // Se déconnecter
  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('HomeScreen');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };
  
  // Rendu d'un don dans la liste
  const renderDonationItem = ({ item }) => (
    <View style={[
      styles.donationItem,
      settings.highContrast && styles.highContrastItem
    ]}>
      <View style={styles.donationHeader}>
        <Text style={[
          styles.donationAmount,
          settings.highContrast && styles.highContrastText,
          settings.largeText && styles.largeText
        ]}>
          {item.amount}€
        </Text>
        <Text style={[
          styles.donationDate,
          settings.highContrast && styles.highContrastSecondaryText,
          settings.largeText && styles.largeText
        ]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      <View style={styles.donationDetails}>
        <Text style={[
          styles.donationLabel,
          settings.highContrast && styles.highContrastSecondaryText,
          settings.largeText && styles.largeText
        ]}>
          Type: {item.isRecurrent ? 'Récurrent' : 'Unique'}
        </Text>
        
        <Text style={[
          styles.donationLabel,
          settings.highContrast && styles.highContrastSecondaryText,
          settings.largeText && styles.largeText
        ]}>
          Méthode: {item.paymentMethod || 'Non spécifié'}
        </Text>
        
        <Text style={[
          styles.donationLabel,
          settings.highContrast && styles.highContrastSecondaryText,
          settings.largeText && styles.largeText
        ]}>
          Email: {item.email || 'Non renseigné'}
        </Text>
        
        <View style={styles.donationFlags}>
          {item.wantReceipt && (
            <View style={[
              styles.flagItem,
              settings.highContrast && styles.highContrastFlagItem
            ]}>
              <Ionicons 
                name="receipt-outline" 
                size={14} 
                color={settings.highContrast ? "#000" : "#5e48e8"} 
              />
              <Text style={[
                styles.flagText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                {item.isRecurrent ? "Reçu fiscal mensuel" : "Reçu fiscal"}
              </Text>
            </View>
          )}
          
          {item.isAnonymous && (
            <View style={[
              styles.flagItem,
              settings.highContrast && styles.highContrastFlagItem
            ]}>
              <Ionicons 
                name="eye-off-outline" 
                size={14} 
                color={settings.highContrast ? "#000" : "#5e48e8"} 
              />
              <Text style={[
                styles.flagText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Anonyme
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
  
  // Après la fonction loadAssociationGoal, j'ajoute une nouvelle fonction pour filtrer les dons uniques
  const getOneTimeDonations = () => {
    return donations.filter(donation => !donation.isRecurrent);
  };
  
  // Fonction pour trier et filtrer les dons
  const getSortedAndFilteredDonations = () => {
    // Filtrer par période si nécessaire
    let filteredDonations = [...donations];
    
    // Filtrer par email si une recherche est en cours
    if (searchEmail.trim() !== '') {
      filteredDonations = filteredDonations.filter(donation => 
        donation.email && donation.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }
    
    // Filtrer par période
    const now = new Date();
    if (sortPeriod !== 'all') {
      filteredDonations = filteredDonations.filter(donation => {
        const donationDate = donation.createdAt.toDate ? donation.createdAt.toDate() : new Date(donation.createdAt);
        
        switch (sortPeriod) {
          case 'day':
            return donationDate.toDateString() === now.toDateString();
          case 'week': {
            // Calcul du début de la semaine (lundi)
            const firstDayOfWeek = new Date(now);
            const dayOfWeek = firstDayOfWeek.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=dimanche, 1=lundi, etc.
            firstDayOfWeek.setDate(firstDayOfWeek.getDate() - diff);
            firstDayOfWeek.setHours(0, 0, 0, 0);
            return donationDate >= firstDayOfWeek;
          }
          case 'month': {
            return donationDate.getMonth() === now.getMonth() && 
                   donationDate.getFullYear() === now.getFullYear();
          }
          case 'year':
            return donationDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }
    
    // Trier par date
    return filteredDonations.sort((a, b) => {
      const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Retourner un texte décrivant la période actuelle de tri
  const getSortPeriodLabel = () => {
    switch (sortPeriod) {
      case 'day': return "Aujourd'hui";
      case 'week': return "Cette semaine";
      case 'month': return "Ce mois";
      case 'year': return "Cette année";
      default: return "Tous les dons";
    }
  };
  
  // Rendu de la vue d'aperçu des statistiques
  const renderOverview = () => (
    <View style={styles.statsContainer}>
      {renderGoalSection()}
      
      {Object.keys(totalsByYear).length > 0 ? (
        <View style={styles.yearlyStats}>
          <Text style={[
            styles.sectionTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Totaux des dons par année
          </Text>
          
          {Object.entries(totalsByYear)
            .sort(([yearA], [yearB]) => yearB - yearA) // Trier par année décroissante
            .map(([year, total]) => (
              <View 
                key={year} 
                style={[
                  styles.yearStatItem,
                  settings.highContrast && styles.highContrastItem
                ]}
                accessible={true}
                accessibilityLabel={`Année ${year}: ${total} euros de dons`}
              >
                <Text style={[
                  styles.yearText,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  {year}
                </Text>
                <Text style={[
                  styles.totalAmount,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  {total}€
                </Text>
              </View>
            ))
          }
        </View>
      ) : (
        <Text style={[
          styles.emptyText,
          settings.highContrast && styles.highContrastSecondaryText,
          settings.largeText && styles.largeText
        ]}>
          Aucun don enregistré pour le moment
        </Text>
      )}
      
      <View style={styles.recurringDonatorsContainer}>
        <Text style={[
          styles.sectionTitle,
          settings.highContrast && styles.highContrastText,
          settings.largeText && styles.largeText
        ]}>
          Dons récurrents ({recurringDonations.length})
        </Text>
        
        {recurringDonations.length > 0 ? (
          <View style={styles.recurringList}>
            {recurringDonations.map((donation, index) => (
              <View 
                key={donation.id} 
                style={[
                  styles.recurringItem,
                  settings.highContrast && styles.highContrastItem,
                  index === recurringDonations.length - 1 && styles.lastItem
                ]}
                accessible={true}
                accessibilityLabel={`Don récurrent de ${donation.amount} euros établi le ${formatDate(donation.createdAt)}`}
              >
                <View style={styles.recurringHeader}>
                  <Text style={[
                    styles.recurringAmount,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}>
                    {donation.amount}€ / mois
                  </Text>
                  <Text style={[
                    styles.recurringDate,
                    settings.highContrast && styles.highContrastSecondaryText,
                    settings.largeText && styles.largeText
                  ]}>
                    {formatDate(donation.createdAt)}
                  </Text>
                </View>
                
                <Text style={[
                  styles.recurringDetails,
                  settings.highContrast && styles.highContrastSecondaryText,
                  settings.largeText && styles.largeText
                ]}>
                  Prélevé le {donation.recurringDay || 5} de chaque mois
                </Text>

                {donation.email && (
                  <Text style={[
                    styles.recurringEmail,
                    settings.highContrast && styles.highContrastSecondaryText,
                    settings.largeText && styles.largeText
                  ]}>
                    Email: {donation.email}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={[
            styles.emptyText,
            settings.highContrast && styles.highContrastSecondaryText,
            settings.largeText && styles.largeText
          ]}>
            Aucun don récurrent pour le moment
          </Text>
        )}
      </View>
      
      {/* Nouvelle section pour les dons uniques */}
      <View style={styles.oneTimeDonationsContainer}>
        <Text style={[
          styles.sectionTitle,
          settings.highContrast && styles.highContrastText,
          settings.largeText && styles.largeText
        ]}>
          Dons uniques ({getOneTimeDonations().length})
        </Text>
        
        {getOneTimeDonations().length > 0 ? (
          <View style={styles.oneTimeList}>
            {getOneTimeDonations().slice(0, 5).map((donation, index) => (
              <View 
                key={donation.id} 
                style={[
                  styles.oneTimeItem,
                  settings.highContrast && styles.highContrastItem,
                  index === Math.min(getOneTimeDonations().length, 5) - 1 && styles.lastItem
                ]}
                accessible={true}
                accessibilityLabel={`Don unique de ${donation.amount} euros effectué le ${formatDate(donation.createdAt)}`}
              >
                <View style={styles.oneTimeHeader}>
                  <Text style={[
                    styles.oneTimeAmount,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}>
                    {donation.amount}€
                  </Text>
                  <Text style={[
                    styles.oneTimeDate,
                    settings.highContrast && styles.highContrastSecondaryText,
                    settings.largeText && styles.largeText
                  ]}>
                    {formatDate(donation.createdAt)}
                  </Text>
                </View>
                
                <Text style={[
                  styles.oneTimePaymentMethod,
                  settings.highContrast && styles.highContrastSecondaryText,
                  settings.largeText && styles.largeText
                ]}>
                  Paiement: {donation.paymentMethod || "Non spécifié"}
                </Text>

                {donation.email && (
                  <Text style={[
                    styles.oneTimeEmail,
                    settings.highContrast && styles.highContrastSecondaryText,
                    settings.largeText && styles.largeText
                  ]}>
                    Email: {donation.email}
                  </Text>
                )}
              </View>
            ))}
            
            {getOneTimeDonations().length > 5 && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => setActiveTab('donations')}
                accessible={true}
                accessibilityLabel="Voir tous les dons"
                accessibilityRole="button"
              >
                <Text style={[
                  styles.seeMoreText,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Voir tous les dons ({getOneTimeDonations().length - 5} de plus)
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={settings.highContrast ? "#000" : "#5e48e8"}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[
            styles.emptyText,
            settings.highContrast && styles.highContrastSecondaryText,
            settings.largeText && styles.largeText
          ]}>
            Aucun don unique pour le moment
          </Text>
        )}
      </View>
    </View>
  );
  
  // Ajout du rendu de l'objectif de dons dans la vue d'aperçu
  const renderGoalSection = () => (
    <View style={styles.goalContainer}>
      <View style={styles.goalHeader}>
        <Text style={[
          styles.sectionTitle,
          settings.highContrast && styles.highContrastText,
          settings.largeText && styles.largeText
        ]}>
          Objectif de dons
        </Text>
        
        <View style={styles.goalHeaderButtons}>
          {currentGoal && (
            <TouchableOpacity 
              style={[
                styles.deleteGoalButton,
                settings.highContrast && styles.highContrastDeleteButton
              ]}
              onPress={handleDeleteGoal}
              accessible={true}
              accessibilityLabel="Supprimer l'objectif de dons"
              accessibilityRole="button"
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color={settings.highContrast ? "#000" : "#ff4d4d"} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.editGoalButton,
              settings.highContrast && styles.highContrastButton
            ]}
            onPress={() => setGoalModalVisible(true)}
            accessible={true}
            accessibilityLabel="Modifier l'objectif de dons"
            accessibilityRole="button"
          >
            <Ionicons 
              name="create-outline" 
              size={20} 
              color={settings.highContrast ? "#000" : "#5e48e8"} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {currentGoal ? (
        <View style={styles.goalContent}>
          <Text style={[
            styles.goalTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            {currentGoal.title}
          </Text>
          
          {currentGoal.description && (
            <Text style={[
              styles.goalDescription,
              settings.highContrast && styles.highContrastSecondaryText,
              settings.largeText && styles.largeText
            ]}>
              {currentGoal.description}
            </Text>
          )}
          
          <View style={styles.goalProgressContainer}>
            <View style={styles.goalAmountRow}>
              <Text style={[
                styles.goalCurrentAmount,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                {calculateTotalSinceGoalCreation()}€
              </Text>
              <Text style={[
                styles.goalTargetAmount,
                settings.highContrast && styles.highContrastSecondaryText,
                settings.largeText && styles.largeText
              ]}>
                objectif : {currentGoal.amount}€
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  {width: `${calculateGoalProgress()}%`},
                  settings.highContrast && styles.highContrastProgressBar
                ]} 
              />
            </View>
            
            {currentGoal.endDate && (
              <Text style={[
                styles.goalEndDate,
                settings.highContrast && styles.highContrastSecondaryText,
                settings.largeText && styles.largeText
              ]}>
                Date limite : {formatDate(currentGoal.endDate)}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addGoalButton}
          onPress={() => setGoalModalVisible(true)}
          accessible={true}
          accessibilityLabel="Ajouter un objectif de dons"
          accessibilityRole="button"
        >
          <Ionicons 
            name="add-circle-outline" 
            size={24} 
            color={settings.highContrast ? "#000" : "#5e48e8"} 
          />
          <Text style={[
            styles.addGoalText,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Ajouter un objectif de dons
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Rendu des onglets
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[
          styles.tab,
          activeTab === 'overview' && styles.activeTab,
          settings.highContrast && styles.highContrastTab,
          activeTab === 'overview' && settings.highContrast && styles.highContrastActiveTab
        ]}
        onPress={() => setActiveTab('overview')}
        accessible={true}
        accessibilityLabel="Vue d'ensemble"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'overview' }}
      >
        <Ionicons 
          name="analytics-outline" 
          size={20} 
          color={activeTab === 'overview' 
            ? (settings.highContrast ? '#000000' : '#5e48e8') 
            : (settings.highContrast ? '#333333' : '#9e9e9e')} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'overview' && styles.activeTabText,
          settings.highContrast && styles.highContrastTabText,
          activeTab === 'overview' && settings.highContrast && styles.highContrastActiveTabText,
          settings.largeText && styles.largeText
        ]}>
          Vue d'ensemble
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tab,
          activeTab === 'donations' && styles.activeTab,
          settings.highContrast && styles.highContrastTab,
          activeTab === 'donations' && settings.highContrast && styles.highContrastActiveTab
        ]}
        onPress={() => setActiveTab('donations')}
        accessible={true}
        accessibilityLabel="Liste des dons"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'donations' }}
      >
        <Ionicons 
          name="list-outline" 
          size={20} 
          color={activeTab === 'donations' 
            ? (settings.highContrast ? '#000000' : '#5e48e8') 
            : (settings.highContrast ? '#333333' : '#9e9e9e')} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'donations' && styles.activeTabText,
          settings.highContrast && styles.highContrastTabText,
          activeTab === 'donations' && settings.highContrast && styles.highContrastActiveTabText,
          settings.largeText && styles.largeText
        ]}>
          Liste des dons
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
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
          Admin - Tableau de bord
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.logoutButton,
            settings.highContrast && styles.highContrastButton
          ]}
          onPress={handleLogout}
          accessible={true}
          accessibilityLabel="Se déconnecter"
          accessibilityRole="button"
        >
          <Ionicons 
            name="log-out-outline" 
            size={24} 
            color={settings.highContrast ? "#000" : "#444"} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.roleInfo}>
        <Ionicons 
          name="person-circle-outline" 
          size={20} 
          color={settings.highContrast ? "#000" : "#5e48e8"} 
        />
        <Text style={[
          styles.roleText,
          settings.highContrast && styles.highContrastText,
          settings.largeText && styles.largeText
        ]}>
          {adminData.role} - {associationName}
        </Text>
      </View>
      
      {renderTabs()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5e48e8" />
          <Text style={[
            styles.loadingText,
            settings.highContrast && styles.highContrastSecondaryText,
            settings.largeText && styles.largeText
          ]}>
            Chargement des données...
          </Text>
        </View>
      ) : (
        activeTab === 'overview' ? (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {renderOverview()}
          </ScrollView>
        ) : (
          <FlatList
            data={getSortedAndFilteredDonations()}
            renderItem={renderDonationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.filterContainer}>
                <View style={styles.searchContainer}>
                  <Ionicons 
                    name="search-outline" 
                    size={18} 
                    color={settings.highContrast ? "#000" : "#757575"} 
                    style={styles.searchIcon}
                  />
                  <TextInput 
                    style={[
                      styles.searchInput,
                      settings.highContrast && styles.highContrastInput,
                      settings.largeText && styles.largeText
                    ]}
                    placeholder="Rechercher par email..."
                    value={searchEmail}
                    onChangeText={setSearchEmail}
                    clearButtonMode="while-editing"
                    accessible={true}
                    accessibilityLabel="Rechercher des dons par adresse email"
                  />
                  {searchEmail.length > 0 && (
                    <TouchableOpacity 
                      style={styles.searchClearButton}
                      onPress={() => setSearchEmail('')}
                      accessible={true}
                      accessibilityLabel="Effacer la recherche"
                      accessibilityRole="button"
                    >
                      <Ionicons 
                        name="close-circle" 
                        size={20} 
                        color={settings.highContrast ? "#000" : "#757575"} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.filtersHeader}>
                  <Text style={[
                    styles.resultsCount,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}>
                    {getSortedAndFilteredDonations().length} résultat{getSortedAndFilteredDonations().length > 1 ? 's' : ''}
                  </Text>
                </View>
                
                <View style={[
                  styles.sortOptionsBar,
                  showSortOptions && styles.sortOptionsBarActive
                ]}>
                  <TouchableOpacity 
                    style={styles.sortToggleButton}
                    onPress={() => setShowSortOptions(!showSortOptions)}
                    accessible={true}
                    accessibilityLabel="Afficher les options de tri"
                    accessibilityRole="button"
                  >
                    <Text style={[
                      styles.sortToggleText,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeText
                    ]}>
                      {getSortPeriodLabel()}
                    </Text>
                    <Ionicons 
                      name={showSortOptions ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={settings.highContrast ? "#000" : "#757575"} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.sortOrderButton}
                    onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    accessible={true}
                    accessibilityLabel="Changer l'ordre de tri"
                    accessibilityRole="button"
                  >
                    <Ionicons 
                      name={sortOrder === 'desc' ? "arrow-down" : "arrow-up"} 
                      size={18} 
                      color={settings.highContrast ? "#000" : "#5e48e8"} 
                    />
                    <Text style={[
                      styles.sortOrderText,
                      settings.highContrast && styles.highContrastText,
                      settings.largeText && styles.largeText
                    ]}>
                      {sortOrder === 'desc' ? "Plus récent" : "Plus ancien"}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {showSortOptions && (
                  <View style={styles.sortOptionsDropdown}>
                    {[
                      { id: 'all', label: 'Tous les dons' },
                      { id: 'day', label: "Aujourd'hui" },
                      { id: 'week', label: 'Cette semaine' },
                      { id: 'month', label: 'Ce mois' },
                      { id: 'year', label: 'Cette année' }
                    ].map(option => (
                      <TouchableOpacity 
                        key={option.id}
                        style={[
                          styles.sortOptionItem,
                          sortPeriod === option.id && styles.sortOptionSelected,
                          settings.highContrast && sortPeriod === option.id && styles.highContrastOptionSelected
                        ]}
                        onPress={() => {
                          setSortPeriod(option.id);
                          setShowSortOptions(false);
                        }}
                        accessible={true}
                        accessibilityLabel={option.label}
                        accessibilityRole="menuitem"
                        accessibilityState={{ selected: sortPeriod === option.id }}
                      >
                        <Text style={[
                          styles.sortOptionText,
                          sortPeriod === option.id && styles.sortOptionTextSelected,
                          settings.highContrast && styles.highContrastText,
                          settings.largeText && styles.largeText
                        ]}>
                          {option.label}
                        </Text>
                        {sortPeriod === option.id && (
                          <Ionicons 
                            name="checkmark" 
                            size={18} 
                            color={settings.highContrast ? "#000" : "#5e48e8"} 
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <Text style={[
                styles.emptyText,
                settings.highContrast && styles.highContrastSecondaryText,
                settings.largeText && styles.largeText
              ]}>
                {searchEmail ? 
                  `Aucun don trouvé pour l'email "${searchEmail}"` : 
                  sortPeriod !== 'all' ? 
                    `Aucun don pour ${getSortPeriodLabel().toLowerCase()}` : 
                    'Aucun don enregistré pour le moment'
                }
              </Text>
            }
          />
        )
      )}
      
      {/* Modal pour définir l'objectif */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={goalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.modalContent,
            settings.highContrast && styles.highContrastModalContent
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                {currentGoal ? 'Modifier l\'objectif' : 'Ajouter un objectif'}
              </Text>
              
              <TouchableOpacity 
                onPress={() => setGoalModalVisible(false)}
                accessible={true}
                accessibilityLabel="Fermer"
                accessibilityRole="button"
              >
                <Ionicons 
                  name="close-outline" 
                  size={24} 
                  color={settings.highContrast ? "#000" : "#444"} 
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Montant objectif (€)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                  placeholder="Montant en euros"
                  keyboardType="numeric"
                  accessible={true}
                  accessibilityLabel="Montant objectif en euros"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Titre de la campagne
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                  placeholder="Ex: Collecte pour le nouveau matériel"
                  accessible={true}
                  accessibilityLabel="Titre de la campagne"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Description (optionnel)
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={goalDescription}
                  onChangeText={setGoalDescription}
                  placeholder="Description de l'objectif..."
                  multiline={true}
                  numberOfLines={3}
                  accessible={true}
                  accessibilityLabel="Description de l'objectif"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Date limite (JJ/MM/AAAA) (optionnel)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={goalEndDate}
                  onChangeText={setGoalEndDate}
                  placeholder="JJ/MM/AAAA"
                  keyboardType="numbers-and-punctuation"
                  accessible={true}
                  accessibilityLabel="Date limite au format jour/mois/année"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[
                  styles.modalCancelButton,
                  settings.highContrast && styles.highContrastCancelButton
                ]}
                onPress={() => setGoalModalVisible(false)}
                disabled={savingGoal}
                accessible={true}
                accessibilityLabel="Annuler"
                accessibilityRole="button"
              >
                <Text style={[
                  styles.modalButtonText,
                  settings.highContrast && styles.highContrastCancelText,
                  settings.largeText && styles.largeText
                ]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalSaveButton,
                  settings.highContrast && styles.highContrastSaveButton,
                  savingGoal && styles.disabledButton
                ]}
                onPress={saveAssociationGoal}
                disabled={savingGoal}
                accessible={true}
                accessibilityLabel="Enregistrer"
                accessibilityRole="button"
              >
                {savingGoal ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.modalButtonText,
                    styles.saveButtonText,
                    settings.largeText && styles.largeText
                  ]}>
                    Enregistrer
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  highContrastContainer: {
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    flex: 1,
    textAlign: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highContrastButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  roleText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5e48e8',
  },
  highContrastTab: {
    backgroundColor: '#ffffff',
  },
  highContrastActiveTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#9e9e9e',
  },
  activeTabText: {
    color: '#5e48e8',
    fontWeight: '500',
  },
  highContrastTabText: {
    color: '#333333',
  },
  highContrastActiveTabText: {
    color: '#000000',
    fontWeight: '500',
  },
  largeText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flex: 1,
  },
  yearlyStats: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  yearStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  yearText: {
    fontSize: 16,
    color: '#333333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  recurringDonatorsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  recurringList: {
    marginTop: 8,
  },
  recurringItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recurringAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  recurringDate: {
    fontSize: 14,
    color: '#757575',
  },
  recurringDetails: {
    fontSize: 14,
    color: '#757575',
  },
  highContrastText: {
    color: '#000000',
  },
  highContrastSecondaryText: {
    color: '#444444',
  },
  highContrastItem: {
    borderBottomColor: '#cccccc',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  donationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  donationDate: {
    fontSize: 14,
    color: '#757575',
  },
  donationDetails: {
    marginTop: 4,
  },
  donationLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  donationFlags: {
    marginTop: 4,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flagText: {
    marginLeft: 4,
    color: '#757575',
  },
  highContrastFlagItem: {
    borderBottomColor: '#cccccc',
  },
  goalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteGoalButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  editGoalButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  goalContent: {
    marginTop: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  goalProgressContainer: {
    marginTop: 8,
  },
  goalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalCurrentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  goalTargetAmount: {
    fontSize: 14,
    color: '#666666',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5e48e8',
  },
  highContrastProgressBar: {
    backgroundColor: '#000000',
  },
  goalEndDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  addGoalText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#5e48e8',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  highContrastModalContent: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalScroll: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  highContrastInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#5e48e8',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  highContrastCancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  highContrastSaveButton: {
    backgroundColor: '#000000',
  },
  highContrastCancelText: {
    color: '#000000',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  saveButtonText: {
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.7,
  },
  highContrastDeleteButton: {
    backgroundColor: '#ffcccc',
    borderWidth: 1,
    borderColor: '#cc0000',
  },
  oneTimeDonationsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  oneTimeList: {
    marginTop: 8,
  },
  oneTimeItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  oneTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  oneTimeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  oneTimeDate: {
    fontSize: 14,
    color: '#757575',
  },
  oneTimePaymentMethod: {
    fontSize: 14,
    color: '#757575',
  },
  oneTimeEmail: {
    fontSize: 14,
    color: '#757575',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  seeMoreText: {
    marginRight: 8,
    fontSize: 16,
    color: '#5e48e8',
  },
  recurringEmail: {
    fontSize: 14,
    color: '#757575',
  },
  filterContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginLeft: 2,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  searchClearButton: {
    padding: 4,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  sortOptionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  sortOptionsBarActive: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sortToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortToggleText: {
    fontSize: 15,
    color: '#333333',
    marginRight: 6,
  },
  sortOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortOrderText: {
    fontSize: 14,
    color: '#5e48e8',
    fontWeight: '500',
    marginLeft: 6,
  },
  sortOptionsDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  highContrastOptionSelected: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#000000',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#333333',
  },
  sortOptionTextSelected: {
    fontWeight: 'bold',
    color: '#5e48e8',
  },
});