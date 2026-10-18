// Fonctions partagées pour les jeux éducatifs
// Animations, timer, scoreboard

// ============================================
// ANIMATIONS
// ============================================

/**
 * Affiche des confettis animés depuis les coins bas de l'écran
 */
function showConfetti() {
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
}

/**
 * Affiche une animation de pouce levé
 */
function showThumbsUp() {
  const thumbsUp = document.getElementById('thumbs-up')
  if (!thumbsUp) return

  thumbsUp.style.visibility = 'visible'
  thumbsUp.style.animation = 'thumbsAnimation 2s ease-out'

  setTimeout(() => {
    thumbsUp.style.visibility = 'hidden'
    thumbsUp.style.animation = 'none'
  }, 2000)
}

/**
 * Affiche une animation de visage en colère
 */
function showAngryFace() {
  const angryFace = document.getElementById('angry-face')
  if (!angryFace) return

  angryFace.style.visibility = 'visible'
  angryFace.style.animation = 'angryAnimation 2s ease-out'

  setTimeout(() => {
    angryFace.style.visibility = 'hidden'
    angryFace.style.animation = 'none'
  }, 2000)
}

/**
 * Affiche une pluie de pouces levés dans un conteneur
 * @param {HTMLElement} container - L'élément dans lequel afficher la pluie (ex: modal)
 */
function showThumbsUpRain(container) {
  if (!container) container = document.body

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

    container.appendChild(thumb)

    setTimeout(() => {
      thumb.remove()
    }, 3500)
  }, 150)
}

/**
 * Affiche une pluie de pouces baissés
 */
function showThumbsDownRain() {
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

// ============================================
// TIMER
// ============================================

/**
 * Formate un temps écoulé en millisecondes en chaîne mm:ss
 * @param {number} elapsedMs - Temps écoulé en millisecondes
 * @returns {string} Temps formaté (ex: "1:05", "0:42")
 */
function formatTimerDisplay(elapsedMs) {
  const elapsed = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// ============================================
// SCOREBOARD
// ============================================

/**
 * Sauvegarde un score dans localStorage
 * @param {string} storageKey - Clé localStorage pour le scoreboard
 * @param {number} timeInSeconds - Temps réalisé en secondes
 * @param {number} level - Niveau auquel le score a été réalisé
 */
function saveScore(storageKey, timeInSeconds, level) {
  const scoreboard = getScoreboard(storageKey)

  scoreboard.push({
    time: timeInSeconds,
    date: new Date().toISOString(),
    level: level
  })

  // Garder les 10 meilleurs scores PAR NIVEAU
  const scoresByLevel = {}
  scoreboard.forEach(score => {
    // Ignorer les anciens scores sans niveau
    if (!score.level) return

    const lvl = score.level
    if (!scoresByLevel[lvl]) {
      scoresByLevel[lvl] = []
    }
    scoresByLevel[lvl].push(score)
  })

  // Garder top 10 pour chaque niveau
  const topScores = []
  Object.keys(scoresByLevel).forEach(lvl => {
    const levelScores = scoresByLevel[lvl]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10)
    topScores.push(...levelScores)
  })

  localStorage.setItem(storageKey, JSON.stringify(topScores))
}

/**
 * Récupère tous les scores depuis localStorage
 * @param {string} storageKey - Clé localStorage pour le scoreboard
 * @returns {Array} Tableau des scores
 */
function getScoreboard(storageKey) {
  const stored = localStorage.getItem(storageKey)
  return stored ? JSON.parse(stored) : []
}

/**
 * Charge le scoreboard pour un niveau spécifique
 * @param {string} storageKey - Clé localStorage pour le scoreboard
 * @param {number} level - Niveau à filtrer
 * @param {number} currentTime - Temps actuel pour marquer le score courant
 * @returns {Array} Tableau des scores pour ce niveau, triés par temps
 */
function loadScoreboard(storageKey, level, currentTime) {
  const allScores = getScoreboard(storageKey)

  // Filtrer les scores pour le niveau actuel uniquement
  const levelScores = allScores
    .filter(score => score.level === level)
    .sort((a, b) => a.time - b.time)

  return levelScores.map((score, index) => ({
    ...score,
    isCurrent:
      score.time === currentTime &&
      index === levelScores.findIndex(s => s.time === currentTime)
  }))
}

/**
 * Formate un temps en secondes en chaîne lisible
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté (ex: "2 min 15 sec", "42 sec")
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return minutes > 0 ? `${minutes} min ${secs} sec` : `${seconds} sec`
}

/**
 * Formate une date ISO en chaîne relative lisible
 * @param {string} isoString - Date au format ISO
 * @returns {string} Date formatée (ex: "Aujourd'hui", "Il y a 3 jours", "15 jan")
 */
function formatDate(isoString) {
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
}

// Exporter pour utilisation dans les jeux
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showConfetti,
    showThumbsUp,
    showAngryFace,
    showThumbsUpRain,
    showThumbsDownRain,
    formatTimerDisplay,
    saveScore,
    getScoreboard,
    loadScoreboard,
    formatTime,
    formatDate
  }
}
