import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import SpeechService from '../services/SpeechService';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen({ navigation }) {
  const { settings } = useAccessibility();
  const { currentUser, updateUserProfile, updateUserEmail, resetPassword, updateUserPassword } = useAuth();
  
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Fonction pour mettre à jour le profil
  const handleUpdateProfile = async () => {
    if (!displayName || !email) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Vérifier si le nom a changé
      if (displayName !== currentUser.displayName) {
        await updateUserProfile(displayName);
      }
      
      // Vérifier si l'email a changé
      if (email !== currentUser.email) {
        await updateUserEmail(email);
      }
      
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
      
      // Gestion des erreurs Firebase
      let errorMessage = 'Une erreur s\'est produite lors de la mise à jour du profil.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse e-mail est déjà utilisée.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adresse e-mail invalide.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Cette opération nécessite une authentification récente. Veuillez vous reconnecter.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour ouvrir la modal de changement de mot de passe
  const handleOpenPasswordModal = () => {
    setPasswordModalVisible(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Fonction pour changer le mot de passe
  const handleChangePassword = async () => {
    // Vérification des champs
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // Utiliser la fonction du contexte qui gère la réauthentification et le changement de mot de passe
      await updateUserPassword(oldPassword, newPassword);
      
      setPasswordSuccess('Mot de passe mis à jour avec succès !');
      
      // Fermer la modal après quelques secondes
      setTimeout(() => {
        setPasswordModalVisible(false);
      }, 1500);
    } catch (error) {
      console.error('Erreur de changement de mot de passe:', error);
      
      let errorMessage = 'Une erreur s\'est produite lors du changement de mot de passe.';
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'L\'ancien mot de passe est incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives incorrectes. Veuillez réessayer plus tard.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Cette opération nécessite une authentification récente. Veuillez vous reconnecter.';
        
        // Fermer la modal et rediriger vers l'écran de connexion
        setPasswordModalVisible(false);
        Alert.alert(
          'Reconnexion nécessaire',
          'Pour des raisons de sécurité, vous devez vous reconnecter avant de changer votre mot de passe.',
          [
            { text: 'OK', onPress: () => navigation.navigate('LoginScreen') }
          ]
        );
        return;
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
      }
      
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
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
          Modifier le profil
        </Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[
          styles.formContainer,
          settings.highContrast && styles.highContrastSection
        ]}>
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
          
          {success ? (
            <View style={styles.successContainer}>
              <Text style={[
                styles.successText,
                settings.largeText && styles.largeText
              ]}>
                {success}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.inputContainer}>
            <Text style={[
              styles.inputLabel,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Nom complet
            </Text>
            <TextInput
              style={[
                styles.input,
                settings.highContrast && styles.highContrastInput,
                settings.largeText && styles.largeText
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Votre nom complet"
              accessible={true}
              accessibilityLabel="Entrez votre nom complet"
            />
          </View>
          
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
          
          <TouchableOpacity 
            style={[
              styles.passwordButton,
              settings.highContrast && styles.highContrastPasswordButton
            ]}
            onPress={handleOpenPasswordModal}
            accessible={true}
            accessibilityLabel="Changer le mot de passe"
            accessibilityRole="button"
          >
            <Text style={[
              styles.passwordButtonText,
              settings.highContrast && styles.highContrastPasswordText,
              settings.largeText && styles.largeText
            ]}>
              Changer le mot de passe
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.updateButton,
              settings.highContrast && styles.highContrastActionButton,
              loading && styles.disabledButton
            ]}
            onPress={handleUpdateProfile}
            disabled={loading}
            accessible={true}
            accessibilityLabel="Enregistrer les modifications"
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.updateButtonText,
                settings.highContrast && styles.highContrastActionButtonText,
                settings.largeText && styles.largeText
              ]}>
                Enregistrer les modifications
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modal pour le changement de mot de passe */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
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
              Changer le mot de passe
            </Text>
            
            {passwordError ? (
              <View style={styles.errorContainer}>
                <Text style={[
                  styles.errorText,
                  settings.largeText && styles.largeText
                ]}>
                  {passwordError}
                </Text>
              </View>
            ) : null}
            
            {passwordSuccess ? (
              <View style={styles.successContainer}>
                <Text style={[
                  styles.successText,
                  settings.largeText && styles.largeText
                ]}>
                  {passwordSuccess}
                </Text>
              </View>
            ) : null}
            
            <View style={styles.inputContainer}>
              <Text style={[
                styles.inputLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Ancien mot de passe
              </Text>
              <TextInput
                style={[
                  styles.input,
                  settings.highContrast && styles.highContrastInput,
                  settings.largeText && styles.largeText
                ]}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Votre mot de passe actuel"
                secureTextEntry={true}
                accessible={true}
                accessibilityLabel="Entrez votre mot de passe actuel"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[
                styles.inputLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Nouveau mot de passe
              </Text>
              <TextInput
                style={[
                  styles.input,
                  settings.highContrast && styles.highContrastInput,
                  settings.largeText && styles.largeText
                ]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Votre nouveau mot de passe"
                secureTextEntry={true}
                accessible={true}
                accessibilityLabel="Entrez votre nouveau mot de passe"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[
                styles.inputLabel,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeText
              ]}>
                Confirmer le nouveau mot de passe
              </Text>
              <TextInput
                style={[
                  styles.input,
                  settings.highContrast && styles.highContrastInput,
                  settings.largeText && styles.largeText
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmez le nouveau mot de passe"
                secureTextEntry={true}
                accessible={true}
                accessibilityLabel="Confirmez le nouveau mot de passe"
              />
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  settings.highContrast && styles.highContrastCancelModal
                ]}
                onPress={() => setPasswordModalVisible(false)}
                accessible={true}
                accessibilityLabel="Annuler"
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
                  settings.highContrast && styles.highContrastActionButton,
                  passwordLoading && styles.disabledButton
                ]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
                accessible={true}
                accessibilityLabel="Changer le mot de passe"
                accessibilityRole="button"
                accessibilityState={{ disabled: passwordLoading }}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.modalButtonText,
                    styles.modalConfirmButtonText,
                    settings.highContrast && styles.highContrastActionButtonText,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  highContrastSection: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: '#2e7d32',
    textAlign: 'center',
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
    height: 50,
  },
  highContrastInput: {
    borderColor: '#000',
    borderWidth: 2,
    color: '#000',
  },
  passwordButton: {
    marginTop: 5,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  highContrastPasswordButton: {
    backgroundColor: 'transparent',
  },
  passwordButtonText: {
    color: '#5e48e8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  highContrastPasswordText: {
    color: '#000',
  },
  updateButton: {
    backgroundColor: '#5e48e8',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  highContrastActionButton: {
    backgroundColor: '#000',
  },
  disabledButton: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  highContrastActionButtonText: {
    color: '#fff',
  },
  largeText: {
    fontSize: 18,
  },
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalConfirmButton: {
    backgroundColor: '#5e48e8',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButtonText: {
    color: '#333',
  },
  modalConfirmButtonText: {
    color: '#fff',
  },
  highContrastCancelModal: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
}); 