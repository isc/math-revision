let valueA
let valueB
let operand
let correctAnswers = 0
let startTime = null
let timerInterval = null
let questionStartTime = null // Timer pour chaque question individuelle
let difficultyManager = null // Gestionnaire de difficulté

// Gestion du scoreboard
const SCOREBOARD_KEY = 'math-revision-scoreboard'
const MAX_SCORES = 10

function getScoreboard() {
  const stored = localStorage.getItem(SCOREBOARD_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveScore(timeInSeconds) {
  const scoreboard = getScoreboard()

  // Ajouter le nouveau score avec timestamp
  scoreboard.push({
    time: timeInSeconds,
    date: new Date().toISOString()
  })

  // Trier par temps (du plus rapide au plus lent)
  scoreboard.sort((a, b) => a.time - b.time)

  // Garder seulement les 10 meilleurs
  const topScores = scoreboard.slice(0, MAX_SCORES)

  // Sauvegarder dans localStorage
  localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(topScores))

  return topScores
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes} min ${secs} sec`
  }
  return `${seconds} sec`
}

function formatDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Aujourd'hui"
  } else if (diffDays === 1) {
    return 'Hier'
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }
}

function displayScoreboard(currentTime) {
  const scoreboard = getScoreboard()
  const scoreboardBody = document.getElementById('scoreboard-body')
  scoreboardBody.innerHTML = ''

  if (scoreboard.length === 0) {
    scoreboardBody.innerHTML =
      '<tr><td colspan="3">Aucun score enregistré</td></tr>'
    return
  }

  scoreboard.forEach((score, index) => {
    const tr = document.createElement('tr')
    const isCurrentScore =
      score.time === currentTime &&
      index === scoreboard.findIndex(s => s.time === currentTime)

    if (isCurrentScore) {
      tr.classList.add('current-score')
    }

    const rank = index === 0 ? '👑' : index + 1
    const badge = isCurrentScore ? ' 🆕' : ''

    tr.innerHTML = `
      <td>${rank}</td>
      <td><strong>${formatTime(score.time)}</strong>${badge}</td>
      <td>${formatDate(score.date)}</td>
    `

    scoreboardBody.appendChild(tr)
  })
}

function randomInteger() {
  return Math.round(Math.random() * 10)
}

// Mettre à jour l'affichage du niveau de difficulté
function updateDifficultyDisplay() {
  const stats = difficultyManager.getStats()
  const levelDisplay = document.getElementById('difficulty-level')

  if (levelDisplay) {
    levelDisplay.textContent = `${stats.levelIcon} ${stats.levelName}`
  }

  // Mettre à jour les statistiques si l'élément existe
  const statsDisplay = document.getElementById('difficulty-stats')
  if (statsDisplay) {
    statsDisplay.textContent = `Questions: ${stats.questionsAtLevel} | Réussite: ${stats.successRate}% | Temps moyen: ${stats.averageTime}s`
  }
}

function updateTimerDisplay() {
  if (startTime === null) {
    document.getElementById('timer-display').textContent = '0:00'
    return
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  document.getElementById('timer-display').textContent =
    `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function checkAnswer() {
  const value = document.querySelector('input').value
  const correctValue = operand == '+' ? valueA + valueB : valueA * valueB
  const isCorrect = correctValue == value

  // Calculer le temps de réponse pour cette question
  const questionEndTime = Date.now()
  const questionTime = questionStartTime
    ? (questionEndTime - questionStartTime) / 1000
    : 0

  // Enregistrer la réponse dans le gestionnaire de difficulté
  if (difficultyManager) {
    difficultyManager.recordAnswer(isCorrect, questionTime, operand)
    updateDifficultyDisplay()
  }

  if (isCorrect) {
    // Incrémenter le score d'abord
    correctAnswers++
    document.getElementById('score').textContent = correctAnswers
    document.getElementById('progress-bar').value = correctAnswers

    // Démarrer le timer à la première bonne réponse
    if (correctAnswers === 1) {
      startTime = Date.now()
      timerInterval = setInterval(updateTimerDisplay, 100)
    }

    // Afficher le pouce vers le haut
    const thumbsUp = document.getElementById('thumbs-up')
    thumbsUp.style.visibility = 'visible'
    thumbsUp.style.animation = 'thumbsAnimation 2s ease-out'

    // Cacher le pouce après l'animation
    setTimeout(() => {
      thumbsUp.style.visibility = 'hidden'
      thumbsUp.style.animation = 'none'
    }, 2000)

    // Animation de confettis depuis le coin bas gauche
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

    // Vérifier si l'objectif est atteint
    if (correctAnswers >= 10) {
      console.log('🎉 Objectif atteint ! Déclenchement des animations...')
      const endTime = Date.now()
      const elapsedTime = Math.floor((endTime - startTime) / 1000)
      const minutes = Math.floor(elapsedTime / 60)
      const seconds = elapsedTime % 60
      const timeString =
        minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} secondes`

      // Sauvegarder le score
      saveScore(elapsedTime)

      setTimeout(() => {
        clearInterval(timerInterval)
        document.getElementById('final-time').textContent = timeString
        // Afficher le scoreboard avec le temps actuel mis en évidence
        displayScoreboard(elapsedTime)
        document.getElementById('congratulations-modal').showModal()
      }, 1500)

      // Pluie de pouces vers le haut
      console.log('👍 Démarrage de la pluie de pouces vers le haut')
      const duration = 3000
      const animationEnd = Date.now() + duration

      const thumbsUpRain = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(thumbsUpRain)
          return
        }

        // Créer un emoji 👍 qui monte
        const thumb = document.createElement('div')
        thumb.className = 'thumbs-up-rain'
        thumb.textContent = '👍'
        thumb.style.left = Math.random() * 100 + '%'
        thumb.style.bottom = '0'
        thumb.style.animationDuration = Math.random() * 1.5 + 1.5 + 's'

        // Ajouter dans la modale pour passer par-dessus
        const modal = document.getElementById('congratulations-modal')
        modal.appendChild(thumb)
        console.log('👍 Pouce ajouté à la position', thumb.style.left)

        // Supprimer l'élément après l'animation
        setTimeout(() => {
          thumb.remove()
        }, 3500)
      }, 150)

      // Ne pas appeler newQuestion tout de suite, on attend la modale
    } else {
      // Pas encore 10, on continue avec une nouvelle question
      setTimeout(newQuestion, 1000)
    }
  } else {
    // Afficher l'emoji en colère
    const angryFace = document.getElementById('angry-face')
    angryFace.style.visibility = 'visible'
    angryFace.style.animation = 'angryAnimation 2s ease-out'

    // Cacher l'emoji après l'animation
    setTimeout(() => {
      angryFace.style.visibility = 'hidden'
      angryFace.style.animation = 'none'
    }, 2000)

    // Pluie de pouces vers le bas
    const duration = 2000
    const animationEnd = Date.now() + duration

    const thumbsDownRain = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(thumbsDownRain)
        return
      }

      // Créer un emoji 👎 qui tombe
      const thumb = document.createElement('div')
      thumb.className = 'thumbs-down-rain'
      thumb.textContent = '👎'
      thumb.style.left = Math.random() * 100 + '%'
      thumb.style.top = '-100px'
      thumb.style.animationDuration = Math.random() * 1.5 + 1.5 + 's'

      document.body.appendChild(thumb)

      // Supprimer l'élément après l'animation
      setTimeout(() => {
        thumb.remove()
      }, 3500)
    }, 150)
  }
}

function newQuestion() {
  // Utiliser le gestionnaire de difficulté pour générer une question adaptée
  if (difficultyManager) {
    const question = difficultyManager.generateQuestion()
    valueA = question.valueA
    valueB = question.valueB
    operand = question.operand
  } else {
    // Fallback si le gestionnaire n'est pas initialisé
    valueA = randomInteger()
    valueB = randomInteger()
    operand = ['+', '×'][randomInteger() % 2]
  }

  document.querySelector('.question-title').innerText =
    `${valueA} ${operand} ${valueB} = ?`
  document.querySelector('input').value = ''

  // Démarrer le chronomètre pour cette question
  questionStartTime = Date.now()
}

function closeModal() {
  document.getElementById('congratulations-modal').close()
  correctAnswers = 0
  startTime = null
  timerInterval = null
  questionStartTime = null
  document.getElementById('score').textContent = correctAnswers
  document.getElementById('progress-bar').value = correctAnswers
  updateTimerDisplay()
  newQuestion()
}

// Initialiser le gestionnaire de difficulté au chargement
document.addEventListener('DOMContentLoaded', () => {
  difficultyManager = new DifficultyManager()
  updateDifficultyDisplay()
  newQuestion() // Démarrer avec une première question APRÈS l'initialisation
})
