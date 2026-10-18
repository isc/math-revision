// Système de gestion de difficulté pour le jeu de mathématiques
// Étend BaseDifficultyManager avec la génération de questions mathématiques

const MATH_DIFFICULTY_KEY = 'math-revision-difficulty'
const MATH_HISTORY_KEY = 'math-revision-history'

// Configuration des niveaux de difficulté pour les mathématiques
const DIFFICULTY_LEVELS = {
  1: {
    name: 'Grande Section',
    additionWeight: 90,
    multiplicationWeight: 10,
    divisionWeight: 0,
    realDivisionWeight: 0,
    multiplicationTables: [0, 1, 2], // Tables très faciles
    icon: '🫘',
    maxTime: 10,
    minValue: 0,
    maxValue: 7
  },
  2: {
    name: 'Débutant',
    additionWeight: 80,
    multiplicationWeight: 20,
    divisionWeight: 0,
    realDivisionWeight: 0,
    multiplicationTables: [2, 5, 10], // Tables faciles
    icon: '🌱',
    maxTime: 8,
    minValue: 0, // Permet +0, ×0, +1, ×1
    maxValue: 10
  },
  3: {
    name: 'Apprenti',
    additionWeight: 60,
    multiplicationWeight: 40,
    divisionWeight: 0,
    realDivisionWeight: 0,
    multiplicationTables: [2, 5, 10],
    icon: '🌿',
    maxTime: 7,
    minValue: 0, // Permet +0, ×0, +1, ×1
    maxValue: 10
  },
  4: {
    name: 'Intermédiaire',
    additionWeight: 40,
    multiplicationWeight: 60,
    divisionWeight: 0,
    realDivisionWeight: 0,
    multiplicationTables: [2, 3, 4, 5, 6, 10],
    icon: '🌳',
    maxTime: 6,
    minValue: 0, // Permet +0, ×0, +1, ×1
    maxValue: 10
  },
  5: {
    name: 'Avancé',
    additionWeight: 30,
    multiplicationWeight: 70,
    divisionWeight: 0,
    realDivisionWeight: 0,
    multiplicationTables: [2, 3, 4, 5, 6, 10], // Toutes sauf 7, 8, 9
    icon: '⭐',
    maxTime: 5,
    minValue: 1, // Exclut +0 et ×0, mais permet +1 et ×1
    maxValue: 10
  },
  6: {
    name: 'Expert',
    additionWeight: 15,
    multiplicationWeight: 85,
    divisionWeight: 0,
    realDivisionWeight: 0,
    multiplicationTables: [3, 4, 5, 6, 7, 8, 9, 10], // Toutes
    icon: '🏆',
    maxTime: 5,
    minValue: 3,
    maxValue: 10
  },
  7: {
    name: 'Division (Expert)',
    additionWeight: 0,
    multiplicationWeight: 20,
    divisionWeight: 80,
    realDivisionWeight: 0,
    multiplicationTables: [2, 3, 4, 5, 6, 10],
    icon: '🎓',
    maxTime: 8,
    minValue: 2,
    maxValue: 10
  },
  8: {
    name: 'Division Master',
    additionWeight: 0,
    multiplicationWeight: 10,
    divisionWeight: 0,
    realDivisionWeight: 90, // Vraie notation ÷
    multiplicationTables: [3, 4, 5, 6, 7, 8, 9, 10],
    icon: '🏅',
    maxTime: 6,
    minValue: 2,
    maxValue: 10
  }
}

class DifficultyManager extends BaseDifficultyManager {
  constructor() {
    super(MATH_DIFFICULTY_KEY, MATH_HISTORY_KEY, DIFFICULTY_LEVELS)
  }

  // Implémentation de la méthode abstraite generateChallenge()
  // Génère une question mathématique selon le niveau de difficulté
  generateChallenge() {
    const level = this.getCurrentLevel()
    const random = Math.random() * 100
    const range = level.maxValue - level.minValue + 1

    let operand, valueA, valueB, result

    // Déterminer le type d'opération selon les poids
    if (random < level.additionWeight) {
      // Addition
      operand = '+'
      valueA = Math.floor(Math.random() * range) + level.minValue
      valueB = Math.floor(Math.random() * range) + level.minValue
    } else if (random < level.additionWeight + level.multiplicationWeight) {
      // Multiplication
      operand = '×'
      // Choisir une table parmi celles autorisées au niveau actuel
      const tables = level.multiplicationTables
      valueA = tables[Math.floor(Math.random() * tables.length)]
      valueB = Math.floor(Math.random() * range) + level.minValue

      // Parfois inverser pour varier
      if (Math.random() > 0.5) {
        ;[valueA, valueB] = [valueB, valueA]
      }
    } else if (
      random <
      level.additionWeight + level.multiplicationWeight + level.divisionWeight
    ) {
      // Division (sous forme "a × ? = result")
      operand = '×?'
      // Choisir une table parmi celles autorisées au niveau actuel
      const tables = level.multiplicationTables
      valueA = tables[Math.floor(Math.random() * tables.length)]
      valueB = Math.floor(Math.random() * range) + level.minValue

      // Le résultat est a × b, et on cherche b
      result = valueA * valueB
      // On garde valueB comme réponse attendue
    } else {
      // Division avec vraie notation (result ÷ a = ?)
      operand = '÷'
      // Choisir une table parmi celles autorisées au niveau actuel
      const tables = level.multiplicationTables
      valueA = tables[Math.floor(Math.random() * tables.length)]
      valueB = Math.floor(Math.random() * range) + level.minValue

      // Le résultat est a × b, on divise result par a pour trouver b
      result = valueA * valueB
      // On garde valueB comme réponse attendue
    }

    return { valueA, valueB, operand, result }
  }

  // Méthode de compatibilité pour l'ancien code
  generateQuestion() {
    return this.generateChallenge()
  }
}

// Exporter pour utilisation dans script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DifficultyManager
}
