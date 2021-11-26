const fs = require('fs-extra')
let config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const { extractCDData } = require('./cd-extractor')

const init = async () => {
  await extractCDData(config.inputCreditsDirectory, config.inputDiscDirectory, config.outputCDDirectory, config.metadataDirectory)
}
init()
