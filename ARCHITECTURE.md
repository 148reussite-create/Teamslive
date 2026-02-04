# 🏗️ ARCHITECTURE DE L'APPLICATION

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION TEAMS CLONE                      │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Client 1   │      │   Client 2   │      │   Client 3   │ │
│  │   (Alice)    │      │    (Bob)     │      │  (Charlie)   │ │
│  │   [Hôte]     │      │              │      │              │ │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘ │
│         │                     │                     │          │
│         └─────────────────────┼─────────────────────┘          │
│                               │                                │
│                    ┌──────────▼──────────┐                     │
│                    │   SERVEUR NODE.JS   │                     │
│                    │  - Express          │                     │
│                    │  - Socket.io        │                     │
│                    │  - WebRTC Signaling │                     │
│                    └─────────────────────┘                     │
│                                                                 │
│                    ┌─────────────────────┐                     │
│                    │   Sarah (AI Bot)    │                     │
│                    │   - Prise de notes  │                     │
│                    │   - Résumé          │                     │
│                    └─────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flux de données

### 1. Connexion et signaling WebRTC

```
Alice (Client)                Serveur                Bob (Client)
      │                          │                         │
      ├─────── join-room ────────>│                         │
      │                          │<───── join-room ─────────┤
      │                          │                         │
      │<──── user-connected ──────┤                         │
      │                          ├──── user-connected ────>│
      │                          │                         │
      ├────────── offer ─────────>│                         │
      │                          ├────────── offer ───────>│
      │                          │                         │
      │                          │<────── answer ──────────┤
      │<────── answer ────────────┤                         │
      │                          │                         │
      ├──── ice-candidate ───────>│                         │
      │                          ├──── ice-candidate ─────>│
      │                          │                         │
      │◄═══════ Connexion P2P directe ══════════════════►│
      │         (Vidéo/Audio)                             │
```

### 2. Chat en temps réel

```
Alice                         Serveur                    Bob, Charlie
  │                              │                            │
  ├───── chat-message ─────────>│                            │
  │     ("Bonjour!")             │                            │
  │                              ├──── chat-message ────────>│
  │                              │     ("Bonjour!")           │
  │                              │                            │
  │                              │<──── chat-message ─────────┤
  │                              │     ("Salut Alice!")       │
  │<──── chat-message ───────────┤                            │
  │     ("Salut Alice!")         ├──── chat-message ────────>│
  │                              │                            │
```

### 3. Sarah - Assistant IA

```
Hôte (Alice)              Serveur                    Sarah (Bot)
     │                       │                            │
     ├──── join-room ───────>│                            │
     │    (isHost=true)      │                            │
     │                       │                            │
     │                       │<─── auto-création ─────────┤
     │                       │    (après 2s)              │
     │                       │                            │
     │                       ├─── participants-update ───>│
     │                       │                            │
     │                       │<─── chat-message ──────────┤
     │<─── chat-message ─────┤    ("Hi, I'm Sarah...")    │
     │                       │                            │
     │                       │                            │
     │ (Fin de réunion)      │                            │
     ├──── leave-btn ────────>│                            │
     │                       │                            │
     ├─ request-summary ────>│                            │
     │                       ├──── chat-history ─────────>│
     │                       │                            │
     │                       │<──── send-summary ─────────┤
     │<─── meeting-summary ──┤                            │
     │    (visible Alice     │                            │
     │     uniquement)       │                            │
```

---

## Structure des fichiers

