const fs = require('fs-extra')
let config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const { extractKernelKernel2Bin } = require('./kernel-extractor')

const init = async () => {
    const inputKernelDirectory = config.inputKernelDirectory
    const outputKernelDirectory = config.outputKernelDirectory
    await extractKernelKernel2Bin(inputKernelDirectory, outputKernelDirectory)
}
init()