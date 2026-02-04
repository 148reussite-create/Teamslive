# ⚡ COMMANDES ESSENTIELLES

Guide rapide de toutes les commandes pour utiliser l'application.

---

## 🚀 INSTALLATION ET DÉMARRAGE

### Installation des dépendances

```bash
npm install
```

**Ce qui est installé :**
- express (serveur web)
- socket.io (WebSocket)
- openai (IA pour Sarah - optionnel)
- nodemon (développement)

---

### Démarrer le serveur

#### Mode production :
```bash
npm start
```

#### Mode développement (auto-reload) :
```bash
npm run dev
```

#### Windows (double-clic) :
```
START.bat
```

---

### Arrêter le serveur

Dans le terminal :
```
Ctrl + C
```

---

## 🌐 ACCÈS À L'APPLICATION

### Local (tests) :
```
http://localhost:3000
```

### Réseau local (même WiFi) :
```
http://192.168.X.X:3000
```

Remplacez `192.168.X.X` par votre IP locale :

**Windows :**
```bash
ipconfig
```
Cherchez "Adresse IPv4"

**Mac/Linux :**
```bash
ifconfig
```
Cherchez "inet"

---

## 🔧 CONFIGURATION

### Changer le port

**Dans server.js :**
```javascript
const PORT = process.env.PORT || 3000; // Changez 3000
```

**Puis redémarrez :**
```bash
npm start
```

---

### Changer le nombre de participants

**Dans server.js, ligne 8 :**
```javascript
const MAX_PARTICIPANTS = 4; // Changez à 6, 8, 10...
```

---

## 📦 GESTION DES DÉPENDANCES

### Ajouter une nouvelle dépendance

```bash
npm install nom-du-package
```

Exemple :
```bash
npm install cors
```

---

### Mettre à jour les dépendances

```bash
npm update
```

---

### Supprimer node_modules (nettoyage)

**Windows :**
```bash
rmdir /s /q node_modules
```

**Mac/Linux :**
```bash
rm -rf node_modules
```

Puis réinstaller :
```bash
npm install
```

---

## 🐛 DEBUGGING

### Voir les logs du serveur

Les logs s'affichent automatiquement dans le terminal où vous avez lancé `npm start`.

**Messages typiques :**
```
Serveur démarré sur http://localhost:3000
Alice a rejoint (socket_id_123)
Bob a rejoint (socket_id_456)
Bob s'est déconnecté
```

---

### Voir les logs du client

Dans le navigateur :
```
F12 (ou Cmd+Opt+I sur Mac)
→ Onglet "Console"
```

**Messages typiques :**
```
Nouvel utilisateur connecté: socket_id_123
Offre reçue de socket_id_456
Track reçu de socket_id_789
```

---

### Mode verbose (plus de logs)

**Dans app.js, ajoutez des console.log :**
```javascript
console.log('Debug:', variable);
```

---

## 🧪 TESTS

### Test rapide

1. Ouvrir 3 onglets sur `http://localhost:3000`
2. Connecter Alice, Bob, Charlie
3. Vérifier que tout fonctionne

---

### Test complet (20 tests)

Suivez le fichier **TEST.md** :
```bash
# Ouvrez TEST.md et suivez les 20 tests
```

---

### Test de charge (stress test)

Ouvrir 10+ onglets rapidement :
- Les 4 premiers se connectent
- Les suivants voient "Réunion complète"

---

## 🌐 DÉPLOIEMENT

### Initialiser Git

```bash
git init
git add .
git commit -m "Initial commit - Teams clone app"
```

---

### Pousser sur GitHub

```bash
git remote add origin https://github.com/VOTRE_USERNAME/teams-clone.git
git push -u origin main
```

---

### Déployer sur Render

