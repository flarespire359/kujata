const fs = require('fs-extra')
const path = require('path')
const zlib = require('zlib')
const { dec2hex } = require('./string-util.js')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { parseKernelEnums, Enums } = require('./kernel-enums.js')
const { parseAttackData } = require('./kernel-sections.js')

// https://wiki.ffrtt.ru/index.php?title=FF7/Battle/Battle_Scenes

const getAttackData = r => {
  const datas = []
  for (let i = 0; i < 32; i++) {
    const data = parseAttackData(r)
    datas.push(data)
  }

  return datas
}
const getEnemyData = r => {
  const intialOffset = r.offset
  const rawName = r.readKernelString(32).trim()
  r.offset = intialOffset + 32
  const data = {
    name: rawName,
    level: r.readUByte(),
    dexterity: r.readUByte(),
    luck: r.readUByte(),
    defensePercent: r.readUByte(),
    attack: r.readUByte(),
    defense: r.readUByte(),
    magicAttack: r.readUByte(),
    magicDefense: r.readUByte(),
    elementTypes: Array(8)
      .fill()
      .map(a => parseKernelEnums(Enums.Elements, r.readUByte())), // Not right yet
    elementRates: Array(8)
      .fill()
      .map(a => parseKernelEnums(Enums.Battle.ElementRates, r.readUByte())), // Not right yet
    actionAnimationIndex: Array(16)
      .fill()
      .map(a => r.readUByte()),
    attackIds: Array(16)
      .fill()
      .map(a => r.readUShort()),
    attackCameraMovementIds: Array(16)
      .fill()
      .map(a => r.readUShort()),
    itemDropRates: Array(4)
      .fill()
      .map(a => r.readUByte()), // TODO - If the rate is lower than 80h, for e.g. 08h - then this is a drop item and has 8/63 [63 is max] chance for drop. But if rate is higher than 80h, let's say... A0h, then this is an item for steal, and chances for successful steal is A0h - 80h = 20h = 32/63.
    itemDropIDs: Array(4)
      .fill()
      .map(a => r.readUShort()),
    beserkManipulatedAttackIds: Array(3)
      .fill()
      .map(a => r.readUShort()),
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
    unknown2: Array(4)
      .fill()
      .map(a => r.readUByte())
  }
  r.offset = intialOffset + 184
  return data
  //   return r.readUByteArray(184)
}
const getBattleFormations = r => {
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
        initialConditionFlags: parseKernelEnums(
          Enums.Battle.InitialConditionFlags,
          r.readUInt() & 0b11111
        ) // ??
      }
      enemies.push(data)
    }

    datas.push(enemies)
  }
  // console.log('formations', datas)
  return datas
}
const readCameraVector = function (r) {
  return {
    x: r.readShort(),
    y: r.readShort(),
    z: r.readShort()
  }
}
const getCameraPlacement = r => {
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
    const unk = r.readUByteArray(12) // unusued
    if (unk.find(a => a !== 0xff)) {
      console.log('unk', unk)
    }
    // console.log('data', unk)
    // data.locationName = parseKernelEnums(Enums.Battle.Location, data.locationId)
    // console.log('data', JSON.stringify(data))
    datas.push(data)
  }

  return datas
}
const getBattleSetup = r => {
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
      battleArenaNextBattleFormationId: [
        r.readUShort(),
        r.readUShort(),
        r.readUShort(),
        r.readUShort()
      ],
      escapableFlag: r.readUShort(),
      battleLayoutType: parseKernelEnums(Enums.Battle.Layout, r.readUByte()),
      initialCameraPosition: r.readUByte()
    }
    data.locationName = parseKernelEnums(Enums.Battle.Location, data.locationId)
    data.battleFlags = parseKernelEnums(
      Enums.Battle.BattleFlags,
      data.escapableFlag
    )
    delete data.escapableFlag
    // console.log('data', data)
    datas.push(data)
  }

  return datas
}
const unzipBuffer = (buffer, from, to) => {
  let offset = 0
  let success = false

  while (to - from > offset) {
    // Note: Sometimes it may finish by 0xFF bytes, because its size must be multiple of 4.
    // I didn't figure out a quick way of checking this effectivly, hence this method that will be improved

    try {
      const sectionBuffer = buffer.slice(from, to - offset)
      // console.log(
      //   'unzipBuffer attempt',
      //   from,
      //   to,
      //   to - from > offset,
      //   offset,
      //   buffer.slice(to - offset - 2, to),
      //   buffer.slice(from, to - offset).length
      // )
      const unzippedBuffer = zlib.unzipSync(sectionBuffer)
      const s = new FF7BinaryDataReader(unzippedBuffer)
      // console.log(
      //   'unzipBuffer success',
      //   from,
      //   to,
      //   offset,
      //   s.length,
      //   s.offset,
      //   s.readUShort()
      // )
      s.offset = 0
      return s
    } catch (error) {
      // console.log('unzipBuffer error', from, to, offset, error)
      offset++
    }
  }
  console.error('ERROR UNZIPPING BUFFER')
}
const getDataFile = (buffer, dataFilePointer) => {
  //   const from = 16
  //   const to = 193
  const from = dataFilePointer.from + 0x2000 * dataFilePointer.blockId
  const to = dataFilePointer.to + 0x2000 * dataFilePointer.blockId

  const s = unzipBuffer(buffer, from, to)
  // console.log('getDataFile', dataFilePointer, s === undefined)

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
      attackIds: Array(32)
        .fill()
        .map(a => s.readUShort()),
      attackNames: Array(32)
        .fill()
        .map(a => {
          const intialOffset = s.offset
          const rawName = s.readKernelString(32)
          s.offset = intialOffset + 32
          return rawName
        }),
      formationAIOffsets: Array(4)
        .fill()
        .map(a => s.readUShort()),
      formationAIData: s.readUByteArray(504), // TODO
      enemyAIOffsets: Array(3)
        .fill()
        .map(a => s.readUShort())
      // enemyAIData: s.readUByteArray(4090) // TODO
    }
    // if (data.sceneId === 29) {
    // console.log('data', data)
    // }
    // console.log('sceneId', data.sceneId)
    for (const i in data.attackData) {
      data.attackData[i].id = data.attackIds[i]
      data.attackData[i].name = data.attackNames[i]
    }
    const scriptOffsetBegin = s.offset
    // console.log('scriptOffsetBegin', scriptOffsetBegin)

    for (const i in data.enemyAIOffsets) {
      const enemyAIOffset = data.enemyAIOffsets[i]
      // const script = data[`enemyScript${parseInt(i) + 1}`] = { }
      if (enemyAIOffset === 0xffff) break
      const realOffset = scriptOffsetBegin + enemyAIOffset - 6
      s.offset = realOffset

      const script = (data[`enemyScript${parseInt(i) + 1}`] = {
        init: { id: 0, offset: s.readUShort() },
        main: { id: 1, offset: s.readUShort() },
        counterGeneral: { id: 2, offset: s.readUShort() },
        counterDeath: { id: 3, offset: s.readUShort() },
        counterPhysical: { id: 4, offset: s.readUShort() },
        counterMagical: { id: 5, offset: s.readUShort() },
        battleEnd: { id: 6, offset: s.readUShort() },
        preActionSetup: { id: 7, offset: s.readUShort() },
        customEvent1: { id: 8, offset: s.readUShort() },
        customEvent2: { id: 9, offset: s.readUShort() },
        customEvent3: { id: 10, offset: s.readUShort() },
        customEvent4: { id: 11, offset: s.readUShort() },
        customEvent5: { id: 12, offset: s.readUShort() },
        customEvent6: { id: 13, offset: s.readUShort() },
        customEvent7: { id: 14, offset: s.readUShort() },
        customEvent8: { id: 15, offset: s.readUShort() }
      })
      for (const scriptObj of Object.values(script)) {
        // console.log(
        //   'Processing script:',
        //   `enemy${i}`,
        //   dataFilePointer.fileId,
        //   scriptObj
        // )
        scriptObj.script = []
        const indexOffset = realOffset + scriptObj.offset
        if (scriptObj.offset !== 0xffff) {
          s.offset = realOffset + scriptObj.offset
          let isEnd = false
          while (!isEnd) {
            const index = s.offset - indexOffset
            const indexHex = dec2hex(index, 4)
            // console.log('-----')
            // console.log('offset', s.offset - realOffset, dec2hex(s.peekUByte()))
            // if (s.offset - realOffset === 213) {
            //   const sTemp = s.offset
            //   console.log(
            //     'DEBG',
            //     s.readUByteArray(32).map(v => dec2hex(v))
            //   )
            //   s.offset = sTemp
            // }
            const op = s.readBattleOp()
            op.index = index
            op.indexHex = indexHex
            // console.log('op', s.offset - realOffset, op.op)
            scriptObj.script.push(op)
            if (op.op === 'END') {
              isEnd = true
            }
          }
        }
        scriptObj.text = scriptObj.script.map(s => s.js)
        scriptObj.count = scriptObj.script.length
        scriptObj.length = s.offset - realOffset - 32
        delete scriptObj.offset
      }
    }

    /*
    https://wiki.ffrtt.ru/index.php/FF7/Battle/Battle_Scenes/Battle_Script
    https://forums.qhimm.com/index.php?topic=3290.msg45951#msg45951
    https://forums.qhimm.com/index.php?topic=18668.0
    https://wiki.ffrtt.ru/index.php/FF7/Battle/Battle_Scenes/Battle_AI_Addresses
    https://wiki.ffrtt.ru/index.php/FF7/Battle/Battle_Mechanics
    https://wiki.ffrtt.ru/index.php/FF7/Battle/Battle_Scenes#AI_Data
    */
    // s.offset = scriptOffsetBegin
    // data.enemyAIData = []
    // while (s.offset < s.length) {
    //   data.enemyAIData.push(s.readUByte())
    // }
    // data.enemyAIDataHex = data.enemyAIData.map(b => dec2hex(b))
    //   console.log('data', data, dec2hex(s.length), dec2hex(s.offset))
    return data
  } catch (error) {
    // For some strange reason any accessing of the s buffer on the last i causes an error. It's empty anyway, so ignore it for now..
    console.error('error', error, dataFilePointer.fileId)
    // if (dataFilePointer.fileId === 29) {
    //   console.error('error', error)
    // }
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
    dataFilePointers.push({
      blockId,
      fileId,
      from: pointerA * 4,
      to: pointerB * 4
    })

    while (pointerB !== 0xffffffff) {
      pointerA = pointerB
      pointerB = r.readUInt()
      fileId++
      if (pointerB !== 0xffffffff) {
        dataFilePointers.push({
          blockId,
          fileId,
          from: pointerA * 4,
          to: pointerB * 4
        })
      } else {
        dataFilePointers.push({
          blockId,
          fileId,
          from: pointerA * 4,
          to: 0x2000
        }) // TODO - ????
      }
    }
    fileId++
    blockId++
    r.offset = 0x2000 * blockId
  }
  // console.log('dataFilePointers', r.offset, r.length, dataFilePointers)

  const datas = []
  for (let i = 0; i < dataFilePointers.length - 1; i++) {
    const dataFilePointer = dataFilePointers[i]
    // if (dataFilePointer.fileId !== 243) continue // Temp
    const data = getDataFile(buffer, dataFilePointer)
    if (data !== null) {
      datas.push(data)
    }
  }
  //   getDataFile(buffer, dataFilePointers[3])
  return datas
}

const saveData = async (data, outputFile) => {
  //   console.log('saveData', data, outputFile)

  await fs.outputFile(outputFile, JSON.stringify(data))
}
const extractSceneBinData = async (
  inputBattleSceneDirectory,
  outputBattleSceneDirectory
) => {
  console.log('Extract scene.bin Data: START')
  const buffer = fs.readFileSync(
    path.join(inputBattleSceneDirectory, 'scene.bin')
  )
  const r = new FF7BinaryDataReader(buffer)
  const datas = getBlocks(r, buffer)
  //.filter(d => d.sceneId === 29)
  // .map(d =>
  //   d.enemyScript1
  //     ? { i: d.sceneId, m: d.enemyData1.name, l: d.enemyScript1.main.length }
  //     : { i: d.sceneId, m: d.enemyData1.name, l: 999999 }
  // )
  // .sort((a, b) => a.l - b.l)
  await saveData(datas, path.join(outputBattleSceneDirectory, 'scene.bin.json'))

  console.log('Extract scene.bin Data: END')
}
module.exports = {
  extractSceneBinData
}