```
reference/
│
├── 📄 package.json          # Dépendances et scripts npm
├── 📄 server.js             # Serveur Node.js principal
│   ├── Express              # Serveur HTTP
│   ├── Socket.io            # WebSocket (chat + signaling)
│   └── Gestion participants # Max 4, rôles (hôte, Sarah)
│
├── 📁 public/               # Fichiers clients
│   ├── 📄 index.html        # Interface utilisateur
│   │   ├── Modal connexion
│   │   ├── Grille vidéo 2x2
│   │   ├── Barre d'outils
│   │   └── Panneau chat
│   │
│   ├── 📄 styles.css        # Design identique Teams
│   │   ├── Couleurs (#292929, #6264a7)
│   │   ├── Grille responsive
│   │   ├── Animations
│   │   └── Style chat
│   │
│   └── 📄 app.js            # Logique client
│       ├── WebRTC (P2P vidéo)
│       ├── Socket.io client (chat)
│       ├── Gestion Sarah
│       └── Contrôles UI
│
├── 📄 README.md             # Documentation complète
├── 📄 GUIDE_RAPIDE.md       # Guide de démarrage
├── 📄 TEST.md               # Plan de test complet
├── 📄 DEPLOIEMENT.md        # Guide déploiement en ligne
├── 📄 ARCHITECTURE.md       # Ce fichier
├── 📄 .gitignore            # Fichiers à ignorer
└── 📄 START.bat             # Script de démarrage Windows
```

---

## Technologies utilisées

### Backend (server.js)

| Technologie | Rôle | Version |
|-------------|------|---------|
| **Node.js** | Runtime JavaScript | 24.12.0 |
| **Express** | Serveur web HTTP | ^4.18.2 |
| **Socket.io** | WebSocket temps réel | ^4.6.1 |
| **OpenAI** | IA pour Sarah (optionnel) | ^4.20.1 |

### Frontend (public/)

| Technologie | Rôle |
|-------------|------|
| **HTML5** | Structure de la page |
| **CSS3** | Style (design Teams) |
| **JavaScript ES6+** | Logique client |
| **WebRTC** | Vidéo/audio P2P |
| **Socket.io Client** | Communication temps réel |
| **Font Awesome** | Icônes |

---

## Protocoles et standards

### WebRTC (Web Real-Time Communication)

```
┌─────────────────────────────────────────────────────────┐
│                    WebRTC Stack                         │
├─────────────────────────────────────────────────────────┤
│  Application Layer                                      │
│  ├── getUserMedia() ────> Accès caméra/micro          │
│  ├── RTCPeerConnection ─> Connexion P2P               │
│  └── RTCDataChannel ────> Canal de données (optionnel)│
├─────────────────────────────────────────────────────────┤
│  Signaling (Socket.io)                                  │
│  ├── offer/answer ──────> SDP (Session Description)   │
│  └── ice-candidate ─────> Candidats de connexion      │
├─────────────────────────────────────────────────────────┤
│  NAT Traversal                                          │
│  ├── STUN ──────────────> Découverte IP publique       │
│  └── TURN (optionnel) ──> Relais vidéo                │
├─────────────────────────────────────────────────────────┤
│  Transport                                              │
│  ├── UDP ───────────────> Vidéo/Audio (prioritaire)   │
│  └── TCP ───────────────> Fallback                    │
└─────────────────────────────────────────────────────────┘
```

### Socket.io (WebSocket)

```
Événements serveur → client:
├── you-are-host ──────────> Notifier que c'est l'hôte
├── room-full ─────────────> Réunion complète
├── participants-update ───> Liste participants mise à jour
├── user-connected ────────> Nouveau participant
├── user-disconnected ─────> Participant parti
├── offer ─────────────────> Offre WebRTC
├── answer ────────────────> Réponse WebRTC
├── ice-candidate ─────────> Candidat ICE
├── chat-history ──────────> Historique du chat
├── chat-message ──────────> Nouveau message
└── meeting-summary ───────> Résumé de réunion (hôte uniquement)

Événements client → serveur:
├── join-room ─────────────> Rejoindre la réunion
├── offer ─────────────────> Envoyer offre WebRTC
├── answer ────────────────> Envoyer réponse WebRTC
├── ice-candidate ─────────> Envoyer candidat ICE
├── chat-message ──────────> Envoyer message chat
├── request-chat-summary ──> Demander résumé (Sarah)
└── send-summary ──────────> Envoyer résumé (Sarah → hôte)
```

---

## Flux d'une session complète

### Étape 1 : Démarrage (0-2s)