**Via l'interface web :**
1. Allez sur [render.com](https://render.com)
2. New Web Service
3. Connectez le repo GitHub
4. Configurez :
   - Build: `npm install`
   - Start: `npm start`

**En ligne de commande (optionnel) :**
```bash
# Installer Render CLI
npm install -g render

# Login
render login

# Deploy
render deploy
```

---

### Déployer sur Railway

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialiser
railway init

# Deploy
railway up
```

---

### Déployer sur Heroku

```bash
# Installer Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Créer app
heroku create teams-clone-votrenom

# Push
git push heroku main

# Ouvrir
heroku open

# Voir logs
heroku logs --tail
```

---

## 📁 FICHIERS ET DOSSIERS

### Voir l'arborescence

**Windows :**
```bash
tree /F
```

**Mac/Linux :**
```bash
tree
```

**Sans commande tree :**
```bash
ls -R
```

---

### Taille du projet

**Windows :**
```bash
dir
```

**Mac/Linux :**
```bash
du -sh .
```

**Sans node_modules :**
```bash
du -sh --exclude=node_modules .
```

---

## 🔍 RECHERCHE DANS LE CODE

### Trouver un texte

**Windows (PowerShell) :**
```bash
Select-String -Path *.js -Pattern "texte à chercher"
```

**Mac/Linux :**
```bash
grep -r "texte à chercher" .
```

---

### Trouver un fichier

**Windows :**
```bash
dir /s /b fichier.js
```

**Mac/Linux :**
```bash
find . -name "fichier.js"
```

---

## 🎨 PERSONNALISATION

### Changer la couleur principale

**Dans styles.css :**
```css
/* Cherchez toutes les occurrences de #292929 */
background-color: #292929; /* Nouvelle couleur */
```

**Chercher/Remplacer :**
```
Chercher: #292929
Remplacer: #123456
```

---

### Changer le nom de l'app

**Dans index.html, ligne 5 :**
```html
<title>Votre nom d'app</title>
```

**Dans server.js (logs) :**
```javascript
console.log('Serveur Votre nom démarré...');
```

---

## 📊 MONITORING

### Voir les connexions actives

**Logs serveur affichent automatiquement :**
```
Alice a rejoint
Bob a rejoint
Charlie a rejoint
```

---

### Voir l'utilisation CPU/RAM

**Windows (Task Manager) :**
```
Ctrl + Shift + Esc
→ Cherchez "node.exe"
```

**Mac (Activity Monitor) :**
```
Cmd + Space → "Activity Monitor"
→ Cherchez "node"
```

**Linux :**
```bash
top
# ou
htop
```

---

## 🔧 MAINTENANCE

### Nettoyer les fichiers temporaires

**Windows :**
```bash
del /s /q *.log
```

**Mac/Linux :**
```bash
rm -rf *.log
```

---

### Backup du projet

```bash
# Créer une archive
tar -czf teams-clone-backup.tar.gz .

# Ou avec zip (Windows)
powershell Compress-Archive -Path . -DestinationPath teams-clone-backup.zip
```

---

### Restaurer le backup

```bash
# Extraire tar.gz
tar -xzf teams-clone-backup.tar.gz

# Ou avec zip
powershell Expand-Archive -Path teams-clone-backup.zip -DestinationPath .
```

---

## 🛠️ DÉPANNAGE

### Erreur "port already in use"

**Tuer le processus sur le port 3000 :**

**Windows :**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux :**
```bash
lsof -ti:3000 | xargs kill -9
```

---

### Erreur "module not found"

**Réinstaller les dépendances :**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Vider le cache npm

```bash
npm cache clean --force
```

---

### Réinitialiser le projet

```bash
# 1. Supprimer node_modules
rm -rf node_modules

# 2. Supprimer package-lock.json
rm package-lock.json

# 3. Réinstaller
npm install

# 4. Redémarrer
npm start
```

---

## 📝 GIT

### Commandes de base

```bash
# Voir le statut
git status

# Voir les changements
git diff

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Description des changements"

# Push
git push

# Pull (récupérer les changements)
git pull

# Voir l'historique
git log

# Créer une branche
git checkout -b nom-de-branche

# Changer de branche
git checkout main
```

---

### .gitignore

**Déjà configuré dans le projet :**
```
node_modules/
.env
*.log
.DS_Store
```

---

## 🔒 SÉCURITÉ

### Variables d'environnement

**Créer un fichier .env :**
```bash
# .env
OPENAI_API_KEY=votre_clé_ici
PORT=3000
```

**Utiliser dans server.js :**
```javascript
require('dotenv').config();
const apiKey = process.env.OPENAI_API_KEY;
```

**Installer dotenv :**
```bash
npm install dotenv
```

---

### HTTPS en local (optionnel)

**Générer certificat SSL :**
```bash
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

**Dans server.js :**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

https.createServer(options, app).listen(3000);
```

---

## 📚 DOCUMENTATION

### Générer la documentation (JSDoc)

**Installer JSDoc :**
```bash
npm install -g jsdoc
```

**Générer :**
```bash
jsdoc server.js public/app.js -d docs
```

---

## 🚀 PERFORMANCE

### Analyser la taille du bundle

```bash
npm install -g webpack-bundle-analyzer
```

---

### Compression (production)

**Installer compression :**
```bash
npm install compression
```

**Dans server.js :**
```javascript
const compression = require('compression');
app.use(compression());
```

---

## 📊 STATISTIQUES

### Compter les lignes de code

**Windows (PowerShell) :**
```bash
(Get-Content *.js).Length
```

**Mac/Linux :**
```bash
wc -l *.js
```

**Tous les fichiers :**
```bash
find . -name "*.js" -o -name "*.css" -o -name "*.html" | xargs wc -l
```

---

## 🎯 RACCOURCIS UTILES

### Dans le terminal

- `Ctrl + C` : Arrêter le serveur
- `Ctrl + L` : Effacer le terminal
- `↑ / ↓` : Naviguer dans l'historique des commandes
- `Tab` : Auto-complétion

---

### Dans le navigateur

- `F12` : Ouvrir DevTools
- `Ctrl + Shift + I` : Ouvrir DevTools
- `Ctrl + Shift + C` : Sélectionner un élément
- `Ctrl + R` : Recharger la page
- `Ctrl + Shift + R` : Recharger en vidant le cache

---

## 📞 AIDE

### Commandes d'aide

```bash
# Aide npm
npm help

# Aide sur une commande spécifique
npm help install

# Version de Node.js
node --version

# Version de npm
npm --version

# Liste des packages installés
npm list
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

```bash
# 1. Vérifier que tout fonctionne en local
npm start

# 2. Commiter tous les changements
git add .
git commit -m "Ready for deployment"

# 3. Pousser sur GitHub
git push origin main

# 4. Déployer sur Render/Railway/Heroku
# (Suivre DEPLOIEMENT.md)

# 5. Tester l'URL de production
# https://votre-app.onrender.com

# 6. Vérifier les logs
# Dashboard de la plateforme de déploiement
```

---

## 🎉 RÉSUMÉ DES COMMANDES ESSENTIELLES

```bash
# Installation
npm install

# Démarrage
npm start

# Développement
npm run dev

# Tests
# Ouvrir http://localhost:3000 dans 3 onglets

# Git
git add .
git commit -m "message"
git push

# Déploiement
# Voir DEPLOIEMENT.md
```

---

**Toutes les commandes dont vous avez besoin ! 🚀**

**Consultez ce fichier quand vous avez un doute sur une commande.**
