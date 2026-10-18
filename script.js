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
        } else if (this.operand === '÷') {
          // Division avec vraie notation "result ÷ a = ?"
          this.questionText = `${question.result} ÷ ${this.valueA} = ?`
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
      } else if (this.operand === '×?' || this.operand === '÷') {
        // Pour les divisions (les deux notations), la réponse correcte est valueB
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
      showThumbsUp()

      // Confettis
      showConfetti()

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
      showAngryFace()
      showThumbsDownRain()
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
      saveScore('math-revision-scoreboard', elapsedTime, this.difficultyManager.currentLevel)
      this.scoreboard = loadScoreboard('math-revision-scoreboard', this.difficultyManager.currentLevel, elapsedTime)
      showThumbsUpRain(this.$refs.congratsModal)

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

    // Wrappers pour les fonctions de game-core.js (utilisées dans les templates)
    formatTime(seconds) {
      return formatTime(seconds)
    },

    formatDate(isoString) {
      return formatDate(isoString)
    },

    randomInteger() {
      return Math.round(Math.random() * 10)
    }

    // Note: Les autres fonctions (animations, scoreboard) sont maintenant dans game-core.js
  }))
})
