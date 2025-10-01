# 🎥 Menil App - Application de Réunions Municipales

Application web complète pour gérer des réunions municipales avec visioconférence, système de votes en temps réel, et gestion des administrés.

## ✨ Fonctionnalités

### 🎯 Gestion des réunions
- **Création de réunions** avec planification à l'avance
- **Visioconférence intégrée** via MiroTalk (WebRTC)
- **Partage de liens** pour inviter les participants
- **Historique complet** des réunions passées

### 🗳️ Système de votes
- **Votes en temps réel** pendant les réunions
- **Votes multiples** ou choix unique
- **Résultats instantanés** avec graphiques
- **Historique des votes** par réunion
- **Fermeture des votes** par l'administrateur

### 👥 Gestion des administrés
- **Liste complète** des administrés
- **Ajout/modification/suppression** d'administrés
- **Sélection du nom** lors de la connexion
- **Statistiques de participation** par administré

### 📊 Statistiques et rapports
- **Temps de connexion** de chaque participant
- **Nombre de votes** par participant
- **Comptes-rendus** de réunions (liens externes)
- **Export des données** pour archivage

### 🔐 Mode administrateur
- **Activation simple** via bouton
- **Création de réunions** et de votes
- **Gestion des administrés**
- **Clôture des réunions**
- **Édition des comptes-rendus**

## 🚀 Déploiement

L'application est déployée sur :
- **Frontend** : Netlify (gratuit)
- **Backend** : Railway (gratuit)
- **Visioconférence** : MiroTalk SFU (service public)

### Déploiement rapide

Consultez le [Guide de déploiement complet](GUIDE_DEPLOIEMENT.md) pour les instructions détaillées.

**Résumé** :
1. Pousser le code sur GitHub
2. Déployer le backend sur Railway
3. Déployer le frontend sur Netlify
4. Configurer l'URL de l'API

**Temps estimé** : 15-20 minutes

## 🛠️ Technologies utilisées

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design (mobile, tablet, desktop)
- LocalStorage pour cache local
- Font Awesome pour les icônes

### Backend
- Python 3.11
- Flask (serveur web minimal)
- Stockage JSON (pas de base de données)
- CORS activé

### Services externes
- MiroTalk SFU (visioconférence WebRTC)
- Railway (hébergement backend)
- Netlify (hébergement frontend)

## 📁 Structure du projet

```
menil-app/
├── index.html              # Page principale
├── script.js               # Logique de l'application
├── styles.css              # Styles CSS
├── config.js               # Configuration API
├── hide-share-popup.js     # Script utilitaire
├── server.py               # Backend Flask minimal
├── requirements.txt        # Dépendances Python
├── Procfile                # Configuration Railway
├── netlify.toml            # Configuration Netlify
├── data/                   # Données JSON
│   ├── meetings.json       # Réunions planifiées
│   ├── votes.json          # Historique des votes
│   ├── residents.json      # Liste des administrés
│   ├── reports.json        # Liens des comptes-rendus
│   └── participant_stats.json  # Statistiques
└── images/                 # Images et logos
```

## 🔧 Développement local

### Prérequis
- Python 3.11+
- pip

### Installation

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/menil-app.git
cd menil-app

# Installer les dépendances Python
pip install -r requirements.txt

# Lancer le serveur
python server.py
```

Le serveur démarre sur `http://localhost:8080`

### Tester l'application

1. Ouvrez `http://localhost:8080` dans votre navigateur
2. Activez le mode admin (bouton en haut à droite)
3. Créez une réunion de test
4. Rejoignez la réunion et testez les fonctionnalités

## 📊 Données stockées

Toutes les données sont stockées dans des fichiers JSON simples :

- **meetings.json** : ~2 KB par réunion
- **votes.json** : ~1 KB par vote
- **residents.json** : ~5 KB pour 60 administrés
- **reports.json** : ~0.5 KB pour 10 comptes-rendus
- **participant_stats.json** : ~10 KB pour 50 réunions

**Total après 5 ans d'utilisation** : ~200 KB

## 🔒 Sécurité

- ✅ **HTTPS automatique** (Netlify + Railway)
- ✅ **CORS configuré** pour autoriser uniquement votre domaine
- ✅ **Pas de données sensibles** stockées
- ✅ **Mode admin** simple (localStorage)
- ✅ **WebRTC chiffré** pour la visioconférence

**Note** : Le mode admin actuel est basique (localStorage). Pour une sécurité renforcée, vous pouvez ajouter une authentification JWT.

## 📱 Compatibilité

- ✅ **Desktop** : Chrome, Firefox, Safari, Edge
- ✅ **Mobile** : iOS Safari, Chrome Android
- ✅ **Tablet** : iPad, Android tablets

**Requis pour la visioconférence** :
- Caméra et microphone
- Connexion HTTPS (automatique en production)
- Autorisation navigateur pour caméra/micro

## 🎨 Personnalisation

### Modifier les couleurs

Éditez `styles.css` et changez les variables CSS :

```css
:root {
    --primary-color: #4a90e2;
    --secondary-color: #f39c12;
    /* ... */
}
```

### Modifier le logo

Remplacez les fichiers dans le dossier `images/` :
- `menil-panneau.png` : Logo principal
- `videocall.png` : Icône vidéo
- `round-table.png` : Icône réunion

### Changer le service de visioconférence

Si vous voulez utiliser votre propre instance MiroTalk :

1. Éditez `script.js`
2. Modifiez la configuration :
   ```javascript
   const MIROTALK_CONFIG = {
       domain: 'votre-domaine.com',
       baseUrl: 'https://votre-domaine.com'
   };
   ```

## 📈 Scalabilité

L'application peut gérer :
- **100+ utilisateurs simultanés** (limité par MiroTalk gratuit)
- **1000+ réunions** archivées
- **10000+ votes** dans l'historique
- **Données infinies** (fichiers JSON très légers)

Pour plus d'utilisateurs simultanés, hébergez votre propre instance MiroTalk.

## 🆘 Dépannage

### La visioconférence ne fonctionne pas
- Vérifiez que vous êtes en HTTPS
- Autorisez l'accès caméra/micro dans le navigateur
- Testez sur un autre navigateur

### Les données ne se sauvegardent pas
- Vérifiez que le backend Railway est en ligne
- Consultez les logs Railway
- Vérifiez que le volume est bien configuré

### Erreur "Failed to fetch"
- Vérifiez que l'URL dans `config.js` est correcte
- Vérifiez que le backend répond (ouvrez l'URL dans un navigateur)
- Consultez la console développeur (F12)

## 📄 Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer.

## 🙏 Remerciements

- **MiroTalk** : Service de visioconférence open-source
- **Railway** : Hébergement backend gratuit
- **Netlify** : Hébergement frontend gratuit
- **Font Awesome** : Icônes

## 📞 Support

Pour toute question ou problème :
1. Consultez le [Guide de déploiement](GUIDE_DEPLOIEMENT.md)
2. Vérifiez les logs Railway et Netlify
3. Ouvrez une issue sur GitHub

---

**Menil App** - Une solution simple et gratuite pour vos réunions municipales ! 🎥✨
