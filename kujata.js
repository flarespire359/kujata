const fs = require('fs')
const path = require('path')
const commander = require('commander')
const chalk = require('chalk')
const { extractUnlgp } = require('./data-extractors/extractor-unlgp')
const { extractFlevel } = require('./data-extractors/extractor-flevel')
const { extractCDData } = require('./data-extractors/extractor-cd')
const { extractBattleData } = require('./data-extractors/extractor-battle-data')
const { extractExe } = require('./data-extractors/extractor-exe')
const { extractKernel } = require('./data-extractors/extractor-kernel')
const { extractMenu } = require('./data-extractors/extractor-menu')
const { generateCachedBundle } = require('./data-extractors/cache-generator')
const { extractMedias } = require('./data-extractors/extractor-media')
const { default: inquirer } = require('inquirer')
const {
  extractFieldBattleModels
} = require('./data-extractors/extractor-field-battle-models')
const {
  extractFieldAnimations
} = require('./data-extractors/extractor-field-animations')

const program = new commander.Command()

/*
PROGRESS:
  - unlgp - DONE
- flevel - broken, need to fix
  - cd - DONE
  - battle-data - DONE
  - field-models - DONE
  - battle-models - DONE
  - field-animations - DONE
  - exe - DONE
  - kernel - DONE
  - menu - DONE
  - media - TBC
- bundle - waiting on flevel
*/
/*
OTHERS to process:
- battle/create-battle-skeleton-metadata.js - Need for ???
- coemann8/parse-codemann8-data.js - Need for ???
- data-extractors/scene-graph-generator.js - Need for ???
    DONT NEED - standing-animations/create-standing-animations.js - Need for ???
- data-extractors/parse-wm-field-menu-names.js - Need for ???
- data-extractors/generate-field-id-to-world-map-coords.js - Need for ???
- data-extractors/generate-world-map-transition-data.js - Need for fenrir world map <-> field transitions
- data-extractors/generate-op-codes-usages.js - Need for kujata-webapp op code usage
- data-extractors/create-sound-list.js - Need for kujata-webapp sounds
*/

/*
kujata webapp requires:

fields
  /data/field/flevel.lgp/maplist.json
/metadata/scene-graph.json
/metadata/chapters.json
/metadata/makou-reactor/backgrounds/md1stin.png etc

field detail
/data/field/flevel.lgp/md1stin.json etc

field-op-codes
/metadata/op-categories.json
/metadata/op-metadata.json

field-op-codes detail
/metadata/op-code-usages/98.json etc
  
field-models
/metadata/ifalna.json
/metadata/ff7-database.json

field-models detail
/metadata/field-model-metadata.json
/metadata/skeleton-friendly-names.json

battle-models
/metadata/ff7-battle-database.json

sounds
/metadata/sound-list.json

*/

