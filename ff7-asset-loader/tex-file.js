const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const fs = require('fs-extra')
const sharp = require('sharp')

class TexFile {
  loadTexFileFromPath (path) {
    return this.loadTexFileFromBuffer(fs.readFileSync(path))
  }

  loadTexFileFromBuffer (buffer) {
    const r = new FF7BinaryDataReader(buffer)
    this.tex = {
      header: {
        version: r.readUInt(),
        unknown1: r.readUInt(),
        colorKeyFlag: r.readUInt(),
        unknown2: r.readUInt(),
        unknown3: r.readUInt(),
        minBitsPerColor: r.readUInt(),
        maxBitsPerColor: r.readUInt(),
        minAlphaBits: r.readUInt(),
        maxAlphaBits: r.readUInt(),
        minBitsPerPixel: r.readUInt(),
        maxBitsPerPixel: r.readUInt(),
        unknown4: r.readUInt(),
        noOfPalettes: r.readUInt(),
        noColorsPerPalettes: r.readUInt(),
        bitDepth: r.readUInt(),
        width: r.readUInt(),
        height: r.readUInt(),
        bytesPerRow: r.readUInt(),
        unknown5: r.readUInt(),
        paletteFlag: r.readUInt(),
        bitsPerIndex: r.readUInt(),
        indexedTo8bitFlag: r.readUInt(),
        paletteSize: r.readUInt(),
        noColorsPerPalettes2: r.readUInt(),
        runtimeData: r.readUInt(),
        bitsPerPixel: r.readUInt(),
        bytesPerPixel: r.readUInt()
      },
      pixelFormat: {
        noRedBits: r.readUInt(),
        noGreenBits: r.readUInt(),
        noBlueBits: r.readUInt(),
        noAlphaBits: r.readUInt(),
        redBitmask: r.readUInt(),
        greenBitmask: r.readUInt(),
        blueBitmask: r.readUInt(),
        alphaBitmask: r.readUInt(),
        redShift: r.readUInt(),
        greenShift: r.readUInt(),
        blueShift: r.readUInt(),
        alphaShift: r.readUInt(),
        noRedBits8: r.readUInt(),
        noGreenBits8: r.readUInt(),
        noBlueBits8: r.readUInt(),
        noAlphaBits8: r.readUInt(),
        redMax: r.readUInt(),
        greenMax: r.readUInt(),
        blueMax: r.readUInt(),
        alphaMax: r.readUInt()
      },
      misc: {
        colorKeyArrayFlag: r.readUInt(),
        runtimeData1: r.readUInt(),
        referenceAlpha: r.readUInt(),
        runtimeData2: r.readUInt(),
        unknown6: r.readUInt(),
        paletteIndex: r.readUInt(),
        runtimeData3: r.readUInt(),
        runtimeData4: r.readUInt(),
        unknown7: r.readUInt(),
        unknown8: r.readUInt(),
        unknown9: r.readUInt(),
        unknown10: r.readUInt()
      }
    }

    this.tex.paletteData = r.readUByteArray(this.tex.header.paletteSize * 4)
    this.tex.pixelData = r.readUByteArray(
      this.tex.header.width *
        this.tex.header.height *
        this.tex.header.bytesPerPixel
    )
    if (r.length <= r.offset) {
      // This seems to be out of range in some cases
      this.tex.colorKeyArray = []
    } else {
      this.tex.colorKeyArray = r.readUByteArray(
        this.tex.header.noOfPalettes * 1
      )
    }
    // For debugging only
    // delete this.tex.paletteData
    // delete this.tex.pixelData

    // console.log('tex', this.tex)
    // console.log(r.length, 'r.offset', r.offset, this._dec2bin(r.offset), this._dec2hex(r.offset))
    // console.log('tex.header.version', this.tex.header.version, this._dec2hex(this.tex.header.version), this._dec2bin(this.tex.header.version))
    // console.log('tex.header.paletteSize', tex.header.paletteSize, tex.header.paletteSize * 4)
    // console.log('tex.header.pixelData', tex.header.width, tex.header.height, tex.header.bytesPerPixel, '->', tex.header.width * tex.header.height * tex.header.bytesPerPixel, 'pixels')

    return this
  }

