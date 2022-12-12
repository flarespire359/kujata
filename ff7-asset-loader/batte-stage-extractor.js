
const {
  COMPONENT_TYPE,
  ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER,
  FILTER,
  WRAPPING_MODE
} = require('../ff7-gltf/gltf-2.0-util.js')

const fs = require('fs-extra')
const path = require('path')

const { TexFile } = require('./tex-file.js')
const { TimFile } = require('./tim-file.js')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const BattleModelLoader = require('./battle-model-loader.js')
const PLoader = require('./p-loader.js')

const battleModelLoader = new BattleModelLoader()

const getStageNames = () => {
  const zangan = fs.readFileSync(path.join('..', 'metadata', 'battle', 'zangan.lst'), { encoding: 'utf8' })
  const stages = zangan.split('\n').map(s => { return { id: s.split('=')[0], name: s.split('=')[1] } })
  // console.log('stages', stages)
  return stages
}
const extractStageModels = (config, stage) => {
  const gltfFilename = stage.id + '.gltf'
  const binFilename = stage.id + '.bin'

  const gltf = {}
  gltf.asset = {
    version: '2.0',
    generator: 'kujata'
  }
  gltf.accessors = []
  gltf.buffers = []
  gltf.bufferViews = []
  gltf.images = []
  gltf.materials = []
  gltf.meshes = []
  gltf.nodes = []
  gltf.samplers = []
  gltf.scene = 0
  gltf.scenes = []
  gltf.textures = []

  gltf.samplers.push({
    magFilter: FILTER.LINEAR,
    minFilter: FILTER.NEAREST_MIPMAP_LINEAR,
    wrapS: WRAPPING_MODE.REPEAT,
    wrapT: WRAPPING_MODE.REPEAT
  })

  const allBuffers = [] // array of all individual Buffers, which will be combined at the end
  let numBuffersCreated = 0

  // stage.models.files.filter(f => f === 'opaq').forEach(file => {
  stage.models.files.forEach(file => {
    // const skeleton = battleModelLoader.loadBattleModel(config, file, true)

    const buffer = fs.readFileSync(path.join(config.inputBattleBattleDirectory, file))
    const r = new FF7BinaryDataReader(buffer)

    const model = PLoader.loadP(config, file, true)

    console.log('file', file, Array(16).fill().map(a => r.readUInt()).toString(), model)

    const numGroups = model.polygonGroups.length
    for (let polygonGroupsI = 0; polygonGroupsI < model.polygonGroups.length; polygonGroupsI++) {
      const polygonGroup = model.polygonGroups[polygonGroupsI]
      const numPolysInGroup = polygonGroup.numPolysInGroup
      const numVerticesInGroup = polygonGroup.numVerticesInGroup
      const offsetPolyIndex = polygonGroup.offsetPolyIndex
      const offsetVertexIndex = polygonGroup.offsetVertexIndex
      const offsetTextureCoordinateIndex = polygonGroup.offsetTextureCoordinateIndex

      // flatten the normal data so that each vertex index maps to 1 vertex normal as well
      const flattenedNormals = []
      if (model.numNormals > 0) { // Note: it appears that field models have vertex normals, but battle models don't
        flattenedNormals.length = numVerticesInGroup
        for (let i = 0; i < numPolysInGroup; i++) {
          const polygon = model.polygons[offsetPolyIndex + i]
          const normal3 = model.normals[polygon.normalIndex3]
          const normal2 = model.normals[polygon.normalIndex2]
          const normal1 = model.normals[polygon.normalIndex1]
          flattenedNormals[polygon.vertexIndex3] = normal3
          flattenedNormals[polygon.vertexIndex2] = normal2
          flattenedNormals[polygon.vertexIndex1] = normal1
        }
      }

      // 1. create "polygon vertex index" js Buffer + gltf bufferView + gltf accessor
      const polygonVertexIndexBuffer = Buffer.alloc(numPolysInGroup * 3 * 2) // 3 vertexIndex per triangle, 2 bytes for vertexIndex(short)
      for (let i = 0; i < numPolysInGroup; i++) {
        const polygon = model.polygons[offsetPolyIndex + i]
        polygonVertexIndexBuffer.writeUInt16LE(polygon.vertexIndex3, i * 6)
        polygonVertexIndexBuffer.writeUInt16LE(polygon.vertexIndex2, i * 6 + 2)
        polygonVertexIndexBuffer.writeUInt16LE(polygon.vertexIndex1, i * 6 + 4)
      }
      allBuffers.push(polygonVertexIndexBuffer)
      numBuffersCreated++
      const polygonVertexIndexAccessorIndex = numBuffersCreated - 1
      gltf.accessors.push({
        bufferView: polygonVertexIndexAccessorIndex,
        byteOffset: 0,
        type: 'SCALAR',
        componentType: COMPONENT_TYPE.UNSIGNED_SHORT,
        count: numPolysInGroup * 3
      })
      gltf.bufferViews.push({
        buffer: 0,
        byteLength: polygonVertexIndexBuffer.length,
        byteStride: 2, // 2 bytes per polygonVertexIndex
        target: ELEMENT_ARRAY_BUFFER
      })
    }

    if (gltf.bufferViews.length > 0) {
      // We wait until now to set the byteOffset for all buffer views, because that's
      // the easiest way to do it, given the dynamic nature of which buffers we use.
      const numBufferViews = gltf.bufferViews.length
      gltf.bufferViews[0].byteOffset = 0
      for (let i = 1; i < numBufferViews; i++) {
        gltf.bufferViews[i].byteOffset = gltf.bufferViews[i - 1].byteOffset + gltf.bufferViews[i - 1].byteLength
      }

      // TODO: set min and max for all accessors to help engines optimize

      // we can finally add the buffer (containing all buffer views) to gltf because we know the total size
      const lastBufferView = gltf.bufferViews[numBufferViews - 1]
      const totalLength = lastBufferView.byteOffset + lastBufferView.byteLength
      const combinedBuffer = Buffer.concat(allBuffers, totalLength)
      gltf.buffers.push({
        byteLength: totalLength,
        uri: binFilename
      })

      // create *.bin file
      const binFilenameFull = config.outputBattleStageDirectory + '/' + binFilename
      fs.writeFileSync(binFilenameFull, combinedBuffer)
      // console.log('Wrote: ' + binFilenameFull)
    }

    // create *.gltf file
    const gltfFilenameFull = config.outputBattleStageDirectory + '/' + gltfFilename
    fs.writeFileSync(gltfFilenameFull, JSON.stringify(gltf, null, 2))
  })
}
const extractStageTextures = (config, stage) => {
  stage.textures.files.forEach(file => {
    fs.ensureDirSync(path.join(config.outputBattleStageDirectory, stage.id))
    const outputFile = path.join(config.outputBattleStageDirectory, stage.id, `${file}.png`)
    // console.log('extractStageTextures', stage, outputFile)
    // if (!fs.existsSync(outputFile)) {
    new TexFile().loadTexFileFromPath(path.join(config.inputBattleBattleDirectory, file)).saveAsPng(outputFile)
    // }
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
    stage.models = { total: r.readUInt() }
    stage.textures = { total: r.readUInt() }
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
