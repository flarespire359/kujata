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
const {
  extractActionSequences
} = require('../ff7-asset-loader/action-sequence-loader.js')
const {
  extractBattleEffectAssets
} = require('../ff7-asset-loader/battle-effects-assets.js')

const extractBattleData = async config => {
  await extractSceneBinData(
    path.join(config.ff7InstallDirectory, 'data', 'lang-en', 'battle'),
    path.join(config.kujataDataDirectory, 'data', 'battle', 'scene.bin'),
    path.join(config.kujataDataDirectory, 'metadata')
  )
  await extractMiscBattleData(
    path.join(config.ff7InstallDirectory, 'data', 'battle'),
    path.join(config.ff7InstallDirectory, 'data', 'lang-en', 'battle'),
    path.join(config.kujataDataDirectory, 'data', 'battle')
  )
  await extractBattleCameraData(config)
  await extractActionSequences(config)
  await extractBattleEffectAssets(config)
}
module.exports = {
  extractBattleData
}
