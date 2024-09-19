const fs = require('fs')
const path = require('path')
const FF7GltfTranslator = require('../ff7-gltf/ff7-to-gltf.js')
const chalk = require('chalk')
const cliProgress = require('cli-progress')
const FF7FieldAnimationTranslator = require('../ff7-gltf/ff7-field-animation-translator.js')
const { sleep } = require('../ff7-asset-loader/helper.js')

const getAllModelsList = (config, isBattleModel) => {
  if (isBattleModel) {
    return fs
      .readdirSync(path.join(config['unlgp-directory'], 'battle.lgp'))
      .filter(f => f.toLowerCase().endsWith('aa'))
  } else {
    return fs
      .readdirSync(path.join(config['unlgp-directory'], 'char.lgp'))
      .filter(f => f.toLowerCase().endsWith('.hrc'))
      .map(f => f.toLowerCase().replace('.hrc', ''))
  }
}

const findMissingFromArray = (sourceArray, targetArray) => {
  const targetSet = new Set(targetArray)
  return sourceArray.filter(item => !targetSet.has(item))
}
const names = {
  field: JSON.parse(fs.readFileSync('./metadata/skeleton-names-field.json')),
  battle: JSON.parse(fs.readFileSync('./metadata/skeleton-names-battle.json'))
}
const getName = (model, isBattleModel) => {
  return names[isBattleModel ? 'battle' : 'field'][model]
}
const extractFieldAnimations = async config => {
  const animFiles = fs
    .readdirSync(path.join(config['unlgp-directory'], 'char.lgp'))
    .filter(f => f.endsWith('.a'))
    .map(f => f.split('.a')[0])
  // console.log('animFiles', animFiles)
  const progressBar = new cliProgress.SingleBar({
    format:
      chalk.cyan('🛠️   Animation extraction progress: ') +
      chalk.cyan('{bar}') +
      ' {percentage}% || {value}/{total} Models || Current: ' +
      chalk.cyan('{current}'),
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  progressBar.start(animFiles.length, 0)

  const fieldAnimationTranslator = new FF7FieldAnimationTranslator()

  const errors = []
  for (const [i, animFile] of animFiles.entries()) {
    try {
      progressBar.update(i, {
        current: animFile
      })
      // await sleep(50)
      fieldAnimationTranslator.translateFF7FieldAnimationToGLTF(
        config,
        animFile
      )
    } catch (error) {
      // console.error('\n\n', error)
      errors.push(modelName)
    }
    progressBar.increment()
  }
  progressBar.stop()

  if (errors.length > 0) {
    console.log(
      chalk.red(
        '⚠️   Error extracting models:',
        errors
          .map(
            l =>
              `${chalk.underline(path.basename(l))} (${getName(
                l,
                isBattleModel
              )})`
          )
          .join(', ')
      )
    )
  } else {
    console.log(
      chalk.green(`🚀  Successfully extracted ${animFiles.length} animations`)
    )
  }
}
module.exports = {
  extractFieldAnimations
}
