# 🚀 Guide de déploiement - Menil App

Ce guide vous explique comment déployer votre application gratuitement sur Railway (backend) et Netlify (frontend).

## 📋 Prérequis

- Un compte GitHub (gratuit)
- Un compte Railway (gratuit)
- Un compte Netlify (gratuit)

---

## Étape 1 : Préparer le code sur GitHub

### 1.1 Créer un repository GitHub

1. Allez sur [github.com](https://github.com)
2. Cliquez sur le bouton **"New repository"** (vert, en haut à droite)
3. Nommez votre repository : `menil-app`
4. Laissez-le **Public** (ou Private si vous préférez)
5. **Ne cochez rien** (pas de README, pas de .gitignore)
6. Cliquez sur **"Create repository"**

### 1.2 Pousser votre code sur GitHub

Ouvrez un terminal dans le dossier de votre projet et exécutez :

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Menil App"

# Lier au repository GitHub (remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/menil-app.git

# Pousser le code
git branch -M main
git push -u origin main
```

✅ **Votre code est maintenant sur GitHub !**

---

## Étape 2 : Déployer le backend sur Railway

### 2.1 Créer un compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"Start a New Project"**
3. Connectez-vous avec votre compte GitHub

### 2.2 Déployer depuis GitHub

1. Cliquez sur **"Deploy from GitHub repo"**
2. Sélectionnez votre repository `menil-app`
3. Railway va automatiquement détecter que c'est une application Python
4. Cliquez sur **"Deploy Now"**

### 2.3 Configurer le stockage persistant

⚠️ **IMPORTANT** : Par défaut, Railway ne conserve pas les fichiers. Il faut activer le stockage persistant.

1. Dans votre projet Railway, cliquez sur l'onglet **"Settings"**
2. Descendez jusqu'à **"Volumes"**
3. Cliquez sur **"Add Volume"**
4. Configurez :
   - **Mount Path** : `/app/data`
   - **Size** : 1 GB (largement suffisant)
5. Cliquez sur **"Add"**

### 2.4 Récupérer l'URL du backend

1. Dans Railway, allez dans l'onglet **"Settings"**
2. Cherchez la section **"Domains"**
3. Cliquez sur **"Generate Domain"**
4. Copiez l'URL générée (ex: `https://menil-app-production.up.railway.app`)

✅ **Votre backend est en ligne !**

---

## Étape 3 : Déployer le frontend sur Netlify

### 3.1 Créer un compte Netlify

1. Allez sur [netlify.com](https://netlify.com)
2. Cliquez sur **"Sign up"**
3. Connectez-vous avec votre compte GitHub

### 3.2 Déployer depuis GitHub

1. Cliquez sur **"Add new site"** → **"Import an existing project"**
2. Choisissez **"Deploy with GitHub"**
3. Sélectionnez votre repository `menil-app`
4. **Ne modifiez rien** dans les paramètres de build
5. Cliquez sur **"Deploy site"**

### 3.3 Configurer l'URL de l'API

1. Dans Netlify, allez dans **"Site settings"** → **"Environment variables"**
2. Cliquez sur **"Add a variable"**
3. Ajoutez :
   - **Key** : `API_URL`
   - **Value** : L'URL de votre backend Railway (ex: `https://menil-app-production.up.railway.app`)
4. Cliquez sur **"Save"**

### 3.4 Modifier le fichier config.js

1. Allez dans votre repository GitHub
2. Ouvrez le fichier `config.js`
3. Cliquez sur l'icône crayon pour éditer
4. Remplacez `NETLIFY_API_URL_PLACEHOLDER` par l'URL de votre backend Railway
5. Exemple :
   ```javascript
   window.API_URL = 'https://menil-app-production.up.railway.app';
   ```
6. Cliquez sur **"Commit changes"**

### 3.5 Redéployer Netlify

Netlify va automatiquement redéployer après votre commit GitHub (attendez 1-2 minutes).

✅ **Votre application est entièrement en ligne !**

---

## Étape 4 : Tester l'application

### 4.1 Accéder à votre application

1. Dans Netlify, copiez l'URL de votre site (ex: `https://menil-app.netlify.app`)
2. Ouvrez cette URL dans votre navigateur

### 4.2 Tester les fonctionnalités

✅ **Mode admin** :
1. Cliquez sur le bouton "Admin" en haut à droite
2. Créez une réunion de test
3. Vérifiez qu'elle apparaît dans la liste

✅ **Administrés** :
1. En mode admin, allez dans "Les administrés"
2. Vérifiez que la liste se charge
3. Ajoutez un administré de test

✅ **Réunion** :
1. Rejoignez la réunion créée
2. Sélectionnez votre nom
3. Testez la visioconférence MiroTalk

✅ **Votes** :
1. En mode admin, créez un vote
2. Votez avec votre compte
3. Vérifiez que les résultats s'affichent

---

## 🔧 Maintenance et mises à jour

### Mettre à jour le code

Chaque fois que vous modifiez le code localement :

```bash
git add .
git commit -m "Description de vos modifications"
git push
```

Railway et Netlify vont automatiquement redéployer !

### Modifier les administrés directement

Vous pouvez éditer les fichiers JSON directement sur Railway :

1. Allez sur Railway → Votre projet
2. Cliquez sur l'onglet **"Data"** (si disponible) ou utilisez l'interface admin de l'app

### Sauvegarder les données

Les données sont automatiquement sauvegardées dans le volume Railway. Pour faire un backup manuel :

1. Allez sur Railway → Votre projet → **"Deployments"**
2. Cliquez sur **"View Logs"**
3. Vous pouvez télécharger les fichiers JSON depuis l'interface

---

## 📊 Limites gratuites

### Railway (Backend)
- ✅ **500 heures/mois** (votre app consomme ~30h/mois)
- ✅ **1 GB RAM** (largement suffisant)
- ✅ **1 GB stockage** (vos données = ~0.1 MB)
- ✅ **Pas de limite de requêtes**

### Netlify (Frontend)
- ✅ **100 GB bande passante/mois**
- ✅ **Builds illimités**
- ✅ **Sites illimités**
- ✅ **SSL automatique**

**Conclusion** : Vous ne dépasserez jamais les limites gratuites avec cette application !

---

## 🆘 Dépannage

### Le backend ne démarre pas sur Railway

1. Vérifiez les logs : Railway → Deployments → View Logs
2. Vérifiez que le fichier `requirements.txt` est présent
3. Vérifiez que le fichier `Procfile` contient : `web: gunicorn server:app`

### Le frontend ne se connecte pas au backend

1. Vérifiez que l'URL dans `config.js` est correcte
2. Ouvrez la console développeur (F12) et cherchez les erreurs
3. Vérifiez que le backend est bien en ligne (ouvrez l'URL Railway dans un navigateur)

### Les données ne sont pas sauvegardées

1. Vérifiez que le volume Railway est bien configuré sur `/app/data`
2. Vérifiez les logs Railway pour voir s'il y a des erreurs d'écriture

### Erreur CORS

Si vous voyez des erreurs CORS dans la console :
1. Vérifiez que `flask-cors` est bien installé (dans `requirements.txt`)
2. Redéployez le backend sur Railway

---

## 🎉 Félicitations !

Votre application Menil est maintenant en ligne, gratuite, et automatiquement sauvegardée !

**URL de votre application** : `https://votre-site.netlify.app`

Partagez cette URL avec vos utilisateurs pour qu'ils puissent rejoindre les réunions !

---

## 📞 Support

En cas de problème :
1. Consultez les logs Railway et Netlify
2. Vérifiez la console développeur du navigateur (F12)
3. Assurez-vous que tous les fichiers sont bien sur GitHub