```
┌──────────────────────────────────────────────────────┐
│ 1. Utilisateur ouvre http://localhost:3000          │
│ 2. Serveur envoie index.html, styles.css, app.js    │
│ 3. Modal de connexion s'affiche                     │
│ 4. Utilisateur entre son nom et clique "Rejoindre"  │
└──────────────────────────────────────────────────────┘
```

### Étape 2 : Connexion (2-5s)

```
┌──────────────────────────────────────────────────────┐
│ 1. Demande accès caméra/micro (getUserMedia)        │
│ 2. Socket.io établit connexion WebSocket            │
│ 3. Émission événement "join-room"                   │
│ 4. Serveur vérifie limite (4 participants max)      │
│ 5. Ajout à la liste des participants                │
│ 6. Si premier connecté → isHost = true              │
│ 7. Réception historique du chat                     │
└──────────────────────────────────────────────────────┘
```

### Étape 3 : Initialisation Sarah (si hôte)

```
┌──────────────────────────────────────────────────────┐
│ 1. Délai de 2 secondes                               │
│ 2. Création canvas animé (gradient)                 │
│ 3. Capture stream depuis canvas                     │
│ 4. Ajout élément vidéo "Sarah (AI Assistant)"       │
│ 5. Envoi message de présentation en anglais         │
│ 6. Timer : messages de statut toutes les 30s        │
└──────────────────────────────────────────────────────┘
```

### Étape 4 : Établissement connexions P2P (2-10s)

```
Pour chaque paire de participants:
┌──────────────────────────────────────────────────────┐
│ 1. Création RTCPeerConnection                        │
│ 2. Ajout tracks locaux (vidéo + audio)              │
│ 3. Initiateur crée offre SDP                        │
│ 4. Envoi offre via Socket.io                        │
│ 5. Destinataire crée réponse SDP                    │
│ 6. Échange candidats ICE                            │
│ 7. Établissement connexion P2P                      │
│ 8. Réception tracks distants                        │
│ 9. Affichage vidéo dans la grille                   │
└──────────────────────────────────────────────────────┘
```

### Étape 5 : Utilisation (durée variable)

```
┌──────────────────────────────────────────────────────┐
│ Actions utilisateur:                                 │
│ ├── Toggle micro/caméra                             │
│ ├── Ouvrir/fermer chat                              │
│ ├── Envoyer messages                                │
│ ├── Sarah prend des notes                           │
│ └── Timer de réunion s'incrémente                   │
└──────────────────────────────────────────────────────┘
```

### Étape 6 : Fin de réunion (1-3s)

```
┌──────────────────────────────────────────────────────┐
│ 1. Clic sur bouton "Quitter"                        │
│ 2. Confirmation popup                                │
│ 3. Si hôte:                                          │
│    ├── Demande résumé à Sarah                       │
│    ├── Sarah analyse historique chat                │
│    ├── Génération résumé                            │
│    └── Affichage modal résumé (hôte uniquement)     │
│ 4. Arrêt tracks locaux (caméra/micro)               │
│ 5. Fermeture connexions peer                        │
│ 6. Déconnexion Socket.io                            │
│ 7. Notification autres participants                 │
│ 8. Rechargement page                                │
└──────────────────────────────────────────────────────┘
```

---

## Gestion des participants

### États possibles

```
┌─────────────────┐
│  Disconnected   │ ──┐
└─────────────────┘   │
                      │ join-room
                      ▼
┌─────────────────┐
│   Connecting    │ ──┐
└─────────────────┘   │
                      │ WebRTC established
                      ▼
┌─────────────────┐
│    Connected    │ ──┐
└─────────────────┘   │
                      │ disconnect / leave
                      ▼
┌─────────────────┐
│  Disconnected   │
└─────────────────┘
```

### Limite de participants

```
Participants actifs : [Alice, Bob, Charlie, Sarah]
                      └─────────────────────────┘
                              Max = 4

Nouvelle tentative (David):
├── Vérification : participants.size >= 4
├── Si OUI : socket.emit('room-full')
└── Si NON : Accepter connexion
```

---

## Stockage des données

### Serveur (En mémoire)

