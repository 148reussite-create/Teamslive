# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## Installation en 3 étapes

### 1️⃣ Installer les dépendances

Ouvrez un **terminal** (CMD ou PowerShell) dans ce dossier et exécutez :

```bash
npm install
```

**OU** double-cliquez simplement sur le fichier **START.bat** qui fera tout automatiquement !

---

### 2️⃣ Démarrer le serveur

**Méthode 1 - Double-clic (FACILE) :**
- Double-cliquez sur **START.bat**

**Méthode 2 - Terminal :**
```bash
npm start
```

Le serveur démarre sur **http://localhost:3000**

---

### 3️⃣ Tester l'application

1. **Ouvrez 4 onglets de navigateur** (Chrome/Edge/Firefox)
2. Dans chaque onglet, allez sur **http://localhost:3000**

---

## 🎯 Scénario de test complet

### Onglet 1 - ALICE (Hôte)
1. Entrez le nom : **Alice**
2. ✅ Cochez "Je veux charger une vidéo locale"
3. Sélectionnez un fichier vidéo MP4/WebM sur votre PC
4. Cliquez **Rejoindre**
5. **Sarah apparaîtra automatiquement** après 2 secondes

### Onglet 2 - BOB
1. Entrez le nom : **Bob**
2. Cliquez **Rejoindre**
3. Vous verrez Alice et Sarah

### Onglet 3 - CHARLIE
1. Entrez le nom : **Charlie**
2. Cliquez **Rejoindre**
3. Vous verrez Alice, Bob et Sarah (grille 2x2 complète)

### Onglet 4 - BLOCKED (Test limite)
1. Entrez le nom : **David**
2. Cliquez **Rejoindre**
3. **Message : "La réunion est complète"** ✅

---

## 💬 Tester le chat

1. Dans n'importe quel onglet, cliquez sur le bouton **Chat** 💬
2. Tapez un message et appuyez sur **Entrée**
3. **Tous les participants voient le message en temps réel**
4. **Sarah répondra automatiquement** de temps en temps

---

## 🤖 Sarah - L'assistante IA

### Ce que fait Sarah :

✅ Se présente en anglais au début
✅ Prend des notes automatiquement
✅ Envoie des messages de statut toutes les 30 secondes
✅ **Génère un résumé à la fin (visible uniquement par Alice)**

### Tester le résumé :

1. Discutez dans le chat (plusieurs messages)
2. **Dans l'onglet d'Alice**, cliquez sur **Quitter** 📞
3. **Un popup apparaît avec le résumé complet** ✅
4. Les autres participants ne voient PAS ce résumé

---

## 🎛️ Contrôles disponibles

| Bouton | Fonction |
|--------|----------|
| 🎤 Micro | Activer/désactiver le microphone |
| 📹 Caméra | Activer/désactiver la caméra |
| 💬 Chat | Ouvrir/fermer le panneau de chat |
| 👥 Participants | Voir le nombre de participants |
| 📞 Quitter | Quitter la réunion |

---

## ✅ Checklist de test

- [ ] Installation des dépendances (npm install)
- [ ] Démarrage du serveur (npm start)
- [ ] Connexion de 4 participants
- [ ] Test du chat en temps réel
- [ ] Sarah apparaît et se présente
- [ ] Sarah prend des notes
- [ ] Résumé généré pour l'hôte uniquement
- [ ] Vidéo locale chargée pour l'hôte
- [ ] Les autres voient la vidéo comme une webcam normale

---

## 🐛 Problèmes courants

### ❌ "npm : commande introuvable"
**Solution :** Vérifiez que Node.js est installé avec `node --version`

### ❌ "Impossible d'accéder à la caméra"
**Solution :** Autorisez l'accès à la caméra dans les paramètres du navigateur

### ❌ "Sarah n'apparaît pas"
**Solution :** Sarah n'apparaît que pour le premier participant (l'hôte)

### ❌ "Les participants ne se voient pas"
**Solution :**
- Vérifiez que vous êtes sur le même réseau local
- Utilisez `http://localhost:3000` et non une IP externe

---

## 📊 Résumé de l'architecture

```
┌─────────────────────────────────────────┐
│         SERVEUR (server.js)             │
│  - Express (fichiers statiques)         │
│  - Socket.io (WebSocket)                │
│  - Signaling WebRTC                     │
└─────────────────────────────────────────┘
              ↕️ WebSocket
┌─────────────────────────────────────────┐
│         CLIENT (app.js)                 │
│  - WebRTC (connexions P2P vidéo)        │
│  - Socket.io client (chat)              │
│  - Gestion de Sarah                     │
└─────────────────────────────────────────┘
```

---

## 🎨 Interface - Reproduction Teams

L'interface reproduit **EXACTEMENT** Microsoft Teams :

- ✅ Couleurs identiques (#292929, #6264a7)
- ✅ Police Segoe UI
- ✅ Grille vidéo 2x2
- ✅ Barre d'outils en haut
- ✅ Panneau chat style Copilot à droite
- ✅ Animations et effets

---

## 🚀 Prêt pour la production ?

Pour déployer en ligne :

1. **Heroku** (gratuit) : Suivez le README.md
2. **Render** (gratuit) : Suivez le README.md
3. **Railway** (gratuit) : Suivez le README.md

⚠️ **Important :** En production, configurez HTTPS (WebRTC l'exige)

---

## 📞 Besoin d'aide ?

Consultez le **README.md** pour plus de détails !

---

**Bon test ! 🎉**
