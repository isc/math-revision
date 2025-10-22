let valueA;
let valueB;
let operand;
let correctAnswers = 0;
let startTime = null;
let timerInterval = null;

function randomInteger() {
  return Math.round(Math.random() * 10);
}

function updateTimerDisplay() {
  if (startTime === null) {
    document.getElementById("timer-display").textContent = "0:00";
    return;
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById("timer-display").textContent =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function checkAnswer() {
  const value = document.querySelector("input").value;
  const correctValue = operand == "+" ? valueA + valueB : valueA * valueB;
  const isCorrect = correctValue == value;

  if (isCorrect) {
    // Incrémenter le score d'abord
    correctAnswers++;
    document.getElementById("score").textContent = correctAnswers;
    document.getElementById("progress-bar").value = correctAnswers;

    // Démarrer le timer à la première bonne réponse
    if (correctAnswers === 1) {
      startTime = Date.now();
      timerInterval = setInterval(updateTimerDisplay, 100);
    }

    // Afficher le pouce vers le haut
    const thumbsUp = document.getElementById("thumbs-up");
    thumbsUp.style.visibility = "visible";
    thumbsUp.style.animation = "thumbsAnimation 2s ease-out";

    // Cacher le pouce après l'animation
    setTimeout(() => {
      thumbsUp.style.visibility = "hidden";
      thumbsUp.style.animation = "none";
    }, 2000);

    // Animation de confettis depuis le coin bas gauche
    confetti({
      particleCount: 100,
      angle: 45,
      spread: 70,
      origin: { x: 0, y: 1 },
      ticks: 300,
      gravity: 0.5,
      scalar: 1.2,
    });

    // Confettis depuis le coin bas droit
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 135,
        spread: 70,
        origin: { x: 1, y: 1 },
        ticks: 300,
        gravity: 0.5,
        scalar: 1.2,
      });
    }, 100);

    // Confettis supplémentaires depuis le coin bas gauche
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        ticks: 300,
        gravity: 0.5,
        scalar: 1.2,
      });
    }, 200);

    // Confettis supplémentaires depuis le coin bas droit
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        ticks: 300,
        gravity: 0.5,
        scalar: 1.2,
      });
    }, 200);

    // Vérifier si l'objectif est atteint
    if (correctAnswers >= 10) {
      console.log("🎉 Objectif atteint ! Déclenchement des animations...");
      const endTime = Date.now();
      const elapsedTime = Math.floor((endTime - startTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      const timeString =
        minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} secondes`;

      setTimeout(() => {
        clearInterval(timerInterval);
        document.getElementById("final-time").textContent = timeString;
        document.getElementById("congratulations-modal").showModal();
      }, 1500);

      // Pluie de pouces vers le haut
      console.log("👍 Démarrage de la pluie de pouces vers le haut");
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const thumbsUpRain = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(thumbsUpRain);
          return;
        }

        // Créer un emoji 👍 qui monte
        const thumb = document.createElement("div");
        thumb.className = "thumbs-up-rain";
        thumb.textContent = "👍";
        thumb.style.left = Math.random() * 100 + "%";
        thumb.style.bottom = "0";
        thumb.style.animationDuration = Math.random() * 1.5 + 1.5 + "s";

        // Ajouter dans la modale pour passer par-dessus
        const modal = document.getElementById("congratulations-modal");
        modal.appendChild(thumb);
        console.log("👍 Pouce ajouté à la position", thumb.style.left);

        // Supprimer l'élément après l'animation
        setTimeout(() => {
          thumb.remove();
        }, 3500);
      }, 150);

      // Ne pas appeler newQuestion tout de suite, on attend la modale
    } else {
      // Pas encore 10, on continue avec une nouvelle question
      setTimeout(newQuestion, 1000);
    }
  } else {
    // Afficher l'emoji en colère
    const angryFace = document.getElementById("angry-face");
    angryFace.style.visibility = "visible";
    angryFace.style.animation = "angryAnimation 2s ease-out";

    // Cacher l'emoji après l'animation
    setTimeout(() => {
      angryFace.style.visibility = "hidden";
      angryFace.style.animation = "none";
    }, 2000);

    // Pluie de pouces vers le bas
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const thumbsDownRain = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(thumbsDownRain);
        return;
      }

      // Créer un emoji 👎 qui tombe
      const thumb = document.createElement("div");
      thumb.className = "thumbs-down-rain";
      thumb.textContent = "👎";
      thumb.style.left = Math.random() * 100 + "%";
      thumb.style.top = "-100px";
      thumb.style.animationDuration = Math.random() * 1.5 + 1.5 + "s";

      document.body.appendChild(thumb);

      // Supprimer l'élément après l'animation
      setTimeout(() => {
        thumb.remove();
      }, 3500);
    }, 150);
  }
}

function newQuestion() {
  valueA = randomInteger();
  valueB = randomInteger();
  operand = ["+", "×"][randomInteger() % 2];
  document.querySelector(".question-title").innerText =
    `${valueA} ${operand} ${valueB} = ?`;
  document.querySelector("input").value = "";
}

function closeModal() {
  document.getElementById("congratulations-modal").close();
  correctAnswers = 0;
  startTime = null;
  timerInterval = null;
  document.getElementById("score").textContent = correctAnswers;
  document.getElementById("progress-bar").value = correctAnswers;
  updateTimerDisplay();
  newQuestion();
}

newQuestion();
