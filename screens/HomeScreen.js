import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Easing,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import SpeechService from '../services/SpeechService';
import SimplifiedText from '../components/SimplifiedText';
import { associationsData } from '../data/AssociationsData';
import AssociationsCacheService from '../services/AssociationsCacheService';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  // Utiliser le contexte d'accessibilité
  const { settings } = useAccessibility();
  const { currentUser } = useAuth();
  
  // État pour la catégorie sélectionnée
  const [selectedCategory, setSelectedCategory] = useState('Populaires');
  const [associations, setAssociations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  
  // Création des bulles animées pour le fond
  const bubbles = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;

  // État pour le modal de connexion
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // État pour l'avatar de l'utilisateur
  const [userAvatar, setUserAvatar] = useState(null);
  
  // Charger les associations au démarrage
  const loadAssociations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AssociationsCacheService.getAssociations();
      if (isMounted.current) {
        setAssociations(data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des associations:", error);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);
  
  // Charger les associations au montage du composant
  useEffect(() => {
    loadAssociations();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadAssociations]);

  // Réinitialiser le flag isMounted
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Animation des bulles uniquement si reducedMotion est désactivé
    if (!settings.reducedMotion && !settings.highContrast) {
      bubbles.forEach((anim, index) => {
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 12000 + index * 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      });
    }
    
    return () => {
      bubbles.forEach((anim) => {
        anim.stopAnimation();
      });
    };
  }, [settings.reducedMotion, settings.highContrast]);
  
  // Configurer le service de synthèse vocale et les commandes vocales
  useEffect(() => {
    SpeechService.setNavigation(navigation);
    SpeechService.setVoiceCommandsEnabled(settings.voiceCommands);
    
    // Lire la description de l'écran si la synthèse vocale est activée
    if (settings.textToSpeech) {
      SpeechService.speakCurrentScreen(
        "Accueil",
        "Bienvenue sur DuDu, l'application de dons accessible à tous. Utilisez le menu pour naviguer."
      );
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech, settings.voiceCommands, navigation]);

  // Charger l'avatar de l'utilisateur
  const loadUserAvatar = async () => {
    try {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.avatarPath) {
            // Définir le chemin d'avatar approprié
            const avatarPath = getAvatarPath(userData.avatarPath);
            if (avatarPath) {
              setUserAvatar(avatarPath);
            }
          }
        }
      } else {
        setUserAvatar(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'avatar:', error);
    }
  };
  
  // Fonction pour obtenir le chemin de l'image d'avatar
  const getAvatarPath = (avatarId) => {
    const avatarOptions = {
      'dudu_docteur': require('../assets/dudu/dudu_docteur.png'),
      'dudu_assis_mignon_bienvenue': require('../assets/dudu/dudu_assis_mignon_bienvenue.png'),
      'dudu_a_la_muscu': require('../assets/dudu/dudu_a_la_muscu.png'),
      'dudu_ballon_helium_reflechit_inquiet': require('../assets/dudu/dudu_ballon_helium_reflechit_inquiet.png'),
      'dudu_cadeau_dans_les_mains': require('../assets/dudu/dudu_cadeau_dans_les_mains.png'),
      'dudu_chante': require('../assets/dudu/dudu_chante.png'),
      'dudu_chevalier_veut_se_battre': require('../assets/dudu/dudu_chevalier_veut_se_battre.png'),
      'dudu_clin_doeil_et_bisous': require('../assets/dudu/dudu_clin_doeil_et_bisous.png'),
      'dudu_cupidon': require('../assets/dudu/dudu_cupidon.png'),
      'dudu_icone_coeur_rougit': require('../assets/dudu/dudu_icone_coeur_rougit.png'),
      'dudu_mignon_dans_un_bouquet_de_fleurs': require('../assets/dudu/dudu_mignon_dans_un_bouquet_de_fleurs.png'),
      'dudu_timide_baton_de_glace': require('../assets/dudu/dudu_timide_baton_de_glace.png'),
      'dudu_vole_il_est_un_ange': require('../assets/dudu/dudu_vole_il_est_un_ange.png'),
    };
    
    return avatarOptions[avatarId];
  };
  
  // Charger les données lors du focus sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadUserAvatar();
    }, [currentUser])
  );

  // Liste des associations classées par catégories (optimisée)
  const getAssociationsByCategory = (category) => {
    if (!associations.length) return [];
    
    if (category === "Toutes") {
      return associations;
    }
    
    return associations.filter(asso => 
      asso.mainCategory === category || 
      (associationsData[category] && associationsData[category].some(a => a.id === asso.id))
    );
  };
  
  // Fonction pour obtenir la couleur pour une catégorie spécifique (par nom)
  const getColorForCategory = (categoryName) => {
    // Couleurs spécifiques pour chaque catégorie
    const categoryColors = {
      'Populaires': '#4B7BEC',        // Bleu
      'Handicap': '#2ECC71',          // Vert
      'Maladies chroniques': '#9B59B6', // Violet
      'Cancer': '#E74C3C',             // Rouge
      'Santé mentale': '#3498DB',     // Bleu ciel
      'Maladies rares': '#F1C40F',    // Jaune
      'Addictions': '#E67E22',        // Orange
      'Santé publique': '#1ABC9C',    // Turquoise
      'Accompagnement': '#8E44AD',    // Violet foncé
      'Maladies inflammatoires': '#E74C3C',  // Rouge
      'Défense des droits': '#34495E',  // Bleu marine
      'Maladies spécifiques': '#16A085', // Vert foncé
      'Associations de patients': '#2980B9', // Bleu
      'Soutien et entraide': '#D35400', // Orange foncé
      'Autres organisations': '#95A5A6', // Gris
      'Recherche et soutien': '#C0392B'  // Rouge foncé
    };
    
    return settings.highContrast ? '#FFFFFF' : (categoryColors[categoryName] || '#7F8C8D');
  };
  
  // Fonction pour obtenir la couleur de fond de l'onglet basée sur la catégorie
  const getCategoryTabBackground = (categoryName) => {
    if (settings.highContrast) return undefined; // Pas de coloration en mode contraste élevé

    // Pour la catégorie "Toutes", utiliser la couleur par défaut
    if (categoryName === "Toutes") return undefined;
    
    // Obtenir la couleur de base de la catégorie
    const baseColor = getColorForCategory(categoryName);
    
    // Créer une version légère de la couleur (25% d'opacité)
    return `${baseColor}40`; // 40 en hexadécimal = 25% d'opacité
  };

  // Rendu des catégories en onglets
  const renderCategoryTabs = () => {
    const categories = Object.keys(associationsData);
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsContainer}
      >
        <TouchableOpacity
          key="all"
          style={[
            styles.categoryTab,
            { backgroundColor: '#f0f0f0' },
            selectedCategory === "Toutes" && styles.categoryTabActive,
            selectedCategory === "Toutes" && { backgroundColor: '#e8e8e8' },
            settings.highContrast && styles.highContrastCategoryTab,
            selectedCategory === "Toutes" && settings.highContrast && styles.highContrastCategoryTabActive
          ]}
          onPress={() => {
            setSelectedCategory("Toutes");
            if (settings.textToSpeech) {
              SpeechService.speak(`Toutes les associations`);
            }
          }}
          accessible={true}
          accessibilityLabel="Voir toutes les associations"
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedCategory === "Toutes" }}
        >
          <SimplifiedText style={[
            styles.categoryTabText,
            selectedCategory === "Toutes" && styles.categoryTabTextActive,
            selectedCategory === "Toutes" && { color: '#444444' },
            settings.highContrast && styles.highContrastText,
            settings.largeText && { fontSize: 16 }
          ]}>
            Toutes
          </SimplifiedText>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              { backgroundColor: getCategoryTabBackground(category) || '#f0f0f0' },
              selectedCategory === category && styles.categoryTabActive,
              selectedCategory === category && { backgroundColor: `${getColorForCategory(category)}35` },
              settings.highContrast && styles.highContrastCategoryTab,
              selectedCategory === category && settings.highContrast && styles.highContrastCategoryTabActive
            ]}
            onPress={() => {
              setSelectedCategory(category);
              if (settings.textToSpeech) {
                SpeechService.speak(`Catégorie ${category}`);
              }
            }}
            accessible={true}
            accessibilityLabel={`Catégorie ${category}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedCategory === category }}
          >
            <SimplifiedText style={[
              styles.categoryTabText,
              selectedCategory === category && styles.categoryTabTextActive,
              selectedCategory === category && { color: getColorForCategory(category) },
              settings.highContrast && styles.highContrastText,
              settings.largeText && { fontSize: 16 }
            ]}>
              {category}
            </SimplifiedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Rendu des associations sous forme de carrousel ou de grille
  const renderOrganizations = () => {
    // Afficher l'indicateur de chargement si les données sont en train de charger
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={settings.highContrast ? "#000000" : "#4B7BEC"} />
          <SimplifiedText 
            style={[
              styles.loadingText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}
          >
            Chargement des associations...
          </SimplifiedText>
        </View>
      );
    }
    
    const organizations = getAssociationsByCategory(selectedCategory);
    
    // Si aucune association n'est trouvée pour cette catégorie
    if (organizations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <SimplifiedText 
            style={[
              styles.emptyText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}
          >
            Aucune association trouvée dans cette catégorie.
          </SimplifiedText>
        </View>
      );
    }
    
    // Format carrousel pour toutes les catégories
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      >
        {organizations.map((org, index) => (
          <TouchableOpacity 
            key={org.id} 
            style={[
              styles.orgCardHorizontal,
              settings.highContrast && styles.highContrastItem
            ]}
            onPress={() => {
              if (settings.textToSpeech) {
                SpeechService.speak(`${org.name}. ${org.description}`);
              }
              navigation.navigate('AssociationDetailScreen', { association: org });
            }}
            accessible={true}
            accessibilityLabel={`${org.name}. ${org.description}`}
            accessibilityRole="button"
          >
            {/* En-tête coloré avec logo et nom */}
            <View style={[
              styles.orgHeader, 
              { backgroundColor: getCategoryHeaderColor(org) },
              settings.highContrast && styles.highContrastHeader
            ]}>
              <View style={[
                styles.orgIcon, 
                settings.highContrast && styles.highContrastIconContainer
              ]}>
                {org.logoPath ? (
                  <Image 
                    source={org.logoPath}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={[
                    styles.orgIconText,
                    settings.highContrast && styles.highContrastText
                  ]}>
                    {org.logoPlaceholder || org.name.charAt(0)}
                  </Text>
                )}
              </View>
              <View style={styles.orgTitleContainer}>
                <SimplifiedText 
                  style={[
                    styles.orgTitle,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && styles.largeText
                  ]}
                  numberOfLines={2}
                >
                  {org.name}
                </SimplifiedText>
              </View>
            </View>
            
            {/* Contenu de la carte */}
            <View style={styles.orgContent}>
              <SimplifiedText 
                style={[
                  styles.orgDescription,
                  settings.highContrast && styles.highContrastText,
                  settings.largeText && styles.largeTextDescription
                ]}
                numberOfLines={3}
              >
                {org.description}
              </SimplifiedText>
              
              {/* Tags de catégories */}
              <View style={styles.tagsContainer}>
                {org.categories && org.categories.slice(0, 2).map((cat, idx) => (
                  <View key={idx} style={[
                    styles.tagChip,
                    settings.highContrast && styles.highContrastTag
                  ]}>
                    <SimplifiedText style={[
                      styles.tagText,
                      settings.highContrast && styles.highContrastTagText,
                      settings.largeText && { fontSize: 11 }
                    ]}>
                      {cat}
                    </SimplifiedText>
                  </View>
                ))}
              </View>
              
              {/* Bouton En savoir plus */}
              <View style={styles.moreInfoBtnContainer}>
                <Text 
                  style={[
                    styles.moreInfoText,
                    { color: getCategoryColor(org) },
                    settings.highContrast && styles.highContrastText
                  ]}
                >
                  En savoir plus →
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Fonction pour obtenir la couleur de fond de l'en-tête basée sur la catégorie principale
  const getCategoryHeaderColor = (org) => {
    // Utiliser la couleur pré-calculée si disponible
    if (org.headerColor) return org.headerColor;
    
    return AssociationsCacheService.getCategoryHeaderColor(org.mainCategory || getMainCategory(org));
  };
  
  // Fonction pour obtenir la catégorie principale d'une association
  const getMainCategory = (org) => {
    // Si la catégorie principale est déjà calculée, la retourner
    if (org.mainCategory) return org.mainCategory;
    
    return AssociationsCacheService.getMainCategoryForAssociation(org);
  };
  
  // Fonction pour obtenir la couleur de l'icône basée sur la catégorie principale
  const getCategoryColor = (org) => {
    // Utiliser la couleur pré-calculée si disponible
    if (typeof org === 'string') {
      // Si c'est une chaîne de caractères (une catégorie), utiliser directement le service
      return AssociationsCacheService.getCategoryColor(org);
    }
    
    if (org.mainColor) return org.mainColor;
    
    return AssociationsCacheService.getCategoryColor(org.mainCategory || getMainCategory(org));
  };

  // Fonction pour naviguer vers l'écran d'accessibilité
  const navigateToAccessibility = () => {
    navigation.navigate('AccessibilityScreen');
  };

  // Fonction pour naviguer vers l'écran de profil ou de connexion
  const navigateToProfileOrLogin = () => {
    if (currentUser) {
      navigation.navigate('ProfileScreen');
    } else {
      navigation.navigate('LoginScreen');
    }
  };

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
  
  // Gérer la navigation vers les favoris
  const handleFavoritesNavigation = () => {
    if (settings.textToSpeech) {
      SpeechService.speak("Favoris");
    }
    
    if (!currentUser) {
      // Afficher le modal de connexion si l'utilisateur n'est pas connecté
      setShowLoginModal(true);
    } else {
      // Sinon, naviguer vers l'écran des favoris
      navigation.navigate('FavoritesScreen');
    }
  };
  
  // Modal "Pourquoi créer un compte"
  const renderLoginModal = () => (
    <Modal
      animationType={settings.reducedMotion ? "none" : "fade"}
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
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Fond animé avec bulles - masquées en mode contraste élevé */}
      {!settings.highContrast && !settings.reducedMotion && (
        <View style={[StyleSheet.absoluteFill, styles.backgroundContainer]}>
          {bubbles.map((anim, index) => {
            const translateX = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, (index % 2 === 0 ? 30 : -30), 0],
            });
            const translateY = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, (index % 3 === 0 ? -50 : 50), 0],
            });
            const scale = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.1, 1],
            });
            const colors = ['#fde2e4', '#cfe0fc', '#e2f0cb', '#ffd6e0', '#d0f4de', '#f0e4fc'];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: colors[index % colors.length],
                    top: (index * 120) % height,
                    left: (index % 2 === 0 ? 20 : width - 180),
                    transform: [{ translateX }, { translateY }, { scale }],
                    opacity: 0.5,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Contenu principal */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Écran d'accueil de l'application DonAcces"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.accessibilityButton,
              settings.highContrast && styles.highContrastButton
            ]}
            onPress={navigateToAccessibility}
            accessible={true}
            accessibilityLabel="Paramètres d'accessibilité"
            accessibilityRole="button"
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={settings.highContrast ? '#000' : '#333'}
            />
          </TouchableOpacity>
          
          <View style={styles.headerLogoContainer}>
            <Image 
              source={require('../assets/DuduLogoTypo.png')}
              style={[
                styles.headerLogo,
                settings.highContrast && styles.highContrastHeaderLogo,
                settings.largeText && styles.largeHeaderLogo
              ]}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel="Logo DuDu"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.profileButton,
              settings.highContrast && styles.highContrastButton
            ]}
            onPress={navigateToProfileOrLogin}
            accessible={true}
            accessibilityLabel={currentUser ? "Accéder à mon profil" : "Se connecter"}
            accessibilityRole="button"
          >
            <Image
              source={userAvatar ? userAvatar : require('../assets/dudu/dudu_docteur.png')}
              style={[
                styles.profileDuduIcon,
                !currentUser && styles.profileDuduIconDisabled
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Message de bienvenue */}
        <View style={styles.welcomeSection}>
          <SimplifiedText style={[
            styles.welcomeTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Bonjour ! 👋
          </SimplifiedText>
          <SimplifiedText style={[
            styles.welcomeText,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}>
            Que souhaitez-vous faire aujourd'hui ?
          </SimplifiedText>
        </View>

        {/* Boutons d'action rapide */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              settings.highContrast && styles.highContrastItem
            ]}
            onPress={() => {
              if (settings.textToSpeech) {
                SpeechService.speak("Découvrir");
              }
              navigation.navigate('AssociationsScreen');
            }}
            accessible={true}
            accessibilityLabel="Découvrir les associations"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonIcon}>🔍</Text>
            <SimplifiedText style={[
              styles.actionButtonText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              Découvrir
            </SimplifiedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              settings.highContrast && styles.highContrastItem
            ]}
            onPress={handleFavoritesNavigation}
            accessible={true}
            accessibilityLabel="Associations favorites"
            accessibilityRole="button"
          >
            <Image 
              source={require('../assets/dudu/dudu_icone_coeur_rougit.png')} 
              style={styles.actionButtonDudu} 
              resizeMode="contain"
            />
            <SimplifiedText style={[
              styles.actionButtonText,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeTextDescription
            ]}>
              Favoris
            </SimplifiedText>
          </TouchableOpacity>
        </View>

        {/* Section des associations */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <SimplifiedText style={[
              styles.sectionTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              Associations à découvrir
            </SimplifiedText>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AssociationsScreen')}
              accessible={true}
              accessibilityLabel="Voir toutes les associations"
              accessibilityRole="button"
            >
              <SimplifiedText style={[
                styles.seeAllText,
                settings.highContrast && styles.highContrastText,
                settings.largeText && styles.largeTextDescription
              ]}>
                Voir tout
              </SimplifiedText>
            </TouchableOpacity>
          </View>
          
          {/* Onglets des catégories */}
          {renderCategoryTabs()}
          
          {/* Liste des associations */}
          {renderOrganizations()}
        </View>

        <View style={styles.footer}>
          {/* Les boutons d'accessibilité et admin ont été supprimés */}
        </View>
      </ScrollView>

      {/* Modal de connexion */}
      {renderLoginModal()}
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
  scrollView: {
    flex: 1,
    marginBottom: 0,
  },
  contentContainer: {
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 0,
    height: 60,
    position: 'relative',
  },
  headerLogoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
    overflow: 'visible',
  },
  headerLogo: {
    width: 360,
    height: 130,
  },
  highContrastHeaderLogo: {
    tintColor: '#ffffff',
  },
  largeHeaderLogo: {
    width: 360,
    height: 130,
  },
  accessibilityButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDuduIcon: {
    width: 28,
    height: 28,
  },
  profileDuduIconDisabled: {
    opacity: 0.5,
    tintColor: '#999',
  },
  highContrastButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  highContrastText: {
    color: '#000',
  },
  largeTitle: {
    fontSize: 26,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    width: width / 2.5,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionButtonDudu: {
    width: 45,
    height: 45,
    marginBottom: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#5e48e8',
    fontWeight: '500',
  },
  carouselContainer: {
    paddingRight: 20,
    paddingBottom: 8,
  },
  orgCardHorizontal: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginRight: 15,
    marginBottom: 5,
    marginTop: 5,
    borderWidth: 0,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    paddingVertical: 16,
    width: '100%',
    minHeight: 76,
  },
  highContrastHeader: {
    backgroundColor: '#333333',
  },
  orgIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  orgIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orgContent: {
    padding: 16,
    paddingTop: 14,
    backgroundColor: '#ffffff',
  },
  orgTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  orgTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flexWrap: 'wrap',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  tagsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingRight: 10,
  },
  tagChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  highContrastTag: {
    backgroundColor: '#444444',
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  orgDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 19,
  },
  moreInfoBtnContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  moreInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(94, 72, 232, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(94, 72, 232, 0.3)',
  },
  highContrastWebsiteContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  },
  websiteIcon: {
    fontSize: 14,
    color: '#5e48e8',
    marginLeft: 6,
  },
  websiteText: {
    fontSize: 12,
    color: '#5e48e8',
    fontWeight: '600',
  },
  accessibilityBanner: {
    marginHorizontal: 20,
    backgroundColor: '#e5e0fa',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  accessibilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  accessibilityDescription: {
    fontSize: 14,
    color: '#555',
  },
  backgroundContainer: {
    zIndex: -1,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    width: 250,
    height: 250, 
    borderRadius: 125,
    zIndex: -1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingBottom: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  highContrastBottomNav: {
    backgroundColor: '#333333',
    borderTopColor: '#FFFFFF',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  navButtonActive: {
    borderRadius: 20,
    backgroundColor: '#f2f0ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  highContrastNavButtonActive: {
    backgroundColor: '#666666',
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  navText: {
    fontSize: 12,
    color: '#888',
  },
  navTextActive: {
    color: '#5e48e8',
    fontWeight: '600',
  },
  highContrastItem: {
    backgroundColor: '#333333',
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  highContrastIconContainer: {
    backgroundColor: '#666666',
  },
  highContrastBanner: {
    backgroundColor: '#444444',
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  categoryTabsContainer: {
    paddingBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
  },
  categoryTabActive: {
    backgroundColor: '#e5e0fa',
  },
  highContrastCategoryTab: {
    backgroundColor: '#333333',
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  highContrastCategoryTabActive: {
    backgroundColor: '#666666',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  orgCardGrid: {
    width: width * 0.45,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
    borderColor: '#f0f0f0',
    borderWidth: 1,
  },
  allOrgsContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  allOrgsHeader: {
    marginVertical: 15,
    paddingHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allOrgsHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  allOrgsListContainer: {
    paddingBottom: 30,
  },
  orgCardFull: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 5,
    marginBottom: 12,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  orgCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
    paddingVertical: 16,
    width: '100%',
    minHeight: 76,
  },
  orgCardTitleContainer: {
    flex: 1,
  },
  orgCardContent: {
    padding: 16,
    paddingTop: 8,
  },
  orgDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#e5e0fa',
    borderRadius: 15,
    marginLeft: 10,
  },
  searchButtonIcon: {
    fontSize: 20,
    color: '#5e48e8',
    marginRight: 5,
  },
  searchButtonText: {
    fontSize: 14,
    color: '#5e48e8',
    fontWeight: '500',
  },
  seeAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  highContrastSeeAllButton: {
    backgroundColor: '#666666',
  },
  loadingContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 10,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  footerButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  highContrastFooterButton: {
    backgroundColor: '#333333',
    borderColor: '#FFFFFF',
    borderWidth: 1,
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
});