```javascript
participants = Map {
  'socket_id_1' => { id, name: 'Alice', isHost: true, isSarah: false },
  'socket_id_2' => { id, name: 'Bob', isHost: false, isSarah: false },
  'socket_id_3' => { id, name: 'Charlie', isHost: false, isSarah: false },
  'sarah_id' => { id, name: 'Sarah', isHost: false, isSarah: true }
}

chatHistory = [
  { id, sender, senderId, text, timestamp, isSarah },
  { id, sender, senderId, text, timestamp, isSarah },
  ...
] // Max 100 messages
```

### Client (Variables globales)

```javascript
localStream: MediaStream         // Flux vidéo/audio local
localVideoFile: File             // Fichier vidéo (si hôte)
peers: Map<socketId, RTCPeerConnection>
remoteStreams: Map<socketId, MediaStream>
isHost: boolean
isMicOn: boolean
isCameraOn: boolean
```

---

## Performance et optimisations

### Compression vidéo (WebRTC natif)

```
Codec : VP8 / VP9 / H.264
Bitrate : Adaptatif (500 kbps - 2 Mbps)
Résolution : 640x480 → 1280x720 (selon bande passante)
FPS : 15-30 (adaptatif)
```

### Compression chat

```
Messages limités à 100 dans l'historique
Texte uniquement (pas de fichiers)
Pas de stockage permanent (en mémoire)
```

### Utilisation bande passante estimée

```
1 participant :
├── Upload : ~1 Mbps (vidéo 720p)
└── Download : ~3 Mbps (3 flux vidéo)

Total réunion 4 participants :
└── ~4 Mbps par participant (bidirectionnel)
```

---

## Sécurité

### Mesures implémentées

✅ HTTPS requis pour WebRTC en production
✅ Limite de participants (protection DoS)
✅ Escape HTML dans les messages (protection XSS)
✅ Variables d'environnement pour clés API
✅ .gitignore pour fichiers sensibles

### Mesures recommandées pour production

- [ ] Authentification utilisateurs
- [ ] Chiffrement end-to-end (E2EE)
- [ ] Rate limiting (anti-spam)
- [ ] Validation stricte des entrées
- [ ] CORS configuré correctement
- [ ] Logging des événements sensibles

---

## Évolutivité

### Actuellement (MVP)

```
Max participants : 4
Stockage : En mémoire (RAM)
Serveur : Single instance
WebRTC : P2P uniquement
```

### Pour scale (>100 participants)

```
├── Architecture multi-serveurs (clustering)
├── Load balancer (NGINX)
├── Base de données (MongoDB/PostgreSQL)
├── Redis (sessions distribuées)
├── SFU (Selective Forwarding Unit) au lieu de P2P mesh
├── CDN pour fichiers statiques
└── Serveurs TURN géo-distribués
```

---

## Diagramme de déploiement

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS (443)
                     ▼
         ┌───────────────────────┐
         │   Render / Railway    │
         │   (Load Balancer)     │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Node.js App Instance │
         │  - Express            │
         │  - Socket.io          │
         │  - WebRTC Signaling   │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  STUN Servers   │    │  TURN Servers   │
│  (Google)       │    │  (Metered.ca)   │
└─────────────────┘    └─────────────────┘
```

---

## Prochaines évolutions

### Phase 2 : Améliorations

```
├── Enregistrement réunion (serveur)
├── Partage d'écran fonctionnel
├── Arrière-plans virtuels
├── Levée de main
├── Sondages en temps réel
└── Intégration OpenAI pour Sarah (résumés intelligents)
```

### Phase 3 : Scale

```
├── Support 100+ participants
├── Base de données persistante
├── Authentification JWT
├── API REST publique
└── Application mobile (React Native)
```

---

## Ressources et références

### Documentation officielle

- [WebRTC](https://webrtc.org/)
- [Socket.io](https://socket.io/docs/)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Express.js](https://expressjs.com/)

### Tutoriels

- [WebRTC for Beginners](https://webrtc.github.io/samples/)
- [Socket.io Chat Tutorial](https://socket.io/get-started/chat)

---

**Architecture complète et prête pour la production ! 🚀**