/*
fenrir requires:

  /data/exe/ff7.exe.json
  /data/kernel/kernel.bin.json
  /data/battle/mark.dat.json
  /data/battle/scene.bin/scene.bin.json
  /data/battle/battle.lgp/${modelCode.toLowerCase()}.hrc.gltf
/data/wm/world_us.lgp/field.tbl.json
  /data/field/char.lgp/${modelLoader.hrcId.toLowerCase()}.gltf
  /data/field/char.lgp/${animId}.a.gltf
/data/field/flevel.lgp/${fieldName}.json
/data/field/flevel.lgp/textures/${blinkTextures[textureCount]}.tex.png
  /data/field/flevel.lgp/maplist.json

  /media/sounds/sounds-metadata.json
  /media/music/music-metadata.json
  /media/movies/movies-metadata.json
  /media/movies/moviecam-metadata.json
  /media/movies/${name}.cam.json

/metadata/scene-graph.json
/metadata/chapters.json
/metadata/field-id-to-world-map-coords.json

  /metadata/credits-assets/credits.json
/metadata/field-assets/flevel.metadata.json
  /metadata/menu-assets/menu_us.metadata.json
  /metadata/credits-assets/credits-font.metadata.json
  /metadata/disc-assets/disc.metadata.json
  /metadata/window-assets/window.bin.metadata.json
  /metadata/${textureGroupName}-assets/${assetType}/${asset.description}.png`

/metadata/background-layers/${fieldName}/${fieldName}.json
/metadata/background-layers/${fieldName}/${fileName}
/metadata/background-layers/${fieldName}/pixels/${fileName}
/metadata/background-layers/${fieldName}/palettes/${fieldName}-${paletteIndex}.png

/metadata/makou-reactor/backgrounds/${fieldName}.png

*/
const configPath = 'config.json'
const configDefault = {
  'ff7-install-directory':
    'C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VII',
  'unlgp-directory': '../unlgp',
  'kujata-data-output-directory': '../kujata-data'
}
const getConfig = () => {
  return JSON.parse(fs.readFileSync(configPath))
}
const validateSystem = () => {
  if (process.platform !== 'win32') {
    program.error(
      chalk.red(
        `⚠️   The`,
        chalk.inverse(`kujata unlgp`),
        'function is only available on windows at the moment. Sorry'
      )
    )
  }
}
const validateConfig = () => {
  if (!fs.existsSync(configPath))
    fs.writeFileSync(configPath, JSON.stringify(configDefault, null, 3))

  const config = getConfig()
  // console.log('config', config)
  const errors = []
  if (
    !config['ff7-install-directory'] ||
    !fs.existsSync(path.join(config['ff7-install-directory'], 'ff7.exe'))
  ) {
    errors.push(
      chalk.red(
        '⚠️   Please set your',
        chalk.underline('ff7-install-directory'),
        'in',
        chalk.underline('config.js'),
        "and ensure that it's pointing to your FF7 install directory"
      )
    )
  }
  if (
    !config['unlgp-directory'] ||
    !fs.existsSync(path.join(config['unlgp-directory']))
  ) {
    errors.push(
      chalk.red(
        '⚠️   Please set your',
        chalk.underline('unlgp-directory'),
        'in',
        chalk.underline('config.js'),
        'and ensure that it exists'
      )
    )
  }
  if (
    !config['kujata-data-output-directory'] ||
    !fs.existsSync(path.join(config['kujata-data-output-directory']))
  ) {
    errors.push(
      chalk.red(
        '⚠️   Please set your',
        chalk.underline('kujata-data-output-directory'),
        'in',
        chalk.underline('config.js'),
        'and ensure that it exists'
      )
    )
  }

  if (errors.length > 0) {
    // console.log(chalk.blue('⚠️  Hello world!'))
    program.error(chalk.red(errors.join('\n')))
  }
  return config
}
const validateUnlgp = async (config, ...expectedFolders) => {
  const errors = []
  for (const expectedFolder of expectedFolders) {
    const expectedFolderPath = path.join(
      config['unlgp-directory'],
      expectedFolder
    )

    const exists = fs.existsSync(expectedFolderPath)
    // console.log('validateUnlgp', expectedFolder, exists)
    if (!exists || fs.readdirSync(expectedFolderPath).length === 0) {
      errors.push(expectedFolder)
    }
  }
  // console.log('errors', errors)
  if (errors.length > 0) {
    console.log(
      chalk.cyan(
        '⚠️   First, we need to unlgp the assets. Run',
        chalk.inverse(`kujata unlgp ${errors.map(e => e).join(' ')}`),
        'to ensure that it exists'
      )
    )
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: `Shall I run this command for you now?`,
        default: false
      }
    ])

    if (answer.confirmation) {
      await extractUnlgp(config, errors, false)
    } else {
      program.error(
        chalk.red(
          '⚠️   First, we need to unlgp the assets. Run',
          chalk.inverse(`kujata unlgp ${errors.map(e => e).join(' ')}`),
          'to ensure that it exists'
        )
      )
    }
  }
}

const flevelCommand = program
  .command('flevel')
  .description(
    'Extract all field data. ' +
      chalk.cyan('Includes backgrounds, palettes, walkmesh, field scripts etc')
  )
  .argument(
    '[field ids...]',
    `add field ids or '--all', eg: \n${chalk.bgGreen(
      'kujata flevel md1stin'
    )} \n${chalk.bgGreen('kujata flevel md1_1 md1_2')} \n${chalk.bgGreen(
      'kujata flevel --all'
    )}\nRendering of background layers, pixels and palettes is disabled by default`
  )
  .option(
    '-r, --render',
    'Turn on rendering of background layers, pixels and palettes'
  )
  .option('-a, --all', 'Process all fields')
  .action(async (fields, options) => {
    const config = validateConfig()
    await validateUnlgp(config, 'flevel.lgp')
    if (fields.length === 0 && !options.all) {
      flevelCommand.help()
    }
    await extractFlevel(config, fields, options.all, options.render)
  })
  .showHelpAfterError()

