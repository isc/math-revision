const { test, expect } = require('@playwright/test')

test.describe('Jeu de Mathématiques', () => {
  test.beforeEach(async ({ page }) => {
    // Charger la page du jeu de maths
    await page.goto('http://localhost:8000/index.html')
  })

  test('La page se charge correctement', async ({ page }) => {
    // Vérifier le titre
    await expect(page).toHaveTitle(/Math/)

    // Vérifier que l'indicateur de niveau est visible
    await expect(page.locator('main > h4').first()).toBeVisible()
    await expect(page.locator('main > h4').first()).toContainText('Grande Section')
  })

  test('Le bouton de démarrage est visible', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Démarrer' })).toBeVisible()
  })

  test('Le jeu démarre quand on clique sur démarrer', async ({ page }) => {
    // Cliquer sur démarrer
    await page.click('button:has-text("Démarrer")')

    // Attendre que le jeu démarre
    await page.waitForTimeout(100)

    // Vérifier que la barre de progression est visible
    await expect(page.locator('progress')).toBeVisible()

    // Vérifier que le timer est visible
    await expect(page.locator('.timer-section label')).toBeVisible()

    // Vérifier qu'une question est affichée
    await expect(page.locator('.question-title')).toBeVisible()

    // Vérifier que l'input de réponse est visible
    await expect(page.locator('input[type="number"]')).toBeVisible()
  })

  test('On peut répondre à une question correctement', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Lire la question
    const questionText = await page.locator('.question-title').textContent()

    // Parser la question et calculer la réponse
    const match = questionText.match(/(\d+)\s*([+×])\s*(\d+)\s*=/)
    if (match) {
      const a = parseInt(match[1])
      const operator = match[2]
      const b = parseInt(match[3])
      let answer

      if (operator === '+') {
        answer = a + b
      } else if (operator === '×') {
        answer = a * b
      }

      // Entrer la réponse
      await page.fill('input[type="number"]', answer.toString())
      await page.click('button:has-text("Vérifier")')

      // Attendre l'animation
      await page.waitForTimeout(500)

      // Vérifier que la progression a augmenté
      const progress = await page.locator('progress').getAttribute('value')
      expect(parseInt(progress)).toBeGreaterThanOrEqual(1)
    }
  })

  test('La progression augmente après chaque bonne réponse', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Répondre correctement à 3 questions
    for (let i = 0; i < 3; i++) {
      const questionText = await page.locator('.question-title').textContent()
      const match = questionText.match(/(\d+)\s*([+×])\s*(\d+)\s*=/)

      if (match) {
        const a = parseInt(match[1])
        const operator = match[2]
        const b = parseInt(match[3])
        const answer = operator === '+' ? a + b : a * b

        await page.fill('input[type="number"]', answer.toString())
        await page.click('button:has-text("Vérifier")')
        await page.waitForTimeout(1200) // Attendre l'animation + nouvelle question
      }
    }

    // Vérifier que la progression est de 3
    const progressText = await page.locator('text=/Progression\\s*:\\s*(\\d+)\\s*\\/\\s*10/').textContent()
    const currentProgress = parseInt(progressText.match(/(\d+)/)[1])
    expect(currentProgress).toBe(3)
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

  test('Une mauvaise réponse ne bloque pas le jeu', async ({ page }) => {
    // Démarrer le jeu
    await page.click('button:has-text("Démarrer")')
    await page.waitForTimeout(200)

    // Entrer une mauvaise réponse
    await page.fill('input[type="number"]', '999')
    await page.click('button:has-text("Vérifier")')

    // Attendre l'animation
    await page.waitForTimeout(2500)

    // Vérifier qu'une nouvelle question est affichée (le jeu continue)
    await expect(page.locator('.question-title')).toBeVisible()
    await expect(page.locator('input[type="number"]')).toBeVisible()

    // Vérifier que la progression est toujours à 0
    const progressText = await page.locator('text=/Progression\\s*:\\s*(\\d+)\\s*\\/\\s*10/').textContent()
    const currentProgress = parseInt(progressText.match(/(\d+)/)[1])
    expect(currentProgress).toBe(0)
  })
})
