const toBits8 = function (n) {
  return n.toString(2).padStart(8, '0')
}

const toHex2 = function (n) {
  return n.toString(16).padStart(2, '0')
}

const toHex5 = function (n) {
  return '0x' + n.toString(16).padStart(5, '0')
}

const pad5 = function (n) {
  return ('' + n).padStart(5, '0')
}

const dec2hex = (dec, padding, rawWithSpaces) => {
  const h = parseInt(dec).toString(16)
  return `${!rawWithSpaces ? '0x' : ''}${
    padding ? h.padStart(padding, '0') : h
  }`
}
const dec2bin = dec => {
  // For debug only
  return (dec >>> 0).toString(2).padStart(8, '0')
}
const printBytes = (text, bytes, g1, g2, toDec) => {
  let hexList = bytes.map(byte =>
    byte.toString(16).padStart(2, '0').toUpperCase()
  )

  let g1Groups = []
  for (let i = 0; i < hexList.length; i += g1) {
    let group = hexList.slice(i, i + g1)

    // Reverse the group for proper endianness when converting to decimal
    if (toDec && toDec !== 'binary') {
      group = group.reverse()
    }

    const value = group.join('')

    let unsignedValue = parseInt(value, 16)
    let signedValue =
      unsignedValue > 0x7fff ? unsignedValue - 0x10000 : unsignedValue

    // Push the signed or unsigned value based on `toDec`
    if (toDec === 'binary') {
      g1Groups.push(
        parseInt(value, 16)
          .toString(2)
          .padStart(value.length * 4, '0')
      )
    } else {
      g1Groups.push(toDec ? signedValue : value)
    }
  }

  let g2Groups = []
  for (let i = 0; i < g1Groups.length; i += g2) {
    g2Groups.push(g1Groups.slice(i, i + g2).join(' '))
  }

  console.log('\n_____ ' + text + ' : START')
  console.log(g2Groups.join('\n'))
  console.log('_____ ' + text + ' : END\n')
}

module.exports = {
  toBits8,
  toHex2,
  toHex5,
  pad5,
  dec2hex,
  dec2bin,
  printBytes
}
