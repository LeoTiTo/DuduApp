import React, { createContext, useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import AccessibilityScreen from './screens/AccessibilityScreen';
import AssociationsScreen from './screens/AssociationsScreen';
import AssociationDetailScreen from './screens/AssociationDetailScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import ReadingGuide from './components/ReadingGuide';
import SpeechService from './services/SpeechService';
import DonationSingleScreen from './screens/DonationSingleScreen';
import DonationRecurrentScreen from './screens/DonationRecurrentScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import BottomTabBar from './components/BottomTabBar';
import AdminLoginScreen from './screens/admin/AdminLoginScreen';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import CustomSplashScreen from './components/SplashScreen';

// Masquer immédiatement le splash screen natif pour afficher directement notre animation
SplashScreen.hideAsync().catch(console.warn);

const Stack = createNativeStackNavigator();

// Conteneur de navigation personnalisé avec barre de navigation fixe
const MainNavigationContainer = ({ children, navigation, currentRoute }) => {
  const { settings } = useAccessibility();
  
  // Détecter les routes principales qui utilisent la barre de navigation
  const isMainRoute = ['HomeScreen', 'AssociationsScreen', 'FavoritesScreen', 'AccessibilityScreen'].includes(currentRoute);
  
  return (
    <View style={{ flex: 1 }}>
      {children}
      {isMainRoute && <BottomTabBar navigation={navigation} currentRoute={currentRoute} />}
    </View>
  );
};

// Composant pour le bouton de synthèse vocale
const SpeechButton = ({ navigation }) => {
  const { settings } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Ne montrer le bouton que si la synthèse vocale est activée
  if (!settings.textToSpeech) return null;
  
  return (
    <View style={styles.speechButtonContainer}>
      {isExpanded && (
        <View style={styles.speechOptions}>
          <TouchableOpacity 
            style={[styles.speechOption, settings.highContrast && styles.highContrastOption]}
            onPress={() => {
              SpeechService.speakCurrentScreen();
              setIsExpanded(false);
            }}
            accessible={true}
            accessibilityLabel="Lire la page"
            accessibilityRole="button"
          >
            <Ionicons 
              name="book-outline" 
              size={22} 
              color={settings.highContrast ? '#000' : '#fff'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.speechOption, settings.highContrast && styles.highContrastOption]}
            onPress={() => {
              SpeechService.toggleListening();
              setIsExpanded(false);
            }}
            accessible={true}
            accessibilityLabel={settings.voiceCommands ? "Désactiver les commandes vocales" : "Activer les commandes vocales"}
            accessibilityRole="button"
          >
            <Ionicons 
              name={settings.voiceCommands ? "mic" : "mic-off-outline"} 
              size={22} 
              color={settings.highContrast ? '#000' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity 
        style={[
          styles.speechMainButton,
          settings.highContrast && styles.highContrastMainButton
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        accessible={true}
        accessibilityLabel="Options de synthèse vocale"
        accessibilityRole="button"
      >
        <Ionicons 
          name="volume-high" 
          size={24} 
          color={settings.highContrast ? '#000' : '#fff'} 
        />
      </TouchableOpacity>
    </View>
  );
};

// Wrapper pour gérer les fonctionnalités d'accessibilité
const AccessibilityWrapper = ({ children, navigation, currentRoute }) => {
  const { settings } = useAccessibility();
  
  useEffect(() => {
    if (navigation) {
      SpeechService.setNavigation(navigation);
    }
  }, [navigation]);
  
  return (
    <MainNavigationContainer navigation={navigation} currentRoute={currentRoute}>
      <View style={{ flex: 1 }}>
        {children}
        {settings.readingGuidance && <ReadingGuide enabled={settings.readingGuidance} />}
        <SpeechButton navigation={navigation} />
      </View>
    </MainNavigationContainer>
  );
};

// Composant AppContent qui utilise le contexte d'accessibilité
const AppContent = () => {
  const { settings } = useAccessibility();
  const [showOnboarding, setShowOnboarding] = useState(null);
  const [currentRoute, setCurrentRoute] = useState("HomeScreen");
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simuler un temps de chargement pour permettre à l'animation de se jouer
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vérifier si l'utilisateur a déjà vu l'onboarding
        const onboardingValue = await AsyncStorage.getItem('onboardingSeen');
        setShowOnboarding(onboardingValue !== 'true');
        
        // Marquer l'application comme prête
        setAppIsReady(true);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  const onAnimationFinish = useCallback(async () => {
    setAnimationFinished(true);
    await SplashScreen.hideAsync();
  }, []);

  if (!appIsReady || !animationFinished) {
    return <CustomSplashScreen onAnimationFinish={onAnimationFinish} />;
  }

  if (showOnboarding === null) return null;

  // Configuration des transitions en fonction du paramètre reducedMotion
  const getScreenOptions = () => {
    // Si reducedMotion est activé, utiliser des transitions minimales
    if (settings.reducedMotion) {
      return {
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
        animation: 'fade',
        animationDuration: 150,
      };
    }
    
    // Sinon, utiliser des transitions élégantes avec fondu
    return {
      headerShown: false,
      cardStyle: { backgroundColor: 'transparent' },
      presentation: 'transparentModal',
      detachPreviousScreen: false,
      animation: 'fade',
      animationEnabled: true,
      cardStyleInterpolator: ({ current, closing }) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.97, 1],
                }),
              },
            ],
            opacity: current.progress.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0, 0.7, 1],
            }),
            backgroundColor: 'white', // Couleur fixe pour éviter la transparence
          },
          overlayStyle: {
            opacity: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
            backgroundColor: 'transparent', // Overlay transparent
          },
        };
      },
      transitionSpec: {
        open: {
          animation: 'timing',
          config: {
            duration: 500,
            useNativeDriver: true,
          },
        },
        close: {
          animation: 'timing',
          config: {
            duration: 400,
            useNativeDriver: true,
          },
        },
      },
    };
  };

  return (
    <NavigationContainer
      theme={{
        colors: {
          background: 'white',
          card: 'white',
          text: '#000000',
          border: 'transparent',
          notification: '#5e48e8',
        },
        dark: false,
      }}
      onStateChange={(state) => {
        const currentRouteName = state?.routes[state.index]?.name;
        if (currentRouteName) {
          setCurrentRoute(currentRouteName);
        }
      }}
    >
      <Stack.Navigator 
        initialRouteName={showOnboarding ? "OnboardingScreen" : "HomeScreen"}
        screenOptions={getScreenOptions()}
      >
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen 
          name="HomeScreen"
          options={{ 
            cardStyle: { backgroundColor: '#FFFFFF' },
            animationEnabled: true,
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.7, 1],
                }),
              },
            }),
          }}
        >
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <HomeScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="AccessibilityScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <AccessibilityScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="AssociationsScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <AssociationsScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="AssociationDetailScreen"
          options={({ route }) => ({
            ...(settings.reducedMotion 
              ? {}
              : {
                  cardStyleInterpolator: ({ current, layouts }) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateY: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [layouts.screen.height * 0.05, 0],
                            }),
                          },
                          {
                            scale: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.97, 1],
                            }),
                          },
                        ],
                        opacity: current.progress.interpolate({
                          inputRange: [0, 0.3, 0.7, 1],
                          outputRange: [0, 0.5, 0.9, 1],
                        }),
                        borderTopLeftRadius: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [15, 0],
                        }),
                        borderTopRightRadius: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [15, 0],
                        }),
                      },
                      overlayStyle: {
                        opacity: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.5],
                        }),
                      },
                    };
                  },
                  transitionSpec: {
                    open: {
                      animation: 'timing',
                      config: {
                        duration: 600,
                        useNativeDriver: true,
                      },
                    },
                    close: {
                      animation: 'timing',
                      config: {
                        duration: 400,
                        useNativeDriver: true,
                      },
                    },
                  },
                })
          })}
        >
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <AssociationDetailScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="FavoritesScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <FavoritesScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="DonationSingle"
          options={({ route }) => ({
            ...(settings.reducedMotion 
              ? {}
              : {
                  cardStyleInterpolator: ({ current, layouts }) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateY: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [10, 0],
                            }),
                          },
                          {
                            scale: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.98, 1],
                            }),
                          },
                        ],
                        opacity: current.progress.interpolate({
                          inputRange: [0, 0.2, 0.6, 1],
                          outputRange: [0, 0.4, 0.8, 1],
                        }),
                        backgroundColor: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['rgba(255, 255, 255, 0.85)', '#FFFFFF'],
                        }),
                      },
                      overlayStyle: {
                        opacity: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.4],
                        }),
                      },
                    };
                  },
                  transitionSpec: {
                    open: {
                      animation: 'timing',
                      config: {
                        duration: 550,
                        useNativeDriver: true,
                      },
                    },
                    close: {
                      animation: 'timing',
                      config: {
                        duration: 400,
                        useNativeDriver: true,
                      },
                    },
                  },
                })
          })}
        >
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <DonationSingleScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="DonationRecurrent"
          options={({ route }) => ({
            ...(settings.reducedMotion 
              ? {}
              : {
                  cardStyleInterpolator: ({ current, layouts }) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateY: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [10, 0],
                            }),
                          },
                          {
                            scale: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.98, 1],
                            }),
                          },
                        ],
                        opacity: current.progress.interpolate({
                          inputRange: [0, 0.2, 0.6, 1],
                          outputRange: [0, 0.4, 0.8, 1],
                        }),
                        backgroundColor: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['rgba(255, 255, 255, 0.85)', '#FFFFFF'],
                        }),
                      },
                      overlayStyle: {
                        opacity: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.4],
                        }),
                      },
                    };
                  },
                  transitionSpec: {
                    open: {
                      animation: 'timing',
                      config: {
                        duration: 550,
                        useNativeDriver: true,
                      },
                    },
                    close: {
                      animation: 'timing',
                      config: {
                        duration: 400,
                        useNativeDriver: true,
                      },
                    },
                  },
                })
          })}
        >
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <DonationRecurrentScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="LoginScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <LoginScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="RegisterScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <RegisterScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="ProfileScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <ProfileScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="EditProfileScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <EditProfileScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="ResetPasswordScreen">
          {props => (
            <AccessibilityWrapper navigation={props.navigation} currentRoute={currentRoute}>
              <ResetPasswordScreen {...props} />
            </AccessibilityWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="admin/AdminLoginScreen" component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  speechButtonContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 100,
  },
  speechMainButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  highContrastMainButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  speechOptions: {
    position: 'absolute',
    bottom: 60,
    right: 5,
    flexDirection: 'column',
    alignItems: 'center',
  },
  speechOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  highContrastOption: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
});
