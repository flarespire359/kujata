const fs = require('fs-extra')
const path = require('path')

const { TexFile } = require('./tex-file.js')
const { TimFile } = require('./tim-file.js')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const BattleModelLoader = require('./battle-model-loader.js')
const PLoader = require('./p-loader.js')

const battleModelLoader = new BattleModelLoader()

const getStageNames = () => {
  const zangan = fs.readFileSync(path.join('..', 'metadata', 'battle', 'zangan.lst'), {encoding: 'utf8'})
  const stages = zangan.split('\n').map(s => { return { id: s.split('=')[0], name: s.split('=')[1] } })
  // console.log('stages', stages)
  return stages
}
const extractStageModels = (config, stage) => {
  // stage.models.files.filter(f => f === 'opaq').forEach(file => {
  stage.models.files.forEach(file => {
    // const skeleton = battleModelLoader.loadBattleModel(config, file, true)

    let buffer = fs.readFileSync(path.join(config.inputBattleBattleDirectory, file))
    let r = new FF7BinaryDataReader(buffer)

    const pFile = PLoader.loadP(config, file, true)

    console.log('file', file, Array(16).fill().map(a => r.readUInt()).toString(), pFile)
  })
}
const extractStageTextures = (config, stage) => {
  stage.textures.files.forEach(file => {
    fs.ensureDirSync(path.join(config.outputBattleStageDirectory, stage.id))
    const outputFile = path.join(config.outputBattleStageDirectory, stage.id, `${file}.png`)
    // console.log('extractStageTextures', stage, outputFile)
    if (fs.existsSync(outputFile)) {
      new TexFile().loadTexFileFromPath(path.join(config.inputBattleBattleDirectory, file)).saveAsPng(outputFile)
    }
  })
}
const extractAllStages = (config) => {
  const stages = getStageNames().filter(a => a.id === 'op') // Temp limit
  const allFiles = fs.readdirSync(config.inputBattleBattleDirectory)
  stages.forEach(stage => {
    // Populate base data

    const stageFiles = allFiles.filter(f => f.startsWith(stage.id) && !f.endsWith('aa') && !f.endsWith('ab'))

    let buffer = fs.readFileSync(path.join(config.inputBattleBattleDirectory, `${stage.id}aa`))
    let r = new FF7BinaryDataReader(buffer)

    r.offset = r.offset + (5 * 4) // Ignore first 5 ints
    stage.models = {total: r.readUInt()}
    stage.textures = {total: r.readUInt()}
    stage.textures.files = stageFiles.slice(0, stage.textures.total)
    stage.models.files = stageFiles.slice(stage.textures.total)

    r.offset = r.offset + (5 * 4) // Ignore 5 blanks ints
    stage.unknownAA = r.readUByteArray(4)

    buffer = fs.readFileSync(path.join(config.inputBattleBattleDirectory, `${stage.id}ab`))
    r = new FF7BinaryDataReader(buffer)

    stage.unknownAB = r.readUByteArray(2)

    // Extract textures
    extractStageTextures(config, stage)

    extractStageModels(config, stage)
    // if (stage.models.total < 6) {
    //   console.log('stage', stage)
    // }
  })
  console.log('end')
  return stages
}
const saveData = async (data, outputFile) => {
  await fs.outputFile(outputFile, JSON.stringify(data))
}
const extractStages = async (config) => {
  console.log('Extract stage Data: START')
  //   let buffer = fs.readFileSync(path.join(config.inputBattleBattleDirectory, 'opaa'))

  //   let r = new FF7BinaryDataReader(buffer)
  //   console.log('r.length', r, r.length)
  const datas = extractAllStages(config)
  //   const datas = getBlocks(r, buffer)
  await saveData(datas, path.join(config.outputBattleStageDirectory, 'stage.json'))

  console.log('Extract stage Data: END')
}
module.exports = {
  extractStages
}
