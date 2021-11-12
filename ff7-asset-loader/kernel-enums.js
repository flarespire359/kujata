// const { dec2hex } = require("./kernel-sections")

const dec2hex = (dec) => { // For debug only
    return `0x${parseInt(dec).toString(16)}`
}

const Enums = {
    SpecialEffects: {
        DamageMP: 0x1, // Damage is dealt to targets MP instead of HP.
        ForcePhysical: 0x4,// The attack is always considered to be physical for damage calculation.
        DrainPartialInflictedDamage: 0x10,// The user should recover some HP based on the damage dealt.
        DrainHPAndMP: 0x20, // The user should recover some HP and MP based on damage dealt.
        DiffuseAttack: 0x40, // The attack should diffuse into other targets after hitting. This is no longer used and is thought to only have been used with Blade Beam.
        IgnoreStatusDefense: 0x80, // Ignores the target's status defense when calculating infliction chance.
        MissWhenTargetNotDead: 0x100, // For targetting dead or undead characters only. (Phoenix Down/Life/etc)
        CanReflect: 0x200, // This ability can be reflected using the Reflect status
        BypassDefense: 0x400, // Piercing damage that ignores the normal damage calculation
        DontAutoRetargetWhenOriginalTargetKilled: 0x800,// The ability should not automatically move to the next viable target if the intended target is no longer viable.
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
        Cut: 0x0A,
        Hit: 0x0B,
        Punch: 0x0C,
        Shoot: 0x0D,
        Shout: 0x0E,
        Hidden: 0x0F,
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
        Imprisoned: 0x80000000,
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
        Stop: 0x0A,
        Frog: 0x0B,
        Small: 0x0C,
        SlowNumb: 0x0D,
        Petrify: 0x0E,
        Regen: 0x0F,
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
        Darkness: 0x1A,
        DualDrain: 0x1B,
        DeathForce: 0x1C,
        Resist: 0x1D,
        LuckyGirl: 0x1E,
        Imprisoned: 0x1F,
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
        WItemMenu: 0x0A,
        CoinMenu: 0x0B
    },
    TargetData: {
        EnableSelection: 0x01, // Cursor will move to the battle field and a target can be selected from valid targets as per additional constraints
        StartCursorOnEnemyRow: 0x02, // Cursor will start on the first enemy row.
        DefaultMultipleTargets: 0x04, // Cursor will select all targets in a given row.
        ToggleSingleMultiTarget: 0x08, // Caster can switch cursor between multiple targets or single targets. (Also indicates if damage will be split among targets)
        SingleRowOnly: 0x10, // Cursor will only target allies or enemies as defined in <see cref="StartCursorOnEnemyRow"/> and cannot be moved from the row.
        ShortRange: 0x20, // If the target or the caster is not in the front of their row, the target will take half damage. For every attack this is enabled, they are constrained by the Binary "Cover Flags"
        AllRows: 0x40, // Cursor will select all viable targets
        RandomTarget: 0x80// When multiple targets are selected, one will be selected at random to be the receiving target. Cursor will cycle among all viable targets.
    },
    ConditionSubMenu: {
        PartyHP: 0x00,
        PartyMP: 0x01,
        PartyStatus: 0x02,
        None: 0xFF
    },
    StatusEffect: {
        ToggleStatus: 0x40,
        RemoveStatus: 0x80
    },
    AccessoryEffect: {
        None: 0xFF,
        Haste: 0x0,
        Berserk: 0x1,
        CurseRing: 0x2,
        Reflect: 0x3,
        IncreasedStealingRate: 0x4,
        IncreasedManipulationRate: 0x5,
        Wall: 0x6
    },
    CharacterStat: {
        None: 0xFF,
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
        Normal: 0xFF
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
        'D.Blow': 0xA,
        'Manip.': 0xB,
        Mime: 0xC,
        'E.Skill': 0xD
    },
    SupportType: {
        Counter: 0x54, //25
        MagicCounter: 0x55,
        SneakAttack: 0x56,
        MPTurbo: 0x58,
        MPAbsorb: 0x59,
        HPAbsorb: 0x5A,
        AddedCut: 0x5C,
        StealAsWell: 0x5D,
        Elemental: 0x5E,
        AddedEffect: 0x5F,
        All: 0x51, //35
        FinalAttack: 0x57,
        QuadraMagic: 0x63
    },
    Character: {
        Flags: {
            Sadness: 0x10,
            Fury: 0x20
        },
        Order: {
            BackRow: 0xFE,
            Normal: 0xFF
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
            Sephiroth: 0x0A,
            Chocobo: 0x0B,
            None: 0xFE,
            None: 0xFF
        }
    }
}

