# 🛠️ Guide d'utilisation des scripts de migration

## Scripts créés automatiquement

J'ai créé des scripts pour automatiser la migration :

### 1. **backup_railway_data.bat** (Windows)
Télécharge automatiquement toutes les données depuis Railway.

### 2. **upload_to_render.bat** (Windows)
Upload automatiquement les données vers Render.

### 3. **upload_to_render.sh** (Linux/Mac)
Version Linux/Mac du script d'upload.

---

## 📋 Utilisation étape par étape

### Étape 1 : Se connecter à Railway

**Avant d'exécuter les scripts, vous devez vous connecter à Railway :**

```bash
railway login
```

Une page web s'ouvrira pour vous authentifier. Une fois connecté, fermez la page.

**Ensuite, liez le projet :**

```bash
cd "C:\Users\lamid\.claude-worktrees\menil-app-v2-claude-4.5\gallant-hugle"
railway link
```

Sélectionnez votre projet `menil-app-backend` dans la liste.

---

### Étape 2 : Backup des données Railway

**Windows :**
```bash
# Double-cliquez sur le fichier ou exécutez :
backup_railway_data.bat
```

**Résultat attendu :**
```
========================================
Backup des donnees Railway
========================================

[1/7] Backup de meetings.json...
    ✓ meetings.json sauvegarde
[2/7] Backup de votes.json...
    ✓ votes.json sauvegarde
...
========================================
Backup termine !
========================================

Les donnees sont dans le dossier: data_backup\
```

**Vérification :**
```bash
dir data_backup
```

Vous devriez voir 6 fichiers JSON :
- `meetings.json`
- `votes.json`
- `residents.json` (61 résidents)
- `reports.json`
- `participant_stats.json`
- `past_meetings.json`

---

### Étape 3 : Créer le service Render

**⚠️ IMPORTANT : À faire manuellement sur https://render.com**

1. New + → Web Service
2. Connectez votre repo GitHub
3. Configuration :
   ```
   Name: menil-app-backend
   Region: Europe (Frankfurt)
   Branch: main
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn server:app
   Plan: Starter
   ```
4. **Ajoutez un disque persistant :**
   ```
   Name: menil-data
   Mount Path: /app/data
   Size: 1 GB
   ```
5. Cliquez sur "Create Web Service"
6. **Attendez le déploiement** (3-5 minutes)

---

### Étape 4 : Upload des données vers Render

Une fois le service Render déployé :

**Windows :**
```bash
upload_to_render.bat
```

**Linux/Mac :**
```bash
./upload_to_render.sh
```

**Le script vous demandera :**
```
Entrez l'URL de votre service Render (ex: https://menil-app-backend.onrender.com):
```

Entrez l'URL exacte de votre service Render.

**Résultat attendu :**
```
========================================
Upload des donnees vers Render
========================================

URL Render: https://menil-app-backend.onrender.com

[1/6] Upload de residents.json...
    ✓ residents.json uploadé

[2/6] Upload de meetings.json (si non vide)...
    ✓ meetings.json uploadé

...

[6/6] Vérification - Health check...
{"status":"healthy","timestamp":"..."}

========================================
Upload termine !
========================================
```

---

### Étape 5 : Uploader manuellement votes.json et past_meetings.json

**Les votes et réunions passées doivent être uploadés via le Shell Render :**

1. Dans Render Dashboard → Votre service → **Shell**
2. Exécutez les commandes suivantes en remplaçant `[CONTENU]` par le contenu des fichiers :

**Pour votes.json :**
```bash
cat > /app/data/votes.json << 'EOF'
[COLLER ICI LE CONTENU DE data_backup/votes.json]
EOF
```

**Pour past_meetings.json :**
```bash
cat > /app/data/past_meetings.json << 'EOF'
[COLLER ICI LE CONTENU DE data_backup/past_meetings.json]
EOF
```

**Pour reports.json :**
```bash
cat > /app/data/reports.json << 'EOF'
[COLLER ICI LE CONTENU DE data_backup/reports.json]
EOF
```

---

## 🔍 Vérification des données

### Vérifier que toutes les données sont présentes

**Via API :**
```bash
# Health check
curl https://menil-app-backend.onrender.com/health

# Residents (devrait retourner 61 résidents)
curl https://menil-app-backend.onrender.com/api/residents

# Meetings
curl https://menil-app-backend.onrender.com/api/meetings

# Votes
curl https://menil-app-backend.onrender.com/api/votes

# Past meetings
curl https://menil-app-backend.onrender.com/api/past-meetings

# Participant stats
curl https://menil-app-backend.onrender.com/api/participant-stats
```

