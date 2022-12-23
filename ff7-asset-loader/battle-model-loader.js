const fs = require('fs')
// const stringUtil = require('./string-util.js')
const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
// const PLoader = require('../ff7-asset-loader/p-loader.js')

module.exports = class BattleModelLoader {
  loadBattleLocationPiece (config, pieceFilename, boneIndex) {
    // let model = PLoader.loadP(config, pieceFilename, true)
    // const boneParent = boneIndex
    const boneLength = 1
    const bone = {
      boneIndex,
      name: '' + boneIndex,
      // name: 'LOCATION',
      parent: (boneIndex === 0 ? 'root' : '' + 0),
      length: -boneLength, // lengths are negative for battle models, positive for field models
      isBattle: true,
      rsdBaseFilenames: [], // applies to field models only
      polygonFilename: pieceFilename, // applies to battle models only
      hasModel: true
      // resizeX: 1,
      // resizeY: 1,
      // resizeZ: 1
    }
    // if (bone.parent == -1) {
    //   bone.parent = 'root'
    // } else {
    //   bone.parent = '' + bone.parent
    // }
    if (bone.hasModel !== 0) {
      bone.modelFilename = pieceFilename
      // bone.numModels = 1;
    }
    return bone
  }

  loadBattleBone (config, r, offset, boneIndex, pieceFilename, loadGeometry) {
    r.offset = offset
    const boneParent = r.readInt()
    const boneLength = r.readFloat()
    const hasModel = r.readUInt()
    const bone = {
      boneIndex,
      name: '' + boneIndex,
      parent: (boneParent === -1 ? 'root' : '' + boneParent),
      length: -boneLength, // lengths are negative for battle models, positive for field models
      isBattle: true,
      rsdBaseFilenames: [], // applies to field models only
      polygonFilename: pieceFilename, // applies to battle models only
      hasModel: (hasModel !== 0)
      // resizeX: 1,
      // resizeY: 1,
      // resizeZ: 1
    }
    if (bone.parent === -1) {
      bone.parent = 'root'
    } else {
      bone.parent = '' + bone.parent
    }
    if (bone.hasModel !== 0) {
      bone.modelFilename = pieceFilename
      // bone.numModels = 1;
    }
    return bone
  }

  loadWeaponBone (config, r, offset, boneIndex, pieceFilename, loadGeometry) {
    // r.offset = offset;
    // let boneParent = r.readInt();
    // let boneParent = "root";
    const boneParent = -1

    // let boneLength = r.readFloat();
    const boneLength = 1
    // let hasModel = r.readUInt();
    const hasModel = 1
    const bone = {
      boneIndex,
      // boneIndex: 1,
      name: 'WEAPON',
      parent: (boneParent === -1 ? 'root' : '' + boneParent),
      length: -boneLength, // lengths are negative for battle models, positive for field models
      isBattle: true,
      rsdBaseFilenames: [], // applies to field models only
      polygonFilename: pieceFilename, // applies to battle models only
      hasModel: (hasModel !== 0)
      // resizeX: 1,
      // resizeY: 1,
      // resizeZ: 1
    }
    if (bone.parent === -1) {
      bone.parent = 'root'
    } else {
      bone.parent = '' + bone.parent
    }
    if (bone.hasModel !== 0) {
      bone.modelFilename = pieceFilename
      // bone.numModels = 1;
    }
    return bone
  }

  // similar to Kimera's "ReadAASkeleton" subroutine in FF7AASkeleton.bas
  loadBattleModel (config, filename, loadGeometry) {
    const buffer = fs.readFileSync(config.inputBattleBattleDirectory + '/' + filename)

    const r = new FF7BinaryDataReader(buffer)

    // const fileSizeBytes = buffer.length
    r.offset = 0

    const battleModel = {}
    // const sectionOffset = 0
    // const sectionOffsetBase = 0

    battleModel.unk = [r.readUInt(), r.readUInt(), r.readUInt()]
    battleModel.numBones = r.readUInt()
    battleModel.unk2 = [r.readUInt(), r.readUInt()]
    battleModel.numTextures = r.readUInt()
    battleModel.numBodyAnimations = r.readUInt()
    battleModel.unk3 = [r.readUInt(), r.readUInt()]
    battleModel.numWeaponAnimations = r.readUInt()
    battleModel.unk4 = [r.readUInt(), r.readUInt()]
    battleModel.bones = []
    battleModel.weaponModels = []
    battleModel.name = filename
    const baseName = filename.substring(0, 2)
    let pSufix1 = 97 // 'a'
    let pSufix2 = null
    // const b = false

    // console.log('battleModel', battleModel)
    if (battleModel.numBones === 0) { // It's a battle location model
      battleModel.isBattleLocation = true

      for (let pSufix2 = 109; pSufix2 <= 122; pSufix2++) { // 109='m', 122='z'
        const pieceFilename = baseName + String.fromCharCode(pSufix1) + String.fromCharCode(pSufix2)
        const pieceFilepath = config.inputBattleBattleDirectory + '/' + pieceFilename
        // let pieceFilenameAbsolute = config.inputBattleBattleDirectory + '/' + pieceFilename

        // console.log('pieceFilepath', pieceFilepath, pieceFilename)

        if (fs.existsSync(pieceFilepath)) {
          // ReDim Preserve .Bones(.NumBones)

          // console.log('pieceFilepath', pieceFilepath, 'present', loadGeometry)
          if (loadGeometry) {
            const boneIndex = battleModel.numBones
            const bone = this.loadBattleLocationPiece(config, pieceFilename, boneIndex)
            // console.log('bone', bone)
            battleModel.bones.push(bone)
          }
          battleModel.numBones++
        }
      }
    } else { // It's a character battle model
      battleModel.isBattleLocation = false
      pSufix2 = 109
      // console.log('TOTAL BONES = ' + battleModel.numBones)

      for (let bi = 0; bi < battleModel.numBones; bi++) {
        const pieceFilename = baseName + String.fromCharCode(pSufix1) + String.fromCharCode(pSufix2)
        // const pieceFilenameAbsolute = config.inputBattleBattleDirectory + '/' + pieceFilename
        const bone = this.loadBattleBone(config, r, 52 + bi * 12, bi, pieceFilename, loadGeometry)
        battleModel.bones.push(bone)
        if (pSufix2 >= 122) {
          pSufix1 = pSufix1 + 1
          pSufix2 = 97
        } else {
          pSufix2++
        }
        // console.log("Bone= " + bi);

        // console.log("DEBUG: bone " + bi + " = " + JSON.stringify(bone, null, 0));
      }

      battleModel.weaponModelFilenames = []
      // weapon model filename suffixes are "ck, cl, cm, ..., cz"
      pSufix1 = 99 // 99='c'
      battleModel.numWeapons = 0
      for (let pSufix2 = 107; pSufix2 <= 122; pSufix2++) { // 107='k' 122='z'
        const weaponFilename = baseName + String.fromCharCode(pSufix1) + String.fromCharCode(pSufix2)
        const weaponFilenameAbsolute = config.inputBattleBattleDirectory + '/' + weaponFilename
        if (fs.existsSync(weaponFilenameAbsolute)) {
          console.log('weapon', weaponFilenameAbsolute)
          if (loadGeometry) {
            battleModel.weaponModelFilenames.push(weaponFilename)
          }
          battleModel.numWeapons++
        }
      }
      // TODO - Separate out weapons
      // battleModel.hasWeapon = false
      // for (const weaponFilename of battleModel.weaponModelFilenames) {
      //   const weaponFilenameAbsolute = config.inputBattleBattleDirectory + '/' + weaponFilename
      //   if (fs.existsSync(weaponFilenameAbsolute)) {
      //     const bi = battleModel.numBones
      //     const weaponBone = this.loadWeaponBone(config, r, 52 + bi * 12, bi, weaponFilename, loadGeometry)
      //     battleModel.bones.push(weaponBone)
      //     battleModel.numBones = battleModel.bones.length
      //     battleModel.hasWeapon = true
      //   }
      // }

      const weaponFilename = battleModel.weaponModelFilenames[0]
      const weaponFilenameAbsolute = config.inputBattleBattleDirectory + '/' + weaponFilename
      if (fs.existsSync(weaponFilenameAbsolute)) {
        const bi = battleModel.numBones
        const weaponBone = this.loadWeaponBone(config, r, 52 + bi * 12, bi, weaponFilename, loadGeometry)
        battleModel.bones.push(weaponBone)
        battleModel.hasWeapon = true
      } else {
        battleModel.hasWeapon = false
      }
    }

    // Texture file suffixes are ac, ad, ..., aj
    battleModel.textureFilenames = []
    pSufix1 = 97

    if (loadGeometry) {
      // ReDim .TexIDS(.NumTextures)
      // ReDim .textures(.NumTextures)
      // const ti = 0
      // const pSuffix2End = 99 + battleModel.numTextures - 1
      // for (let pSufix2 = 99; pSufix2 <= pSuffix2End; pSufix2++) {
      for (let ti = 0; ti < battleModel.numTextures; ti++) {
        const pSufix2 = 99 + ti
        const texFileName = baseName + String.fromCharCode(pSufix1) + String.fromCharCode(pSufix2)
        // const texFileNameAbsolute = config.inputBattleBattleDirectory + '/' + texFileName
        battleModel.textureFilenames.push(texFileName)
        // console.log('TEXTURES ARE ' + texFileName)
      }
    }

    return battleModel
  }; // end loadBattleModel() function
} // end module.exports = class BattleModelLoader {
