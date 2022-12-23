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

const translateBattleFile = async (hrcFileId) => {
  try {
    await gltfTranslator.translateFF7FieldHrcToGltf(config, hrcFileId, null, null, true, true)
  } catch (err) {
    console.log('Error while trying to translate: ' + hrcFileId + ':', err)
    // break; // uncomment this line to stop on failure
  }
}
const translateAllBattleFiles = async () => {
  console.log('translateAllBattleFiles: START')
  const battleFiles = fs.readdirSync(config.inputBattleBattleDirectory).filter(f => f.toLowerCase().endsWith('aa'))// .filter(f => f.toLowerCase() !== 'akaa')
  console.log('battleFiles', battleFiles)
  for (const battleFile of battleFiles) {
    await translateBattleFile(battleFile)
  }
  console.log('translateAllBattleFiles: END')
}

const init = async () => {
  // await translateBattleFile('pbaa')
  // await translateBattleFile('aqaa')
  // await translateBattleFile('avaa')
  // await translateBattleFile('opaa')
  await translateBattleFile('rtaa')
  // await translateBattleFile('nbaa')

  // await translateAllBattleFiles()
  console.log('end')
}

init()

// translate every *.hrc.json file in the skeletons directory

// let filenames = fs.readdirSync(config.inputFieldCharDirectory)
// filenames = [
// 'aaaa.hrc',
// 'acgd.hrc',
// 'aagb.hrc',
// 'adda.hrc',
// 'abda.hrc',
// 'abjb.hrc',
// 'aebc.hrc',
// 'aehd.hrc',
// 'auff.hrc',
// 'cahc.hrc'
// //   'bydd.hrc',
//   'fiba.hrc'
// 'hagb.hrc'
// 'bhff.hrc'
// 'dhid.hrc',
// 'hagb.hrc'
// ]
// for (let i = 0; i < filenames.length; i++) {
//   let filename = filenames[i]
//   if (filename.toLowerCase().endsWith('.hrc')) {
//     let hrcFileId = filename.slice(0, 4)
//     try {
//       gltfTranslator.translateFF7FieldHrcToGltf(config, hrcFileId, null, null, true)
//     } catch (err) {
//       console.log('Error while trying to translate: ' + filename + ':', err)
//       // break; // uncomment this line to stop on failure
//     }
//   }
// }
/*
Translating: anbd (sd_hojyo_sk)
Blend - 0 - ?

Translating: fiba (maru_st)
Blend - 0 - ?
Blend - 0 - ?
Blend - 0 - ?
Blend - 0 - ?
Blend - 0 - ?
Blend - 0 - ?
Blend - 0 - ?
Blend - 0 - ?

Translating: ggid (clossl2_sk)
Blend - 1 - ?
Translating: ggjc (clossl4_sk)
Blend - 1 - ?

Translating: hagb (hmtra2_sk)
Blend - 0 - ?
*/
