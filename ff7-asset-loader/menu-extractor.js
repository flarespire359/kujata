const fs = require('fs-extra')
const path = require('path')
const sharp = require('sharp')
const { TexFile } = require('./tex-file.js')

const extractAllAssetsAndPalettes = async (
  inputMenuDirectory,
  outputMenuDirectory
) => {
  fs.emptyDirSync(outputMenuDirectory)
  const texFileNames = fs
    .readdirSync(path.join(inputMenuDirectory))
    .filter(f => f.endsWith('.tex'))
  //   console.log('texFileNames', texFileNames)
  for (let i = 0; i < texFileNames.length; i++) {
    const texFileName = texFileNames[i]
    const tex = new TexFile().loadTexFileFromPath(
      path.join(inputMenuDirectory, texFileName)
    )
    tex.saveAllPalettesAsPngs(
      path.join(outputMenuDirectory, texFileName.replace('.tex', '.png'))
    )
  }
}
const extractFontElement = async (
  fontMetaDataFile,
  outputMenuDirectory,
  metadataDirectory
) => {
  const baseFile = path.join(outputMenuDirectory, `${fontMetaDataFile}_1.png`)
  const metadata = await sharp(baseFile).metadata()
  let img = sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).png()

  let overviewCompositionActions = []
  const assetMap = await fs.readJson(
    `../metadata/menu/${fontMetaDataFile}_asset-map.json`
  )

  for (const assetType in assetMap) {
    const colorElements = []
    for (let i = 0; i < assetMap[assetType].length; i++) {
      const element = assetMap[assetType][i]
      // console.log('element for color', element)
      for (let j = 0; j < element.colors.length; j++) {
        const color = element.colors[j][0]
        const palette = element.colors[j][1]
        const colorElement = { ...element }
        delete colorElement.colors
        colorElement.palette = palette
        colorElement.description = `${colorElement.description} ${color}`
        colorElement.color = color
        colorElements.push(colorElement)
      }
    }
    assetMap[assetType] = colorElements
    // console.log('assetMap', assetMap[assetType].length)

    for (let i = 0; i < assetMap[assetType].length; i++) {
      const element = assetMap[assetType][i]
      // console.log('element', element)
      const elementFile = path.join(
        outputMenuDirectory,
        `${fontMetaDataFile}_${element.palette}.png`
      )
      // console.log('elementFile', elementFile, fs.existsSync(elementFile))
      const elementFileExtract = sharp(elementFile).extract({
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h
      })
      const elementFileBuffer = await elementFileExtract.toBuffer()
      overviewCompositionActions.push({
        input: elementFileBuffer,
        left: element.x,
        top: element.y
      })

      const assetFolder = path.join(metadataDirectory, 'menu-assets', assetType)
      if (!fs.existsSync(assetFolder)) {
        fs.ensureDirSync(assetFolder)
      }
      elementFileExtract.resize({
        width: element.w * 4,
        height: element.h * 4,
        kernel: sharp.kernel.nearest
      })
      await elementFileExtract.toFile(
        path.join(assetFolder, `${element.description}.png`)
      )

      if (overviewCompositionActions.length === 100) {
        // For some reason 150+ layers is causing issues <- nope, just nodemon
        img.composite(overviewCompositionActions)
        const compositeAppliedImg = await img.toBuffer()
        img = sharp(compositeAppliedImg)
        overviewCompositionActions = []
      }
    }
  }
  img.composite(overviewCompositionActions)

  await img.toFile(
    path.join(
      metadataDirectory,
      'menu-assets',
      `${fontMetaDataFile}_overview.png`
    )
  )
  return assetMap
}
const extractSinglePaletteImages = async (
  outputMenuDirectory,
  metadataDirectory
) => {
  const assetMap = await fs.readJson(
    '../metadata/menu/single-palette-images_asset-map.json'
  )
  for (const assetType in assetMap) {
    for (let i = 0; i < assetMap[assetType].length; i++) {
      const element = assetMap[assetType][i]
      console.log('--', assetType, element.description, outputMenuDirectory)
      const elementFile = path.join(
        outputMenuDirectory,
        `${element.file}_1.png`
      )
      // console.log('elementFile', elementFile, fs.existsSync(elementFile))
      const elementFileExtract = sharp(elementFile).extract({
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h
      })
      const assetFolder = path.join(metadataDirectory, 'menu-assets', assetType)
      if (!fs.existsSync(assetFolder)) {
        fs.ensureDirSync(assetFolder)
      }
      elementFileExtract.resize({
        width: element.w * 4,
        height: element.h * 4,
        kernel: sharp.kernel.nearest
      })
      await elementFileExtract.toFile(
        path.join(assetFolder, `${element.description}.png`)
      )
    }
  }
  //   console.log('assetMap', assetMap)
  return assetMap
}
const extractMetadataAssets = async (
  outputMenuDirectory,
  metadataDirectory
) => {
  const outputDirMetaDataMenu = path.join(metadataDirectory, 'menu-assets')

  if (!fs.existsSync(outputDirMetaDataMenu)) {
    fs.ensureDirSync(outputDirMetaDataMenu)
  } else {
    fs.emptyDirSync(outputDirMetaDataMenu)
  }

  const menuMetaData = {}

  // Fonts
  const fontMetaDataFiles = [
    'usfont_a_h',
    'usfont_b_h',
    'btl_win_b_h',
    'btl_win_d_h',
    'usfont_a_l',
    'usfont_b_l',
    'btl_win_b_l',
    'btl_win_d_l'
  ]
  for (let i = 0; i < fontMetaDataFiles.length; i++) {
    console.log(`Extracting font ${i + 1} of ${fontMetaDataFiles.length}`)
    const fontMetaDataFile = fontMetaDataFiles[i]
    const fontMenuMetaData = await extractFontElement(
      fontMetaDataFile,
      outputMenuDirectory,
      metadataDirectory
    )
    joinMetaData(menuMetaData, fontMenuMetaData)
  }

  // Single palette images
  const singlePaletteMetaData = await extractSinglePaletteImages(
    outputMenuDirectory,
    metadataDirectory
  )
  joinMetaData(menuMetaData, singlePaletteMetaData)

  // General window
  // tbc

  // Battle specific
  // tbc

  await fs.writeJson(
    path.join(metadataDirectory, 'menu-assets', 'menu_us.metadata.json'),
    menuMetaData
  )
  //   console.log('metadataDirectory', metadataDirectory)
}
const joinMetaData = (menuMetaData, specificMetaData) => {
  for (const assetType in specificMetaData) {
    if (!menuMetaData[assetType]) {
      menuMetaData[assetType] = []
    }
    menuMetaData[assetType] = menuMetaData[assetType].concat(
      specificMetaData[assetType]
    )
  }
}
const extractMenuAssets = async (
  inputMenuDirectory,
  outputMenuDirectory,
  metadataDirectory
) => {
  console.log('extractMenuAssets: START')
  await extractAllAssetsAndPalettes(inputMenuDirectory, outputMenuDirectory)
  await extractMetadataAssets(outputMenuDirectory, metadataDirectory)

  console.log('extractMenuAssets: END')
}
module.exports = { extractMenuAssets }
