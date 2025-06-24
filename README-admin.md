# Guide d'administration DonAccès

Ce fichier contient les instructions pour gérer les administrateurs des associations dans l'application DonAccès.

## Prérequis

- Node.js installé sur votre machine
- Accès à la base de données Firebase du projet
- Un compte Firebase Auth créé pour chaque administrateur

## Scripts disponibles

Trois scripts sont disponibles pour gérer les administrateurs :

### 1. Initialiser les administrateurs par défaut

Ce script ajoute trois administrateurs prédéfinis dans la base de données :

```bash
node scripts/admin-setup.js
```

### 2. Supprimer tous les administrateurs

Ce script supprime tous les administrateurs de la base de données :

```bash
node scripts/admin-remove.js
```

### 3. Ajouter un administrateur personnalisé

Ce script interactif vous permet de créer un administrateur personnalisé en renseignant ses informations :

```bash
node scripts/admin-custom.js
```

Vous devrez fournir :
- L'ID Firebase Auth de l'utilisateur
- L'ID de l'association (1-10)
- Le rôle de l'administrateur
- L'email de l'administrateur

## Comment obtenir l'ID Firebase Auth d'un utilisateur

Pour obtenir l'ID Firebase Auth d'un utilisateur :

1. Connectez-vous à la [console Firebase](https://console.firebase.google.com/)
2. Allez dans "Authentication" > "Users"
3. Trouvez l'utilisateur concerné et copiez son "User UID"

## Test des fonctionnalités administrateur

Pour tester les fonctionnalités administrateur :

1. Assurez-vous qu'un administrateur est défini dans la base de données
2. Lancez l'application DonAccès
3. Accédez à la page "Admin" depuis l'écran d'accueil
4. Connectez-vous avec les identifiants de l'administrateur

## Associations disponibles

Voici la liste des associations avec leurs identifiants :

| ID | Nom de l'association |
|----|----------------------|
| 1  | FRANCE ASSOS SANTÉ   |
| 2  | AFM-TÉLÉTHON         |
| 3  | LIGUE CONTRE LE CANCER |
| 4  | AIDES                |
| 5  | FRANCE ALZHEIMER     |
| 6  | APF FRANCE HANDICAP  |
| 7  | UNAPEI               |
| 8  | VOIR ENSEMBLE        |
| 9  | FFAIMC               |
| 10 | AFSEP                | 