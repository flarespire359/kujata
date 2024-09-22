const fs = require('fs-extra')
const path = require('path')
const { KUJATA_ROOT } = require('./helper')

const hex2dec = function (hex) {
  return parseInt(hex, 16)
}
// TODO: This should be replaced with actual game data when I look at wm
const fieldIdToWorldMapCoords = config => {
  /*
  walkmesh is 36x28 tiles

  0x2000 pixels per mesh = 8192 pixels per mesh = 294912 pixels wide total
  0x2000 pixels per mesh = 8192 pixels per mesh = 229376 pixels tall total

  codemann8's worldmap image is 9216 x 7168 pixels, so, factor of 32
  */

  let fileContents = fs.readFileSync(
    path.join(KUJATA_ROOT, 'metadata-src', 'world-map', 'wm0-script.txt'),
    'utf-8'
  )
  // console.log('fileContents', fileContents)
  let lines = fileContents.split(/\r?\n/g)

  var fieldMapIdHex = null,
    meshX = null,
    meshY = null,
    coordsInMeshX = null,
    coordsInMeshY = null

  let fieldIdToWorldMapCoords = {}

  for (let line of lines) {
    // GetSpecial(0006) == #0030
    let matches = line.match(/GetSpecial\((\w+)\) == #(\w+)/) // GetSpecial\\((\d+)\\) == #(\d+)
    if (matches) {
      if (matches[1] == '0006') {
        fieldMapIdHex = matches[2]
      }
      continue
    }
    // ActiveEntity.SetMeshCoordsXZ(#0010, #0006)
    matches = line.match(/ActiveEntity\.SetMeshCoordsXZ\(#(\w+), #(\w+)\)/) // GetSpecial\\((\d+)\\) == #(\d+)
    if (matches) {
      meshX = matches[1]
      meshY = matches[2]
      continue
    }
    // ActiveEntity.SetCoordsInMeshXZ(#13d9, #1420)
    matches = line.match(/ActiveEntity\.SetCoordsInMeshXZ\(#(\w+), #(\w+)\)/) // GetSpecial\\((\d+)\\) == #(\d+)
    if (matches) {
      coordsInMeshX = matches[1]
      coordsInMeshY = matches[2]
      //console.log(hex2dec(fieldMapIdHex) + " = " + hex2dec(meshX) + " " + hex2dec(meshY) + " " + hex2dec(coordsInMeshX) + " " + hex2dec(coordsInMeshY));
      fieldIdToWorldMapCoords[hex2dec(fieldMapIdHex)] = {
        meshX: hex2dec(meshX),
        meshY: hex2dec(meshY),
        coorX: hex2dec(coordsInMeshX),
        coorY: hex2dec(coordsInMeshY)
      }
      continue
    }
  }
  const coordsPath = path.join(
    config.kujataDataDirectory,
    'metadata',
    'field-id-to-world-map-coords.json'
  )
  fs.ensureDirSync(path.dirname(coordsPath))
  fs.writeFileSync(coordsPath, JSON.stringify(fieldIdToWorldMapCoords, null, 2))
}
// console.log(JSON.stringify(fieldIdToWorldMapCoords, null, 2))
module.exports = { fieldIdToWorldMapCoords }
