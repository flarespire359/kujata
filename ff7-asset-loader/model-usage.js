const fs = require('fs')
const path = require('path')

// translate all maps and create index
// let opCodeUsages = {};
// let fieldModelMetadata = {};
// let fieldAnimationMetadata = {};
// var getMetadata = function(container, key1) {
//   let meta = container[key1];
//   if (!meta) {
//     meta = {
//       fieldStats: {},
//       animationStats: {
//         stand: {},
//         walk: {},
//         run: {},
//         other: {}
//       }
//     };
//     container[key1] = meta;
//   }
//   return meta;
// };
// var getFieldModelMetadata = function(hrcId) {
//   return getMetadata(fieldModelMetadata, hrcId);
// }
// var getFieldAnimationMetadata = function(animId) {
//   return getMetadata(fieldAnimationMetadata, animId);
// }
// var incrementStat = function(statsContainer, statName) {
//   let count = statsContainer[statName] || 0;
//   statsContainer[statName] = count + 1;
// };

// for (let fieldName of mapList) {
//   if (fieldName && !fieldName.startsWith("wm")) {
//       let flevel = flevelLoader.loadFLevel(config, fieldName);
//       let outputFilename = config.outputFieldFLevelDirectory + '/' + fieldName + '.json';
//       fs.writeFileSync(outputFilename, JSON.stringify(flevel, replacer, 2));
//       console.log("Wrote: " + fieldName + '.json');
//       for (let loader of flevel.model.modelLoaders) {
//         let hrcId = loader.hrcId.substring(0, 4).toLowerCase();
//         let meta1 = getFieldModelMetadata(hrcId);
//         incrementStat(meta1, "numFieldModelLoaders");
//         incrementStat(meta1.fieldStats, fieldName);
//         for (let a=0; a<loader.animations.length; a++) {
//           let animId = loader.animations[a].substring(0, 4).toLowerCase();
//           let meta2 = getFieldAnimationMetadata(animId);
//           if      (a==0) { incrementStat(meta1.animationStats.stand, animId); incrementStat(meta2.animationStats.stand, hrcId); }
//           else if (a==1) { incrementStat(meta1.animationStats.walk,  animId); incrementStat(meta2.animationStats.walk,  hrcId); }
//           else if (a==2) { incrementStat(meta1.animationStats.run,   animId); incrementStat(meta2.animationStats.run,   hrcId); }
//           else           { incrementStat(meta1.animationStats.other, animId); incrementStat(meta2.animationStats.other, hrcId); }
//           incrementStat(meta2, "numFieldModelLoaders");
//           incrementStat(meta2.fieldStats, fieldName);
//         }
//       }
//   }
// }
// fs.writeFileSync(config.metadataDirectory + '/field-model-metadata.json', JSON.stringify(fieldModelMetadata, null, 2));
// fs.writeFileSync(config.metadataDirectory + '/field-animation-metadata.json', JSON.stringify(fieldAnimationMetadata, null, 2));

const generateModelUsage = () => {
  return { models: {}, animations: {} }
}
const getMetadata = (container, key1) => {
  let meta = container[key1]
  if (!meta) {
    meta = {
      fieldStats: {},
      animationStats: {
        stand: {},
        walk: {},
        run: {},
        other: {}
      }
    }
    container[key1] = meta
  }
  return meta
}
const getFieldModelMetadata = hrcId => {
  return getMetadata(fieldModelMetadata, hrcId)
}
const getFieldAnimationMetadata = animId => {
  return getMetadata(fieldAnimationMetadata, animId)
}
const incrementStat = (statsContainer, statName) => {
  let count = statsContainer[statName] || 0
  statsContainer[statName] = count + 1
}
const processModelUsage = (modelUsage, fieldName, modelLoaders) => {
  //   console.log('processModelUsage', modelUsage, fieldName, modelLoaders)
  for (let loader of modelLoaders) {
    let hrcId = loader.hrcId.substring(0, 4).toLowerCase()
    let metaModels = getMetadata(modelUsage.models, hrcId)
    incrementStat(metaModels, 'numFieldModelLoaders')
    incrementStat(metaModels.fieldStats, fieldName)
    for (let a = 0; a < loader.animations.length; a++) {
      let animId = loader.animations[a].substring(0, 4).toLowerCase()
      let metaAnims = getMetadata(modelUsage.animations, animId)
      if (a == 0) {
        incrementStat(metaModels.animationStats.stand, animId)
        incrementStat(metaAnims.animationStats.stand, hrcId)
      } else if (a == 1) {
        incrementStat(metaModels.animationStats.walk, animId)
        incrementStat(metaAnims.animationStats.walk, hrcId)
      } else if (a == 2) {
        incrementStat(metaModels.animationStats.run, animId)
        incrementStat(metaAnims.animationStats.run, hrcId)
      } else {
        incrementStat(metaModels.animationStats.other, animId)
        incrementStat(metaAnims.animationStats.other, hrcId)
      }
      incrementStat(metaAnims, 'numFieldModelLoaders')
      incrementStat(metaAnims.fieldStats, fieldName)
    }
  }
}
const writeModelUsage = (config, modelUsage) => {
  //   console.log('writeModelUsage', modelUsage)
  fs.writeFileSync(
    path.join(
      config.kujataDataDirectory,
      'metadata',
      'field-model-metadata.json'
    ),
    JSON.stringify(modelUsage.models, null, 2)
  )

  fs.writeFileSync(
    // Save in core metadata folder too for field-model generation
    path.join(__dirname, '..', 'metadata', 'field-model-metadata.json'),
    JSON.stringify(modelUsage.models, null, 2)
  )
  fs.writeFileSync(
    path.join(
      config.kujataDataDirectory,
      'metadata',
      'field-animation-metadata.json'
    ),
    JSON.stringify(modelUsage.animations, null, 2)
  )

  let standingAnimations = {}
  for (let hrcId of Object.keys(modelUsage.models)) {
    var stats = modelUsage.models[hrcId].animationStats.stand
    let animIds = Object.keys(stats)
    //console.log(hrcId + ": " + JSON.stringify(animIds, null, 0));
    animIds.sort((a1, a2) => stats[a2] - stats[a1]) // sort by higher frequency first
    //console.log(hrcId + ": " + JSON.stringify(animIds, null, 0));
    let mostCommonStandingAnimation = animIds[0]
    standingAnimations[hrcId] = mostCommonStandingAnimation
  }

  fs.writeFileSync(
    path.join(
      config.kujataDataDirectory,
      'metadata',
      'field-model-standing-animation.json'
    ),
    JSON.stringify(standingAnimations, null, 2)
  )
  fs.writeFileSync(
    // Save in core metadata folder too for field-model generation
    path.join(
      __dirname,
      '..',
      'metadata',
      'field-model-standing-animation.json'
    ),
    JSON.stringify(standingAnimations, null, 2)
  )
}
module.exports = {
  generateModelUsage,
  processModelUsage,
  writeModelUsage
}
