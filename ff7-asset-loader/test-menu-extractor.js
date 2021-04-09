const fs = require('fs-extra')
const config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const { extractMenuAssets } = require('./menu-extractor')

const init = async () => {
  const inputMenuDirectory = config.inputMenuDirectory
  const outputMenuDirectory = config.outputMenuDirectory
  const metadataDirectory = config.metadataDirectory
  await extractMenuAssets(
    inputMenuDirectory,
    outputMenuDirectory,
    metadataDirectory
  )
}
init()
