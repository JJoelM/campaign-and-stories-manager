import type { AbilityKey, ThyreniaCharacterSheet, ThyreniaSkillEntry } from '../types';

export const ABILITY_META: Array<{
  key: AbilityKey;
  label: string;
  full: string;
}> = [
  { key: 'str', label: 'FUE', full: 'Fuerza' },
  { key: 'dex', label: 'DES', full: 'Destreza' },
  { key: 'con', label: 'CON', full: 'Constitución' },
  { key: 'int', label: 'INT', full: 'Inteligencia' },
  { key: 'wis', label: 'SAB', full: 'Sabiduría' },
  { key: 'cha', label: 'CAR', full: 'Carisma' },
];

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  str: 'FUE',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};

export function abilityMod(score: number): number {
  return Math.floor((Number(score || 10) - 10) / 2);
}

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * Calcula el bonificador total de una habilidad de Thyrenia:
 * Mod. Estadística + Bon. Proficiencia (si aplica) + Nivel de Rango + (+2 si es Hab. de Clase con Rango >= 1).
 */
export function computeSkillBreakdown(
  sheet: ThyreniaCharacterSheet,
  skill: ThyreniaSkillEntry,
): {
  abilityModValue: number;
  profBonus: number;
  rankBonus: number;
  classBonus: number;
  total: number;
} {
  const abilityModValue = abilityMod(sheet.abilities[skill.defaultAbility]);
  const profBonus = skill.proficient ? sheet.proficiencyBonus : 0;
  const rankBonus = skill.rank || 0;
  const classBonus = skill.isClassSkill && rankBonus >= 1 ? 2 : 0;
  return {
    abilityModValue,
    profBonus,
    rankBonus,
    classBonus,
    total: abilityModValue + profBonus + rankBonus + classBonus,
  };
}

/** Rellena valores por defecto si el servidor/cache devolviera una ficha parcial. */
export function normalizeCharacterSheet(
  raw: ThyreniaCharacterSheet,
): ThyreniaCharacterSheet {
  return {
    ...raw,
    background: raw.background ?? '',
    alignment: raw.alignment ?? '',
    playerName: raw.playerName ?? '',
    experiencePoints: raw.experiencePoints ?? 0,
    inspiration: Boolean(raw.inspiration),
    speed: raw.speed || '30 pies',
    hp: {
      current: raw.hp?.current ?? 10,
      max: raw.hp?.max ?? 10,
      temp: raw.hp?.temp ?? 0,
    },
    hitDice: raw.hitDice ?? { total: `${raw.level || 1}d8`, used: 0 },
    deathSaves: raw.deathSaves ?? { successes: 0, failures: 0 },
    auraPoints: raw.auraPoints ?? { current: 0, max: 0 },
    savingThrowProficiencies: raw.savingThrowProficiencies ?? {
      str: false,
      dex: false,
      con: false,
      int: false,
      wis: false,
      cha: false,
    },
    desperateActionUsed: Boolean(raw.desperateActionUsed),
    personalityTraits: raw.personalityTraits ?? '',
    ideals: raw.ideals ?? '',
    bonds: raw.bonds ?? '',
    proficiencies: raw.proficiencies ?? {
      armors: { light: false, medium: false, heavy: false, shield: false },
      weapons: { simple: true, martial: false, other: '' },
      tools: '',
      languages: 'Común',
    },
    attacks: raw.attacks ?? [],
    featuresAndTraits: raw.featuresAndTraits ?? '',
    equipment: raw.equipment ?? '',
    inventory: raw.inventory ?? '',
    coins: raw.coins ?? { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 },
    appearance: raw.appearance ?? {
      age: '',
      height: '',
      weight: '',
      eyes: '',
      skin: '',
      hair: '',
      portraitImage: '',
      symbolName: '',
      symbolDescription: '',
    },
    milonga: raw.milonga ?? '',
    alliesAndOrganizations: raw.alliesAndOrganizations ?? '',
    additionalFeatures: raw.additionalFeatures ?? '',
    treasure: raw.treasure ?? '',
    spellcasting: raw.spellcasting ?? {
      castingClass: '',
      castingAbility: 'cha',
      levels: [],
    },
  };
}
