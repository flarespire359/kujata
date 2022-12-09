const fs = require('fs')
const LzsDecompressor = require('../lzs/lzs-decompressor.js')
const FLevelLoader = require('./flevel-loader.js')
const { generateOpCodeUsages } = require('./generate-op-codes-usages.js')
const config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))

// Pre-requisite: Must run test-map-list-loader.json first to generate maplist.json
// TODO: Make flevel-loader smarter so that it can do this automatically.

const mapList = JSON.parse(fs.readFileSync(config.outputFieldFLevelDirectory + '/maplist.json', 'utf-8'))
const lzsDecompressor = new LzsDecompressor()
const flevelLoader = new FLevelLoader(lzsDecompressor, mapList)

const replacer = function (k, v) {
  /// /if (k == "entitySections") { return undefined; }
  return v
}

// translate just 1 map
// for (let fieldName of mapList) {
//   if (fieldName && !fieldName.startsWith("wm")) {
//   }
// }
const decodeOneMap = (fieldName) => {
  const flevel = flevelLoader.loadFLevel(config, fieldName)
  const outputFilename = config.outputFieldFLevelDirectory + '/' + fieldName + '.json'
  fs.writeFileSync(outputFilename, JSON.stringify(flevel, replacer, 2))
  // console.log('Wrote: ' + outputFilename)
  return fieldName
}

const decodeAllMaps = async (maps) => {
  await flevelLoader.ensureTexturesExist(config)
  const errors = []
  for (let i = 0; i < maps.length; i++) {
    const fieldName = maps[i]

    const inputFile = config.inputFieldFLevelDirectory + '/' + fieldName
    const exists = fs.existsSync(inputFile)
    console.log(`Map ${i + 1} of ${maps.length} -> ${fieldName}`, exists)
    if (exists && fieldName !== '') {
      try {
        decodeOneMap(fieldName)
      } catch (error) {
        console.log('error', error)
        errors.push(fieldName)
      }
    }
  }
  return errors
}

const problemMaps = ['blin67_4',
  'nivgate2',
  'nivgate3',
  'nivl_e3',
  'fr_e',
  'junair',
  'gldst',
  'gldinfo',
  'cosmo',
  'cosmo2',
  'rckt3',
  'kuro_11',
  'hyoumap',
  'gaiin_6',
  'gaiin_7',
  'trnad_52',
  'md_e1',
  'lastmap',
  'junone22',
  'rckt32',
  'jtemplc']

// flevelLoader.ensureTexturesExist(config)

// console.log('Decode all Maps -> All', decodeAllMaps(mapList))
// console.log('Decode all Maps -> Errors All', decodeAllMaps(problemMaps))
// console.log('Decode one', decodeOneMap('nmkin_1'))
// console.log('Decode one', decodeOneMap('md1stin'))

console.log('Decode one', decodeOneMap('md1_2'))
// console.log('Decode one', decodeOneMap('nrthmk'))
// console.log('Decode one', decodeOneMap('yougan2'))
// console.log('Decode one', decodeOneMap('rckt3'))
// console.log('Decode one', decodeOneMap('nrthmk'))
// console.log('Decode one', decodeOneMap('ancnt3'))

generateOpCodeUsages(config)
