const path = require('path')
const { extractExeData } = require('../ff7-asset-loader/exe-extractor')

const extractExe = async config => {
  await extractExeData(
    path.join(config['ff7-install-directory']),
    path.join(config['kujata-data-output-directory'], 'data', 'exe')
  )
}
module.exports = { extractExe }
