// Système de gestion de difficulté pour le jeu d'orthographe
// Étend BaseDifficultyManager avec la génération de mots

const SPELLING_DIFFICULTY_KEY = 'spelling-revision-difficulty'
const SPELLING_HISTORY_KEY = 'spelling-revision-history'

// Configuration des niveaux de difficulté pour l'orthographe
const SPELLING_DIFFICULTY_LEVELS = {
  1: {
    name: 'Grande Section',
    icon: '🫘',
    maxTime: 20,  // secondes par mot
    minWordLength: 2,
    maxWordLength: 4
  },
  2: {
    name: 'Débutant',
    icon: '🌱',
    maxTime: 18,
    minWordLength: 3,
    maxWordLength: 5
  },
  3: {
    name: 'Apprenti',
    icon: '🌿',
    maxTime: 16,
    minWordLength: 4,
    maxWordLength: 6
  },
  4: {
    name: 'Intermédiaire',
    icon: '🌳',
    maxTime: 15,
    minWordLength: 5,
    maxWordLength: 8
  },
  5: {
    name: 'Avancé',
    icon: '⭐',
    maxTime: 14,
    minWordLength: 6,
    maxWordLength: 9
  },
  6: {
    name: 'Expert',
    icon: '🏆',
    maxTime: 13,
    minWordLength: 7,
    maxWordLength: 13
  },
  7: {
    name: 'Expert Diphtongues',
    icon: '🎓',
    maxTime: 12,
    minWordLength: 5,
    maxWordLength: 12
  },
  8: {
    name: 'Master',
    icon: '🏅',
    maxTime: 15,
    minWordLength: 5,
    maxWordLength: 15
  }
}

class SpellingDifficultyManager extends BaseDifficultyManager {
  constructor() {
    super(
      SPELLING_DIFFICULTY_KEY,
      SPELLING_HISTORY_KEY,
      SPELLING_DIFFICULTY_LEVELS
    )
    this.recentWords = []
  }

  // Implémentation de la méthode abstraite generateChallenge()
  // Génère un mot à orthographier selon le niveau de difficulté
  generateChallenge() {
    const wordList = SPELLING_WORD_LISTS[this.currentLevel].words

    if (!wordList || wordList.length === 0) {
      console.error(`Pas de mots pour le niveau ${this.currentLevel}`)
      return {
        word: 'erreur',
        imagePath: 'level1/erreur.png',
        level: this.currentLevel
      }
    }

    // Sélection aléatoire en évitant les 5 derniers mots
    let selectedWord
    let attempts = 0
    const maxAttempts = wordList.length * 2

    do {
      const randomIndex = Math.floor(Math.random() * wordList.length)
      selectedWord = wordList[randomIndex]
      attempts++
    } while (
      this.recentWords.includes(selectedWord.word) &&
      attempts < maxAttempts
    )

    // Ajouter à l'historique des mots récents
    this.recentWords.push(selectedWord.word)
    if (this.recentWords.length > 5) {
      this.recentWords.shift()
    }

    return {
      word: selectedWord.word,
      imagePath: selectedWord.image,
      level: this.currentLevel
    }
  }

  // Méthode de compatibilité si nécessaire
  generateWord() {
    return this.generateChallenge()
  }
}

// Exporter pour utilisation dans spelling-script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpellingDifficultyManager, SPELLING_DIFFICULTY_LEVELS }
}
