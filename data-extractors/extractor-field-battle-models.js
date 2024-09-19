const fs = require('fs')
const path = require('path')
const FF7GltfTranslator = require('../ff7-gltf/ff7-to-gltf.js')
const chalk = require('chalk')
const cliProgress = require('cli-progress')
const FF7FieldAnimationTranslator = require('../ff7-gltf/ff7-field-animation-translator.js')

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
const extractFieldBattleModels = async (config, models, all, isBattleModel) => {
  const modelsToProcess = all ? getAllModelsList(config, isBattleModel) : models

  // console.log('\n\n allModels', getAllModelsList(config, isBattleModel))
  if (!all) {
    const invalidModels = findMissingFromArray(
      models,
      getAllModelsList(config, isBattleModel)
    )
    if (invalidModels.length > 0) {
      console.log(
        chalk.red(
          `⚠️   Invalid model file - ${invalidModels
            .map(l => chalk.inverse(l))
            .join(', ')}`
        )
      )
      return
    }
  }

  // console.log('extractFieldBattleModels modelsToProcess', modelsToProcess)

  const progressBar = new cliProgress.SingleBar({
    format:
      chalk.cyan('🛠️   Model extraction progress: ') +
      chalk.cyan('{bar}') +
      ' {percentage}% || {value}/{total} Models || Current: ' +
      chalk.cyan('{current}'),
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  progressBar.start(modelsToProcess.length, 0)

  const errors = []
  const success = []
  const gltfTranslator = new FF7GltfTranslator()
  const fieldAnimationTranslator = new FF7FieldAnimationTranslator()

  for (const [i, modelName] of modelsToProcess.entries()) {
    try {
      progressBar.update(i, {
        current: `${modelName} (${getName(modelName, isBattleModel)})`
      })
      // TODO - For some reason, the battle models are HUGE!! Why?! Fix it!
      await gltfTranslator.translateFF7FieldHrcToGltf(
        config,
        modelName,
        null,
        null, // TODO Setting this here bakes the animations into the glTF, don't do it for fields. battles? not sure, need to look
        true,
        isBattleModel
      )

      fieldAnimationTranslator.translateFF7FieldAnimationToGLTF(config, 'gmea')
      // if (i % 2 === 0) throw new Exception()
      success.push(modelName)
    } catch (error) {
      // console.error('\n\n', error)
      errors.push(modelName)
    }
    progressBar.increment()
  }
  progressBar.stop()

  if (success.length > 0) {
    console.log(
      chalk.green(
        '🚀  Successfully extracted:',
        success
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
  }
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
  }
}
module.exports = {
  extractFieldBattleModels
}