const getMateriaType = (materiaTypeData) => {
    const lowerNybble = (materiaTypeData & 0x0F)
    let baseType
    switch (lowerNybble) {
        case 0x2: case 0x3: case 0x6: case 0x7: case 0x8:
            baseType = Enums.MateriaType.Command
            break
        case 0x5:
            baseType = Enums.MateriaType.Support
            break
        case 0x9: case 0xA:
            baseType = Enums.MateriaType.Magic
            break
        case 0xB: case 0xC:
            baseType = Enums.MateriaType.Summon
            break
        case 0x0: case 0x1: case 0x4: case 0xD: case 0xE: case 0xF: default:
            baseType = Enums.MateriaType.Independent
            break
    }
    return baseType
}
const getMateriaEquipEffects = (equipEffectBytes) => {
    // console.log('getMateriaEquipEffects', equipEffectBytes)
    switch (equipEffectBytes) {
        case 0x00:
            return []
        case 0x01:
            return [['Strength',-2],['Vitality',-1],['Magic',2],['Spirit',1],['HP',-5],['MP',5]]
        case 0x02:
            return [['Strength',-4],['Vitality',-2],['Magic',4],['Spirit',2],['HP',-10],['MP',10]]
        case 0x03:
            return [['Dexterity',2],['Luck',-2]]
        case 0x04:
            return [['Strength',-1],['Vitality',-1],['Magic',1],['Spirit',1]]
        case 0x05:
            return [['Strength',1],['Vitality',1],['Magic',-1],['Spirit',-1]]
        case 0x06:
            return [['Vitality',1]]
        case 0x07:
            return [['Luck',1]]
        case 0x08:
            return [['Luck',-1]]
        case 0x09:
            return [['Dexterity',-2]]
        case 0x0A:
            return [['Dexterity',2]]
        case 0x0B:
            return [['Strength',-1],['Magic',1],['HP',-2],['MP',2]]
        case 0x0C:
            return [['Magic',1],['HP',-2],['MP',2]]
        case 0x0D:
            return [['Magic',1],['Spirit',1],['HP',-5],['MP',5]]
        case 0x0E:
            return [['Magic',2],['Spirit',2],['HP',-10],['MP',10]]
        case 0x0F:
            return [['Magic',4],['Spirit',4],['HP',-10],['MP',15]]
        case 0x10:
            return [['Magic',8],['Spirit',8],['HP',-10],['MP',20]]
    }
    return []
}
const parseMateriaData = (materiaType, materiaAttributes, equipEffectBytes, magicNames, index, commandData) => {
    const type = getMateriaType(materiaType)
    const equipEffect = getMateriaEquipEffects(equipEffectBytes)
    let attributes = {}
    if (type === Enums.MateriaType.Magic) {
        attributes.magic = []
        for (let i = 0; i < materiaAttributes.length; i++) {
            const materiaAttribute = materiaAttributes[i]
            if (materiaAttribute < 255) {
                attributes.magic.push({
                    level:  i+1,
                    attackId: materiaAttribute,
                    name: magicNames[materiaAttribute]
                })
            }
        }
        if (materiaType === 0xA) { // Master Magic
            attributes.master = 'Magic'
            for (let i = 0; i <= 0x35; i++) { // Ignore last two empty magics, probably not a great idea, but I'll do it anyway, 0x37
                attributes.magic.push({
                    level:  1,
                    attackId: i,
                    name: magicNames[i]
                })
            }
        }
    }
    if (type === Enums.MateriaType.Summon) {
        attributes.summon = []
        if(materiaType === 0xC) { // Master Summon
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
        const materiaTypeLowerNybble = materiaType & 0x0F
        if (materiaType === 0x12) {
            attributes = { type: 'Replace', menu:  { id: 1, name: commandData[1].name}, with: filteredAttrs.map( id => {return { id: id, name: commandData[id].name}} ) }
        } else if (materiaTypeLowerNybble === 0x3) {
            if (attr1 === 0x15) {
                attributes = { type: 'Replace', menu:  { id: 2, name: commandData[2].name}, with: filteredAttrs.map( id => {return { id: id, name: commandData[id].name}} ) }
                // attributes = { type: 'Replace', menu: 'Magic', with: 'WMagic' }
            } else if (attr1 === 0x16) {
                attributes = { type: 'Replace', menu:  { id: 3, name: commandData[3].name}, with: filteredAttrs.map( id => {return { id: id, name: commandData[id].name}} ) }
            } else if (attr1 === 0x17) {
                attributes = { type: 'Replace', menu:  { id: 4, name: commandData[4].name}, with: filteredAttrs.map( id => {return { id: id, name: commandData[id].name}} ) }
            }
        } else if (materiaTypeLowerNybble === 0x6) {
            attributes = { type: 'Add', menu: filteredAttrs.map( id => {return { id: id, name: commandData[id].name}} ) }
        } else if (materiaTypeLowerNybble === 0x7) {
            attributes = { type: 'Add', menu: filteredAttrs.map( id => {return { id: id, name: commandData[id].name}}), skill: 'EnemySkill'}
        } else if (materiaTypeLowerNybble === 0x8) {// Master Command
            attributes = { type: 'AddAll', menu: [0x5,0x6,0x7,0x9,0xA,0xB,0xC].map( id => {return { id: id, name: commandData[id].name}} ) }
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
            if (attr1 === 0x0C) {
                attributes = { type: 'Underwater'}    
            } else if (attr1 === 0x62) {
                attributes = { type: 'HP<->MP'}    
            }
        } else if ((materiaType === 0x20 || materiaType === 0x40) && attr1 < 0xa) {
            attributes = { type: 'StatBoost', stat: parseKernelEnums(Enums.CharacterStat, attr1), attributes: materiaAttributes}
        } else if (materiaType === 0x20 && attr1 === 0x53) {
            attributes = { type: 'CounterAttack', attributes: materiaAttributes}
        } else if (materiaType === 0x20 && attr1 === 0xb) {
            attributes = { type: 'Cover', attributes: materiaAttributes}
        } else if (materiaType === 0x21) {
            attributes = { type: 'PreEmptive', attributes: materiaAttributes}
        } else if (materiaType === 0x30) {
            attributes = { type: 'LongRange'}
        } else if (materiaType === 0x34) {
            attributes = { type: 'MegaAll', attributes: materiaAttributes}
        } else if (materiaType === 0x40) {
            attributes = { type: 'StatBoost', stat: 'EXP', attributes: materiaAttributes.filter(a => a !== 255)}
        } else if (materiaType === 0x41 && attr1 === 0x0) {
            attributes = { type: 'StatBoost', stat: 'Gil', attributes: materiaAttributes.filter(a => a !== 255)}
        } else if (materiaType === 0x41 && attr1 === 0x1 && index === 7) {
            attributes = { type: 'StatBoost', stat: 'EncounterDown', attributes: materiaAttributes.filter(a => a !== 255)}
        } else if (materiaType === 0x41 && attr1 === 0x1 && index === 8) {
            attributes = { type: 'StatBoost', stat: 'EncounterUp', attributes: materiaAttributes.filter(a => a !== 255)}
        } else if (materiaType === 0x41 && attr1 === 0x2) {
            attributes = { type: 'StatBoost', stat: 'ChocoboUp', attributes: materiaAttributes.filter(a => a !== 255)}
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
        Enums.GrowthRate, Enums.MateriaSlot, Enums.CharacterStat, Enums.ConditionSubMenu,
        Enums.MateriaElements, Enums.DamageModifier, Enums.AccessoryEffect, Enums.CommandType, Enums.SupportType,
        Enums.Character.Flags, Enums.Character.Order, Enums.Character.PartyMember, Enums.InitialCursorAction]
    const inverseBitTypes = [Enums.SpecialEffects, Enums.Restrictions, Enums.StatusEffect]

    if (type === Enums.Elements && val === 0xFFFF) {
        return []
    } else if (type === Enums.Statuses && val === 0xFF || type === Enums.EquipmentStatus && val === 0xFF) {
        return []
    } else if (type === Enums.MateriaType) {
        return getMateriaType(val) // Specific behaviour required, but it is nice to abstract it behind parseKernelEnums
    } else if (singleResultTypes.includes(type)) { // Is this exhaustive? Restrictions, CharacterStat, MateriaType?
        let text = 'None'
        for (var prop in type) {
            if (val === type[prop]) { // Id matching
                text = prop
            }
        }
        return text
    } else {
        let enums = []
        for (var prop in type) {

            if (inverseBitTypes.includes(type)) {
                if ((val & type[prop]) !== type[prop]) { // Bitwise matching, but inverse, eg 0 is on
                    enums.push(prop)
                }
            } else {
                if ((val & type[prop]) === type[prop]) { // Bitwise matching
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