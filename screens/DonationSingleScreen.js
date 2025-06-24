import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  Modal,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import SimplifiedText from '../components/SimplifiedText';
import SpeechService from '../services/SpeechService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const { width, height } = Dimensions.get('window');
const CARD_STORAGE_KEY = 'dudu_saved_card';

export default function DonationSingleScreen({ navigation, route }) {
  const { association, amount: initialAmount, isRecurrent, recurringDay, type, status, skipAmountSelection, monthlyReceipt } = route.params;
  const { settings } = useAccessibility();
  const { currentUser, addDonation } = useAuth();
  
  // États pour les informations de don
  const [amount, setAmount] = useState(initialAmount || 10);
  const [email, setEmail] = useState(currentUser ? currentUser.email : '');
  const [wantReceipt, setWantReceipt] = useState(isRecurrent ? route.params.wantReceipt : true);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [rememberCard, setRememberCard] = useState(false);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const badgeAnimation = useRef(new Animated.Value(0)).current;
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const duduAnimation = useRef(new Animated.Value(0)).current;

  // Méthodes de paiement disponibles
  const paymentMethods = [
    { id: 'card', name: 'Carte bancaire', icon: 'card-outline' },
    { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' },
    { id: 'apple', name: 'Apple Pay', icon: 'logo-apple' },
    { id: 'gpay', name: 'Google Pay', icon: 'logo-google' },
  ];

  // Charger les informations de carte sauvegardées
  useEffect(() => {
    loadSavedCardInfo();
  }, []);

  // Fonction pour charger les informations de carte
  const loadSavedCardInfo = async () => {
    try {
      const savedCardInfo = await AsyncStorage.getItem(CARD_STORAGE_KEY);
      if (savedCardInfo) {
        const cardInfo = JSON.parse(savedCardInfo);
        setCardNumber(cardInfo.cardNumber || '');
        setCardExpiry(cardInfo.cardExpiry || '');
        setCardName(cardInfo.cardName || '');
        // On ne charge jamais le CVC pour des raisons de sécurité
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations de carte:', error);
    }
  };

  // Fonction pour sauvegarder les informations de carte
  const saveCardInfo = async () => {
    if (rememberCard) {
      try {
        const cardInfo = {
          cardNumber,
          cardExpiry,
          cardName,
          // On ne sauvegarde jamais le CVC pour des raisons de sécurité
        };
        await AsyncStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(cardInfo));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des informations de carte:', error);
      }
    }
  };

  // Formater le numéro de carte automatiquement
  const formatCardNumber = (text) => {
    // Supprimer tous les espaces
    let value = text.replace(/\s/g, '');
    // Limiter à 16 chiffres
    value = value.substring(0, 16);
    // Ajouter un espace tous les 4 chiffres
    const formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formattedValue);
  };

  // Formater la date d'expiration
  const formatExpiryDate = (text) => {
    // Supprimer les espaces et les slashes
    let value = text.replace(/\s|\//g, '');
    // Limiter à 4 chiffres
    value = value.substring(0, 4);
    // Ajouter un slash après les 2 premiers chiffres
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    setCardExpiry(value);
  };

  // Validation simple des informations de carte
  const validateCardInfo = () => {
    if (wantReceipt && !currentUser && !email) {
      Alert.alert('Email requis', 'Veuillez entrer une adresse email pour recevoir votre reçu.');
      return false;
    }
    
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Numéro de carte invalide', 'Veuillez entrer un numéro de carte valide à 16 chiffres.');
        return false;
      }
      
      if (cardExpiry.length < 5) {
        Alert.alert('Date d\'expiration invalide', 'Veuillez entrer une date d\'expiration valide (MM/AA).');
        return false;
      }
      
      if (cardCVC.length < 3) {
        Alert.alert('Code CVC invalide', 'Veuillez entrer un code CVC valide (3 chiffres).');
        return false;
      }
      
      if (!cardName) {
        Alert.alert('Nom manquant', 'Veuillez entrer le nom du titulaire de la carte.');
        return false;
      }
    }
    
    return true;
  };

  // Animation pour le badge
  const animateBadge = () => {
    badgeAnimation.setValue(0);
    
    // Si reducedMotion est activé, définir une valeur fixe sans animation
    if (settings.reducedMotion) {
      badgeAnimation.setValue(1);
      return;
    }
    
    Animated.sequence([
      Animated.timing(badgeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Animation pour la confetti
  const animateConfetti = () => {
    confettiAnimation.setValue(0);
    
    // Si reducedMotion est activé, définir une valeur fixe sans animation
    if (settings.reducedMotion) {
      confettiAnimation.setValue(1);
      return;
    }
    
    Animated.sequence([
      Animated.timing(confettiAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Animation pour Dudu qui saute de joie
  const animateDudu = () => {
    duduAnimation.setValue(0);
    
    // Si reducedMotion est activé, définir une valeur fixe sans animation
    if (settings.reducedMotion) {
      duduAnimation.setValue(1);
      return;
    }
    
    // Sinon, effectuer l'animation complète
    Animated.loop(
      Animated.sequence([
        // Première pulsation rapide (comme un battement de cœur)
        Animated.timing(duduAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(duduAnimation, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic)
        }),
        // Courte pause
        Animated.delay(100),
        // Deuxième pulsation rapide
        Animated.timing(duduAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(duduAnimation, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic)
        }),
        // Pause plus longue avant de recommencer
        Animated.delay(800)
      ]),
      { iterations: -1 } // Animation en boucle infinie
    ).start();
  };

  // Finaliser le don
  const finalizeDonation = async () => {
    if (validateCardInfo()) {
      // Sauvegarder les informations de carte si l'option est activée
      saveCardInfo();
      
      try {
        // Si l'utilisateur est connecté, enregistrer le don dans Firebase
        if (currentUser) {
          const result = await addDonation({
            amount: amount,
            association: association,
            type: type || 'single',
            status: status || 'completed',
            paymentMethod: paymentMethod,
            email: currentUser.email,
            wantReceipt: wantReceipt,
            createdAt: new Date(),
            ...(isRecurrent && {
              isRecurrent: true,
              recurringDay: recurringDay || 5,
              monthlyReceipt: monthlyReceipt !== undefined ? monthlyReceipt : false
            })
          });
          
          // Vérifier si des badges ont été débloqués
          if (result.unlockedBadges && result.unlockedBadges.length > 0) {
            setUnlockedBadges(result.unlockedBadges);
            setCurrentBadgeIndex(0);
            setBadgeModalVisible(true);
            animateBadge();
          } else {
            // Si aucun badge n'a été débloqué, afficher le message de succès normal
            showSuccessMessage();
          }
        } else {
          // Tous les dons sans compte sont enregistrés, qu'ils aient ou non un reçu
          const donationData = {
            amount: amount,
            association: association,
            type: type || 'single',
            status: status || 'completed',
            paymentMethod: paymentMethod,
            email: email || 'anonymous@donateur.org', // Email anonyme si non fourni
            wantReceipt: wantReceipt,
            createdAt: new Date(),
            anonymous: email ? false : true, // Marquer comme anonyme si pas d'email
            ...(isRecurrent && {
              isRecurrent: true,
              recurringDay: recurringDay || 5,
              monthlyReceipt: monthlyReceipt !== undefined ? monthlyReceipt : false
            })
          };
          
          // Ajouter le don à Firebase sans l'associer à un utilisateur
          const donationsRef = collection(db, 'donations');
          await addDoc(donationsRef, donationData);
          
          // Afficher le message de succès normal
          showSuccessMessage();
        }
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du don:', error);
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors du traitement de votre don. Veuillez réessayer.'
        );
      }
    }
  };
  
  // Afficher le message de succès du don
  const showSuccessMessage = () => {
    setSuccessModalVisible(true);
    // Déclencher les animations quand la modal apparaît
    setTimeout(() => {
      animateConfetti();
      animateDudu();
    }, 200);
  };
  
  // Passer au badge suivant ou fermer le modal
  const handleNextBadge = () => {
    if (currentBadgeIndex < unlockedBadges.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1);
      // Réinitialiser l'animation pour le prochain badge
      badgeAnimation.setValue(0);
      animateBadge();
    } else {
      // Fermer le modal si c'est le dernier badge
      setBadgeModalVisible(false);
      showSuccessMessage();
    }
  };
  
  // Animation pour le badge
  const badgeScale = badgeAnimation.interpolate({
    inputRange: [0, 1, 1.2],
    outputRange: [0.5, 1, 1.2]
  });
  
  const badgeOpacity = badgeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  // Effet pour la synthèse vocale
  useEffect(() => {
    if (settings.textToSpeech) {
      SpeechService.speak(`Faire un don unique de ${amount} euros à ${association.name}`);
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech]);

  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Fond avec bulles décoratives - masquées en mode contraste élevé */}
      {!settings.highContrast && (
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.bubble, { top: -100, right: -80, backgroundColor: '#d0f4de' }]} />
          <View style={[styles.bubble, { bottom: height * 0.3, left: -150, backgroundColor: '#fde2e4' }]} />
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
          {isRecurrent ? "Don récurrent" : "Faire un don"}
        </Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.duduContainer}>
          <Image 
            source={require('../assets/dudu/dudu_cadeau_dans_les_mains.png')} 
            style={styles.duduImage} 
            resizeMode="contain"
            accessible={true}
            accessibilityLabel="Dudu tient un cadeau dans ses mains"
          />
        </View>

        <View style={[
          styles.donationSummary,
          settings.highContrast && styles.highContrastSection
        ]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="heart" size={24} color="#5e48e8" style={styles.summaryIcon} />
            <Text style={[
              styles.summaryTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Résumé du don
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[
              styles.summaryLabel,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Association :
            </Text>
            <Text style={[
              styles.summaryValue,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              {association.name}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[
              styles.summaryLabel,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Montant :
            </Text>
            {skipAmountSelection ? (
              // Affichage simple du montant sans possibilité de le modifier
              <Text style={[
                styles.summaryValueAmount,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                {amount}€{isRecurrent ? '/mois' : ''}
              </Text>
            ) : (
              // Interface pour modifier le montant (pour les dons uniques uniquement)
              <View style={styles.amountContainer}>
                <TextInput
                  style={[
                    styles.amountInput,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={String(amount)}
                  onChangeText={(text) => {
                    // Accepter uniquement les nombres, supprimer tout autre caractère
                    const numericValue = text.replace(/[^0-9]/g, '');
                    
                    // Convertir en nombre (ou 1 si vide ou 0)
                    const newAmount = numericValue ? parseInt(numericValue, 10) : 1;
                    
                    // Limiter à un montant raisonnable (entre 1€ et 10 000€)
                    if (newAmount >= 1 && newAmount <= 10000) {
                      setAmount(newAmount);
                    }
                  }}
                  keyboardType="number-pad"
                  accessibilityLabel="Modifier le montant du don"
                  accessibilityHint="Entrez le montant souhaité en euros"
                />
                <Text style={[
                  styles.currencySymbol,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>€</Text>
              </View>
            )}
          </View>
          
          {/* Boutons d'options de montant prédéfinis - uniquement pour les dons uniques */}
          {!skipAmountSelection && (
            <View style={styles.presetAmountsContainer}>
              {[5, 10, 20, 50, 100].map(presetAmount => (
                <Pressable
                  key={presetAmount}
                  style={({ pressed }) => [
                    styles.presetAmountButton,
                    amount === presetAmount && styles.presetAmountButtonSelected,
                    pressed && styles.presetAmountButtonPressed,
                    settings.highContrast && styles.highContrastPresetButton,
                    amount === presetAmount && settings.highContrast && styles.highContrastPresetButtonSelected
                  ]}
                  onPress={() => setAmount(presetAmount)}
                  accessible={true}
                  accessibilityLabel={`${presetAmount} euros`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: amount === presetAmount }}
                >
                  <Text style={[
                    styles.presetAmountButtonText,
                    amount === presetAmount && styles.presetAmountButtonTextSelected,
                    settings.highContrast && styles.highContrastPresetButtonText,
                    amount === presetAmount && settings.highContrast && styles.highContrastPresetButtonTextSelected
                  ]}>
                    {presetAmount}€
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          
          <View style={styles.taxInfoContainer}>
            <Ionicons name="information-circle" size={20} color="#666" style={styles.taxInfoIcon} />
            <Text style={[
              styles.taxInfoText,
              settings.highContrast && styles.highContrastDescription,
              settings.largeText && styles.largeTextDescription
            ]}>
              66% de votre don est déductible des impôts
            </Text>
          </View>
        </View>

        {/* Information sur le fait qu'aucun compte n'est requis - uniquement pour les dons uniques, maintenant placée après le résumé */}
        {!isRecurrent && (
          <View style={styles.simpleInfoContainer}>
            <Ionicons name="information-circle" size={18} color="#666" style={styles.simpleInfoIcon} />
            <Text style={[
              styles.simpleInfoText,
              settings.highContrast && styles.highContrastDescription,
              settings.largeText && styles.largeTextDescription
            ]}>
              Aucun compte n'est requis pour un don unique
            </Text>
          </View>
        )}

        {/* Section pour le reçu - uniquement pour les dons uniques */}
        {!isRecurrent && (
          <View style={[
            styles.formSection,
            settings.highContrast && styles.highContrastSection
          ]}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="receipt" size={22} color="#5e48e8" style={styles.sectionIcon} />
              <Text style={[
                styles.sectionTitle,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Reçu fiscal (optionnel)
              </Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.switchContainer}>
              <Text style={[
                styles.switchLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Je souhaite recevoir un reçu fiscal
              </Text>
              <Switch
                value={wantReceipt}
                onValueChange={setWantReceipt}
                trackColor={{ false: '#d1d1d1', true: '#e5e0fa' }}
                thumbColor={wantReceipt ? '#5e48e8' : '#f4f3f4'}
                ios_backgroundColor="#d1d1d1"
                accessible={true}
                accessibilityLabel="Activer ou désactiver le reçu fiscal"
                accessibilityRole="switch"
                accessibilityState={{ checked: wantReceipt }}
              />
            </View>
            
            {wantReceipt && !currentUser && (
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Adresse e-mail
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Votre adresse e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessible={true}
                  accessibilityLabel="Saisir votre adresse e-mail pour recevoir le reçu fiscal"
                />
              </View>
            )}
            
            {wantReceipt && currentUser && (
              <View style={styles.emailInfoContainer}>
                <Text style={[
                  styles.emailInfoText,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Le reçu sera envoyé à l'adresse : {currentUser.email}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Pour les dons récurrents, afficher un rappel des préférences de reçu fiscal */}
        {isRecurrent && wantReceipt && (
          <View style={styles.receiptReminderContainer}>
            <Ionicons name="receipt-outline" size={18} color="#5e48e8" style={styles.simpleInfoIcon} />
            <Text style={[
              styles.receiptReminderText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              {monthlyReceipt ? 
                "Vous recevrez un reçu fiscal pour chaque prélèvement mensuel." : 
                "Vous recevrez un reçu fiscal unique en fin d'année pour tous vos dons."}
            </Text>
          </View>
        )}

        {/* Section pour le mode de paiement */}
        <View style={[
          styles.formSection,
          settings.highContrast && styles.highContrastSection
        ]}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="wallet" size={22} color="#5e48e8" style={styles.sectionIcon} />
            <Text style={[
              styles.sectionTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Mode de paiement
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentMethodsContainer}>
            {paymentMethods.map((method) => (
              <Pressable
                key={method.id}
                style={({ pressed }) => [
                  styles.paymentMethod,
                  paymentMethod === method.id && styles.paymentMethodSelected,
                  pressed && styles.paymentMethodPressed,
                  settings.highContrast && styles.highContrastPaymentMethod,
                  paymentMethod === method.id && settings.highContrast && styles.highContrastPaymentMethodSelected
                ]}
                onPress={() => setPaymentMethod(method.id)}
                accessible={true}
                accessibilityLabel={`Payer avec ${method.name}`}
                accessibilityRole="button"
                accessibilityState={{ selected: paymentMethod === method.id }}
              >
                <Ionicons 
                  name={method.icon} 
                  size={24} 
                  color={paymentMethod === method.id ? "#5e48e8" : "#666"} 
                  style={styles.paymentMethodIconNew}
                />
                <Text style={[
                  styles.paymentMethodText,
                  paymentMethod === method.id && styles.paymentMethodTextSelected,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  {method.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Section pour les infos de carte */}
        {paymentMethod === 'card' && (
          <View style={[
            styles.formSection,
            settings.highContrast && styles.highContrastSection
          ]}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="card" size={22} color="#5e48e8" style={styles.sectionIcon} />
              <Text style={[
                styles.sectionTitle,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Informations de carte
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.inputContainer}>
              <Text style={[
                styles.inputLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Numéro de carte
              </Text>
              <TextInput
                style={[
                  styles.input,
                  settings.highContrast && styles.highContrastInput,
                  settings.largeText && styles.largeText
                ]}
                value={cardNumber}
                onChangeText={formatCardNumber}
                placeholder="1234 5678 9012 3456"
                keyboardType="number-pad"
                maxLength={19} // 16 chiffres + 3 espaces
                accessible={true}
                accessibilityLabel="Saisir le numéro de votre carte"
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Expiration
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={cardExpiry}
                  onChangeText={formatExpiryDate}
                  placeholder="MM/AA"
                  keyboardType="number-pad"
                  maxLength={5} // MM/YY
                  accessible={true}
                  accessibilityLabel="Saisir la date d'expiration de votre carte"
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  CVC
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={cardCVC}
                  onChangeText={setCardCVC}
                  placeholder="123"
                  keyboardType="number-pad"
                  maxLength={3}
                  accessible={true}
                  accessibilityLabel="Saisir le code de sécurité de votre carte"
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[
                styles.inputLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Nom du titulaire
              </Text>
              <TextInput
                style={[
                  styles.input,
                  settings.highContrast && styles.highContrastInput,
                  settings.largeText && styles.largeText
                ]}
                value={cardName}
                onChangeText={setCardName}
                placeholder="Nom sur la carte"
                autoCapitalize="words"
                accessible={true}
                accessibilityLabel="Saisir le nom sur la carte"
              />
            </View>
            
            {/* Option pour se souvenir de la carte */}
            <View style={styles.switchContainer}>
              <Text style={[
                styles.switchLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Se souvenir de ma carte
              </Text>
              <Switch
                trackColor={{ false: '#cccccc', true: settings.highContrast ? '#000000' : '#5e48e8' }}
                thumbColor={rememberCard ? (settings.highContrast ? '#ffffff' : '#ffffff') : '#f4f3f4'}
                ios_backgroundColor="#cccccc"
                onValueChange={setRememberCard}
                value={rememberCard}
                accessibilityRole="switch"
                accessibilityLabel="Se souvenir de ma carte pour les prochains dons"
                accessibilityHint="Active cette option pour sauvegarder vos informations de carte"
              />
            </View>
          </View>
        )}
        
        {/* Message d'information sur le don placé juste avant le bouton de confirmation */}
        <View style={styles.topInfoContainer}>
          <Ionicons name="information-circle" size={18} color="#666" style={styles.simpleInfoIcon} />
          <Text style={[
            styles.topInfoText,
            settings.highContrast && styles.highContrastDescription,
            settings.largeText && styles.largeTextDescription
          ]}>
            Vous êtes sur le point d'effectuer un don {isRecurrent ? 'récurrent' : 'unique'} à {association.name}
          </Text>
        </View>
        
        {/* Bouton de validation */}
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            settings.highContrast && styles.highContrastConfirmButton
          ]}
          onPress={finalizeDonation}
          accessible={true}
          accessibilityLabel={`Confirmer le don de ${amount} euros`}
          accessibilityRole="button"
        >
          <Ionicons name="checkmark-circle" size={22} color="#fff" style={styles.confirmButtonIcon} />
          <Text style={[
            styles.confirmButtonText,
            settings.highContrast && styles.highContrastConfirmButtonText,
            settings.largeText && styles.largeText
          ]}>
            Confirmer le don de {amount}€
          </Text>
        </TouchableOpacity>
        
        <View style={styles.securityInfoContainer}>
          <Text style={[
            styles.securityText,
            settings.highContrast && styles.highContrastDescription,
            settings.largeText && styles.largeTextDescription
          ]}>
            🔒 Vos informations bancaires sont sécurisées
          </Text>
        </View>
      </ScrollView>

      {/* Modal pour afficher les badges débloqués */}
      <Modal
        animationType={settings.reducedMotion ? "none" : "fade"}
        transparent={true}
        visible={badgeModalVisible}
        onRequestClose={() => {
          setBadgeModalVisible(false);
          showSuccessMessage();
        }}
      >
        <View style={styles.badgeModalOverlay}>
          <View style={styles.badgeModalContainer}>
            <Text style={styles.badgeModalTitle}>
              Nouveau badge débloqué !
            </Text>
            
            {unlockedBadges.length > 0 && currentBadgeIndex < unlockedBadges.length && (
              <>
                <Animated.View 
                  style={[
                    styles.badgeImageContainer,
                    !settings.reducedMotion ? {
                      transform: [{ scale: badgeScale }],
                      opacity: badgeOpacity
                    } : { opacity: 1 }
                  ]}
                >
                  <Image 
                    source={unlockedBadges[currentBadgeIndex].image} 
                    style={styles.badgeImage}
                    resizeMode="contain"
                  />
                </Animated.View>
                
                <Text style={styles.badgeName}>
                  {unlockedBadges[currentBadgeIndex].name}
                </Text>
                
                <Text style={styles.badgeDescription}>
                  {getBadgeMessage(unlockedBadges[currentBadgeIndex].id)}
                </Text>
                
                <TouchableOpacity 
                  style={styles.badgeButton}
                  onPress={handleNextBadge}
                >
                  <Text style={styles.badgeButtonText}>
                    {currentBadgeIndex < unlockedBadges.length - 1 ? "Suivant" : "Super !"}
                  </Text>
                </TouchableOpacity>
                
                {unlockedBadges.length > 1 && (
                  <Text style={styles.badgeCounter}>
                    {currentBadgeIndex + 1} / {unlockedBadges.length}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Nouveau Modal pour le message de succès du don */}
      <Modal
        animationType={settings.reducedMotion ? "none" : "fade"}
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {
          setSuccessModalVisible(false);
          navigation.navigate('HomeScreen');
        }}
      >
        <View style={styles.successModalOverlay}>
          <Animated.View 
            style={[
              styles.successModalContainer,
              !settings.reducedMotion ? {
                transform: [
                  { scale: confettiAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.1, 1]
                  })}
                ]
              } : null
            ]}
          >
            <Text style={styles.successModalTitle}>
              Don effectué !
            </Text>
            
            <View style={styles.successDuduContainer}>
              <Animated.Image 
                source={require('../assets/dudu/dudu_cadeau_dans_les_mains.png')} 
                style={[
                  styles.successDuduImage,
                  !settings.reducedMotion ? {
                    transform: [
                      {
                        scale: duduAnimation.interpolate({
                          inputRange: [0, 0.7, 0.8, 1],
                          outputRange: [1, 0.9, 0.95, 1.1]
                        })
                      }
                    ]
                  } : null
                ]}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.successModalText}>
              Merci pour votre {isRecurrent ? 'abonnement de don récurrent' : 'don'} de {amount}€ à {association.name} !
            </Text>
            
            {wantReceipt && (
              <Text style={styles.successModalSubtext}>
                Un reçu fiscal a été envoyé à votre adresse email.
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.successModalButton}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('HomeScreen');
              }}
            >
              <Text style={styles.successModalButtonText}>
                Merci Dudu !
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Fonction pour obtenir un message personnalisé pour chaque badge
const getBadgeMessage = (badgeId) => {
  switch(badgeId) {
    case 'first_donation':
      return "Félicitations pour ton premier don ! Dudu est fier de toi. Ta générosité fait déjà la différence !";
    case 'cumulated_100':
      return "Woah ! Tu as dépassé 100€ de dons cumulés ! Dudu est impressionné par ta générosité !";
    case 'cumulated_1000':
      return "1000€ de dons, c'est incroyable ! Dudu te considère comme un véritable ange de la générosité !";
    case 'loyality':
      return "10 dons à la même association ? Tu es un fidèle soutien et Dudu te nomme chevalier de la générosité !";
    case 'completer':
      return "Incroyable ! Tu as complété un objectif de don grâce à ta générosité. Dudu chante pour célébrer !";
    default:
      return "Tu as débloqué un nouveau badge ! Dudu est fier de toi !";
  }
};

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
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  donationSummary: {
    backgroundColor: '#e5e0fa',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  taxInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  taxInfoIcon: {
    marginRight: 6,
  },
  taxInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  highContrastSection: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  highContrastInput: {
    borderColor: '#000',
    borderWidth: 2,
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  paymentMethod: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentMethodSelected: {
    borderColor: '#5e48e8',
    borderWidth: 1,
    backgroundColor: 'rgba(94, 72, 232, 0.02)',
    shadowColor: '#5e48e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentMethodPressed: {
    backgroundColor: 'rgba(94, 72, 232, 0.01)',
    borderColor: '#5e48e8',
    borderWidth: 1,
  },
  highContrastPaymentMethod: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
  },
  highContrastPaymentMethodSelected: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  paymentMethodIconNew: {
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
  },
  paymentMethodTextSelected: {
    color: '#5e48e8',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#5e48e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonIcon: {
    marginRight: 8,
  },
  highContrastConfirmButton: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 2,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  highContrastConfirmButtonText: {
    color: '#fff',
  },
  securityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  securityIcon: {
    marginRight: 6,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
  },
  largeText: {
    fontSize: 18,
  },
  largeTextDescription: {
    fontSize: 16,
  },
  emailInfoContainer: {
    backgroundColor: 'rgba(229, 224, 250, 0.5)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#5e48e8',
  },
  emailInfoText: {
    fontSize: 14,
    color: '#333',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    height: 44,
    width: 90,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e48e8',
    textAlign: 'right',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginLeft: 8,
  },
  presetAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  presetAmountButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 20,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  presetAmountButtonSelected: {
    backgroundColor: 'rgba(94, 72, 232, 0.05)',
    borderColor: '#5e48e8',
    borderWidth: 1,
  },
  presetAmountButtonPressed: {
    backgroundColor: 'rgba(94, 72, 232, 0.01)',
    borderColor: '#5e48e8', 
    borderWidth: 1,
  },
  highContrastPresetButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
  },
  highContrastPresetButtonSelected: {
    backgroundColor: '#000',
  },
  presetAmountButtonText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  presetAmountButtonTextSelected: {
    color: '#5e48e8',
    fontWeight: '600',
  },
  highContrastPresetButtonText: {
    color: '#000',
  },
  highContrastPresetButtonTextSelected: {
    color: '#fff',
  },
  summaryValueAmount: {
    fontSize: 18,
    color: '#5e48e8',
    fontWeight: 'bold',
  },
  simpleInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  simpleInfoIcon: {
    marginRight: 6,
  },
  simpleInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  topInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 72, 232, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 15,
  },
  topInfoText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    flex: 1,
  },
  receiptReminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 224, 250, 0.5)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  receiptReminderText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  duduContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  duduImage: {
    width: 150,
    height: 150,
  },
  // Styles pour le modal de badge
  badgeModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  badgeModalContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  badgeModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF8F00',
    marginBottom: 15,
    textAlign: 'center',
  },
  badgeImageContainer: {
    width: 150,
    height: 150,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeImage: {
    width: 140,
    height: 140,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  badgeButton: {
    backgroundColor: '#5e48e8',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#5e48e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  badgeCounter: {
    marginTop: 15,
    fontSize: 14,
    color: '#888',
  },
  // Styles pour le modal de succès
  successModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  successModalContainer: {
    backgroundColor: '#E5F8FF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#5e48e8',
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 15,
    textAlign: 'center',
  },
  successDuduContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  successDuduImage: {
    width: 180,
    height: 180,
  },
  successModalText: {
    fontSize: 18,
    color: '#444',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  successModalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successModalButton: {
    backgroundColor: '#5e48e8',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#5e48e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  successModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 