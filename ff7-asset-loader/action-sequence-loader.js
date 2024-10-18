const fs = require('fs')
const path = require('path')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader')

const readScript = (r, offset) => {
  r.offset = offset
  if (r.offset === 0 || r.offset >= r.length || r.peekUByte() === 0x00) {
    return []
  }
  let endFound = false
  const script = []
  while (!endFound && r.offset < r.length) {
    // console.log('offset', r.offset)
    const op = r.readBattleActionOp()
    // console.log('op', op)
    script.push(op)
    if (op.op === 'RET' || op.op === 'RET2') {
      while (r.offset < r.length && r.peekUByte() === 0x00) {
        r.readUByte()
      }
      endFound = true
    }
    // console.log('offset', r.offset, r.length)
  }
  return script
  //   E8 FC 00 E0 EA F4 19 F3 EC 2C 2D 2D 2E FA E5 EE
  //   console.log('readScript', offset, script)
}

const extractOneEntity = async (config, fileName) => {
  const r = new FF7BinaryDataReader(
    fs.readFileSync(path.join(config.unlgpDirectory, 'battle.lgp', fileName))
  )
  //   https://github.com/Akari1982/q-gears_reverse/blob/master/ffvii/documents/battle/models/animation.txt

  if (r.length <= 8) return {}
  const data = {
    deathType: r.readUShort(), // 0000 - if this is not 0 we add 0x40 bit to death type
    deathType2: r.readUByte(), // 80 - 0x3f - dead type. 0x80 - play secondary animation
    unk1: r.readUByte(),
    collisionRadius: r.readUShort(), // Set to 801518e4+6
    unk2: r.readUShort(), // Set to 801518ec
    unk3: r.readUShort(), // Set to 801518ee
    unk4: r.readUShort(), // Set to 801518f0
    unk5: r.readUShort(),
    unk6: r.readUShort(),
    unk7: r.readUShort(), // Filler ?
    joints: r.readUByteArray(16), // 02 00 00 00    00 00 0D 08    03 00 03 17    12 00 00 00
    unk8: r.readUShort(),
    offsetsUnknown: Array(8)
      .fill()
      .map(() => r.readUByteArray(4)),
    unk9: Array(4)
      .fill()
      .map(() => r.readUByteArray(2)),
    unk10: Array(6)
      .fill()
      .map(() => r.readUByteArray(2)),
    unk11: Array(6)
      .fill()
      .map(() => r.readUByteArray(2)),
    unk12: r.readUShort(),
    unk13: r.readUShort(),
    scriptOffsetsEnemy: Array(r.length === 372 ? 24 : 32)
      .fill()
      .map(() => r.readUInt()),
    scriptOffsetsPlayer: []
  }
  //   console.log('r.offset', r.offset)
  if (
    data.scriptOffsetsEnemy[0] !== 0 &&
    data.scriptOffsetsEnemy[0] !== r.offset
  ) {
    data.scriptOffsetsPlayer = Array(42)
      .fill()
      .map(() => r.readUInt())
  }
  //   console.log('data', data, r.offset)
  const scriptsEnemy = data.scriptOffsetsEnemy.map(offset =>
    readScript(r, offset)
  )
  const scriptsPlayer = data.scriptOffsetsPlayer.map(offset =>
    readScript(r, offset)
  )
  data.scripts = [...scriptsEnemy, ...scriptsPlayer]
  data.type = scriptsPlayer.length > 0 ? 'player' : 'enemy' // Purely just a utility so I don't have to get this elsewhere for kujata webapp
  // TODO - Some files don't end with EE code, instead, they are filled with zeros and therefore this is bloated with ANIM 0 scripts
  return data
}
const saveActionSequenceData = async (config, data) => {
  fs.writeFileSync(
    path.join(
      config.kujataDataDirectory,
      'data',
      'battle',
      'action-sequences.json'
    ),
    JSON.stringify(data)
  )
}
const extractActionSequences = async config => {
  console.log('Extract Action Sequences: START')

  const files = fs
    .readdirSync(path.join(config.unlgpDirectory, 'battle.lgp'))
    .filter(f => f.endsWith('ab'))
  // .filter(f => f === 'sfab')
  //   console.log('files', files)
  const data = {}
  for (const file of files) {
    // console.log('file', file)
    // try {
    data[file] = await extractOneEntity(config, file)
    // } catch (error) {
    //   console.log('error', file)
    // }
  }
  await saveActionSequenceData(config, data)
  console.log('Extract Action Sequences: END')
}
module.exports = { extractActionSequences }
