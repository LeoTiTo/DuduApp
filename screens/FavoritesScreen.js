import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import SpeechService from '../services/SpeechService';
import SimplifiedText from '../components/SimplifiedText';
import PlaceholderImage, { getDefaultImage } from '../components/DefaultImages';

const { width, height } = Dimensions.get('window');

export default function FavoritesScreen({ navigation }) {
  const { settings } = useAccessibility();
  const { currentUser, getUserFavorites, removeFavorite } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatingItemId, setAnimatingItemId] = useState(null);
  const [itemsToRemove, setItemsToRemove] = useState([]);
  
  // Créer les bulles animées en arrière-plan
  const bubbles = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;
  
  // Référence pour l'animation du cœur
  const favoriteAnimation = useRef(new Animated.Value(1)).current;
  // Map pour stocker l'animation de chaque carte
  const cardAnimations = useRef(new Map()).current;

  // Animer les bulles en arrière-plan
  useEffect(() => {
    if (!settings.reducedMotion) {
      bubbles.forEach((anim, index) => {
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 10000 + index * 1500,
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
  }, [settings.reducedMotion]);

  // Chargement des favoris au démarrage
  useEffect(() => {
    loadFavorites();
    
    // Configurer le service de synthèse vocale
    if (settings.textToSpeech) {
      SpeechService.speak("Écran des associations favorites");
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech]);

  // Fonction pour charger les favoris
  const loadFavorites = async () => {
    setLoading(true);
    try {
      if (!currentUser) {
        // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
        navigation.navigate('LoginScreen', { 
          redirectTo: 'FavoritesScreen',
          message: 'Veuillez vous connecter pour accéder à vos favoris'
        });
        setLoading(false);
        return;
      }
      
      const favoritesList = await getUserFavorites();
      setFavorites(favoritesList);
    } catch (error) {
      console.error("Erreur lors du chargement des favoris:", error);
      Alert.alert("Erreur", "Impossible de charger vos favoris. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une association des favoris
  const handleRemoveFavorite = async (itemId) => {
    // Animer le cœur
    setAnimatingItemId(itemId);
    
    // Créer une animation pour cette carte si elle n'existe pas encore
    if (!cardAnimations.has(itemId)) {
      cardAnimations.set(itemId, new Animated.Value(1));
    }
    const cardAnimation = cardAnimations.get(itemId);
    
    Animated.sequence([
      // Réduire légèrement la taille
      Animated.timing(favoriteAnimation, {
        toValue: 0.8,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Puis agrandir légèrement
      Animated.spring(favoriteAnimation, {
        toValue: 1.2,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      // Revenir à la taille normale
      Animated.spring(favoriteAnimation, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      })
    ]).start(async () => {
      try {
        await removeFavorite(itemId);
        
        // Ajouter l'élément à la liste d'éléments à supprimer
        setItemsToRemove(prev => [...prev, itemId]);
        
        // Animer la disparition de la carte
        Animated.timing(cardAnimation, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          // Une fois l'animation terminée, supprimer réellement de la liste
          setFavorites(favorites.filter(fav => fav.id !== itemId));
          setItemsToRemove(prev => prev.filter(id => id !== itemId));
          cardAnimations.delete(itemId);
        });
        
        // Feedback vocal
        if (settings.textToSpeech) {
          const association = favorites.find(fav => fav.id === itemId);
          if (association) {
            SpeechService.speak(`${association.name} a été retiré de vos favoris`);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du favori:", error);
        Alert.alert("Erreur", "Impossible de supprimer cette association des favoris.");
      } finally {
        setAnimatingItemId(null);
      }
    });
  };

  // Rendu d'une association favorite
  const renderFavoriteItem = ({ item }) => {
    // Vérifier si cet élément est en cours de suppression
    const isRemoving = itemsToRemove.includes(item.id);
    
    // Obtenir l'animation de la carte si elle existe, sinon créer une nouvelle
    if (!cardAnimations.has(item.id)) {
      cardAnimations.set(item.id, new Animated.Value(1));
    }
    const cardAnimation = cardAnimations.get(item.id);
    
    return (
      <Animated.View
        style={{
          opacity: cardAnimation,
          transform: [
            { scale: cardAnimation },
            { 
              translateY: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }
          ],
          marginBottom: 16
        }}
      >
        <TouchableOpacity
          style={[
            styles.associationCard,
            settings.highContrast && styles.highContrastCard
          ]}
          onPress={() => navigation.navigate('AssociationDetailScreen', { association: item })}
          accessible={true}
          accessibilityLabel={`${item.name}, touchez pour voir les détails`}
          accessibilityRole="button"
          disabled={isRemoving}
        >
          {/* Image de l'association */}
          <View style={styles.imageWrapper}>
            <PlaceholderImage 
              text={item.name} 
              size={{ width: width - 40, height: 160 }}
              association={item}
            />
          </View>
          
          {/* Informations de l'association */}
          <View style={styles.associationInfo}>
            <Text style={[
              styles.associationName,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeText
            ]}>
              {item.name}
            </Text>
            
            <SimplifiedText style={[
              styles.associationDescription,
              settings.highContrast && styles.highContrastDescription,
              settings.largeText && styles.largeText
            ]}>
              {item.description}
            </SimplifiedText>
            
            {/* Catégories */}
            <View style={styles.categoriesContainer}>
              {item.categories && item.categories.map((category, index) => (
                <View key={index} style={[
                  styles.categoryTag,
                  settings.highContrast && styles.highContrastCategoryTag
                ]}>
                  <Text style={[
                    styles.categoryText,
                    settings.highContrast && styles.highContrastText,
                    settings.largeText && { fontSize: 12 }
                  ]}>
                    {category}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Bouton de don rapide */}
            <TouchableOpacity
              style={[
                styles.donateButton,
                settings.highContrast && styles.highContrastDonateButton
              ]}
              onPress={() => navigation.navigate('DonationSingle', { 
                association: item,
                amount: 5  // Montant par défaut, pourra être modifié dans l'écran de don
              })}
              accessible={true}
              accessibilityLabel={`Faire un don rapide à ${item.name}`}
              accessibilityRole="button"
              accessibilityHint="Ouvre la page de don unique pour cette association"
              disabled={isRemoving}
            >
              <Ionicons 
                name="gift-outline" 
                size={16} 
                color={settings.highContrast ? '#fff' : '#fff'} 
                style={styles.donateButtonIcon}
              />
              <Text style={[
                styles.donateButtonText,
                settings.highContrast && styles.highContrastDonateButtonText,
                settings.largeText && { fontSize: 14 }
              ]}>
                Don rapide
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Bouton pour supprimer des favoris */}
          {animatingItemId === item.id ? (
            <Animated.View
              style={{
                transform: [{ scale: favoriteAnimation }],
                position: 'absolute',
                top: 10,
                right: 10,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  settings.highContrast && styles.highContrastFavoriteButton
                ]}
                onPress={() => handleRemoveFavorite(item.id)}
                accessible={true}
                accessibilityLabel={`Retirer ${item.name} des favoris`}
                accessibilityRole="button"
                disabled={isRemoving}
              >
                <Image 
                  source={require('../assets/dudu/dudu_icone_coeur_rougit.png')}
                  style={styles.duduFavoriteIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                settings.highContrast && styles.highContrastFavoriteButton
              ]}
              onPress={() => handleRemoveFavorite(item.id)}
              accessible={true}
              accessibilityLabel={`Retirer ${item.name} des favoris`}
              accessibilityRole="button"
              disabled={isRemoving}
            >
              <Image 
                source={require('../assets/dudu/dudu_icone_coeur_rougit.png')}
                style={styles.duduFavoriteIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Fond animé avec bulles - masquées en mode contraste élevé */}
      {!settings.highContrast && (
        <View style={StyleSheet.absoluteFill}>
          {bubbles.map((anim, index) => {
            const translateX = anim.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, (index % 2 === 0 ? 40 : -40), (index % 2 === 0 ? -20 : 20), 0],
            });
            const translateY = anim.interpolate({
              inputRange: [0, 0.4, 0.8, 1],
              outputRange: [0, (index % 3 === 0 ? -60 : 60), (index % 3 === 0 ? 30 : -30), 0],
            });
            const scale = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 1.1, 0.8],
            });
            const rotate = anim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', index % 2 === 0 ? '360deg' : '-360deg'],
            });
            // Utiliser des couleurs différentes pour les bulles des favoris
            const colors = ['#ffb3ba', '#bae1ff', '#baffc9', '#ffdfba', '#e2baff', '#ffffba'];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: colors[index % colors.length],
                    top: 100 + ((index * 150) % (height - 200)),
                    left: (index % 3 === 0) 
                      ? 30 + (index * 20) 
                      : (index % 3 === 1) 
                        ? width / 2 - 40
                        : width - 120 - (index * 10),
                    width: 80 + (index % 4) * 30,
                    height: 80 + (index % 4) * 30,
                    borderRadius: 100,
                    transform: [
                      { translateX }, 
                      { translateY }, 
                      { scale },
                      { rotate }
                    ],
                    opacity: 0.3 + (index % 3) * 0.1,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* En-tête */}
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
          Mes Favoris
        </Text>
        <View style={styles.placeholderView} />
      </View>

      {/* Contenu principal */}
      <View style={[styles.contentContainer, { paddingBottom: 80 }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color={settings.highContrast ? '#000' : '#007bff'} 
            />
            <Text style={[
              styles.loadingText,
              settings.highContrast && styles.highContrastText
            ]}>
              Chargement de vos favoris...
            </Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../assets/dudu/dudu_assis_pleure.png')} 
              style={styles.emptyStateImage}
              resizeMode="contain"
            />
            <Text style={[
              styles.emptyText,
              settings.highContrast && styles.highContrastText
            ]}>
              Vous n'avez pas encore d'associations favorites.
              Dudu est triste ! Explorez les associations pour en ajouter.
            </Text>
            <TouchableOpacity 
              style={[
                styles.exploreButton,
                settings.highContrast && styles.highContrastButton
              ]}
              onPress={() => navigation.navigate('AssociationsScreen')}
              accessible={true}
              accessibilityLabel="Explorer les associations"
              accessibilityRole="button"
            >
              <Text style={[
                styles.exploreButtonText,
                settings.highContrast && styles.highContrastButtonText
              ]}>
                Explorer
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            accessible={true}
            accessibilityLabel="Liste de vos associations favorites"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  highContrastContainer: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  highContrastButtonText: {
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholderView: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  associationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  highContrastCard: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  associationInfo: {
    padding: 16,
  },
  associationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  associationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  largeText: {
    fontSize: 18,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  highContrastCategoryTag: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  highContrastFavoriteButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 2,
  },
  donateButton: {
    backgroundColor: '#5e48e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  highContrastDonateButton: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 1,
  },
  donateButtonIcon: {
    marginRight: 6,
  },
  donateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  highContrastDonateButtonText: {
    color: '#fff',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 50,
    zIndex: -1,
  },
  duduFavoriteIcon: {
    width: 30,
    height: 30,
  },
}); 