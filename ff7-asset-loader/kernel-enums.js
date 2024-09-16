const { dec2hex } = require('./string-util.js')

const Enums = {
  SpecialEffects: {
    DamageMP: 0x1, // Damage is dealt to targets MP instead of HP.
    ForcePhysical: 0x4, // The attack is always considered to be physical for damage calculation.
    DrainPartialInflictedDamage: 0x10, // The user should recover some HP based on the damage dealt.
    DrainHPAndMP: 0x20, // The user should recover some HP and MP based on damage dealt.
    DiffuseAttack: 0x40, // The attack should diffuse into other targets after hitting. This is no longer used and is thought to only have been used with Blade Beam.
    IgnoreStatusDefense: 0x80, // Ignores the target's status defense when calculating infliction chance.
    MissWhenTargetNotDead: 0x100, // For targetting dead or undead characters only. (Phoenix Down/Life/etc)
    CanReflect: 0x200, // This ability can be reflected using the Reflect status
    BypassDefense: 0x400, // Piercing damage that ignores the normal damage calculation
    DontAutoRetargetWhenOriginalTargetKilled: 0x800, // The ability should not automatically move to the next viable target if the intended target is no longer viable.
    AlwaysCritical: 0x2000 // This attack is always a critical hit. (Death Blow)
  },
  Elements: {
    Fire: 0x0001,
    Ice: 0x0002,
    Bolt: 0x0004,
    Earth: 0x0008,
    Poison: 0x0010,
    Gravity: 0x0020,
    Water: 0x0040,
    Wind: 0x0080,
    Holy: 0x0100,
    Restorative: 0x0200,
    Cut: 0x0400,
    Hit: 0x0800,
    Punch: 0x1000,
    Shoot: 0x2000,
    Shout: 0x4000,
    Hidden: 0x8000
  },
  MateriaElements: {
    Fire: 0x00,
    Ice: 0x01,
    Bolt: 0x02,
    Earth: 0x03,
    Poison: 0x04,
    Gravity: 0x05,
    Water: 0x06,
    Wind: 0x07,
    Holy: 0x08,
    Restorative: 0x09,
    Cut: 0x0a,
    Hit: 0x0b,
    Punch: 0x0c,
    Shoot: 0x0d,
    Shout: 0x0e,
    Hidden: 0x0f
  },
  Statuses: {
    Death: 0x00000001,
    NearDeath: 0x00000002,
    Sleep: 0x00000004,
    Poison: 0x00000008,
    Sadness: 0x00000010,
    Fury: 0x00000020,
    Confusion: 0x00000040,
    Silence: 0x00000080,
    Haste: 0x00000100,
    Slow: 0x00000200,
    Stop: 0x00000400,
    Frog: 0x00000800,
    Small: 0x00001000,
    SlowNumb: 0x00002000,
    Petrify: 0x00004000,
    Regen: 0x00008000,
    Barrier: 0x00010000,
    MBarrier: 0x00020000,
    Reflect: 0x00040000,
    Dual: 0x00080000,
    Shield: 0x00100000,
    DeathSentence: 0x00200000,
    Manipulate: 0x00400000,
    Berserk: 0x00800000,
    Peerless: 0x01000000,
    Paralysis: 0x02000000,
    Darkness: 0x04000000,
    DualDrain: 0x08000000,
    DeathForce: 0x10000000,
    Resist: 0x20000000,
    LuckyGirl: 0x40000000,
    Imprisoned: 0x80000000
  },

  EquipmentStatus: {
    Death: 0x00,
    NearDeath: 0x01,
    Sleep: 0x02,
    Poison: 0x03,
    Sadness: 0x04,
    Fury: 0x05,
    Confusion: 0x06,
    Silence: 0x07,
    Haste: 0x08,
    Slow: 0x09,
    Stop: 0x0a,
    Frog: 0x0b,
    Small: 0x0c,
    SlowNumb: 0x0d,
    Petrify: 0x0e,
    Regen: 0x0f,
    Barrier: 0x10,
    MBarrier: 0x11,
    Reflect: 0x12,
    Dual: 0x13,
    Shield: 0x14,
    DeathSentence: 0x15,
    Manipulate: 0x16,
    Berserk: 0x17,
    Peerless: 0x18,
    Paralysis: 0x19,
    Darkness: 0x1a,
    DualDrain: 0x1b,
    DeathForce: 0x1c,
    Resist: 0x1d,
    LuckyGirl: 0x1e,
    Imprisoned: 0x1f
  },
  InitialCursorAction: {
    PerformCommandUsingTargetData: 0x00,
    MagicMenu: 0x01,
    SummonMenu: 0x02,
    ItemMenu: 0x03,
    ESkillMenu: 0x04,
    ThrowMenu: 0x05,
    LimitMenu: 0x06,
    EnableTargetSelectionUsingCursor: 0x07,
    WMagicMenu: 0x08,
    WSummonMenu: 0x09,
    WItemMenu: 0x0a,
    CoinMenu: 0x0b
  },
  TargetData: {
    EnableSelection: 0x01, // Cursor will move to the battle field and a target can be selected from valid targets as per additional constraints
    StartCursorOnEnemyRow: 0x02, // Cursor will start on the first enemy row.
    DefaultMultipleTargets: 0x04, // Cursor will select all targets in a given row.
    ToggleSingleMultiTarget: 0x08, // Caster can switch cursor between multiple targets or single targets. (Also indicates if damage will be split among targets)
    SingleRowOnly: 0x10, // Cursor will only target allies or enemies as defined in <see cref="StartCursorOnEnemyRow"/> and cannot be moved from the row.
    ShortRange: 0x20, // If the target or the caster is not in the front of their row, the target will take half damage. For every attack this is enabled, they are constrained by the Binary "Cover Flags"
    AllRows: 0x40, // Cursor will select all viable targets
    RandomTarget: 0x80 // When multiple targets are selected, one will be selected at random to be the receiving target. Cursor will cycle among all viable targets.
  },
  ConditionSubMenu: {
    PartyHP: 0x00,
    PartyMP: 0x01,
    PartyStatus: 0x02,
    None: 0xff
  },
  StatusEffect: {
    ToggleStatus: 0x40,
    RemoveStatus: 0x80
  },
  AccessoryEffect: {
    None: 0xff,
    Haste: 0x0,
    Berserk: 0x1,
    CurseRing: 0x2,
    Reflect: 0x3,
    IncreasedStealingRate: 0x4,
    IncreasedManipulationRate: 0x5,
    Wall: 0x6
  },
  CharacterStat: {
    None: 0xff,
    Strength: 0,
    Vitality: 1,
    Magic: 2,
    Spirit: 3,
    Dexterity: 4,
    Luck: 5,
    HP: 8,
    MP: 9
  },
  DamageModifier: {
    Absorb: 0x0,
    Nullify: 0x1,
    Halve: 0x2,
    Normal: 0xff
  },
  EquipableBy: {
    Cloud: 0x0001,
    Barret: 0x0002,
    Tifa: 0x0004,
    Aeris: 0x0008,
    RedXIII: 0x0010,
    Yuffie: 0x0020,
    CaitSith: 0x0040,
    Vincent: 0x0080,
    Cid: 0x0100,
    YoungCloud: 0x0200,
    Sephiroth: 0x0400
  },
  GrowthRate: {
    None: 0,
    Normal: 1,
    Double: 2,
    Triple: 3
  },
  MateriaSlot: {
    None: 0, // No materia slot.
    EmptyUnlinkedSlot: 1, // Unlinked slot without materia growth.
    EmptyLeftLinkedSlot: 2, // Left side of a linked slot without materia growth.
    EmptyRightLinkedSlot: 3, // Right side of a linked slot without materia growth.
    NormalUnlinkedSlot: 5, // Unlinked slot with materia growth.
    NormalLeftLinkedSlot: 6, // Left side of a linked slot with materia growth.
    NormalRightLinkedSlot: 7 // Right side of a linked slot with materia growth.
  },

  Restrictions: {
    CanBeSold: 1,
    CanBeUsedInBattle: 2,
    CanBeUsedInMenu: 4,
    CanBeThrown: 8
  },
  MateriaType: {
    Independent: 'Independent',
    Support: 'Support',
    Magic: 'Magic',
    Summon: 'Summon',
    Command: 'Command'
  },
  CommandType: {
    Steal: 0x5,
    Sense: 0x6,
    Coin: 0x7,
    Throw: 0x8,
    Morph: 0x9,
    'D.Blow': 0xa,
    'Manip.': 0xb,
    Mime: 0xc,
    'E.Skill': 0xd
  },
  SupportType: {
    Counter: 0x54, // 25
    MagicCounter: 0x55,
    SneakAttack: 0x56,
    MPTurbo: 0x58,
    MPAbsorb: 0x59,
    HPAbsorb: 0x5a,
    AddedCut: 0x5c,
    StealAsWell: 0x5d,
    Elemental: 0x5e,
    AddedEffect: 0x5f,
    All: 0x51, // 35
    FinalAttack: 0x57,
    QuadraMagic: 0x63
  },
  Character: {
    Flags: {
      Sadness: 0x10,
      Fury: 0x20
    },
    Order: {
      BackRow: 0xfe,
      Normal: 0xff
    },
    LearnedLimits: {
      Limit_1_1: 0x0001,
      Limit_1_2: 0x0002,
      Limit_2_1: 0x0008,
      Limit_2_2: 0x0010,
      Limit_3_1: 0x0040,
      Limit_3_2: 0x0080,
      Limit_4: 0x0200
    },
    PartyMember: {
      Cloud: 0x00,
      Barret: 0x01,
      Tifa: 0x02,
      Aeris: 0x03,
      RedXIII: 0x04,
      Yuffie: 0x05,
      CaitSith: 0x06,
      Vincent: 0x07,
      Cid: 0x08,
      YoungCloud: 0x09,
      Sephiroth: 0x0a,
      Chocobo: 0x0b,
      None: 0xfe,
      None: 0xff
    }
  },
  Battle: {
    Location: {
      Blank: 0x0000,
      BizarroBattleCenter: 0x0001,
      Grassland: 0x0002,
      MtNibel: 0x0003,
      Forest: 0x0004,
      Beach: 0x0005,
      Desert: 0x0006,
      Snow: 0x0007,
      Swamp: 0x0008,
      Sector1TrainStation: 0x0009,
      Reactor1: 0x000a,
      Reactor1Core: 0x000b,
      Reactor1Entrance: 0x000c,
      Sector4Subway: 0x000d,
      NibelCavesorAForestCaves: 0x000e,
      ShinraHQ: 0x000f,
      MidgarRaidSubway: 0x0010,
      HojosLab: 0x0011,
      ShinraElevators: 0x0012,
      ShinraRoof: 0x0013,
      MidgarHighway: 0x0014,
      WutaiPagoda: 0x0015,
      Church: 0x0016,
      CoralValley: 0x0017,
      MidgarSlums: 0x0018,
      Sector4CorridorsorJunonPath: 0x0019,
      Sector4GantriesorMidgarUnderground: 0x001a,
      Sector7SupportPillarStairway: 0x001b,
      Sector7SupportPillarTop: 0x001c,
      Sector8: 0x001d,
      Sewers: 0x001e,
      MythrilMines: 0x001f,
      NorthernCraterFloatingPlatforms: 0x0020,
      CorelMountainPath: 0x0021,
      JunonBeach: 0x0022,
      JunonCargoShip: 0x0023,
      CorelPrison: 0x0024,
      BattleSquare: 0x0025,
      DaChaoRappsBattle: 0x0026,
      CidsBackyard: 0x0027,
      FinalDescenttoSephiroth: 0x0028,
      Reactor5Entrance: 0x0029,
      TempleOfTheAncientsEscherRoom: 0x002a,
      ShinraMansion: 0x002b,
      JunonAirshipDock: 0x002c,
      WhirlwindMaze: 0x002d,
      JunonUnderwaterReactor: 0x002e,
      GongagaReactor: 0x002f,
      Gelnika: 0x0030,
      TrainGraveyard: 0x0031,
      GreatGlacierIceCavesOrGaeaCliffsInside: 0x0032,
      SisterRay: 0x0033,
      SisterRayBase: 0x0034,
      ForgottenCityAltar: 0x0035,
      NorthernCraterInitialDescent: 0x0036,
      NorthernCraterHatchery: 0x0037,
      NorthernCraterWaterArea: 0x0038,
      SaferBattle: 0x0039,
      KalmFlashbackDragonBattle: 0x003a,
      JunonUnderwaterPipe: 0x003b,
      Blank2: 0x003c,
      CorelRailwayCanyon: 0x003d,
      WhirlwindMazeCrater: 0x003e,
      CorelRailwayRollercoaster: 0x003f,
      WoodenBridge: 0x0040,
      DaChao: 0x0041,
      FortCondor: 0x0042,
      DirtWasteland: 0x0043,
      BizarroBattleRightSide: 0x0044,
      BizarroBattleLeftSide: 0x0045,
      JenovaSynthesisBattle: 0x0046,
      CorelTrainBattle: 0x0047,
      CosmoCanyon: 0x0048,
      CavernsOfTheGi: 0x0049,
      NibelheimMansionBasement: 0x004a,
      TempleOfTheAncientsDemonsGate: 0x004b,
      TempleOfTheAncientsMuralRoom: 0x004c,
      TempleOfTheAncientsClockPassage: 0x004d,
      FinalBattleSephiroth: 0x004e,
      Jungle: 0x004f,
      UltimateWeaponHighwind: 0x0050,
      CorelReactor: 0x0051,
      Unused: 0x0052,
      DonCorneosMansion: 0x0053,
      EmeraldWeaponBattle: 0x0054,
      Reactor5: 0x0055,
      ShinraHQEscape: 0x0056,
      UltimateWeaponGongagaReactor: 0x0057,
      CorelPrisonDyneBattle: 0x0058,
      UltimateWeaponForest: 0x0059
    },
    Layout: {
      Normal: 0x00,
      Preemptive: 0x01,
      BackAttack: 0x02,
      SideAttack1: 0x03,
      PincerAttack: 0x04,
      SideAttack2: 0x05,
      SideAttack3: 0x06,
      SideAttack4: 0x07,
      NormalLockFrontRow: 0x08
    },
    InitialConditionFlags: {
      Visible: 0x0001,
      SideAttackInitialDirection: 0x0002,
      Unknown: 0x0004,
      Targetable: 0x0010,
      MainScriptActive: 0x0008
    },
    BattleFlags: {
      Unknown: 0b10, // This is popular
      CantEscape: 0b100,
      NoVictoryPoses: 0b1000,
      NoPremptive: 0b10000
    },
    ElementRates: {
      Death: 0x00,
      DoubleDamage: 0x02,
      HalfDamange: 0x04,
      NullifyDamage: 0x05,
      Absorb: 0x06,
      FullCure: 0x0,
      Nothing: 0xff
    }
  },
  Slots: {
    Tifa: {
      Miss: 0x00,
      Hit: 0x01,
      Yeah: 0x02
    },
    CaitSith: {
      CaitSith: 0x00,
      Bar: 0x01,
      Crown: 0x02,
      Heart: 0x03,
      Star: 0x04,
      Moogle: 0x05
    }
  }
}

