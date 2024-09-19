const fs = require('fs-extra')
const path = require('path')

const sharp = require('sharp')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { TexFile } = require('./tex-file')
const { toHex2 } = require('./string-util')
const {
  extractAllAssetsAndPalettes,
  extractFontElement,
  joinMetaData
} = require('./menu-extractor')

const convertImages = async (inputDir, outputDir) => {
  const images = (await fs.readdir(inputDir)).filter(f => f.endsWith('.tex'))
  // console.log('images', images)
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const imagePngName = image.replace('.tex', '.png')
    const tex = new TexFile().loadTexFileFromPath(path.join(inputDir, image))
    await tex.saveAsPng(path.join(outputDir, imagePngName))
  }
  return []
}
const extractPeople = peopleBinPath => {
  const lines = []
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ12:,.&()'“”-3ÅÁÄÓÖÉÈÜ ".split('')

  // for (let i = 0; i < letters.length; i++) {
  //   const l = letters[i]ß
  //   console.log(`{"id":${i},"description":"credits big font ${('' + i).padStart(3, '0')}","x":${(i % 8) * 32},"y":${(Math.trunc(i / 8) * 40)},"w":32,"h":40,"colors":[["white",1],["red",2],["green",3],["blue",4]],"char":"${l}"},`)
  // }
  letters[0x2f] = ' '
  letters[0x7f] = '~'
  letters[0x30] = '*'
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
    r.offset = sectionOffset + i * textBytes
    const val = r.readKernelString(textBytes)
    r.offset = sectionOffset + i * textBytes
    const bin = r
      .readUByteArray(textBytes)
      .map(b => toHex2(b))
      .join(' ')
    r.offset = sectionOffset + i * textBytes
    const mappedLetters = r
      .readUByteArray(textBytes)
      .map(b => (letters[b] === undefined ? ' ' : letters[b]))
      .join('')
    r.offset = sectionOffset + i * textBytes

    // 3 - https://youtu.be/xvOSFCuznIo?t=231
    const font = r.readUInt() // 0 - big,  1 - thinner title font with underline, 2 - thinner font no underline , 3 - thinner with no underline??? 4 - thinner with underline tiny, 5 - thinner no underline tiny
    const color = r.readUInt() // 0 - white, 1 - red, 2 - green, 3 - blue
    const unknown = r.readUInt()
    let nameByteArray = r.readUByteArray(48)
    nameByteArray = nameByteArray.splice(0, nameByteArray.indexOf(127))
    const name = nameByteArray
      .map(b => (letters[b] === undefined ? ' ' : letters[b]))
      .join('')
    let names = [name]
    if (name.includes('*')) {
      names = name.split('*')
    }
    // const name2 = r.readUByteArray(5).map(b => letters[b] === undefined ? ' ' : letters[b]).join('')
    const linePadding = r.readByte() // hex of 50 24 3c 12 28
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
    // if (name.includes('MASATERU')) {
    //   console.log('val', r.offset, i, ''.padStart(spaces), bin, mappedLetters, font, color, names, linePadding, '-', unknown, unknown3, unknown4, unknown5)
    // }
    lines.push({
      type: font,
      color: color,
      names: names,
      linePadding: linePadding
    })
    r.offset = sectionOffset + i * textBytes
    // prices.push(price)
  }
  // console.log('lines', lines)
  return { lines }
}
const extractCreditFonts = async (
  inputCreditsDirectory,
  outputCDDirectory,
  metadataDirectory
) => {
  await extractAllAssetsAndPalettes(inputCreditsDirectory, outputCDDirectory) // TODO - This doesn't seem to give the expected colors

  const outputDirMetaDataCredits = path.join(
    metadataDirectory,
    'credits-assets'
  )
  cleanDir(outputDirMetaDataCredits)

  const creditsMetaData = {}

  // Fonts
  const fontMetaDataFiles = ['font', 'font_ua', 'font_ub']
  for (let i = 0; i < fontMetaDataFiles.length; i++) {
    const fontMetaDataFile = fontMetaDataFiles[i]
    console.log(
      `Extracting font ${i + 1} of ${
        fontMetaDataFiles.length
      } - ${fontMetaDataFile} - ${metadataDirectory}`
    )
    const fontMenuMetaData = await extractFontElement(
      fontMetaDataFile,
      outputCDDirectory,
      metadataDirectory,
      'credits'
    )
    joinMetaData(creditsMetaData, fontMenuMetaData)
  }
  return creditsMetaData
}
const saveData = async (data, outputFile) => {
  await fs.outputFile(outputFile, JSON.stringify(data))
}
const saveMetaData = async (metadataDirectory, type, name, creditsMetaData) => {
  await fs.writeJson(
    path.join(metadataDirectory, `${type}-assets`, name),
    creditsMetaData
  )
  // console.log('metadataDirectory', metadataDirectory)
}
const compositeImageOne = async (
  asset,
  sourceImageDirectory,
  metadataDirectory,
  type,
  subType
) => {
  let img = sharp({
    create: {
      width: asset.w,
      height: asset.h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).png()
  const overviewCompositionActions = []
  for (let k = 0; k < asset.files.length; k++) {
    const assetFile = asset.files[k]
    const elementFile = path.join(
      sourceImageDirectory,
      `${assetFile.source.file}.png`
    )
    // console.log('elementFile', elementFile)
    const elementFileExtract = sharp(elementFile).extract({
      left: assetFile.source.x,
      top: assetFile.source.y,
      width: assetFile.source.w,
      height: assetFile.source.h
    })
    const elementFileBuffer = await elementFileExtract.toBuffer()
    overviewCompositionActions.push({
      input: elementFileBuffer,
      left: assetFile.target.x,
      top: assetFile.target.y
    })
  }
  img.composite(overviewCompositionActions)

  const parentDir = path.join(metadataDirectory, `${type}-assets`, subType)
  if (!fs.existsSync(parentDir)) {
    fs.ensureDirSync(parentDir)
  }
  await img.toFile(path.join(parentDir, `${asset.description}.png`))
}
const compositeImages = async (
  metadataDirectory,
  type,
  outputCreditsDirectory
) => {
  const assetMap = await fs.readJson(
    `./metadata/${type}/composite-images_asset-map.json`
  )
  // console.log('assetMap', assetMap)
  const assetMapKeys = Object.keys(assetMap)
  for (let i = 0; i < assetMapKeys.length; i++) {
    const assetMapKey = assetMapKeys[i]
    const assets = assetMap[assetMapKey]
    // console.log('assets', assetMapKey, assets)
    for (let j = 0; j < assets.length; j++) {
      const asset = assets[j]
      // console.log('asset', asset)
      await compositeImageOne(
        asset,
        outputCreditsDirectory,
        metadataDirectory,
        type,
        assetMapKey
      )
    }
  }
  return assetMap
}
const extractCreditsData = async (
  inputCreditsDirectory,
  outputCDDirectory,
  metadataDirectory
) => {
  const outputCreditsDirectory = path.join(outputCDDirectory, 'credits')
  cleanDir(outputCreditsDirectory)

  await convertImages(inputCreditsDirectory, outputCreditsDirectory)
  const creditsMetaData = await extractCreditFonts(
    inputCreditsDirectory,
    outputCreditsDirectory,
    metadataDirectory
  )
  const imagesFromComposite = await compositeImages(
    metadataDirectory,
    'credits',
    outputCreditsDirectory
  )
  joinMetaData(creditsMetaData, imagesFromComposite)

  const lines = extractPeople(path.join(inputCreditsDirectory, 'people.bin'))
  await saveData(
    lines,
    path.join(metadataDirectory, 'credits-assets', 'credits.json')
  )

  await saveMetaData(
    metadataDirectory,
    'credits',
    'credits-font.metadata.json',
    creditsMetaData
  )
}

const extractDiscData = async (
  inputDiscDirectory,
  outputCDDirectory,
  metadataDirectory
) => {
  const outputDiscDirectory = path.join(outputCDDirectory, 'disc')
  cleanDir(outputDiscDirectory)
  const outputDiscMetaDirectory = path.join(metadataDirectory, 'disc-assets')
  cleanDir(outputDiscMetaDirectory)

  await convertImages(inputDiscDirectory, outputDiscDirectory)
  const discMetaData = await extractCharacterImages(
    path.join(outputCDDirectory, 'disc'),
    metadataDirectory
  )
  const insertDiscMetaData = await extractDiscImages(
    path.join(outputCDDirectory, 'disc'),
    metadataDirectory
  )
  joinMetaData(discMetaData, insertDiscMetaData)
  const gameOverMetaData = await extractGameOverImage(
    path.join(outputCDDirectory, 'disc'),
    metadataDirectory
  )
  joinMetaData(discMetaData, gameOverMetaData)

  await saveMetaData(
    metadataDirectory,
    'disc',
    'disc.metadata.json',
    discMetaData
  )
}
const extractDiscImages = async (sourceImageDirectory, metadataDirectory) => {
  const discImageNames = ['disk1', 'disk2', 'disk3']
  const subType = 'insert-disc'
  const discMetaData = {}
  discMetaData[subType] = []
  for (let i = 0; i < discImageNames.length; i++) {
    const discImageName = discImageNames[i]
    const asset = {
      id: i,
      description: discImageName,
      file: discImageName,
      x: 0,
      y: 0,
      w: 400,
      h: 126,
      files: [
        {
          source: { file: `${discImageName}_a`, x: 0, y: 0, w: 256, h: 126 },
          target: { x: 0, y: 0 }
        },
        {
          source: { file: `${discImageName}_b`, x: 0, y: 0, w: 144, h: 126 },
          target: { x: 256, y: 0 }
        }
      ]
    }
    discMetaData[subType].push(asset)
    // console.log('discImageName', discImageName, asset)
    await compositeImageOne(
      asset,
      sourceImageDirectory,
      metadataDirectory,
      'disc',
      subType
    )
  }
  return discMetaData
}
const extractGameOverImage = async (
  sourceImageDirectory,
  metadataDirectory
) => {
  const discImageNames = ['e_over']
  const endFileNames = ['game-over']
  const subType = 'game-over'
  const discMetaData = {}
  discMetaData[subType] = []
  for (let i = 0; i < discImageNames.length; i++) {
    const discImageName = discImageNames[i]
    const endFileName = endFileNames[i]
    const asset = {
      id: i,
      description: endFileName,
      file: endFileName,
      x: 0,
      y: 0,
      w: 576,
      h: 432,
      files: [
        {
          source: { file: `${discImageName}_a`, x: 0, y: 0, w: 256, h: 256 },
          target: { x: 0, y: 0 }
        },
        {
          source: { file: `${discImageName}_b`, x: 0, y: 0, w: 256, h: 256 },
          target: { x: 256, y: 0 }
        },
        {
          source: { file: `${discImageName}_c`, x: 0, y: 0, w: 64, h: 256 },
          target: { x: 512, y: 0 }
        },
        {
          source: { file: `${discImageName}_d`, x: 0, y: 0, w: 256, h: 176 },
          target: { x: 0, y: 256 }
        },
        {
          source: { file: `${discImageName}_e`, x: 0, y: 0, w: 256, h: 176 },
          target: { x: 256, y: 256 }
        },
        {
          source: { file: `${discImageName}_f`, x: 0, y: 0, w: 64, h: 176 },
          target: { x: 512, y: 256 }
        }
      ]
    }
    discMetaData[subType].push(asset)
    // console.log('discImageName', discImageName, asset)
    await compositeImageOne(
      asset,
      sourceImageDirectory,
      metadataDirectory,
      'disc',
      subType
    )
  }
  return discMetaData
}
const extractCharacterImages = async (
  sourceImageDirectory,
  metadataDirectory
) => {
  const discImageNames = [
    'aeris',
    'barr',
    'Cid',
    'cloud',
    'Kets',
    'Red',
    'tifa',
    'vinc',
    'yuff'
  ]
  const endFileNames = [
    'Aeris',
    'Barret',
    'Cid',
    'Cloud',
    'CaitSith',
    'RedXIII',
    'Tifa',
    'Vincent',
    'Yuffie'
  ]
  const subType = 'char-bg'
  const discMetaData = {}
  discMetaData[subType] = []
  for (let i = 0; i < discImageNames.length; i++) {
    const discImageName = discImageNames[i]
    const endFileName = endFileNames[i]
    const asset = {
      id: i,
      description: endFileName,
      file: endFileName,
      x: 0,
      y: 0,
      w: 400,
      h: 300,
      files: [
        {
          source: { file: `${discImageName}_a`, x: 0, y: 0, w: 256, h: 256 },
          target: { x: 0, y: 0 }
        },
        {
          source: { file: `${discImageName}_b`, x: 0, y: 0, w: 144, h: 256 },
          target: { x: 256, y: 0 }
        },
        {
          source: { file: `${discImageName}_c`, x: 0, y: 0, w: 256, h: 44 },
          target: { x: 0, y: 256 }
        },
        {
          source: { file: `${discImageName}_d`, x: 0, y: 0, w: 144, h: 44 },
          target: { x: 256, y: 256 }
        }
      ]
    }
    discMetaData[subType].push(asset)
    // console.log('discImageName', discImageName, asset)
    await compositeImageOne(
      asset,
      sourceImageDirectory,
      metadataDirectory,
      'disc',
      'char-bg'
    )
  }
  return discMetaData
}
const cleanDir = dir => {
  if (!fs.existsSync(dir)) {
    fs.ensureDirSync(dir)
  } else {
    fs.emptyDirSync(dir)
  }
}

module.exports = {
  extractCreditsData,
  extractDiscData
}
