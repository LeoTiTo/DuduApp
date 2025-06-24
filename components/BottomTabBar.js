import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Modal, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext'; 
import SimplifiedText from './SimplifiedText';
import SpeechService from '../services/SpeechService';

const { width } = Dimensions.get('window');

export default function BottomTabBar({ navigation, currentRoute }) {
  const { settings } = useAccessibility();
  const { currentUser } = useAuth();
  const [prevRoute, setPrevRoute] = useState(currentRoute);
  const [animation] = useState(new Animated.Value(0));
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Définition des routes de navigation avec icônes Ionicons
  const routes = [
    { name: 'HomeScreen', label: 'Accueil', icon: 'home-outline', activeIcon: 'home' },
    { name: 'AssociationsScreen', label: 'Rechercher', icon: 'search-outline', activeIcon: 'search' },
    { name: 'FavoritesScreen', label: 'Favoris', icon: 'heart-outline', activeIcon: 'heart' },
    { name: 'AccessibilityScreen', label: 'Paramètres', icon: 'settings-outline', activeIcon: 'settings' },
  ];
  
  // Effet pour animer la transition entre les onglets
  useEffect(() => {
    if (currentRoute !== prevRoute) {
      // Réinitialiser l'animation
      animation.setValue(0);
      
      // Démarrer l'animation
      const animationDuration = settings.reducedMotion ? 100 : 500;
      Animated.timing(animation, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }).start();
      
      setPrevRoute(currentRoute);
    }
  }, [currentRoute, prevRoute, animation, settings.reducedMotion]);

  // Naviguer vers la page de connexion
  const navigateToLogin = () => {
    setShowLoginModal(false);
    navigation.navigate('LoginScreen', {
      redirectTo: 'FavoritesScreen',
      message: 'Veuillez vous connecter pour accéder à vos favoris'
    });
  };
  
  // Naviguer vers la page d'inscription
  const navigateToRegister = () => {
    setShowLoginModal(false);
    navigation.navigate('RegisterScreen');
  };
  
  // Fermer le modal
  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  // Vérifier si on est sur une route donnée
  const isActive = (routeName) => {
    return currentRoute === routeName;
  };

  // Gérer la navigation
  const handleNavigation = (routeName) => {
    if (routeName === 'FavoritesScreen' && !currentUser) {
      // Si on essaie d'accéder aux favoris et qu'on n'est pas connecté
      setShowLoginModal(true);
    } else {
      // Dans tous les autres cas, naviguer normalement
      navigation.navigate(routeName);
    }
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
            Dudu a besoin de savoir qui vous êtes pour accéder à vos associations favorites.
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
    <>
      <View style={[
        styles.container,
        settings.highContrast && styles.highContrastContainer
      ]}>
        {routes.map(route => (
          <TouchableOpacity 
            key={route.name}
            style={[
              styles.tabButton,
              isActive(route.name) && styles.activeTabButton,
              settings.highContrast && styles.highContrastTabButton,
              isActive(route.name) && settings.highContrast && styles.highContrastActiveTabButton,
            ]}
            onPress={() => handleNavigation(route.name)}
            accessible={true}
            accessibilityLabel={route.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive(route.name) }}
          >
              <Ionicons
                name={isActive(route.name) ? route.activeIcon : route.icon}
              size={24}
                color={
                  isActive(route.name)
                  ? (settings.highContrast ? '#FFFFFF' : '#5e48e8')
                  : (settings.highContrast ? '#EEEEEE' : '#888888')
                }
              style={styles.tabIcon}
              />
              <SimplifiedText 
                style={[
                styles.tabLabel,
                isActive(route.name) && styles.activeTabLabel,
                settings.highContrast && styles.highContrastText
                ]}
              >
                {route.label}
              </SimplifiedText>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Modal de connexion */}
      {renderLoginModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
    paddingBottom: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  highContrastContainer: {
    backgroundColor: '#333333',
    borderTopColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  activeTabButton: {
    backgroundColor: '#f8f6ff',
  },
  highContrastTabButton: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#666666',
  },
  highContrastActiveTabButton: {
    backgroundColor: '#666666',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#888888',
  },
  activeTabLabel: {
    color: '#5e48e8',
    fontWeight: '600',
  },
  highContrastText: {
    color: '#FFFFFF',
  },
  largeTextDescription: {
    fontSize: 18,
  },
  largeText: {
    fontSize: 22,
  },
  largeTitle: {
    fontSize: 26,
  },
  // Styles pour le modal
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
  highContrastConfirmButton: {
    backgroundColor: '#000',
  },
  highContrastConfirmButtonText: {
    color: '#fff',
  },
  highContrastSection: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
}); 