const path = require('path')
const chalk = require('chalk')
const {
  extractCreditsData,
  extractDiscData
} = require('../ff7-asset-loader/cd-extractor')

const extractCDData = async config => {
  console.log(chalk.cyan('🛠️   Extracting cd data'))
  await extractCreditsData(
    path.join(config.unlgpDirectory, 'cr_us.lgp'),
    path.join(config.kujataDataDirectory, 'data', 'cd'),
    path.join(config.kujataDataDirectory, 'metadata')
  )
  await extractDiscData(
    path.join(config.unlgpDirectory, 'disc_us.lgp'),
    path.join(config.kujataDataDirectory, 'data', 'cd'),
    path.join(config.kujataDataDirectory, 'metadata')
  )
  console.log(chalk.green('🚀  Successfully extracted cd data'))
}
module.exports = {
  extractCDData
}
