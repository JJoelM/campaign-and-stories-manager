import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  NodeLockReason,
  VaultContextCompiler,
} from '../compiler/vault-context-compiler.js';
import { SecretRedactor } from '../security/security-guard.js';
import {
  CharacterContext,
  SceneState,
  ThyreniaCalendarDate,
  ThyreniaCalendarDateSchema,
  ThyreniaCharacterSheet,
  ThyreniaCharacterSheetSchema,
  ThyreniaSkillEntry,
  ThyreniaSkillKey,
} from './schemas.js';

export interface CalendarCoords {
  yearDgd: number;
  monthIndex: number;
  dayOfMonth: number;
}

export interface CampaignDefinition {
  id: string;
  name: string;
  vaultFolder: string;
  defaultCharacterId: string;
  initialDate: CalendarCoords;
  initialScene: SceneState;
}

export const THYRENIA_MONTHS: ReadonlyArray<{
  name: string;
  season: ThyreniaCalendarDate['season'];
  deity: string;
  influence: string;
}> = [
  { name: 'Nyxaris', season: 'Invierno', deity: 'Nyxara', influence: 'Noche, muerte y misterio' },
  { name: 'Kronalis', season: 'Invierno', deity: 'Kronos', influence: 'Tiempo, memoria y presagios' },
  { name: 'Verdalis', season: 'Invierno', deity: 'Gaia', influence: 'Resistencia y preparación de la tierra' },
  { name: 'Selenis', season: 'Primavera', deity: 'Selene', influence: 'Renacimiento, vida y esperanza' },
  { name: 'Thalasis', season: 'Primavera', deity: 'Thalassia', influence: 'Lluvias, libertad e intuición' },
  { name: 'Aetheris', season: 'Primavera', deity: 'Aetherion', influence: 'Espiritualidad e iluminación' },
  { name: 'Ignaris', season: 'Verano', deity: 'Ignar', influence: 'Pasión, fuego y guerra' },
  { name: 'Tiamaris', season: 'Verano', deity: 'Tiamat', influence: 'Dragones, codicia y poder' },
  { name: 'Dagorath', season: 'Verano', deity: 'Dagon', influence: 'Tiranía y orden absoluto' },
  { name: 'Cineris', season: 'Otoño', deity: 'Vulcanis', influence: 'Destrucción y renacimiento' },
  { name: 'Umbrelia', season: 'Otoño', deity: 'Umbra', influence: 'Conspiraciones y cambios políticos' },
  { name: 'Yogthos', season: 'Otoño', deity: 'Yog-Sothoth', influence: 'Caos y frontera del eclipse' },
];

export const THYRENIA_WEEKDAYS: ReadonlyArray<{
  name: string;
  influence: string;
}> = [
  { name: 'Solaris', influence: 'Sol y verdad (Aetherion y Selene)' },
  { name: 'Lunaris', influence: 'Luna y magia (Selene y Nyxara)' },
  { name: 'Tyrnas', influence: 'Batalla y justicia (Ignar y Dagon)' },
  { name: 'Velaris', influence: 'Secretos y sombra (Nyxara y Umbra)' },
  { name: 'Thyrenas', influence: 'Magia y conocimiento (Kronos y Aetherion)' },
  { name: 'Terranis', influence: 'Tierra y cosecha (Gaia)' },
  { name: 'Mortis', influence: 'Muerte y destino (Nyxara y Yog-Sothoth)' },
];

export function formatThyreniaDate(coords: CalendarCoords): ThyreniaCalendarDate {
  const safeMonth = ((coords.monthIndex % 12) + 12) % 12;
  const safeDay = Math.max(1, Math.min(30, Math.trunc(coords.dayOfMonth)));
  const dayOfYear = safeMonth * 30 + (safeDay - 1);
  // Alineado con Calendario.md: "Velaris 18, Kronalis, 524 DGD"
  const weekdayIdx = (dayOfYear + 5) % 7;
  const monthInfo = THYRENIA_MONTHS[safeMonth];
  const weekdayInfo = THYRENIA_WEEKDAYS[weekdayIdx];

  return ThyreniaCalendarDateSchema.parse({
    dayOfWeek: weekdayInfo.name,
    dayOfMonth: safeDay,
    monthIndex: safeMonth,
    monthName: monthInfo.name,
    season: monthInfo.season,
    yearDgd: coords.yearDgd,
    divineInfluence: `${weekdayInfo.influence} · Mes de ${monthInfo.deity}`,
    formatted: `${weekdayInfo.name} ${safeDay} de ${monthInfo.name}, ${coords.yearDgd} DGD (${monthInfo.season})`,
  });
}

export function advanceThyreniaDate(
  coords: CalendarCoords,
  daysDelta: number,
): CalendarCoords {
  const totalDays =
    coords.yearDgd * 360 + coords.monthIndex * 30 + (coords.dayOfMonth - 1) + daysDelta;
  const clamped = Math.max(0, totalDays);
  const yearDgd = Math.floor(clamped / 360);
  const rem = clamped % 360;
  const monthIndex = Math.floor(rem / 30);
  const dayOfMonth = (rem % 30) + 1;
  return { yearDgd, monthIndex, dayOfMonth };
}

export const THYRENIA_CAMPAIGNS: CampaignDefinition[] = [
  {
    id: 'luz-de-medialuna',
    name: 'Campaña Principal: Luz de Medialuna',
    vaultFolder: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)',
    defaultCharacterId: 'pj-olivia',
    initialDate: { yearDgd: 524, monthIndex: 2, dayOfMonth: 1 },
    initialScene: {
      id: 'escena-luz-medialuna-01',
      locationNodeId: 'Maná',
      description:
        'Tras los sucesos rumbo a Neverwinter y la amenaza del Culto del Dragón, el grupo descansa junto a una antigua Vena de Maná en una posada iluminada por linternas arcanas.',
      environmentFlags: { flujo_mana_activo: true },
      activeThreats: [],
      turnNumber: 1,
    },
  },
  {
    id: 'escuadron-umbra',
    name: 'Campaña Mercenarios: Escuadrón UMBRA',
    vaultFolder: '01 - Campanas/02 - Campana Mercenarios (Escuadron UMBRA)',
    defaultCharacterId: 'pj-gerard',
    initialDate: { yearDgd: 524, monthIndex: 1, dayOfMonth: 18 },
    initialScene: {
      id: 'escena-umbra-01',
      locationNodeId: 'Thyrenia',
      description:
        'El Escuadrón UMBRA revisa contratos confidenciales bajo la vigilancia de Gerard D\'Arc mientras los rumores de conspiración recorren la frontera.',
      environmentFlags: { vigilancia_umbra: true },
      activeThreats: [],
      turnNumber: 1,
    },
  },
  {
    id: 'perseguidores-amanecer',
    name: 'Campaña Marisal: Perseguidores del Amanecer',
    vaultFolder: '01 - Campanas/03 - Campana Marisal (Perseguidores del Amanecer)',
    defaultCharacterId: 'pj-larissa',
    initialDate: { yearDgd: 524, monthIndex: 4, dayOfMonth: 12 },
    initialScene: {
      id: 'escena-marisal-01',
      locationNodeId: 'Marisal',
      description:
        'La brisa salina de Puerto Libertad agita las velas mientras la tripulación rastrea mapas antiguos hacia los arrecifes de Thalassia.',
      environmentFlags: { marea_alta: true },
      activeThreats: [],
      turnNumber: 1,
    },
  },
];

export const THYRENIA_BASE_SKILLS: ReadonlyArray<
  Omit<ThyreniaSkillEntry, 'proficient' | 'isClassSkill' | 'rank'>
> = [
  { key: 'arcana', label: 'Arcana', defaultAbility: 'int' },
  { key: 'atletismo', label: 'Atletismo', defaultAbility: 'str' },
  { key: 'conduccion', label: 'Conducción', defaultAbility: 'wis' },
  { key: 'elaboracion', label: 'Elaboración', defaultAbility: 'int' },
  { key: 'hurto', label: 'Hurto', defaultAbility: 'dex' },
  { key: 'influencia', label: 'Influencia', defaultAbility: 'cha' },
  { key: 'interpretacion', label: 'Interpretación', defaultAbility: 'cha' },
  { key: 'naturaleza', label: 'Naturaleza', defaultAbility: 'wis' },
  { key: 'percepcion', label: 'Percepción', defaultAbility: 'wis' },
  { key: 'sigilo', label: 'Sigilo', defaultAbility: 'dex' },
  { key: 'sociedad', label: 'Sociedad', defaultAbility: 'int' },
];

export const DEFAULT_THYRENIA_CHARACTERS: CharacterContext[] = [
  {
    id: 'pj-olivia',
    name: 'Olivia Zyltris',
    race: 'elfo',
    class: 'hechicero',
    factions: ['Luz de Medialuna'],
    skillModifiers: { arcana: 5, percepcion: 4, influencia: 4 },
  },
  {
    id: 'pj-larissa',
    name: 'Larissa Windriver',
    race: 'tiefling',
    class: 'clerigo',
    factions: ['Luz de Medialuna'],
    skillModifiers: { sociedad: 4, percepcion: 5, influencia: 3 },
  },
  {
    id: 'pj-molder',
    name: 'Molder',
    race: 'warforged',
    class: 'monje',
    factions: ['Luz de Medialuna'],
    skillModifiers: { atletismo: 5, percepcion: 4, sigilo: 3 },
  },
  {
    id: 'pj-gerard',
    name: "Gerard D' Arc",
    race: 'humano',
    class: 'explorador',
    factions: ['Escuadrón UMBRA'],
    skillModifiers: { sigilo: 5, percepcion: 5, naturaleza: 4 },
  },
  {
    id: 'pj-garrick',
    name: 'Garrick',
    race: 'humano',
    class: 'guerrero',
    factions: [],
    skillModifiers: { atletismo: 5, percepcion: 3, sociedad: 2 },
  },
];

function createDefaultSkills(
  proficient: ThyreniaSkillKey[],
  classSkills: ThyreniaSkillKey[],
  ranks: Partial<Record<ThyreniaSkillKey, number>> = {},
): ThyreniaSkillEntry[] {
  const profSet = new Set<ThyreniaSkillKey>(['percepcion', ...proficient]);
  const classSet = new Set<ThyreniaSkillKey>(classSkills);
  return THYRENIA_BASE_SKILLS.map((s) => ({
    ...s,
    proficient: profSet.has(s.key),
    isClassSkill: classSet.has(s.key),
    rank: ranks[s.key] ?? 0,
  }));
}

