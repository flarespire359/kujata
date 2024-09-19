const fs = require('fs-extra')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const path = require('path')

const ensureMapListExists = config => {
  const mapListPathSrc = path.join(
    config['unlgp-directory'],
    'flevel.lgp',
    'maplist'
  )
  const mapListPathDest = path.join(
    config['kujata-data-output-directory'],
    'data',
    'field',
    'flevel.lgp',
    'maplist.json'
  )
  fs.ensureDirSync(path.dirname(mapListPathDest))

  // console.log('mapListPathSrc', mapListPathSrc, fs.existsSync(mapListPathSrc))
  // console.log(
  //   'mapListPathDest',
  //   mapListPathDest,
  //   fs.existsSync(mapListPathDest)
  // )
  if (!fs.existsSync(mapListPathDest)) {
    const mapList = []
    var buffer = fs.readFileSync(mapListPathSrc)

    var r = new FF7BinaryDataReader(buffer)

    let numMaps = r.readUShort()

    // console.log('numMaps', numMaps)
    for (let i = 0; i < numMaps; i++) {
      r.offset = i * 32 + 2
      mapList.push(r.readString(32))
    }
    // console.log('mapList', mapList)

    fs.writeFileSync(mapListPathDest, JSON.stringify(mapList, null, 2))
  }
  return JSON.parse(fs.readFileSync(mapListPathDest))
}

module.exports = {
  ensureMapListExists
}
