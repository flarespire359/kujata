const fs = require('fs-extra')
const path = require('path')

const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { printBytes, dec2hex } = require('./string-util.js')

const CAMERA_SCRIPT_TYPE = {
  CAMERA_POSITION: 'readBattleCameraPositionOp',
  CAMERA_DIRECTION: 'readBattleCameraDirectionOp',
  VICTORY_POSITION: 'readBattleCameraVictoryPositionOp',
  VICTORY_DIRECTION: 'readBattleCameraVictoryDirectionOp'
}
const findClosestAboveAndBelow = (number, sortedList) => {
  let low = 0
  let high = sortedList.length - 1

  let closestBelow = null
  let closestAbove = null

  while (low <= high) {
    let mid = Math.floor((low + high) / 2)

    if (sortedList[mid] === number) {
      closestBelow = sortedList[mid]
      closestAbove = sortedList[mid]
      break
    } else if (sortedList[mid] < number) {
      closestBelow = sortedList[mid]
      low = mid + 1
    } else {
      closestAbove = sortedList[mid]
      high = mid - 1
    }
  }

  return [closestBelow, closestAbove]
}

const readCameraScript = (r, cameraScriptType, sortedOffsets) => {
  const script = []
  // console.log('script start', r.offset)
  let endFound = false
  //   for (let i = 0; i < 16; i++) {
  while (!endFound) {
    // if (r.offset === 5968 - 1 - 99999) {
    //   console.log(
    //     'script',
    //     script,
    //     r.offset,
    //     findClosestAboveAndBelow(r.offset, sortedOffsets)
    //   )
    // }
    const op =
      cameraScriptType === CAMERA_SCRIPT_TYPE.CAMERA_POSITION ||
      cameraScriptType === CAMERA_SCRIPT_TYPE.VICTORY_POSITION
        ? r.readBattleCameraPositionOp()
        : r.readBattleCameraTargetOp()
    script.push(op)
    // if (op.op === 'F8') {
    // console.log('op', JSON.stringify(op))
    // }

    if (op.op === 'RET') {
      while (r.peekUByte() === 0x00) {
        r.readUByte()
      }
      endFound = true
      // if (!a.includes(r.offset) && !b.includes(r.offset)) {
      //   console.log(
      //     'end cleanly',
      //     r.offset,
      //     a.includes(r.offset),
      //     b.includes(r.offset),
      //     hasF8,
      //     '-',
      //     findClosestAboveAndBelow(r.offset, a),
      //     findClosestAboveAndBelow(r.offset, b)
      //     // script
      //   )
      //   return script
      // }
    }
  }
  return script
}

const getOffsets = (r, start, length) => {
  r.offset = start
  const offsets = r
    .readUShortArray(length / 2)
    .filter((_, i) => i % 2 === 0)
    .sort((a, b) => a > b)
  return offsets
}

// Note: camdat1.bin 0x16EA to 0x1717 ends with 00 rather than FF, eg parsing error
// Note: camdat2.bin 0x1720 to 0x174F ends with 00 rather than FF, eg parsing error
const getScripts = (
  r,
  scriptOffsets,
  cameraType,
  optionalOffset,
  sortedOffsets
) => {
  const scripts = []
  // console.log('script start', r.offset)
  for (const [i, offset] of scriptOffsets.entries()) {
    // console.log('positionScriptOffset', i, offset, dec2hex(offset))
    r.offset = optionalOffset ? optionalOffset + offset : offset
    try {
      scripts.push(readCameraScript(r, cameraType, sortedOffsets))
    } catch (error) {
      console.log('error', r.offset)
      scripts.push([{ error: true }])
    }
  }
  return scripts
}

