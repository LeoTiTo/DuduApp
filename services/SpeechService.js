import * as Speech from 'expo-speech';
import { Alert } from 'react-native';

// Tenter d'importer SpeechRecognition avec gestion d'erreur
let SpeechRecognition;
try {
  SpeechRecognition = require('expo-speech-recognition');
} catch (error) {
  console.log('Module expo-speech-recognition non disponible:', error);
  // Créer un mock pour éviter les erreurs
  SpeechRecognition = {
    isAvailableAsync: async () => false,
    requestPermissionsAsync: async () => ({ status: 'denied' }),
    startListeningAsync: async () => ({}),
    stopListeningAsync: async () => {},
  };
}

// Commandes vocales reconnues
const VOICE_COMMANDS = {
  'accueil': { action: 'navigateTo', destination: 'Home' },
  'associations': { action: 'navigateTo', destination: 'Associations' },
  'accessibilité': { action: 'navigateTo', destination: 'Accessibility' },
  'paramètres': { action: 'navigateTo', destination: 'Accessibility' },
  'retour': { action: 'goBack' },
  'lire': { action: 'speakScreen' },
  'stop': { action: 'stopSpeech' },
  'arrête': { action: 'stopSpeech' },
  'pause': { action: 'stopSpeech' },
};

// Expressions courantes à simplifier
const SIMPLIFICATIONS = {
  'à destination de': 'pour',
  'en conséquence': 'donc',
  'afin de': 'pour',
  'nonobstant': 'malgré',
  'en outre': 'de plus',
  'néanmoins': 'mais',
  'le cas échéant': 'si besoin',
  'ultérieurement': 'plus tard',
  'préalablement': 'avant',
  'subséquemment': 'après',
};

class SpeechService {
  constructor() {
    this.navigation = null;
    this.isListening = false;
    this.isVoiceCommandsEnabled = false;
    this.currentScreen = '';
    this.screenContent = '';
    this.speechQueue = [];
    this.isSpeaking = false;
    this.recognition = null;
    this.hasPermission = false;

    // Vérifier la disponibilité de la reconnaissance vocale
    this.checkVoiceRecognitionAvailability();
  }

  // Initialisation
  async checkVoiceRecognitionAvailability() {
    try {
      const available = await SpeechRecognition.isAvailableAsync();
      if (available) {
        const { status } = await SpeechRecognition.requestPermissionsAsync();
        this.hasPermission = status === 'granted';
      }
    } catch (error) {
      console.log('Erreur lors de la vérification de la reconnaissance vocale:', error);
    }
  }

  // Définir la navigation
  setNavigation(navigation) {
    this.navigation = navigation;
  }

  // Activer/désactiver les commandes vocales
  setVoiceCommandsEnabled(enabled) {
    this.isVoiceCommandsEnabled = enabled;
    if (enabled && !this.isListening) {
      this.startListening();
    } else if (!enabled && this.isListening) {
      this.stopListening();
    }
  }

  // Basculer l'écoute des commandes vocales
  toggleListening() {
    if (this.isListening) {
      this.stopListening();
      this.speak("Commandes vocales désactivées");
    } else {
      this.startListening();
      this.speak("Commandes vocales activées, je vous écoute");
    }
  }

  // Démarrer l'écoute
  async startListening() {
    if (!this.hasPermission || !this.isVoiceCommandsEnabled) return;
    
    try {
      this.isListening = true;
      
      // Annuler toute instance précédente
      if (this.recognition) {
        SpeechRecognition.stopListeningAsync();
      }
      
      // Configurer la reconnaissance
      SpeechRecognition.startListeningAsync({
        locale: 'fr-FR',
        partialResults: false,
        onResults: (results) => {
          if (results && results.length > 0) {
            const command = results[0].toLowerCase().trim();
            this.processVoiceCommand(command);
          }
        },
        onError: (error) => {
          console.log('Erreur de reconnaissance vocale:', error);
          // Redémarrer l'écoute après erreur
          setTimeout(() => this.startListening(), 1000);
        }
      }).then(result => {
        this.recognition = result;
      });
    } catch (error) {
      console.log('Erreur lors du démarrage de l\'écoute:', error);
      this.isListening = false;
    }
  }

  // Arrêter l'écoute
  stopListening() {
    if (this.recognition) {
      SpeechRecognition.stopListeningAsync();
      this.recognition = null;
    }
    this.isListening = false;
  }

  // Traiter les commandes vocales
  processVoiceCommand(command) {
    console.log('Commande vocale détectée:', command);
    
    // Chercher la commande parmi les commandes reconnues
    for (const [key, value] of Object.entries(VOICE_COMMANDS)) {
      if (command.includes(key)) {
        this.executeCommand(value);
        return;
      }
    }
    
    // Si aucune commande reconnue
    this.speak("Commande non reconnue");
  }

  // Exécuter une commande
  executeCommand(command) {
    if (!command) return;
    
    switch (command.action) {
      case 'navigateTo':
        if (this.navigation && command.destination) {
          this.speak(`Navigation vers ${command.destination}`);
          this.navigation.navigate(command.destination);
        }
        break;
      case 'goBack':
        if (this.navigation) {
          this.speak('Retour à l\'écran précédent');
          this.navigation.goBack();
        }
        break;
      case 'speakScreen':
        this.speakCurrentScreen();
        break;
      case 'stopSpeech':
        this.stop();
        this.speak('Lecture arrêtée');
        break;
      default:
        console.log('Commande inconnue');
    }
  }

  // Lire le texte
  async speak(text, options = {}) {
    if (!text) return;
    
    // Simplifier le texte si nécessaire
    const simplifiedText = options.simplified ? this.simplifyText(text) : text;
    
    // Ajouter à la file d'attente
    this.speechQueue.push({
      text: simplifiedText,
      options: {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.9,
        ...options
      }
    });
    
    // Lire si pas déjà en train de parler
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  // Traiter la file d'attente de lecture
  async processQueue() {
    if (this.speechQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }
    
    this.isSpeaking = true;
    const { text, options } = this.speechQueue.shift();
    
    try {
      await Speech.speak(text, {
        ...options,
        onDone: () => {
          this.processQueue();
        },
        onError: (error) => {
          console.log('Erreur de synthèse vocale:', error);
          this.processQueue();
        }
      });
    } catch (error) {
      console.log('Erreur lors de la synthèse vocale:', error);
      this.processQueue();
    }
  }

  // Arrêter la synthèse vocale
  stop() {
    this.speechQueue = [];
    Speech.stop();
    this.isSpeaking = false;
  }

  // Simplifier le texte
  simplifyText(text) {
    let simplified = text;
    for (const [complex, simple] of Object.entries(SIMPLIFICATIONS)) {
      simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
    }
    return simplified;
  }

  // Lire la description d'une image
  speakImageDescription(alt, source) {
    if (!alt) return;
    this.speak(`Image: ${alt}`, { rate: 0.8 });
  }

  // Lire la description de l'écran actuel
  speakCurrentScreen(screenName = '', screenContent = '') {
    if (screenName) this.currentScreen = screenName;
    if (screenContent) this.screenContent = screenContent;
    
    if (this.currentScreen) {
      this.speak(`Écran ${this.currentScreen}.`, { rate: 0.8 });
      if (this.screenContent) {
        setTimeout(() => {
          this.speak(this.screenContent, { rate: 0.8, simplified: true });
        }, 1500);
      }
    }
  }
}

export default new SpeechService(); 