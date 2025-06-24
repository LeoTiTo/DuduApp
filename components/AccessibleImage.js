import React from 'react';
import { Image, TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import SpeechService from '../services/SpeechService';
import { useAccessibility } from '../context/AccessibilityContext';

const AccessibleImage = ({
  source,
  style,
  alt,
  onPress,
  showAltText = false,
  ...otherProps
}) => {
  const { settings } = useAccessibility();

  const handleImagePress = () => {
    // Si la synthèse vocale est activée et qu'il y a une description
    if (settings.textToSpeech && alt && settings.altTextEnabled) {
      SpeechService.speakImageDescription(alt);
    }

    // Si une fonction onPress est fournie, l'appeler
    if (onPress) {
      onPress();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handleImagePress}
        accessible={true}
        accessibilityLabel={alt || 'Image sans description'}
        accessibilityRole="image"
        accessibilityHint={settings.textToSpeech && settings.altTextEnabled ? "Tapez pour entendre la description de l'image" : ""}
      >
        <Image
          source={source}
          style={style}
          {...otherProps}
        />
      </TouchableOpacity>
      
      {/* Afficher la description sous l'image si nécessaire */}
      {(showAltText || settings.altTextEnabled) && alt && (
        <Text style={[
          styles.altText,
          settings.highContrast && styles.highContrastText,
          settings.largeText && styles.largeText
        ]}>
          {alt}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  altText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 10,
  },
  largeText: {
    fontSize: 16,
  },
  highContrastText: {
    color: '#FFFFFF',
  },
});

export default AccessibleImage; 