const path = require('path')
const { extractMenuAssets } = require('../ff7-asset-loader/menu-extractor')

const extractMenu = async config => {
  const inputMenuDirectory = path.join(config['unlgp-directory'], 'menu_us.lgp')
  const outputMenuDirectory = path.join(
    config['kujata-data-output-directory'],
    'data',
    'menu'
  )
  const metadataDirectory = path.join(
    config['kujata-data-output-directory'],
    'metadata'
  )
  await extractMenuAssets(
    inputMenuDirectory,
    outputMenuDirectory,
    metadataDirectory
  )
}
module.exports = { extractMenu }
