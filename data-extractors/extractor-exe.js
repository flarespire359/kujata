const path = require('path')
const { extractExeData } = require('../ff7-asset-loader/exe-extractor')

const extractExe = async config => {
  await extractExeData(
    path.join(config.ff7InstallDirectory),
    path.join(config.kujataDataDirectory, 'data', 'exe')
  )
}
module.exports = { extractExe }
