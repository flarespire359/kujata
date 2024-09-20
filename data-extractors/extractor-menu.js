const path = require('path')
const { extractMenuAssets } = require('../ff7-asset-loader/menu-extractor')

const extractMenu = async config => {
  const inputMenuDirectory = path.join(config.unlgpDirectory, 'menu_us.lgp')
  const outputMenuDirectory = path.join(
    config.kujataDataDirectory,
    'data',
    'menu'
  )
  const metadataDirectory = path.join(config.kujataDataDirectory, 'metadata')
  await extractMenuAssets(
    inputMenuDirectory,
    outputMenuDirectory,
    metadataDirectory
  )
}
module.exports = { extractMenu }
