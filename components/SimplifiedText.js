import React from 'react';
import { Text } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import SpeechService from '../services/SpeechService';

const SimplifiedText = ({
  children,
  style,
  simplified,
  speak = false,
  ...otherProps
}) => {
  const { settings } = useAccessibility();
  
  // Détermine le texte à afficher (original ou simplifié)
  const displayText = React.useMemo(() => {
    if (settings.languageSimplified && simplified) {
      return simplified;
    }
    
    if (settings.languageSimplified && typeof children === 'string') {
      return SpeechService.simplifyText(children);
    }
    
    // Convertir children en chaîne s'il s'agit d'un tableau
    if (Array.isArray(children)) {
      // Joindre les éléments du tableau qui sont des chaînes
      const textArray = children.filter(child => typeof child === 'string');
      return textArray.join(' ');
    }
    
    return children;
  }, [children, simplified, settings.languageSimplified]);
  
  // Parler le texte si nécessaire
  React.useEffect(() => {
    if (settings.textToSpeech && speak && typeof displayText === 'string') {
      SpeechService.speak(displayText);
    }
    
    return () => {
      if (settings.textToSpeech && speak) {
        SpeechService.stop();
      }
    };
  }, [displayText, settings.textToSpeech, speak]);
  
  // S'assurer que accessibilityLabel est une chaîne
  const accessibilityLabelText = typeof displayText === 'string' 
    ? displayText 
    : Array.isArray(displayText) 
      ? displayText.filter(item => typeof item === 'string').join(' ')
      : '';
  
  return (
    <Text 
      style={style} 
      {...otherProps}
      accessible={true}
      accessibilityLabel={accessibilityLabelText}
    >
      {displayText}
    </Text>
  );
};

export default SimplifiedText; 