const getInitialCamData = config => {
  // Initial camera data in exe:
  // Index references:    ??
  // Start of indexes?    0x004FFAD0 to 0x004FFDFF    5241552 to 5242367
  // Start of scripts:    0x004FEBA0 to 0x004FFACF    5237664 to 5241551

  // 0x9001A0 for indexes
  // 0x9010D0 for position scripts +3888
  // 0x901270 for focus scripts +416

  // 416
  const buffer = fs.readFileSync(
    path.join(config.ff7InstallDirectory, 'ff7_en.exe')
  )
  const r = new FF7BinaryDataReader(buffer)
  r.offset = 0x004ffad0
  const positionScriptOffsets = getOffsets(r, 0x004ffad0, 416 - 4) // Seems to be a 0 in the last position
  const targetScriptOffsets = getOffsets(r, 0x004ffad0 + 416, 416 - 4) // Seems to be a 1 in the last position
  // console.log('positionScriptOffsets', positionScriptOffsets)
  // console.log('directionScriptOffsets', directionScriptOffsets)

  const sortedOffsets = [...positionScriptOffsets, ...targetScriptOffsets].sort(
    (a, b) => a - b
  )
  // console.log('sortedOffsets', sortedOffsets)

  const positionScripts = getScripts(
    r,
    positionScriptOffsets,
    CAMERA_SCRIPT_TYPE.CAMERA_POSITION,
    0x004feba0 - 416,
    sortedOffsets
  )
  const targetScripts = getScripts(
    r,
    targetScriptOffsets,
    CAMERA_SCRIPT_TYPE.CAMERA_DIRECTION,
    0x004feba0 - 416,
    sortedOffsets
  )
  return {
    positionScriptOffsets,
    targetScriptOffsets,
    positionScripts,
    targetScripts
  }
}
const getCamDataFromFile = (config, i) => {
  const buffer = fs.readFileSync(
    path.join(
      config.ff7InstallDirectory,
      'data',
      'lang-en',
      'battle',
      `camdat${i}.bin`
    )
  )

  const r = new FF7BinaryDataReader(buffer)
  const header = {
    offsetMainPosition: r.readUShort(),
    unkHeader1: r.readUShort(),
    offsetMainTarget: r.readUShort(),
    unkHeader2: r.readUShort(),
    offsetVictoryPosition: r.readUShort(),
    unkHeader3: r.readUShort(),
    offsetVictoryTarget: r.readUShort(),
    unkHeader4: r.readUShort()
  }

  // Read Pointers
  const scriptOffsetsMainPosition = getOffsets(
    r,
    header.offsetMainPosition,
    header.offsetMainTarget - header.offsetMainPosition
  )
  const scriptOffsetsMainTarget = getOffsets(
    r,
    header.offsetMainTarget,
    header.offsetMainTarget - header.offsetMainPosition // eg, same as position script
  )

  const scriptOffsetsVictoryPosition = getOffsets(
    r,
    header.offsetVictoryPosition,
    header.offsetVictoryTarget - header.offsetVictoryPosition
  )
  const scriptOffsetsVictoryTarget = getOffsets(
    r,
    header.offsetVictoryTarget,
    header.offsetVictoryTarget - header.offsetVictoryPosition // eg, same as position script
  )

  const cam = {
    scriptOffsets: { main: [], victory: [] },
    scripts: { main: [], victory: [] }
  }
  for (let i = 0; i < scriptOffsetsMainPosition.length; i++) {
    cam.scriptOffsets.main.push({
      position: scriptOffsetsMainPosition[i],
      target: scriptOffsetsMainTarget[i]
    })
  }
  for (let i = 0; i < scriptOffsetsVictoryPosition.length; i++) {
    cam.scriptOffsets.victory.push({
      position: scriptOffsetsVictoryPosition[i],
      target: scriptOffsetsVictoryTarget[i]
    })
  }

  const sortedOffsetsMain = [
    ...scriptOffsetsMainPosition,
    ...scriptOffsetsMainTarget
  ].sort((a, b) => a - b)
  const sortedOffsetsVictory = [
    ...scriptOffsetsVictoryPosition,
    ...scriptOffsetsVictoryTarget
  ].sort((a, b) => a - b)

  const scriptsMainPosition = getScripts(
    r,
    scriptOffsetsMainPosition,
    CAMERA_SCRIPT_TYPE.CAMERA_POSITION,
    null,
    sortedOffsetsMain
  )
  const scriptsMainTarget = getScripts(
    r,
    scriptOffsetsMainTarget,
    CAMERA_SCRIPT_TYPE.CAMERA_DIRECTION,
    null,
    sortedOffsetsMain
  )
  const scriptsVictoryPosition = getScripts(
    r,
    scriptOffsetsVictoryPosition,
    CAMERA_SCRIPT_TYPE.VICTORY_POSITION,
    null,
    sortedOffsetsVictory
  )
  const scriptsVictoryTarget = getScripts(
    r,
    scriptOffsetsVictoryTarget,
    CAMERA_SCRIPT_TYPE.VICTORY_DIRECTION,
    null,
    sortedOffsetsVictory
  )
  for (let i = 0; i < scriptsMainPosition.length; i++) {
    cam.scripts.main.push({
      position: scriptsMainPosition[i],
      target: scriptsMainTarget[i]
    })
  }
  for (let i = 0; i < scriptsVictoryPosition.length; i++) {
    cam.scripts.victory.push({
      position: scriptsVictoryPosition[i],
      target: scriptsVictoryTarget[i]
    })
  }

  return cam
}
const writeCamData = (config, camData) => {
  const filePath = path.join(
    config.kujataDataDirectory,
    'data',
    'battle',
    'camdat.bin.json'
  )
  fs.ensureDirSync(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(camData))
}
const extractBattleCameraData = async config => {
  // https://forums.qhimm.com/index.php?topic=9126.msg124233#msg124233
  // https://github.com/q-gears/q-gears-reversing-data/blob/2b155a8c5455f5fc8addd2eda9e5cd4c226abe34/reversing/ffvii/ffvii_battle/camera/camera_script_export_attack_normal.lua

  const cam = { camdataFiles: [] }
  for (let i = 0; i < 3; i++) {
    const camdataFileData = getCamDataFromFile(config, i)
    cam.camdataFiles.push(camdataFileData)
  }

  const initialCamData = getInitialCamData(config)

  cam.intialScriptOffsets = []
  for (let i = 0; i < initialCamData.positionScriptOffsets.length; i++) {
    cam.intialScriptOffsets.push({
      position: initialCamData.positionScriptOffsets[i],
      target: initialCamData.targetScriptOffsets[i]
    })
  }
  cam.initialScripts = []
  for (let i = 0; i < initialCamData.positionScripts.length; i++) {
    cam.initialScripts.push({
      position: initialCamData.positionScripts[i],
      target: initialCamData.targetScripts[i]
    })
  }

  // I can't find this in the data even though:
  // https://forums.qhimm.com/index.php?topic=9126.msg124233#msg124233 -> 0x7C2528
  cam.battleTypesCamDataIndex = {
    Normal: 0,
    Preemptive: 0,
    BackAttack: 1,
    SideAttack1: 2,
    PincerAttack: 2,
    SideAttack2: 2,
    SideAttack3: 2,
    SideAttack4: 2,
    NormalLockFrontRow: 0
  }

  writeCamData(config, cam)

  // console.log('initial position', cam.initialScripts[0].position)
  // console.log('initial target', cam.initialScripts[0].target)
  // console.log(
  //   'cam0 main position',
  //   cam.camdataFiles[0].scripts.main[0].position
  // )
  // console.log('cam0 main target', cam.camdataFiles[0].scripts.main[0].target)
}
module.exports = { extractBattleCameraData }
