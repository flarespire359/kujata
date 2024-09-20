const path = require('path')
const {
  extractCreditsData,
  extractDiscData
} = require('../ff7-asset-loader/cd-extractor')

const extractCDData = async config => {
  console.log('Extract CD Data: START')
  await extractCreditsData(
    path.join(config.unlgpDirectory, 'cr_us.lgp'),
    path.join(config.kujataDataDirectory, 'data', 'cd'),
    path.join(config.kujataDataDirectory, 'metadata')
  )
  await extractDiscData(
    path.join(config['unlgp-directory'], 'disc_us.lgp'),
    path.join(config.kujataDataDirectory, 'data', 'cd'),
    path.join(config.kujataDataDirectory, 'metadata')
  )
  console.log('Extract CD Data: END')
}
module.exports = {
  extractCDData
}
