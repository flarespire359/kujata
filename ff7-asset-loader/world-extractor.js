const fs = require('fs-extra')
const path = require('path')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')

const generateWorldMapTransitionData = async config => {
  //   console.log('generateWorldMapTransitionData: START')
  const buffer = fs.readFileSync(
    path.join(config.unlgpDirectory, 'world_us.lgp', 'field.tbl')
  )
  const r = new FF7BinaryDataReader(buffer)
  const totalLocations = r.length / 24
  // console.log('r.length', r.length, r.offset, totalLocations)

  const locations = {}
  for (let i = 0; i < totalLocations; i++) {
    const wmFieldReference = `wm${i}`
    locations[wmFieldReference] = { wmFieldReference }
    const sections = ['sectionA', 'sectionB']
    sections.forEach(sectionType => {
      locations[wmFieldReference][sectionType] = {
        x: r.readShort(),
        y: r.readShort(),
        triangleId: r.readShort(),
        fieldId: r.readUShort(),
        direction: r.readUByte(), // 9-12 all the same
        direction2: r.readUByte(),
        direction3: r.readUByte(),
        direction4: r.readUByte()
      }
      delete locations[wmFieldReference][sectionType].direction2
      delete locations[wmFieldReference][sectionType].direction3
      delete locations[wmFieldReference][sectionType].direction4
    })
  }

  //   console.log('finished', r.offset, r.length, locations.wm0)
  const fieldTblJsonPath = path.join(
    config.kujataDataDirectory,
    'data',
    'world',
    'world_us.lgp',
    'field.tbl.json'
  )
  fs.ensureDirSync(path.dirname(fieldTblJsonPath))
  fs.writeFileSync(fieldTblJsonPath, JSON.stringify(locations, null, 2))
  //   console.log('generateWorldMapTransitionData: END')
}

module.exports = {
  generateWorldMapTransitionData
}
