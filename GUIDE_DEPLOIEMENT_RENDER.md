# 🚀 Guide de déploiement - Menil App (Render + Netlify)

Ce guide vous explique comment déployer votre application sur Render (backend) et Netlify (frontend).

## 📋 Prérequis

- Un compte GitHub (gratuit)
- Un compte Render (avec plan payant pour le stockage persistant)
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

## Étape 2 : Déployer le backend sur Render

### 2.1 Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started"** ou **"Sign Up"**
3. Connectez-vous avec votre compte GitHub

### 2.2 Créer un nouveau Web Service

1. Dans le dashboard Render, cliquez sur **"New +"**
2. Sélectionnez **"Web Service"**
3. Cliquez sur **"Build and deploy from a Git repository"**
4. Cliquez sur **"Connect account"** pour GitHub si ce n'est pas déjà fait
5. Sélectionnez votre repository `menil-app`

### 2.3 Configurer le service

**Paramètres de base :**
- **Name:** `menil-app-backend`
- **Region:** Europe (Frankfurt) - recommandé pour la France
- **Branch:** `main`
- **Root Directory:** (laisser vide)

**Build & Deploy :**
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn server:app`

**Instance Type :**
- Sélectionnez **Starter** ou votre plan payant (nécessaire pour le stockage persistant)

### 2.4 Configurer le stockage persistant

⚠️ **IMPORTANT** : Le stockage persistant (Disks) nécessite un plan payant sur Render.

1. Avant de créer le service, descendez jusqu'à **"Disks"**
2. Cliquez sur **"Add Disk"**
3. Configurez :
   - **Name:** `menil-data`
   - **Mount Path:** `/app/data`
   - **Size:** 1 GB (largement suffisant pour les fichiers JSON)
4. Le disque sera créé avec le service

### 2.5 Variables d'environnement (optionnel)

Dans la section **"Environment Variables"**, vous pouvez ajouter :
- `PYTHON_VERSION` = `3.11.0` (optionnel, Render détecte automatiquement)

### 2.6 Créer le service

1. Cliquez sur **"Create Web Service"**
2. Render va :
   - Cloner votre dépôt GitHub
   - Installer les dépendances (`pip install -r requirements.txt`)
   - Démarrer le serveur avec gunicorn
3. Attendez que le déploiement soit terminé (statut : **"Live"**)

### 2.7 Récupérer l'URL du backend

1. Une fois déployé, Render génère automatiquement une URL
2. Format : `https://menil-app-backend.onrender.com`
3. **Copiez cette URL**, elle sera nécessaire pour configurer le frontend

**Tester le backend :**
```bash
# Vérifier que le service est en ligne
curl https://menil-app-backend.onrender.com/health

# Devrait retourner :
# {"status": "healthy", "timestamp": "..."}
```

✅ **Votre backend est en ligne sur Render !**

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
4. Configurez les paramètres :

