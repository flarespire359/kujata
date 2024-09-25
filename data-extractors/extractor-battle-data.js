const path = require('path')
const {
  extractSceneBinData
} = require('../ff7-asset-loader/scene-extractor.js')
const {
  extractMiscBattleData
} = require('../ff7-asset-loader/battle-misc-files-extractor.js')
const {
  extractBattleCameraData
} = require('../ff7-asset-loader/camera-data-loader.js')

const extractBattleData = async config => {
  // await extractSceneBinData(
  //   path.join(config.ff7InstallDirectory, 'data', 'lang-en', 'battle'),
  //   // config.inputBattleSceneDirectory,
  //   path.join(config.kujataDataDirectory, 'data', 'battle', 'scene.bin'),
  //   // config.outputBattleSceneDirectory,
  //   path.join(config.kujataDataDirectory, 'metadata')
  //   // config.metadataDirectory
  // )
  // await extractMiscBattleData(
  //   path.join(config.ff7InstallDirectory, 'data', 'battle'),
  //   // config.inputBattleDataDirectory,
  //   path.join(config.ff7InstallDirectory, 'data', 'lang-en', 'battle'),
  //   // config.inputBattleSceneDirectory,
  //   path.join(config.kujataDataDirectory, 'data', 'battle')
  //   // config.outputBattleMiscDirectory
  // )
  await extractBattleCameraData(config)
}
module.exports = {
  extractBattleData
}
