const fs = require('fs-extra')
const config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const {
  extractKernelKernel2Bin,
  extractWindowBin
} = require('./kernel-extractor')

const init = async () => {
  const inputKernelDirectory = config.inputKernelDirectory
  const inputExeDirectory = config.inputExeDirectory // Note: CaitSith and Vincent initial data is held within exe
  const outputKernelDirectory = config.outputKernelDirectory
  const metadataDirectory = config.metadataDirectory
  await extractKernelKernel2Bin(
    inputKernelDirectory,
    inputExeDirectory,
    outputKernelDirectory
  )
  await extractWindowBin(
    inputKernelDirectory,
    outputKernelDirectory,
    metadataDirectory
  )
}
init()
