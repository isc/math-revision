#!/usr/bin/env node

/**
 * Script de génération d'images avec emojis pour le jeu d'orthographe
 * Télécharge les images Twemoji (open source de Twitter/X)
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// Charger les listes de mots
const { SPELLING_WORD_LISTS } = require('../data/word-lists.js')

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..')
const IMAGES_DIR = path.join(PROJECT_ROOT, 'images')
const TWEMOJI_BASE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/'

// Mapping des mots vers leurs emojis
const WORD_TO_EMOJI = {
  // Niveau 1 - Grande Section
  'boa': '🐍',
  'ara': '🦜',
  'puma': '🐆',
  'lama': '🦙',
  'sac': '🎒',
  'bus': '🚌',
  'bol': '🥣',
  'arc': '🏹',
  'axe': '🪓',
  'vis': '🔩',
  'fil': '🧵',
  'ski': '🎿',
  'box': '📦',
  'pile': '🔋',
  'rame': '🚣',
  'lime': '📁',
  'sofa': '🪑',
  'judo': '🥋',
  'soda': '🥤',
  'kiwi': '🥝',
  'lac': '💧',
  'mur': '🧱',
  'sol': '🌍',
  'bar': '🍺',
  'car': '🚐',
  'taxi': '🚕',
  'auto': '🚗',
  'zoo': '🦁',
  'ami': '👫',
  'tutu': '🩰'
}

/**
 * Convertit un emoji en codepoint Unicode (format Twemoji)
 */
function emojiToCodepoint(emoji) {
  const codepoints = []
  for (const char of emoji) {
    const codepoint = char.codePointAt(0).toString(16)
    codepoints.push(codepoint)
  }
  return codepoints.join('-')
}

/**
 * Télécharge l'image emoji depuis Twemoji
 */
function downloadEmojiImage(word, emoji, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const codepoint = emojiToCodepoint(emoji)
      const url = `${TWEMOJI_BASE_URL}${codepoint}.png`

      const file = fs.createWriteStream(outputPath)
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} pour ${url}`))
          return
        }

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          console.log(`  ✓ ${word} → ${emoji}`)
          resolve(true)
        })

        file.on('error', (err) => {
          fs.unlink(outputPath, () => {})
          reject(err)
        })
      }).on('error', (err) => {
        fs.unlink(outputPath, () => {})
        reject(err)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Génère les images pour un ou tous les niveaux
 */
async function generateAllEmojiImages(specificLevel = null) {
  if (specificLevel) {
    console.log(`🎨 Génération des images emoji pour le niveau ${specificLevel}\n`)
  } else {
    console.log('🎨 Génération des images emoji pour le jeu d\'orthographe\n')
  }

  const startLevel = specificLevel || 1
  const endLevel = specificLevel || 8

  // Vérifier que les dossiers existent
  for (let level = startLevel; level <= endLevel; level++) {
    const levelDir = path.join(IMAGES_DIR, `level${level}`)
    if (!fs.existsSync(levelDir)) {
      fs.mkdirSync(levelDir, { recursive: true })
    }
  }

  let totalWords = 0
  let successCount = 0
  let skippedCount = 0
  let failedCount = 0
  let missingEmoji = []

  // Générer les images pour chaque niveau
  for (let level = startLevel; level <= endLevel; level++) {
    const wordList = SPELLING_WORD_LISTS[level]
    if (!wordList) {
      console.error(`⚠️  Niveau ${level} non trouvé`)
      continue
    }

    console.log(`\n📚 Niveau ${level}: ${wordList.name} ${wordList.icon}`)
    console.log('─'.repeat(60))

    for (const wordData of wordList.words) {
      totalWords++
      const outputPath = path.join(IMAGES_DIR, wordData.image)

      // Vérifier si l'image existe déjà
      if (fs.existsSync(outputPath)) {
        console.log(`  ⊙ Ignoré: ${wordData.word} (existe déjà)`)
        skippedCount++
        continue
      }

      // Récupérer l'emoji
      const emoji = WORD_TO_EMOJI[wordData.word]
      if (!emoji) {
        console.log(`  ⚠️  ${wordData.word} - emoji manquant`)
        missingEmoji.push(wordData.word)
        failedCount++
        continue
      }

      // Télécharger l'image
      try {
        await downloadEmojiImage(wordData.word, emoji, outputPath)
        successCount++
      } catch (error) {
        console.error(`  ✗ ${wordData.word}:`, error.message)
        failedCount++
      }
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

  if (missingEmoji.length > 0) {
    console.log(`\n⚠️  Emojis manquants (${missingEmoji.length}):`)
    console.log(missingEmoji.join(', '))
  }

  console.log('='.repeat(60))

  if (successCount > 0) {
    console.log('\n💡 Les images emoji ont été générées avec succès!')
    console.log('   Vous pouvez maintenant ouvrir spelling.html pour jouer.')
  }
}

// Exécution
if (require.main === module) {
  const levelArg = process.argv[2]
  const specificLevel = levelArg ? parseInt(levelArg, 10) : null

  if (specificLevel && (specificLevel < 1 || specificLevel > 8)) {
    console.error('❌ Erreur: Le niveau doit être entre 1 et 8')
    console.log('Usage: node scripts/generate-emoji-images.js [niveau]')
    process.exit(1)
  }

  generateAllEmojiImages(specificLevel)
    .then(() => {
      console.log('\n✅ Génération terminée!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { generateAllEmojiImages, downloadEmojiImage }
