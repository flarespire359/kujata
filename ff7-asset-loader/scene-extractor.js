const fs = require('fs-extra')
const path = require('path')
const zlib = require('zlib')

const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { parseKernelEnums, Enums } = require('./kernel-enums.js')
const { parseAttackData } = require('./kernel-sections.js')

// https://wiki.ffrtt.ru/index.php?title=FF7/Battle/Battle_Scenes

const getAttackData = (r) => {
  const datas = []
  for (let i = 0; i < 32; i++) {
    const data = parseAttackData(r)
    datas.push(data)
  }

  return datas
}
const getEnemyData = (r) => {
  const intialOffset = r.offset
  const rawName = r.readKernelString(32).trim()
  r.offset = intialOffset + 32
  const data = {
    name: rawName,
    level: r.readUByte(),
    speed: r.readUByte(),
    luck: r.readUByte(),
    evade: r.readUByte(),
    strength: r.readUByte(),
    defense: r.readUByte(),
    magic: r.readUByte(),
    magicDefense: r.readUByte(),
    elementTypes: Array(8).fill().map(a => parseKernelEnums(Enums.Elements, r.readUByte())),
    elementRates: Array(8).fill().map(a => parseKernelEnums(Enums.Battle.ElementRates, r.readUByte())),
    actionAnimationIndex: Array(16).fill().map(a => r.readUByte()),
    attackIds: Array(16).fill().map(a => r.readUShort()),
    attackCameraMovementIds: Array(16).fill().map(a => r.readUShort()),
    itemDropRates: Array(4).fill().map(a => r.readUByte()), // TODO - If the rate is lower than 80h, for e.g. 08h - then this is a drop item and has 8/63 [63 is max] chance for drop. But if rate is higher than 80h, let's say... A0h, then this is an item for steal, and chances for successful steal is A0h - 80h = 20h = 32/63.
    itemDropIDs: Array(4).fill().map(a => r.readUShort()),
    beserkManipulatedAttackIds: Array(3).fill().map(a => r.readUShort()),
    unknown: r.readUShort(),
    mp: r.readUShort(),
    ap: r.readUShort(),
    morphItem: r.readUShort(),
    backDamageMultiplier: r.readUByte(), // damage = damage * 0xXX / 8.
    align: r.readUByte(),
    hp: r.readUInt(),
    exp: r.readUInt(),
    gil: r.readUInt(),
    statusImmunities: parseKernelEnums(Enums.Statuses, r.readUInt()), // TODO: Not sure that this gives the right data
    unknown2: r.readUInt()
  }
  r.offset = intialOffset + 184
  return data
//   return r.readUByteArray(184)
}
const getBattleFormations = (r) => {
  const datas = []
  for (let i = 0; i < 4; i++) {
    const enemies = []
    for (let e = 0; e < 6; e++) {
    //   const tempOffset = r.offset
    //   const raw = JSON.stringify(r.readUByteArray(16))
    //   r.offset = tempOffset
      const data = {
        // raw,
        enemyId: r.readUShort(),
        position: readCameraVector(r),
        row: r.readUShort(),
        coverFlags: r.readUShort(), // TODO
        initialConditionFlags: parseKernelEnums(Enums.Battle.InitialConditionFlags, r.readUInt() & 0b11111) // ??

      }
      enemies.push(data)
    }

    datas.push(enemies)
  }

  return datas
}
const readCameraVector = function (r) {
  return {
    x: r.readShort(),
    y: r.readShort(),
    z: r.readShort()
  }
}
const getCameraPlacement = (r) => {
  const datas = []
  for (let i = 0; i < 4; i++) {
    // const tempOffset = r.offset
    // const raw = JSON.stringify(r.readUByteArray(48))
    // r.offset = tempOffset
    const data = {
      camera1: { pos: readCameraVector(r), dir: readCameraVector(r) },
      camera2: { pos: readCameraVector(r), dir: readCameraVector(r) },
      camera3: { pos: readCameraVector(r), dir: readCameraVector(r) }

    }
    const unused = r.readUByteArray(12)
    // data.locationName = parseKernelEnums(Enums.Battle.Location, data.locationId)
    // console.log('data', JSON.stringify(data))
    datas.push(data)
  }

  return datas
}
const getBattleSetup = (r) => {
  const datas = []
  for (let i = 0; i < 4; i++) {
    // const tempOffset = r.offset
    // const raw = JSON.stringify(r.readUByteArray(20))
    // r.offset = tempOffset
    const data = {
    //   raw,
      locationId: r.readUShort(),
      defeatNextBattleFormationId: r.readUShort(),
      escapeCounter: r.readUShort(),
      unused: r.readUShort(),
      battleArenaNextBattleFormationId: [r.readUShort(), r.readUShort(), r.readUShort(), r.readUShort()],
      escapableFlag: r.readUShort(),
      battleLayoutType: r.readUByte(),
      initialCameraPosition: parseKernelEnums(Enums.Battle.Layout, r.readUByte())
    }
    data.locationName = parseKernelEnums(Enums.Battle.Location, data.locationId)
    // console.log('data', data)
    datas.push(data)
  }

  return datas
}
const unzipBuffer = (buffer, from, to) => {
  let offset = 0
  while (offset < 5) {
    // Note: Sometimes it may finish by 0xFF bytes, because its size must be multiple of 4.
    // I didn't figure out a quick way of checking this effectivly, hence this method that will be improved

    try {
      const sectionBuffer = buffer.slice(from, to - offset)
      //   console.log('unzipBuffer attempt', i, from, to, offset)
      const unzippedBuffer = zlib.unzipSync(sectionBuffer)
      const s = new FF7BinaryDataReader(unzippedBuffer)
      //   console.log('unzipBuffer success', from, to, offset, s.length, s.offset, s.readUShort())
      s.offset = 0
      return s
    } catch (error) {
    //   console.log('unzipBuffer error', i, from, to, offset, error)
      offset++
    }
  }
}
const getDataFile = (buffer, dataFilePointer) => {
//   const from = 16
//   const to = 193
  const from = dataFilePointer.from + (0x2000 * dataFilePointer.blockId)
  const to = dataFilePointer.to + (0x2000 * dataFilePointer.blockId)

  const s = unzipBuffer(buffer, from, to)
  console.log('getDataFile', dataFilePointer)

  try {
    const data = {
      sectionId: dataFilePointer.blockId,
      sceneId: dataFilePointer.fileId,
      enemyId1: s.readUShort(),
      enemyId2: s.readUShort(),
      enemyId3: s.readUShort(),
      padding1: s.readUShort(),
      battleSetup: getBattleSetup(s),
      cameraPlacement: getCameraPlacement(s),
      battleFormations: getBattleFormations(s),
      enemyData1: getEnemyData(s),
      enemyData2: getEnemyData(s),
      enemyData3: getEnemyData(s),
      attackData: getAttackData(s),
      attackIds: Array(32).fill().map(a => s.readUShort()),
      attackNames: Array(32).fill().map(a => {
        const intialOffset = s.offset
        const rawName = s.readKernelString(32)
        s.offset = intialOffset + 32
        return rawName
      }),
      formationAIOffsets: Array(4).fill().map(a => s.readUShort()),
      formationAIData: s.readUByteArray(504), // TODO
      enemyAIOffsets: Array(3).fill().map(a => s.readUShort()),
      enemyAIData: s.readUByteArray(4090) // TODO
    }
    //   console.log('data', data, dec2hex(s.length), dec2hex(s.offset))
    return data
  } catch (error) {
    // For some strange reason any accessing of the s buffer on the last i causes an error. It's empty anyway, so ignore it for now..
    // console.error('error', error)
    return null
  }
}
const getBlocks = (r, buffer) => {
  const dataFilePointers = []

  let blockId = 0
  let fileId = 0
  while (r.offset < r.length) {
    let pointerA = r.readUInt()
    let pointerB = r.readUInt()
    dataFilePointers.push({ blockId, fileId, from: pointerA * 4, to: pointerB * 4 })

    while (pointerB !== 0xFFFFFFFF) {
      pointerA = pointerB
      pointerB = r.readUInt()
      fileId++
      if (pointerB !== 0xFFFFFFFF) {
        dataFilePointers.push({ blockId, fileId, from: pointerA * 4, to: pointerB * 4 })
      } else {
        dataFilePointers.push({ blockId, fileId, from: pointerA * 4, to: 0x2000 }) // TODO - ????
      }
    }
    fileId++
    blockId++
    r.offset = 0x2000 * blockId
  }
  //   console.log('dataFilePointers', r.offset, r.length, dataFilePointers)

  const datas = []
  for (let i = 0; i < dataFilePointers.length - 1; i++) {
    const dataFilePointer = dataFilePointers[i]
    const data = getDataFile(buffer, dataFilePointer)
    if (data !== null) {
      datas.push(data)
    }
  }
  const d = datas.filter(d => d.sceneId === 75)
  //   getDataFile(buffer, dataFilePointers[3])
  return datas
}

const saveData = async (data, outputFile) => {
//   console.log('saveData', data, outputFile)

  await fs.outputFile(outputFile, JSON.stringify(data))
}
const extractSceneBinData = async (inputBattleSceneDirectory, outputBattleSceneDirectory) => {
  console.log('Extract scene.bin Data: START')
  const buffer = fs.readFileSync(path.join(inputBattleSceneDirectory, 'scene.bin'))
  const r = new FF7BinaryDataReader(buffer)
  const datas = getBlocks(r, buffer)
  await saveData(datas, path.join(outputBattleSceneDirectory, 'scene.bin.json'))

  console.log('Extract scene.bin Data: END')
}
module.exports = {
  extractSceneBinData
}