export function buildDefaultSheetForCharacter(
  character: CharacterContext,
): ThyreniaCharacterSheet {
  const idLower = character.id.toLowerCase();
  if (idLower === 'pj-olivia') {
    return ThyreniaCharacterSheetSchema.parse({
      characterId: character.id,
      name: character.name,
      race: character.race,
      class: character.class,
      level: 5,
      background: 'Acólita de Lamú / Inmortal',
      alignment: 'Neutral Bueno',
      experiencePoints: 6500,
      proficiencyBonus: 3,
      speed: '30 pies',
      hp: { current: 34, max: 34, temp: 0 },
      hitDice: { total: '5d6', used: 0 },
      armorClass: 14,
      mana: { current: 18, max: 20 },
      auraPoints: { current: 5, max: 5 },
      abilities: { str: 10, dex: 14, con: 14, int: 13, wis: 12, cha: 18 },
      savingThrowProficiencies: {
        str: false,
        dex: false,
        con: true,
        int: false,
        wis: false,
        cha: true,
      },
      fortunePoints: 2,
      destinyPoints: 1,
      personalityTraits: 'Serena y protectora; observa el fluir del maná antes de hablar.',
      ideals: 'Los fuertes deben amparar a los inocentes y sanar las cicatrices de Thyrenia.',
      bonds: 'Kaelion y sus antiguos compañeros de la Torre de los Espejismos.',
      beliefs: [
        {
          text: 'Los fuertes deben proteger a los inocentes y sanar las heridas del mundo.',
          markedThisSession: false,
          resolved: false,
        },
        {
          text: 'Recuperar la verdad sobre la Torre de los Espejismos y la traición de Azura.',
          markedThisSession: false,
          resolved: false,
        },
      ],
      flaws: ['Cicatriz del Vacío: los recuerdos sellados nublan su juicio ante traidores.'],
      skills: createDefaultSkills(
        ['arcana', 'influencia', 'percepcion', 'sociedad'],
        ['arcana', 'influencia'],
        { arcana: 2, percepcion: 1 },
      ),
      proficiencies: {
        armors: { light: false, medium: false, heavy: false, shield: false },
        weapons: { simple: true, martial: false, other: 'Bastones y dagas' },
        tools: 'Kit de herboristería',
        languages: 'Común, Élfico, Celestial',
      },
      attacks: [
        {
          name: 'Descarga de Tormenta',
          attackBonus: '+7',
          damage: '2d10',
          damageType: 'Relámpago',
        },
        {
          name: 'Daga rúnica',
          attackBonus: '+5',
          damage: '1d4 + 2',
          damageType: 'Perforante',
        },
      ],
      featuresAndTraits:
        'Origen de Tormenta · Fuente de Maná (5 puntos de hechicería) · Inmortalidad sellada.',
      equipment: 'Túnica de acólita de Mineralia, foco arcano de cristal, daga rúnica.',
      coins: { pc: 12, pp: 35, pe: 0, po: 48, ppt: 2 },
      appearance: {
        age: 'Inmortal (aparenta 26)',
        height: '1.72 m',
        weight: '60 kg',
        eyes: 'Ámbar tormenta',
        skin: 'Pálida dorada',
        hair: 'Plateado',
        symbolName: 'Sello de Lamú',
      },
      milonga:
        'Nacida en Mineralia bajo la guía de un curandero y una guerrera. Sobrevivió a la traición de Azura en la Torre de los Espejismos hace 500 años, perdiendo parte de sus recuerdos hasta reencontrarse con Kaelion en Fuegosanto.',
      alliesAndOrganizations: 'Orden del Relámpago Sereno · Kaelion · Larissa · Kriv',
      spellcasting: {
        castingClass: 'Hechicero',
        castingAbility: 'cha',
        levels: [
          {
            level: 0,
            slotsTotal: 0,
            slotsUsed: 0,
            spells: [
              { name: 'Descarga de Fuego', prepared: true, castTime: '1 acción', damageOrEffect: '2d10 Fuego', ritual: false, concentration: false },
              { name: 'Luz', prepared: true, castTime: '1 acción', damageOrEffect: 'Iluminación 20/40 pies', ritual: false, concentration: false },
            ],
          },
          {
            level: 1,
            slotsTotal: 4,
            slotsUsed: 1,
            spells: [
              { name: 'Escudo', prepared: true, castTime: '1 reacción', damageOrEffect: '+5 CA', ritual: false, concentration: false },
              { name: 'Proyectil Mágico', prepared: true, castTime: '1 acción', damageOrEffect: '3×(1d4+1) Fuerza', ritual: false, concentration: false },
            ],
          },
          {
            level: 2,
            slotsTotal: 3,
            slotsUsed: 0,
            spells: [
              { name: 'Paso Brumoso', prepared: true, castTime: '1 acción adicional', damageOrEffect: 'Teletransporte 30 pies', ritual: false, concentration: false },
            ],
          },
        ],
      },
    });
  }

  if (idLower === 'pj-larissa') {
    return ThyreniaCharacterSheetSchema.parse({
      characterId: character.id,
      name: character.name,
      race: character.race,
      class: character.class,
      level: 4,
      background: 'Oráculo de Selene',
      alignment: 'Legal Bueno',
      experiencePoints: 2700,
      proficiencyBonus: 2,
      speed: '30 pies',
      hp: { current: 31, max: 31, temp: 0 },
      hitDice: { total: '4d8', used: 0 },
      armorClass: 16,
      mana: { current: 14, max: 16 },
      auraPoints: { current: 4, max: 4 },
      abilities: { str: 10, dex: 12, con: 14, int: 12, wis: 17, cha: 14 },
      savingThrowProficiencies: {
        str: false,
        dex: false,
        con: false,
        int: false,
        wis: true,
        cha: true,
      },
      fortunePoints: 2,
      destinyPoints: 1,
      beliefs: [
        {
          text: 'La luz de Selene guía incluso a quienes caminan entre sombras.',
          markedThisSession: false,
          resolved: false,
        },
      ],
      flaws: ['Desconfía profundamente de los cultos dracónicos y oculta sus visiones.'],
      skills: createDefaultSkills(
        ['sociedad', 'percepcion', 'influencia', 'naturaleza'],
        ['arcana', 'sociedad'],
        { sociedad: 1, percepcion: 1 },
      ),
      proficiencies: {
        armors: { light: true, medium: true, heavy: false, shield: true },
        weapons: { simple: true, martial: false, other: '' },
        tools: 'Set de caligrafía astral',
        languages: 'Común, Celestial',
      },
      attacks: [
        {
          name: 'Llama Sagrada',
          attackBonus: 'CD 13',
          damage: '1d8',
          damageType: 'Radiante',
        },
      ],
      coins: { pc: 8, pp: 20, pe: 0, po: 32, ppt: 0 },
      spellcasting: {
        castingClass: 'Clérigo',
        castingAbility: 'wis',
        levels: [
          {
            level: 1,
            slotsTotal: 4,
            slotsUsed: 1,
            spells: [
              { name: 'Bendición', prepared: true, castTime: '1 acción', damageOrEffect: '+1d4 ataque/salvación', ritual: false, concentration: true },
              { name: 'Palabra de Curación', prepared: true, castTime: '1 acción adicional', damageOrEffect: '1d4 + 3 curación', ritual: false, concentration: false },
            ],
          },
        ],
      },
    });
  }

  return ThyreniaCharacterSheetSchema.parse({
    characterId: character.id,
    name: character.name,
    race: character.race,
    class: character.class,
    level: 3,
    proficiencyBonus: 2,
    speed: '30 pies',
    hp: { current: 28, max: 28, temp: 0 },
    hitDice: { total: '3d10', used: 0 },
    armorClass: 15,
    mana: { current: 8, max: 8 },
    auraPoints: { current: 2, max: 2 },
    abilities: { str: 15, dex: 14, con: 14, int: 11, wis: 13, cha: 12 },
    savingThrowProficiencies: {
      str: true,
      dex: false,
      con: true,
      int: false,
      wis: false,
      cha: false,
    },
    fortunePoints: 1,
    destinyPoints: 1,
    beliefs: [
      {
        text: 'Cumplir la palabra empeñada con el grupo por encima del oro.',
        markedThisSession: false,
        resolved: false,
      },
    ],
    flaws: ['Impulsivo frente a emboscadas o deslealtades.'],
    skills: createDefaultSkills(
      ['atletismo', 'percepcion', 'sigilo'],
      ['atletismo', 'sociedad'],
      { atletismo: 1 },
    ),
    proficiencies: {
      armors: { light: true, medium: true, heavy: false, shield: true },
      weapons: { simple: true, martial: true, other: '' },
      tools: '',
      languages: 'Común',
    },
    attacks: [
      {
        name: 'Espada larga',
        attackBonus: '+4',
        damage: '1d8 + 2',
        damageType: 'Cortante',
      },
    ],
    coins: { pc: 5, pp: 14, pe: 0, po: 18, ppt: 0 },
  });
}

/**
 * Convierte una hoja de personaje de Thyrenia en un JSON importable como Actor en FoundryVTT (sistema dnd5e + flags.thyrenia).
 */
export function buildFoundryVttActorJson(
  sheet: ThyreniaCharacterSheet,
): Record<string, unknown> {
  const mod = (score: number): number => Math.floor((score - 10) / 2);
  const byKey = new Map(sheet.skills.map((s) => [s.key, s]));
  const profVal = (key: ThyreniaSkillKey): number => {
    const s = byKey.get(key);
    if (!s || !s.proficient) return 0;
    return s.rank >= 2 ? 2 : 1;
  };

  const abilityMap = (ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') => ({
    value: sheet.abilities[ability],
    mod: mod(sheet.abilities[ability]),
    proficient: sheet.savingThrowProficiencies?.[ability] ? 1 : 0,
  });

  const skillBonusTotal = (s: ThyreniaSkillEntry): number => {
    const base = mod(sheet.abilities[s.defaultAbility]);
    const prof = s.proficient ? sheet.proficiencyBonus : 0;
    const classBonus = s.isClassSkill && s.rank >= 1 ? 2 : 0;
    return base + prof + s.rank + classBonus;
  };

  const bioRows = [
    sheet.milonga ? `<p><strong>Milonga:</strong> ${sheet.milonga}</p>` : '',
    `<p><strong>Creencias:</strong></p><ul>${sheet.beliefs.map((b) => `<li>${b.text}</li>`).join('')}</ul>`,
    `<p><strong>Defectos:</strong></p><ul>${sheet.flaws.map((f) => `<li>${f}</li>`).join('')}</ul>`,
    `<p><strong>Habilidades de Thyrenia:</strong></p><ul>${sheet.skills
      .map(
        (s) =>
          `<li>${s.label} (Rango ${s.rank}${s.isClassSkill ? ', Clase' : ''}): +${skillBonusTotal(s)}</li>`,
      )
      .join('')}</ul>`,
  ]
    .filter(Boolean)
    .join('');

  return {
    name: sheet.name,
    type: 'character',
    system: {
      abilities: {
        str: abilityMap('str'),
        dex: abilityMap('dex'),
        con: abilityMap('con'),
        int: abilityMap('int'),
        wis: abilityMap('wis'),
        cha: abilityMap('cha'),
      },
      attributes: {
        hp: {
          value: sheet.hp.current,
          max: sheet.hp.max,
          temp: sheet.hp.temp ?? 0,
        },
        ac: {
          flat: sheet.armorClass,
          calc: 'flat',
        },
        prof: sheet.proficiencyBonus,
        movement: { walk: Number.parseInt(sheet.speed, 10) || 30 },
        inspiration: sheet.inspiration,
        death: sheet.deathSaves,
      },
      currency: {
        cp: sheet.coins?.pc ?? 0,
        sp: sheet.coins?.pp ?? 0,
        ep: sheet.coins?.pe ?? 0,
        gp: sheet.coins?.po ?? 0,
        pp: sheet.coins?.ppt ?? 0,
      },
      details: {
        race: sheet.race,
        class: sheet.class,
        level: sheet.level,
        background: sheet.background,
        alignment: sheet.alignment,
        xp: { value: sheet.experiencePoints ?? 0 },
        biography: {
          value: bioRows,
        },
      },
      skills: {
        arc: { value: profVal('arcana'), ability: 'int' },
        ath: { value: profVal('atletismo'), ability: 'str' },
        acr: { value: profVal('atletismo'), ability: 'dex' },
        slt: { value: profVal('hurto'), ability: 'dex' },
        per: { value: profVal('influencia'), ability: 'cha' },
        dec: { value: profVal('influencia'), ability: 'cha' },
        itm: { value: profVal('influencia'), ability: 'cha' },
        prf: { value: profVal('interpretacion'), ability: 'cha' },
        nat: { value: profVal('naturaleza'), ability: 'int' },
        med: { value: profVal('naturaleza'), ability: 'wis' },
        sur: { value: profVal('naturaleza'), ability: 'wis' },
        ani: { value: profVal('naturaleza'), ability: 'wis' },
        prc: { value: profVal('percepcion'), ability: 'wis' },
        inv: { value: profVal('percepcion'), ability: 'int' },
        ins: { value: profVal('percepcion'), ability: 'wis' },
        ste: { value: profVal('sigilo'), ability: 'dex' },
        his: { value: profVal('sociedad'), ability: 'int' },
        rel: { value: profVal('sociedad'), ability: 'int' },
      },
    },
    flags: {
      thyrenia: {
        systemVersion: '1.0',
        characterId: sheet.characterId,
        mana: sheet.mana,
        fortunePoints: sheet.fortunePoints,
        destinyPoints: sheet.destinyPoints,
        beliefs: sheet.beliefs,
        flaws: sheet.flaws,
        consolidatedSkills: sheet.skills.map((s) => ({
          ...s,
          computedBonus: skillBonusTotal(s),
        })),
      },
    },
  };
}

