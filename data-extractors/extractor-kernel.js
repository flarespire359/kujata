const path = require('path')

const {
  extractKernelKernel2Bin,
  extractWindowBin
} = require('../ff7-asset-loader/kernel-extractor')

const extractKernel = async config => {
  const inputKernelDirectory = path.join(
    config['ff7-install-directory'],
    'data',
    'lang-en',
    'kernel'
  )
  const inputExeDirectory = path.join(config['ff7-install-directory']) // Note: CaitSith and Vincent initial data is held within exe
  const outputKernelDirectory = path.join(
    config['kujata-data-output-directory'],
    'data',
    'kernel'
  )
  const metadataDirectory = path.join(
    config['kujata-data-output-directory'],
    'metadata'
  )
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
