# Guide de Migration de Railway vers Render

## Vue d'ensemble

Ce guide vous accompagne dans la migration complète du backend de l'application Menil de Railway vers Render.

---

## Étape 1 : Télécharger les données de Railway

### Option A : Via l'interface Railway (recommandé)

1. Allez sur [Railway Dashboard](https://railway.app/dashboard)
2. Sélectionnez votre projet `menil-app-backend`
3. Cliquez sur l'onglet **"Data"** ou **"Volumes"**
4. Téléchargez tous les fichiers du dossier `/app/data` :
   - `meetings.json`
   - `votes.json`
   - `residents.json` (61 résidents actuellement)
   - `reports.json`
   - `participant_stats.json`
   - `past_meetings.json`

### Option B : Via Railway CLI

```bash
# Installer Railway CLI si nécessaire
npm install -g @railway/cli

# Se connecter
railway login

# Lister les services
railway list

# Télécharger les fichiers
railway run -- cat /app/data/meetings.json > meetings_backup.json
railway run -- cat /app/data/votes.json > votes_backup.json
railway run -- cat /app/data/residents.json > residents_backup.json
railway run -- cat /app/data/reports.json > reports_backup.json
railway run -- cat /app/data/participant_stats.json > participant_stats_backup.json
railway run -- cat /app/data/past_meetings.json > past_meetings_backup.json
```

---

## Étape 2 : Créer le service sur Render

### 2.1 Se connecter à Render

1. Allez sur [Render.com](https://render.com)
2. Connectez-vous avec votre compte payant

### 2.2 Créer un nouveau Web Service

1. Cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre dépôt GitHub contenant l'application Menil
3. Configurez le service :

**Paramètres de base :**
- **Name:** `menil-app-backend`
- **Region:** Europe (Frankfurt) - plus proche géographiquement
- **Branch:** `main` (ou votre branche de production)
- **Root Directory:** (laisser vide)

**Build & Deploy :**
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn server:app`

**Plan :**
- Sélectionnez votre plan payant (Starter minimum recommandé pour le stockage persistant)

### 2.3 Configurer le stockage persistant

1. Dans les paramètres du service, allez dans **"Disks"**
2. Cliquez sur **"Add Disk"**
3. Configurez :
   - **Name:** `menil-data`
   - **Mount Path:** `/app/data`
   - **Size:** 1 GB (suffisant pour les fichiers JSON)
4. Cliquez sur **"Create Disk"**

### 2.4 Variables d'environnement (optionnel)

Si nécessaire, ajoutez dans **"Environment"** :
```
PYTHON_VERSION=3.11.0
```

---

## Étape 3 : Déployer sur Render

1. Cliquez sur **"Create Web Service"**
2. Render va automatiquement :
   - Cloner votre dépôt GitHub
   - Installer les dépendances Python
   - Démarrer le serveur avec gunicorn
3. Attendez que le déploiement soit terminé (statut : **"Live"**)

**Note importante :** Le premier déploiement peut prendre 3-5 minutes.

---

## Étape 4 : Obtenir l'URL du service Render

Une fois déployé, Render vous fournit une URL :
- Format : `https://menil-app-backend.onrender.com`
- Notez cette URL, elle sera nécessaire pour la configuration frontend

---

## Étape 5 : Uploader les données sur Render

### Option A : Via l'interface Render Shell (recommandé)

1. Dans le dashboard Render, allez sur votre service `menil-app-backend`
2. Cliquez sur **"Shell"** dans le menu de gauche
3. Vous aurez accès à un terminal interactif
4. Utilisez `cat` ou `echo` pour créer les fichiers :

```bash
# Créer le dossier data si nécessaire
mkdir -p /app/data

# Exemple pour residents.json
cat > /app/data/residents.json << 'EOF'
[contenu du fichier JSON ici]
EOF
```

**IMPORTANT :** Copiez-collez le contenu exact de chaque fichier JSON sauvegardé.

### Option B : Via API avec curl (pour les fichiers volumineux)

Si vous avez beaucoup de données, utilisez un script pour uploader via l'API :

```bash
# Depuis votre machine locale
curl -X POST https://menil-app-backend.onrender.com/api/residents \
  -H "Content-Type: application/json" \
  -d @residents_backup.json

# Répétez pour chaque endpoint
```

### Option C : Script d'upload automatique

Créez un fichier `upload_data.sh` :

```bash
#!/bin/bash

BASE_URL="https://menil-app-backend.onrender.com"

# Upload residents
curl -X POST $BASE_URL/api/residents \
  -H "Content-Type: application/json" \
  -d @residents_backup.json

echo "✓ Residents uploaded"

# Upload meetings (si vous en avez)
# curl -X POST $BASE_URL/api/meetings ...

# Upload votes
# ...

echo "✓ All data uploaded successfully"
```

Exécutez :
```bash
chmod +x upload_data.sh
./upload_data.sh
```

---

## Étape 6 : Mettre à jour le frontend (Netlify)

### 6.1 Vérifier config.js

Le fichier `config.js` a déjà été mis à jour avec :
```javascript
window.API_URL = 'https://menil-app-backend.onrender.com';
```

**Action requise :** Si l'URL Render est différente, modifiez-la.

### 6.2 Commit et push

```bash
git add config.js render.yaml
git commit -m "Migration backend vers Render"
git push origin main
```

Netlify redéploiera automatiquement le frontend avec la nouvelle URL.

---

## Étape 7 : Vérification et tests

### 7.1 Tester le backend Render

Vérifiez que le backend répond :

```bash
# Health check
curl https://menil-app-backend.onrender.com/health

# Devrait retourner :
# {"status": "healthy", "timestamp": "..."}

# Tester les residents
curl https://menil-app-backend.onrender.com/api/residents

# Tester les meetings
curl https://menil-app-backend.onrender.com/api/meetings

# Tester les votes
curl https://menil-app-backend.onrender.com/api/votes
```

### 7.2 Tester le frontend

1. Allez sur votre application Netlify : `https://menil-app.netlify.app`
2. Vérifiez que :
   - La liste des administrés charge correctement (61 résidents)
   - Les réunions s'affichent
   - Les votes fonctionnent
   - La création de nouvelles réunions fonctionne (mode admin)

### 7.3 Vérifier la persistance des données

1. Créez une nouvelle réunion de test
2. Redéployez le service Render (forcer un redémarrage)
3. Vérifiez que la réunion est toujours présente

---

## Étape 8 : Désactiver Railway (optionnel)

Une fois que tout fonctionne sur Render :

1. Allez sur [Railway Dashboard](https://railway.app/dashboard)
2. Sélectionnez votre projet
3. **NE PAS SUPPRIMER IMMÉDIATEMENT** - gardez-le en backup pendant 1-2 semaines
4. Vous pouvez mettre le service en pause pour éviter les frais
5. Après validation complète, supprimez le projet Railway

---

## Résumé des URLs

| Service | Plateforme | URL |
|---------|-----------|-----|
| **Backend ancien** | Railway | `https://web-production-9a2fc7.up.railway.app` |
| **Backend nouveau** | Render | `https://menil-app-backend.onrender.com` |
| **Frontend** | Netlify | `https://menil-app.netlify.app` |

---

## Dépannage

### Problème : Le backend ne démarre pas sur Render

**Solution :**
1. Vérifiez les logs dans le dashboard Render
2. Assurez-vous que `requirements.txt` contient toutes les dépendances
3. Vérifiez que le `Procfile` ou la commande de démarrage est correcte

### Problème : Le disque persistant ne fonctionne pas

**Solution :**
1. Vérifiez que le disque est bien monté à `/app/data`
2. Vérifiez les permissions du dossier
3. Dans le Shell Render, exécutez : `ls -la /app/data`

### Problème : Le frontend ne peut pas se connecter au backend

**Solution :**
1. Vérifiez que l'URL dans `config.js` est correcte
2. Vérifiez que CORS est bien activé dans `server.py` (déjà configuré)
3. Testez l'endpoint `/health` directement dans le navigateur

### Problème : Les données ne persistent pas après redémarrage

**Solution :**
1. Vérifiez que le disque est bien configuré dans les paramètres Render
2. Assurez-vous que `DATA_DIR = Path('data')` dans `server.py` pointe vers `/app/data`
3. Modifiez si nécessaire : `DATA_DIR = Path('/app/data')`

---

## Différences entre Railway et Render

| Aspect | Railway | Render |
|--------|---------|--------|
| **Détection runtime** | Automatique (Procfile) | Automatique (requirements.txt) |
| **Stockage persistant** | Volume | Disk (configuration manuelle) |
| **URL format** | `*.up.railway.app` | `*.onrender.com` |
| **Région** | Auto | Configurable (Frankfurt recommandé) |
| **Logs** | Temps réel | Temps réel |
| **Prix** | Pay-as-you-go | Plans fixes |

---

## Checklist finale

- [ ] Données Railway téléchargées
- [ ] Service Render créé et déployé
- [ ] Disque persistant configuré (1 GB à `/app/data`)
- [ ] Données uploadées sur Render
- [ ] URL Render mise à jour dans `config.js`
- [ ] Frontend redéployé sur Netlify
- [ ] Health check backend OK
- [ ] Test API residents OK (61 résidents)
- [ ] Test API meetings OK
- [ ] Test API votes OK
- [ ] Test création réunion OK
- [ ] Test persistance après redémarrage OK
- [ ] Railway en pause/désactivé (après 1-2 semaines)

---

## Support

Si vous rencontrez des problèmes :
1. Consultez les logs Render : **Dashboard → Service → Logs**
2. Vérifiez la documentation Render : https://render.com/docs
3. Testez les endpoints manuellement avec `curl` ou Postman

---

**Migration créée le :** 2025-12-23
**Auteur :** Claude Code
**Version :** 1.0
