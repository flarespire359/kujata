const fs = require('fs-extra')
const path = require('path')

const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { TexFile } = require('./tex-file')
const { toHex2 } = require('./string-util')
const { extractAllAssetsAndPalettes, extractFontElement, joinMetaData } = require('./menu-extractor')
// const extractShopInfo = (exePath) => {
//   let buffer = fs.readFileSync(exePath)
//   //   console.log('buffer', buffer, exePath)
//   let r = new FF7BinaryDataReader(buffer)
//   r.offset = 0x005219C8
//   const shopNames = extractShopNames(r)
//   const text = extractShopText(r)
//   const shops = extractShopList(r)
//   const shopItemPrices = extractShopItemPrices(r)
//   const shopMateriaPrices = extractShopMateriaPrices(r)

//   for (let i = 0; i < shops.length; i++) {
//     const shop = shops[i]
//     shop.name = shopNames[shop.shopNameType]
//     delete shop.shopNameType
//     for (let j = 0; j < shop.items.length; j++) {
//       const item = shop.items[j]
//       item.price = item.type === 'item' ? shopItemPrices[item.id] : shopMateriaPrices[item.id]
//     }
//   }
//   //   console.log('shops', shops[2])
//   return {
//     shops, text
//   }
// }
// const extractShopNames = (r) => {
//   const names = []
//   const totalNames = 9
//   const namesBytes = 20
//   const sectionOffset = r.offset
//   for (let i = 0; i < totalNames; i++) {
//     r.offset = sectionOffset + (i * namesBytes)
//     names.push(r.readKernelString(namesBytes))
//   }
//   r.offset = sectionOffset + (totalNames * namesBytes)
//   const padding = r.readInt()
//   //   console.log('names', names)
//   return names
// }
// const extractShopText = (r) => {
//   const text = []
//   const totalText = 18
//   const textBytes = 46
//   const sectionOffset = r.offset
//   for (let i = 0; i < totalText; i++) {
//     r.offset = sectionOffset + (i * textBytes)
//     text.push(r.readKernelString(textBytes))
//   }
//   r.offset = sectionOffset + (totalText * textBytes)
//   //   console.log('text', text)
//   return {
//     normal: {
//       hi: text[0],
//       whatBuy: text[1],
//       whatSell: text[2],
//       amountBuy: text[3],
//       amountSell: text[4],
//       leave1: text[5],
//       leave2: text[6],
//       unsufficientFunds: text[7]
//     },
//     slang: {
//       hi: text[10],
//       whatBuy: text[11],
//       whatSell: text[12],
//       amountBuy: text[13],
//       amountSell: text[14],
//       leave1: text[15],
//       leave2: text[16],
//       unsufficientFunds: text[17]
//     }
//   }
// }
// const extractShopList = (r) => {
//   const shops = []
//   const totalSections = 80
//   const textBytes = 84
//   const padding = 92
//   const sectionOffset = r.offset + padding
//   //   console.log('section total', 0x00523858 - sectionOffset)
//   for (let i = 0; i < totalSections; i++) {
//     // r.offset = sectionOffset + (i * textBytes)
//     // const val = r.readKernelString(textBytes)
//     // r.offset = sectionOffset + (i * textBytes)
//     // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
//     // text.push(val)
//     // console.log('val', r.offset, i, bin, val)

//     r.offset = sectionOffset + (i * textBytes)
//     const shopNameType = r.readShort()
//     const inventory = r.readShort()

//     const items = []
//     for (let j = 0; j < inventory; j++) {
//       const materiaFlag = r.readShort()
//       const unknownItem1 = r.readShort()
//       const itemId = r.readShort()
//       const unknownItem2 = r.readShort()
//       //   items.push([materiaFlag, unknownItem1, itemId, unknownItem2])
//       if (materiaFlag > 0) {
//         // console.log('materiaFlag', materiaFlag)
//         items.push({type: 'materia', id: itemId})
//       } else {
//         items.push({type: 'item', id: itemId})
//       }
//     }

