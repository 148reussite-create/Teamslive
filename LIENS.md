# 🔗 LIENS DE L'APPLICATION

## 📋 Récapitulatif des Corrections

✅ **Logo Teams corrigé** - SVG inline au lieu de data URI
✅ **Chat souligné en bleu** - "chat" est maintenant souligné en bleu Teams (#6264a7)
✅ **Système de liens séparés** - Host et Participant ont des parcours différents
✅ **Page d'upload vidéo pour host** - Le host peut uploader 1-2 vidéos avant de rejoindre
✅ **Colonne chat toujours visible** - La colonne chat est affichée par défaut

---

## 🚀 COMMENT DÉMARRER

1. Ouvrir un terminal Windows (Command Prompt ou PowerShell)
2. Naviguer vers le dossier: `cd c:\Users\reuss\Desktop\reference`
3. Lancer le serveur: `node server.js`
4. Le serveur démarre sur: **http://localhost:3000**

---

## 🔗 LES DEUX LIENS PRINCIPAUX

### 1️⃣ LIEN HÔTE (HOST)
**URL:** `http://localhost:3000/host`

**Ce qui se passe:**
1. Affiche une page d'upload de vidéo
2. Le host peut uploader jusqu'à 2 vidéos (MP4, WebM, OGG - max 500MB chacune)
3. Au moins 1 vidéo est requise pour démarrer
4. Après upload, cliquer sur "Start Meeting"
5. Le host est redirigé vers `/meeting` et devient automatiquement l'hôte
6. **Pas de demande de nom** - le host uploade juste ses vidéos

**Fonctionnalités:**
- Upload de vidéo 1 (obligatoire)
- Upload de vidéo 2 (optionnel)
- Prévisualisation des vidéos
- Bouton "Remove" pour retirer une vidéo
- Les vidéos seront utilisées comme "webcam" pendant le meeting

---

### 2️⃣ LIEN PARTICIPANT
**URL:** `http://localhost:3000/participant`

**Ce qui se passe:**
1. ❌ **SUPPRESSION** - Plus de demande de nom au départ
2. L'utilisateur entre directement son nom
3. Flux complet: Splash → Setup → Waiting Room → Meeting
4. Dans la waiting room, le participant **doit attendre que l'hôte l'admette**
5. Une fois admis, il rejoint le meeting

**Flux d'admission:**
- Le participant arrive dans la "lobby" (waiting room)
- Message: "Waiting for host to let you in..."
- L'hôte voit une notification: "X is waiting in the lobby"
- L'hôte peut cliquer "Admit" ou "Deny"
- Si admis → participant entre dans le meeting
- Si refusé → participant est déconnecté

---

## 🎯 FLUX COMPLET

### Pour le HOST:
```
1. Ouvrir http://localhost:3000/host
2. Uploader 1-2 vidéos
3. Cliquer "Start Meeting"
4. → Arrive directement dans le meeting (devient hôte)
5. Voit les participants en attente dans la lobby
6. Peut admettre ou refuser les participants
```

### Pour les PARTICIPANTS:
```
1. Ouvrir http://localhost:3000/participant
2. Voir le logo Teams (splash screen)
3. Entrer son nom et configurer audio/vidéo
4. Cliquer "Join now"
5. → Entre dans la waiting room
6. Attendre l'admission de l'hôte
7. → Une fois admis, entre dans le meeting
```

---

## 📊 CARACTÉRISTIQUES DU MEETING

### Interface du Meeting:
- **Top bar** avec tous les boutons Teams (Chat, People, Raise, React, View, More, Camera, Mic, Share, Leave)
- **Grille vidéo** 2x2 (max 4 participants)
- **Colonne chat** toujours visible à droite
- **Avatar avec initiales** quand la caméra est éteinte (ex: "SB" pour Stephane Bianchi)

### Chat:
- **Message initial de Sarah IA**: "Hi everyone! I'm Sarah, your AI meeting assistant..."
- **Pas de notifications d'événements** (pas de "joined", "invited", etc.)
- Seulement les messages des utilisateurs + message initial de Sarah
- **"chat" souligné en bleu** dans le titre

### Fonctionnalités:
- WebRTC peer-to-peer pour la vidéo/audio
- Toggle caméra et micro en temps réel
- Chat en temps réel via Socket.io
- Timer du meeting
- Waiting room avec admission/refus

---

## 🎨 THÈME

- **Thème BLANC** (comme la référence)
- Fond: `#f3f2f1`
- Panneaux blancs: `#ffffff`
- Accent Teams: `#6264a7` (bleu/violet)
- Bouton Leave: `#c4314b` (rouge)
- Font: Segoe UI

---

## 📝 NOTES IMPORTANTES

1. **Maximum 4 participants** dans le meeting
2. **Premier connecté = hôte** automatiquement
3. **Waiting room obligatoire** pour les participants (pas pour le host)
4. **Les vidéos uploadées par le host** sont stockées en sessionStorage (pour démo)
5. **En production**, il faudrait uploader les vidéos sur un serveur

---

## 🔧 POUR TESTER

### Test complet avec 2 utilisateurs:

1. **Onglet 1 - Host:**
   - Ouvrir `http://localhost:3000/host`
   - Uploader une vidéo
   - Démarrer le meeting
   - Attendre la notification de participant

2. **Onglet 2 - Participant:**
   - Ouvrir `http://localhost:3000/participant`
   - Entrer nom: "Stephane Bianchi"
   - Passer par splash → setup → waiting room
   - Attendre

3. **Retour Onglet 1:**
   - Voir notification "Stephane Bianchi is waiting in the lobby"
   - Cliquer "Admit"

4. **Résultat:**
   - Les deux utilisateurs sont dans le meeting
   - Chat visible avec message de Sarah
   - Vidéos/avatars affichés
   - Peuvent discuter via chat

---

## ✨ DIFFÉRENCES AVEC LA VERSION PRÉCÉDENTE

| Avant | Maintenant |
|-------|------------|
| Un seul lien pour tous | Deux liens séparés (/host et /participant) |
| Demande de nom pour tous | Host uploade vidéo, participant entre nom |
| Pas d'upload vidéo | Host peut uploader 1-2 vidéos |
| Logo en data URI | Logo en SVG inline propre |
| "chat" souligné noir | "chat" souligné en bleu Teams |
| Chat parfois caché | Chat toujours visible |

---

Voilà! Tout est maintenant configuré selon tes spécifications. 🎉
