const fs = require('fs-extra')
const path = require('path')
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
const extractMetadataAssets = async (
  outputMenuDirectory,
  metadataDirectory
) => {
  console.log('extractMetadataAssets: TODO')
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
