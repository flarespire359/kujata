const fs = require('fs-extra')
const path = require('path')

const generateBattleCameraUsageMetadata = config => {
  const camdat = JSON.parse(
    fs.readFileSync(
      path.join(config.kujataDataDirectory, 'data', 'battle', 'camdat.bin.json')
    )
  )
  const ops = { position: {}, focus: {} }
  const incrementOp = (scriptType, code, usageType) => {
    if (!ops[scriptType][code]) {
      ops[scriptType][code] = { initial: 0, main: 0, victory: 0 }
    }
    ops[scriptType][code][usageType]++
  }
  //   const ops = {}
  //   console.log('camdata', camdat)
  for (const script of camdat.initialScripts) {
    for (const op of script.position) {
      incrementOp('position', op.op, 'initial')
    }
    for (const op of script.focus) {
      incrementOp('focus', op.op, 'initial')
    }
  }
  for (const camdataFile of camdat.camdataFiles) {
    for (const usageType of Object.keys(camdataFile.scripts)) {
      for (const script of camdataFile.scripts[usageType]) {
        for (const op of script.position) {
          incrementOp('position', op.op, usageType)
        }
        for (const op of script.focus) {
          incrementOp('focus', op.op, usageType)
        }
      }
    }
  }
  //   console.log('ops', ops)
  fs.writeFileSync(
    path.join(
      config.kujataDataDirectory,
      'metadata',
      'battle-camera-op-usage.json'
    ),
    JSON.stringify(ops)
  )
}
module.exports = {
  generateBattleCameraUsageMetadata
}
