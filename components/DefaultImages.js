import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Composant pour créer une image de substitution avec du texte et une couleur
export const PlaceholderImage = ({ text, color = '#e5e0fa', size = { width: 200, height: 150 }, textColor = '#333', fontSize = 16, association = null }) => {
  // Si l'association est fournie et a une image, l'utiliser directement
  if (association && association.imagePath) {
    return (
      <Image 
        source={association.imagePath} 
        style={[styles.image, { width: size.width, height: size.height }]}
        resizeMode="cover"
      />
    );
  }
  
  // Sinon, utiliser le placeholder avec texte
  return (
    <View style={[styles.container, { backgroundColor: color, width: size.width, height: size.height }]}>
      <Text style={[styles.text, { color: textColor, fontSize }]}>{text}</Text>
    </View>
  );
};

// Couleurs associées aux différentes catégories d'associations
export const categoryColors = {
  'Diabète': '#fde2e4',
  'Alzheimer': '#d0f4de',
  'VIH': '#ffd6a5',
  'Cancer': '#d5a6bd',
  'Handicap': '#a9def9',
  'Cœur': '#ffc8dd',
  'Poumons': '#caffbf',
  'Rein': '#9bf6ff',
  'Parkinson': '#e4c1f9',
  'Épilepsie': '#fdffb6',
  'default': '#e5e0fa'
};

// Fonction pour obtenir une image par défaut en fonction de l'ID de l'association
export const getDefaultImage = (id, name = '', associationObj = null) => {
  // Si l'objet association est fourni et a une image, l'utiliser directement
  if (associationObj && associationObj.imagePath) {
    return (
      <Image 
        source={associationObj.imagePath} 
        style={styles.defaultImage}
        resizeMode="cover"
      />
    );
  }
  
  const placeholderText = name || `Association ${id}`;
  // Utiliser la même couleur pour toutes les associations
  return <PlaceholderImage text={placeholderText} color={categoryColors['default']} />;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
  image: {
    borderRadius: 0,
    width: '100%',
    height: '100%',
  },
  defaultImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  }
});

export default PlaceholderImage; 