  getImageWidth () {
    return this.tex.header.width
  }

  getImageHeight () {
    return this.tex.header.height
  }

  async saveAsPng (outputPath) {
    await this.saveAsPngWithPaletteOffset(outputPath, 0)
  }

  async saveAllPalettesAsPngs (outputPath) {
    for (let i = 0; i < this.tex.header.noOfPalettes; i++) {
      const paletteOutputPath = outputPath.replace('.png', `_${i + 1}.png`)
      await this.saveAsPngWithPaletteOffset(paletteOutputPath, i)
    }
    // Helper for palettes
    // const paletteData = new Uint8Array(this.tex.paletteData)
    // for (let i = 0; i < this.tex.paletteData.length; i++) {
    //   paletteData[i] = this.tex.paletteData[i]
    // }
    // await sharp(Buffer.from(paletteData.buffer), {
    //   raw: {
    //     width: 16,
    //     height: 4,
    //     channels: 4
    //   }
    // }).toFile(outputPath.replace('.png', '-palette.png'))
  }

  async saveAsPngWithPaletteOffset (outputPath, paletteOffset) {
    const n = this.tex.header.height * this.tex.header.width * 4
    const data = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      data[i] = 0xff // Fill with transparent
    }
    if (this.tex.header.noOfPalettes > 1) {
      // console.log('tex multi palette', outputPath, paletteOffset, this.tex.header.colorKeyFlag)
      // console.log('tex palette data', this.tex.paletteData)

      for (let i = 0; i < this.tex.header.height * this.tex.header.width; i++) {
        // console.log('i', i)
        const paletteStart = this.tex.header.noColorsPerPalettes * paletteOffset
        // const pixelId = 1 * (this.tex.header.noOfPalettes + this.tex.pixelData[i])
        const pixelId = this.tex.pixelData[i]

        const color = {
          r: this.tex.paletteData[((paletteStart + pixelId) * 4) + 2],
          g: this.tex.paletteData[((paletteStart + pixelId) * 4) + 1],
          b: this.tex.paletteData[((paletteStart + pixelId) * 4) + 0],
          a: this.tex.paletteData[((paletteStart + pixelId) * 4) + 3]
        }
        if (color.a === 0xFE) {
          // console.log('alpha ref', color.a)
          color.a = this.tex.misc.referenceAlpha
        }
        // if (i === 0 || i === (11 * 256) + 11 || i === (16 * 256) + 16) {
        // if (i > (16 * 256) + 0 && (16 * 256) + 23 > i) {
        //   console.log('pixel', i, '->', pixelId, paletteStart, paletteStart + pixelId, (paletteStart + pixelId) * 4, color)
        // }
        data[i * 4 + 0] = color.r
        data[i * 4 + 1] = color.g
        data[i * 4 + 2] = color.b
        data[i * 4 + 3] =
          color.r === 0 && color.g === 0 && color.b === 0 ? 0x00 : color.a
      }
    } else {
      // console.log('tex single palette')
      for (let i = 0; i < this.tex.header.height * this.tex.header.width; i++) {
        const pixelId = paletteOffset + this.tex.pixelData[i]
        const color = {
          r: this.tex.paletteData[pixelId * 4 + 2],
          g: this.tex.paletteData[pixelId * 4 + 1],
          b: this.tex.paletteData[pixelId * 4 + 0],
          a: this.tex.paletteData[pixelId * 4 + 3]
        }
        data[i * 4 + 0] = color.r
        data[i * 4 + 1] = color.g
        data[i * 4 + 2] = color.b
        data[i * 4 + 3] =
          color.r === 0 && color.g === 0 && color.b === 0 ? 0x00 : color.a
      }
    }

    await sharp(Buffer.from(data.buffer), {
      raw: {
        width: this.tex.header.width,
        height: this.tex.header.height,
        channels: 4
      }
    }).toFile(outputPath)
  }

  _dec2hex (dec) {
    // For debug only
    return `0x${parseInt(dec).toString(16)}`
  }

  _dec2bin (dec) {
    // For debug only
    return (dec >>> 0).toString(2)
  }
}

module.exports = {
  TexFile
}
