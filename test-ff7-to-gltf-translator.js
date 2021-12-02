const fs = require('fs')
const FF7GltfTranslator = require('./ff7-gltf/ff7-to-gltf.js')

var config = JSON.parse(require('fs').readFileSync('config.json'))

let hrcFileId = 'AAAA'
let baseAnimFileId = null
let animFileIds = null // don't include any animations
let includeTextures = true
let isBattleModel = true

let gltfTranslator = new FF7GltfTranslator()
// gltfTranslator.translateFF7FieldHrcToGltf(config, 'bybf', baseAnimFileId, animFileIds, includeTextures);
// gltfTranslator.translateFF7FieldHrcToGltf(config, 'aaaa', baseAnimFileId, animFileIds, includeTextures);
// gltfTranslator.translateFF7FieldHrcToGltf(config, 'cvba', baseAnimFileId, animFileIds, includeTextures);

for (let prefix of ['rt', 'ru', 'rv', 'rw', 'rx', 'ry', 'rz']) {
  hrcFileId = prefix + 'aa'
  // gltfTranslator.translateFF7FieldHrcToGltf(config, hrcFileId, baseAnimFileId, animFileIds, includeTextures, isBattleModel);
}

// translate every *.hrc.json file in the skeletons directory

let filenames = fs.readdirSync(config.inputFieldCharDirectory)
filenames = [
  // 'bybf.hrc',
  'aaaa.hrc',
  // 'auda.hrc',
  'bydd.hrc'
]
for (let i = 0; i < filenames.length; i++) {
  let filename = filenames[i]
  if (filename.toLowerCase().endsWith('.hrc')) {
    let hrcFileId = filename.slice(0, 4)
    try {
      gltfTranslator.translateFF7FieldHrcToGltf(config, hrcFileId, null, null, true)
    } catch (err) {
      console.log('Error while trying to translate: ' + filename + ':', err)
      // break; // uncomment this line to stop on failure
    }
  }
}