const getMateriaType = materiaTypeData => {
  const lowerNybble = materiaTypeData & 0x0f
  let baseType
  switch (lowerNybble) {
    case 0x2:
    case 0x3:
    case 0x6:
    case 0x7:
    case 0x8:
      baseType = Enums.MateriaType.Command
      break
    case 0x5:
      baseType = Enums.MateriaType.Support
      break
    case 0x9:
    case 0xa:
      baseType = Enums.MateriaType.Magic
      break
    case 0xb:
    case 0xc:
      baseType = Enums.MateriaType.Summon
      break
    case 0x0:
    case 0x1:
    case 0x4:
    case 0xd:
    case 0xe:
    case 0xf:
    default:
      baseType = Enums.MateriaType.Independent
      break
  }
  return baseType
}
const getMateriaEquipEffects = equipEffectBytes => {
  // console.log('getMateriaEquipEffects', equipEffectBytes)
  switch (equipEffectBytes) {
    case 0x00:
      return []
    case 0x01:
      return [
        ['Strength', -2],
        ['Vitality', -1],
        ['Magic', 2],
        ['Spirit', 1],
        ['HP', -5],
        ['MP', 5]
      ]
    case 0x02:
      return [
        ['Strength', -4],
        ['Vitality', -2],
        ['Magic', 4],
        ['Spirit', 2],
        ['HP', -10],
        ['MP', 10]
      ]
    case 0x03:
      return [
        ['Dexterity', 2],
        ['Luck', -2]
      ]
    case 0x04:
      return [
        ['Strength', -1],
        ['Vitality', -1],
        ['Magic', 1],
        ['Spirit', 1]
      ]
    case 0x05:
      return [
        ['Strength', 1],
        ['Vitality', 1],
        ['Magic', -1],
        ['Spirit', -1]
      ]
    case 0x06:
      return [['Vitality', 1]]
    case 0x07:
      return [['Luck', 1]]
    case 0x08:
      return [['Luck', -1]]
    case 0x09:
      return [['Dexterity', -2]]
    case 0x0a:
      return [['Dexterity', 2]]
    case 0x0b:
      return [
        ['Strength', -1],
        ['Magic', 1],
        ['HP', -2],
        ['MP', 2]
      ]
    case 0x0c:
      return [
        ['Magic', 1],
        ['HP', -2],
        ['MP', 2]
      ]
    case 0x0d:
      return [
        ['Magic', 1],
        ['Spirit', 1],
        ['HP', -5],
        ['MP', 5]
      ]
    case 0x0e:
      return [
        ['Magic', 2],
        ['Spirit', 2],
        ['HP', -10],
        ['MP', 10]
      ]
    case 0x0f:
      return [
        ['Magic', 4],
        ['Spirit', 4],
        ['HP', -10],
        ['MP', 15]
      ]
    case 0x10:
      return [
        ['Magic', 8],
        ['Spirit', 8],
        ['HP', -10],
        ['MP', 20]
      ]
  }
  return []
}
const parseMateriaData = (
  materiaType,
  materiaAttributes,
  equipEffectBytes,
  magicNames,
  index,
  commandData
) => {
  const type = getMateriaType(materiaType)
  const equipEffect = getMateriaEquipEffects(equipEffectBytes)
  let attributes = {}
  if (type === Enums.MateriaType.Magic) {
    attributes.magic = []
    for (let i = 0; i < materiaAttributes.length; i++) {
      const materiaAttribute = materiaAttributes[i]
      if (materiaAttribute < 255) {
        attributes.magic.push({
          level: i + 1,
          attackId: materiaAttribute,
          name: magicNames[materiaAttribute]
        })
      }
    }
    if (materiaType === 0xa) {
      // Master Magic
      attributes.master = 'Magic'
      for (let i = 0; i <= 0x35; i++) {
        // Ignore last two empty magics, probably not a great idea, but I'll do it anyway, 0x37
        attributes.magic.push({
          level: 1,
          attackId: i,
          name: magicNames[i]
        })
      }
    }
  }
  if (type === Enums.MateriaType.Summon) {
    attributes.summon = []
    if (materiaType === 0xc) {
      // Master Summon
      attributes.master = 'Summon'
      for (let i = 0x38; i <= 0x47; i++) {
        attributes.summon.push({
          attackId: i,
          name: magicNames[i]
        })
      }
    } else {
      attributes.summon.push({
        attackId: materiaAttributes[0],
        name: magicNames[materiaAttributes[0]]
      })
    }
  }
  if (type === Enums.MateriaType.Command) {
    const attr1 = materiaAttributes[0]
    const filteredAttrs = materiaAttributes.filter(a => a !== 255)
    const materiaTypeLowerNybble = materiaType & 0x0f
    if (materiaType === 0x12) {
      attributes = {
        type: 'Replace',
        menu: { id: 1, name: commandData[1].name },
        with: filteredAttrs.map(id => {
          return { id, name: commandData[id].name }
        })
      }
    } else if (materiaTypeLowerNybble === 0x3) {
      if (attr1 === 0x15) {
        attributes = {
          type: 'Replace',
          menu: { id: 2, name: commandData[2].name },
          with: filteredAttrs.map(id => {
            return { id, name: commandData[id].name }
          })
        }
        // attributes = { type: 'Replace', menu: 'Magic', with: 'WMagic' }
      } else if (attr1 === 0x16) {
        attributes = {
          type: 'Replace',
          menu: { id: 3, name: commandData[3].name },
          with: filteredAttrs.map(id => {
            return { id, name: commandData[id].name }
          })
        }
      } else if (attr1 === 0x17) {
        attributes = {
          type: 'Replace',
          menu: { id: 4, name: commandData[4].name },
          with: filteredAttrs.map(id => {
            return { id, name: commandData[id].name }
          })
        }
      }
    } else if (materiaTypeLowerNybble === 0x6) {
      attributes = {
        type: 'Add',
        menu: filteredAttrs.map(id => {
          return { id, name: commandData[id].name }
        })
      }
    } else if (materiaTypeLowerNybble === 0x7) {
      attributes = {
        type: 'Add',
        menu: filteredAttrs.map(id => {
          return { id, name: commandData[id].name }
        }),
        skill: 'EnemySkill'
      }
    } else if (materiaTypeLowerNybble === 0x8) {
      // Master Command
      attributes = {
        type: 'AddAll',
        menu: [0x5, 0x6, 0x7, 0x9, 0xa, 0xb, 0xc].map(id => {
          return { id, name: commandData[id].name }
        })
      }
      attributes.master = 'Command'
    }
    // console.log('  cmd', materiaType, dec2hex(materiaType), attr1, dec2hex(attr1), attributes, filteredAttrs)
  }

  if (type === Enums.MateriaType.Support) {
    const attr1 = materiaAttributes[0]
    const supportType = parseKernelEnums(Enums.SupportType, attr1)
    // console.log('  sup', materiaType, dec2hex(materiaType), attr1, dec2hex(attr1), materiaAttributes, supportType)
    materiaAttributes.shift()
    attributes = { type: supportType, attributes: materiaAttributes }
  }
  if (type === Enums.MateriaType.Independent) {
    const attr1 = materiaAttributes[0]
    materiaAttributes.shift()
    if (materiaType === 0x00) {
      if (attr1 === 0x0c) {
        attributes = { type: 'Underwater' }
      } else if (attr1 === 0x62) {
        attributes = { type: 'HP<->MP' }
      }
    } else if ((materiaType === 0x20 || materiaType === 0x40) && attr1 < 0xa) {
      attributes = {
        type: 'StatBoost',
        stat: parseKernelEnums(Enums.CharacterStat, attr1),
        attributes: materiaAttributes
      }
    } else if (materiaType === 0x20 && attr1 === 0x53) {
      attributes = { type: 'CounterAttack', attributes: materiaAttributes }
    } else if (materiaType === 0x20 && attr1 === 0xb) {
      attributes = { type: 'Cover', attributes: materiaAttributes }
    } else if (materiaType === 0x21) {
      attributes = { type: 'PreEmptive', attributes: materiaAttributes }
    } else if (materiaType === 0x30) {
      attributes = { type: 'LongRange' }
    } else if (materiaType === 0x34) {
      attributes = { type: 'MegaAll', attributes: materiaAttributes }
    } else if (materiaType === 0x40) {
      attributes = {
        type: 'StatBoost',
        stat: 'EXP',
        attributes: materiaAttributes.filter(a => a !== 255)
      }
    } else if (materiaType === 0x41 && attr1 === 0x0) {
      attributes = {
        type: 'StatBoost',
        stat: 'Gil',
        attributes: materiaAttributes.filter(a => a !== 255)
      }
    } else if (materiaType === 0x41 && attr1 === 0x1 && index === 7) {
      attributes = {
        type: 'StatBoost',
        stat: 'EncounterDown',
        attributes: materiaAttributes.filter(a => a !== 255)
      }
    } else if (materiaType === 0x41 && attr1 === 0x1 && index === 8) {
      attributes = {
        type: 'StatBoost',
        stat: 'EncounterUp',
        attributes: materiaAttributes.filter(a => a !== 255)
      }
    } else if (materiaType === 0x41 && attr1 === 0x2) {
      attributes = {
        type: 'StatBoost',
        stat: 'ChocoboUp',
        attributes: materiaAttributes.filter(a => a !== 255)
      }
    }
    // console.log('  ind', index, materiaType, dec2hex(materiaType), attr1, dec2hex(attr1), materiaAttributes)
  }
  // http://wiki.ffrtt.ru/index.php?title=FF7/Materia_Types

  /*
    Magic - attributes are refs to the spell IDs (exc master magic)
    Summon - attributes are refs to summon how many times they can be used in battle (exc master summon)
    Support - Flags to set types basically
    Command - Flags to set menus available and replacements
    Independent - A mixture:

    mat Underwater 0x0 [ '0xc', '0xff', '0xff', '0xff', '0xff', '0xff' ]
    mat HP<->MP 0x0 [ '0x62', '0xff', '0xff', '0xff', '0xff', '0xff' ]

    mat MP Plus 0x20 [ '0x9', '0xa', '0x14', '0x1e', '0x28', '0x32' ]
    mat HP Plus 0x20 [ '0x8', '0xa', '0x14', '0x1e', '0x28', '0x32' ]
    mat Speed Plus 0x20 [ '0x4', '0xa', '0x14', '0x1e', '0x28', '0x32' ]
    mat Magic Plus 0x20 [ '0x2', '0xa', '0x14', '0x1e', '0x28', '0x32' ]
    mat Luck Plus 0x20 [ '0x5', '0xa', '0x14', '0x1e', '0x28', '0x32' ]

    mat Counter Attack 0x20 [ '0x53', '0x1e', '0x28', '0x3c', '0x50', '0x64' ]
    mat Cover 0x20 [ '0xb', '0x14', '0x28', '0x3c', '0x50', '0x64' ]

    mat Pre-Emptive 0x21 [ '0x3', '0x10', '0x16', '0x1c', '0x22', '0x30' ]

    mat Long Range 0x30 [ '0x50', '0xff', '0xff', '0xff', '0xff', '0xff' ]

    mat Mega All 0x34 [ '0x51', '0x1', '0x2', '0x3', '0x4', '0x5' ]

    mat EXP Plus 0x40 [ '0xa', '0x18', '0x20', '0xff', '0xff', '0xff' ]

    mat Gil Plus 0x41 [ '0x0', '0x18', '0x20', '0xff', '0xff', '0xff' ]
    mat Enemy Away 0x41 [ '0x1', '0x7', '0xe', '0xff', '0xff', '0xff' ]
    mat Enemy Lure 0x41 [ '0x1', '0x7', '0xe', '0xff', '0xff', '0xff' ]
    mat Chocobo Lure 0x41 [ '0x2', '0x8', '0xc', '0x10', '0xff', '0xff' ]

    */
  return {
    type,
    equipEffect,
    attributes
  }
}
const parseKernelEnums = (type, val) => {
  const singleResultTypes = [
    Enums.GrowthRate,
    Enums.MateriaSlot,
    Enums.CharacterStat,
    Enums.ConditionSubMenu,
    Enums.MateriaElements,
    Enums.DamageModifier,
    Enums.AccessoryEffect,
    Enums.CommandType,
    Enums.SupportType,
    Enums.Character.Flags,
    Enums.Character.Order,
    Enums.Character.PartyMember,
    Enums.InitialCursorAction,
    Enums.Battle.Location,
    Enums.Battle.Layout,
    Enums.Slots.Tifa,
    Enums.Slots.CaitSith
  ]
  const inverseBitTypes = [
    Enums.SpecialEffects,
    Enums.Restrictions,
    Enums.StatusEffect,
    Enums.Battle.BattleFlags
  ]

  if (type === Enums.Elements && val === 0xffff) {
    return []
  } else if (
    (type === Enums.Statuses && val === 0xff) ||
    (type === Enums.EquipmentStatus && val === 0xff)
  ) {
    return []
  } else if (type === Enums.TargetData && val === 0xff) {
    return []
  } else if (type === Enums.MateriaType) {
    return getMateriaType(val) // Specific behaviour required, but it is nice to abstract it behind parseKernelEnums
  } else if (singleResultTypes.includes(type)) {
    // Is this exhaustive? Restrictions, CharacterStat, MateriaType?
    let text = 'None'
    for (const prop in type) {
      if (val === type[prop]) {
        // Id matching
        text = prop
      }
    }
    return text
  } else {
    const enums = []
    for (const prop in type) {
      if (inverseBitTypes.includes(type)) {
        if ((val & type[prop]) !== type[prop]) {
          // Bitwise matching, but inverse, eg 0 is on
          enums.push(prop)
        }
      } else {
        if ((val & type[prop]) === type[prop]) {
          // Bitwise matching
          enums.push(prop)
        }
      }
    }
    return enums
  }
}

module.exports = {
  Enums,
  parseKernelEnums,
  parseMateriaData
}
