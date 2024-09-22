const path = require('path')
const chalk = require('chalk')
const { extractExeData } = require('../ff7-asset-loader/exe-extractor')

const extractExe = async config => {
  console.log(chalk.cyan('🛠️   Extracting exe data'))
  await extractExeData(
    path.join(config.ff7InstallDirectory),
    path.join(config.kujataDataDirectory, 'data', 'exe')
  )
  console.log(chalk.green('🚀  Successfully extracted exe data'))
}
module.exports = { extractExe }
