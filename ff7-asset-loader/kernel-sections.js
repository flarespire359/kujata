const { FF7BinaryDataReader } = require('./ff7-binary-data-reader.js')
const { Enums, parseKernelEnums, parseMateriaData } = require('./kernel-enums')
const path = require('path')
const fs = require('fs-extra')
const sharp = require('sharp')
const { dec2hex, dec2bin } = require('./string-util.js')
const { KUJATA_ROOT } = require('./helper.js')

const getTextSectionData = sectionData => {
  const strings = []

  const r = new FF7BinaryDataReader(sectionData.buffer)
  const firstItem = r.readUShort()
  const addresses = []
  for (let i = 0; i < firstItem; i += 2) {
    addresses.push(r.readUShort())
  }

  const offset = r.offset
  addresses.unshift(offset - 2) // Ensure first word is in addressses

  r.offset = offset
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    if (i + 1 < addresses.length) {
      const nextAddress = addresses[i + 1]
      r.offset = address
      const addressText = r.readKernelString(nextAddress - address) // or r.readDialogString
      // console.log('address', i, 'to', i + 1, '->', address, nextAddress, '->', addressText)
      strings.push(addressText)
    }
    // There are some lookups here for a few items, not sure what to do yet:
    // https://github.com/Shojy/Elena/blob/master/Shojy.FF7.Elena/Sections/TextSection.cs
  }
  return strings
}

