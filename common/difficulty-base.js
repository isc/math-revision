// Système de gestion de difficulté progressive - Classe de base
const MAX_HISTORY = 20

/**
 * Classe de base abstraite pour gérer la difficulté adaptative d'un jeu éducatif.
 * Les sous-classes doivent implémenter generateChallenge() pour générer des défis spécifiques.
 */
class BaseDifficultyManager {
  /**
   * @param {string} storageKey - Clé localStorage pour les données de difficulté
   * @param {string} historyKey - Clé localStorage pour l'historique des réponses
   * @param {Object} levels - Configuration des niveaux de difficulté
   */
  constructor(storageKey, historyKey, levels) {
    if (this.constructor === BaseDifficultyManager) {
      throw new Error('BaseDifficultyManager est une classe abstraite')
    }

    this.storageKey = storageKey
    this.historyKey = historyKey
    this.levels = levels
    this.currentLevel = 1
    this.questionsAtLevel = 0
    this.history = []
    this.maxLevel = Object.keys(levels).length
    this.pendingLevelChange = null // { type: 'upgrade' | 'downgrade', newLevel: number }
    this.load()
  }

  // Charger les données depuis localStorage
  load() {
    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      const data = JSON.parse(stored)
      this.currentLevel = data.currentLevel || 1
      this.questionsAtLevel = data.questionsAtLevel || 0
    }

    const historyStored = localStorage.getItem(this.historyKey)
    if (historyStored) {
      this.history = JSON.parse(historyStored)
    }
  }

  // Sauvegarder les données dans localStorage
  save() {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        currentLevel: this.currentLevel,
        questionsAtLevel: this.questionsAtLevel
      })
    )
    localStorage.setItem(this.historyKey, JSON.stringify(this.history))
  }

  // Obtenir la configuration du niveau actuel
  getCurrentLevel() {
    return this.levels[this.currentLevel]
  }

  /**
   * Méthode abstraite - doit être implémentée par les sous-classes
   * Génère un défi (question, mot, etc.) selon le niveau de difficulté actuel
   * @returns {Object} Le défi généré (format dépend du type de jeu)
   */
  generateChallenge() {
    throw new Error('generateChallenge() doit être implémentée par la sous-classe')
  }

  // Enregistrer une réponse
  recordAnswer(isCorrect, timeInSeconds, metadata = {}) {
    const record = {
      correct: isCorrect,
      time: timeInSeconds,
      ...metadata,
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
      newLevelName: this.levels[this.pendingLevelChange.newLevel].name,
      newLevelIcon: this.levels[this.pendingLevelChange.newLevel].icon
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

// Exporter pour utilisation dans les jeux spécifiques
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BaseDifficultyManager }
}
