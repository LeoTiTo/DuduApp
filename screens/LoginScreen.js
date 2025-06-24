import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Dimensions,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import SpeechService from '../services/SpeechService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, route }) {
  const { settings } = useAccessibility();
  const { login, deleteUserAccount, resetPassword, checkEmailVerification, resendVerificationEmail, checkFirstLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // État pour le message d'erreur de vérification d'e-mail
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // État pour le modal de bienvenue à la première connexion
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const successAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation pour Dudu
  const duduAnimation = useRef(new Animated.Value(0)).current;
  const bubbleAnimations = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;
  
  // Animer Dudu et les bulles à l'apparition de l'écran
  useEffect(() => {
    // Animation d'entrée de Dudu
    if (settings.reducedMotion) {
      // Si reducedMotion est activé, définir directement la valeur sans animation
      duduAnimation.setValue(1);
    } else {
      Animated.timing(duduAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }).start();
    }
    
    // Animation des bulles
    if (!settings.reducedMotion) {
      bubbleAnimations.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 300),
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000 + index * 500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 3000 + index * 500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            })
          ])
        ).start();
      });
    }
  }, [settings.reducedMotion]);
  
  const redirectAfterLogin = route.params?.redirectAfterLogin;
  const showDeleteMessage = route.params?.showDeleteMessage;
  const redirectTo = route.params?.redirectTo;
  const redirectParams = route.params?.redirectParams;
  const message = route.params?.message;
  
  // Afficher un message de redirection si présent
  useEffect(() => {
    if (message) {
      Alert.alert('Information', message);
    }
  }, [message]);
  
  // Afficher un message si l'utilisateur doit se reconnecter pour supprimer son compte
  useEffect(() => {
    if (showDeleteMessage) {
      Alert.alert(
        'Reconnexion requise',
        'Veuillez vous reconnecter pour pouvoir supprimer votre compte.'
      );
    }
  }, [showDeleteMessage]);
  
  // Fonction pour gérer la connexion
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      
      // Vérifier si l'e-mail est vérifié
      const isVerified = await checkEmailVerification();
      
      if (!isVerified) {
        // Si l'e-mail n'est pas vérifié, afficher une alerte
        setVerificationEmail(email);
        setVerificationPassword(password);
        setShowVerificationAlert(true);
        setLoading(false);
        return;
      }
      
      // Vérifier si c'est la première connexion de l'utilisateur
      const isFirstLogin = await checkFirstLogin();
      
      if (isFirstLogin) {
        // Si c'est la première connexion, afficher le modal de bienvenue
        setShowWelcomeModal(true);
        
        // Animer l'apparition du succès
        Animated.sequence([
          Animated.timing(successAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ]).start();
        
        setLoading(false);
        return;
      }
      
      // Gérer les redirections
      if (redirectAfterLogin === 'ProfileScreen' && showDeleteMessage) {
        // Si l'utilisateur se reconnecte pour supprimer son compte
        Alert.alert(
          'Compte reconnecté',
          'Vous pouvez maintenant supprimer votre compte.',
          [
            { 
              text: 'Continuer', 
              onPress: () => navigation.replace('ProfileScreen')
            }
          ]
        );
      } else if (redirectTo) {
        // Si une redirection est demandée
        if (redirectTo === 'FavoritesScreen') {
          navigation.replace('FavoritesScreen');
        } else if (redirectTo === 'AssociationDetailScreen' && redirectParams) {
          navigation.replace('AssociationDetailScreen', redirectParams);
        } else {
          navigation.replace(redirectTo, redirectParams);
        }
      } else {
        navigation.replace('HomeScreen');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // Gestion des erreurs Firebase
      let errorMessage = 'Une erreur s\'est produite lors de la connexion.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adresse e-mail invalide.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte ne correspond à cette adresse e-mail.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives de connexion. Veuillez réessayer plus tard.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer la réinitialisation du mot de passe
  const handlePasswordReset = () => {
    if (!email) {
      setError('Veuillez entrer votre adresse e-mail pour réinitialiser votre mot de passe.');
      return;
    }
    
    setLoading(true);
    
    resetPassword(email)
      .then(() => {
        Alert.alert(
          'E-mail envoyé',
          'Un lien de réinitialisation a été envoyé à votre adresse e-mail.'
        );
      })
      .catch(error => {
        console.error('Erreur de réinitialisation:', error);
        
        let errorMessage = 'Impossible d\'envoyer l\'e-mail de réinitialisation.';
        
        if (error.code === 'auth/invalid-email') {
          errorMessage = 'Adresse e-mail invalide.';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'Aucun compte ne correspond à cette adresse e-mail.';
        }
        
        setError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Fonction pour renvoyer l'e-mail de vérification
  const handleResendVerification = async () => {
    setResendingEmail(true);
    setResendSuccess(false);
    
    try {
      // Se connecter si ce n'est pas déjà fait
      if (!auth.currentUser) {
        // On se reconnecte avec les identifiants fournis
        await login(verificationEmail, verificationPassword);
      }
      
      // Envoyer l'email de vérification
      await resendVerificationEmail();
      
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
  
  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Bulles en arrière-plan - masquées en mode contraste élevé */}
      {!settings.highContrast && !settings.reducedMotion && (
        <View style={StyleSheet.absoluteFill}>
          {bubbleAnimations.map((anim, index) => {
            const translateX = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, (index % 2 === 0 ? 40 : -40)],
            });
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, (index % 3 === 0 ? -60 : 60)],
            });
            const scale = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 1.1, 0.8],
            });
            const colors = ['#e0f7fa', '#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff8e1', '#ffebee'];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: colors[index % colors.length],
                    top: 100 + ((index * 120) % (height - 200)),
                    left: (index % 3 === 0) 
                      ? 30 + (index * 20) 
                      : (index % 3 === 1) 
                        ? width / 2 - 40
                        : width - 120 - (index * 10),
                    width: 60 + (index % 4) * 30,
                    height: 60 + (index % 4) * 30,
                    borderRadius: 100,
                    transform: [
                      { translateX }, 
                      { translateY }, 
                      { scale }
                    ],
                    opacity: 0.3 + (index % 3) * 0.1,
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
          Connexion
        </Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Dudu avec message d'accueil */}
        <View style={styles.duduSection}>
          <Animated.View
            style={[
              styles.duduContainer,
              {
                opacity: duduAnimation,
                transform: settings.reducedMotion ? [] : [
                  {
                    translateY: duduAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <Image 
              source={require('../assets/dudu/dudu_docteur.png')} 
              style={styles.duduImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          <View style={styles.welcomeMessageContainer}>
            <Text style={[
              styles.welcomeTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTitle
            ]}>
              Bonjour !
            </Text>
            <Text style={[
              styles.welcomeText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Dudu est content de vous revoir ! Connectez-vous pour suivre vos dons et collectionner des badges.
            </Text>
          </View>
        </View>

        <View style={[
          styles.formContainer,
          settings.highContrast && styles.highContrastSection
        ]}>
          <Text style={[
            styles.formTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Connectez-vous à votre compte
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
                placeholder="Votre mot de passe"
                secureTextEntry={true}
                accessible={true}
                accessibilityLabel="Entrez votre mot de passe"
              />
              <Ionicons name="lock-closed-outline" size={20} color="#5e48e8" style={styles.inputIcon} />
            </View>
            <Text style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#5e48e8" /> Dudu garde vos données en sécurité
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ResetPasswordScreen')}
            accessible={true}
            accessibilityLabel="Mot de passe oublié ?"
            accessibilityRole="button"
          >
            <Text style={[
              styles.forgotPasswordText,
              settings.highContrast && styles.highContrastLink,
              settings.largeText && styles.largeText
            ]}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.loginButton,
              settings.highContrast && styles.highContrastActionButton
            ]}
            onPress={handleLogin}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Se connecter"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[
                styles.loginButtonText,
                settings.highContrast && styles.highContrastButtonText,
                settings.largeText && styles.largeText
              ]}>
                Se connecter
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.registerContainer}>
            <Text style={[
              styles.registerText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Vous n'avez pas de compte ?
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('RegisterScreen')}
              accessible={true}
              accessibilityLabel="Créer un compte"
              accessibilityRole="button"
            >
              <Text style={[
                styles.registerLink,
                settings.highContrast && styles.highContrastLink,
                settings.largeText && styles.largeText
              ]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.benefitsContainer}>
            <Text style={[
              styles.benefitsTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Pourquoi créer un compte ?
            </Text>
            <View style={styles.benefitItem}>
              <Ionicons name="medal-outline" size={20} color="#5e48e8" style={styles.benefitIcon} />
              <Text style={[
                styles.benefitText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Collectionnez des badges rigolos
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="bookmark-outline" size={20} color="#5e48e8" style={styles.benefitIcon} />
              <Text style={[
                styles.benefitText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Retrouvez vos associations préférées
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="receipt-outline" size={20} color="#5e48e8" style={styles.benefitIcon} />
              <Text style={[
                styles.benefitText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Suivez tous vos reçus fiscaux
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="calendar-outline" size={20} color="#5e48e8" style={styles.benefitIcon} />
              <Text style={[
                styles.benefitText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Programmez des dons récurrents
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de bienvenue pour la première connexion */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWelcomeModal}
        onRequestClose={() => {
          setShowWelcomeModal(false);
          navigation.replace('HomeScreen');
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.welcomeModal,
              {
                opacity: successAnimation,
                transform: [{
                  scale: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }
            ]}
          >
            {/* Confettis animés */}
            {Array.from({ length: 20 }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.confetti,
                  {
                    left: `${5 + (index % 10) * 9}%`,
                    top: `-10%`,
                    backgroundColor: [
                      '#FFA3B1', '#91C1FF', '#A5F2B3', '#FFC0EB', '#B1ACFF',
                      '#FFE156', '#93EEEA', '#FF9CEE', '#CEFF1A', '#FFC864'
                    ][index % 10],
                    transform: [
                      { 
                        translateY: confettiAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 500 + Math.random() * 200]
                        })
                      },
                      { 
                        translateX: confettiAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -100 + Math.random() * 200]
                        })
                      },
                      { 
                        rotate: confettiAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${360 + Math.random() * 360}deg`]
                        })
                      },
                      { 
                        scale: confettiAnimation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1, 0]
                        })
                      }
                    ]
                  }
                ]}
              />
            ))}
            
            <Image 
              source={require('../assets/dudu/dudu_cadeau_dans_les_mains.png')} 
              style={styles.welcomeDuduImage}
              resizeMode="contain"
            />
            
            <Text style={styles.welcomeTitle}>
              Bienvenue !
            </Text>
            
            <Text style={styles.welcomeMessage}>
              Dudu est super content de te compter parmi ses amis ! 
              Ton compte a été vérifié avec succès.
            </Text>
            
            <View style={styles.welcomeBenefits}>
              <View style={styles.benefitBadge}>
                <Ionicons name="medal" size={16} color="#5e48e8" />
                <Text style={styles.benefitText}>Badges</Text>
              </View>
              
              <View style={styles.benefitBadge}>
                <Ionicons name="heart" size={16} color="#5e48e8" />
                <Text style={styles.benefitText}>Favoris</Text>
              </View>
              
              <View style={styles.benefitBadge}>
                <Ionicons name="repeat" size={16} color="#5e48e8" />
                <Text style={styles.benefitText}>Dons récurrents</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.welcomeButton}
              onPress={() => {
                setShowWelcomeModal(false);
                navigation.replace('HomeScreen');
              }}
              accessible={true}
              accessibilityLabel="C'est parti"
              accessibilityRole="button"
            >
              <Text style={styles.welcomeButtonText}>
                C'est parti !
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Modal d'alerte de vérification d'e-mail */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showVerificationAlert}
        onRequestClose={() => setShowVerificationAlert(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.verificationModal,
            settings.highContrast && styles.highContrastModal
          ]}>
            <Image 
              source={require('../assets/dudu/dudu_docteur.png')} 
              style={styles.verificationImage}
              resizeMode="contain"
            />
            
            <Text style={[
              styles.verificationTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTitle
            ]}>
              E-mail non vérifié
            </Text>
            
            <Text style={[
              styles.verificationText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Votre e-mail n'a pas encore été vérifié. Veuillez vérifier <Text style={styles.emailHighlight}>{verificationEmail}</Text> et cliquer sur le lien de confirmation.
            </Text>
            
            <View style={styles.spamWarning}>
              <Ionicons name="information-circle" size={18} color="#5e48e8" style={{marginRight: 8}} />
              <Text style={[
                styles.spamWarningText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeTextSmall
              ]}>
                Pensez à vérifier vos spams si vous ne trouvez pas l'e-mail !
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.verificationButton,
                resendingEmail && styles.verificationButtonDisabled,
                resendSuccess && styles.verificationButtonSuccess,
                settings.highContrast && styles.highContrastButton
              ]}
              onPress={handleResendVerification}
              disabled={resendingEmail || resendSuccess}
              accessible={true}
              accessibilityLabel="Renvoyer l'e-mail de vérification"
              accessibilityRole="button"
            >
              {resendingEmail ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[
                  styles.verificationButtonText,
                  settings.highContrast && styles.highContrastButtonText,
                  settings.largeText && styles.largeText
                ]}>
                  {resendSuccess ? 'E-mail envoyé !' : 'Renvoyer l\'e-mail de vérification'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowVerificationAlert(false)}
              accessible={true}
              accessibilityLabel="Fermer"
              accessibilityRole="button"
            >
              <Text style={[
                styles.closeButtonText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  bubble: {
    position: 'absolute',
    zIndex: -1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  duduSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  duduContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  duduImage: {
    width: 150,
    height: 150,
  },
  welcomeMessageContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
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
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#5e48e8',
    fontSize: 14,
  },
  highContrastLink: {
    color: '#000',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#5e48e8',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  highContrastActionButton: {
    backgroundColor: '#000',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  highContrastButtonText: {
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
    marginRight: 5,
  },
  registerLink: {
    color: '#5e48e8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  benefitsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f9f7ff',
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitIcon: {
    marginRight: 10,
  },
  benefitText: {
    fontSize: 11,
    color: '#5e48e8',
    marginLeft: 4,
    fontWeight: '500',
  },
  largeTitle: {
    fontSize: 28,
  },
  largeText: {
    fontSize: 18,
  },
  highContrastText: {
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
  },
  highContrastModal: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  verificationImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 15,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#5e48e8',
  },
  verificationButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '90%',
    alignItems: 'center',
  },
  verificationButtonDisabled: {
    backgroundColor: '#a097e0',
  },
  verificationButtonSuccess: {
    backgroundColor: '#4caf50',
  },
  verificationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
  spamWarning: {
    flexDirection: 'row',
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    width: '90%',
    alignItems: 'center',
  },
  spamWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  largeTextSmall: {
    fontSize: 16,
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
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  welcomeBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 25,
  },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 25,
    borderRadius: 3,
  },
  welcomeButton: {
    backgroundColor: '#5e48e8',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  welcomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 