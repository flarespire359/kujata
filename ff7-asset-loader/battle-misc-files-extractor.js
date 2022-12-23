const fs = require('fs-extra')
const path = require('path')

const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')

const saveData = async (data, outputFile) => {
  await fs.outputFile(outputFile, JSON.stringify(data))
}

const transformVertexColorsToModernOrientation = (vertexColors, vertexColorSet) => {
  let temp
  temp = vertexColorSet['0']
  vertexColorSet['0'] = vertexColorSet['16']
  vertexColorSet['16'] = temp

  temp = vertexColorSet['8']
  vertexColorSet['8'] = vertexColorSet['16']
  vertexColorSet['16'] = temp

  temp = vertexColorSet['16']
  vertexColorSet['16'] = vertexColorSet['24']
  vertexColorSet['24'] = temp

  const third = vertexColors.pop()
  vertexColors.splice(2, 0, third)
}

/* Contains vertex position, colors for the active player pointer */
const extractMarkDat = async (inputBattleDataDirectory, outputBattleMiscDirectory) => {
  const buffer = fs.readFileSync(path.join(inputBattleDataDirectory, 'mark.dat'))
  const r = new FF7BinaryDataReader(buffer)
  // Not sure about the beginning part for vertices etc

  /*
    3.552713678800501e-15,    -100,     0,
    36.6025390625,            100,      136.6025390625,
    -136.6025390625,          100,     -36.6025390625,
    100,                      100,      -100,
    -136.6025390625,          100,      -36.6025390625,
    36.6025390625,            100,      136.6025390625,
    100,                      100,      -100,
    36.6025390625,            100,      136.6025390625,
    3.552713678800501e-15,    -100,     0,
    100,                      100,      -100,
    3.552713678800501e-15,    -100,     0,
    -136.6025390625,          100,      -36.6025390625

     a -b  c *4
     d  b  e *2
    -e  b -d *1
     b  b -b *3
    -e  b -d *1
     d  b  e *2
     b  b -b *3
     d  b  e *2
     a -b  c *4
     b  b -b *3
     a -b  c *4
    -e  b -d *1

    -136.6025390625,          100,      -36.6025390625
    36.6025390625,            100,      136.6025390625,
    100,                      100,      -100,
    3.552713678800501e-15,    -100,     0,
'
    -a  b -c
     c  b -a
     b  b -b
     d -b  f

  200000 00 000036 FC 000000 00
  00005F FB 68FF00 00 7DFF5F FB
  4C0000 00 83005F FB 4C0000 00
  000000 00 000000 00 040000 00

  080010 00 180000 00 FFFF00 30 9B7800 00 FFD800 00
  000018 00 100000 00 332700 30 FFD800 00 9B7800 00
  000008 00 180000 00 332700 30 FFFF00 00 FFD800 00
  000010 00 080000 00 332700 30 9B7800 00 FFFF00 00

  000000 00

  */
  // for (let i = 0; i < 4; i++) {
  //   const x = r.readByteArray(4)
  //   const y = r.readByteArray(4)
  //   const z = r.readByteArray(4)
  //   console.log(i, '-', x, y, z)
  // }
  // r.offset = 0x34
  // console.log('all', r.readUByteArray(0x34))

  r.offset = 0x30
  const vertexColors = []
  const vertexColorSet = {}
  for (let i = 0; i < 4; i++) {
    const colors = []
    const positions = [r.readUShort(), r.readUShort(), r.readUShort()]
    r.readUShort()
    const r1 = r.readUByte()
    const g1 = r.readUByte()
    const b1 = r.readUByte()
    r.offset = r.offset - 3
    const rgb1 = r.read24bitInteger()
    r.readUByte()

    const r2 = r.readUByte()
    const g2 = r.readUByte()
    const b2 = r.readUByte()
    r.offset = r.offset - 3
    const rgb2 = r.read24bitInteger()
    r.readUByte()

    const r3 = r.readUByte()
    const g3 = r.readUByte()
    const b3 = r.readUByte()
    r.offset = r.offset - 3
    const rgb3 = r.read24bitInteger()
    r.readUByte()

    colors.push([r1, g1, b1, rgb1])
    colors.push([r2, g2, b2, rgb2])
    colors.push([r3, g3, b3, rgb3])
    vertexColors.push(positions)
    // console.log('vertex', positions, '-', colors)
    for (const [i, pos] of positions.entries()) {
      vertexColorSet[pos] = colors[i]
    }
  }
  transformVertexColorsToModernOrientation(vertexColors, vertexColorSet)

  const markData = {
    vertexColors: vertexColors.map(v1 => v1.map(v2 => vertexColorSet[v2])),
    vertexPositions: 'tbc',
    vertexSize: 'tbc'
  }

  // console.log('markData', markData)
  await saveData(markData, path.join(outputBattleMiscDirectory, 'mark.dat.json'))
}
const extractMiscBattleData = async (inputBattleDataDirectory, outputBattleMiscDirectory) => {
  console.log('Extract Misc Battle Data: START')
  await extractMarkDat(inputBattleDataDirectory, outputBattleMiscDirectory)
  console.log('Extract Misc Battle Data: END')
}
module.exports = {
  extractMiscBattleData
}
