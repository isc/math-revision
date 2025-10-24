// Système de gestion de difficulté progressive
const DIFFICULTY_KEY = 'math-revision-difficulty'
const HISTORY_KEY = 'math-revision-history'
const MAX_HISTORY = 20

// Configuration des niveaux de difficulté
const DIFFICULTY_LEVELS = {
  1: {
    name: 'Débutant',
    additionWeight: 80,
    multiplicationTables: [2, 5, 10], // Tables faciles
    icon: '🌱',
    maxTime: 8,
    minValue: 0, // Permet +0, ×0, +1, ×1
    maxValue: 10
  },
  2: {
    name: 'Apprenti',
    additionWeight: 60,
    multiplicationTables: [2, 5, 10],
    icon: '🌿',
    maxTime: 7,
    minValue: 0, // Permet +0, ×0, +1, ×1
    maxValue: 10
  },
  3: {
    name: 'Intermédiaire',
    additionWeight: 40,
    multiplicationTables: [2, 3, 4, 5, 6, 10],
    icon: '🌳',
    maxTime: 6,
    minValue: 0, // Permet +0, ×0, +1, ×1
    maxValue: 10
  },
  4: {
    name: 'Avancé',
    additionWeight: 30,
    multiplicationTables: [2, 3, 4, 5, 6, 10], // Toutes sauf 7, 8, 9
    icon: '⭐',
    maxTime: 5,
    minValue: 1, // Exclut +0 et ×0, mais permet +1 et ×1
    maxValue: 10
  },
  5: {
    name: 'Expert',
    additionWeight: 15,
    multiplicationTables: [2, 3, 4, 5, 6, 7, 8, 9, 10], // Toutes
    icon: '🏆',
    maxTime: 5,
    minValue: 2, // Exclut +0, ×0, +1, ×1
    maxValue: 10
  }
}

class DifficultyManager {
  constructor() {
    this.currentLevel = 1
    this.questionsAtLevel = 0
    this.history = []
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

    let operand, valueA, valueB

    // Déterminer le type d'opération selon les poids
    if (random < level.additionWeight) {
      // Addition
      operand = '+'
      valueA = Math.floor(Math.random() * range) + level.minValue
      valueB = Math.floor(Math.random() * range) + level.minValue
    } else {
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
    }

    return { valueA, valueB, operand }
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
        this.downgradeLevel()
        return
      }

      // Taux de réussite trop faible sur les 5 dernières
      const recentSuccessRate = this.getSuccessRate(5)
      if (this.history.length >= 5 && recentSuccessRate < 60) {
        this.downgradeLevel()
        return
      }
    }

    // Critères de progression
    if (this.currentLevel < 5) {
      // Minimum 10 questions au niveau actuel
      if (this.questionsAtLevel < 10) {
        return
      }

      // Taux de réussite élevé
      const hasGoodSuccessRate = successRate >= 80

      // Temps de réponse correct
      const hasGoodTime = avgTime <= level.maxTime

      // Si les deux conditions sont remplies, on monte de niveau
      if (hasGoodSuccessRate && hasGoodTime) {
        this.upgradeLevel()
      }
    }
  }

  // Monter d'un niveau
  upgradeLevel() {
    if (this.currentLevel < 5) {
      this.currentLevel++
      this.questionsAtLevel = 0
      console.log(`🎉 Niveau augmenté : ${this.getCurrentLevel().name}`)

      // Notifier l'utilisateur
      this.showLevelUpNotification()
    }
  }

  // Descendre d'un niveau
  downgradeLevel() {
    if (this.currentLevel > 1) {
      this.currentLevel--
      this.questionsAtLevel = 0
      console.log(`📉 Niveau diminué : ${this.getCurrentLevel().name}`)

      // Notifier l'utilisateur
      this.showLevelDownNotification()
    }
  }

  // Afficher une notification de montée de niveau
  showLevelUpNotification() {
    const level = this.getCurrentLevel()
    const notification = document.createElement('article')
    notification.className = 'level-notification'
    notification.innerHTML = `
      <strong>${level.icon} Niveau supérieur !</strong>
      <p>${level.name}</p>
    `
    document.body.appendChild(notification)

    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('show')
    }, 10)

    // Retirer après 3 secondes
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => {
        notification.remove()
      }, 500)
    }, 3000)

    // Confettis pour célébrer
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  // Afficher une notification de descente de niveau
  showLevelDownNotification() {
    const level = this.getCurrentLevel()
    const notification = document.createElement('article')
    notification.className = 'level-notification'
    notification.innerHTML = `
      <strong>${level.icon} Retour au niveau précédent</strong>
      <p>${level.name} - Continue, tu vas y arriver !</p>
    `
    document.body.appendChild(notification)

    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('show')
    }, 10)

    // Retirer après 3 secondes
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => {
        notification.remove()
      }, 500)
    }, 3000)
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
