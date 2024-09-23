const fs = require('fs-extra')
const path = require('path')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { toHex2, dec2hex, printBytes } = require('./string-util.js')
const { parseAttackData } = require('./kernel-sections.js')
const { parseKernelEnums, Enums } = require('./kernel-enums.js')

const extractShopInfo = r => {
  r.offset = 0x005219c8
  const shopNames = extractShopNames(r)
  const text = extractShopText(r)
  const shops = extractShopList(r)
  const shopItemPrices = extractShopItemPrices(r)
  const shopMateriaPrices = extractShopMateriaPrices(r)
  // console.log('last r.offset', r.offset)
  const sellPriceMateriaMasterMultiplier = extractShopMateriaSellMultipler(r)

  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i]
    shop.name = shopNames[shop.shopNameType]
    delete shop.shopNameType
    for (let j = 0; j < shop.items.length; j++) {
      const item = shop.items[j]
      item.price =
        item.type === 'item'
          ? shopItemPrices[item.id]
          : shopMateriaPrices[item.id]
    }
  }
  // console.log('text', text.normal, text.slang)
  return {
    shops,
    text,
    shopItemPrices,
    shopMateriaPrices,
    sellPriceMateriaMasterMultiplier
  }
}
const extractShopNames = r => {
  const names = []
  const totalNames = 9
  const namesBytes = 20
  const sectionOffset = r.offset
  for (let i = 0; i < totalNames; i++) {
    r.offset = sectionOffset + i * namesBytes
    names.push(r.readKernelString(namesBytes))
  }
  r.offset = sectionOffset + totalNames * namesBytes
  const padding = r.readInt()
  //   console.log('names', names)
  return names
}
const extractShopText = r => {
  const text = []
  const totalText = 18
  const textBytes = 46
  const sectionOffset = r.offset
  for (let i = 0; i < totalText; i++) {
    r.offset = sectionOffset + i * textBytes
    text.push(r.readKernelString(textBytes))
  }
  r.offset = sectionOffset + totalText * textBytes
  //   console.log('text', text)
  return {
    normal: {
      hi: text[0],
      whatBuy: text[1],
      amountBuy: text[2],
      whatSell: text[3],
      amountSell: text[4],
      leave1: text[5],
      leave2: text[6],
      insufficientFunds: text[7]
    },
    slang: {
      hi: text[10],
      whatBuy: text[11],
      amountBuy: text[12],
      whatSell: text[13],
      amountSell: text[14],
      leave1: text[15],
      leave2: text[16],
      insufficientFunds: text[17]
    }
  }
}
const extractShopList = r => {
  const shops = []
  const totalSections = 80
  const textBytes = 84
  const padding = 92
  const sectionOffset = r.offset + padding
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    // r.offset = sectionOffset + (i * textBytes)
    // const val = r.readKernelString(textBytes)
    // r.offset = sectionOffset + (i * textBytes)
    // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    // text.push(val)
    // console.log('val', r.offset, i, bin, val)

    r.offset = sectionOffset + i * textBytes
    const shopNameType = r.readShort()
    const inventory = r.readShort()

    const items = []
    for (let j = 0; j < inventory; j++) {
      const materiaFlag = r.readShort()
      const unknownItem1 = r.readShort()
      const itemId = r.readShort()
      const unknownItem2 = r.readShort()
      //   items.push([materiaFlag, unknownItem1, itemId, unknownItem2])
      if (materiaFlag > 0) {
        // console.log('materiaFlag', materiaFlag)
        items.push({ type: 'materia', id: itemId })
      } else {
        items.push({ type: 'item', id: itemId })
      }
    }

    let shop = {
      shopId: i,
      shopNameType,
      items
    }
    // console.log('shop', shop, `\n\n`)
    // console.log('offset', r.offset)
    shops.push(shop)
  }
  r.offset = sectionOffset + totalSections * textBytes
  //   console.log('offset next', r.offset)
  //   console.log('shops', shops)
  return shops
}
const extractShopItemPrices = r => {
  const prices = []
  const totalSections = 320
  const textBytes = 4
  const padding = 0
  const sectionOffset = r.offset + padding
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    // r.offset = sectionOffset + (i * textBytes)
    // const val = r.readKernelString(textBytes)
    // r.offset = sectionOffset + (i * textBytes)
    // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    r.offset = sectionOffset + i * textBytes
    const price = r.readUShort()
    const unknown = r.readUShort()
    // text.push(val)
    // console.log('val', r.offset, i, bin, val, price, unknown)

    r.offset = sectionOffset + i * textBytes
    prices.push(price)
  }
  //   console.log('extractShopItemPrices', prices)
  return prices
}
const extractShopMateriaPrices = r => {
  const prices = []
  const totalSections = 96
  const textBytes = 4
  const padding = 65 * 4
  const sectionOffset = r.offset + padding
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    // r.offset = sectionOffset + (i * textBytes)
    // const val = r.readKernelString(textBytes)
    // r.offset = sectionOffset + (i * textBytes)
    // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    r.offset = sectionOffset + i * textBytes
    const price = r.readUShort()
    const unknown = r.readUShort()
    // text.push(val)
    // console.log('val', r.offset, i, bin, val, price, unknown)

    r.offset = sectionOffset + i * textBytes
    prices.push(price)
  }
  //   console.log('extractShopMateriaPrices', prices)
  return prices
}
const extractShopMateriaSellMultipler = r => {
  r.offset = 0x0031f14f
  const multiplier = r.readUByte()
  // console.log('multiplier', multiplier)
  return multiplier
}
const extractDefaultNames = r => {
  const names = []

  const totalSections = 10
  const textBytes = 12
  const sectionOffset = 0x005206b8
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    r.offset = sectionOffset + i * textBytes
    const name = r.readKernelString(textBytes)
    r.offset = sectionOffset + i * textBytes
    const bin = r
      .readUByteArray(textBytes)
      .map(b => toHex2(b))
      .join(' ')
    // console.log('val', r.offset, i, bin, name)

    r.offset = sectionOffset + i * textBytes
    names.push(name)
  }

  return names
}
const extractBlinkData = r => {
  const timFilesString = []

  let totalSections = 220 - 12
  let textBytes = 1
  let sectionOffset = 0x0050636c + 12
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    // r.offset = sectionOffset + (i * textBytes)
    // const name = r.readKernelString(textBytes)
    r.offset = sectionOffset + i * textBytes
    const tileFileLetter = r.readString(textBytes)
    // r.offset = sectionOffset + (i * textBytes)
    // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    // console.log('val', r.offset, i, bin, name, tileFileLetter)

    r.offset = sectionOffset + i * textBytes
    timFilesString.push(tileFileLetter === '' ? ' ' : tileFileLetter)
  }
  const timFiles = timFilesString
    .join('')
    .split(' ')
    .filter(f => f !== '')
  // console.log('timFiles', timFiles)

  totalSections = 152
  textBytes = 1
  sectionOffset = 0x00506534

  const modelsString = []
  for (let i = 0; i < totalSections; i++) {
    r.offset = sectionOffset + i * textBytes
    const modelsLetter = r.readString(textBytes)
    modelsString.push(modelsLetter === '' ? ' ' : modelsLetter)

    // blinkData[hrc] = {leftEye: timFiles[i * 2], rightEye: timFiles[i * 2 + 1]}
    // r.offset = sectionOffset + (i * textBytes)
    // timFilesString.push(name2 === '' ? ' ' : name2)
  }
  const models = modelsString
    .join('')
    .split(' ')
    .filter(f => f !== '')
  // console.log('models', models)

  const blinkData = {}
  for (let i = 0; i < models.length / 2; i++) {
    const name = models[i + models.length / 2]

    // Note: I haven't found the values the exe uses to map the hrc/model names to the eye texture .tims yet
    let prefix
    if (name.includes('cloud')) {
      prefix = 'c_'
    } else if (name.includes('ballet')) {
      prefix = 'b_'
    } else if (name.includes('tifa')) {
      prefix = 't_'
    } else if (name.includes('red')) {
      prefix = 'chi_red5' // RedXIII only has one eye texture, not entirely sure what to do with this second texture here (chi_red2)
    } else if (name.includes('cid')) {
      prefix = 'ci_'
    } else if (name.includes('yufi')) {
      prefix = 'y_'
    } else if (name.includes('ketcy')) {
      prefix = 'none_' // I don't think he blinks, the image is his whole face
    } else if (name.includes('vincent')) {
      prefix = 'v_'
    } else if (name.includes('rith')) {
      prefix = 'ea_'
    }
    const files = timFiles.filter(f => f.startsWith(prefix))
    if (files.length > 0) {
      const obj = { name, leftEye: files[0].replace('.tim', '') }
      if (files.length > 1) {
        obj.rightEye = files[1].replace('.tim', '')
      }
      blinkData[models[i]] = obj
    }
  }

  // console.log('blinkData', blinkData)

  return blinkData
}
const saveData = async (data, outputFile) => {
  //   console.log('saveData', data, outputFile)

  await fs.outputFile(outputFile, JSON.stringify(data))
}
const extractBattleCharacterModels = r => {
  let totalSections = 196
  let sectionOffset = 0x004fe310
  r.offset = sectionOffset
  let s = ''
  for (let i = 0; i < totalSections; i++) {
    let c = r.readUByte()
    if (c > 0) {
      s = s + String.fromCharCode(c)
    } else {
      s = s + ' '
    }
  }
  const data = s
    .replace(/ +(?= )/g, '')
    .split(' ')
    .filter(m => m !== '')
    .map((name, i) => {
      const id = i + 460
      const id2 = Math.floor(id / 26)
      const id3 = id - id2 * 26
      return {
        name,
        enemyId: id,
        hrc:
          String.fromCharCode(id2 + 97) + String.fromCharCode(id3 + 97) + 'aa'
      }
    })
  // console.log('extractBattleCharacterModels', data)
  return data
}
const numOfLimits = 71
const extractLimits = r => {
  r.offset = 0x51e0d4
  const limits = []
  for (let i = 0; i < numOfLimits; i++) {
    limits.push(parseAttackData(r))
  }
  return limits
}
const extractTifaSlots = r => {
  r.offset = 0x51d4d0
  const slots = Array.from({ length: 10 }, () => r.readUByteArray(16))
    .filter(a => a[0] !== 0)
    .map(v => v.map(vi => parseKernelEnums(Enums.Slots.Tifa, vi)))
  // console.log('slots', slots)
  return slots
}
const extractCaitSithSlots = r => {
  r.offset = 0x0051d3d8
  const slots = Array.from({ length: 3 }, () =>
    r.readUByteArray(16).map(v => parseKernelEnums(Enums.Slots.CaitSith, v))
  ).filter(a => a[0] !== 0)
  // console.log('slots', slots)
  return slots
}
const extractLimitData = r => {
  const limits = extractLimits(r)
  const tifaSlots = extractTifaSlots(r)
  const caitSithSlots = extractCaitSithSlots(r)

  // 0x0051D570 battle square stuff seems to start around here
  return { limits, tifaSlots, caitSithSlots }
}

