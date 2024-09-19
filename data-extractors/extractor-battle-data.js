const path = require('path')
const {
  extractSceneBinData
} = require('../ff7-asset-loader/scene-extractor.js')
const {
  extractMiscBattleData
} = require('../ff7-asset-loader/battle-misc-files-extractor.js')

const extractBattleData = async config => {
  await extractSceneBinData(
    path.join(config['ff7-install-directory'], 'data', 'lang-en', 'battle'),
    // config.inputBattleSceneDirectory,
    path.join(
      config['kujata-data-output-directory'],
      'data',
      'battle',
      'scene.bin'
    ),
    // config.outputBattleSceneDirectory,
    path.join(config['kujata-data-output-directory'], 'metadata')
    // config.metadataDirectory
  )
  await extractMiscBattleData(
    path.join(config['ff7-install-directory'], 'data', 'battle'),
    // config.inputBattleDataDirectory,
    path.join(config['ff7-install-directory'], 'data', 'lang-en', 'battle'),
    // config.inputBattleSceneDirectory,
    path.join(config['kujata-data-output-directory'], 'data', 'battle')
    // config.outputBattleMiscDirectory
  )
}
module.exports = {
  extractBattleData
}
