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
    .filter(f => f.toLowerCase().endsWith('.tex'))
  // console.log('texFileNames', texFileNames)
  for (let i = 0; i < texFileNames.length; i++) {
    const texFileName = texFileNames[i]
    const tex = new TexFile().loadTexFileFromPath(
      path.join(inputMenuDirectory, texFileName)
    )
    await tex.saveAllPalettesAsPngs(
      path.join(
        outputMenuDirectory,
        texFileName.replace('.tex', '.png').replace('.TEX', '.png')
      )
    )
  }
}
const extractFontElement = async (
  fontMetaDataFile,
  outputMenuDirectory,
  metadataDirectory,
  type
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
    path.join(
      KUJATA_ROOT,
      'metadata',
      type,
      `${fontMetaDataFile}_asset-map.json`
    )
  )

  for (const assetType in assetMap) {
    const colorElements = []
    for (let i = 0; i < assetMap[assetType].length; i++) {
      const element = assetMap[assetType][i]
      if (element.colors) {
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
      } else if (element.palette) {
        colorElements.push(element)
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

      let elementFileExtract
      if (element.compose) {
        const { width, height } = await sharp(elementFile).metadata()
        const adjustedWidth =
          element.x + element.w < width ? element.w : width - element.x
        const adjustedHeight =
          element.y + element.h < height ? element.h : height - element.y
        elementFileExtract = sharp({
          create: {
            width: element.w,
            height: element.h,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        }).png()

        const a = await sharp(elementFile)
          .extract({
            left: element.x,
            top: element.y,
            width: adjustedWidth,
            height: adjustedHeight
          })
          .toBuffer()
        const b = await sharp(
          path.join(outputMenuDirectory, element.compose.file)
        )
          .extract({
            left: element.compose.x,
            top: element.compose.y,
            width: element.compose.w,
            height: element.compose.h
          })
          .toBuffer()
        const composeActions = [
          {
            input: a,
            left: 0,
            top: 0
          },
          {
            input: b,
            left: element.compose.toX,
            top: element.compose.toY
          }
        ]
        elementFileExtract.composite(composeActions)

        const c = await elementFileExtract.toBuffer()
        elementFileExtract = sharp(c)
      } else {
        elementFileExtract = sharp(elementFile).extract({
          left: element.x,
          top: element.y,
          width: element.w,
          height: element.h
        })
      }

      const elementFileBuffer = await elementFileExtract.toBuffer()
      overviewCompositionActions.push({
        input: elementFileBuffer,
        left: element.x,
        top: element.y
      })
      const assetFolder = path.join(
        metadataDirectory,
        `${type}-assets`,
        assetType
      )
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
      `${type}-assets`,
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
    path.join(
      KUJATA_ROOT,
      'metadata',
      'menu',
      'single-palette-images_asset-map.json'
    )
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
    'btl_win_a_h',
    'btl_win_b_h',
    'btl_win_c_h',
    'btl_win_d_h',
    'usfont_a_l',
    'usfont_b_l',
    'btl_win_a_l',
    'btl_win_b_l',
    'btl_win_c_l',
    'btl_win_d_l',
    'coloa',
    'colob',
    'coloc',
    'ketcy2a'
  ]
  for (let i = 0; i < fontMetaDataFiles.length; i++) {
    const fontMetaDataFile = fontMetaDataFiles[i]
    console.log(
      `Extracting font ${i + 1} of ${
        fontMetaDataFiles.length
      } - ${fontMetaDataFile}`
    )
    const fontMenuMetaData = await extractFontElement(
      fontMetaDataFile,
      outputMenuDirectory,
      metadataDirectory,
      'menu'
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
  console.log(
    'extractMenuAssets: START',
    inputMenuDirectory,
    outputMenuDirectory
  )
  await extractAllAssetsAndPalettes(inputMenuDirectory, outputMenuDirectory)
  await extractMetadataAssets(outputMenuDirectory, metadataDirectory)

  console.log('extractMenuAssets: END')
}
module.exports = {
  extractMenuAssets,
  extractAllAssetsAndPalettes,
  extractFontElement,
  joinMetaData
}
