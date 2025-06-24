import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import SpeechService from '../services/SpeechService';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AccessibilityScreen({ navigation }) {
  const { settings, updateSettings, resetSettings } = useAccessibility();
  
  // États locaux pour contrôler l'interface utilisateur
  const [highContrast, setHighContrast] = useState(settings.highContrast);
  const [reducedMotion, setReducedMotion] = useState(settings.reducedMotion);
  const [readingGuidance, setReadingGuidance] = useState(settings.readingGuidance);
  const [textToSpeech, setTextToSpeech] = useState(settings.textToSpeech);
  const [languageSimplified, setLanguageSimplified] = useState(settings.languageSimplified);
  const [altTextEnabled, setAltTextEnabled] = useState(settings.altTextEnabled);
  const [voiceCommands, setVoiceCommands] = useState(settings.voiceCommands);

  // Créer les bulles animées pour l'arrière-plan
  const bubbles = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;

  // Animer les bulles en arrière-plan
  useEffect(() => {
    if (!settings.reducedMotion && !highContrast) {
      bubbles.forEach((anim, index) => {
        // Utiliser des durées d'animation différentes pour chaque bulle
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 15000 + index * 2000, // Plus lentes que dans FavoritesScreen
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
  }, [settings.reducedMotion, highContrast]);

  // Mise à jour des états locaux lorsque les paramètres globaux changent
  useEffect(() => {
    setHighContrast(settings.highContrast);
    setReducedMotion(settings.reducedMotion);
    setReadingGuidance(settings.readingGuidance);
    setTextToSpeech(settings.textToSpeech);
    setLanguageSimplified(settings.languageSimplified);
    setAltTextEnabled(settings.altTextEnabled);
    setVoiceCommands(settings.voiceCommands);
  }, [settings]);

  // Effet pour activer les commandes vocales quand l'option est activée
  useEffect(() => {
    SpeechService.setNavigation(navigation);
    SpeechService.setVoiceCommandsEnabled(settings.voiceCommands);
    
    // Description vocale de l'écran au chargement
    if (settings.textToSpeech) {
      SpeechService.speakCurrentScreen(
        "Accessibilité", 
        "Paramètres d'accessibilité de l'application DuDu. Vous pouvez ajuster le contraste, la taille du texte, et d'autres options pour faciliter l'utilisation."
      );
    }
    
    return () => {
      if (settings.textToSpeech) {
        SpeechService.stop();
      }
    };
  }, [settings.textToSpeech, settings.voiceCommands, navigation]);

  // Fonction pour gérer les changements d'options avec mise à jour immédiate du contexte
  const handleSettingChange = async (name, value) => {
    // Démonstration de l'option lorsqu'elle est activée
    if (name === 'textToSpeech' && value) {
      setTimeout(() => {
        SpeechService.speak("La synthèse vocale est maintenant activée. Vous pouvez entendre la description des éléments de l'écran.");
      }, 500);
    } else if (name === 'voiceCommands' && value) {
      setTimeout(() => {
        SpeechService.speak("Les commandes vocales sont maintenant activées. Vous pouvez dire 'accueil', 'associations', 'accessibilité' ou 'retour' pour naviguer.");
      }, 500);
    }
    
    // Mise à jour de l'état local
    switch (name) {
      case 'highContrast':
        setHighContrast(value);
        break;
      case 'reducedMotion':
        setReducedMotion(value);
        break;
      case 'readingGuidance':
        setReadingGuidance(value);
        break;
      case 'textToSpeech':
        setTextToSpeech(value);
        break;
      case 'languageSimplified':
        setLanguageSimplified(value);
        break;
      case 'altTextEnabled':
        setAltTextEnabled(value);
        break;
      case 'voiceCommands':
        setVoiceCommands(value);
        SpeechService.setVoiceCommandsEnabled(value);
        break;
    }
    
    // Mise à jour immédiate du contexte global
    await updateSettings({ [name]: value });
  };

  // Sauvegarde des préférences
  const saveSettings = async () => {
    try {
      // Préparation de tous les paramètres en un seul objet
      const updatedSettings = {
        highContrast,
        reducedMotion,
        readingGuidance,
        textToSpeech,
        languageSimplified,
        altTextEnabled,
        voiceCommands,
      };
      
      // Mise à jour du contexte global
      const success = await updateSettings(updatedSettings);

      // Feedback visuel et vocal du résultat
      if (success) {
        // Forcer un re-render complet pour être sûr que tout est à jour
        setTimeout(() => {
          Alert.alert(
            'Paramètres sauvegardés',
            'Vos préférences d\'accessibilité ont été enregistrées.',
            [{ text: 'OK' }]
          );
          
          if (textToSpeech) {
            SpeechService.speak("Paramètres sauvegardés avec succès.");
          }
        }, 100); // Petit délai pour permettre la mise à jour de l'interface
      } else {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de la sauvegarde des paramètres.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
      Alert.alert(
        'Erreur',
        'Une erreur inattendue est survenue lors de la sauvegarde des paramètres.',
        [{ text: 'OK' }]
      );
    }
  };

  // Réinitialisation des paramètres
  const handleResetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Êtes-vous sûr de vouloir réinitialiser tous les paramètres d\'accessibilité ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          onPress: async () => {
            const success = await resetSettings();
            if (!success) {
              Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de la réinitialisation des paramètres.',
                [{ text: 'OK' }]
              );
            } else if (settings.textToSpeech) {
              SpeechService.speak("Paramètres réinitialisés.");
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Composant pour une option d'accessibilité avec interrupteur
  const AccessibilityOption = ({ title, description, value, onValueChange, iconText }) => (
    <TouchableOpacity 
      style={styles.optionContainer}
      onPress={() => onValueChange(!value)}
      accessible={true}
      accessibilityLabel={`${title}. ${description}. ${value ? 'Activé' : 'Désactivé'}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={styles.optionIconContainer}>
        <Text style={styles.optionIcon}>{iconText}</Text>
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionTitle, highContrast && styles.highContrastText]}>
          {title}
        </Text>
        <Text style={[styles.optionDescription, highContrast && styles.highContrastDescription]}>
          {description}
        </Text>
      </View>
      <Switch
        trackColor={{ false: '#d1d1d1', true: '#bbb3e4' }}
        thumbColor={value ? '#6c63ff' : '#f4f3f4'}
        ios_backgroundColor="#d1d1d1"
        onValueChange={onValueChange}
        value={value}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[
      styles.container,
      highContrast && styles.highContrastContainer
    ]}>
      {/* Fond animé avec bulles - masquées en mode contraste élevé */}
      {!highContrast && (
        <View style={StyleSheet.absoluteFillObject}>
          {bubbles.map((anim, index) => {
            // Trajectoire en forme de vague pour certaines bulles
            const translateX = anim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [
                0, 
                (index % 3 === 0) ? 50 : -30, 
                (index % 3 === 1) ? -50 : 20, 
                (index % 3 === 2) ? 30 : -40,
                0
              ],
            });
            
            // Mouvement vertical plus lent
            const translateY = anim.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [
                0, 
                (index % 2 === 0) ? -40 : 60, 
                (index % 2 === 0) ? -20 : 30,
                0
              ],
            });
            
            // Légère variation de taille
            const scale = anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, index % 2 === 0 ? 1.15 : 0.9, 1],
            });
            
            // Palette de couleurs pour l'écran de paramètres - tons pastel plus froids et apaisants
            const colors = [
              '#d8e2dc', '#ffe5d9', '#d0f4de', '#dbcdf0', '#f2c6de', 
              '#c6def1', '#faedcb', '#c9e4de', '#dfe7fd', '#e0fbfc'
            ];

            // Positions et tailles variées mais pas chaotiques
            return (
              <Animated.View
                key={index}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: colors[index % colors.length],
                    // Répartition plus ordonnée mais variée
                    top: (index % 4 === 0) 
                      ? -50 + (index * 100) 
                      : (index % 4 === 1) 
                        ? height * 0.2 + (index * 50)
                        : (index % 4 === 2)
                          ? height * 0.5 - (index * 30)
                          : height * 0.7 + (index * 10),
                    left: (index % 3 === 0) 
                      ? -120 + (index * 30)
                      : (index % 3 === 1) 
                        ? width / 2 - 100
                        : width - 80,
                    // Bulles généralement plus grandes
                    width: 180 + (index % 3) * 60,
                    height: 180 + (index % 3) * 60,
                    borderRadius: 200,
                    transform: [
                      { translateX }, 
                      { translateY }, 
                      { scale }
                    ],
                    opacity: 0.2 + (index % 5) * 0.02, // Opacité très légère
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
          Accessibilité
        </Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        accessible={true}
        accessibilityLabel="Options d'accessibilité"
      >
        <View style={styles.sectionHeader}>
          <Text style={[
            styles.sectionTitle, 
            highContrast && styles.highContrastText
          ]}>
            Options d'affichage
          </Text>
        </View>

        <AccessibilityOption
          title="Mode contraste élevé"
          description="Améliore le contraste des couleurs pour une meilleure lisibilité"
          value={highContrast}
          onValueChange={(value) => handleSettingChange('highContrast', value)}
          iconText="🌓"
        />

        <AccessibilityOption
          title="Réduire les animations"
          description="Désactive ou réduit les animations et effets visuels"
          value={reducedMotion}
          onValueChange={(value) => handleSettingChange('reducedMotion', value)}
          iconText="⚡"
        />

        <View style={[styles.separatorContainer, highContrast && styles.highContrastSeparator]}>
          <View style={styles.separator} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[
            styles.sectionTitle, 
            highContrast && styles.highContrastText
          ]}>
            Assistance à la lecture
          </Text>
        </View>

        <AccessibilityOption
          title="Guide de lecture"
          description="Affiche un guide de lecture pour suivre plus facilement le texte"
          value={readingGuidance}
          onValueChange={(value) => handleSettingChange('readingGuidance', value)}
          iconText="📏"
        />

        <AccessibilityOption
          title="Synthèse vocale"
          description="Lit à haute voix le contenu de l'écran"
          value={textToSpeech}
          onValueChange={(value) => handleSettingChange('textToSpeech', value)}
          iconText="🔊"
        />

        <AccessibilityOption
          title="Langage simplifié"
          description="Utilise un vocabulaire plus simple et des phrases courtes"
          value={languageSimplified}
          onValueChange={(value) => handleSettingChange('languageSimplified', value)}
          iconText="📝"
        />

        <View style={[styles.separatorContainer, highContrast && styles.highContrastSeparator]}>
          <View style={styles.separator} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[
            styles.sectionTitle, 
            highContrast && styles.highContrastText
          ]}>
            Options supplémentaires
          </Text>
        </View>

        <AccessibilityOption
          title="Descriptions des images"
          description="Active les descriptions audio pour les images"
          value={altTextEnabled}
          onValueChange={(value) => handleSettingChange('altTextEnabled', value)}
          iconText="🖼️"
        />

        <AccessibilityOption
          title="Commandes vocales"
          description="Contrôlez l'application par la voix"
          value={voiceCommands}
          onValueChange={(value) => handleSettingChange('voiceCommands', value)}
          iconText="🎤"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, highContrast && styles.highContrastActionButton]}
            onPress={saveSettings}
            accessible={true}
            accessibilityLabel="Enregistrer les paramètres"
            accessibilityRole="button"
            accessibilityHint="Sauvegarde tous vos paramètres d'accessibilité"
          >
            <Text style={[
              styles.saveButtonText, 
              highContrast && styles.highContrastActionButtonText
            ]}>
              Enregistrer les paramètres
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetButton, highContrast && styles.highContrastResetButton]}
            onPress={handleResetSettings}
            accessible={true}
            accessibilityLabel="Réinitialiser les paramètres"
            accessibilityRole="button"
            accessibilityHint="Réinitialise tous les paramètres d'accessibilité aux valeurs par défaut"
          >
            <Text style={[
              styles.resetButtonText, 
              highContrast && styles.highContrastResetButtonText
            ]}>
              Réinitialiser
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.accessibilityInfoContainer}>
          <Text style={[
            styles.accessibilityInfoText, 
            highContrast && styles.highContrastText
          ]}>
            Cette application respecte les normes WCAG 2.1 et RGAA 4.1 pour garantir l'accessibilité à tous les utilisateurs.
          </Text>
        </View>
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
    backgroundColor: '#000000',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  highContrastText: {
    color: '#ffffff',
  },
  placeholderView: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  highContrastDescription: {
    color: '#cccccc',
  },
  separatorContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  highContrastSeparator: {
    backgroundColor: '#000000',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  highContrastActionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  highContrastActionButtonText: {
    color: '#000000',
  },
  resetButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  highContrastResetButton: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  resetButtonText: {
    color: '#333',
    fontSize: 16,
  },
  highContrastResetButtonText: {
    color: '#ffffff',
  },
  accessibilityInfoContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  accessibilityInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 