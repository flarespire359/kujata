const fs = require('fs-extra')
let config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const { extractCreditsData } = require('./credits-extractor')

const init = async () => {
  await extractCreditsData(config.inputCreditsDirectory, config.outputCDDirectory, config.metadataDirectory)
}
init()
