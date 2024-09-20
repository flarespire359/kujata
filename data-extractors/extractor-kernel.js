const path = require('path')

const {
  extractKernelKernel2Bin,
  extractWindowBin
} = require('../ff7-asset-loader/kernel-extractor')

const extractKernel = async config => {
  const inputKernelDirectory = path.join(
    config.ff7InstallDirectory,
    'data',
    'lang-en',
    'kernel'
  )
  const inputExeDirectory = path.join(config.ff7InstallDirectory) // Note: CaitSith and Vincent initial data is held within exe
  const outputKernelDirectory = path.join(
    config.kujataDataDirectory,
    'data',
    'kernel'
  )
  const metadataDirectory = path.join(config.kujataDataDirectory, 'metadata')
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
module.exports = {
  extractKernel
}
