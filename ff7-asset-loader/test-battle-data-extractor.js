const fs = require('fs-extra')
const config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const { extractSceneBinData } = require('./scene-extractor.js')

const init = async () => {
  await extractSceneBinData(
    config.inputBattleSceneDirectory,
    config.outputBattleSceneDirectory,
    config.metadataDirectory
  )
}
init()
