# Jeux Éducatifs - Mathématiques & Orthographe

Deux jeux éducatifs interactifs pour réviser les mathématiques et l'orthographe française avec un système adaptatif de difficulté.

## 🎮 Jeux Disponibles

### 1. Jeu de Mathématiques (`index.html`)
- Additions et multiplications adaptatives
- 8 niveaux de difficulté
- Progression automatique selon les performances
- Scoreboard par niveau

### 2. Jeu d'Orthographe (`spelling.html`)
- 240 mots répartis sur 8 niveaux
- Images minimalistes pour chaque mot
- Progression du phonétique pur aux mots complexes
- Validation insensible à la casse mais sensible aux accents

## 🏗️ Architecture

Le projet utilise une architecture mutualisée pour réduire la duplication de code:

```
├── common/
│   ├── difficulty-base.js    # Classe parent pour la gestion de difficulté
│   └── game-core.js           # Fonctions partagées (animations, timer, scoreboard)
├── data/
│   └── word-lists.js          # 240 mots pour l'orthographe
├── images/
│   └── level1-8/              # Images générées (à créer)
├── tests/
│   ├── math-game.spec.js      # Tests Playwright pour les maths
│   └── spelling-game.spec.js  # Tests Playwright pour l'orthographe
├── scripts/
│   └── generate-images.js     # Script de génération d'images
├── index.html                 # Jeu de mathématiques
├── spelling.html              # Jeu d'orthographe
├── difficulty.js              # Gestion de difficulté (maths)
├── spelling-difficulty.js     # Gestion de difficulté (orthographe)
├── script.js                  # Logique du jeu (maths)
├── spelling-script.js         # Logique du jeu (orthographe)
├── style.css                  # Styles partagés
└── spelling-style.css         # Styles spécifiques orthographe
```

## 🚀 Installation

1. **Cloner le projet**
```bash
cd /Users/ivanschneider/Code/math-revision
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la génération d'images** (pour le jeu d'orthographe)
```bash
cp .env.example .env
# Éditer .env et ajouter votre clé API (Google ou OpenAI)
```

## 📸 Génération des Images

Les images pour le jeu d'orthographe doivent être générées avec un service d'IA:

```bash
# Avec Google Imagen (recommandé)
npm run generate-images

# Ou manuellement
node scripts/generate-images.js
```

**Note**: La génération de 240 images peut prendre ~8-10 minutes avec rate limiting.

### Configuration requise

Créez un fichier `.env` avec:
```bash
# Option 1: Google Vertex AI / Imagen
GOOGLE_API_KEY=your-api-key
GOOGLE_CLOUD_PROJECT=your-project-id

# Option 2: OpenAI DALL-E
OPENAI_API_KEY=your-api-key
```

## 🎯 Utilisation

### Lancer les jeux

1. **Démarrer un serveur HTTP local**
```bash
npm run serve
# ou
python3 -m http.server 8000
```

2. **Ouvrir dans le navigateur**
- Mathématiques: http://localhost:8000/index.html
- Orthographe: http://localhost:8000/spelling.html

### Lancer les tests

```bash
# Installer Playwright
npx playwright install

# Exécuter tous les tests
npm test

# Interface UI interactive
npm run test:ui
```

## 📊 Système de Difficulté

Les deux jeux utilisent un système adaptatif avec 8 niveaux:

### Critères de montée de niveau
- ✅ Taux de réussite ≥ 80% (sur les 10 dernières questions)
- ✅ Temps moyen ≤ temps max du niveau
- ✅ Minimum 10 questions au niveau actuel

### Critères de descente de niveau
- ❌ 3 erreurs consécutives
- ❌ Taux de réussite < 60% (sur les 5 dernières questions)

## 🎓 Niveaux d'Orthographe

1. **Grande Section (🫘)** - 2-4 lettres, phonétique pure (sac, bus, bol...)
2. **Débutant (🌱)** - Sons simples (ou, ch, on)
3. **Apprenti (🌿)** - Accents simples (é)
4. **Intermédiaire (🌳)** - Diphtongues (ou, ai, au, eau)
5. **Avancé (⭐)** - Sons complexes (on, an, in, un, oi)
6. **Expert (🏆)** - Lettres muettes, sons complexes (tion, ail)
7. **Expert Diphtongues (🎓)** - Diphtongues complexes (euil, ouil, ail), cédille
8. **Master (🏅)** - Mots les plus difficiles

## 🛠️ Technologies Utilisées

- **Alpine.js** - Réactivité et state management
- **Pico CSS** - Styles minimaux et élégants
- **Canvas Confetti** - Animations de célébration
- **Playwright** - Tests end-to-end
- **Google Imagen / OpenAI DALL-E** - Génération d'images

## 📝 Code Mutualisé

### common/difficulty-base.js
Classe abstraite `BaseDifficultyManager` contenant:
- Gestion de l'historique des réponses
- Calcul du taux de réussite et temps moyen
- Logique d'évaluation pour la montée/descente de niveau
- Persistance dans localStorage

### common/game-core.js
Fonctions partagées:
- Animations (confetti, pouces, émojis)
- Gestion du timer
- Scoreboard (sauvegarde, chargement, formatage)

## 🧪 Tests

Les tests Playwright vérifient:
- ✅ Chargement correct des pages
- ✅ Démarrage du jeu
- ✅ Validation des réponses
- ✅ Progression correcte
- ✅ Fonctionnement du timer
- ✅ Gestion des erreurs

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues! Pour contribuer:

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrez une Pull Request

## 🎨 Personnalisation

### Ajouter de nouveaux mots

Éditez `data/word-lists.js` et ajoutez vos mots:

```javascript
{
  word: 'nouveaumot',
  image: 'level1/nouveaumot.png'
}
```

Puis régénérez les images correspondantes.

### Modifier les niveaux de difficulté

Éditez les constantes dans `difficulty.js` (maths) ou `spelling-difficulty.js` (orthographe):

```javascript
{
  name: 'Nom du niveau',
  icon: '🎯',
  maxTime: 15,  // temps maximum par question
  // ... autres paramètres
}
```

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
