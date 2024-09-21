const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const cliProgress = require('cli-progress')
const { sleep, KUJATA_ROOT } = require('../ff7-asset-loader/helper')

const UNLGP_EXE_PATH = path.resolve(
  KUJATA_ROOT,
  'tools',
  'lgp-0.5b',
  'bin',
  'unlgp.exe'
)
const findLGPs = rootDir => {
  const results = []
  function searchDirectory (directory) {
    // Read all files and subdirectories in the current directory
    const files = fs.readdirSync(directory)

    for (const file of files) {
      const fullPath = path.join(directory, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // If it's a directory, recurse into the directory
        searchDirectory(fullPath)
      } else if (file.endsWith('.lgp')) {
        // If it's a file and matches the target name, add to the results
        results.push(fullPath)
      }
    }
  }

  searchDirectory(rootDir)
  return results
}
const deleteDirectorySync = dirPath => {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true })
    //   console.log(`Directory ${dirPath} and its contents were deleted successfully.`);
  } catch (err) {
    console.error(`Error deleting directory ${dirPath}:`, err)
  }
}

const extractLgp = (lgpPath, outputRootPath) => {
  const lgpName = path.basename(lgpPath)
  const outputPath = path.resolve(outputRootPath, lgpName)
  if (fs.existsSync(outputPath)) {
    deleteDirectorySync(outputPath)
  }
  fs.mkdirSync(outputPath)
  let success = false
  try {
    const command = `cd ${outputPath} && "${UNLGP_EXE_PATH}" "${lgpPath}"`
    // console.log('\n\ncommand', command)
    const result = spawnSync(command, { shell: true })

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      //   console.error(`Process exited with code ${result.status}`)
    } else {
      success = true
    }
  } catch (error) {
    // console.error(`Error: ${error.message}`)
  }
  return success
}
const extractUnlgp = async (config, lgpFiles, all) => {
  // console.log('extractUnlgp', config, lgpFiles, all)
  let lgpFilesToProcess = findLGPs(config.ff7InstallDirectory)
  if (!all) {
    lgpFilesToProcess = lgpFilesToProcess.filter(lgp =>
      lgpFiles.some(suffix => lgp.endsWith(suffix))
    )
  }
  // console.log('lgpFilesToProcess', lgpFilesToProcess)
  if (lgpFilesToProcess.length === 0) {
    console.log(
      chalk.red(
        `⚠️   No lgp files found - ${lgpFiles
          .map(l => chalk.inverse(l))
          .join(', ')}`
      )
    )
    return
  }

  const progressBar = new cliProgress.SingleBar({
    format:
      chalk.cyan('🛠️   Unlgp progress: ') +
      chalk.cyan('{bar}') +
      ' {percentage}% || {value}/{total} Files || Current: ' +
      chalk.cyan('{current}'),
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  progressBar.start(lgpFilesToProcess.length, 0)

  const errors = []
  for (const [i, lgpPath] of lgpFilesToProcess.entries()) {
    const lgp = path.basename(lgpPath)
    progressBar.update(i, { current: lgp })
    // await sleep(100) // The update above can be slow to display
    const result = extractLgp(lgpPath, config.unlgpDirectory)
    if (!result) {
      errors.push(chalk.red(`⚠️   Error unlgp-ing`, chalk.inverse(lgp)))
    }
    progressBar.increment()
  }
  progressBar.stop()

  if (errors.length > 0) {
    console.log(errors.join('\n'))
  } else {
    console.log(
      chalk.green(
        '🚀  Successfully unlgp-ed: ',
        lgpFilesToProcess.map(l => chalk.underline(path.basename(l))).join(', ')
      )
    )
  }
}
module.exports = { extractUnlgp }