const addFormationPositionData = (formations, count, r) => {
  for (const formationType of Object.keys(Enums.Battle.Layout)) {
    const playerPositions = []
    for (let i = 0; i < count; i++) {
      playerPositions.push({
        x: r.readShort(),
        y: r.readShort(),
        z: r.readShort()
      })
    }
    formations[formationType].positions['' + count] = playerPositions
  }
}
const addFormationRotationData = (formations, count, r) => {
  for (const formationType of Object.keys(Enums.Battle.Layout)) {
    const playerRotations = []
    for (let i = 0; i < count; i++) {
      playerRotations.push(r.readShort())
    }
    formations[formationType].rotations['' + count] = playerRotations
  }
}
const extractBattlePlayerFormationData = r => {
  // https://github.com/Akari1982/q-gears_reverse/blob/47cf28f864d48d1959719cc28c7640bd573dc43c/ffvii/address_battle.txt#L70

  r.offset = 0x003c0bf0
  const formations = Object.keys(Enums.Battle.Layout).reduce(
    (acc, item) => ({ ...acc, [item]: { positions: {}, rotations: {} } }),
    {}
  )
  addFormationPositionData(formations, 3, r)
  // console.log('3 player formation length', r.offset - 0x003c0bf0)
  const formation3PlayerPadding = r.readUByteArray(6)
  // printBytes('3 PLAYER FORMATIONS duplicate', r.readUByteArray(6 * 3 * 9, 2, 3 * 3, false))
  const formation3PlayerDuplicate = r.readUByteArray(6 * 3 * 9) // 162
  const formation3PlayerDuplicatePadding = r.readUByteArray(6)

  // console.log('2 player offset', r.offset)
  addFormationPositionData(formations, 2, r)
  const formation2PlayerPadding = r.readUByteArray(4)
  // printBytes('2 PLAYER FORMATIONS duplicate', r.readUByteArray(6 * 2 * 9, 2, 3 * 3, false))
  const formation2PlayerDuplicate = r.readUByteArray(6 * 2 * 9) // 0s
  const formation2PlayerDuplicatePadding = r.readUByteArray(4)

  // printBytes('3 player rotation', r.readUByteArray(2 * 3 * 9), 2, 3, true)
  addFormationRotationData(formations, 3, r)
  const rotation3PlayerPadding = r.readUByteArray(2)
  const rotation3PlayerDupe = r.readUByteArray(2 * 3 * 9)
  // printBytes('3 player rotation dupe', r.readUByteArray(2 * 3 * 9), 2, 3, true)
  const rotation3PlayerPaddingDupe = r.readUByteArray(2)

  addFormationRotationData(formations, 2, r)
  // printBytes('2 player rotation', r.readUByteArray(2 * 2 * 9), 2, 2, true)
  const rotation2PlayerPadding = r.readUByteArray(2)
  // console.log('rotation2PlayerPadding', rotation2PlayerPadding)
  const rotation2PlayerDiff = r.readUByteArray(2 * 2 * 9)
  // printBytes('2 player rotation diff', r.readUByteArray(2 * 2 * 9), 2, 2, true)
  const rotation2PlayerPaddingDiff = r.readUByteArray(2)
  // console.log('rotation2PlayerPaddingDiff', rotation2PlayerPaddingDiff)
  const rotationSectionPadding = r.readUByteArray(4)

  // console.log('???? r.offset', r.offset, dec2hex(r.offset))
  // printBytes('????', r.readUByteArray(2 * 4 * 9), 1, 8, 'binary')

  // r.offset - 0x3c0ee0, config section maybe?
  // 11111000 01000101 00000000 00000000 00000000 01100000 00000000 00000000 - Normal              0
  // 11111000 01000101 00000000 00000000 00000000 01100000 00000000 00000000 - Preemptive           1
  // 00000100 01000110 00000000 00000000 00000000 01010000 00000000 00000000 - BackAttack            2
  // 00001110 01000110 00000000 00000000 00000000 01010000 00000000 00000000 - SideAttack1            3
  // 00001110 01000110 00000000 00000000 00000000 01010000 00000000 00000000 - PincerAttack            4
  // 00001110 01000110 00000000 00000000 00000000 01010000 00000000 00000000 - SideAttack2            3
  // 00001110 01000110 00000000 00000000 00000000 01010000 00000000 00000000 - SideAttack3            3
  // 00001110 01000110 00000000 00000000 00000000 01010000 00000000 00000000 - SideAttack4            3
  // 11111000 01000101 00000000 00000000 00000000 01100000 00000000 00000000 - NormalLockFrontRow  0

  // r.offset = 0x003c09c8 // Not sure what this is yet:
  // printBytes('????2', r.readUByteArray(2 * 4 * 10), 1, 10, 'binary')
  // 00000000 00000000 00000000 00000000 00000001 00000000 00000000 00000000 00000001 00000000
  // 00000000 00000000 00000010 00000000 00000000 00000000 00001000 00101001 01011110 00000000
  // 00000000 00000000 00000000 00000000 00000001 00000000 00000000 00000000 00000001 00000000
  // 00000000 00000000 00000010 00000000 00000000 00000000 00001000 00101001 01011110 00000000
  // 00000000 00000000 00000000 00000000 00000001 00000000 00000000 00000000 00000001 00000000
  // 00000000 00000000 00000010 00000000 00000000 00000000 00001000 00101001 01011110 00000000
  // 00000000 00000000 00000000 00000000 00000001 00000000 00000000 00000000 00000000 00000000
  // 00000000 00000000 00000011 00000000 00000000 00000000 00000000 00000000 00000000 00000000

  // console.log('formations', JSON.stringify(formations, null, 2))
  // console.log(
  //   'formations',
  //   JSON.stringify(formations.NormalLockFrontRow, null, 2)
  // )

  // 0x003B62F0 - This appears to be the place that battle text, eg, Pre-emptive Attack!
  // 00 01 02 03   04 03 03 03   05 00 00 00   00 00 00 00

  return formations
}
const extractExeData = async (inputExeDirectory, outputExeDirectory) => {
  let buffer = fs.readFileSync(path.join(inputExeDirectory, 'ff7_en.exe'))
  let r = new FF7BinaryDataReader(buffer)
  const shopData = extractShopInfo(r)
  const defaultNames = extractDefaultNames(r)
  const blinkData = extractBlinkData(r)
  const battleCharacterModels = extractBattleCharacterModels(r)
  const limitData = extractLimitData(r)
  const battlePlayerFormationData = extractBattlePlayerFormationData(r)
  const data = {
    shopData,
    defaultNames,
    blinkData,
    battleCharacterModels,
    battlePlayerFormationData,
    limitData
  }
  await saveData(data, path.join(outputExeDirectory, 'ff7.exe.json'))
}
module.exports = {
  extractExeData
}
