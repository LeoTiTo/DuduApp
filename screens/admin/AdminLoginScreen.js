import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import SpeechService from '../../services/SpeechService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { checkIfAdmin } from '../../firebase/models/AdminModel';

export default function AdminLoginScreen({ navigation }) {
  const { settings } = useAccessibility();
  const { login, currentUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Effet pour la synthèse vocale
  useEffect(() => {
    if (settings.textToSpeech) {
      SpeechService.speak(`Connexion administrateur`);
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech]);
  
  // Fonction pour gérer la connexion administrateur
  const handleAdminLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Se connecter d'abord avec Firebase Auth
      const userCredential = await login(email, password);
      
      // Vérifier si l'utilisateur est un administrateur
      const adminData = await checkIfAdmin(userCredential.user.uid);
      
      if (adminData) {
        // Rediriger vers le tableau de bord administrateur
        navigation.replace('AdminDashboardScreen', { adminData });
      } else {
        // L'utilisateur n'est pas un administrateur
        setError('Vous n\'avez pas les droits d\'administrateur pour accéder à cette section.');
      }
    } catch (error) {
      console.error('Erreur de connexion admin:', error);
      
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
          Admin
        </Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logos/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel="Logo DonAccès"
          />
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
            Espace administrateur
          </Text>
          
          <Text style={[
            styles.formSubtitle,
            settings.highContrast && styles.highContrastSecondaryText,
            settings.largeText && styles.largeText
          ]}>
            Connectez-vous pour accéder à votre espace
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
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[
              styles.inputLabel,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Mot de passe
            </Text>
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
          </View>
          
          <TouchableOpacity 
            style={[
              styles.loginButton,
              settings.highContrast && styles.highContrastActionButton,
              loading && styles.disabledButton
            ]}
            onPress={handleAdminLogin}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Se connecter comme administrateur"
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.loginButtonText,
                settings.largeText && styles.largeText
              ]}>
                Se connecter
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  highContrastButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  highContrastText: {
    color: '#000000',
  },
  highContrastSecondaryText: {
    color: '#333333',
  },
  largeText: {
    fontSize: 20,
  },
  placeholderView: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    width: 150,
    height: 150,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highContrastSection: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffeded',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
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
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  highContrastInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  loginButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  highContrastActionButton: {
    backgroundColor: '#000000',
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 