**Via Shell Render :**
```bash
# Lister les fichiers
ls -lh /app/data/

# Vérifier le contenu
cat /app/data/residents.json | head -20
```

---

## 📝 Commandes utiles Railway CLI

### Lister les projets
```bash
railway list
```

### Voir les logs en temps réel
```bash
railway logs
```

### Exécuter une commande dans Railway
```bash
railway run -- [commande]
```

### Voir les variables d'environnement
```bash
railway variables
```

### Se déconnecter
```bash
railway logout
```

---

## 🔄 Commandes utiles Render

**Render n'a pas de CLI officiel**, mais vous pouvez utiliser :

### Via API REST
```bash
# Health check
curl https://[votre-url].onrender.com/health

# Tester un endpoint
curl https://[votre-url].onrender.com/api/residents
```

### Via Shell Render (interface web)
1. Dashboard → Service → Shell
2. Terminal interactif pour exécuter des commandes

---

## 🐛 Dépannage

### Problème : "railway: command not found"

**Solution :**
```bash
# Réinstaller Railway CLI
npm install -g @railway/cli

# Vérifier l'installation
railway --version
```

### Problème : "Not logged in"

**Solution :**
```bash
railway login
```

### Problème : "No project selected"

**Solution :**
```bash
# Lier le projet
railway link

# Ou spécifier le projet
railway link [PROJECT_ID]
```

### Problème : "curl: command not found" (Windows)

**Solution :**

Option 1 : Installer curl
- Téléchargez depuis https://curl.se/windows/
- Ajoutez curl au PATH

Option 2 : Utiliser PowerShell
```powershell
Invoke-WebRequest -Uri "https://menil-app-backend.onrender.com/health" -Method GET
```

Option 3 : Utiliser un client REST (Postman, Insomnia)

### Problème : Les données uploadées ne persistent pas

**Solution :**
1. Vérifiez que le disque persistant est bien configuré dans Render
2. Vérifiez le Mount Path : `/app/data`
3. Redémarrez le service Render
4. Vérifiez via Shell Render : `ls -la /app/data`

---

## 📊 Résumé des fichiers de données

| Fichier | Taille estimée | Contenu | Upload automatique |
|---------|---------------|---------|-------------------|
| `residents.json` | ~2-3 KB | 61 résidents | ✅ Oui (script) |
| `meetings.json` | Variable | Réunions actives | ✅ Oui (script) |
| `votes.json` | ~15-20 KB | Historique des votes | ❌ Manuel (Shell) |
| `reports.json` | ~1 KB | Liens comptes-rendus | ❌ Manuel (Shell) |
| `participant_stats.json` | Variable | Statistiques | ✅ Oui (script) |
| `past_meetings.json` | Variable | Réunions passées | ❌ Manuel (Shell) |

---

## ✅ Checklist d'utilisation des scripts

- [ ] Railway CLI installé (`railway --version`)
- [ ] Connecté à Railway (`railway login`)
- [ ] Projet Railway lié (`railway link`)
- [ ] Script `backup_railway_data.bat` exécuté
- [ ] Dossier `data_backup` créé avec 6 fichiers JSON
- [ ] Service Render créé avec disque persistant
- [ ] Script `upload_to_render.bat` exécuté avec succès
- [ ] `votes.json` uploadé manuellement via Shell Render
- [ ] `past_meetings.json` uploadé manuellement via Shell Render
- [ ] `reports.json` uploadé manuellement via Shell Render
- [ ] Vérification : API residents retourne 61 résidents
- [ ] Vérification : Health check OK
- [ ] Vérification : Tous les endpoints répondent

---

## 🎯 Prochaines étapes

Une fois les données migrées et vérifiées :

1. **Tester l'application complète**
   - Créer une réunion
   - Créer un vote
   - Vérifier la persistance

2. **Mettre à jour Netlify**
   - Push le code sur GitHub
   - Netlify redéploiera automatiquement

3. **Garder Railway en backup**
   - Ne pas supprimer immédiatement
   - Mettre en pause après 1-2 semaines de tests

---

**Temps estimé pour la migration complète : 15-20 minutes**

(en excluant le temps de déploiement Render qui prend ~5 minutes)
