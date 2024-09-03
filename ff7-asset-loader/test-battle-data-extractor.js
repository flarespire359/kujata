const fs = require('fs-extra')
const config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const { extractSceneBinData } = require('./scene-extractor.js')
const { extractMiscBattleData } = require('./battle-misc-files-extractor.js')

const init = async () => {
  await extractSceneBinData(
    config.inputBattleSceneDirectory,
    config.outputBattleSceneDirectory,
    config.metadataDirectory
  )
  await extractMiscBattleData(
    config.inputBattleDataDirectory,
    config.inputBattleSceneDirectory,
    config.outputBattleMiscDirectory
  )
}
init()
