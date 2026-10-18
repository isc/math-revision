#!/usr/bin/env node

/**
 * Script de génération d'images pour le jeu d'orthographe
 * Utilise Gemini 2.5 Flash pour générer des images minimalistes
 *
 * Usage:
 *   1. Installer les dépendances: npm install axios dotenv
 *   2. Obtenir une clé API sur https://aistudio.google.com/apikey
 *   3. Configurer GOOGLE_API_KEY dans .env
 *   4. Exécuter: node scripts/generate-images.js
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
require('dotenv').config()

// Charger les listes de mots
const { SPELLING_WORD_LISTS } = require('../data/word-lists.js')

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..')
const IMAGES_DIR = path.join(PROJECT_ROOT, 'images')
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const DELAY_BETWEEN_REQUESTS = 2000 // 2 secondes entre chaque requête

// Template du prompt pour la génération d'images
const PROMPT_TEMPLATE = (word) => {
  return `A clear, friendly illustration of "${word}" for a children's book (age 5-6). Style: colorful cartoon drawing, simple but VERY recognizable, bright colors, white or very light background, single object centered and clearly visible, no text or labels. The image should be immediately identifiable by a young child - show the distinctive features clearly. Children's book illustration style, like a picture dictionary for kids.`
}

/**
 * Génère une image pour un mot via Gemini 2.5 Flash
 * @param {string} word - Le mot à illustrer
 * @param {number} level - Le niveau du mot
 * @param {string} outputPath - Chemin de sortie de l'image
 * @returns {Promise<boolean>} - True si succès, false sinon
 */
async function generateImageWithImagen(word, level, outputPath) {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY non configurée dans .env')
  }

  try {
    console.log(`  Génération de l'image pour: ${word} (Niveau ${level})`)

    const prompt = PROMPT_TEMPLATE(word)

    // Appel à l'API Gemini 2.5 Flash avec génération d'images
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        response_modalities: ["image"]
      }
    }

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Extraire l'image de la réponse
    const candidate = response.data?.candidates?.[0]
    const imagePart = candidate?.content?.parts?.find(part => part.inline_data)

    if (!imagePart?.inline_data?.data) {
      console.error(`  ✗ Pas d'image générée pour ${word}`)
      return false
    }

    // L'image est retournée en base64
    const imageBase64 = imagePart.inline_data.data
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    // Sauvegarder l'image
    fs.writeFileSync(outputPath, imageBuffer)
    console.log(`  ✓ Image sauvegardée: ${outputPath}`)

    return true
  } catch (error) {
    console.error(`  ✗ Erreur pour ${word}:`, error.response?.data || error.message)
    return false
  }
}

/**
 * Alternative: Génération via DALL-E (OpenAI)
 * Décommenter cette fonction si vous préférez utiliser DALL-E
 */
async function generateImageWithDallE(word, level, outputPath) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY non configurée dans .env')
  }

  try {
    console.log(`  Génération de l'image pour: ${word} (Niveau ${level})`)

    const prompt = PROMPT_TEMPLATE(word)

    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const imageUrl = response.data.data[0].url

    // Télécharger l'image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(imageResponse.data, 'binary')

    // Sauvegarder
    fs.writeFileSync(outputPath, imageBuffer)
    console.log(`  ✓ Image sauvegardée: ${outputPath}`)

    return true
  } catch (error) {
    console.error(`  ✗ Erreur pour ${word}:`, error.response?.data || error.message)
    return false
  }
}

/**
 * Fonction de délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Génère toutes les images pour tous les niveaux
 * @param {number} specificLevel - Si fourni, génère seulement ce niveau (1-8)
 */
