#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Simple 1x1 transparent PNG (base64 encoded)
const transparentPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

// Level 1 words
const level1Words = [
  'boa', 'ara', 'puma', 'lama',
  'sac', 'bus', 'bol', 'arc', 'axe', 'vis', 'fil', 'ski', 'box',
  'pile', 'rame', 'lime', 'sofa', 'judo', 'soda', 'kiwi',
  'lac', 'mur', 'sol', 'bar',
  'car', 'taxi', 'auto',
  'zoo', 'ami', 'tutu'
]

const imagesDir = path.join(__dirname, '..', 'images', 'level1')

// Create placeholder images
level1Words.forEach(word => {
  const filePath = path.join(imagesDir, `${word}.png`)
  fs.writeFileSync(filePath, transparentPNG)
  console.log(`Created: ${word}.png`)
})

console.log(`\nCreated ${level1Words.length} placeholder images for level 1`)
