const fs = require('fs')
const FF7GltfTranslator = require('./ff7-gltf/ff7-to-gltf.js')

const config = JSON.parse(require('fs').readFileSync('config.json'))

const hrcFileId = 'AAAA'
const baseAnimFileId = null
const animFileIds = null // don't include any animations
const includeTextures = true
const isBattleModel = true

const gltfTranslator = new FF7GltfTranslator()
// gltfTranslator.translateFF7FieldHrcToGltf(config, 'bybf', baseAnimFileId, animFileIds, includeTextures);
// gltfTranslator.translateFF7FieldHrcToGltf(config, 'aaaa', baseAnimFileId, animFileIds, includeTextures);
// gltfTranslator.translateFF7FieldHrcToGltf(config, 'cvba', baseAnimFileId, animFileIds, includeTextures);

// for (let prefix of ['rt', 'ru', 'rv', 'rw', 'rx', 'ry', 'rz']) {
//   hrcFileId = prefix + 'aa'
//   // gltfTranslator.translateFF7FieldHrcToGltf(config, hrcFileId, baseAnimFileId, animFileIds, includeTextures, isBattleModel);
// }

const translateBattleFile = async hrcFileId => {
  try {
    await gltfTranslator.translateFF7FieldHrcToGltf(
      config,
      hrcFileId,
      null,
      null,
      true,
      true
    )
  } catch (err) {
    console.log('Error while trying to translate: ' + hrcFileId + ':', err)
    // break; // uncomment this line to stop on failure
  }
}
const translateAllBattleFiles = async () => {
  console.log('translateAllBattleFiles: START')
  const battleFiles = fs
    .readdirSync(config.inputBattleBattleDirectory)
    .filter(f => f.toLowerCase().endsWith('aa')) // .filter(f => f.toLowerCase() !== 'akaa')
  console.log('battleFiles', battleFiles)
  for (const battleFile of battleFiles) {
    await translateBattleFile(battleFile)
  }
  console.log('translateAllBattleFiles: END')
}

const translateFieldFile = async hrcFileId => {
  try {
    await gltfTranslator.translateFF7FieldHrcToGltf(
      config,
      hrcFileId,
      null,
      null,
      true,
      false
    )
  } catch (err) {
    console.log('Error while trying to translate: ' + hrcFileId + ':', err)
    // break; // uncomment this line to stop on failure
  }
}
const translateAllFieldFiles = async () => {
  console.log('translateAllFieldFiles: START')
  const fieldFiles = fs
    .readdirSync(config.inputFieldCharDirectory)
    // .filter(f => f.toLowerCase().startsWith('aa'))
    .filter(f => f.toLowerCase().endsWith('.hrc'))
    .map(f => f.toLowerCase().replace('.hrc', ''))
  console.log('fieldFiles', fieldFiles)
  for (const fieldFile of fieldFiles) {
    await translateFieldFile(fieldFile)
  }
  console.log('translateAllFieldFiles: END')
}

const init = async () => {
  // await translateBattleFile('pbaa')
  // await translateBattleFile('aqaa')
  // await translateBattleFile('avaa')
  await translateBattleFile('opaa')
  // await translateBattleFile('rtaa')
  // await translateBattleFile('nbaa')
  await translateBattleFile('oqaa')

  // await translateAllBattleFiles()

  // await translateFieldFile('aaaa')
  // await translateFieldFile('aagb')
  // await translateFieldFile('acgd')
  // await translateFieldFile('byba')

  // await translateAllFieldFiles()
  console.log('end')
}

init()
