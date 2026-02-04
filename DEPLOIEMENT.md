# 🌐 GUIDE DE DÉPLOIEMENT EN LIGNE

Ce guide vous montre comment déployer votre application Teams Clone en ligne pour que d'autres puissent y accéder depuis Internet.

---

## 🎯 Options de déploiement (GRATUITES)

1. **Render** - ⭐ Recommandé (le plus simple)
2. **Railway** - Très facile
3. **Heroku** - Populaire mais nécessite carte bancaire
4. **Glitch** - Idéal pour les tests

---

## Option 1 : Render (RECOMMANDÉ) ⭐

### Avantages :
- ✅ 100% gratuit (pas de carte bancaire)
- ✅ HTTPS automatique
- ✅ Déploiement en 5 minutes
- ✅ Support WebRTC parfait

### Étapes :

#### 1. Créer un compte GitHub (si pas déjà fait)
1. Allez sur [github.com](https://github.com)
2. Créez un compte gratuit

#### 2. Créer un repository
1. Cliquez sur "New repository"
2. Nom : `teams-clone` (ou autre)
3. Visibilité : Public
4. Cliquez "Create repository"

#### 3. Pousser le code sur GitHub

Ouvrez un terminal dans le dossier `reference` :

```bash
git init
git add .
git commit -m "Initial commit - Teams clone app"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/teams-clone.git
git push -u origin main
```

**Remplacez** `VOTRE_USERNAME` par votre nom d'utilisateur GitHub !

#### 4. Déployer sur Render

1. Allez sur [render.com](https://render.com)
2. Créez un compte (avec GitHub)
3. Cliquez **"New +"** → **"Web Service"**
4. Connectez votre repository `teams-clone`
5. Configuration :
   - **Name** : `teams-clone`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : `Free`
6. Cliquez **"Create Web Service"**

#### 5. Attendez le déploiement
- ⏳ Render installe les dépendances (1-2 minutes)
- ✅ Votre app sera accessible sur : `https://teams-clone-XXXX.onrender.com`

**C'EST FAIT ! 🎉**

---

## Option 2 : Railway

### Avantages :
- ✅ Gratuit (500h/mois)
- ✅ HTTPS automatique
- ✅ Interface moderne

### Étapes :

1. Allez sur [railway.app](https://railway.app)
2. Créez un compte (avec GitHub)
3. Cliquez **"New Project"** → **"Deploy from GitHub repo"**
4. Sélectionnez votre repository `teams-clone`
5. Railway détecte automatiquement Node.js
6. Cliquez **"Deploy"**

Votre app sera sur : `https://XXXX.up.railway.app`

---

## Option 3 : Heroku

### Avantages :
- ✅ Très populaire
- ✅ Documentation complète

### Inconvénients :
- ❌ Nécessite une carte bancaire (même plan gratuit)

### Étapes :

1. Allez sur [heroku.com](https://heroku.com)
2. Créez un compte
3. Installez Heroku CLI :
   - Windows : [Télécharger](https://devcenter.heroku.com/articles/heroku-cli)

4. Dans le terminal :

```bash
heroku login
heroku create teams-clone-votrenom
git push heroku main
heroku open
```

Votre app sera sur : `https://teams-clone-votrenom.herokuapp.com`

---

## Option 4 : Glitch (Test rapide)

### Avantages :
- ✅ Aucune configuration
- ✅ Éditeur en ligne
- ✅ Parfait pour tester

### Inconvénients :
- ❌ L'app s'endort après 5 min d'inactivité

### Étapes :

1. Allez sur [glitch.com](https://glitch.com)
2. Créez un compte
3. Cliquez **"New Project"** → **"Import from GitHub"**
4. Collez l'URL de votre repo GitHub
5. Glitch importe et démarre automatiquement

Votre app sera sur : `https://XXXX.glitch.me`

---

## 📋 Configuration importante pour la production

### Ajouter un fichier Procfile (pour Heroku uniquement)

Créez un fichier `Procfile` (sans extension) :

```
web: node server.js
```

### Variables d'environnement

Si vous utilisez des clés API (OpenAI pour Sarah), créez un fichier `.env` :

```
OPENAI_API_KEY=votre_clé_ici
```

**⚠️ IMPORTANT :** Ajoutez `.env` dans `.gitignore` (déjà fait) pour ne pas exposer vos clés !

Dans Render/Railway/Heroku, ajoutez les variables d'environnement dans le dashboard.

---

## 🔒 HTTPS et WebRTC

### Pourquoi HTTPS est nécessaire ?

WebRTC **exige HTTPS** pour accéder à la caméra/micro en production.

**Bonne nouvelle :** Render, Railway, Heroku et Glitch fournissent tous HTTPS automatiquement ! ✅

---

## 🌍 Serveurs TURN (pour connexions complexes)

### Problème :
En local, WebRTC fonctionne parfaitement. En production, certains utilisateurs derrière des firewalls/NAT ne peuvent pas se connecter.

### Solution : Serveurs TURN

Les serveurs TURN relaient la vidéo quand la connexion P2P échoue.

### Services TURN gratuits :

1. **Metered TURN** - [metered.ca](https://www.metered.ca/tools/openrelay/)
   - Gratuit jusqu'à 50 Go/mois

2. **Twilio TURN** - [twilio.com](https://www.twilio.com/stun-turn)
   - Compte gratuit disponible

### Configuration :

Dans `public/app.js`, ligne 4, remplacez :

```javascript
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Ajoutez vos serveurs TURN ici
        {
            urls: 'turn:VOTRE_SERVEUR_TURN:3478',
            username: 'votre_username',
            credential: 'votre_password'
        }
    ]
};
```

---

## 🧪 Tester votre déploiement

### Checklist :

1. ✅ L'URL fonctionne (https://votre-app.onrender.com)
2. ✅ Interface Teams s'affiche
3. ✅ Connexion avec plusieurs onglets fonctionne
4. ✅ Caméra/micro accessible (autoriser dans le navigateur)
5. ✅ Chat en temps réel fonctionne
6. ✅ Sarah apparaît et fonctionne
7. ✅ Résumé généré pour l'hôte

### Test multi-utilisateurs réels :

1. Ouvrez l'URL sur votre PC
2. Demandez à un ami d'ouvrir l'URL sur son PC
3. Vérifiez que vous vous voyez mutuellement

---

## 📊 Monitoring et logs

### Render :
- Dashboard → Votre service → Onglet "Logs"
- Voir les connexions en temps réel

### Railway :
- Dashboard → Votre projet → Onglet "Deployments" → "View Logs"

### Heroku :
```bash
heroku logs --tail
```

---

## 🚀 Optimisations pour la production

### 1. Compression des assets

Ajoutez dans `server.js` :

```javascript
const compression = require('compression');
app.use(compression());
```

Puis :
```bash
npm install compression
```

### 2. Rate limiting (protection anti-spam)

```bash
npm install express-rate-limit
```

Dans `server.js` :

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Max 100 requêtes par IP
});

app.use(limiter);
```

### 3. Variables d'environnement

Dans `server.js`, ligne 10 :

```javascript
const PORT = process.env.PORT || 3000;
```

✅ Déjà fait !

---

## 🌟 Partager votre app

Une fois déployée, partagez simplement l'URL :

```
https://teams-clone-XXXX.onrender.com
```

**Tips :**
- Créez un nom de domaine personnalisé (optionnel)
- Ajoutez un favicon
- Créez une landing page avec instructions

---

## 🔗 Nom de domaine personnalisé (optionnel)

### Render :
1. Achetez un domaine (Namecheap, Google Domains)
2. Dashboard Render → Settings → Custom Domain
3. Suivez les instructions DNS

### Railway :
1. Dashboard → Settings → Domains
2. Ajoutez votre domaine

---

## ⚡ Performance en production

### Attendu :
- **Latence chat :** < 100ms
- **Qualité vidéo :** 720p à 30fps
- **Participants simultanés :** 4 (comme configuré)
- **Uptime :** 99.9% (Render/Railway/Heroku)

---

## 🐛 Problèmes courants en production

### ❌ "Application error" ou "503 Service Unavailable"

**Causes possibles :**
- Port mal configuré (doit utiliser `process.env.PORT`)
- Dépendances manquantes
- Build échoué

**Solution :**
1. Vérifiez les logs
2. Assurez-vous que `package.json` contient toutes les dépendances
3. Vérifiez `"start": "node server.js"` dans `package.json`

### ❌ WebRTC ne fonctionne pas

**Cause :** Pas de serveur TURN configuré

**Solution :**
1. Ajoutez des serveurs TURN (voir section plus haut)
2. Testez avec 2 utilisateurs sur réseaux différents

### ❌ "Cross-Origin Request Blocked"

**Solution :** Ajoutez CORS dans `server.js` :

```javascript
const cors = require('cors');
app.use(cors());
```

```bash
npm install cors
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Render :** [community.render.com](https://community.render.com)
2. **Railway :** [help.railway.app](https://help.railway.app)
3. **Heroku :** [help.heroku.com](https://help.heroku.com)

---

## 🎉 Résumé - Déploiement en 5 min

```bash
# 1. Initialiser Git
git init
git add .
git commit -m "Initial commit"

# 2. Pousser sur GitHub
git remote add origin https://github.com/VOTRE_USERNAME/teams-clone.git
git push -u origin main

# 3. Aller sur render.com → New Web Service → Connecter le repo

# 4. Attendre le déploiement

# 5. C'EST EN LIGNE ! 🚀
```

**Votre app Teams est maintenant accessible depuis partout dans le monde ! 🌍**

---

**Besoin d'aide ? Consultez les logs et la documentation officielle de votre plateforme.**
