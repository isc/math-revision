// Configuration Alpine.js pour le jeu d'orthographe
document.addEventListener('alpine:init', () => {
  Alpine.data('spellingGameState', () => ({
    // État du jeu d'orthographe
    currentWord: '',
    currentImagePath: '',
    correctAnswers: 0,
    userAnswer: '',
    gameStarted: false,
    showCorrectWordModal: false,
    correctWordDisplay: '',
    completedGameLevel: null,

    // Timer
    startTime: null,
    timerInterval: null,
    timerDisplay: '0:00',
    questionStartTime: null,

    // Difficulté
    difficultyManager: null,
    difficultyStats: {
      levelName: 'Grande Section',
      levelIcon: '🫘'
    },

    // Scoreboard
    scoreboard: [],
    finalTimeText: '',

    // Changement de niveau
    levelChange: null,
    completedGameLevelStats: null,

    // Initialisation
    init() {
      this.difficultyManager = new SpellingDifficultyManager()
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

    // Générer un nouveau mot à orthographier
    newQuestion() {
      if (!this.gameStarted) return

      if (this.difficultyManager) {
        const challenge = this.difficultyManager.generateChallenge()
        this.currentWord = challenge.word
        this.currentImagePath = challenge.imagePath
      } else {
        this.currentWord = 'erreur'
        this.currentImagePath = 'level1/erreur.png'
      }

      this.userAnswer = ''
      this.questionStartTime = Date.now()

      this.$nextTick(() => {
        this.$refs.answerInput?.focus()
      })
    },

    // Vérifier la réponse
    checkAnswer() {
      const isCorrect = this.validateAnswer(this.userAnswer, this.currentWord)

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
          {
            wordLength: this.currentWord.length,
            hasAccents: this.hasAccents(this.currentWord)
          }
        )
        this.updateDifficultyDisplay()
      }

      if (isCorrect) {
        this.handleCorrectAnswer()
      } else {
        this.handleWrongAnswer()
      }
    },

    // Valider la réponse
    validateAnswer(userInput, correctWord) {
      // Normalisation : case-insensitive mais accent-sensitive
      const normalizedUser = userInput.trim().toLowerCase()
      const normalizedCorrect = correctWord.toLowerCase()

      // Comparaison exacte
      return normalizedUser === normalizedCorrect
    },

    // Vérifier si un mot contient des accents
    hasAccents(word) {
      return /[àâäéèêëïîôùûüÿç]/i.test(word)
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
      this.showCorrectAnswer(this.currentWord)
      showAngryFace()
      showThumbsDownRain()
    },

    // Afficher le mot correct
    showCorrectAnswer(correctWord) {
      this.correctWordDisplay = correctWord
      this.showCorrectWordModal = true

      setTimeout(() => {
        this.showCorrectWordModal = false
        this.newQuestion()
      }, 2500)
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
      saveScore('spelling-revision-scoreboard', elapsedTime, this.difficultyManager.currentLevel)
      this.scoreboard = loadScoreboard('spelling-revision-scoreboard', this.difficultyManager.currentLevel, elapsedTime)
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
    }

    // Note: Les autres fonctions (animations, scoreboard) sont dans game-core.js
  }))
})
