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
  return `${!rawWithSpaces ? '0x' : ''}${padding ? h.padStart(padding, '0') : h}`
}
const dec2bin = (dec) => { // For debug only
  return (dec >>> 0).toString(2).padStart(8, '0')
}

module.exports = {
  toBits8,
  toHex2,
  toHex5,
  pad5,
  dec2hex,
  dec2bin
}