//     let shop = {
//       shopId: i,
//       shopNameType,
//       items
//     }
//     // console.log('shop', shop, `\n\n`)
//     // console.log('offset', r.offset)
//     shops.push(shop)
//   }
//   r.offset = sectionOffset + (totalSections * textBytes)
//   //   console.log('offset next', r.offset)
//   //   console.log('shops', shops)
//   return shops
// }
// const extractShopItemPrices = (r) => {
//   const prices = []
//   const totalSections = 320
//   const textBytes = 4
//   const padding = 0
//   const sectionOffset = r.offset + padding
//   //   console.log('section total', 0x00523858 - sectionOffset)
//   for (let i = 0; i < totalSections; i++) {
//     // r.offset = sectionOffset + (i * textBytes)
//     // const val = r.readKernelString(textBytes)
//     // r.offset = sectionOffset + (i * textBytes)
//     // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
//     r.offset = sectionOffset + (i * textBytes)
//     const price = r.readUShort()
//     const unknown = r.readUShort()
//     // text.push(val)
//     // console.log('val', r.offset, i, bin, val, price, unknown)

//     r.offset = sectionOffset + (i * textBytes)
//     prices.push(price)
//   }
//   //   console.log('extractShopItemPrices', prices)
//   return prices
// }
// const extractShopMateriaPrices = (r) => {
//   const prices = []
//   const totalSections = 96
//   const textBytes = 4
//   const padding = 65 * 4
//   const sectionOffset = r.offset + padding
//   //   console.log('section total', 0x00523858 - sectionOffset)
//   for (let i = 0; i < totalSections; i++) {
//     // r.offset = sectionOffset + (i * textBytes)
//     // const val = r.readKernelString(textBytes)
//     // r.offset = sectionOffset + (i * textBytes)
//     // const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
//     r.offset = sectionOffset + (i * textBytes)
//     const price = r.readUShort()
//     const unknown = r.readUShort()
//     // text.push(val)
//     // console.log('val', r.offset, i, bin, val, price, unknown)

//     r.offset = sectionOffset + (i * textBytes)
//     prices.push(price)
//   }
//   //   console.log('extractShopMateriaPrices', prices)
//   return prices
// }

