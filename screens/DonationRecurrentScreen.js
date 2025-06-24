import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  Pressable,
  Switch,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import SimplifiedText from '../components/SimplifiedText';
import SpeechService from '../services/SpeechService';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function DonationRecurrentScreen({ navigation, route }) {
  const { association, amount: initialAmount } = route.params;
  const { settings } = useAccessibility();
  const { currentUser, addDonation } = useAuth();
  
  // État pour afficher le modal "Pourquoi créer un compte"
  const [showLoginModal, setShowLoginModal] = useState(!currentUser);

  // Vérifier si l'utilisateur est connecté et afficher le modal si nécessaire
  useEffect(() => {
    if (!currentUser) {
      setShowLoginModal(true);
    }
  }, [currentUser]);
  
  // Fermer le modal et retourner à l'écran précédent
  const handleBackFromModal = () => {
    setShowLoginModal(false);
    navigation.goBack();
  };
  
  // Aller à l'écran de connexion
  const navigateToLogin = () => {
    setShowLoginModal(false);
    navigation.navigate('LoginScreen');
  };
  
  // Aller à l'écran d'inscription
  const navigateToRegister = () => {
    setShowLoginModal(false);
    navigation.navigate('RegisterScreen');
  };

  // Modal "Pourquoi créer un compte"
  const renderLoginModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLoginModal}
      onRequestClose={handleBackFromModal}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          settings.highContrast && styles.highContrastModal
        ]}>
          <View style={styles.modalImageContainer}>
            <Image 
              source={require('../assets/dudu/dudu_ballon_helium_reflechit_inquiet.png')} 
              style={styles.duduImage}
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
            Dudu a besoin de savoir qui vous êtes pour programmer vos dons récurrents et vous envoyer vos reçus fiscaux.
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
              onPress={handleBackFromModal}
              accessible={true}
              accessibilityLabel="Retourner à l'écran précédent"
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

  // Si l'utilisateur n'est pas connecté, afficher uniquement le modal
  if (!currentUser) {
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
            Don récurrent
          </Text>
          <View style={styles.placeholderView} />
        </View>
        
        {renderLoginModal()}
      </SafeAreaView>
    );
  }

  // États pour les options de don récurrent
  const [amount, setAmount] = useState(initialAmount || 10);
  const [day, setDay] = useState('5');
  const [wantReceipt, setWantReceipt] = useState(true);
  const [monthlyReceipt, setMonthlyReceipt] = useState(false);

  // Validation du formulaire
  const validateForm = () => {
    const selectedDay = parseInt(day);
    
    if (isNaN(selectedDay) || selectedDay < 1 || selectedDay > 28) {
      Alert.alert('Jour invalide', 'Veuillez choisir un jour entre 1 et 28.');
      return false;
    }
    
    return true;
  };

  // Continuer vers l'écran de paiement
  const continueToPayment = () => {
    if (validateForm()) {
      // Pour un utilisateur connecté, passer à l'écran de paiement
      navigation.navigate('DonationSingle', { 
        association: association,
        amount: amount,
        isRecurrent: true,
        userEmail: currentUser.email,
        recurringDay: parseInt(day),
        type: 'recurrent',
        status: 'active',
        skipAmountSelection: true, // Ajouter un indicateur pour ne pas afficher la modification du montant
        wantReceipt: wantReceipt,
        monthlyReceipt: wantReceipt && monthlyReceipt // Ajouter la préférence pour les reçus fiscaux mensuels
      });
    }
  };

  // Effet pour la synthèse vocale
  useEffect(() => {
    if (settings.textToSpeech) {
      SpeechService.speak(`Configuration d'un don récurrent de ${amount} euros à ${association.name}`);
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech, amount]);

  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Fond avec bulles décoratives - masquées en mode contraste élevé */}
      {!settings.highContrast && (
        <View style={StyleSheet.absoluteFillObject}>
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
          Don récurrent
        </Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[
          styles.donationSummary,
          settings.highContrast && styles.highContrastSection
        ]}>
          <Text style={[
            styles.summaryTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Résumé du don
          </Text>
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
              Montant mensuel :
            </Text>
            <Text style={[
              styles.summaryValueAmount,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              {amount}€
            </Text>
          </View>
        </View>

        {/* Message d'information sur le don récurrent */}
        <View style={styles.topInfoContainer}>
          <Ionicons name="information-circle" size={18} color="#666" style={styles.simpleInfoIcon} />
          <Text style={[
            styles.topInfoText,
            settings.highContrast && styles.highContrastDescription,
            settings.largeText && styles.largeTextDescription
          ]}>
            Vous êtes sur le point de configurer un don récurrent à {association.name}
          </Text>
        </View>

        {/* Configuration du don récurrent */}
        <View style={[
          styles.formSection,
          settings.highContrast && styles.highContrastSection
        ]}>
          <Text style={[
            styles.sectionTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Configurer votre don récurrent
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={[
              styles.inputLabel,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Jour du prélèvement
            </Text>
            <TextInput
              style={[
                styles.input,
                settings.highContrast && styles.highContrastInput,
                settings.largeText && styles.largeText
              ]}
              value={day}
              placeholder="Jour du mois (1-28)"
              keyboardType="numeric"
              accessible={true}
              accessibilityLabel="Choisir le jour du prélèvement"
              onChangeText={setDay}
            />
            <Text style={[
              styles.inputHelper,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              Par défaut le 5 de chaque mois
            </Text>
            <Text style={[
              styles.inputHelper,
              styles.inputHelperNote,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              Le premier mois est facturé le jour même du don, puis les autres mois au jour indiqué.
            </Text>
          </View>
          
          {/* Option pour le reçu fiscal général */}
          <View style={styles.inputContainer}>
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
          </View>
          
          {/* Option pour le reçu fiscal mensuel - uniquement si wantReceipt est activé */}
          {wantReceipt && (
            <View style={styles.inputContainer}>
              <View style={styles.switchContainer}>
                <Text style={[
                  styles.switchLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Recevoir un reçu fiscal pour chaque prélèvement mensuel
                </Text>
                <Switch
                  value={monthlyReceipt}
                  onValueChange={setMonthlyReceipt}
                  trackColor={{ false: '#d1d1d1', true: '#e5e0fa' }}
                  thumbColor={monthlyReceipt ? '#5e48e8' : '#f4f3f4'}
                  ios_backgroundColor="#d1d1d1"
                  accessible={true}
                  accessibilityLabel="Activer ou désactiver le reçu fiscal pour chaque prélèvement mensuel"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: monthlyReceipt }}
                />
              </View>
              <Text style={[
                styles.inputHelper,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeTextDescription
              ]}>
                {monthlyReceipt 
                  ? "Vous recevrez un reçu fiscal après chaque prélèvement mensuel."
                  : "Vous recevrez uniquement un reçu fiscal annuel récapitulatif."}
              </Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={[
              styles.inputLabel,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Montant mensuel
            </Text>
            <View style={styles.amountInputContainer}>
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
                accessible={true}
                accessibilityLabel="Définir le montant du don mensuel"
                accessibilityHint="Entrez le montant souhaité en euros"
              />
              <Text style={[
                styles.currencySymbol,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>€</Text>
            </View>
            
            {/* Boutons d'options de montant prédéfinis */}
            <View style={styles.presetAmountsContainer}>
              {[5, 10, 15, 20, 50].map(presetAmount => (
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
                  accessibilityLabel={`${presetAmount} euros par mois`}
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
          </View>
        </View>
        
        {/* Informations sur les avantages du don récurrent */}
        <View style={[
          styles.benefitsSection,
          settings.highContrast && styles.highContrastSection
        ]}>
          <Text style={[
            styles.sectionTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Avantages du don récurrent
          </Text>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📊</Text>
            <Text style={[
              styles.benefitText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Visibilité sur vos dons et historique
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📝</Text>
            <Text style={[
              styles.benefitText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Gestion simplifiée de vos reçus fiscaux
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔄</Text>
            <Text style={[
              styles.benefitText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Modification ou arrêt du don à tout moment
            </Text>
          </View>
        </View>
        
        {/* Boutons d'action */}
        <TouchableOpacity 
          style={[
            styles.continueButton,
            settings.highContrast && styles.highContrastConfirmButton
          ]}
          onPress={continueToPayment}
          accessible={true}
          accessibilityLabel="Continuer vers le paiement"
          accessibilityRole="button"
        >
          <Text style={[
            styles.continueButtonText,
            settings.highContrast && styles.highContrastConfirmButtonText,
            settings.largeText && styles.largeText
          ]}>
            Continuer avec {amount}€/mois
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  donationSummary: {
    backgroundColor: '#e5e0fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  highContrastSection: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  highContrastInput: {
    borderColor: '#000',
    borderWidth: 2,
    color: '#000',
  },
  benefitsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  highContrastConfirmButton: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 2,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  highContrastConfirmButtonText: {
    color: '#fff',
  },
  securityInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
  },
  highContrastDescription: {
    color: '#333',
  },
  largeText: {
    fontSize: 18,
  },
  largeTextDescription: {
    fontSize: 16,
  },
  inputHelper: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  inputHelperNote: {
    marginTop: 5,
    color: '#5e48e8',
    fontStyle: 'italic',
  },
  accountBenefitsHeader: {
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  accountBenefitsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  accountBenefitsSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  benefitsCardContainer: {
    marginBottom: 30,
  },
  benefitCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitCardIcon: {
    fontSize: 24,
  },
  benefitCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  benefitCardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  accountActionContainer: {
    marginBottom: 20,
  },
  accountActionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#5e48e8',
  },
  registerButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#5e48e8',
  },
  accountActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButtonText: {
    color: '#5e48e8',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    height: 40,
    width: 80,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e48e8',
    textAlign: 'right',
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
    paddingHorizontal: 12,
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountInput: {
    height: 48,
    width: 120,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e48e8',
    textAlign: 'right',
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
    marginTop: 5,
  },
  presetAmountButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    margin: 5,
  },
  presetAmountButtonSelected: {
    backgroundColor: '#5e48e8',
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
    color: '#333',
  },
  presetAmountButtonTextSelected: {
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  topInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 72, 232, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  topInfoText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    flex: 1,
  },
  simpleInfoIcon: {
    marginRight: 6,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    flex: 1,
    fontSize: 16,
    color: '#444',
    paddingRight: 10,
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
  highContrastModal: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  modalImageContainer: {
    marginTop: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  duduImage: {
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