export interface ThyreniaCosmicFestival {
  id: string;
  monthIndex: number;
  dayOfMonth: number;
  icon: string;
  name: string;
  kind:
    | 'Solsticio'
    | 'Equinoccio'
    | 'Eclipse Cósmico'
    | 'Fiesta Pagana'
    | 'Ritual Sagrado';
  deity: string;
  description: string;
}

export const THYRENIA_COSMIC_FESTIVALS: ReadonlyArray<ThyreniaCosmicFestival> = [
  {
    id: 'solsticio-invierno',
    monthIndex: 0,
    dayOfMonth: 25,
    icon: '🌑',
    name: 'Solsticio de Invierno',
    kind: 'Solsticio',
    deity: 'Nyxara',
    description:
      'La noche más profunda del año: noches de tinieblas, apariciones y profecías entre la luz moribunda y el velo de las sombras.',
  },
  {
    id: 'vigilia-presagios',
    monthIndex: 1,
    dayOfMonth: 15,
    icon: '⏳',
    name: 'Vigilia de los Presagios',
    kind: 'Ritual Sagrado',
    deity: 'Kronos',
    description:
      'Los oráculos del tiempo leen las corrientes del pasado y futuro bajo el cielo quieto de Kronalis.',
  },
  {
    id: 'ritual-ocaso-invierno',
    monthIndex: 1,
    dayOfMonth: 28,
    icon: '🔥',
    name: 'Ritual del Ocaso de Invierno',
    kind: 'Fiesta Pagana',
    deity: 'Nyxara / Szaelra',
    description:
      'Vigilia nocturna junto a grandes fogones para despedir el último tramo de la oscuridad invernal.',
  },
  {
    id: 'despertar-verdalis',
    monthIndex: 2,
    dayOfMonth: 1,
    icon: '🌱',
    name: 'Despertar de Verdalis',
    kind: 'Fiesta Pagana',
    deity: 'Gaia',
    description:
      'Festividad rústica de resistencia y siembra temprana en honor a Gaia antes del deshielo primaveral.',
  },
  {
    id: 'equinoccio-primavera',
    monthIndex: 3,
    dayOfMonth: 15,
    icon: '🌸',
    name: 'Equinoccio de Primavera',
    kind: 'Equinoccio',
    deity: 'Selene',
    description:
      'Cambio astral de luz renovada: celebraciones de la vida, cantos lunares y purificación en honor a Selene.',
  },
  {
    id: 'fiesta-lluvias-libres',
    monthIndex: 4,
    dayOfMonth: 10,
    icon: '🌊',
    name: 'Fiesta de las Lluvias Libres',
    kind: 'Fiesta Pagana',
    deity: 'Thalassia',
    description:
      'Ritos costeros y bendición de navíos bajo las tormentas templadas de Thalasis.',
  },
  {
    id: 'solsticio-verano',
    monthIndex: 7,
    dayOfMonth: 20,
    icon: '☀️',
    name: 'Solsticio de Verano',
    kind: 'Solsticio',
    deity: 'Tiamat e Ignar',
    description:
      'Cenit solar marcado por rituales de fuego, pruebas de temple y duelos en honor a Ignar y Tiamat.',
  },
  {
    id: 'equinoccio-otono',
    monthIndex: 9,
    dayOfMonth: 10,
    icon: '🍂',
    name: 'Equinoccio de Otoño',
    kind: 'Equinoccio',
    deity: 'Vulcanis',
    description:
      'Cambio de estación entre cenizas cálidas, ofrendas de transformación y fragua en honor a Vulcanis.',
  },
  {
    id: 'conjuncion-sombras',
    monthIndex: 10,
    dayOfMonth: 18,
    icon: '🗡️',
    name: 'Conjunción de las Sombras',
    kind: 'Fiesta Pagana',
    deity: 'Umbra',
    description:
      'Noche sin luna donde prosperan los juramentos secretos, contratos clandestinos y cofradías.',
  },
  {
    id: 'eclipse-yogthos',
    monthIndex: 11,
    dayOfMonth: 30,
    icon: '🩸',
    name: 'Eclipse de Yogthos',
    kind: 'Eclipse Cósmico',
    deity: 'Yog-Sothoth',
    description:
      'Último día del año: las fronteras entre planos se adelgazan y la entropía amenaza la realidad.',
  },
];

export interface PlotTimelineEntry {
  id: string;
  sessionNumber: number;
  kind: 'past' | 'current' | 'upcoming';
  sessionTag: string;
  title: string;
  location: string;
  calendarCoords: CalendarCoords;
  thyreniaDate: ThyreniaCalendarDate;
  daysDeltaFromNow: number;
  associatedEvent: ThyreniaCosmicFestival | null;
  seasonTransitionNote: string;
  participants: string[];
  highlights: string[];
  summary: string;
  sourceNoteRelativePath?: string;
  chronicleMarkdown?: string;
}

export interface CosmicWheelMonth {
  monthIndex: number;
  name: string;
  season: ThyreniaCalendarDate['season'];
  isSeasonStart: boolean;
  deity: string;
  influence: string;
  festivals: ThyreniaCosmicFestival[];
  sessionTitles: string[];
}

export interface CampaignPlotTimeline {
  campaignId: string;
  campaignName: string;
  currentDate: ThyreniaCalendarDate;
  nextCosmicEvent: {
    festival: ThyreniaCosmicFestival;
    daysUntil: number;
    dateFormatted: string;
  };
  entries: PlotTimelineEntry[];
  cosmicWheel: CosmicWheelMonth[];
}

interface RawCampaignMilestone {
  id: string;
  sessionNumber: number;
  kind: 'past' | 'current';
  sessionTag: string;
  title: string;
  location: string;
  coords: CalendarCoords;
  participants: string[];
  highlights: string[];
  summary: string;
  sourceNoteRelativePath?: string;
}

function getFestivalForCoords(coords: CalendarCoords): ThyreniaCosmicFestival | null {
  const safeMonth = ((coords.monthIndex % 12) + 12) % 12;
  const safeDay = Math.max(1, Math.min(30, Math.trunc(coords.dayOfMonth)));
  return (
    THYRENIA_COSMIC_FESTIVALS.find(
      (f) => f.monthIndex === safeMonth && f.dayOfMonth === safeDay,
    ) ?? null
  );
}

function describeSeasonContext(coords: CalendarCoords): string {
  const safeMonth = ((coords.monthIndex % 12) + 12) % 12;
  const monthInfo = THYRENIA_MONTHS[safeMonth];
  if (coords.dayOfMonth <= 3 && (safeMonth === 0 || safeMonth === 3 || safeMonth === 6 || safeMonth === 9)) {
    return `Inicio de ${monthInfo.season}: cambio de estación regido por ${monthInfo.deity}.`;
  }
  if (safeMonth === 2 && coords.dayOfMonth <= 15) {
    return `Invierno tardío en ${monthInfo.name}: antesala del deshielo y del Equinoccio de Primavera.`;
  }
  return `Pleno ${monthInfo.season} (${monthInfo.name}): ${monthInfo.influence}.`;
}

function coordsToDayNumber(c: CalendarCoords): number {
  return c.yearDgd * 360 + ((c.monthIndex % 12) * 30) + (c.dayOfMonth - 1);
}

function readPublicSessionChronicle(
  vaultPath: string,
  relativePath: string | undefined,
): string | undefined {
  if (!vaultPath || !relativePath) return undefined;
  const fullPath = path.resolve(vaultPath, relativePath);
  const resolvedRoot = path.resolve(vaultPath);
  if (!fullPath.startsWith(resolvedRoot) || !fs.existsSync(fullPath)) {
    return undefined;
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const parsed = matter(raw);
    const cleaned = VaultContextCompiler.stripObsidianComments(parsed.content);
    const tags = VaultContextCompiler.extractInlineTags(cleaned, parsed.data?.tags);
    const { layer } = VaultContextCompiler.inferLayerAndRequirements(
      relativePath.replace(/\\/g, '/'),
      parsed.data || {},
      tags,
    );
    if (layer === 'dm_secret') {
      return undefined;
    }
    const cleanText = SecretRedactor.redact(cleaned).trim();
    if (!cleanText) return undefined;
    return cleanText.length > 2600
      ? cleanText.slice(0, 2600).trim() + '\n\n*(Crónica abreviada para lectura rápida...)*'
      : cleanText;
  } catch {
    return undefined;
  }
}

