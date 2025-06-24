  <img align="right" src="https://visitor-badge.laobi.icu/badge?page_id=LeoTiTo.DuduApp" />

# DuduApp

Application mobile de dons accessibles à tous, développée avec React Native et Expo, intégrant des fonctionnalités avancées d'accessibilité et une gestion cloud via Firebase.

## 🚀 Fonctionnalités principales
- Découverte et soutien d'associations via des dons (ponctuels ou récurrents)
- Accessibilité avancée : synthèse vocale, commandes vocales, contraste élevé, simplification du langage, etc.
- Authentification et gestion de profils utilisateurs
- Interface moderne, animée (Lottie), responsive et inclusive
- Administration des associations via scripts Node.js et Firebase Admin SDK

## 🛠️ Technologies utilisées
- **React Native** & **Expo**
- **Firebase** (Auth, Firestore, Storage)
- **Node.js** (scripts d'administration)
- **Lottie** (animations)
- **React Navigation**
- **Context API** (gestion d'état)

## 🔒 Sécurité & bonnes pratiques
- **Aucune clé ou secret sensible n'est versionné** :
  - Les fichiers `firebase/config.js` et `config/serviceAccountKey.json` sont ignorés par git.
  - Un fichier d'exemple `firebase/config.example.js` est fourni.
- **Images et ressources** : uniquement libres de droits ou créations personnelles.

## ⚙️ Installation & configuration
1. **Cloner le dépôt**
   ```bash
   git clone <url-du-repo>
   cd DuduApp
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Configurer Firebase**
   - Copier le fichier d'exemple :
     ```bash
     cp firebase/config.example.js firebase/config.js
     ```
   - Renseigner vos propres identifiants Firebase dans `firebase/config.js`.
   - (Pour l'administration : placer votre clé privée dans `config/serviceAccountKey.json`, non versionné)
4. **Lancer l'application**
   ```bash
   npm start
   ```

## 👨‍💻 Scripts d'administration
- Initialiser les admins : `npm run admin:setup`
- Supprimer tous les admins : `npm run admin:remove`
- Ajouter un admin personnalisé : `npm run admin:custom`

### 📚 Documentation administration
Pour la gestion détaillée des administrateurs et des associations, consultez le fichier [README-admin.md](./README-admin.md).

## 📄 Licence
Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE).