import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAccessibility } from '../context/AccessibilityContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onAnimationFinish }) => {
  const lottieRef = useRef(null);
  const { settings } = useAccessibility();

  useEffect(() => {
    if (settings.reducedMotion) {
      // Si les animations sont réduites, terminer immédiatement
      setTimeout(onAnimationFinish, 300);
    } else if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current.play();
      }, 100); // Petit délai pour s'assurer que le composant est bien monté
    }
  }, [settings.reducedMotion, onAnimationFinish]);

  // Si les animations sont réduites, afficher simplement un écran statique
  if (settings.reducedMotion) {
    return (
      <View style={styles.container}>
        <View style={styles.staticSplash} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={require('../assets/splashscreen/splashscreen.json')}
        autoPlay={true}
        loop={false}
        speed={1.0}
        resizeMode="contain"
        style={styles.animation}
        onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  animation: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  staticSplash: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  }
});

export default SplashScreen; 