const fieldModelCommand = program
  .command('field-models')
  .description(
    'Extract field models to glTF. ' +
      chalk.cyan('Includes models and textures')
  )
  .argument(
    '[model ids...]',
    `add model ids or '--all', eg: \n${chalk.bgGreen(
      'kujata field-models aaaa'
    )} \n${chalk.bgGreen('kujata field-models aaaa aagb')} \n${chalk.bgGreen(
      'kujata field-models --all'
    )}`
  )
  .option('-a, --all', 'Process all models')
  .action(async (models, options) => {
    const config = validateConfig()
    await validateUnlgp(config, 'char.lgp')
    if (models.length === 0 && !options.all) {
      fieldModelCommand.help()
    }
    await extractFieldBattleModels(config, models, options.all, false)
  })
  .showHelpAfterError()

program
  .command('field-animations')
  .description(
    'Extract field model animations to glTF. ' +
      chalk.cyan('Includes all animations for all models')
  )
  .action(async () => {
    const config = validateConfig()
    await validateUnlgp(config, 'char.lgp')
    await extractFieldAnimations(config)
  })
  .showHelpAfterError()

const battleModelCommand = program
  .command('battle-models')
  .description(
    'Extract battle models to glTF. ' +
      chalk.cyan('Includes models, textures and animations')
  )
  .argument(
    '[model ids...]',
    `add model ids or '--all', eg: \n${chalk.bgGreen(
      'kujata battle-models rtaa'
    )} \n${chalk.bgGreen('kujata battle-models rtaa ruaa')} \n${chalk.bgGreen(
      'kujata battle-models --all'
    )}`
  )
  .option('-a, --all', 'Process all models')
  .action(async (models, options) => {
    const config = validateConfig()
    await validateUnlgp(config, 'battle.lgp')
    if (models.length === 0 && !options.all) {
      battleModelCommand.help()
    }
    await extractFieldBattleModels(config, models, options.all, true)
  })
  .showHelpAfterError()
program
  .command('cd')
  .description(
    'Extract cd data. ' + chalk.cyan('Includes credits and change disk data')
  )
  .action(async () => {
    const config = validateConfig()
    await validateUnlgp(config, 'cr_us.lgp', 'disc_us.lgp')
    await extractCDData(config)
  })
  .showHelpAfterError()

program
  .command('battle-data')
  .description(
    'Extract battle data. ' +
      chalk.cyan('Includes enemies, scene.bin, mark.dat and camera data')
  )
  .action(async () => {
    const config = validateConfig()
    await extractBattleData(config)
  })
  .showHelpAfterError()

program
  .command('exe')
  .description(
    'Extract exe data. ' +
      chalk.cyan('Includes shops, initial data, limit data')
  )
  .action(async () => {
    const config = validateConfig()
    await extractExe(config)
  })
  .showHelpAfterError()

program
  .command('kernel')
  .description(
    'Extract kernel data. ' +
      chalk.cyan(
        'Includes command and attacks, initial data, and window.bin data'
      )
  )
  .action(async () => {
    const config = validateConfig()
    await extractKernel(config)
  })
  .showHelpAfterError()

program
  .command('menu')
  .description(
    'Extract menu assets. ' +
      chalk.cyan('Includes images, text, icons, most images for the game')
  )
  .action(async () => {
    const config = validateConfig()
    await validateUnlgp(config, 'menu_us.lgp')
    await extractMenu(config)
  })
  .showHelpAfterError()

program
  .command('media')
  .description(
    'Convert media assets to web friendly formats. ' +
      chalk.cyan('Sounds, music, movies, movie cam data')
  )
  .action(async () => {
    const config = validateConfig()
    validateSystem()
    await validateUnlgp(config, 'moviecam.lgp')
    await extractMedias(config)
  })
  .showHelpAfterError()

program
  .command('bundle')
  .description(
    'Bundle image assets. ' +
      chalk.green('For fenrir game engine, zips up most common image assets')
  )
  .action(async () => {
    const config = validateConfig()
    await generateCachedBundle(config)
  })
  .showHelpAfterError()

const unlgpCommand = program
  .command('unlgp')
  .description('Extract the files from the lgp archives')
  .argument(
    '[archives...]',
    `add archives or '--all', eg: \n${chalk.bgGreen(
      'kujata unlgp flevel.lgp'
    )} \n${chalk.bgGreen(
      'kujata unlgp battle.lgp magic.lgp'
    )} \n${chalk.bgGreen('kujata unlgp --all')}`
  )
  .option('-a, --all', 'Process all lgp-s')
  .action(async (lgpFiles, options) => {
    if (lgpFiles.length === 0 && !options.all) {
      unlgpCommand.help()
    }
    validateSystem()
    const config = validateConfig()
    await extractUnlgp(config, lgpFiles, options.all)
  })
  .showHelpAfterError()
program.parse()
