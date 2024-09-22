const chalk = require('chalk')
const {
  fieldIdToWorldMapCoords
} = require('../ff7-asset-loader/field-id-to-world-map-coords')
const {
  generateWorldMapTransitionData
} = require('../ff7-asset-loader/world-extractor')

const extractWorld = async config => {
  console.log(chalk.cyan('🛠️   Exacting world data'))
  console.log(chalk.blue('⚠️   Note: This is very incomplete!'))

  fieldIdToWorldMapCoords(config)
  generateWorldMapTransitionData(config)
  console.log(chalk.green('🚀  Extracted world data'))
}
module.exports = { extractWorld }
