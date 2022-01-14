const fs = require('fs-extra')
const config = require('../../config.json')
const friendlyNames = require('../../friendly-names-db/battle-skeleton-friendly.names.json')

const init = async () => {
  let data = fs.readdirSync(config.inputBattleBattleDirectory).filter(f => f.toLowerCase().endsWith(('aa'))).map(f => {
    return {id: f.toLowerCase(), name: friendlyNames[f.toLowerCase()] || 'Unknown'}
  })
  const outputFile = `${config.metadataDirectory}/ff7-battle-database.json`
  console.log('outputFile', outputFile)
  fs.writeJsonSync(outputFile, data, {spaces: '\t'})
}
init()
