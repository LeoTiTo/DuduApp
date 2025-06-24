import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Bienvenue sur DuDu,\nl\'app de dons pour tous 🤝',
    description:
      'Grâce à DuDu, faire un don à une association de santé n\'a jamais été aussi simple et accessible. Avec ou sans handicap, tout le monde peut participer',
    buttonText: 'Découvrir comment ça marche',
    duduImage: require('../assets/dudu/dudu_assis_mignon_bienvenue.png'),
  },
  {
    id: '2',
    title: 'Faites un don\nen toute simplicité',
    description:
      'C\'est un jeu d\'enfant d\'utiliser DuDu, peu importe comment vous vous connectez ou versez votre don.',
    buttonText: "C'est parti !",
    duduImage: require('../assets/dudu/dudu_vole_il_est_un_ange.png'),
  },
  {
    id: '3',
    title: 'Pas besoin\nde s\'inscrire',
    description:
      'Vous pouvez faire un don en toute simplicité sans créer de compte.',
    buttonText: "C'est parti !",
    duduImage: require('../assets/dudu/dudu_clin_doeil_et_bisous.png'),
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const ref = useRef(null);

  // Crée 12 bulles animées
  const bubbles = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    bubbles.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 9000 + index * 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    });
  }, []);

  const updateCurrentSlideIndex = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  const handleNext = async () => {
    if (currentSlideIndex === slides.length - 1) {
      await AsyncStorage.setItem('onboardingSeen', 'true');
      navigation.replace('HomeScreen');
    } else {
      ref.current.scrollToIndex({ index: currentSlideIndex + 1 });
    }
  };

  const Slide = ({ item }) => (
    <View style={[styles.slide]}>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.duduSpace}>
          <Image source={item.duduImage} style={styles.duduImage} resizeMode="contain" />
        </View>
        <Text style={styles.description}>{item.description}</Text>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{item.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Fond animé */}
      <View style={StyleSheet.absoluteFill}>
        {bubbles.map((anim, index) => {
          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, (index % 2 === 0 ? 80 : -80)],
          });
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, (index % 3 === 0 ? -120 : 120)],
          });
          const colors = ['#fde2e4', '#cfe0fc', '#e2f0cb', '#ffd6e0', '#d0f4de', '#f0e4fc'];

          return (
            <Animated.View
              key={index}
              style={[
                styles.bubble,
                {
                  backgroundColor: colors[index % colors.length],
                  top: (index * 80) % height,
                  left: (index % 2 === 0 ? 40 : width - 200),
                  transform: [{ translateX }, { translateY }],
                  opacity: 0.7,
                },
              ]}
            />
          );
        })}
      </View>

      <FlatList
        ref={ref}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} />}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        style={{ width, height }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width,
    paddingHorizontal: 30,
    paddingVertical: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 20,
  },
  duduSpace: {
    width: 280,
    height: 280,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duduImage: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#e5e0fa',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  bubble: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
});
