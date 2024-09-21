const fs = require('fs-extra')
const path = require('path')

const generateOpCodeUsages = config => {
  console.log('generateOpCodeUsages START')

  const fieldFiles = fs
    .readdirSync(config.outputFieldFLevelDirectory)
    .filter(f => f.endsWith('.json'))
  //   console.log('fieldFiles', fieldFiles)
  const opCodeUsages = {}
  for (const fieldIndex in fieldFiles) {
    const fieldFile = fieldFiles[fieldIndex]
    const field = fs.readJSONSync(
      path.join(config.outputFieldFLevelDirectory, fieldFile)
    )
    // console.log('field', parseInt(fieldIndex) + 1, 'of', fieldFiles.length, '-', field.script ? field.script.header.name : '????? unknown')
    if (field.script) {
      for (const entity of field.script.entities) {
        for (const script of entity.scripts) {
          for (let i = 0; i < script.ops.length; i++) {
            const op = script.ops[i]
            if (op && op.raw) {
              const opHex = op.raw.substring(0, 2)
              const usage = {
                fieldName: field.script.header.name,
                entityName: entity.entityName,
                scriptIndex: script.index,
                opIndex: i
              }
              for (const opProperty of Object.keys(op)) {
                usage[opProperty] = op[opProperty]
              }
              if (!opCodeUsages[opHex]) {
                opCodeUsages[opHex] = []
              }
              opCodeUsages[opHex].push(usage)
            }
          }
        }
      }
    }
  }
  for (const opHex of Object.keys(opCodeUsages)) {
    const usages = opCodeUsages[opHex]
    const filename =
      config.metadataDirectory + '/op-code-usages/' + opHex + '.json'
    fs.writeFileSync(filename, JSON.stringify(usages, null, 2))
    // console.log('Wrote: ' + filename)
  }
  console.log('generateOpCodeUsages END')
}

const processOpCodeUsages = (opCodeUsages, op, field, entity, script, i) => {
  const opHex = op.raw.substring(0, 2)
  const usage = {
    fieldName: field.script.header.name,
    entityName: entity.entityName,
    scriptIndex: script.index,
    opIndex: i
  }
  for (const opProperty of Object.keys(op)) {
    usage[opProperty] = op[opProperty]
  }
  if (!opCodeUsages[opHex]) {
    opCodeUsages[opHex] = []
  }
  opCodeUsages[opHex].push(usage)
}
const writeOpCodeUsages = (config, opCodeUsages) => {
  const usageDir = path.join(
    config.kujataDataDirectory,
    'metadata',
    'op-code-usages'
  )
  if (!fs.existsSync(usageDir)) {
    fs.mkdirSync(usageDir)
  }
  for (const opHex of Object.keys(opCodeUsages)) {
    const usages = opCodeUsages[opHex]
    const usagePath = path.join(usageDir, `${opHex}.json`)
    // console.log('usage', usagePath)
    fs.writeFileSync(usagePath, JSON.stringify(usages, null, 2))
    // fs.writeFileSync(filename, JSON.stringify(usages, null, 2))
    // console.log('Wrote: ' + filename)
  }
}
module.exports = {
  processOpCodeUsages,
  writeOpCodeUsages
}
