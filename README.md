# 🎥 Application de Visioconférence - Clone Microsoft Teams

Une application de visioconférence complète identique à Microsoft Teams avec 4 participants maximum, chat en temps réel, waiting room et assistant IA "Sarah".

## ⚡ DÉMARRAGE RAPIDE

**Double-cliquez sur `START.bat`** ou lisez **DEMARRAGE_RAPIDE.md**

### Liens principaux:
- **HÔTE:** http://localhost:3000/host (upload vidéo)
- **PARTICIPANT:** http://localhost:3000/participant (flux normal)

---

## 🎯 Fonctionnalités

### ✨ Principales
- **2 liens séparés** - Un pour l'hôte (upload vidéo), un pour les participants
- **4 participants maximum** (grille 2x2)
- **Waiting room avec admission** - L'hôte doit admettre/refuser chaque participant
- **Upload de vidéo pour hôte** - 1-2 vidéos qui apparaissent comme webcam
- **Vidéo en temps réel** avec WebRTC peer-to-peer
- **Chat en temps réel** avec Socket.io (toujours visible)
- **Avatar avec initiales** quand caméra éteinte (ex: "SB" pour Stephane Bianchi)
- **Assistant IA "Sarah"** qui prend des notes automatiquement
- **Interface IDENTIQUE à Microsoft Teams** - Thème blanc, couleurs exactes

## 📋 Prérequis

- Node.js v24.12.0 (ou version compatible)
- Navigateur moderne (Chrome, Firefox, Edge) avec support WebRTC

## 🚀 Installation

### Étape 1 : Installer les dépendances

Ouvrez un terminal dans le dossier `reference` et exécutez :

```bash
npm install
```

Cela installera :
- `express` - Serveur web
- `socket.io` - WebSocket pour le chat et signaling WebRTC
- `openai` - Pour les futures améliorations de Sarah (optionnel)
- `nodemon` - Pour le développement

### Étape 2 : Démarrer le serveur

```bash
npm start
```

Ou pour le mode développement avec auto-reload :

```bash
npm run dev
```

Le serveur démarrera sur `http://localhost:3000`

## 🎮 Utilisation

### Pour tester en local avec plusieurs participants :

1. **Ouvrez 4 onglets/fenêtres de navigateur** différents
2. **Dans chaque onglet**, accédez à `http://localhost:3000`

### Premier participant (Hôte) :

1. Entrez votre nom (ex: "Alice")
2. ✅ **OPTIONNEL** : Cochez "Je veux charger une vidéo locale" et sélectionnez un fichier vidéo
   - Cette vidéo sera diffusée comme votre webcam
   - Les autres participants la verront comme une webcam normale
3. Cliquez sur "Rejoindre"
4. **Sarah apparaîtra automatiquement** après 2 secondes comme 4ème participante

### Participants suivants :

1. Entrez votre nom (ex: "Bob", "Charlie")
2. Cliquez sur "Rejoindre"
3. Vous verrez tous les participants dans la grille 2x2

### Fonctionnalités :

#### Barre d'outils en haut :
- 🎤 **Micro** : Activer/désactiver le microphone
- 📹 **Caméra** : Activer/désactiver la caméra
- 💬 **Chat** : Ouvrir/fermer le panneau de chat
- 📞 **Quitter** : Quitter la réunion

#### Chat :
- Cliquez sur le bouton chat pour ouvrir le panneau
- Tapez votre message et appuyez sur Entrée ou cliquez sur l'icône d'envoi
- **Sarah** répondra automatiquement et prendra des notes

#### Sarah (Assistant IA) :
- Se présente en anglais au début
- Prend des notes pendant la réunion
- Envoie occasionnellement des messages de statut ("Taking notes...")
- **À la fin de la réunion** : génère un résumé visible UNIQUEMENT par l'hôte

#### Résumé de fin (Hôte uniquement) :
- Quand l'hôte quitte, Sarah génère automatiquement un résumé
- Le résumé contient :
  - Durée de la réunion
  - Nombre de participants
  - Tous les messages du chat
- **Seul l'hôte voit ce résumé**

## 📁 Structure du projet

```
reference/
├── server.js           # Serveur Node.js + Socket.io
├── package.json        # Dépendances
├── README.md          # Ce fichier
└── public/
    ├── index.html     # Interface principale
    ├── styles.css     # Style identique à Teams
    └── app.js         # Logique client WebRTC + Chat
```

## 🎨 Design

L'interface est une **reproduction identique** de Microsoft Teams :
- Couleurs : `#292929` (fond), `#6264a7` (accent Teams)
- Polices : Segoe UI
- Icônes : Font Awesome
- Disposition : Grille 2x2 pour vidéos, panneau chat à droite
- Barre d'outils : Identique à Teams

## 🔧 Configuration

### Modifier le nombre maximum de participants :

Dans `server.js`, ligne 8 :
```javascript
const MAX_PARTICIPANTS = 4; // Changez ce nombre
```

### Modifier le port :

Dans `server.js`, ligne 10 :
```javascript
const PORT = process.env.PORT || 3000; // Changez 3000
```

## 🌐 Déploiement en ligne

### Option 1 : Heroku

1. Créez un compte sur [Heroku](https://heroku.com)
2. Installez Heroku CLI
3. Exécutez :

```bash
heroku login
heroku create nom-de-votre-app
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Option 2 : Render

1. Créez un compte sur [Render](https://render.com)
2. Connectez votre repository Git
3. Sélectionnez "Web Service"
4. Build command : `npm install`
5. Start command : `npm start`

### Option 3 : Railway

1. Créez un compte sur [Railway](https://railway.app)
2. Cliquez sur "New Project" > "Deploy from GitHub"
3. Sélectionnez votre repository
4. Railway détectera automatiquement Node.js

## 🐛 Résolution de problèmes

### "npm: command not found"
- Vérifiez que Node.js est installé : `node --version`
- Redémarrez votre terminal

### La vidéo ne s'affiche pas
- Vérifiez que vous avez autorisé l'accès à la caméra/micro
- Utilisez HTTPS en production (WebRTC nécessite HTTPS)

### Sarah n'apparaît pas
- Vérifiez la console du navigateur (F12)
- Sarah apparaît seulement pour l'hôte (premier connecté)

### Les participants ne se voient pas
- Vérifiez que vous êtes sur le même réseau local
- En production, vous aurez besoin d'un serveur TURN pour les connexions derrière NAT

## 📝 Notes importantes

- **Maximum 4 participants** en simultané
- **Sarah est automatique** pour l'hôte uniquement
- **Le résumé** est visible uniquement par l'hôte
- **WebRTC fonctionne en local** sans configuration supplémentaire
- **Pour la production**, configurez des serveurs TURN pour supporter tous les types de réseaux

## 🚀 Prochaines étapes

Pour améliorer l'application :
- Ajouter l'intégration OpenAI pour Sarah (résumés intelligents)
- Enregistrement de la réunion
- Partage d'écran
- Arrière-plans virtuels
- Levée de main
- Sondages en temps réel

## 📞 Support

Pour toute question ou problème, consultez :
- [Documentation WebRTC](https://webrtc.org/)
- [Documentation Socket.io](https://socket.io/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Développé avec ❤️ - Clone Microsoft Teams**
