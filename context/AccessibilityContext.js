import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clé de stockage pour les paramètres d'accessibilité
const STORAGE_KEY = '@accessibility_settings';

// Valeurs par défaut des paramètres d'accessibilité
const defaultSettings = {
  highContrast: false,
  reducedMotion: false,
  readingGuidance: false,
  textToSpeech: false,
  languageSimplified: false,
  altTextEnabled: false,
  voiceCommands: false,
};

// Création du contexte
const AccessibilityContext = createContext();

// Hook personnalisé pour utiliser le contexte d'accessibilité
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility doit être utilisé à l\'intérieur d\'un AccessibilityProvider');
  }
  return context;
};

// Composant Provider pour encapsuler l'application
export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  // Fonction pour charger les paramètres depuis AsyncStorage
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        
        // Suppression de fontScale si elle existe dans les paramètres stockés
        if (parsedSettings.fontScale !== undefined) {
          delete parsedSettings.fontScale;
        }
        
        // Suppression de largeText si elle existe dans les paramètres stockés
        if (parsedSettings.largeText !== undefined) {
          delete parsedSettings.largeText;
        }
        
        // Fusion avec les valeurs par défaut pour garantir que toutes les propriétés existent
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres d\'accessibilité:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour mettre à jour les paramètres
  const updateSettings = async (newSettings) => {
    try {
      // Création d'un nouvel objet de paramètres
      const updatedSettings = { ...settings, ...newSettings };
      
      // Mise à jour de l'état local
      setSettings(updatedSettings);
      
      // Sauvegarde en stockage persistant
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres d\'accessibilité:', error);
      return false;
    }
  };

  // Fonction pour réinitialiser les paramètres
  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des paramètres d\'accessibilité:', error);
      return false;
    }
  };

  return (
    <AccessibilityContext.Provider 
      value={{ 
        settings,
        isLoading,
        updateSettings,
        resetSettings,
      }}
    >
      {!isLoading && children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext; 