const convertImages = async (inputDir, outputDir) => {
  const images = (await fs.readdir(inputDir)).filter(f => f.endsWith('.tex'))
  // console.log('images', images)
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const imagePngName = image.replace('.tex', '.png')
    new TexFile().loadTexFileFromPath(path.join(inputDir, image)).saveAsPng(path.join(outputDir, imagePngName))
  }
  return []
}
const extractPeople = (peopleBinPath) => {
  const lines = []
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ12:,.&()\'“”-3ÅÁÄÓÖÉÈÜ '.split('')

  // for (let i = 0; i < letters.length; i++) {
  //   const l = letters[i]
  //   console.log(`{"id":${i},"description":"credits big font ${('' + i).padStart(3, '0')}","x":${(i % 8) * 32},"y":${(Math.trunc(i / 8) * 40)},"w":32,"h":40,"colors":[["white",1],["red",2],["green",3],["blue",4]],"char":"${l}"},`)
  // }
  letters[0x2f] = ' '
  letters[0x7f] = '~'
  let buffer = fs.readFileSync(peopleBinPath)
  //   console.log('buffer', buffer, exePath)
  let r = new FF7BinaryDataReader(buffer)
  // const prices = []
  const totalSections = 539
  // const totalSections = 40
  const textBytes = 64
  const padding = 0
  const sectionOffset = r.offset + padding
  //   console.log('section total', 0x00523858 - sectionOffset)
  for (let i = 0; i < totalSections; i++) {
    r.offset = sectionOffset + (i * textBytes)
    const val = r.readKernelString(textBytes)
    r.offset = sectionOffset + (i * textBytes)
    const bin = r.readUByteArray(textBytes).map(b => toHex2(b)).join(' ')
    r.offset = sectionOffset + (i * textBytes)
    const mappedLetters = r.readUByteArray(textBytes).map(b => letters[b] === undefined ? ' ' : letters[b]).join('')
    r.offset = sectionOffset + (i * textBytes)

    // 3 - https://youtu.be/xvOSFCuznIo?t=231
    const font = r.readUInt() // 0 - big,  1 - thinner title font with underline, 2 - thinner font no underline , 3 - thinner with no underline??? 4 - thinner with underline tiny, 5 - thinner no underline tiny
    const color = r.readUInt() // 0 - white, 1 - red, 2 - green, 3 - blue
    const unknown = r.readUInt()
    let nameByteArray = r.readUByteArray(48)
    nameByteArray = nameByteArray.splice(0, nameByteArray.indexOf(127))
    const name = nameByteArray.map(b => letters[b] === undefined ? ' ' : letters[b]).join('')
    // const name2 = r.readUByteArray(5).map(b => letters[b] === undefined ? ' ' : letters[b]).join('')
    const layoutMaybe = r.readByte() // hex of 50 24 3c 12 28
    const unknown3 = toHex2(r.readByte())
    const unknown4 = toHex2(r.readByte())
    const unknown5 = toHex2(r.readByte())

    // const unknown = r.readUShort()
    // text.push(val)
    let spaces = 0
    if (r.offset < 100) {
      spaces++
    }
    if (r.offset < 1000) {
      spaces++
    }
    if (i < 10) {
      spaces++
    }
    if (i < 100) {
      spaces++
    }
    // console.log('val', r.offset, i, ''.padStart(spaces), bin, mappedLetters, font, color, layoutMaybe, name)
    // if (font > 4) {
    //   console.log('val', r.offset, i, ''.padStart(spaces), bin, mappedLetters, font, color, name, something, '-', unknown, unknown3, unknown4, unknown5)
    // }
    lines.push({type: font, color: color, name: name, layout: layoutMaybe})
    r.offset = sectionOffset + (i * textBytes)
    // prices.push(price)
  }
  // console.log('lines', lines)
  return lines
}
const extractCreditFonts = async (inputCreditsDirectory, outputCDDirectory, metadataDirectory) => {
  await extractAllAssetsAndPalettes(inputCreditsDirectory, outputCDDirectory) // TODO - This doesn't seem to give the expected colors

  const outputDirMetaDataCredits = path.join(metadataDirectory, 'credits-assets')

  if (!fs.existsSync(outputDirMetaDataCredits)) {
    fs.ensureDirSync(outputDirMetaDataCredits)
  } else {
    fs.emptyDirSync(outputDirMetaDataCredits)
  }

  const creditsMetaData = {}

  // Fonts
  const fontMetaDataFiles = [
    'font',
    'font_ua',
    'font_ub'
  ]
  for (let i = 0; i < fontMetaDataFiles.length; i++) {
    const fontMetaDataFile = fontMetaDataFiles[i]
    console.log(`Extracting font ${i + 1} of ${fontMetaDataFiles.length} - ${fontMetaDataFile} - ${metadataDirectory}`)
    const fontMenuMetaData = await extractFontElement(
      fontMetaDataFile,
      outputCDDirectory,
      metadataDirectory,
      'credits'
    )
    joinMetaData(creditsMetaData, fontMenuMetaData)
  }

  await fs.writeJson(
    path.join(metadataDirectory, 'credits-assets', 'credits-font.metadata.json'),
    creditsMetaData
  )
  console.log('metadataDirectory', metadataDirectory)
}
const saveData = async (data, outputFile) => {
  await fs.outputFile(outputFile, JSON.stringify(data))
}
const extractCreditsData = async (inputCreditsDirectory, outputCDDirectory, metadataDirectory) => {
  console.log('Extract Credits Data: START')
  //   extractAllStrings(path.join(inputExeDirectory, 'ff7_en.exe'))
  const outputCreditsDirectory = path.join(outputCDDirectory, 'credits')

  if (!fs.existsSync(outputCreditsDirectory)) {
    fs.ensureDirSync(outputCreditsDirectory)
  } else {
    fs.emptyDirSync(outputCreditsDirectory)
  }

  // const images = await convertImages(inputCreditsDirectory, outputCreditsDirectory)
  const lines = extractPeople(path.join(inputCreditsDirectory, 'people.bin'))
  await extractCreditFonts(inputCreditsDirectory, outputCreditsDirectory, metadataDirectory)
  const data = {
    // images,
    lines
  }
  await saveData(data, path.join(outputCreditsDirectory, 'credits.json'))

  console.log('Extract Credits Data: END')
}
module.exports = {
  extractCreditsData
}
