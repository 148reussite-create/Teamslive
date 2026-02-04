# 🧪 PLAN DE TEST COMPLET

## Test 1 : Installation ✅

### Commande :
```bash
npm install
```

### Résultat attendu :
- ✅ Dossier `node_modules/` créé
- ✅ Fichier `package-lock.json` créé
- ✅ Aucune erreur affichée
- ✅ Packages installés : express, socket.io, openai, nodemon

---

## Test 2 : Démarrage du serveur ✅

### Commande :
```bash
npm start
```

### Résultat attendu :
```
Serveur démarré sur http://localhost:3000
Maximum 4 participants autorisés
```

- ✅ Serveur démarre sans erreur
- ✅ Port 3000 accessible
- ✅ Console affiche le message de démarrage

---

## Test 3 : Interface utilisateur ✅

### Action :
Ouvrir http://localhost:3000 dans le navigateur

### Résultat attendu :
- ✅ Modal de connexion s'affiche
- ✅ Champ "Entrez votre nom" visible
- ✅ Checkbox "Je veux charger une vidéo locale" visible
- ✅ Bouton "Rejoindre" visible
- ✅ Design identique à Teams (fond sombre #292929)

---

## Test 4 : Connexion premier participant (Hôte) ✅

### Actions :
1. Entrer le nom "Alice"
2. Cliquer "Rejoindre"

### Résultat attendu :
- ✅ Modal disparaît
- ✅ Interface principale s'affiche
- ✅ Grille vidéo visible (2x2)
- ✅ Barre d'outils en haut visible
- ✅ Nom "Alice" affiché en haut à droite
- ✅ Compteur participants affiche "1"
- ✅ Timer de réunion démarre (00:00, 00:01, 00:02...)
- ✅ Console serveur affiche "Alice a rejoint"
- ✅ **Sarah apparaît après 2 secondes** avec animation
- ✅ **Sarah se présente dans le chat** en anglais

---

## Test 5 : Sarah - Assistante IA ✅

### Résultat attendu :
- ✅ Case vidéo "Sarah (AI Assistant)" visible
- ✅ Animation gradient coloré dans sa vidéo
- ✅ Texte "Sarah AI" et "Assistant de réunion" visible
- ✅ Badge "Active" avec point vert
- ✅ Message de présentation en anglais :
  > "Hi everyone! I'm Sarah, your AI meeting assistant..."
- ✅ Sarah prend des notes toutes les 30 secondes (20% de chance)

---

## Test 6 : Connexion 2ème participant ✅

### Actions :
1. Ouvrir un 2ème onglet sur http://localhost:3000
2. Entrer le nom "Bob"
3. Cliquer "Rejoindre"

### Résultat attendu :
- ✅ Bob rejoint la réunion
- ✅ Compteur participants affiche "2"
- ✅ Alice voit Bob dans la grille
- ✅ Bob voit Alice et Sarah dans la grille
- ✅ Les webcams s'affichent (ou placeholders si pas de caméra)
- ✅ Console serveur affiche "Bob a rejoint"

---

## Test 7 : Connexion 3ème participant ✅

### Actions :
1. Ouvrir un 3ème onglet sur http://localhost:3000
2. Entrer le nom "Charlie"
3. Cliquer "Rejoindre"

### Résultat attendu :
- ✅ Charlie rejoint la réunion
- ✅ Compteur participants affiche "3"
- ✅ Grille 2x2 complète : Alice, Bob, Charlie, Sarah
- ✅ Tous les participants se voient mutuellement
- ✅ Console serveur affiche "Charlie a rejoint"

---

## Test 8 : Limite de participants (4ème tentative) ✅

### Actions :
1. Ouvrir un 4ème onglet sur http://localhost:3000
2. Entrer le nom "David"
3. Cliquer "Rejoindre"

### Résultat attendu :
- ✅ **Alert : "La réunion est complète (4 participants maximum)"**
- ✅ David ne peut PAS rejoindre
- ✅ Page se recharge automatiquement
- ✅ Console serveur affiche "room-full"

---

## Test 9 : Chat en temps réel ✅

### Actions (dans l'onglet Alice) :
1. Cliquer sur le bouton "Chat" 💬
2. Taper "Bonjour tout le monde !"
3. Appuyer sur Entrée

### Résultat attendu :
- ✅ Panneau chat s'ouvre à droite
- ✅ Message "Bonjour tout le monde !" s'affiche
- ✅ Nom "Alice" affiché comme expéditeur
- ✅ Heure actuelle affichée
- ✅ **Tous les autres participants voient le message en temps réel**
- ✅ Badge de notification sur Bob et Charlie

---

## Test 10 : Réponse de Sarah ✅

### Résultat attendu :
- ✅ Sarah envoie périodiquement des messages :
  - "📝 Taking notes..."
  - "📝 Capturing key points..."
  - "📝 Logging discussion topics..."
- ✅ Messages de Sarah ont un fond violet (#464775)
- ✅ Nom "Sarah" en couleur différente (#9d9eff)

---

## Test 11 : Contrôles audio/vidéo ✅

### Actions :
1. Cliquer sur le bouton Micro 🎤
2. Cliquer sur le bouton Caméra 📹

### Résultat attendu :
- ✅ Bouton micro change d'icône (micro-slash)
- ✅ Couleur du bouton change (gris)
- ✅ Piste audio désactivée
- ✅ Bouton caméra change d'icône (video-slash)
- ✅ Vidéo locale devient noire
- ✅ Re-cliquer réactive les contrôles

---

## Test 12 : Chargement vidéo locale (Hôte) ✅

### Actions :
1. Nouvelle session : Recharger la page
2. Entrer "Alice"
3. ✅ Cocher "Je veux charger une vidéo locale"
4. Sélectionner un fichier MP4/WebM
5. Rejoindre

### Résultat attendu :
- ✅ Vidéo du fichier joue en boucle
- ✅ Alice voit sa propre vidéo
- ✅ **Les autres participants voient la vidéo comme une webcam normale**
- ✅ Pas de mention "fichier vidéo" pour les autres
- ✅ Tag "Alice (Vous)" affiché seulement pour Alice

---

## Test 13 : Résumé de fin (Hôte uniquement) ✅

### Actions :
1. Dans le chat, envoyer plusieurs messages (Alice, Bob, Charlie)
2. **Dans l'onglet Alice (hôte)**, cliquer sur "Quitter" 📞
3. Confirmer

### Résultat attendu :
- ✅ Popup "Êtes-vous sûr..." s'affiche
- ✅ Après confirmation, **modal de résumé apparaît**
- ✅ Résumé contient :
  - Durée de la réunion
  - Nombre de participants
  - Liste complète des messages du chat avec heure et expéditeur
  - "Généré par Sarah AI Assistant"
- ✅ **Seul Alice voit ce résumé**
- ✅ Bob et Charlie ne voient RIEN
- ✅ Alice déconnectée de la réunion

---

## Test 14 : Déconnexion et reconnexion ✅

### Actions :
1. Bob quitte la réunion (bouton Quitter)
2. Charlie voit la mise à jour
3. Nouveau participant "Emma" rejoint

### Résultat attendu :
- ✅ Case vidéo de Bob disparaît
- ✅ Compteur participants passe à "2" (Charlie + Sarah)
- ✅ Emma peut rejoindre (place disponible)
- ✅ Compteur remonte à "3"
- ✅ Console serveur affiche "Bob s'est déconnecté"

---

## Test 15 : Design identique à Teams ✅

### Vérifications visuelles :

#### Couleurs :
- ✅ Fond principal : `#292929`
- ✅ Barre d'outils : `#1f1f1f`
- ✅ Panneau chat : `#2d2d30`
- ✅ Boutons actifs : `#6264a7` (violet Teams)
- ✅ Bouton quitter : `#d13438` (rouge)

#### Typographie :
- ✅ Police : Segoe UI
- ✅ Tailles cohérentes avec Teams

#### Layout :
- ✅ Grille vidéo 2x2 avec gap de 12px
- ✅ Barre d'outils 60px de hauteur
- ✅ Panneau chat 380px de largeur
- ✅ Coins arrondis 8px sur les cases vidéo
- ✅ Boutons ronds (40px diameter)

#### Icônes :
- ✅ Font Awesome utilisé
- ✅ Icônes identiques à Teams

---

## Test 16 : Performance ✅

### Mesures :

1. **Temps de chargement initial :**
   - ✅ < 2 secondes

2. **Latence chat :**
   - ✅ Messages apparaissent instantanément (< 100ms)

3. **Qualité vidéo :**
   - ✅ Vidéo fluide (pas de lag)
   - ✅ Synchronisation audio/vidéo

4. **Utilisation mémoire :**
   - ✅ Stable (pas de fuite mémoire)

---

## Test 17 : Responsive Design ✅

### Actions :
1. Réduire la largeur de la fenêtre

### Résultat attendu :
- ✅ Sur mobile : Grille passe en 1 colonne (4 lignes)
- ✅ Chat devient un overlay
- ✅ Boutons restent accessibles

---

## Test 18 : Historique du chat ✅

### Actions :
1. Alice et Bob discutent (10 messages)
2. Charlie rejoint
3. Charlie ouvre le chat

### Résultat attendu :
- ✅ Charlie voit **tout l'historique** des 10 messages
- ✅ Messages affichés dans l'ordre chronologique
- ✅ Noms et heures corrects

---

## Test 19 : Notifications non lues ✅

### Actions :
1. Charlie a le chat fermé
2. Alice envoie un message
3. Bob envoie un message

### Résultat attendu :
- ✅ Badge rouge apparaît sur le bouton chat de Charlie
- ✅ Badge affiche "2" (2 messages non lus)
- ✅ Quand Charlie ouvre le chat, badge disparaît

---

## Test 20 : Stabilité sur longue durée ✅

### Actions :
1. Laisser la réunion ouverte 10+ minutes
2. Envoyer des messages régulièrement

### Résultat attendu :
- ✅ Connexion reste stable
- ✅ Vidéo continue de fonctionner
- ✅ Chat reste synchronisé
- ✅ Timer de réunion continue (ex: 12:34)
- ✅ Pas de freeze ou crash

---

## 📊 Résultats attendus globaux

| Catégorie | Tests | Statut |
|-----------|-------|--------|
| Installation | 2 | ✅ |
| Interface | 3 | ✅ |
| Connexions | 5 | ✅ |
| Chat | 4 | ✅ |
| Sarah | 3 | ✅ |
| Vidéo | 2 | ✅ |
| Design | 1 | ✅ |
| **TOTAL** | **20** | **✅** |

---

## 🎯 Checklist rapide pour demo

- [ ] `npm install` exécuté
- [ ] `npm start` exécuté
- [ ] 3 onglets ouverts (Alice, Bob, Charlie)
- [ ] Sarah présente et active
- [ ] Chat fonctionne en temps réel
- [ ] Vidéos visibles dans la grille 2x2
- [ ] Design identique à l'image reference.png
- [ ] Résumé généré pour l'hôte à la fin

---

## 🐛 Si un test échoue

1. **Vérifier la console du navigateur** (F12)
2. **Vérifier les logs du serveur** (terminal)
3. **Vérifier les permissions** (caméra/micro)
4. **Redémarrer le serveur** (Ctrl+C puis `npm start`)
5. **Vider le cache du navigateur** (Ctrl+Shift+Del)

---

**Tous les tests passent = Application prête ! 🎉**
