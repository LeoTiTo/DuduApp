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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import SpeechService from '../services/SpeechService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordScreen({ navigation }) {
  const { settings } = useAccessibility();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
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
  
  // Fonction pour gérer la réinitialisation du mot de passe
  const handlePasswordReset = () => {
    if (!email) {
      setError('Veuillez entrer votre adresse e-mail pour réinitialiser votre mot de passe.');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse e-mail valide.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    resetPassword(email)
      .then(() => {
        setSuccess(true);
        setEmail('');
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
  
  // Validation simple d'e-mail
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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
          accessibilityLabel="Retour à l'écran de connexion"
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
          Mot de passe oublié
        </Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Dudu avec message d'explication */}
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
              source={require('../assets/dudu/dudu_ballon_helium_reflechit_inquiet.png')} 
              style={styles.duduImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          <View style={styles.messageContainer}>
            <Text style={[
              styles.messageTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTitle
            ]}>
              Mot de passe oublié ?
            </Text>
            <Text style={[
              styles.messageText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Pas de panique ! Dudu va vous aider à récupérer l'accès à votre compte. Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </Text>
          </View>
        </View>

        <View style={[
          styles.formContainer,
          settings.highContrast && styles.highContrastSection
        ]}>
          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" style={styles.successIcon} />
              <Text style={[
                styles.successTitle,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeTitle
              ]}>
                E-mail envoyé !
              </Text>
              <Text style={[
                styles.successText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Nous avons envoyé un lien de réinitialisation à votre adresse e-mail. Veuillez vérifier votre boîte de réception et suivre les instructions.
              </Text>
              <TouchableOpacity 
                style={[
                  styles.returnButton,
                  settings.highContrast && styles.highContrastActionButton
                ]}
                onPress={() => navigation.navigate('LoginScreen')}
                accessible={true}
                accessibilityLabel="Retour à la connexion"
                accessibilityRole="button"
              >
                <Text style={[
                  styles.returnButtonText,
                  settings.highContrast && styles.highContrastButtonText,
                  settings.largeText && styles.largeText
                ]}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
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
              
              <Text style={[
                styles.formTitle,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Réinitialisation du mot de passe
              </Text>
              
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
              
              <Text style={styles.securityNote}>
                <Ionicons name="information-circle-outline" size={14} color="#5e48e8" /> Nous vous enverrons un lien de réinitialisation par e-mail
              </Text>
              
              <TouchableOpacity 
                style={[
                  styles.resetButton,
                  settings.highContrast && styles.highContrastActionButton
                ]}
                onPress={handlePasswordReset}
                disabled={loading}
                accessible={true}
                accessibilityLabel="Envoyer le lien de réinitialisation"
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[
                    styles.resetButtonText,
                    settings.highContrast && styles.highContrastButtonText,
                    settings.largeText && styles.largeText
                  ]}>
                    Envoyer le lien de réinitialisation
                  </Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <Text style={[
                  styles.registerText,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeText
                ]}>
                  Vous vous souvenez de votre mot de passe ?
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('LoginScreen')}
                  accessible={true}
                  accessibilityLabel="Retour à la connexion"
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.registerLink,
                    settings.highContrast && styles.highContrastLink,
                    settings.largeText && styles.largeText
                  ]}>
                    Retour à la connexion
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    backgroundColor: '#000000',
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
  messageContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e48e8',
    marginBottom: 5,
  },
  messageText: {
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
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  highContrastInput: {
    backgroundColor: '#fff',
    borderColor: '#000',
    color: '#000',
  },
  inputIcon: {
    marginLeft: 10,
  },
  securityNote: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#5e48e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  highContrastActionButton: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#fff',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  highContrastButtonText: {
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  registerLink: {
    fontSize: 14,
    color: '#5e48e8',
    fontWeight: 'bold',
  },
  highContrastLink: {
    color: '#000',
    textDecorationLine: 'underline',
  },
  largeText: {
    fontSize: 18,
  },
  largeTitle: {
    fontSize: 28,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  returnButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#5e48e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 