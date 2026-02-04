# 🚀 DÉMARRAGE RAPIDE

## Lancer l'application

### Option 1: Double-cliquer sur START.bat
C'est le plus simple! Double-cliquez sur `START.bat` dans ce dossier.

### Option 2: Ligne de commande
```bash
cd c:\Users\reuss\Desktop\reference
node server.js
```

---

## 🔗 Les 2 liens principaux

### 🎥 HÔTE (avec upload de vidéo)
```
http://localhost:3000/host
```
- Upload 1-2 vidéos (MP4, WebM, OGG - max 500MB)
- Démarre le meeting
- Devient automatiquement l'hôte
- Peut admettre/refuser les participants

### 👥 PARTICIPANT (flux normal)
```
http://localhost:3000/participant
```
- Entre son nom
- Configure audio/vidéo
- Attend dans la lobby
- L'hôte doit l'admettre

---

## ✅ Corrections appliquées

1. ✅ Logo Teams corrigé (SVG propre)
2. ✅ Chat souligné en bleu
3. ✅ Système de liens séparés
4. ✅ Page d'upload vidéo pour host
5. ✅ Pas de demande de nom pour host
6. ✅ Colonne chat toujours visible
7. ✅ Waiting room avec admission obligatoire

---

## 🎯 Test rapide

1. Ouvrir navigateur → `http://localhost:3000/host`
2. Uploader une vidéo + cliquer "Start Meeting"
3. Nouvel onglet → `http://localhost:3000/participant`
4. Entrer "Stephane Bianchi"
5. Dans l'onglet hôte → Cliquer "Admit"
6. ✅ Les deux sont dans le meeting!

---

Voir **LIENS.md** pour la documentation complète.
