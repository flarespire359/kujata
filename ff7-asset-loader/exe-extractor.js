const fs = require('fs-extra')
const path = require('path')

const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { toHex2 } = require('./string-util.js')

const extractShopInfo = (r) => {
  r.offset = 0x005219C8
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
      item.price = item.type === 'item' ? shopItemPrices[item.id] : shopMateriaPrices[item.id]
    }
  }
  // console.log('text', text.normal, text.slang)
  return {
    shops, text, shopItemPrices, shopMateriaPrices, sellPriceMateriaMasterMultiplier
  }
}
const extractShopNames = (r) => {
  const names = []
  const totalNames = 9
  const namesBytes = 20
  const sectionOffset = r.offset
  for (let i = 0; i < totalNames; i++) {
    r.offset = sectionOffset + (i * namesBytes)
    names.push(r.readKernelString(namesBytes))
  }
  r.offset = sectionOffset + (totalNames * namesBytes)
  const padding = r.readInt()
  //   console.log('names', names)
  return names
}
const extractShopText = (r) => {
  const text = []
  const totalText = 18
  const textBytes = 46
  const sectionOffset = r.offset
  for (let i = 0; i < totalText; i++) {
    r.offset = sectionOffset + (i * textBytes)
    text.push(r.readKernelString(textBytes))
  }
  r.offset = sectionOffset + (totalText * textBytes)
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
const extractShopList = (r) => {
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

    r.offset = sectionOffset + (i * textBytes)
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
        items.push({type: 'materia', id: itemId})
      } else {
        items.push({type: 'item', id: itemId})
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
  r.offset = sectionOffset + (totalSections * textBytes)
  //   console.log('offset next', r.offset)
  //   console.log('shops', shops)
  return shops
}
const extractShopItemPrices = (r) => {
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
    r.offset = sectionOffset + (i * textBytes)
    const price = r.readUShort()
    const unknown = r.readUShort()
    // text.push(val)
    // console.log('val', r.offset, i, bin, val, price, unknown)

    r.offset = sectionOffset + (i * textBytes)
    prices.push(price)
  }
  //   console.log('extractShopItemPrices', prices)
  return prices
}
const extractShopMateriaPrices = (r) => {
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
    r.offset = sectionOffset + (i * textBytes)
    const price = r.readUShort()
    const unknown = r.readUShort()
    // text.push(val)
    // console.log('val', r.offset, i, bin, val, price, unknown)

    r.offset = sectionOffset + (i * textBytes)
    prices.push(price)
  }
  //   console.log('extractShopMateriaPrices', prices)
  return prices
}
const extractShopMateriaSellMultipler = (r) => {
  r.offset = 0x0031F14F
  const multiplier = r.readUByte()
  // console.log('multiplier', multiplier)
  return multiplier
}
const extractDefaultNames = (r) => {
  const names = []

  const totalSections = 10
  const textBytes = 12
  const sectionOffset = 0x005206B8
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    r.offset = sectionOffset + (i * textBytes)
    const name = r.readKernelString(textBytes)
    r.offset = sectionOffset + (i * textBytes)
    const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    // console.log('val', r.offset, i, bin, name)

    r.offset = sectionOffset + (i * textBytes)
    names.push(name)
  }

  return names
}
const extractBlinkData = (r) => {
  const timFilesString = []

  let totalSections = 220 - 12
  let textBytes = 1
  let sectionOffset = 0x0050636C + 12
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    // r.offset = sectionOffset + (i * textBytes)
    // const name = r.readKernelString(textBytes)
    r.offset = sectionOffset + (i * textBytes)
    const tileFileLetter = r.readString(textBytes)
    // r.offset = sectionOffset + (i * textBytes)
    // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    // console.log('val', r.offset, i, bin, name, tileFileLetter)

    r.offset = sectionOffset + (i * textBytes)
    timFilesString.push(tileFileLetter === '' ? ' ' : tileFileLetter)
  }
  const timFiles = timFilesString.join('').split(' ').filter(f => f !== '')
  // console.log('timFiles', timFiles)

  const blinkData = {}

  totalSections = 8
  textBytes = 8
  sectionOffset = 0x00506534
  // console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    // r.offset = sectionOffset + (i * textBytes)
    // const name = r.readKernelString(textBytes)
    r.offset = sectionOffset + (i * textBytes)
    const hrc = r.readString(textBytes)
    // r.offset = sectionOffset + (i * textBytes)
    // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    // console.log('val', r.offset, i, bin, name, '-' + hrc + '-')

    blinkData[hrc] = {leftEye: timFiles[i * 2], rightEye: timFiles[i * 2 + 1]}
    // r.offset = sectionOffset + (i * textBytes)
    // timFilesString.push(name2 === '' ? ' ' : name2)
  }
  // const timFiles = timFilesString.join('').split(' ').filter(f => f !== '')
  console.log('blinkData', blinkData)

  return blinkData
}
const saveData = async (data, outputFile) => {
//   console.log('saveData', data, outputFile)

  await fs.outputFile(outputFile, JSON.stringify(data))
}
const extractExeData = async (inputExeDirectory, outputExeDirectory) => {
  console.log('Extract Exe Data: START')
  let buffer = fs.readFileSync(path.join(inputExeDirectory, 'ff7_en.exe'))
  let r = new FF7BinaryDataReader(buffer)
  const shopData = extractShopInfo(r)
  const defaultNames = extractDefaultNames(r)
  const blinkData = extractBlinkData(r)
  const data = {
    shopData,
    defaultNames,
    blinkData
  }
  await saveData(data, path.join(outputExeDirectory, 'ff7.exe.json'))

  console.log('Extract Exe Data: END')
}
module.exports = {
  extractExeData
}
