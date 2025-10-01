# Menil App - Application de Visioconférence Simple

Une application web simple et élégante pour créer et rejoindre des réunions de visioconférence en utilisant MiroTalk.

## 🚀 Fonctionnalités

- **Création de réunions** : Créez facilement une nouvelle réunion avec un nom personnalisé
- **Participation aux réunions** : Rejoignez une réunion existante avec un simple ID
- **Interface intuitive** : Design moderne et responsive
- **Partage de liens** : Partagez facilement le lien de votre réunion
- **Intégration MiroTalk** : Utilise la technologie WebRTC de MiroTalk pour des appels de haute qualité
- **Aucune installation requise** : Fonctionne directement dans le navigateur

## 🛠️ Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : MiroTalk SFU (Service de visioconférence)
- **Styling** : CSS Grid, Flexbox, Animations CSS
- **Icons** : Font Awesome

## 📋 Prérequis

- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Connexion Internet
- Autorisation d'accès à la caméra et au microphone

## 🚀 Installation et utilisation

### Méthode 1 : Serveur local Python

1. Clonez ou téléchargez le projet
2. Ouvrez un terminal dans le dossier du projet
3. Lancez le serveur local :
   ```bash
   python -m http.server 8000
   ```
4. Ouvrez votre navigateur et allez sur `http://localhost:8000`

### Méthode 2 : Serveur local Node.js

1. Installez `http-server` globalement :
   ```bash
   npm install -g http-server
   ```
2. Dans le dossier du projet :
   ```bash
   http-server -p 8000
   ```
3. Ouvrez `http://localhost:8000` dans votre navigateur

### Méthode 3 : Extension Live Server (VS Code)

1. Installez l'extension "Live Server" dans VS Code
2. Clic droit sur `index.html` → "Open with Live Server"

## 📖 Guide d'utilisation

### Créer une réunion

1. Remplissez le formulaire "Créer une nouvelle réunion" :
   - **Nom de la réunion** : Donnez un nom descriptif à votre réunion
   - **Votre nom** : Entrez votre nom d'hôte
   - **Mot de passe** (optionnel) : Protégez votre réunion avec un mot de passe
   - **Options audio/vidéo** : Choisissez les paramètres par défaut

2. Cliquez sur "Créer la réunion"

3. Copiez et partagez le lien généré avec les participants

4. Cliquez sur "Démarrer la réunion" pour rejoindre votre propre réunion

### Rejoindre une réunion

1. Remplissez le formulaire "Rejoindre une réunion" :
   - **ID de la réunion** : Entrez l'ID fourni par l'organisateur
   - **Votre nom** : Entrez votre nom de participant
   - **Mot de passe** : Si la réunion est protégée

2. Cliquez sur "Rejoindre la réunion"

### Partage direct par lien

Vous pouvez également partager un lien direct qui pré-remplit l'ID de la réunion :
```
http://localhost:8000?join=ID_DE_LA_REUNION
```

## 🔧 Configuration

### Personnalisation de MiroTalk

Dans le fichier `script.js`, vous pouvez modifier la configuration MiroTalk :

```javascript
const MIROTALK_CONFIG = {
    domain: 'sfu.mirotalk.com',
    baseUrl: 'https://sfu.mirotalk.com'
};
```

Pour utiliser votre propre instance MiroTalk, remplacez ces valeurs par votre domaine.

### Personnalisation du style

Le fichier `styles.css` contient tous les styles de l'application. Vous pouvez :
- Modifier les couleurs dans les gradients
- Changer les polices
- Ajuster les animations
- Modifier la disposition responsive

## 🌐 Intégration MiroTalk

Cette application utilise l'API MiroTalk SFU pour les fonctionnalités de visioconférence :

- **MiroTalk SFU** : Service de visioconférence scalable
- **WebRTC** : Technologie de communication en temps réel
- **Iframe Integration** : Intégration transparente dans l'application

### Paramètres MiroTalk supportés

- `room` : ID de la salle
- `name` : Nom du participant
- `audio` : Activation de l'audio (0/1)
- `video` : Activation de la vidéo (0/1)
- `screen` : Partage d'écran (0/1)
- `chat` : Chat intégré (0/1)
- `hide` : Masquer sa propre vue (0/1)
- `notify` : Notifications (0/1)

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à :
- **Desktop** : Interface complète avec deux colonnes
- **Tablet** : Interface adaptée avec une colonne
- **Mobile** : Interface optimisée pour les petits écrans

## 🔒 Sécurité et Confidentialité

- **Chiffrement end-to-end** : Les communications sont chiffrées via WebRTC
- **Pas de stockage serveur** : Les données de réunion sont stockées localement
- **Mots de passe optionnels** : Protection des réunions sensibles
- **Domaine sécurisé** : Utilisation de HTTPS pour MiroTalk

## 🐛 Dépannage

### Problèmes courants

1. **Caméra/Microphone non détectés** :
   - Vérifiez les autorisations du navigateur
   - Assurez-vous qu'aucune autre application n'utilise ces périphériques

2. **Réunion ne se charge pas** :
   - Vérifiez votre connexion Internet
   - Essayez de rafraîchir la page
   - Vérifiez que l'ID de la réunion est correct

3. **Interface ne s'affiche pas correctement** :
   - Videz le cache du navigateur
   - Vérifiez que JavaScript est activé
   - Utilisez un navigateur moderne

### Logs de débogage

Ouvrez la console développeur (F12) pour voir les logs détaillés de l'application.

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- **MiroTalk** : Pour leur excellente plateforme de visioconférence open-source
- **Font Awesome** : Pour les icônes
- **WebRTC** : Pour la technologie de communication en temps réel

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation MiroTalk
- Vérifiez les logs de la console développeur

---

**Menil App** - Une solution simple et élégante pour vos réunions en ligne ! 🎥✨