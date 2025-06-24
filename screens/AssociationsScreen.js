import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccessibleImage from '../components/AccessibleImage';
import SimplifiedText from '../components/SimplifiedText';
import SpeechService from '../services/SpeechService';
import { associationsData } from '../data/AssociationsData';
import AssociationsCacheService from '../services/AssociationsCacheService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// Stocker les associations déjà chargées pour éviter des rechargements inutiles
// Cette variable est remplacée par le service de cache

export default function AssociationsScreen({ navigation }) {
  const { settings } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState('');
  // État pour la catégorie sélectionnée
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [isLoading, setIsLoading] = useState(true);
  const [associations, setAssociations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);
  
  // Créer les bulles animées pour l'arrière-plan
  const bubbles = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;
  
  // Animer les bulles en arrière-plan
  useEffect(() => {
    if (!settings.reducedMotion && !settings.highContrast) {
      bubbles.forEach((anim, index) => {
        // Animation plus lente pour un effet plus doux
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 18000 + index * 2000, // Beaucoup plus lent (18-42 secondes au lieu de 8-20)
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Courbe d'animation plus douce
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
  
  // Fonction pour charger les associations
  const loadAssociations = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const data = await AssociationsCacheService.getAssociations(forceRefresh);
      if (isMounted.current) {
        setAssociations(data);
        setIsLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des associations:", error);
      if (isMounted.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);
  
  // Fonction pour rafraîchir les données
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAssociations(true);
  }, [loadAssociations]);
  
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

  // Effets pour la synthèse vocale
  useEffect(() => {
    if (settings.textToSpeech) {
      SpeechService.speakCurrentScreen(
        "Associations",
        "Liste des associations partenaires disponibles pour vos dons."
      );
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech]);

  // Filtrer les associations basées sur la recherche et la catégorie sélectionnée (avec useMemo pour la mise en cache)
  const filteredAssociations = useMemo(() => {
    return AssociationsCacheService.filterAssociations(associations, searchQuery, selectedCategory);
  }, [associations, searchQuery, selectedCategory]);
  
  // Obtenir la couleur associée à une catégorie
  const getCategoryColor = (category) => {
    return AssociationsCacheService.getCategoryColor(category);
  };
  
  // Fonction pour obtenir la couleur de fond de l'onglet basée sur la catégorie
  const getCategoryTabBackground = (categoryName) => {
    if (settings.highContrast) return undefined; // Pas de coloration en mode contraste élevé

    // Pour la catégorie "Toutes", utiliser la couleur par défaut
    if (categoryName === "Toutes") return undefined;
    
    // Obtenir la couleur de base de la catégorie
    const baseColor = getCategoryColor(categoryName);
    
    // Créer une version légère de la couleur (25% d'opacité)
    return `${baseColor}40`; // 40 en hexadécimal = 25% d'opacité
  };
  
  // Rendu des catégories en onglets
  const renderCategoryTabs = () => {
    const categoryOrder = [
      'Populaires',
      'Handicap',
      'Maladies chroniques',
      'Cancer',
      'Santé mentale',
      'Maladies rares',
      'Addictions',
      'Santé publique',
      'Accompagnement',
      'Maladies inflammatoires',
      'Défense des droits',
      'Maladies spécifiques',
      'Associations de patients',
      'Soutien et entraide',
      'Autres organisations',
      'Recherche et soutien'
    ];
    
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
        
        {categoryOrder.map((category) => (
          associationsData[category] && associationsData[category].length > 0 && (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                { backgroundColor: getCategoryTabBackground(category) || '#f0f0f0' },
                selectedCategory === category && styles.categoryTabActive,
                selectedCategory === category && { backgroundColor: `${getCategoryColor(category)}35` },
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
                selectedCategory === category && { color: getCategoryColor(category) },
                settings.highContrast && styles.highContrastText,
                settings.largeText && { fontSize: 16 }
              ]}>
                {category}
              </SimplifiedText>
            </TouchableOpacity>
          )
        ))}
      </ScrollView>
    );
  };

  // Obtenir la couleur de fond pour l'en-tête d'une association
  const getCategoryHeaderColor = (category) => {
    return AssociationsCacheService.getCategoryHeaderColor(category);
  };
  
  // Obtenir la catégorie principale d'une association
  const getMainCategoryForAssociation = (item) => {
    // Si la catégorie principale est déjà calculée, la retourner
    if (item.mainCategory) return item.mainCategory;
    
    return AssociationsCacheService.getMainCategoryForAssociation(item);
  };
  
  // Obtenir la couleur principale pour une association
  const getMainColorForAssociation = (item) => {
    // Si la couleur principale est déjà calculée, la retourner
    if (item.mainColor) return item.mainColor;
    
    const mainCategory = item.mainCategory || getMainCategoryForAssociation(item);
    return mainCategory ? getCategoryColor(mainCategory) : '#7F8C8D'; // Couleur par défaut si pas de catégorie
  };
  
  // Obtenir la couleur d'en-tête pour une association
  const getHeaderColorForAssociation = (item) => {
    // Si la couleur d'en-tête est déjà calculée, la retourner
    if (item.headerColor) return item.headerColor;
    
    const mainCategory = item.mainCategory || getMainCategoryForAssociation(item);
    return mainCategory ? getCategoryHeaderColor(mainCategory) : 'rgba(120, 120, 120, 0.15)'; // Couleur par défaut
  };

  // Affichage d'une association
  const AssociationCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.associationCard,
        settings.highContrast && styles.highContrastItem
      ]}
      onPress={() => {
        if (settings.textToSpeech) {
          SpeechService.speak(`Navigation vers l'association ${item.name}`);
        }
        navigation.navigate('AssociationDetailScreen', { association: item });
      }}
      accessible={true}
      accessibilityLabel={`${item.name}. ${item.description}`}
      accessibilityRole="button"
      accessibilityHint={`Voir les détails de l'association ${item.name}`}
    >
      {/* En-tête coloré avec logo et nom */}
      <View style={[
        styles.orgCardHeader,
        { backgroundColor: getHeaderColorForAssociation(item) },
        settings.highContrast && styles.highContrastHeader
      ]}>
        <View style={[
          styles.orgIcon, 
          settings.highContrast && styles.highContrastIconContainer
        ]}>
          {item.logoPath ? (
            <Image 
              source={item.logoPath}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
          <Text style={[
            styles.orgIconText,
            settings.highContrast && styles.highContrastText
          ]}>
            {item.logoPlaceholder || item.name.charAt(0)}
          </Text>
          )}
      </View>
        <View style={styles.orgNameContainer}>
        <SimplifiedText 
          style={[
              styles.orgName,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeText
          ]}
            numberOfLines={2}
        >
          {item.name}
        </SimplifiedText>
        </View>
      </View>

      {/* Contenu avec description, tags et bouton */}
      <View style={styles.orgCardContent}>
        <SimplifiedText 
          style={[
            styles.orgDescription,
            settings.highContrast && styles.highContrastDescription,
            settings.largeText && styles.largeTextDescription
          ]}
          numberOfLines={2}
        >
          {item.description}
        </SimplifiedText>
        
        {/* Tags de catégories */}
        <View style={styles.categoriesContainer}>
          {item.categories && item.categories.map((category, catIndex) => (
            <View key={`${catIndex}`} style={[
                styles.categoryTag,
                { backgroundColor: settings.highContrast ? '#000000' : '#f5f5f5' },
              settings.highContrast && styles.highContrastCategoryTag
            ]}>
              <SimplifiedText style={[
                styles.categoryTagText,
                { color: settings.highContrast ? '#FFFFFF' : '#666' },
                  settings.highContrast && styles.highContrastText,
                settings.largeText && { fontSize: 12 }
              ]}>
                {category}
              </SimplifiedText>
            </View>
          ))}
        </View>
        
        {/* Bouton En savoir plus */}
        <View style={styles.moreInfoBtnContainer}>
          <Text 
            style={[
              styles.moreInfoText,
              { color: getMainColorForAssociation(item) },
              settings.highContrast && styles.highContrastText
            ]}
          >
            En savoir plus →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[
      styles.container,
      settings.highContrast && styles.highContrastContainer
    ]}>
      {/* Fond animé avec bulles - masquées en mode contraste élevé */}
      {!settings.highContrast && (
        <View style={StyleSheet.absoluteFillObject}>
          {bubbles.map((anim, index) => {
            // Trajectoire inspirée par le mouvement de recherche - exploration
            const translateX = anim.interpolate({
              inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
              outputRange: [
                0, 
                (index % 4 === 0) ? 40 : -40, 
                (index % 4 === 1) ? -20 : 20, 
                (index % 4 === 2) ? 30 : -30,
                (index % 4 === 3) ? -50 : 50,
                0
              ],
            });
            
            // Animation verticale avec plus de variations pour suggérer l'exploration
            const translateY = anim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [
                0, 
                (index % 3 === 0) ? -80 : 40, 
                (index % 3 === 1) ? 60 : -60,
                (index % 3 === 2) ? -30 : 80,
                0
              ],
            });
            
            // Variation de taille pour un effet de "zoom" de recherche
            const scale = anim.interpolate({
              inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
              outputRange: [
                1, 
                index % 3 === 0 ? 1.2 : 0.9, 
                index % 3 === 1 ? 0.8 : 1.1,
                index % 3 === 2 ? 1.15 : 0.85,
                index % 3 === 0 ? 0.9 : 1.05,
                1
              ],
            });
            
            // Rotation légère pour certaines bulles (loupe qui tourne?)
            const rotate = anim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', index % 2 === 0 ? '25deg' : '-25deg'],
            });
            
            // Palette de couleurs évoquant la recherche et la diversité des associations
            // Tons de bleus et violets pour l'exploration, avec touches de couleurs vives pour la diversité
            const colors = [
              '#e6f2ff', '#c6e2ff', '#b3d9ff', '#80c1ff', '#4da6ff', 
              '#ecf2f9', '#d8e6f3', '#aed9e0', '#ffd3b6', '#c7ceea',
              '#fff1e6', '#ff9b71', '#d7e3fc', '#e3d5ca', '#fae0e4'
            ];

            // Positionnement plus structuré, mimant une grille de recherche
            return (
              <Animated.View
                key={index}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: colors[index % colors.length],
                    // Création d'une grille de bulles plus organisée
                    top: ((index % 4) * (height / 5)) - 50,
                    left: ((index % 3) * (width / 3)) - 50,
                    width: 80 + (index % 5) * 30, // Tailles diverses mais plus petites
                    height: 80 + (index % 5) * 30,
                    borderRadius: 100,
                    transform: [
                      { translateX }, 
                      { translateY }, 
                      { scale },
                      { rotate }
                    ],
                    opacity: 0.06 + (index % 4) * 0.01, // Opacité très réduite pour moins distraire
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
        <SimplifiedText 
          style={[
            styles.headerTitle,
            settings.highContrast && styles.highContrastText,
            settings.largeText && styles.largeHeaderTitle
          ]}
        >
          Associations
        </SimplifiedText>
        <View style={styles.placeholderView} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={[
            styles.searchInput,
            settings.highContrast && styles.highContrastInput,
            settings.largeText && styles.largeText
          ]}
          placeholder="Rechercher..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessible={true}
          accessibilityLabel="Rechercher des associations"
          accessibilityHint="Entrez un mot-clé pour filtrer les associations"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
            accessible={true}
            accessibilityLabel="Effacer la recherche"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !refreshing ? (
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
      ) : (
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
          accessible={true}
          accessibilityLabel="Liste des associations partenaires"
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[settings.highContrast ? "#000000" : "#4B7BEC"]}
              tintColor={settings.highContrast ? "#000000" : "#4B7BEC"}
            />
          }
        >
          <SimplifiedText 
            style={[
              styles.sectionTitle,
              settings.highContrast && styles.highContrastText,
              settings.largeText && styles.largeSectionTitle
            ]}
          >
            France Assos Santé
          </SimplifiedText>
          <SimplifiedText 
            style={[
              styles.sectionSubtitle,
              settings.highContrast && styles.highContrastDescription,
              settings.largeText && styles.largeText
            ]}
          >
            Choisissez une association à soutenir
          </SimplifiedText>

          {/* Onglets des catégories */}
          {renderCategoryTabs()}

          <View style={styles.associationsContainer}>
            {filteredAssociations.map(item => (
              <AssociationCard key={item.id} item={item} />
            ))}
          </View>
        </ScrollView>
      )}
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
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  },
  largeHeaderTitle: {
    fontSize: 24,
  },
  largeSectionTitle: {
    fontSize: 26,
  },
  placeholderView: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  highContrastInput: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    color: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  associationsContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  associationCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  highContrastItem: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
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
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  orgIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orgNameContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flexWrap: 'wrap',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  orgCardContent: {
    padding: 16,
    paddingTop: 14,
    backgroundColor: '#ffffff',
  },
  orgDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 19,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  highContrastCategoryTag: {
    backgroundColor: '#000',
  },
  categoryTagText: {
    fontSize: 12,
  },
  moreInfoBtnContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  moreInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categorySection: {
    // Espace
  },
  categoryTitle: {
    // Style pour le titre de catégorie
  },
  largeCategoryTitle: {
    fontSize: 26,
  },
  categoryTabsContainer: {
    paddingBottom: 12,
    marginBottom: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  highContrastIconContainer: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
}); 