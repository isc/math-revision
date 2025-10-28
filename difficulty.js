// Système de gestion de difficulté progressive
const DIFFICULTY_KEY = 'math-revision-difficulty'
const HISTORY_KEY = 'math-revision-history'
const MAX_HISTORY = 20

// Configuration des niveaux de difficulté
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

class DifficultyManager {
  constructor() {
    this.currentLevel = 1
    this.questionsAtLevel = 0
    this.history = []
    this.maxLevel = Object.keys(DIFFICULTY_LEVELS).length
    this.pendingLevelChange = null // { type: 'upgrade' | 'downgrade', newLevel: number }
    this.load()
  }

  // Charger les données depuis localStorage
  load() {
    const stored = localStorage.getItem(DIFFICULTY_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      this.currentLevel = data.currentLevel || 1
      this.questionsAtLevel = data.questionsAtLevel || 0
    }

    const historyStored = localStorage.getItem(HISTORY_KEY)
    if (historyStored) {
      this.history = JSON.parse(historyStored)
    }
  }

  // Sauvegarder les données dans localStorage
  save() {
    localStorage.setItem(
      DIFFICULTY_KEY,
      JSON.stringify({
        currentLevel: this.currentLevel,
        questionsAtLevel: this.questionsAtLevel
      })
    )
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history))
  }

  // Obtenir la configuration du niveau actuel
  getCurrentLevel() {
    return DIFFICULTY_LEVELS[this.currentLevel]
  }

  // Générer une question selon le niveau de difficulté
  generateQuestion() {
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

  // Enregistrer une réponse
  recordAnswer(isCorrect, timeInSeconds, operand) {
    const record = {
      correct: isCorrect,
      time: timeInSeconds,
      operand: operand,
      level: this.currentLevel,
      timestamp: Date.now()
    }

    // Ajouter à l'historique
    this.history.unshift(record)

    // Limiter la taille de l'historique
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY)
    }

    // Incrémenter le compteur de questions au niveau actuel
    this.questionsAtLevel++

    // Évaluer si on doit changer de niveau
    this.evaluateDifficulty()

    // Sauvegarder
    this.save()
  }

  // Calculer le taux de réussite sur les N dernières questions
  getSuccessRate(count = 10) {
    if (this.history.length === 0) return 0

    const recent = this.history.slice(0, Math.min(count, this.history.length))
    const correct = recent.filter(r => r.correct).length
    return (correct / recent.length) * 100
  }

  // Calculer le temps moyen sur les N dernières questions
  getAverageTime(count = 10) {
    if (this.history.length === 0) return 0

    const recent = this.history.slice(0, Math.min(count, this.history.length))
    const total = recent.reduce((sum, r) => sum + r.time, 0)
    return total / recent.length
  }

  // Compter les erreurs consécutives récentes
  getConsecutiveErrors() {
    let count = 0
    for (const record of this.history) {
      if (!record.correct) {
        count++
      } else {
        break
      }
    }
    return count
  }

  // Évaluer et ajuster le niveau de difficulté
  evaluateDifficulty() {
    // Pas assez de données pour évaluer
    if (this.history.length < 5) {
      return
    }

    const successRate = this.getSuccessRate(10)
    const avgTime = this.getAverageTime(10)
    const consecutiveErrors = this.getConsecutiveErrors()
    const level = this.getCurrentLevel()

    // Critères de rétrogradation (prioritaires)
    if (this.currentLevel > 1) {
      // Trop d'erreurs consécutives
      if (consecutiveErrors >= 3) {
        this.markLevelDowngrade()
        return
      }

      // Taux de réussite trop faible sur les 5 dernières
      const recentSuccessRate = this.getSuccessRate(5)
      if (this.history.length >= 5 && recentSuccessRate < 60) {
        this.markLevelDowngrade()
        return
      }
    }

    // Critères de progression
    if (this.currentLevel < this.maxLevel) {
      // Minimum 10 questions au niveau actuel
      if (this.questionsAtLevel < 10) {
        return
      }

      // Taux de réussite élevé
      const hasGoodSuccessRate = successRate >= 80

      // Temps de réponse correct
      const hasGoodTime = avgTime <= level.maxTime

      // Si les deux conditions sont remplies, on marque une montée de niveau en attente
      if (hasGoodSuccessRate && hasGoodTime) {
        this.markLevelUpgrade()
      }
    }
  }

  // Marquer une montée de niveau en attente
  markLevelUpgrade() {
    if (this.currentLevel < this.maxLevel) {
      this.pendingLevelChange = {
        type: 'upgrade',
        newLevel: this.currentLevel + 1
      }
    }
  }

  // Marquer une descente de niveau en attente
  markLevelDowngrade() {
    if (this.currentLevel > 1) {
      this.pendingLevelChange = {
        type: 'downgrade',
        newLevel: this.currentLevel - 1
      }
    }
  }

  // Vérifier s'il y a un changement de niveau en attente
  hasPendingLevelChange() {
    return this.pendingLevelChange !== null
  }

  // Obtenir les informations du niveau en attente
  getPendingLevelChange() {
    if (!this.pendingLevelChange) return null

    return {
      type: this.pendingLevelChange.type,
      newLevel: this.pendingLevelChange.newLevel,
      newLevelName: DIFFICULTY_LEVELS[this.pendingLevelChange.newLevel].name,
      newLevelIcon: DIFFICULTY_LEVELS[this.pendingLevelChange.newLevel].icon
    }
  }

  // Appliquer le changement de niveau en attente
  applyPendingLevelChange() {
    if (!this.pendingLevelChange) return null

    const change = this.getPendingLevelChange()
    this.currentLevel = this.pendingLevelChange.newLevel
    this.questionsAtLevel = 0
    this.pendingLevelChange = null
    this.save()

    return change
  }

  // Annuler le changement de niveau en attente
  cancelPendingLevelChange() {
    this.pendingLevelChange = null
  }

  // Obtenir les statistiques pour l'affichage
  getStats() {
    return {
      level: this.currentLevel,
      levelName: this.getCurrentLevel().name,
      levelIcon: this.getCurrentLevel().icon,
      questionsAtLevel: this.questionsAtLevel,
      successRate: Math.round(this.getSuccessRate(10)),
      averageTime: Math.round(this.getAverageTime(10) * 10) / 10,
      totalQuestions: this.history.length
    }
  }

  // Réinitialiser la progression
  reset() {
    this.currentLevel = 1
    this.questionsAtLevel = 0
    this.history = []
    this.save()
  }
}

// Exporter pour utilisation dans script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DifficultyManager
}
