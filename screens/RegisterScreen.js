import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const { settings } = useAccessibility();
  const { signup, resendVerificationEmail, login, logout } = useAuth();
  
  // États pour le formulaire
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // État pour suivre l'étape actuelle du formulaire
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // État pour le modal de bienvenue
  const [welcomeModalVisible, setWelcomeModalVisible] = useState(false);
  
  // État pour l'écran de vérification d'e-mail
  const [verificationScreen, setVerificationScreen] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Animation de Dudu et des étapes
  const duduAnimation = useRef(new Animated.Value(0)).current;
  const stepAnimation = useRef(new Animated.Value(1)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  
  // Animer Dudu à l'apparition de l'écran
  useEffect(() => {
    // Si reducedMotion est activé, appliquer immédiatement la valeur finale
    if (settings.reducedMotion) {
      duduAnimation.setValue(1);
    } else {
      Animated.timing(duduAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [settings.reducedMotion]);
  
  // Animer les transitions entre étapes
  useEffect(() => {
    // Si reducedMotion est activé, appliquer immédiatement la valeur finale
    if (settings.reducedMotion) {
      stepAnimation.setValue(1);
    } else {
      Animated.sequence([
        Animated.timing(stepAnimation, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(stepAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [currentStep, settings.reducedMotion]);
  
  // Fonction pour valider le formulaire
  const validateForm = () => {
    // Validation pour chaque étape
    if (currentStep === 1) {
      if (!displayName.trim()) {
        setError('Veuillez entrer votre nom.');
        return false;
      }
      return true;
    } 
    else if (currentStep === 2) {
      if (!email.trim()) {
        setError('Veuillez entrer votre adresse e-mail.');
        return false;
      }
      
      // Validation basique de l'e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Veuillez entrer une adresse e-mail valide.');
        return false;
      }
      return true;
    } 
    else if (currentStep === 3) {
      if (!password) {
        setError('Veuillez entrer un mot de passe.');
        return false;
      }
      
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return false;
      }
      return true;
    }
    
    return false;
  };
  
  // Fonction pour passer à l'étape suivante
  const handleNextStep = () => {
    setError('');
    
    if (validateForm()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleRegister();
      }
    }
  };
  
  // Fonction pour revenir à l'étape précédente
  const handlePreviousStep = () => {
    setError('');
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  
  // Fonction pour gérer l'inscription
  const handleRegister = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signup(email, password, displayName);
      
      // Afficher le modal de bienvenue personnalisé
      setWelcomeModalVisible(true);
      
      // Animation simple sans confettis, respectant le paramètre reducedMotion
      if (settings.reducedMotion) {
        successAnimation.setValue(1);
      } else {
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
      
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      // Gestion des erreurs Firebase
      let errorMessage = 'Une erreur s\'est produite lors de l\'inscription.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse e-mail est déjà utilisée.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'L\'adresse e-mail est invalide.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour renvoyer l'e-mail de vérification
  const handleResendEmail = async () => {
    setResendingEmail(true);
    setResendSuccess(false);
    
    try {
      // Essayer de se reconnecter temporairement avec les identifiants fournis
      await login(email, password);
      
      // Envoyer l'email de vérification
      await resendVerificationEmail();
      
      // Déconnecter après l'envoi
      await logout();
      
      setResendSuccess(true);
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'e-mail:', error);
      Alert.alert('Erreur', 'Impossible de renvoyer l\'e-mail de vérification. Vérifiez vos identifiants.');
    } finally {
      setResendingEmail(false);
    }
  };
  
  // Fonction pour naviguer vers l'écran de connexion
  const goToLogin = () => {
    navigation.replace('LoginScreen');
  };
  
  // Obtenir le titre et la description pour l'étape actuelle
  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return {
          title: 'Comment souhaitez-vous être appelé ?',
          description: 'Dudu veut connaître votre nom pour vous accueillir.',
          dudoImage: require('../assets/dudu/dudu_assis_mignon_bienvenue.png'),
          inputField: (
            <View style={styles.inputContainer}>
              <Text style={[
                styles.inputLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Nom d'utilisateur
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    settings.highContrast && styles.highContrastInput,
                    settings.largeText && styles.largeText
                  ]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Comment Dudu doit vous appeler ?"
                  autoCapitalize="words"
                  accessible={true}
                  accessibilityLabel="Entrez votre nom d'utilisateur"
                />
                <Ionicons name="person-outline" size={20} color="#5e48e8" style={styles.inputIcon} />
              </View>
            </View>
          )
        };
      case 2:
        return {
          title: 'Quelle est votre adresse e-mail ?',
          description: 'Dudu en a besoin pour vous reconnaître à chaque visite.',
          dudoImage: require('../assets/dudu/dudu_docteur.png'),
          inputField: (
            <View style={styles.inputContainer}>
              <Text style={[
                styles.inputLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Adresse e-mail
              </Text>
              <View style={styles.inputWrapper}>
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
                  accessibilityLabel="Entrez votre adresse e-mail"
                />
                <Ionicons name="mail-outline" size={20} color="#5e48e8" style={styles.inputIcon} />
              </View>
            </View>
          )
        };
      case 3:
        return {
          title: 'Créez un mot de passe sécurisé',
          description: 'Dudu protègera votre compte avec soin !',
          dudoImage: require('../assets/dudu/dudu_a_la_muscu.png'),
          inputField: (
            <>
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Mot de passe
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      settings.highContrast && styles.highContrastInput,
                      settings.largeText && styles.largeText
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Choisissez un mot de passe (min. 6 caractères)"
                    secureTextEntry={true}
                    accessible={true}
                    accessibilityLabel="Entrez votre mot de passe"
                  />
                  <Ionicons name="lock-closed-outline" size={20} color="#5e48e8" style={styles.inputIcon} />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Confirmer le mot de passe
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      settings.highContrast && styles.highContrastInput,
                      settings.largeText && styles.largeText
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmez votre mot de passe"
                    secureTextEntry={true}
                    accessible={true}
                    accessibilityLabel="Confirmez votre mot de passe"
                  />
                  <Ionicons name="lock-closed-outline" size={20} color="#5e48e8" style={styles.inputIcon} />
                </View>
                <Text style={styles.securityNote}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#5e48e8" /> Dudu garde vos données en sécurité
                </Text>
              </View>
            </>
          ),
          customStyle: {
            duduImage: {
              width: 180,
              height: 180
            }
          }
        };
      default:
        return {
          title: '',
          description: '',
          dudoImage: require('../assets/dudu/dudu_docteur.png'),
          inputField: null
        };
    }
  };
  
  const { title, description, dudoImage, inputField, customStyle } = getStepContent();
  
  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Modal de bienvenue personnalisé */}
      <Modal
        animationType={settings.reducedMotion ? "none" : "fade"}
        transparent={true}
        visible={welcomeModalVisible}
        onRequestClose={() => {
          setWelcomeModalVisible(false);
          navigation.replace('LoginScreen');
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.welcomeModal,
              !settings.reducedMotion ? {
                opacity: successAnimation,
                transform: [{
                  scale: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              } : null
            ]}
          >
            <Image 
              source={require('../assets/dudu/dudu_docteur.png')} 
              style={styles.welcomeDuduImage}
              resizeMode="contain"
            />
            
            <Text style={styles.welcomeTitle}>
              Vérifiez votre e-mail
            </Text>
            
            <Text style={styles.welcomeMessage}>
              Dudu a envoyé un e-mail à <Text style={styles.emailHighlight}>{email}</Text>. 
              Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.
            </Text>
            
            <View style={styles.spamInfo}>
              <Ionicons name="information-circle" size={18} color="#5e48e8" style={{marginRight: 8}} />
              <Text style={styles.spamInfoText}>
                Pensez à vérifier vos spams si vous ne trouvez pas l'e-mail !
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.resendEmailButton,
                resendingEmail && styles.resendButtonDisabled,
                resendSuccess && styles.resendButtonSuccess
              ]}
              onPress={handleResendEmail}
              disabled={resendingEmail || resendSuccess}
              accessible={true}
              accessibilityLabel="Renvoyer l'e-mail de vérification"
              accessibilityRole="button"
            >
              {resendingEmail ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.resendEmailButtonText}>
                  {resendSuccess ? 'E-mail envoyé !' : 'Renvoyer l\'e-mail'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.welcomeButton}
              onPress={() => {
                setWelcomeModalVisible(false);
                navigation.replace('LoginScreen');
              }}
              accessible={true}
              accessibilityLabel="Continuer"
              accessibilityRole="button"
            >
              <Text style={styles.welcomeButtonText}>
                Continuer vers la connexion
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={[
            styles.backButton,
            settings.highContrast && styles.highContrastButton
          ]}
          onPress={handlePreviousStep}
          accessible={true}
          accessibilityLabel="Retour à l'étape précédente"
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
          Création de compte
        </Text>
        <View style={styles.placeholderView} />
      </View>
      
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View 
            key={index}
            style={[
              styles.progressDot,
              index + 1 === currentStep && styles.progressDotActive,
              settings.highContrast && styles.highContrastProgressDot,
              settings.highContrast && index + 1 === currentStep && styles.highContrastProgressDotActive
            ]}
          />
        ))}
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.duduContainer,
            !settings.reducedMotion ? {
              opacity: duduAnimation,
              transform: [
                {
                  scale: duduAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }
              ]
            } : { opacity: 1 }
          ]}
        >
          <Image 
            source={dudoImage} 
            style={[
              styles.duduImage,
              currentStep === 3 && customStyle?.duduImage
            ]}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.formCard,
            settings.highContrast && styles.highContrastSection,
            !settings.reducedMotion ? {
              transform: [{ scale: stepAnimation }]
            } : null
          ]}
        >
          <Text style={[
            styles.stepTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeTitle
          ]}>
            {title}
          </Text>
          
          <Text style={[
            styles.stepDescription,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            {description}
          </Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={[
                styles.errorText,
                settings.largeText && styles.largeText
              ]}>
                {error}
              </Text>
            </View>
          ) : null}
          
          {inputField}
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              settings.highContrast && styles.highContrastActionButton
            ]}
            onPress={handleNextStep}
            disabled={loading}
            accessible={true}
            accessibilityLabel={currentStep === totalSteps ? "Créer mon compte" : "Suivant"}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[
                styles.actionButtonText,
                settings.highContrast && styles.highContrastButtonText,
                settings.largeText && styles.largeText
              ]}>
                {currentStep === totalSteps ? "Créer mon compte" : "Suivant"}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.loginContainer}>
          <Text style={[
            styles.loginText,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Vous avez déjà un compte ?
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('LoginScreen')}
            accessible={true}
            accessibilityLabel="Se connecter"
            accessibilityRole="button"
          >
            <Text style={[
              styles.loginLink,
              settings.highContrast && styles.highContrastLink,
              settings.largeText && styles.largeText
            ]}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  highContrastContainer: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  highContrastButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholderView: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: '#5e48e8',
    width: 22,
    height: 10,
    borderRadius: 5,
  },
  highContrastProgressDot: {
    backgroundColor: '#ccc',
    borderWidth: 1,
    borderColor: '#000',
  },
  highContrastProgressDotActive: {
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  duduContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  duduImage: {
    width: 160,
    height: 160,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  highContrastSection: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    marginLeft: 10,
  },
  highContrastInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    color: '#000',
  },
  securityNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginLeft: 5,
  },
  actionButton: {
    backgroundColor: '#5e48e8',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  highContrastActionButton: {
    backgroundColor: '#000',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  highContrastButtonText: {
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    color: '#5e48e8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  largeTitle: {
    fontSize: 24,
  },
  largeText: {
    fontSize: 18,
  },
  highContrastText: {
    color: '#000',
  },
  highContrastLink: {
    color: '#000',
    textDecorationLine: 'underline',
  },
  verificationContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  verificationImage: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 15,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  verificationInfo: {
    flexDirection: 'row',
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    width: '100%',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  verificationInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  resendButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 25,
    marginBottom: 15,
    width: '90%',
    alignItems: 'center',
  },
  resendButtonDisabled: {
    backgroundColor: '#eeeeff',
    borderColor: '#a097e0',
  },
  resendButtonSuccess: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  resendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendButtonTextSuccess: {
    color: '#fff',
  },
  loginButton: {
    paddingVertical: 12,
    marginTop: 10,
  },
  loginButtonText: {
    color: '#5e48e8',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  largeTextSmall: {
    fontSize: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 15,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  spamInfo: {
    flexDirection: 'row',
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  spamInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  resendEmailButton: {
    backgroundColor: '#f0f0ff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#5e48e8',
  },
  resendEmailButtonText: {
    color: '#5e48e8',
    fontWeight: '600',
    fontSize: 14,
  },
  welcomeModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 360,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  welcomeDuduImage: {
    width: 140,
    height: 140,
    marginBottom: 15,
  },
  welcomeButton: {
    paddingVertical: 12,
    marginTop: 10,
  },
  welcomeButtonText: {
    color: '#5e48e8',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  }
}); 