const CAMPAIGN_MILESTONES: Record<string, RawCampaignMilestone[]> = {
  'luz-de-medialuna': [
    {
      id: 'luz-s1',
      sessionNumber: 1,
      kind: 'past',
      sessionTag: 'Sesión -5 · 21-7-25',
      title: 'Monte Targon, el Mercader Dimensional y el Espejo de Nocturna',
      location: 'Tercer Pico del Monte Targon (Cordillera de las Estrellas)',
      coords: { yearDgd: 524, monthIndex: 0, dayOfMonth: 25 },
      participants: ['Larissa', 'Kriv', 'Mithrandir', 'Mercader Dimensional', 'Nyxara'],
      highlights: [
        'Cierre del enfrentamiento contra Hel e introducción de Puntos de Fortuna y Destino.',
        'Trato con el Mercader Dimensional: Anillo del Abismo, Mapamundi vivo y mejora de escudo para Mithrandir.',
        'Obtención del Espejo de Nocturna; Larissa perdió sus símbolos sagrados ante Nyxara.',
      ],
      summary:
        'Tras cerrar la batalla contra Hel en el Monte Targon, la party negoció reliquias con el Mercader Dimensional y aseguró el Espejo de Nocturna bajo la noche más larga de Nyxaris.',
      sourceNoteRelativePath: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)/Notas de Sesion/Notas 21-7-25.md',
    },
    {
      id: 'luz-s2',
      sessionNumber: 2,
      kind: 'past',
      sessionTag: 'Sesión -4 · 25-8-25',
      title: 'El Augurio de Eirene y la Búsqueda de la Corona de Lunaris',
      location: 'Camino hacia el Bosque de Nocturnis (Avaloria)',
      coords: { yearDgd: 524, monthIndex: 1, dayOfMonth: 5 },
      participants: ['Larissa', 'Kriv', 'Quarion', 'Aria', 'Thrain'],
      highlights: [
        'Los héroes compartieron sus trasfondos e historias pasadas.',
        'Larissa conjuró Adivinación ante Eirene, diosa de la paz.',
        'Revelación del verso profético: "Busca el árbol que nunca ve el día; allí la corona de Lunaris yacerá".',
      ],
      summary:
        'El grupo unió sus historias y recibió de la diosa Eirene la profecía que señaló al Bosque de Nocturnis y al Árbol Sin Día como paradero de la Corona de Lunaris.',
      sourceNoteRelativePath: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)/Notas de Sesion/Notas 25-8-25.md',
    },
    {
      id: 'luz-s3',
      sessionNumber: 3,
      kind: 'past',
      sessionTag: 'Sesión -3 · 27-12-25',
      title: 'Eldoria, el Espíritu Lobo Cane y la Caída de Groot',
      location: 'Frontera de Eldoria',
      coords: { yearDgd: 524, monthIndex: 1, dayOfMonth: 18 },
      participants: ['Quarion', 'Groot Paraguarensis', 'Arwen', 'Gardin Bothel'],
      highlights: [
        'Encuentro con el guardia élfico Arwen y tratos con Gardin Bothel.',
        'Aparición del espíritu lobo del viento, Cane.',
        'Pérdida trágica de Groot Paraguarensis durante los sucesos invernales.',
      ],
      summary:
        'Un capítulo marcado por aliados fronterizos, la presencia del espíritu lobo Cane y el duro golpe que supuso la muerte de Groot en pleno invierno de Kronalis.',
      sourceNoteRelativePath: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)/Notas de Sesion/Notas 27-12-25.md',
    },
    {
      id: 'luz-s4',
      sessionNumber: 4,
      kind: 'past',
      sessionTag: 'Sesión -2 · 17-4-26',
      title: 'Eryndor, el Oráculo Szaelra y el Umbral del Árbol Sin Día',
      location: 'Pueblo Drow de Eryndor (Bosque de Nocturnis)',
      coords: { yearDgd: 524, monthIndex: 1, dayOfMonth: 28 },
      participants: ['Kriv', 'Juancito', 'Quarion', 'Aria', 'Larissa', 'Thrain'],
      highlights: [
        'Llegada al amanecer grisáceo de Eryndor bajo las copas cerradas de Nocturnis.',
        'El grupo se dividió en 3 frentes; Kriv encontró entre llamas a Szaelra, Oráculo del Ocaso.',
        'Coincidió con el ritual drow de despedida del invierno antes de descender al Árbol Sin Día.',
      ],
      summary:
        'Durante el Ritual del Ocaso de Invierno en Eryndor, Kriv despertó la atención del Oráculo Szaelra mientras el resto de la party preparaba el descenso hacia el Árbol Sin Día.',
      sourceNoteRelativePath: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)/Notas de Sesion/Notas 17-4-26.md',
    },
    {
      id: 'luz-s5',
      sessionNumber: 5,
      kind: 'past',
      sessionTag: 'Sesión -1 · 3-5-26',
      title: 'Visiones del Árbol, la Burla de Seraph y el Kalim Zephyr',
      location: 'Interior del Árbol Sin Día y Biblioteca Sagrada',
      coords: { yearDgd: 524, monthIndex: 1, dayOfMonth: 30 },
      participants: ['Larissa', 'Kriv', 'Quarion', 'Draegar', 'Aria', 'Juancito', 'Thrain'],
      highlights: [
        'Cada héroe enfrentó visiones internas; Draegar se unió al grupo reconociendo la espada y anillo de Kriv.',
        'Persecución del caído Seraph, ex paladín de Selene ahora devoto de Nyxara.',
        'Rechazo al trato del Dios de los Mercaderes e investigación de la biblioteca, donde Aria halló parte del Kalim Zephyr.',
      ],
      summary:
        'En el último día de Kronalis, la party sobrevivió a las visiones del árbol, cerró las puertas en cara del caído Seraph e ingresó a la biblioteca antigua junto a Draegar.',
      sourceNoteRelativePath: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)/Notas de Sesion/Notas 3-5-26.md',
    },
    {
      id: 'luz-s6',
      sessionNumber: 6,
      kind: 'current',
      sessionTag: '📍 Punto Actual · 9-7-26',
      title: 'Frente al Pozo de la Renuncia',
      location: 'El Pozo de la Renuncia (Corazón de las Sombras)',
      coords: { yearDgd: 524, monthIndex: 2, dayOfMonth: 1 },
      participants: ['Larissa', 'Kriv', 'Quarion', 'Draegar', 'Aria', 'Juancito', 'Thrain'],
      highlights: [
        'A diferencia de las visiones previas, el Pozo exige una renuncia auténtica y permanente.',
        'Larissa se arrodilla aferrando su colgante de Selene ante la mirada de Kriv.',
        'El cielo cambia a Verdalis (mes de Gaia): la resistencia antes de la primavera pondrá a prueba lo que cada uno está dispuesto a sacrificar.',
      ],
      summary:
        'La trama se encuentra justo en el umbral del Pozo de la Renuncia: el instante decisivo en que cada miembro del grupo debe elegir qué parte de sí mismo entrega para continuar.',
      sourceNoteRelativePath: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)/Notas de Sesion/Notas 9-7-26.md',
    },
  ],
  'escuadron-umbra': [
    {
      id: 'umbra-s1',
      sessionNumber: 1,
      kind: 'past',
      sessionTag: 'Sesión -2 · Crónica',
      title: 'Xenith, la Mano Negra de Tiamat y el Pequeño Babas',
      location: 'Frontera del Reino',
      coords: { yearDgd: 524, monthIndex: 1, dayOfMonth: 5 },
      participants: ['Gerard D\'Arc', 'Ack Droka', 'Orianna', 'Babas'],
      highlights: [
        'Xenith abatió a los dragones dejando a Scrab como única aliada sobreviviente.',
        'Rescate del dragoncito negro Babas, bendecido en nombre de Selene y Aether.',
      ],
      summary:
        'Los primeros contratos del escuadrón dejaron tras de sí pólvora arcana, dragones caídos y un pacto inesperado en torno a Babas.',
      sourceNoteRelativePath: '01 - Campanas/02 - Campana Mercenarios (Escuadron UMBRA)/Notas de Sesion/Notas Mercenarios.md',
    },
    {
      id: 'umbra-s2',
      sessionNumber: 2,
      kind: 'past',
      sessionTag: 'Sesión -1 · 26-10-25',
      title: 'Tras el Juicio en la Catedral: El Salón de los Susurros',
      location: 'El Salón de los Susurros',
      coords: { yearDgd: 524, monthIndex: 1, dayOfMonth: 12 },
      participants: ['Gerard D\'Arc', 'Ack Droka', 'Bianca'],
      highlights: [
        'Cierre de puertas tras el tenso juicio público en la catedral.',
        'Acuerdos clandestinos en el Salón de los Susurros bajo la filosofía de Sombra.',
      ],
      summary:
        'Con la ciudad calmada en apariencia, Gerard, Ack y Bianca redefinieron sus alianzas políticas lejos de los ojos del consejo.',
      sourceNoteRelativePath: '01 - Campanas/02 - Campana Mercenarios (Escuadron UMBRA)/Notas de Sesion/26-10-25 Mercenarios.md',
    },
    {
      id: 'umbra-s3',
      sessionNumber: 3,
      kind: 'current',
      sessionTag: '📍 Punto Actual',
      title: 'Sombras sobre El Gran Bosque',
      location: 'El Gran Bosque (Reino Élfico)',
      coords: { yearDgd: 524, monthIndex: 1, dayOfMonth: 18 },
      participants: ['Gerard D\'Arc', 'Ack Droka', 'Orianna'],
      highlights: [
        'Desentrañar la fachada mágica del Gran Bosque gobernado por nobles inmortales.',
        'Operaciones de reconocimiento y vigilancia del Escuadrón UMBRA.',
      ],
      summary:
        'En pleno Velaris 18 de Kronalis (524 DGD), UMBRA opera en las entrañas del Gran Bosque buscando grietas en el poder élfico.',
      sourceNoteRelativePath: '01 - Campanas/02 - Campana Mercenarios (Escuadron UMBRA)/Notas de Sesion/El Gran Bosque Lienzo.md',
    },
  ],
  'perseguidores-amanecer': [
    {
      id: 'marisal-s1',
      sessionNumber: 1,
      kind: 'past',
      sessionTag: 'Sesión -1 · Prólogo',
      title: 'Juramentos en la Costa: Taynara y Salazar de Astora',
      location: 'Puerto de Zarpe hacia Marisal',
      coords: { yearDgd: 524, monthIndex: 4, dayOfMonth: 10 },
      participants: ['Taynara Valdirene', 'Salazar de Astora'],
      highlights: [
        'Taynara sigue la pista de los guerreros con armaduras marcadas por un ojo de tentáculos carmesíes.',
        'Salazar de Astora aporta recursos e influencia nobiliaria a la travesía.',
      ],
      summary:
        'Bajo la Fiesta de las Lluvias Libres de Thalassia, los miembros iniciales trazan sus deudas de sangre antes de hacerse a la mar.',
      sourceNoteRelativePath: '01 - Campanas/03 - Campana Marisal (Perseguidores del Amanecer)/Notas de Sesion/Nueva Partida Marisal.md',
    },
    {
      id: 'marisal-s2',
      sessionNumber: 2,
      kind: 'current',
      sessionTag: '📍 Punto Actual',
      title: 'Rumbos del Archipiélago de Marisal',
      location: 'Archipiélago de Marisal',
      coords: { yearDgd: 524, monthIndex: 4, dayOfMonth: 12 },
      participants: ['Taynara Valdirene', 'Salazar de Astora', 'Tripulación'],
      highlights: [
        'Exploración de playas blancas, selvas interiores y arrecifes sagrados de Thalassia.',
        'Búsqueda de pistas hacia las ruinas y facciones ocultas del archipiélago.',
      ],
      summary:
        'Los Perseguidores del Amanecer navegan entre islas luminosas en busca de las verdades sumergidas bajo las aguas de Marisal.',
      sourceNoteRelativePath: '01 - Campanas/03 - Campana Marisal (Perseguidores del Amanecer)/Notas de Sesion/Marisal.md',
    },
  ],
};

