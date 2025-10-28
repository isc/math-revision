// Configuration Alpine.js
document.addEventListener('alpine:init', () => {
  Alpine.data('gameState', () => ({
    // État du jeu
    valueA: 0,
    valueB: 0,
    operand: '+',
    correctAnswers: 0,
    userAnswer: '',
    gameStarted: false,
    questionText: '',
    completedGameLevel: null, // Niveau du jeu terminé (avant changement)

    // Timer
    startTime: null,
    timerInterval: null,
    timerDisplay: '0:00',
    questionStartTime: null,

    // Difficulté
    difficultyManager: null,
    difficultyStats: {
      levelName: 'Débutant',
      levelIcon: '🌱'
    },

    // Scoreboard
    scoreboard: [],
    finalTimeText: '',

    // Changement de niveau
    levelChange: null,
    completedGameLevelStats: null, // Stats du niveau terminé

    // Initialisation
    init() {
      this.difficultyManager = new DifficultyManager()
      this.updateDifficultyDisplay()

      // Observer pour auto-focus
      this.$watch('gameStarted', value => {
        if (value) {
          this.$nextTick(() => {
            this.$refs.answerInput?.focus()
          })
        }
      })
    },

    // Démarrer le jeu
    startGame() {
      this.gameStarted = true
      this.correctAnswers = 0
      this.startTime = Date.now()
      this.startTimer()
      this.newQuestion()
    },

    // Générer une nouvelle question
    newQuestion() {
      if (!this.gameStarted) return

      if (this.difficultyManager) {
        const question = this.difficultyManager.generateQuestion()
        this.valueA = question.valueA
        this.valueB = question.valueB
        this.operand = question.operand

        // Gérer l'affichage selon le type d'opération
        if (this.operand === '×?') {
          // Division sous forme "a × ? = result"
          this.questionText = `${this.valueA} × ? = ${question.result}`
        } else {
          // Addition ou multiplication normale
          this.questionText = `${this.valueA} ${this.operand} ${this.valueB} = ?`
        }
      } else {
        this.valueA = this.randomInteger()
        this.valueB = this.randomInteger()
        this.operand = ['+', '×'][this.randomInteger() % 2]
        this.questionText = `${this.valueA} ${this.operand} ${this.valueB} = ?`
      }

      this.userAnswer = ''
      this.questionStartTime = Date.now()

      this.$nextTick(() => {
        this.$refs.answerInput?.focus()
      })
    },

    // Vérifier la réponse
    checkAnswer() {
      let correctValue
      if (this.operand === '+') {
        correctValue = this.valueA + this.valueB
      } else if (this.operand === '×') {
        correctValue = this.valueA * this.valueB
      } else if (this.operand === '×?') {
        // Pour la division, la réponse correcte est valueB
        correctValue = this.valueB
      }
      const isCorrect = correctValue == this.userAnswer

      // Calculer le temps de réponse
      const questionEndTime = Date.now()
      const questionTime = this.questionStartTime
        ? (questionEndTime - this.questionStartTime) / 1000
        : 0

      // Enregistrer dans le gestionnaire de difficulté
      if (this.difficultyManager) {
        this.difficultyManager.recordAnswer(
          isCorrect,
          questionTime,
          this.operand
        )
        this.updateDifficultyDisplay()
      }

      if (isCorrect) {
        this.handleCorrectAnswer()
      } else {
        this.handleWrongAnswer()
      }
    },

    // Gérer une bonne réponse
    handleCorrectAnswer() {
      this.correctAnswers++

      // Animation du pouce vers le haut
      this.showThumbsUp()

      // Confettis
      this.showConfetti()

      // Vérifier si objectif atteint
      if (this.correctAnswers >= 10) {
        setTimeout(() => {
          this.showVictory()
        }, 1500)
      } else {
        setTimeout(() => {
          this.newQuestion()
        }, 1000)
      }
    },

    // Gérer une mauvaise réponse
    handleWrongAnswer() {
      this.showAngryFace()
      this.showThumbsDownRain()
    },

    // Afficher la victoire
    showVictory() {
      clearInterval(this.timerInterval)

      const endTime = Date.now()
      const elapsedTime = Math.floor((endTime - this.startTime) / 1000)
      const minutes = Math.floor(elapsedTime / 60)
      const seconds = elapsedTime % 60
      this.finalTimeText =
        minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} secondes`

      // Sauvegarder le niveau et les stats du jeu terminé AVANT tout changement
      this.completedGameLevel = this.difficultyManager.currentLevel
      this.completedGameLevelStats = {
        levelName: this.difficultyStats.levelName,
        levelIcon: this.difficultyStats.levelIcon
      }

      // Sauvegarder et afficher le scoreboard
      this.saveScore(elapsedTime)
      this.loadScoreboard(elapsedTime)
      this.showThumbsUpRain()

      // Vérifier s'il y a un changement de niveau en attente
      if (
        this.difficultyManager &&
        this.difficultyManager.hasPendingLevelChange()
      ) {
        this.levelChange = this.difficultyManager.getPendingLevelChange()
        this.$refs.levelChangeModal.showModal()
      } else {
        this.$refs.congratsModal.showModal()
      }
    },

    // Fermer la modale
    closeModal() {
      this.$refs.congratsModal.close()

      // Réinitialiser
      this.gameStarted = false
      this.correctAnswers = 0
      this.startTime = null
      this.timerInterval = null
      this.questionStartTime = null
      this.timerDisplay = '0:00'
      this.userAnswer = ''
      this.levelChange = null
      this.completedGameLevel = null
      this.completedGameLevelStats = null
    },

    // Fermer l'écran de changement de niveau
    closeLevelChangeScreen() {
      this.$refs.levelChangeModal.close()

      // Appliquer le changement de niveau
      if (this.difficultyManager) {
        this.difficultyManager.applyPendingLevelChange()
        this.updateDifficultyDisplay()
      }

      // Afficher la modale de félicitations
      this.$refs.congratsModal.showModal()
    },

    // Timer
    startTimer() {
      this.timerInterval = setInterval(() => {
        this.updateTimerDisplay()
      }, 100)
    },

    updateTimerDisplay() {
      if (this.startTime === null) {
        this.timerDisplay = '0:00'
        return
      }

      const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      this.timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`
    },

    // Mise à jour de l'affichage de difficulté
    updateDifficultyDisplay() {
      if (!this.difficultyManager) return

      const stats = this.difficultyManager.getStats()
      this.difficultyStats = {
        levelName: stats.levelName,
        levelIcon: stats.levelIcon
      }
    },

    // Gestion du scoreboard
    saveScore(timeInSeconds) {
      const scoreboard = this.getScoreboard()
      const currentLevel = this.difficultyManager.currentLevel

      scoreboard.push({
        time: timeInSeconds,
        date: new Date().toISOString(),
        level: currentLevel
      })

      // Garder les 10 meilleurs scores PAR NIVEAU
      const scoresByLevel = {}
      scoreboard.forEach(score => {
        // Ignorer les anciens scores sans niveau
        if (!score.level) return

        const level = score.level
        if (!scoresByLevel[level]) {
          scoresByLevel[level] = []
        }
        scoresByLevel[level].push(score)
      })

      // Garder top 10 pour chaque niveau
      const topScores = []
      Object.keys(scoresByLevel).forEach(level => {
        const levelScores = scoresByLevel[level]
          .sort((a, b) => a.time - b.time)
          .slice(0, 10)
        topScores.push(...levelScores)
      })

      localStorage.setItem(
        'math-revision-scoreboard',
        JSON.stringify(topScores)
      )
    },

    getScoreboard() {
      const stored = localStorage.getItem('math-revision-scoreboard')
      return stored ? JSON.parse(stored) : []
    },

    loadScoreboard(currentTime) {
      const allScores = this.getScoreboard()
      const currentLevel = this.difficultyManager.currentLevel

      // Filtrer les scores pour le niveau actuel uniquement
      const levelScores = allScores
        .filter(score => score.level === currentLevel)
        .sort((a, b) => a.time - b.time)

      this.scoreboard = levelScores.map((score, index) => ({
        ...score,
        isCurrent:
          score.time === currentTime &&
          index === levelScores.findIndex(s => s.time === currentTime)
      }))
    },

    // Utilitaires de formatage
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      return minutes > 0 ? `${minutes} min ${secs} sec` : `${seconds} sec`
    },

    formatDate(isoString) {
      const date = new Date(isoString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return "Aujourd'hui"
      if (diffDays === 1) return 'Hier'
      if (diffDays < 7) return `Il y a ${diffDays} jours`

      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      })
    },

    randomInteger() {
      return Math.round(Math.random() * 10)
    },

    // Animations
    showThumbsUp() {
      const thumbsUp = document.getElementById('thumbs-up')
      thumbsUp.style.visibility = 'visible'
      thumbsUp.style.animation = 'thumbsAnimation 2s ease-out'

      setTimeout(() => {
        thumbsUp.style.visibility = 'hidden'
        thumbsUp.style.animation = 'none'
      }, 2000)
    },

    showAngryFace() {
      const angryFace = document.getElementById('angry-face')
      angryFace.style.visibility = 'visible'
      angryFace.style.animation = 'angryAnimation 2s ease-out'

      setTimeout(() => {
        angryFace.style.visibility = 'hidden'
        angryFace.style.animation = 'none'
      }, 2000)
    },

    showConfetti() {
      // Confettis depuis le coin bas gauche
      confetti({
        particleCount: 100,
        angle: 45,
        spread: 70,
        origin: { x: 0, y: 1 },
        ticks: 300,
        gravity: 0.5,
        scalar: 1.2
      })

      // Confettis depuis le coin bas droit
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 135,
          spread: 70,
          origin: { x: 1, y: 1 },
          ticks: 300,
          gravity: 0.5,
          scalar: 1.2
        })
      }, 100)

      // Confettis supplémentaires depuis le coin bas gauche
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 1 },
          ticks: 300,
          gravity: 0.5,
          scalar: 1.2
        })
      }, 200)

      // Confettis supplémentaires depuis le coin bas droit
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 1 },
          ticks: 300,
          gravity: 0.5,
          scalar: 1.2
        })
      }, 200)
    },

    showThumbsUpRain() {
      const duration = 3000
      const animationEnd = Date.now() + duration

      const thumbsUpRain = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(thumbsUpRain)
          return
        }

        const thumb = document.createElement('div')
        thumb.className = 'thumbs-up-rain'
        thumb.textContent = '👍'
        thumb.style.left = Math.random() * 100 + '%'
        thumb.style.bottom = '0'
        thumb.style.animationDuration = Math.random() * 1.5 + 1.5 + 's'

        const modal = this.$refs.congratsModal
        modal.appendChild(thumb)

        setTimeout(() => {
          thumb.remove()
        }, 3500)
      }, 150)
    },

    showThumbsDownRain() {
      const duration = 2000
      const animationEnd = Date.now() + duration

      const thumbsDownRain = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(thumbsDownRain)
          return
        }

        const thumb = document.createElement('div')
        thumb.className = 'thumbs-down-rain'
        thumb.textContent = '👎'
        thumb.style.left = Math.random() * 100 + '%'
        thumb.style.top = '-100px'
        thumb.style.animationDuration = Math.random() * 1.5 + 1.5 + 's'

        document.body.appendChild(thumb)

        setTimeout(() => {
          thumb.remove()
        }, 3500)
      }, 150)
    }
  }))
})