**Build settings :**
- **Branch to deploy:** `main`
- **Build command:** (laisser vide - c'est un site statique)
- **Publish directory:** `.` (point - racine du projet)

### 3.3 Configurer l'URL du backend

**Option A : Modifier config.js localement (recommandé)**

1. Sur votre machine, ouvrez le fichier `config.js`
2. Vérifiez/modifiez l'URL :
   ```javascript
   window.API_URL = 'https://menil-app-backend.onrender.com';
   ```
3. Remplacez par votre vraie URL Render si différente
4. Commit et push :
   ```bash
   git add config.js
   git commit -m "Update backend URL for Render"
   git push origin main
   ```
5. Netlify redéploiera automatiquement

**Option B : Variable d'environnement Netlify (avancé)**

1. Dans Netlify, allez dans **Site settings** → **Environment variables**
2. Ajoutez : `API_URL` = `https://menil-app-backend.onrender.com`
3. Modifiez `config.js` pour utiliser cette variable

### 3.4 Finaliser le déploiement

1. Cliquez sur **"Deploy site"**
2. Attendez que le déploiement soit terminé
3. Netlify génère une URL aléatoire (ex: `https://cheerful-tartufo-abc123.netlify.app`)

### 3.5 Personnaliser l'URL (optionnel)

1. Dans Netlify, allez dans **Site settings** → **Domain management**
2. Cliquez sur **"Options"** → **"Edit site name"**
3. Changez en : `menil-app`
4. Votre URL devient : `https://menil-app.netlify.app`

✅ **Votre frontend est en ligne sur Netlify !**

---

## Étape 4 : Vérification finale

### 4.1 Tester le backend

Ouvrez votre navigateur et testez :
- Health check : `https://menil-app-backend.onrender.com/health`
- API residents : `https://menil-app-backend.onrender.com/api/residents`
- API meetings : `https://menil-app-backend.onrender.com/api/meetings`

### 4.2 Tester le frontend

1. Allez sur : `https://menil-app.netlify.app`
2. Vérifiez que :
   - La page se charge correctement
   - Vous pouvez voir la liste des administrés
   - Vous pouvez créer une réunion (mode admin : mot de passe `meniL-admin`)
   - Les votes fonctionnent
   - La visioconférence se lance

### 4.3 Vérifier la persistance des données

1. Créez une réunion de test
2. Dans Render, allez dans le dashboard → Votre service → **Manual Deploy** → **Clear build cache & deploy**
3. Attendez le redémarrage
4. Vérifiez que la réunion est toujours là

✅ **Si tout fonctionne, votre application est déployée avec succès !**

---

## 📊 Récapitulatif des URLs

| Service | Plateforme | URL | Coût |
|---------|-----------|-----|------|
| **Backend** | Render | `https://menil-app-backend.onrender.com` | Payant (Starter) |
| **Frontend** | Netlify | `https://menil-app.netlify.app` | Gratuit |
| **Code source** | GitHub | `https://github.com/VOTRE_USERNAME/menil-app` | Gratuit |

---

## 🔧 Configuration technique

### Fichiers de configuration présents

- **render.yaml** : Configuration automatique Render (Infrastructure as Code)
- **Procfile** : Commande de démarrage pour le serveur
- **requirements.txt** : Dépendances Python
- **netlify.toml** : Configuration Netlify (redirections, headers)
- **config.js** : Configuration de l'URL du backend

### Architecture de stockage

```
Backend (Render)
├── /app (code de l'application)
└── /app/data (disque persistant - 1 GB)
    ├── meetings.json
    ├── votes.json
    ├── residents.json
    ├── reports.json
    ├── participant_stats.json
    └── past_meetings.json
```

---

## 🛠️ Dépannage

### Problème : Le backend ne démarre pas

**Solutions :**
1. Vérifiez les logs dans Render : Dashboard → Service → Logs
2. Assurez-vous que `requirements.txt` contient :
   ```
   Flask==3.0.0
   flask-cors==4.0.0
   gunicorn==21.2.0
   ```
3. Vérifiez que la commande de démarrage est : `gunicorn server:app`

### Problème : Les données ne persistent pas

**Solutions :**
1. Vérifiez que le disque est bien configuré :
   - Name : `menil-data`
   - Mount Path : `/app/data`
2. Vérifiez que vous avez un plan payant Render (Starter minimum)
3. Dans le Shell Render, exécutez : `ls -la /app/data`

### Problème : Le frontend ne se connecte pas au backend

**Solutions :**
1. Vérifiez l'URL dans `config.js`
2. Testez le backend directement : `https://votre-url.onrender.com/health`
3. Vérifiez les logs du navigateur (F12 → Console)
4. Assurez-vous que CORS est activé (déjà configuré dans `server.py`)

### Problème : Erreur 502 Bad Gateway sur Render

**Solutions :**
1. C'est normal au premier démarrage (Render démarre le service)
2. Attendez 30-60 secondes et réessayez
3. Les services gratuits Render s'endorment après 15 min d'inactivité (le plan Starter évite ça)

---

## 🔄 Mises à jour de l'application

Pour mettre à jour votre application après des modifications :

1. Modifiez votre code localement
2. Commit et push :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push origin main
   ```
3. **Render** et **Netlify** redéploient automatiquement !

---

## 📈 Surveillance et monitoring

### Logs Render
- Dashboard → Service → Logs (temps réel)

### Logs Netlify
- Site → Deploys → Deploy log

### Métriques Render
- Dashboard → Service → Metrics
  - CPU usage
  - Memory usage
  - Request count

---

## 💰 Coûts estimés

| Service | Plan | Coût mensuel |
|---------|------|--------------|
| **Render** | Starter | $7/mois |
| **Netlify** | Free | $0 |
| **GitHub** | Free | $0 |
| **Total** | | **~$7/mois** |

---

## 🎯 Checklist de déploiement

- [ ] Code pushé sur GitHub
- [ ] Service Render créé
- [ ] Disque persistant configuré (1 GB à `/app/data`)
- [ ] Backend déployé et accessible (`/health` répond)
- [ ] Frontend déployé sur Netlify
- [ ] URL backend mise à jour dans `config.js`
- [ ] Test : création de réunion fonctionne
- [ ] Test : votes fonctionnent
- [ ] Test : visioconférence fonctionne
- [ ] Test : persistance des données après redémarrage

---

**Félicitations ! Votre application Menil est déployée et accessible à tous ! 🎉**