/**
 * Construye la línea de tiempo interactiva de sesiones, eventos cósmicos/paganos asociados
 * y la Rueda Astral completa de los 12 meses del Calendario de Thyrenia.
 */
export function buildCampaignPlotTimeline(
  campaignId: string,
  currentCoords: CalendarCoords,
  vaultPath: string,
  currentScene?: SceneState,
  liveTurns: Array<{
    turnNumber: number;
    locationNodeId: string;
    playerAction: string;
    narration: string;
  }> = [],
): CampaignPlotTimeline {
  const camp =
    THYRENIA_CAMPAIGNS.find((c) => c.id === campaignId) ?? THYRENIA_CAMPAIGNS[0];
  const currentDayNum = coordsToDayNumber(currentCoords);
  const baseMilestones =
    CAMPAIGN_MILESTONES[campaignId] ?? CAMPAIGN_MILESTONES['luz-de-medialuna'];

  const entries: PlotTimelineEntry[] = baseMilestones.map((m) => {
    const isCurrent = m.kind === 'current';
    const effectiveCoords = isCurrent ? currentCoords : m.coords;
    const formattedDate = formatThyreniaDate(effectiveCoords);
    const festival = getFestivalForCoords(effectiveCoords);
    const delta = coordsToDayNumber(effectiveCoords) - currentDayNum;

    const latestTurnsSummary =
      isCurrent && liveTurns.length > 0
        ? liveTurns.slice(-3).map((t) => `Turno #${t.turnNumber} (${t.locationNodeId}): ${t.narration}`)
        : [];

    const chronicleMarkdown = readPublicSessionChronicle(
      vaultPath,
      m.sourceNoteRelativePath,
    );

    return {
      id: m.id,
      sessionNumber: m.sessionNumber,
      kind: m.kind,
      sessionTag: m.sessionTag,
      title: isCurrent && currentScene?.locationNodeId && liveTurns.length > 0
        ? `${m.title} · En vivo en ${currentScene.locationNodeId}`
        : m.title,
      location:
        isCurrent && currentScene?.locationNodeId && liveTurns.length > 0
          ? currentScene.locationNodeId
          : m.location,
      calendarCoords: effectiveCoords,
      thyreniaDate: formattedDate,
      daysDeltaFromNow: delta,
      associatedEvent: festival,
      seasonTransitionNote: describeSeasonContext(effectiveCoords),
      participants: m.participants,
      highlights:
        latestTurnsSummary.length > 0
          ? [...m.highlights.slice(0, 2), ...latestTurnsSummary.slice(-1)]
          : m.highlights,
      summary:
        isCurrent && liveTurns.length > 0 && currentScene?.description
          ? currentScene.description
          : m.summary,
      sourceNoteRelativePath: m.sourceNoteRelativePath,
      chronicleMarkdown,
    };
  });

  // Calcular próximo evento cósmico / fiesta pagana respecto a currentCoords
  const currentYear = currentCoords.yearDgd;
  const candidateFestivals = THYRENIA_COSMIC_FESTIVALS.map((f) => {
    const sameYearCoords: CalendarCoords = {
      yearDgd: currentYear,
      monthIndex: f.monthIndex,
      dayOfMonth: f.dayOfMonth,
    };
    let diff = coordsToDayNumber(sameYearCoords) - currentDayNum;
    let targetCoords = sameYearCoords;
    if (diff < 0) {
      targetCoords = {
        yearDgd: currentYear + 1,
        monthIndex: f.monthIndex,
        dayOfMonth: f.dayOfMonth,
      };
      diff = coordsToDayNumber(targetCoords) - currentDayNum;
    }
    return { festival: f, daysUntil: diff, targetCoords };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const nearest =
    candidateFestivals.find((c) => c.daysUntil > 0) ?? candidateFestivals[0];
  const nextCosmicFormatted = formatThyreniaDate(nearest.targetCoords);

  entries.push({
    id: `${campaignId}-upcoming-cosmic`,
    sessionNumber: entries.length + 1,
    kind: 'upcoming',
    sessionTag:
      nearest.daysUntil === 0
        ? `${nearest.festival.icon} Hoy mismo`
        : `${nearest.festival.icon} En ${nearest.daysUntil} días`,
    title: `${nearest.festival.name} (${nearest.festival.kind})`,
    location: 'Todo Thyrenia — Cielos y Estaciones',
    calendarCoords: nearest.targetCoords,
    thyreniaDate: nextCosmicFormatted,
    daysDeltaFromNow: nearest.daysUntil,
    associatedEvent: nearest.festival,
    seasonTransitionNote: describeSeasonContext(nearest.targetCoords),
    participants: [nearest.festival.deity],
    highlights: [
      `Fecha astral: ${nextCosmicFormatted.dayOfMonth} de ${nextCosmicFormatted.monthName}, ${nextCosmicFormatted.yearDgd} DGD.`,
      `Regido por ${nearest.festival.deity} (${nearest.festival.kind}).`,
      nearest.festival.description,
    ],
    summary: nearest.festival.description,
  });

  const cosmicWheel: CosmicWheelMonth[] = THYRENIA_MONTHS.map((m, idx) => ({
    monthIndex: idx,
    name: m.name,
    season: m.season,
    isSeasonStart: idx === 0 || idx === 3 || idx === 6 || idx === 9,
    deity: m.deity,
    influence: m.influence,
    festivals: THYRENIA_COSMIC_FESTIVALS.filter((f) => f.monthIndex === idx),
    sessionTitles: entries
      .filter((e) => e.kind !== 'upcoming' && e.calendarCoords.monthIndex === idx)
      .map((e) => `${e.sessionTag}: ${e.title}`),
  }));

  return {
    campaignId: camp.id,
    campaignName: camp.name,
    currentDate: formatThyreniaDate(currentCoords),
    nextCosmicEvent: {
      festival: nearest.festival,
      daysUntil: nearest.daysUntil,
      dateFormatted: nextCosmicFormatted.formatted,
    },
    entries,
    cosmicWheel,
  };
}

// =====================================================================
// Fase 2 & 3: Pines Cartográficos, Misiones/Rumores, Red de Relaciones y Foundry Journal
// =====================================================================

export type MapPinKind =
  | 'continent'
  | 'city'
  | 'dungeon_ruin'
  | 'temple'
  | 'danger'
  | 'landmark';

export type MapPinFogState = 'discovered' | 'rumor' | 'secret';

export interface CampaignMapPin {
  id: string;
  campaignId: string;
  mapId?: string;
  childMapId?: string;
  label: string;
  x: number;
  y: number;
  pinKind: MapPinKind;
  fogState: MapPinFogState;
  linkedNodeId?: string;
  region?: string;
  rumorTeaser?: string;
  unlockCriteria?: string;
}

export interface AtlasMapRoad {
  fromPinId: string;
  toPinId: string;
  label?: string;
  kind?: 'royal' | 'trail' | 'sea' | 'secret';
}

export interface AtlasMapLevel {
  id: string;
  parentMapId?: string;
  parentPinId?: string;
  name: string;
  scale: 'world' | 'continent' | 'city';
  subtitle: string;
  imageFile?: string;
  fogLayer: 'base' | 'asimetrica' | 'progresiva' | 'dm_secret';
  allowedRaces?: string[];
  allowedFactions?: string[];
  requiredNodeId?: string;
  unlockCriteria?: string;
  roads: AtlasMapRoad[];
  pins: Array<Omit<CampaignMapPin, 'campaignId'>>;
}

export interface AtlasMapViewLevel {
  id: string;
  parentMapId?: string;
  parentPinId?: string;
  name: string;
  scale: 'world' | 'continent' | 'city';
  subtitle: string;
  imageFile?: string;
  fogLayer: 'base' | 'asimetrica' | 'progresiva' | 'dm_secret';
  isUnlocked: boolean;
  lockReason?: string;
  roads: AtlasMapRoad[];
  pins: CampaignMapPin[];
}

export interface PartyMapPosition {
  campaignId: string;
  label: string;
  x: number;
  y: number;
  linkedNodeId?: string;
}

const CONTINENT_BASE_PINS: ReadonlyArray<Omit<CampaignMapPin, 'campaignId'>> = [
  {
    id: 'pin-continent-dracoria',
    mapId: 'world-thyrenia',
    childMapId: 'continent-dracoria',
    label: 'Dracoria',
    x: 53,
    y: 19,
    pinKind: 'continent',
    fogState: 'discovered',
    linkedNodeId: 'Dracoria',
    region: 'Volcanes y Altas Cumbres del Norte',
  },
  {
    id: 'pin-continent-evedia',
    mapId: 'world-thyrenia',
    childMapId: 'continent-evedia',
    label: 'Evedia',
    x: 22,
    y: 38,
    pinKind: 'continent',
    fogState: 'discovered',
    linkedNodeId: 'Evedia',
    region: 'Bosques Occidentales y Ríos Silvanos',
  },
  {
    id: 'pin-continent-avaloria',
    mapId: 'world-thyrenia',
    childMapId: 'continent-avaloria',
    label: 'Avaloria',
    x: 80,
    y: 39,
    pinKind: 'continent',
    fogState: 'discovered',
    linkedNodeId: 'Avaloria',
    region: 'Nieveterna y Ciudadelas Orientales',
  },
  {
    id: 'pin-continent-marisal',
    label: 'Marisal',
    x: 48,
    y: 50,
    pinKind: 'continent',
    fogState: 'discovered',
    linkedNodeId: 'Marisal',
    region: 'Archipiélago Central de Thyrenia',
  },
  {
    id: 'pin-continent-thornia',
    label: 'Thornia',
    x: 24,
    y: 73,
    pinKind: 'continent',
    fogState: 'discovered',
    linkedNodeId: 'Thornia',
    region: 'Desiertos Dorados del Suroeste',
  },
  {
    id: 'pin-continent-istoria',
    label: 'Istoria',
    x: 78,
    y: 78,
    pinKind: 'continent',
    fogState: 'discovered',
    linkedNodeId: 'Istoria',
    region: 'Cordilleras y Cráteres de Forja',
  },
];

export function getDefaultMapPinsForCampaign(
  campaignId: string,
): CampaignMapPin[] {
  const basePins: CampaignMapPin[] = CONTINENT_BASE_PINS.map((p) => ({
    ...p,
    campaignId,
  }));

  if (campaignId === 'escuadron-umbra') {
    return [
      ...basePins,
      {
        id: 'pin-umbra-bosque',
        campaignId,
        label: 'El Gran Bosque',
        x: 20,
        y: 43,
        pinKind: 'landmark',
        fogState: 'discovered',
        linkedNodeId: 'El Gran Bosque Lienzo',
        region: 'Occidente de Evedia',
      },
      {
        id: 'pin-umbra-catedral',
        campaignId,
        label: 'Salón de los Susurros',
        x: 56,
        y: 39,
        pinKind: 'city',
        fogState: 'discovered',
        linkedNodeId: '26-10-25 Mercenarios',
        region: 'Ruta Central',
      },
      {
        id: 'pin-umbra-corte-rumor',
        campaignId,
        label: 'Corte Inmortal del Bosque',
        x: 17,
        y: 34,
        pinKind: 'danger',
        fogState: 'rumor',
        region: 'Corazón del Gran Bosque',
        rumorTeaser: 'Los nobles inmortales tejen ilusiones alrededor de sus bastiones.',
        unlockCriteria: 'Completar el reconocimiento encubierto en El Gran Bosque.',
      },
      {
        id: 'pin-umbra-secret-bunker',
        campaignId,
        label: 'Archivo Negro del Consejo',
        x: 73,
        y: 33,
        pinKind: 'dungeon_ruin',
        fogState: 'secret',
        region: 'Borde de Avaloria',
        rumorTeaser: 'Contratos originales vinculados a la muerte de Babas.',
      },
    ];
  }

  if (campaignId === 'perseguidores-amanecer') {
    return [
      ...basePins,
      {
        id: 'pin-marisal-puerto',
        campaignId,
        label: 'Puerto Libertad',
        x: 45,
        y: 53,
        pinKind: 'city',
        fogState: 'discovered',
        linkedNodeId: 'Marisal',
        region: 'Costa Central de Marisal',
      },
      {
        id: 'pin-marisal-arrecifes',
        campaignId,
        label: 'Arrecifes de Thalassia',
        x: 55,
        y: 57,
        pinKind: 'temple',
        fogState: 'rumor',
        region: 'Aguas Orientales de Marisal',
        rumorTeaser: 'Pescadores afirman ver columnatas sumergidas durante las mareas bajas.',
        unlockCriteria: 'Seguir las cartas náuticas de Puerto Libertad.',
      },
      {
        id: 'pin-marisal-ojo-secret',
        campaignId,
        label: 'Altar Sumergido del Ojo Carmesí',
        x: 42,
        y: 61,
        pinKind: 'danger',
        fogState: 'secret',
        region: 'Fosa Abisal del Sur',
        rumorTeaser: 'Refugio oculto de los guerreros perseguidos por Taynara.',
      },
    ];
  }

  // luz-de-medialuna
  return [
    ...basePins,
    {
      id: 'pin-luz-pozo',
      label: 'El Pozo de la Renuncia',
      campaignId,
      x: 34,
      y: 44,
      pinKind: 'landmark',
      fogState: 'discovered',
      linkedNodeId: 'Notas 9-7-26',
      region: 'Linde entre Evedia y Marisal',
    },
    {
      id: 'pin-luz-eryndor',
      label: 'Eryndor (Pueblo Drow)',
      campaignId,
      x: 28,
      y: 31,
      pinKind: 'city',
      fogState: 'discovered',
      linkedNodeId: 'Notas 17-4-26',
      region: 'Frontera Norte de Evedia',
    },
    {
      id: 'pin-luz-torre',
      label: 'Torre de los Espejismos',
      campaignId,
      x: 61,
      y: 46,
      pinKind: 'dungeon_ruin',
      fogState: 'rumor',
      linkedNodeId: 'Olivia Zyltris',
      region: 'Estrecho Central de Brumas',
      rumorTeaser: 'Solo persisten ecos rotos sobre una torre donde el tiempo y los reflejos se quiebran.',
      unlockCriteria: 'Descubrir pistas sobre Azura y el pasado sellado de Olivia.',
    },
    {
      id: 'pin-luz-neverwinter',
      label: 'Sendero de Neverwinter',
      campaignId,
      x: 39,
      y: 25,
      pinKind: 'danger',
      fogState: 'rumor',
      region: 'Paso hacia las Cumbres del Norte',
      rumorTeaser: 'Caravanas han avistado estandartes sospechosos ligados al Culto del Dragón.',
      unlockCriteria: 'Investigar la ruta hacia el norte tras abandonar El Pozo de la Renuncia.',
    },
    {
      id: 'pin-luz-santuario-secret',
      label: 'Santuario Secreto del Eclipse',
      campaignId,
      x: 68,
      y: 23,
      pinKind: 'temple',
      fogState: 'secret',
      region: 'Cráter Oculto de Dracoria',
      rumorTeaser: 'Célula clandestina preparando el rito hacia el Eclipse de Yogthos.',
    },
  ];
}

export function getDefaultPartyPositionForCampaign(
  campaignId: string,
): PartyMapPosition {
  if (campaignId === 'escuadron-umbra') {
    return {
      campaignId,
      label: 'El Gran Bosque (Escuadrón UMBRA)',
      x: 20,
      y: 43,
      linkedNodeId: 'El Gran Bosque Lienzo',
    };
  }
  if (campaignId === 'perseguidores-amanecer') {
    return {
      campaignId,
      label: 'Puerto Libertad (Marisal)',
      x: 45,
      y: 53,
      linkedNodeId: 'Marisal',
    };
  }
  return {
    campaignId,
    label: 'El Pozo de la Renuncia',
    x: 34,
    y: 44,
    linkedNodeId: 'Notas 9-7-26',
  };
}

export function filterMapPinsForPlayer(
  pins: CampaignMapPin[],
  lockReasons: Record<string, NodeLockReason>,
  isGm: boolean,
): CampaignMapPin[] {
  return pins
    .filter((pin) => isGm || pin.fogState !== 'secret')
    .map((pin) => {
      const linkedLower = pin.linkedNodeId?.toLowerCase();
      const lockInfo = linkedLower ? lockReasons[linkedLower] : undefined;
      if (!isGm && (pin.fogState === 'rumor' || Boolean(lockInfo))) {
        return {
          ...pin,
          fogState: 'rumor' as const,
          rumorTeaser:
            pin.rumorTeaser ||
            'Rumores locales mencionan este enclave, pero su crónica aún permanece velada.',
          unlockCriteria: pin.unlockCriteria || lockInfo?.criteria,
        };
      }
      return pin;
    });
}

const DEFAULT_SUB_ATLAS_LEVELS: ReadonlyArray<AtlasMapLevel> = [
  {
    id: 'continent-avaloria',
    parentMapId: 'world-thyrenia',
    parentPinId: 'pin-continent-avaloria',
    name: 'Avaloria',
    scale: 'continent',
    subtitle: 'Continente Oriental · Rutas imperiales, ciudadelas y el paso hacia Nieveterna',
    fogLayer: 'base',
    roads: [
      { fromPinId: 'pin-avaloria-waterdeep', toPinId: 'pin-avaloria-nieveterna', label: 'Camino Real del Norte', kind: 'royal' },
      { fromPinId: 'pin-avaloria-waterdeep', toPinId: 'pin-avaloria-pozo', label: 'Sendero de la Renuncia', kind: 'trail' },
      { fromPinId: 'pin-avaloria-pozo', toPinId: 'pin-avaloria-torre', label: 'Brecha de Brumas', kind: 'trail' },
      { fromPinId: 'pin-avaloria-nieveterna', toPinId: 'pin-avaloria-santuario', label: 'Paso Clandestino', kind: 'secret' },
    ],
    pins: [
      {
        id: 'pin-avaloria-waterdeep',
        mapId: 'continent-avaloria',
        childMapId: 'city-waterdeep',
        label: 'Waterdeep',
        x: 34,
        y: 60,
        pinKind: 'city',
        fogState: 'discovered',
        region: 'Costa Occidental de Avaloria',
        rumorTeaser: 'Gran ciudad portuaria, cruce de gremios, posadas y rutas mercantes.',
      },
      {
        id: 'pin-avaloria-nieveterna',
        mapId: 'continent-avaloria',
        label: 'Ciudadela de Nieveterna',
        x: 68,
        y: 28,
        pinKind: 'city',
        fogState: 'discovered',
        linkedNodeId: 'Avaloria',
        region: 'Altas Mesetas Heladas',
        rumorTeaser: 'Bastión amurallado donde el invierno apenas cede ante la primavera.',
      },
      {
        id: 'pin-avaloria-pozo',
        mapId: 'continent-avaloria',
        label: 'El Pozo de la Renuncia',
        x: 52,
        y: 66,
        pinKind: 'temple',
        fogState: 'discovered',
        linkedNodeId: 'Notas 9-7-26',
        region: 'Corazón de las Sombras',
        rumorTeaser: 'Santuario antiguo que exige una renuncia auténtica a quienes cruzan su umbral.',
      },
      {
        id: 'pin-avaloria-torre',
        mapId: 'continent-avaloria',
        label: 'Torre de los Espejismos',
        x: 76,
        y: 62,
        pinKind: 'dungeon_ruin',
        fogState: 'rumor',
        linkedNodeId: 'Olivia Zyltris',
        region: 'Páramos de Escarcha',
        rumorTeaser: 'Susurros hablan de una torre donde el tiempo y la memoria se reflejan rotos.',
        unlockCriteria: 'Reunir pistas sobre el pasado de Olivia y Azura.',
      },
      {
        id: 'pin-avaloria-santuario',
        mapId: 'continent-avaloria',
        label: 'Enclave del Eclipse',
        x: 84,
        y: 22,
        pinKind: 'danger',
        fogState: 'secret',
        region: 'Grieta de Hielo Negro',
        rumorTeaser: 'Refugio oculto de cultistas ligados al Eclipse de Yogthos.',
      },
    ],
  },
  {
    id: 'city-waterdeep',
    parentMapId: 'continent-avaloria',
    parentPinId: 'pin-avaloria-waterdeep',
    name: 'Waterdeep',
    scale: 'city',
    subtitle: 'Plano Urbano · Barrios, caminos interiores, puerto y salones de la ciudad',
    fogLayer: 'base',
    roads: [
      { fromPinId: 'pin-wd-puerta', toPinId: 'pin-wd-mercado', label: 'Avenida de los Héroes', kind: 'royal' },
      { fromPinId: 'pin-wd-mercado', toPinId: 'pin-wd-puerto', label: 'Calzada del Muelle', kind: 'royal' },
      { fromPinId: 'pin-wd-mercado', toPinId: 'pin-wd-posada', label: 'Callejón del Bronce', kind: 'trail' },
      { fromPinId: 'pin-wd-puerta', toPinId: 'pin-wd-torre', label: 'Ronda de los Sabios', kind: 'trail' },
      { fromPinId: 'pin-wd-posada', toPinId: 'pin-wd-catacumbas', label: 'Túnel Sellado', kind: 'secret' },
    ],
    pins: [
      {
        id: 'pin-wd-puerta',
        mapId: 'city-waterdeep',
        label: 'Puerta de los Héroes',
        x: 50,
        y: 18,
        pinKind: 'landmark',
        fogState: 'discovered',
        region: 'Acceso Norte',
        rumorTeaser: 'Entrada principal para caravanas procedentes del Camino Real.',
      },
      {
        id: 'pin-wd-mercado',
        mapId: 'city-waterdeep',
        label: 'Mercado del Bronce',
        x: 48,
        y: 48,
        pinKind: 'city',
        fogState: 'discovered',
        region: 'Distrito Central',
        rumorTeaser: 'Plaza de trueque de monedas, pergaminos, componentes de Maná y especias.',
      },
      {
        id: 'pin-wd-puerto',
        mapId: 'city-waterdeep',
        label: 'Barrio del Puerto',
        x: 20,
        y: 66,
        pinKind: 'landmark',
        fogState: 'discovered',
        region: 'Muelles Occidentales',
        rumorTeaser: 'Embarcaderos con barcos rumbo a Marisal y Evedia.',
      },
      {
        id: 'pin-wd-posada',
        mapId: 'city-waterdeep',
        label: 'Posada del Cáliz de Qoketh',
        x: 68,
        y: 64,
        pinKind: 'landmark',
        fogState: 'discovered',
        region: 'Barrio Artesano',
        rumorTeaser: 'Refugio habitual de aventureros donde siempre corre qoketh caliente y rumores.',
      },
      {
        id: 'pin-wd-torre',
        mapId: 'city-waterdeep',
        label: 'Torre del Consejo Arcano',
        x: 76,
        y: 30,
        pinKind: 'temple',
        fogState: 'rumor',
        linkedNodeId: 'Maná',
        region: 'Colina Alta',
        rumorTeaser: 'Solo los portadores de sello arcano conocen las salas de estudio superiores.',
        unlockCriteria: 'Obtener salvoconducto del Consejo o invitación de un archimago.',
      },
      {
        id: 'pin-wd-catacumbas',
        mapId: 'city-waterdeep',
        label: 'Catacumbas del Velo',
        x: 58,
        y: 82,
        pinKind: 'dungeon_ruin',
        fogState: 'secret',
        region: 'Subsuelo de Waterdeep',
        rumorTeaser: 'Red subterránea usada por contrabandistas y espías del Culto.',
      },
    ],
  },
  {
    id: 'continent-evedia',
    parentMapId: 'world-thyrenia',
    parentPinId: 'pin-continent-evedia',
    name: 'Evedia',
    scale: 'continent',
    subtitle: 'Continente Silvano · Senderos ocultos del Gran Bosque y ríos élficos',
    fogLayer: 'asimetrica',
    allowedRaces: ['elfo'],
    allowedFactions: ['Escuadrón UMBRA'],
    unlockCriteria: 'Solo accesible por linaje élfico, miembros del Escuadrón UMBRA o mediante guía silvano.',
    roads: [
      { fromPinId: 'pin-evedia-bosque', toPinId: 'pin-evedia-santuario', label: 'Senda de Hojas Plateadas', kind: 'trail' },
      { fromPinId: 'pin-evedia-bosque', toPinId: 'pin-evedia-puerto', label: 'Río de Cristal', kind: 'sea' },
    ],
    pins: [
      {
        id: 'pin-evedia-bosque',
        mapId: 'continent-evedia',
        label: 'El Gran Bosque',
        x: 46,
        y: 44,
        pinKind: 'landmark',
        fogState: 'discovered',
        linkedNodeId: 'Evedia',
        region: 'Corazón Silvano',
      },
      {
        id: 'pin-evedia-santuario',
        mapId: 'continent-evedia',
        label: 'Claro de Gaia',
        x: 68,
        y: 34,
        pinKind: 'temple',
        fogState: 'discovered',
        linkedNodeId: 'Gaia',
        region: 'Bosque Antiguo',
      },
      {
        id: 'pin-evedia-puerto',
        mapId: 'continent-evedia',
        label: 'Embarcadero de Bruma',
        x: 28,
        y: 68,
        pinKind: 'city',
        fogState: 'rumor',
        region: 'Costa Occidental',
        rumorTeaser: 'Rutas discretas hacia el archipiélago de Marisal.',
      },
    ],
  },
  {
    id: 'continent-dracoria',
    parentMapId: 'world-thyrenia',
    parentPinId: 'pin-continent-dracoria',
    name: 'Dracoria',
    scale: 'continent',
    subtitle: 'Cumbres Volcánicas del Norte · Cartografía restringida por Niebla de Guerra',
    fogLayer: 'progresiva',
    requiredNodeId: 'Dracoria',
    unlockCriteria: 'El Director de Juego debe revelar el mapa detallado de Dracoria en la Niebla de Guerra Estratificada.',
    roads: [
      { fromPinId: 'pin-dracoria-paso', toPinId: 'pin-dracoria-caldera', label: 'Desfiladero de Ceniza', kind: 'trail' },
    ],
    pins: [
      {
        id: 'pin-dracoria-paso',
        mapId: 'continent-dracoria',
        label: 'Paso del Wyrm',
        x: 40,
        y: 64,
        pinKind: 'danger',
        fogState: 'discovered',
        linkedNodeId: 'Dracoria',
        region: 'Frontera Sur',
      },
      {
        id: 'pin-dracoria-caldera',
        mapId: 'continent-dracoria',
        label: 'Caldera de Ignar',
        x: 62,
        y: 32,
        pinKind: 'temple',
        fogState: 'rumor',
        region: 'Cumbres Ardientes',
        rumorTeaser: 'Forjas ancestrales donde duermen juramentos de fuego.',
      },
    ],
  },
];

export function buildAtlasMapsForView(params: {
  campaignId: string;
  worldPins: CampaignMapPin[];
  character: CharacterContext;
  revealedProgressiveNodeIds: string[];
  lockReasons: Record<string, NodeLockReason>;
  isGm: boolean;
  customMapImages?: Record<string, string>;
}): AtlasMapViewLevel[] {
  const {
    campaignId,
    worldPins,
    character,
    revealedProgressiveNodeIds,
    lockReasons,
    isGm,
    customMapImages = {},
  } = params;

  const revealedSet = new Set(
    revealedProgressiveNodeIds.map((id) => id.toLowerCase()),
  );
  const charRace = character.race.toLowerCase();
  const charFactions = new Set(character.factions.map((f) => f.toLowerCase()));

  const worldLevel: AtlasMapViewLevel = {
    id: 'world-thyrenia',
    name: 'Planisferio de Thyrenia',
    scale: 'world',
    subtitle: 'Mapa global · Toca un continente para explorar sus rutas y ciudades',
    imageFile: customMapImages['world-thyrenia'] || 'image1.jpg',
    fogLayer: 'base',
    isUnlocked: true,
    roads: [],
    pins: filterMapPinsForPlayer(
      worldPins.filter((p) => !p.mapId || p.mapId === 'world-thyrenia'),
      lockReasons,
      isGm,
    ),
  };

  const subLevels: AtlasMapViewLevel[] = DEFAULT_SUB_ATLAS_LEVELS.map((lvl) => {
    let isUnlocked = isGm || lvl.fogLayer === 'base';
    if (!isUnlocked && lvl.fogLayer === 'asimetrica') {
      const raceOk =
        lvl.allowedRaces?.some((r) => r.toLowerCase() === charRace) ?? false;
      const factionOk =
        lvl.allowedFactions?.some((f) => charFactions.has(f.toLowerCase())) ??
        false;
      isUnlocked = raceOk || factionOk;
    }
    if (!isUnlocked && lvl.fogLayer === 'progresiva') {
      isUnlocked =
        revealedSet.has(lvl.id.toLowerCase()) ||
        (lvl.requiredNodeId
          ? revealedSet.has(lvl.requiredNodeId.toLowerCase())
          : false);
    }

    const extraPinsForLevel = worldPins.filter((p) => p.mapId === lvl.id);
    const mergedPins: CampaignMapPin[] = [
      ...lvl.pins.map((p) => ({ ...p, campaignId })),
      ...extraPinsForLevel,
    ];

    return {
      id: lvl.id,
      parentMapId: lvl.parentMapId,
      parentPinId: lvl.parentPinId,
      name: lvl.name,
      scale: lvl.scale,
      subtitle: lvl.subtitle,
      imageFile: customMapImages[lvl.id] || lvl.imageFile,
      fogLayer: lvl.fogLayer,
      isUnlocked,
      lockReason: isUnlocked
        ? undefined
        : lvl.unlockCriteria ||
          'Mapa detallado oculto por la Niebla de Guerra Estratificada.',
      roads: isUnlocked
        ? isGm
          ? lvl.roads
          : lvl.roads.filter((r) => r.kind !== 'secret')
        : [],
      pins: isUnlocked
        ? filterMapPinsForPlayer(mergedPins, lockReasons, isGm)
        : [],
    };
  });

  return [worldLevel, ...subLevels];
}

export type QuestKind = 'main_quest' | 'side_quest' | 'rumor';
export type QuestStatus = 'active' | 'completed' | 'failed' | 'proposed_rumor';

export interface QuestObjective {
  text: string;
  done: boolean;
}

export interface CampaignQuest {
  id: string;
  campaignId: string;
  title: string;
  kind: QuestKind;
  status: QuestStatus;
  giverNodeId?: string;
  locationNodeId?: string;
  summary: string;
  objectives: QuestObjective[];
  proposedBy?: string;
}

export function getDefaultQuestsForCampaign(
  campaignId: string,
): CampaignQuest[] {
  if (campaignId === 'escuadron-umbra') {
    return [
      {
        id: 'quest-umbra-bosque',
        campaignId,
        title: 'Grietas en El Gran Bosque',
        kind: 'main_quest',
        status: 'active',
        giverNodeId: "Gerard D' Arc",
        locationNodeId: 'El Gran Bosque Lienzo',
        summary:
          'Desentrañar la fachada mágica del reino élfico gobernado por nobles inmortales tras las tensiones del Salón de los Susurros.',
        objectives: [
          { text: 'Infiltrar los puestos fronterizos sin alertar al consejo élfico.', done: true },
          { text: 'Identificar qué facción respalda a los nobles inmortales.', done: false },
        ],
      },
      {
        id: 'quest-umbra-babas',
        campaignId,
        title: 'El Eco de la Muerte de Babas',
        kind: 'rumor',
        status: 'active',
        locationNodeId: 'Notas Mercenarios',
        summary:
          'Mercenarios rivales comentan en voz baja que los antiguos contratos alrededor de Babas siguen activos.',
        objectives: [
          { text: 'Rastrear quién pagó realmente el último contrato.', done: false },
        ],
      },
    ];
  }

  if (campaignId === 'perseguidores-amanecer') {
    return [
      {
        id: 'quest-marisal-ojo',
        campaignId,
        title: 'Los Guerreros del Ojo Carmesí',
        kind: 'main_quest',
        status: 'active',
        giverNodeId: 'Marisal',
        locationNodeId: 'Marisal',
        summary:
          'Taynara busca pistas sobre los guerreros con armaduras marcadas por un ojo de tentáculos carmesíes entre las islas de Marisal.',
        objectives: [
          { text: 'Asegurar provisiones y nave en Puerto Libertad con ayuda de Salazar.', done: true },
          { text: 'Localizar el arrecife mencionado por los pescadores en marea baja.', done: false },
        ],
      },
    ];
  }

  // luz-de-medialuna
  return [
    {
      id: 'quest-luz-pozo',
      campaignId,
      title: 'El Juramento en El Pozo de la Renuncia',
      kind: 'main_quest',
      status: 'active',
      locationNodeId: 'Notas 9-7-26',
      summary:
        'Comprender las consecuencias del encuentro en El Pozo de la Renuncia y su conexión con las alianzas recientes desde Eryndor.',
      objectives: [
        { text: 'Investigar las marcas del sello antiguo junto al Pozo.', done: true },
        { text: 'Decidir el rumbo de la party hacia el norte en Verdalis.', done: false },
      ],
    },
    {
      id: 'quest-luz-dragones',
      campaignId,
      title: 'Rastros del Culto del Dragón hacia Neverwinter',
      kind: 'side_quest',
      status: 'active',
      locationNodeId: 'Notas 27-12-25',
      summary:
        'Tras cruzar caminos con Kaelion y enfrentar la sombra del Culto del Dragón en el bosque, vigilar sus próximos movimientos en la ruta norte.',
      objectives: [
        { text: 'Sobrevivir a la emboscada dracónica junto a Kaelion.', done: true },
        { text: 'Recopilar información sobre envíos arcanos sospechosos en el camino.', done: false },
      ],
    },
    {
      id: 'quest-luz-torre',
      campaignId,
      title: 'Los Espejismos de Azura',
      kind: 'rumor',
      status: 'active',
      giverNodeId: 'Olivia Zyltris',
      locationNodeId: 'Olivia Zyltris',
      summary:
        'Fragmentos de memoria sugieren que la Torre de los Espejismos guarda la verdad sobre Azura y el pasado olvidado de Olivia.',
      objectives: [
        { text: 'Encontrar una referencia cartográfica o arcana a la Torre.', done: false },
      ],
    },
  ];
}

export type RelationKind =
  | 'ally'
  | 'rival_enemy'
  | 'suspicion'
  | 'patron_loyalty'
  | 'mystery_blood';

export interface EntityRelationship {
  id: string;
  campaignId: string;
  sourceId: string;
  targetId: string;
  relationKind: RelationKind;
  label: string;
  status: 'confirmed' | 'proposed';
  proposedBy?: string;
}

export function getDefaultRelationshipsForCampaign(
  campaignId: string,
): EntityRelationship[] {
  if (campaignId === 'escuadron-umbra') {
    return [
      {
        id: 'rel-umbra-1',
        campaignId,
        sourceId: "Gerard D' Arc",
        targetId: 'Ack Droka',
        relationKind: 'ally',
        label: 'Compañeros de escuadrón',
        status: 'confirmed',
      },
      {
        id: 'rel-umbra-2',
        campaignId,
        sourceId: "Gerard D' Arc",
        targetId: 'Orianna',
        relationKind: 'patron_loyalty',
        label: 'Pacto operativo en UMBRA',
        status: 'confirmed',
      },
      {
        id: 'rel-umbra-3',
        campaignId,
        sourceId: "Gerard D' Arc",
        targetId: 'El Gran Bosque Lienzo',
        relationKind: 'suspicion',
        label: 'Vigila a los nobles inmortales',
        status: 'confirmed',
      },
    ];
  }

  if (campaignId === 'perseguidores-amanecer') {
    return [
      {
        id: 'rel-marisal-1',
        campaignId,
        sourceId: 'Taynara Valdirene',
        targetId: 'Salazar de Astora',
        relationKind: 'ally',
        label: 'Socios de travesía',
        status: 'confirmed',
      },
      {
        id: 'rel-marisal-2',
        campaignId,
        sourceId: 'Taynara Valdirene',
        targetId: 'Marisal',
        relationKind: 'mystery_blood',
        label: 'Rastrea el Ojo Carmesí',
        status: 'confirmed',
      },
    ];
  }

  return [
    {
      id: 'rel-luz-1',
      campaignId,
      sourceId: 'Olivia Zyltris',
      targetId: 'Larissa Windriver',
      relationKind: 'ally',
      label: 'Aliadas en Luz de Medialuna',
      status: 'confirmed',
    },
    {
      id: 'rel-luz-2',
      campaignId,
      sourceId: 'Olivia Zyltris',
      targetId: 'Molder',
      relationKind: 'ally',
      label: 'Camaradas de guardia',
      status: 'confirmed',
    },
    {
      id: 'rel-luz-3',
      campaignId,
      sourceId: 'Larissa Windriver',
      targetId: 'Selene',
      relationKind: 'patron_loyalty',
      label: 'Devoción y guía lunar',
      status: 'confirmed',
    },
    {
      id: 'rel-luz-4',
      campaignId,
      sourceId: 'Olivia Zyltris',
      targetId: 'Azura',
      relationKind: 'suspicion',
      label: 'Traición sellada / Espejismos',
      status: 'confirmed',
    },
    {
      id: 'rel-luz-5',
      campaignId,
      sourceId: 'Szaelra',
      targetId: 'Nyxara',
      relationKind: 'patron_loyalty',
      label: 'Devoción nocturna en Eryndor',
      status: 'confirmed',
    },
    {
      id: 'rel-luz-6',
      campaignId,
      sourceId: 'Luz de Medialuna',
      targetId: 'Culto del Dragón',
      relationKind: 'rival_enemy',
      label: 'Amenaza abierta hacia el norte',
      status: 'confirmed',
    },
  ];
}

export interface ManualSessionLogEntry {
  id: string;
  campaignId: string;
  dateLabel: string;
  locationNodeId: string;
  title: string;
  summary: string;
  authorRole: 'gm' | 'player';
  createdAt: string;
}

function markdownToSimpleHtml(raw: string): string {
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      continue;
    }

    const withInline = trimmed
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, alias) => `<strong>${alias || t}</strong>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    if (trimmed.startsWith('### ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${withInline.slice(4)}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h2>${withInline.slice(3)}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h1>${withInline.slice(2)}</h1>`);
    } else if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${withInline.replace(/^[-*]\s+/, '')}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<p>${withInline}</p>`);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

/**
 * Convierte cualquier Nodo de Lore, Misión o Sesión en un JSON importable
 * como JournalEntry en FoundryVTT (v11/v12 pages[]), aplicando aislamiento Zero-Trust.
 */
export function buildFoundryVttJournalJson(params: {
  title: string;
  publicMarkdown: string;
  dmSecretNotes?: string;
  includeGmSecrets?: boolean;
  tags?: string[];
  linkedImage?: string;
  cardType?: string;
  cardFields?: Record<string, string>;
}): Record<string, unknown> {
  const safePublic = SecretRedactor.redact(
    VaultContextCompiler.stripObsidianComments(params.publicMarkdown),
  );
  const fieldsHtml =
    params.cardFields && Object.keys(params.cardFields).length > 0
      ? `<p>${Object.entries(params.cardFields)
          .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
          .join(' · ')}</p><hr/>`
      : '';

  const pages: Array<Record<string, unknown>> = [
    {
      name: params.title,
      type: 'text',
      title: { show: true, level: 1 },
      text: {
        format: 1,
        content: `${fieldsHtml}${markdownToSimpleHtml(safePublic)}`,
      },
      ownership: { default: 2 },
    },
  ];

  const cleanSecret = params.dmSecretNotes?.trim();
  if (params.includeGmSecrets === true && cleanSecret) {
    pages.push({
      name: `${params.title} — Secretos del DM`,
      type: 'text',
      title: { show: true, level: 1 },
      text: {
        format: 1,
        content: markdownToSimpleHtml(SecretRedactor.redact(cleanSecret)),
      },
      ownership: { default: 0 },
    });
  }

  return {
    name: params.title,
    ownership: { default: 2 },
    pages,
    flags: {
      thyrenia: {
        source: 'thyrenia-engine',
        cardType: params.cardType || 'rule_lore',
        cardFields: params.cardFields || {},
        tags: params.tags || [],
        linkedImage: params.linkedImage || '',
      },
    },
  };
}

/**
 * Construye un Compendio JSON masivo para FoundryVTT v11/v12 con carpetas,
 * JournalEntries (respetando aislamiento Zero-Trust salvo flag GM explícito),
 * Actores y Escena cartográfica con pines.
 */
export function buildFoundryVttCompendiumBundle(params: {
  campaignId: string;
  campaignName: string;
  journals: Array<{
    folderPath: string;
    entry: Record<string, unknown>;
  }>;
  actors: Array<Record<string, unknown>>;
  mapPins: CampaignMapPin[];
  includeGmSecrets: boolean;
}): Record<string, unknown> {
  const folderSet = new Set<string>();
  for (const j of params.journals) {
    const clean = j.folderPath.replace(/\\/g, '/').trim();
    if (!clean) continue;
    const segments = clean.split('/');
    for (let i = 1; i <= segments.length; i++) {
      folderSet.add(segments.slice(0, i).join('/'));
    }
  }

  const folders = Array.from(folderSet)
    .sort((a, b) => a.localeCompare(b))
    .map((fullPath, idx) => {
      const parts = fullPath.split('/');
      const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      return {
        _id: `thyrenia-folder-${idx + 1}`,
        name: parts[parts.length - 1],
        type: 'JournalEntry',
        fullPath,
        parentPath,
      };
    });

  const folderIdByPath = new Map(folders.map((f) => [f.fullPath, f._id]));

  const journals = params.journals.map((j, idx) => {
    const clean = j.folderPath.replace(/\\/g, '/').trim();
    return {
      _id: `thyrenia-journal-${idx + 1}`,
      folder: folderIdByPath.get(clean) ?? null,
      folderPath: clean,
      ...j.entry,
    };
  });

  const sceneNotes = params.mapPins.map((pin, idx) => ({
    _id: `thyrenia-note-${idx + 1}`,
    label: pin.label,
    x: Math.round((pin.x / 100) * 4000),
    y: Math.round((pin.y / 100) * 2800),
    global: pin.fogState === 'discovered',
    flags: {
      thyrenia: {
        pinKind: pin.pinKind,
        fogState: pin.fogState,
        linkedNodeId: pin.linkedNodeId || '',
        rumorTeaser: pin.rumorTeaser || '',
      },
    },
  }));

  return {
    format: 'thyrenia-foundryvtt-bundle-v1',
    exportedAt: new Date().toISOString(),
    campaignId: params.campaignId,
    campaignName: params.campaignName,
    includesGmSecrets: params.includeGmSecrets,
    stats: {
      foldersCount: folders.length,
      journalsCount: journals.length,
      actorsCount: params.actors.length,
      mapPinsCount: sceneNotes.length,
    },
    folders,
    journals,
    actors: params.actors,
    mapScene: {
      name: `Atlas de Thyrenia — ${params.campaignName}`,
      background: { src: 'worlds/thyrenia/images/image1.jpg' },
      width: 4000,
      height: 2800,
      notes: sceneNotes,
    },
  };
}