async function generateAllImages(specificLevel = null) {
  if (specificLevel) {
    console.log(`🎨 Génération des images pour le niveau ${specificLevel}\n`)
  } else {
    console.log('🎨 Génération des images pour le jeu d\'orthographe\n')
  }

  // Déterminer les niveaux à générer
  const startLevel = specificLevel || 1
  const endLevel = specificLevel || 8

  // Vérifier que les dossiers existent
  for (let level = startLevel; level <= endLevel; level++) {
    const levelDir = path.join(IMAGES_DIR, `level${level}`)
    if (!fs.existsSync(levelDir)) {
      console.log(`Création du dossier: ${levelDir}`)
      fs.mkdirSync(levelDir, { recursive: true })
    }
  }

  let totalWords = 0
  let successCount = 0
  let skippedCount = 0
  let failedCount = 0

  // Générer les images pour chaque niveau
  for (let level = startLevel; level <= endLevel; level++) {
    const wordList = SPELLING_WORD_LISTS[level]
    if (!wordList) {
      console.error(`⚠️  Niveau ${level} non trouvé dans SPELLING_WORD_LISTS`)
      continue
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`📚 Niveau ${level}: ${wordList.name} ${wordList.icon}`)
    console.log(`   ${wordList.description}`)
    console.log(`   ${wordList.words.length} mots`)
    console.log('='.repeat(60))

    for (const wordData of wordList.words) {
      totalWords++
      const outputPath = path.join(IMAGES_DIR, wordData.image)

      // Vérifier si l'image existe déjà
      if (fs.existsSync(outputPath)) {
        console.log(`  ⊙ Ignoré: ${wordData.word} (existe déjà)`)
        skippedCount++
        continue
      }

      // Générer l'image
      // Utiliser DALL-E par défaut (Gemini n'est pas disponible dans tous les pays)
      const success = await generateImageWithDallE(wordData.word, level, outputPath)
      // Alternative si vous avez accès à Gemini: generateImageWithImagen(wordData.word, level, outputPath)

      if (success) {
        successCount++
      } else {
        failedCount++
      }

      // Rate limiting
      await delay(DELAY_BETWEEN_REQUESTS)
    }
  }

  // Résumé
  console.log(`\n${'='.repeat(60)}`)
  console.log('✨ RÉSUMÉ DE LA GÉNÉRATION')
  console.log('='.repeat(60))
  console.log(`Total de mots:           ${totalWords}`)
  console.log(`✓ Générées avec succès:  ${successCount}`)
  console.log(`⊙ Déjà existantes:       ${skippedCount}`)
  console.log(`✗ Échecs:                ${failedCount}`)
  console.log('='.repeat(60))

  if (failedCount > 0) {
    console.log('\n⚠️  Certaines images n\'ont pas pu être générées.')
    console.log('   Vous pouvez réexécuter le script pour réessayer.')
  }

  if (successCount > 0) {
    console.log('\n💡 Les images ont été générées avec succès!')
    console.log('   Vous pouvez maintenant ouvrir spelling.html pour jouer.')
  }
}

// Vérifier la configuration avant de commencer
function checkConfiguration() {
  console.log('🔍 Vérification de la configuration...\n')

  if (!GOOGLE_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ Erreur: Aucune clé API configurée!')
    console.error('   Créez un fichier .env avec:')
    console.error('   - GOOGLE_API_KEY=your-key (pour Imagen)')
    console.error('   - ou OPENAI_API_KEY=your-key (pour DALL-E)')
    process.exit(1)
  }

  if (GOOGLE_API_KEY) {
    console.log('✓ GOOGLE_API_KEY configurée (Imagen)')
  }

  if (process.env.OPENAI_API_KEY) {
    console.log('✓ OPENAI_API_KEY configurée (DALL-E)')
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    console.log(`Création du dossier images: ${IMAGES_DIR}`)
    fs.mkdirSync(IMAGES_DIR, { recursive: true })
  }

  console.log()
}

// Exécution
if (require.main === module) {
  checkConfiguration()

  // Récupérer le niveau spécifique depuis les arguments (ex: node generate-images.js 1)
  const levelArg = process.argv[2]
  const specificLevel = levelArg ? parseInt(levelArg, 10) : null

  if (specificLevel && (specificLevel < 1 || specificLevel > 8)) {
    console.error('❌ Erreur: Le niveau doit être entre 1 et 8')
    console.log('Usage: node scripts/generate-images.js [niveau]')
    console.log('Exemples:')
    console.log('  node scripts/generate-images.js 1    # Génère seulement le niveau 1')
    console.log('  node scripts/generate-images.js      # Génère tous les niveaux')
    process.exit(1)
  }

  generateAllImages(specificLevel)
    .then(() => {
      console.log('\n✅ Génération terminée!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { generateImageWithImagen, generateImageWithDallE, generateAllImages }
