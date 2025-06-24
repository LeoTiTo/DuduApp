import React, { useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ReadingGuide = ({ enabled, color = '#6c63ff', opacity = 0.2 }) => {
  const [position, setPosition] = useState({ y: 100 });

  // Créer un PanResponder pour détecter les mouvements
  const panResponder = React.useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Mettre à jour la position Y du guide
        setPosition({ y: gestureState.moveY });
      },
    }), []
  );

  // Ne pas rendre le composant si désactivé
  if (!enabled) return null;

  return (
    <View
      style={[
        styles.guideLine,
        {
          top: position.y - 10, // 10 = moitié de la hauteur du guide
          backgroundColor: color,
          opacity: opacity,
        },
      ]}
      {...panResponder.panHandlers}
    />
  );
};

const styles = StyleSheet.create({
  guideLine: {
    position: 'absolute',
    left: 0,
    width: width,
    height: 20,
    zIndex: 999,
  },
});

export default ReadingGuide; 