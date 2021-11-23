const fs = require('fs-extra')
const path = require('path')

const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')

const extractShopInfo = (exePath) => {
  let buffer = fs.readFileSync(exePath)
  //   console.log('buffer', buffer, exePath)
  let r = new FF7BinaryDataReader(buffer)
  r.offset = 0x005219C8
  const shopNames = extractShopNames(r)
  const text = extractShopText(r)
  const shops = extractShopList(r)
  const shopItemPrices = extractShopItemPrices(r)
  const shopMateriaPrices = extractShopMateriaPrices(r)

  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i]
    shop.name = shopNames[shop.shopNameType]
    delete shop.shopNameType
    for (let j = 0; j < shop.items.length; j++) {
      const item = shop.items[j]
      item.price = item.type === 'item' ? shopItemPrices[item.id] : shopMateriaPrices[item.id]
    }
  }
  //   console.log('shops', shops[2])
  return {
    shops, text
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
  return text
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
const saveData = async (data, outputFile) => {
//   console.log('saveData', data, outputFile)

  await fs.outputFile(outputFile, JSON.stringify(data))
}
const extractExeData = async (inputExeDirectory, outputExeDirectory) => {
  console.log('Extract Exe Data: START')
  //   extractAllStrings(path.join(inputExeDirectory, 'ff7_en.exe'))
  const shopData = extractShopInfo(path.join(inputExeDirectory, 'ff7_en.exe'))

  const data = {
    shopData
  }
  await saveData(data, path.join(outputExeDirectory, 'ff7.exe.json'))

  console.log('Extract Exe Data: END')
}
module.exports = {
  extractExeData
}

/*
Headband, silver Glasses, star pendant, talisman, white cape, fury ring
 12, 11, 10,  3, 15, 24
300,299,298,291,303,312

 0C 0B 0A 03 0F 18

 012C 012B 012A 0123 012F 0138

 50 300 80
 0032, 012C, 0050
 051E08

 0 7 8 49 50 52 53
00 07 08 31 32 34 35

 600 600 600 750
0258 0258 0258 02EE
*/