const getItemSectionData = (sectionData, names, descriptions) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const objectSize = 28
  // console.log('getItemSectionData', r.length, r.length / objectSize, names.length, descriptions.length)
  const objects = []

  for (let i = 0; i < r.length / objectSize; i++) {
    // const sectionOffset = i * objectSize
    // r.offset = sectionOffset
    const unknown1 = r.readUByteArray(8)
    const cameraMovementId = r.readUShort()
    const restrictions = r.readUShort()
    const targetData = r.readUByte()
    const attackEffectId = r.readUByte()
    const damageCalculationId = r.readUByte()
    const attackPower = r.readUByte()
    const conditionSubMenu = r.readUByte()
    const statusEffectChance = r.readUByte() // Some calculation required here. 3Fh	Chance to Inflict/Heal status (out of 63). 40h Cure if inflicted. 80h Cure if inflicted, Inflict if not
    const attackSpecialEffects = r.readUByte() // http://wiki.ffrtt.ru/index.php?title=FF7/Battle/Attack_Special_Effects
    const additionalEffectsModifier = r.readUByte()
    const status = r.readUInt()
    const element = r.readUShort()
    const specialAttack = r.readUShort()
    const object = {
      itemId: i,
      name: names[i],
      description: descriptions[i],
      type: 'Item',
      cameraMovement: cameraMovementId,
      restrictions: parseKernelEnums(Enums.Restrictions, restrictions),
      targetData: parseKernelEnums(Enums.TargetData, targetData),
      attackEffectId: attackEffectId,
      damageCalculationId: damageCalculationId,
      attackPower: attackPower,
      conditionSubMenu: conditionSubMenu,
      statusEffectChance: statusEffectChance, // TODO
      attackSpecialEffects: attackSpecialEffects, // TODO
      additionalEffectsModifier: additionalEffectsModifier,
      status: parseKernelEnums(Enums.Statuses, status), // Not sure if this is right, or if it should be inversed
      elements: parseKernelEnums(Enums.Elements, element),
      specialAttack: parseKernelEnums(Enums.SpecialEffects, specialAttack)
      // unknown: {
      //     unknown1
      // }
    }
    objects.push(object)
    // if (i < 2) {
    //     console.log('weapon', object)
    // }
  }
  return objects
}
const getWeaponSectionData = (sectionData, names, descriptions) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const objectSize = 44
  const objects = []

  for (let i = 0; i < r.length / objectSize; i++) {
    const targetData = r.readUByte()
    const attackEffectId = r.readUByte() // Attack effect id, always 0xFF. Isn't used for weapon in game
    const damageCalculationId = r.readUByte()
    const unknown1 = r.readUByte()
    const attackStrength = r.readUByte() // ?
    const status = r.readUByte()
    const growthRate = r.readUByte()
    const criticalRate = r.readUByte()
    const accuracyRate = r.readUByte()
    const weaponModelId = r.readUByte() // Upper nybble, attack animation modifier (for Barret & Vincent only). Lower nybble, weapon model index
    const alignment = r.readUByte() // Alignment. Always 0xFF
    const highSoundMask = r.readUByte() // Mask for access high sound id (0x100+)
    const cameraMovementId = r.readUShort() // Camera movement id, Always 0xFFFF
    const equipableBy = r.readUShort()
    const attackElements = r.readUShort()
    const unknown2 = r.readUShort()

    const boostedStat1 = r.readUByte()
    const boostedStat2 = r.readUByte()
    const boostedStat3 = r.readUByte()
    const boostedStat4 = r.readUByte()
    const boostedStat1Bonus = r.readUByte()
    const boostedStat2Bonus = r.readUByte()
    const boostedStat3Bonus = r.readUByte()
    const boostedStat4Bonus = r.readUByte()

    const materiaSlots = []
    for (let slot = 0; slot < 8; slot++) {
      const materiaSlotByte = r.readUByte()
      const materiaSlot = parseKernelEnums(Enums.MateriaSlot, materiaSlotByte)
      materiaSlots.push(materiaSlot)
    }

    const impactSoundRawHit = r.readUByte()
    const impactSoundRawCritical = r.readUByte()
    const impactSoundRawMiss = r.readUByte()
    const impactEffectId = r.readUByte()
    const specialAttack = r.readUShort() // Always 0xFFFF
    const restrictions = r.readUShort()

    // High sound id - 3 values:
    //    248 - 0b11111000 - Do nothing
    //    249 - 0b11111001 - ??
    //    251 - 0b11111011 - add 0x1 to beginning, eg 0x24 become 0x124 -> + 256

    const applyHighSoundMask = (soundId, maskValue, mask) => {
      return (maskValue & mask) === mask ? soundId + 0x100 : soundId
    }
    const impactSoundHit = applyHighSoundMask(
      impactSoundRawHit,
      highSoundMask,
      0b1
    )
    const impactSoundCritical = applyHighSoundMask(
      impactSoundRawCritical,
      highSoundMask,
      0b10
    )
    const impactSoundMiss = applyHighSoundMask(
      impactSoundRawMiss,
      highSoundMask,
      0b100
    )

    const object = {
      index: i,
      itemId: i + 128,
      name: names[i],
      description: descriptions[i],
      type: 'Weapon',
      targets: parseKernelEnums(Enums.TargetData, targetData),
      damageCalculationId: damageCalculationId,
      attackStrength: attackStrength,
      status: parseKernelEnums(Enums.EquipmentStatus, status), // Not sure if this is right, or if it should be inversed
      growthRate: parseKernelEnums(Enums.GrowthRate, growthRate),
      criticalRate: criticalRate,
      accuracyRate: accuracyRate,
      weaponModelId: weaponModelId, // Maybe split into nybbles if required
      equipableBy: parseKernelEnums(Enums.EquipableBy, equipableBy),
      elements: parseKernelEnums(Enums.Elements, attackElements), // Is this array of single?
      boostedStats: filterUnneededBoostedStats([
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat1),
          value: boostedStat1Bonus
        },
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat2),
          value: boostedStat2Bonus
        },
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat3),
          value: boostedStat3Bonus
        },
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat4),
          value: boostedStat4Bonus
        }
      ]),
      materiaSlots: materiaSlots,
      highSoundMask,
      impactSoundRawHit,
      impactSoundRawCritical,
      impactSoundRawMiss,
      impactSoundHit,
      impactSoundCritical,
      impactSoundMiss,
      impactEffectId: impactEffectId,
      restrictions: parseKernelEnums(Enums.Restrictions, restrictions),
      specialAttack: parseKernelEnums(Enums.SpecialEffects, specialAttack)
      // unknown: {
      //     attackEffectId, unknown1, alignment, cameraMovementId, unknown2
      // }
    }
    // if (i < 2) {
    //     console.log('weapon', object)
    // }
    // console.log('weap',object.name, object.status, status )
    objects.push(object)
  }
  return objects
}
const getArmorSectionData = (sectionData, names, descriptions) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const objectSize = 36
  const objects = []

  for (let i = 0; i < r.length / objectSize; i++) {
    const unknown1 = r.readUByte()
    const elementDamageModifier = r.readUByte()
    const defense = r.readUByte()
    const magicDefense = r.readUByte()
    const evade = r.readUByte()
    const magicEvade = r.readUByte()
    const status = r.readUByte()
    const unknown2 = r.readUShort()
    const materiaSlots = []
    for (let slot = 0; slot < 8; slot++) {
      const materiaSlotByte = r.readUByte()
      const materiaSlot = parseKernelEnums(Enums.MateriaSlot, materiaSlotByte)
      materiaSlots.push(materiaSlot)
    }
    const growthRate = r.readUByte()
    const equipableBy = r.readUShort()
    const elementalDefense = r.readUShort()
    const unknown3 = r.readUShort()
    const boostedStat1 = r.readUByte()
    const boostedStat2 = r.readUByte()
    const boostedStat3 = r.readUByte()
    const boostedStat4 = r.readUByte()
    const boostedStat1Bonus = r.readUByte()
    const boostedStat2Bonus = r.readUByte()
    const boostedStat3Bonus = r.readUByte()
    const boostedStat4Bonus = r.readUByte()
    const restrictions = r.readUShort()
    const unknown4 = r.readUShort()

    const object = {
      index: 1,
      itemId: i + 256,
      name: names[i],
      description: descriptions[i],
      type: 'Armor',
      defense: defense,
      magicDefense: magicDefense,
      evade: evade,
      magicEvade: magicEvade,
      status: parseKernelEnums(Enums.EquipmentStatus, status),
      materiaSlots: materiaSlots,
      growthRate: parseKernelEnums(Enums.GrowthRate, growthRate),
      equipableBy: parseKernelEnums(Enums.EquipableBy, equipableBy),
      elementDamageModifier: parseKernelEnums(
        Enums.DamageModifier,
        elementDamageModifier
      ),
      elements: parseKernelEnums(Enums.Elements, elementalDefense),
      boostedStats: filterUnneededBoostedStats([
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat1),
          value: boostedStat1Bonus
        },
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat2),
          value: boostedStat2Bonus
        },
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat3),
          value: boostedStat3Bonus
        },
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat4),
          value: boostedStat4Bonus
        }
      ]),
      restrictions: parseKernelEnums(Enums.Restrictions, restrictions)
      // unknown: {
      //     unknown1, unknown2, unknown3, unknown4
      // }
    }
    // console.log('arm',object.name, object.status, status )
    objects.push(object)
  }
  return objects
}
const getAccessorySectionData = (sectionData, names, descriptions) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const objectSize = 16
  const objects = []

  for (let i = 0; i < r.length / objectSize; i++) {
    const boostedStat1 = r.readUByte()
    const boostedStat2 = r.readUByte()
    const boostedStat1Bonus = r.readUByte()
    const boostedStat2Bonus = r.readUByte()
    const elementDamageModifier = r.readUByte()
    const accessoryEffect = r.readUByte()
    const elements = r.readUShort()
    const status = r.readUInt() // 4 bytes? normally 2
    const equipableBy = r.readUShort()
    const restrictions = r.readUShort()

    const object = {
      index: i,
      itemId: i + 288,
      name: names[i],
      description: descriptions[i],
      type: 'Accessory',
      boostedStats: filterUnneededBoostedStats([
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat1),
          value: boostedStat1Bonus
        },
        {
          stat: parseKernelEnums(Enums.CharacterStat, boostedStat2),
          value: boostedStat2Bonus
        }
      ]),
      elementDamageModifier: parseKernelEnums(
        Enums.DamageModifier,
        elementDamageModifier
      ),
      elements: parseKernelEnums(Enums.Elements, elements),
      accessoryEffect: parseKernelEnums(Enums.AccessoryEffect, accessoryEffect),
      status: parseKernelEnums(Enums.Statuses, status),
      equipableBy: parseKernelEnums(Enums.EquipableBy, equipableBy),
      restrictions: parseKernelEnums(Enums.Restrictions, restrictions)
    }
    // if (object.name.includes('Tetra') || object.name.includes('Safety')) {
    //     console.log(object.name,elementDamageModifier, elements, object.elements )
    // }
    // console.log('acc',object.name, object.status, status, dec2bin(status) )
    objects.push(object)
  }
  return objects
}
const getMateriaSectionData = (
  sectionData,
  names,
  descriptions,
  magicNames,
  commandData
) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const objectSize = 20
  const objects = []

  for (let i = 0; i < r.length / objectSize; i++) {
    if (i < 2) {
      // console.log('offset start', r.offset)
    }
    // const apLimits = r.readUShortArray(4)
    const level2Ap = r.readUShort()
    const level3Ap = r.readUShort()
    const level4Ap = r.readUShort()
    const level5Ap = r.readUShort()
    const equipEffectBytes = r.readUByte()
    const statusEffect = r.readUInt() ^ 0b1111000000000000000000000000 // Should only read first 24 bits
    r.offset = r.offset - 1
    const element = r.readUByte()
    const materiaType = r.readUByte()
    const materiaAttributes = r.readUByteArray(6)

    const materiaData = parseMateriaData(
      materiaType,
      materiaAttributes,
      equipEffectBytes,
      magicNames,
      i,
      commandData
    )
    const apLevels = [0]
    if (level2Ap !== 0xffff) {
      apLevels.push(level2Ap * 100)
    }
    if (level3Ap !== 0xffff) {
      apLevels.push(level3Ap * 100)
    }
    if (level4Ap !== 0xffff) {
      apLevels.push(level4Ap * 100)
    }
    if (level5Ap !== 0xffff) {
      apLevels.push(level5Ap * 100)
    }
    const object = {
      index: i,
      name: names[i],
      description: descriptions[i],
      apLevels,
      status: parseKernelEnums(Enums.Statuses, statusEffect), // Not sure this is really giving what we want, eg Fire === 0
      element: parseKernelEnums(Enums.MateriaElements, element),

      type: materiaData.type,
      equipEffect: materiaData.equipEffect,
      attributes: materiaData.attributes
      // TODO - Lots more materiaData based attributes, see `kernel-enums.parseMateriaData(...)`
    }
    if (object.type.includes('Indepen')) {
      // console.log('mat', object.name, object.apLevels)//.name, dec2hex(materiaType), materiaAttributes.map(m => dec2hex(m)), materiaData.attributes)
    }
    // if (object.name === 'Time') {
    //     console.log('mat', object, object.name, object.status, statusEffect, dec2bin(statusEffect))
    // }
    objects.push(object)
    // if (i < 2) {
    //     console.log('----')
    //     console.log(object)
    // }
  }
  return objects
}
const getCommandSectionData = (sectionData, names, descriptions) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const objectSize = 8
  const objects = []

  for (let i = 0; i < r.length / objectSize; i++) {
    const initialCursorAction = r.readUByte()
    const targetFlags = r.readUByte()
    const unknown = r.readUShort()
    const cameraMovementIdSingleTargets = r.readUShort()
    const cameraMovementIdMultipleTargets = r.readUShort()
    const object = {
      index: i,
      name: names[i],
      description: descriptions[i],
      initialCursorAction: parseKernelEnums(
        Enums.InitialCursorAction,
        initialCursorAction
      ),
      targetFlags: parseKernelEnums(Enums.TargetData, targetFlags),
      cameraMovementIdSingleTargets: cameraMovementIdSingleTargets,
      cameraMovementIdMultipleTargets: cameraMovementIdMultipleTargets
    }
    objects.push(object)
  }
  return objects
}
const parseAttackData = r => {
  const attackPercent = r.readUByte()
  const impactEffectId = r.readUByte()
  const targetHurtAnimation = r.readUByte()
  const unknown = r.readUByte()
  const mpCost = r.readUShort()
  const impactSound = r.readUShort()
  const cameraMovementIdSingleTargets = r.readUShort()
  const cameraMovementIdMultipleTargets = r.readUShort()
  const targetFlags = r.readUByte()
  const attackEffectId = r.readUByte()
  const damageCalculation = r.readUByte()
  const attackPower = r.readUByte()
  const conditionSubMenu = r.readUByte()
  const statusEffectChance = r.readUByte()
  const additionalEffects = r.readUByte()
  const additionalEffectsModifier = r.readUByte()

  const status = r.readUInt()
  const element = r.readUShort()
  const specialAttack = r.readUShort()

  const object = {
    // index: i,
    // name: names[i],
    // description: descriptions[i],
    attackPercent,
    attackPower,
    attackEffectId,
    impactEffectId,
    impactSound,
    targetHurtAnimation,
    mp: mpCost,
    cameraMovementIdSingleTargets,
    cameraMovementIdMultipleTargets,
    targetFlags: parseKernelEnums(Enums.TargetData, targetFlags),
    damageCalculation: {
      type: (damageCalculation & 0xf0) >> 4, // upper nybble
      formula: damageCalculation & 0x0f // lower nybble
    },
    conditionSubMenu: parseKernelEnums(
      Enums.ConditionSubMenu,
      conditionSubMenu
    ),
    statusEffectChance: statusEffectChance & 0x3f,
    statusEffect: parseKernelEnums(Enums.StatusEffect, statusEffectChance),
    additionalEffects: {
      type: additionalEffects, // TODO,
      modifier: additionalEffectsModifier
    },
    status: parseKernelEnums(Enums.Statuses, status),
    elements: parseKernelEnums(Enums.Elements, element),
    specialAttack: parseKernelEnums(Enums.SpecialEffects, specialAttack)
  }
  return object
}
const getAttackSectionData = (sectionData, names, descriptions) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const objectSize = 28
  const objects = []

  for (let i = 0; i < r.length / objectSize; i++) {
    // if (object.name.includes('Beat')) {
    //     console.log('att', object)
    // }
    const object = parseAttackData(r)
    object.index = i
    object.name = names[i]
    object.description = descriptions[i]
    objects.push(object)
  }
  return objects
}
const getCharacterDataRecord = r => {
  const strengthLevelCurve = r.readUByte()
  const vitalityLevelCurve = r.readUByte()
  const magicLevelCurve = r.readUByte()
  const spiritLevelCurve = r.readUByte()
  const dexterityLevelCurve = r.readUByte()
  const luckLevelCurve = r.readUByte()
  const hpLevelCurve = r.readUByte()
  const mpLevelCurve = r.readUByte()
  const expLevelCurve = r.readUByte()
  const ffPadding1 = r.readUByte()
  const startingLevel = r.readUByte()
  const ffPadding2 = r.readUByte()
  const limitCommand11 = r.readUByte()
  const limitCommand12 = r.readUByte()
  const limitCommand13 = r.readUByte()
  const limitCommand21 = r.readUByte()
  const limitCommand22 = r.readUByte()
  const limitCommand23 = r.readUByte()
  const limitCommand31 = r.readUByte()
  const limitCommand32 = r.readUByte()
  const limitCommand33 = r.readUByte()
  const limitCommand41 = r.readUByte()
  const limitCommand42 = r.readUByte()
  const limitCommand43 = r.readUByte()

  const killsForLimit2 = r.readUShort()
  const killsForLimit3 = r.readUShort()
  const usesForLimit12 = r.readUShort()
  const usesForLimit13 = r.readUShort()
  const usesForLimit22 = r.readUShort()
  const usesForLimit23 = r.readUShort()
  const usesForLimit32 = r.readUShort()
  const usesForLimit33 = r.readUShort()

  const hpDivisorForLimit1 = r.readUInt()
  const hpDivisorForLimit2 = r.readUInt()
  const hpDivisorForLimit3 = r.readUInt()
  const hpDivisorForLimit4 = r.readUInt()

  const object = {
    strengthLevelCurve,
    vitalityLevelCurve,
    magicLevelCurve,
    spiritLevelCurve,
    dexterityLevelCurve,
    luckLevelCurve,
    hpLevelCurve,
    mpLevelCurve,
    expLevelCurve,
    startingLevel,
    limitCommand11,
    limitCommand12,
    limitCommand13,
    limitCommand21,
    limitCommand22,
    limitCommand23,
    limitCommand31,
    limitCommand32,
    limitCommand33,
    limitCommand41,
    limitCommand42,
    limitCommand43,

    killsForLimit2,
    killsForLimit3,
    usesForLimit12,
    usesForLimit13,
    usesForLimit22,
    usesForLimit23,
    usesForLimit32,
    usesForLimit33,

    hpDivisorForLimit1,
    hpDivisorForLimit2,
    hpDivisorForLimit3,
    hpDivisorForLimit4
  }
  // if (object.name.includes('Beat')) {
  //     console.log('att', object)
  // }

  return object
}
const getBattleAndGrowthSectionData = (sectionData, attackData) => {
  const r = new FF7BinaryDataReader(sectionData.buffer)
  const characterDataRecords = {
    Cloud: getCharacterDataRecord(r),
    Barret: getCharacterDataRecord(r),
    Tifa: getCharacterDataRecord(r),
    Aeris: getCharacterDataRecord(r),
    RedXIII: getCharacterDataRecord(r),
    Yuffie: getCharacterDataRecord(r),
    CaitSith: getCharacterDataRecord(r),
    Vincent: getCharacterDataRecord(r),
    Cid: getCharacterDataRecord(r)
  }
  const randomBonusToPrimaryStats = r.readUByteArray(12)
  const randomBonusToHP = r.readUByteArray(12)
  const randomBonusToMP = r.readUByteArray(12)
  const primaryStatCurve = r.readUByteArray(37 * 16)
  const hpStatCurve = r.readUByteArray(9 * 16)
  const mpStatCurve = r.readUByteArray(9 * 16)
  const expStatCurve = r.readUByteArray(9 * 16)
  const characterAI = r.readUByteArray(1508)
  const ffPadding = r.readUByteArray(540)
  const randomNumbers = r.readUByteArray(256)
  const sceneBinLookupTable = r.readUByteArray(64)
  const spellOrder = calculateSpellOrder(r.readUByteArray(56), attackData)

  // console.log('randomBonusToPrimaryStats', randomBonusToPrimaryStats)
  // console.log('randomBonusToHP', randomBonusToHP)
  // console.log('randomBonusToMP', randomBonusToMP)
  // console.log('primaryStatCurve', primaryStatCurve)
  // console.log('hpStatCurve', hpStatCurve)
  // console.log('mpStatCurve', mpStatCurve)
  // console.log('expStatCurve', expStatCurve)
  // console.log('characterAI',characterAI)
  // console.log('ffPadding', ffPadding, ffPadding[ffPadding.length-1])
  // console.log('randomNumbers', randomNumbers)
  // console.log('sceneBinLookupTable', sceneBinLookupTable)
  // console.log('spellOrder', spellOrder)
  return {
    characterDataRecords,
    randomBonusToPrimaryStats,
    randomBonusToHP,
    randomBonusToMP,
    primaryStatCurve,
    hpStatCurve,
    mpStatCurve,
    expStatCurve,
    characterAI,
    randomNumbers,
    sceneBinLookupTable,
    spellOrder
  }
}
const calculateSpellOrder = (spellOrderBytes, attackData) => {
  const spells = []
  for (let i = 0; i < spellOrderBytes.length; i++) {
    const spellOrderByte = spellOrderBytes[i]
    if (spellOrderByte !== 0xff) {
      const bin = dec2bin(spellOrderByte)
      const section = parseInt(bin.substr(0, 3), 2)
      const position = parseInt(bin.substr(3, 8), 2)
      // console.log('spell', attackData[i].name, section, position)
      spells.push({
        name: attackData[i].name,
        index: i,
        section,
        position
      })
    }
  }
  spells.sort(function (a, b) {
    return a.section - b.section || a.position - b.position
  })
  return spells
}
const filterUnneededBoostedStats = boostedStats => {
  return boostedStats.filter(s => s.stat !== 'None')
}

