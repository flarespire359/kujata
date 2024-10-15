const path = require('path')
const fs = require('fs-extra')
const sharp = require('sharp')
const { TexFile } = require('./tex-file')
const { KUJATA_ROOT } = require('./helper')

const extractSourceEffectImages = async config => {
  const texturesDir = path.join(
    config.kujataDataDirectory,
    'data',
    'battle',
    'effect-textures'
  )
  fs.ensureDirSync(texturesDir)

  for (const texFile of fs
    .readdirSync(path.join(config.ff7InstallDirectory, 'data', 'battle'))
    .filter(f => f.endsWith('.tex'))) {
    const t = new TexFile()
    t.loadTexFileFromPath(
      path.join(config.ff7InstallDirectory, 'data', 'battle', texFile)
    )
    await t.saveAllPalettesAsPngs(
      path.join(texturesDir, texFile.replace('.tex', '.png'))
    )
  }
}
const effects32 = async (config, assets) => {
  const types = Object.keys(assets)
  let img = sharp({
    create: {
      width: 8 * 32,
      height: types.length * 32,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).png()
  const compositionActions = []
  // console.log('assetMap', assetMap)
  for (let i = 0; i < types.length; i++) {
    const type = types[i]
    const asset = assets[type]
    // console.log('asset', assetMap, asset, type)
    for (let j = 0; j < asset.count; j++) {
      const f = `${asset.file}_${asset.palette}.png`
      const source = sharp(
        path.join(
          config.kujataDataDirectory,
          'data',
          'battle',
          'effect-textures',
          f
        )
      )
      // console.log('a', a.x, a.y, a.w, a.h)
      const element = source.extract({
        left: asset.x + j * 32,
        top: asset.y,
        width: 32,
        height: 32
      })
      const elementBuffer = await element.toBuffer()

      compositionActions.push({
        input: elementBuffer,
        left: j * 32,
        top: i * 32
      })
    }
  }

  const assetFolder = path.join(
    config.kujataDataDirectory,
    'metadata',
    'battle-assets'
  )
  if (!fs.existsSync(assetFolder)) {
    fs.ensureDirSync(assetFolder)
  }
  img.composite(compositionActions)

  const imgComposited = sharp(await img.toBuffer())
  imgComposited.resize({
    width: 8 * 32 * 4,
    height: types.length * 32 * 4,
    kernel: sharp.kernel.nearest
  })
  await imgComposited.toFile(path.join(assetFolder, 'effects-32.png'))

  const assetsJson = {}
  const xPos = Array.from({ length: 8 }, (_, i) => i * 32 * 4)
  for (let i = 0; i < Object.keys(assets).length; i++) {
    const type = Object.keys(assets)[i]
    assetsJson[type] = {
      index: i,
      count: 8,
      file: 'metadata/battle-assets/effects-32.png'
    }
  }
  fs.writeJsonSync(path.join(assetFolder, 'effects-32.json'), assetsJson)
  //   console.log('assetsJson', assetsJson)
}
const extractBattleEffectAssets = async config => {
  console.log('Extract Battle Effect Assets: START')
  await extractSourceEffectImages(config)
  const assetMap = await fs.readJson(
    path.join(
      KUJATA_ROOT,
      'metadata-src',
      'battle',
      'effects-atoms_asset-map.json'
    )
  )
  await effects32(config, assetMap['effects-32'])

  console.log('Extract Battle Effect Assets: END')
}
module.exports = { extractBattleEffectAssets }
