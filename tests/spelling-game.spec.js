const { test, expect } = require('@playwright/test')

test.describe('Jeu d\'Orthographe', () => {
  test.beforeEach(async ({ page }) => {
    // Charger la page du jeu d'orthographe
    await page.goto('http://localhost:8000/spelling.html')
  })

  test('La page se charge correctement', async ({ page }) => {
    // Vérifier le titre
    await expect(page).toHaveTitle(/Orthographe/)

    // Vérifier que l'indicateur de niveau est visible
    await expect(page.locator('main > h4').first()).toBeVisible()
    await expect(page.locator('main > h4').first()).toContainText('Grande Section')
  })

  test('Le bouton de démarrage est visible', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Démarrer' })).toBeVisible()
    await expect(page.locator('text=/Écris correctement les mots/')).toBeVisible()
  })

  test('Le jeu démarre quand on clique sur démarrer', async ({ page }) => {
    // Cliquer sur démarrer
    await page.click('button:has-text("Démarrer")')

    // Attendre que le jeu démarre
    await page.waitForTimeout(200)

    // Vérifier que la barre de progression est visible
    await expect(page.locator('progress')).toBeVisible()

    // Vérifier que le timer est visible
    await expect(page.locator('.timer-section label')).toBeVisible()

    // Vérifier que le conteneur d'image est visible
    await expect(page.locator('.word-image-container')).toBeVisible()

    // Vérifier que l'input de réponse est visible et de type text
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="text"]')).toHaveAttribute('placeholder', /Écris le mot/)
  })

  test('On peut entrer du texte dans l\'input', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Entrer un mot test
    await page.fill('input[type="text"]', 'test')

    // Vérifier que le texte est bien entré
    const inputValue = await page.locator('input[type="text"]').inputValue()
    expect(inputValue).toBe('test')
  })

  test('On peut soumettre une réponse', async ({ page }) => {
    test.setTimeout(90000) // Timeout étendu car on peut essayer jusqu'à 30 mots

    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Le mot actuel devrait être un mot du niveau 1
    // Pour ce test, on va essayer tous les mots du niveau 1
    const level1Words = [
      'boa', 'ara', 'puma', 'lama',
      'sac', 'bus', 'bol', 'arc', 'axe', 'vis', 'fil', 'ski', 'box',
      'pile', 'rame', 'lime', 'sofa', 'judo', 'soda', 'kiwi',
      'lac', 'mur', 'sol', 'bar',
      'car', 'taxi', 'auto',
      'zoo', 'ami', 'tutu'
    ]

    let answered = false
    for (const word of level1Words) {
      // Entrer le mot
      await page.fill('input[type="text"]', word)
      await page.click('button:has-text("Vérifier")')

      // Attendre un peu pour que la validation se fasse
      await page.waitForTimeout(300)

      // Vérifier si la progression a augmenté (bonne réponse)
      const progressText = await page.locator('text=/Progression\\s*:\\s*(\\d+)\\s*\\/\\s*10/').textContent()
      const currentProgress = parseInt(progressText.match(/(\d+)/)[1])

      if (currentProgress === 1) {
        answered = true
        break
      }

      // Si pas la bonne réponse, attendre que la modale se ferme (2500ms) avant de réessayer
      await page.waitForTimeout(2600)
    }

    // On devrait avoir trouvé au moins une bonne réponse parmi les mots du niveau 1
    expect(answered).toBe(true)
  })

  test('Une mauvaise réponse affiche le mot correct', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Entrer une mauvaise réponse
    await page.fill('input[type="text"]', 'motinexistant123')
    await page.click('button:has-text("Vérifier")')

    // Attendre que la modale de correction apparaisse
    await page.waitForTimeout(300)

    // Vérifier que la modale est visible
    await expect(page.locator('dialog[open]')).toBeVisible()
    await expect(page.locator('text=/Presque/')).toBeVisible()
    await expect(page.locator('text=/La bonne réponse était/')).toBeVisible()

    // Vérifier que le mot correct est affiché
    await expect(page.locator('.correct-word')).toBeVisible()

    // Attendre que la modale se ferme automatiquement
    await page.waitForTimeout(2600)

    // Vérifier qu'une nouvelle question est affichée
    await expect(page.locator('input[type="text"]')).toBeVisible()
    const inputValue = await page.locator('input[type="text"]').inputValue()
    expect(inputValue).toBe('') // L'input devrait être vide
  })

  test('La validation est insensible à la casse', async ({ page }) => {
    test.setTimeout(90000) // Timeout étendu car on peut essayer jusqu'à 30 mots

    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Essayer tous les mots du niveau 1 en majuscules
    const level1Words = [
      'BOA', 'ARA', 'PUMA', 'LAMA',
      'SAC', 'BUS', 'BOL', 'ARC', 'AXE', 'VIS', 'FIL', 'SKI', 'BOX',
      'PILE', 'RAME', 'LIME', 'SOFA', 'JUDO', 'SODA', 'KIWI',
      'LAC', 'MUR', 'SOL', 'BAR',
      'CAR', 'TAXI', 'AUTO',
      'ZOO', 'AMI', 'TUTU'
    ]

    let answered = false
    for (const word of level1Words) {
      await page.fill('input[type="text"]', word)
      await page.click('button:has-text("Vérifier")')
      await page.waitForTimeout(300)

      const progressText = await page.locator('text=/Progression\\s*:\\s*(\\d+)\\s*\\/\\s*10/').textContent()
      const currentProgress = parseInt(progressText.match(/(\d+)/)[1])

      if (currentProgress === 1) {
        answered = true
        break
      }

      // Attendre que la modale se ferme (2500ms) avant de réessayer
      await page.waitForTimeout(2600)
    }

    expect(answered).toBe(true)
  })

  test('Le timer fonctionne', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Récupérer le temps initial
    const initialTime = await page.locator('.timer-section label').textContent()

    // Attendre 2 secondes
    await page.waitForTimeout(2000)

    // Récupérer le nouveau temps
    const newTime = await page.locator('.timer-section label').textContent()

    // Vérifier que le temps a changé
    expect(newTime).not.toBe(initialTime)
  })

  test('La progression reste à 0 après une mauvaise réponse', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Entrer une mauvaise réponse
    await page.fill('input[type="text"]', 'motfaux')
    await page.click('button:has-text("Vérifier")')

    // Attendre l'animation
    await page.waitForTimeout(2600)

    // Vérifier que la progression est toujours à 0
    const progressText = await page.locator('text=/Progression\\s*:\\s*(\\d+)\\s*\\/\\s*10/').textContent()
    const currentProgress = parseInt(progressText.match(/(\d+)/)[1])
    expect(currentProgress).toBe(0)
  })

  test('L\'input texte accepte les caractères accentués', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Entrer un mot avec des accents
    await page.fill('input[type="text"]', 'école')

    // Vérifier que le texte est bien entré avec les accents
    const inputValue = await page.locator('input[type="text"]').inputValue()
    expect(inputValue).toBe('école')
  })
})