const extractWindowBinElements = async (
  fileId,
  outputKernelDirectory,
  metadataDirectory
) => {
  // console.log('extractWindowBinElements: START', fileId)

  const basePalette = 1
  const baseFile = path.join(
    outputKernelDirectory,
    `window.bin_${fileId}_${basePalette}.png`
  )
  const metadata = await sharp(baseFile).metadata()
  // console.log('metadata', metadata)
  const outputDirMetaDataWindow = path.join(metadataDirectory, 'window-assets')

  if (!fs.existsSync(outputDirMetaDataWindow)) {
    fs.ensureDirSync(outputDirMetaDataWindow)
  }
  let img = sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).png()

  const windowBinAssetMap = await fs.readJson(
    path.join(
      KUJATA_ROOT,
      'metadata-src',
      'kernel',
      `window.bin_${fileId}_asset-map.json`
    )
  )
  // console.log('windowBinAssetMap', windowBinAssetMap)

  // console.log('created', metadata)
  let overviewCompositionActions = []
  for (let assetType in windowBinAssetMap) {
    // I was going to simply loop, but need to deal with variable width fonts, plus having the metadata to get the correct widths
    // I'll leave this in, but it's not triggered by the data as I pregenerated it
    if (
      !Array.isArray(windowBinAssetMap[assetType]) &&
      windowBinAssetMap[assetType].type &&
      windowBinAssetMap[assetType].type === 'text'
    ) {
      const textConfig = windowBinAssetMap[assetType]
      const elements = []
      let i = 0

      for (let col = 0; col < textConfig.cols; col++) {
        for (let row = 0; row < textConfig.rows; row++) {
          const x = textConfig.x + row * textConfig.w
          const y = textConfig.y + col * textConfig.h
          // console.log({ "id": 0, "description": "battle menu text 192", "x": 128, "y": 248, "w": 8, "h": 8, "palette": 8 })
          i++
        }
      }
      windowBinAssetMap[assetType] = elements
    }
    if (assetType === 'battle-menu-text-large') {
      // console.log('battle-menu-text-large')
      const colorElements = []
      for (let i = 0; i < windowBinAssetMap[assetType].length; i++) {
        const element = windowBinAssetMap[assetType][i]
        // console.log('element for color', element)
        for (let j = 0; j < element.colors.length; j++) {
          const color = element.colors[j][0]
          const palette = element.colors[j][1]
          const colorElement = { ...element }
          delete colorElement.colors
          colorElement.palette = palette
          colorElement.description = `${colorElement.description} ${color}`
          colorElement.color = color
          colorElements.push(colorElement)
          // console.log('colorElements', colorElements)
        }
      }
      windowBinAssetMap[assetType] = colorElements
    }

    for (let i = 0; i < windowBinAssetMap[assetType].length; i++) {
      const element = windowBinAssetMap[assetType][i]
      // console.log('element', element)
      const elementFile = path.join(
        outputKernelDirectory,
        `window.bin_${fileId}_${element.palette}.png`
      )
      const elementFileExtract = sharp(elementFile).extract({
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h
      })
      const elementFileBuffer = await elementFileExtract.toBuffer()
      overviewCompositionActions.push({
        input: elementFileBuffer,
        left: element.x,
        top: element.y
      })

      const assetFolder = path.join(outputDirMetaDataWindow, assetType)
      if (!fs.existsSync(assetFolder)) {
        fs.ensureDirSync(assetFolder)
      }
      elementFileExtract.resize({
        width: element.w * 4,
        height: element.h * 4,
        kernel: sharp.kernel.nearest
      })
      await elementFileExtract.toFile(
        path.join(assetFolder, `${element.description}.png`)
      )

      if (overviewCompositionActions.length === 100) {
        // For some reason 150+ layers is causing issues <- nope, just nodemon
        img.composite(overviewCompositionActions)
        const compositeAppliedImg = await img.toBuffer()
        img = sharp(compositeAppliedImg)
        overviewCompositionActions = []
      }
    }
  }

  // Some layers missing black textures
  img.composite(overviewCompositionActions)

  await img.toFile(
    path.join(outputDirMetaDataWindow, `window.bin_${fileId}_overview.png`)
  )
  // console.log('extractWindowBinElements: END')
  return windowBinAssetMap
}
module.exports = {
  getTextSectionData,
  getItemSectionData,
  getWeaponSectionData,
  getArmorSectionData,
  getAccessorySectionData,
  getMateriaSectionData,
  getCommandSectionData,
  getAttackSectionData,
  getBattleAndGrowthSectionData,
  extractWindowBinElements,
  dec2bin,
  dec2hex,
  parseAttackData
}
