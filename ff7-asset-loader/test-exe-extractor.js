const fs = require('fs-extra')
let config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const { extractExeData } = require('./exe-extractor')

const init = async () => {
  const inputExeDirectory = config.inputExeDirectory
  const outputExeDirectory = config.outputExeDirectory
  await extractExeData(inputExeDirectory, outputExeDirectory)
}
init()
