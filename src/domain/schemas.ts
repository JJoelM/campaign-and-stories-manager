import { z } from 'zod';

export const KnowledgeLayerSchema = z.enum([
  'base',
  'asimetrica',
  'progresiva',
  'dm_secret',
]);
export type KnowledgeLayer = z.infer<typeof KnowledgeLayerSchema>;

export const AsymmetricRequirementsSchema = z.object({
  races: z.array(z.string()).default([]),
  classes: z.array(z.string()).default([]),
  factions: z.array(z.string()).default([]),
  characterIds: z.array(z.string()).default([]),
});
export type AsymmetricRequirements = z.infer<typeof AsymmetricRequirementsSchema>;

export const CharacterContextSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  race: z.string().min(1),
  class: z.string().min(1),
  factions: z.array(z.string()).default([]),
  skillModifiers: z.record(z.string(), z.number()).default({}),
});
export type CharacterContext = z.infer<typeof CharacterContextSchema>;

export const PartyStateSchema = z.object({
  campaignId: z.string().min(1),
  revealedProgressiveNodeIds: z.array(z.string()).default([]),
  factionReputation: z.record(z.string(), z.number()).default({}),
});
export type PartyState = z.infer<typeof PartyStateSchema>;

export const ForbiddenTermRuleSchema = z.object({
  forbidden: z.string(),
  thyrenianEquivalent: z.string(),
});
export type ForbiddenTermRule = z.infer<typeof ForbiddenTermRuleSchema>;

export const LoreCardTypeSchema = z.enum([
  'character',
  'location',
  'faction',
  'quest_clue',
  'session',
  'chapter',
  'deity',
  'rule_lore',
]);
export type LoreCardType = z.infer<typeof LoreCardTypeSchema>;

export const LoreNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  relativePath: z.string(),
  layer: KnowledgeLayerSchema,
  asymmetricRequirements: AsymmetricRequirementsSchema.optional(),
  sanitizedContent: z.string(),
  outgoingLinks: z.array(z.string()),
  tags: z.array(z.string()),
  image: z.string().optional(),
  cardType: LoreCardTypeSchema.optional(),
  isSkeleton: z.boolean().optional(),
  cardFields: z.record(z.string(), z.string()).optional(),
});
export type LoreNode = z.infer<typeof LoreNodeSchema>;

export const CompiledVaultViewSchema = z.object({
  activeCharacter: CharacterContextSchema,
  visibleNodes: z.array(LoreNodeSchema),
  adjacencyGraph: z.record(z.string(), z.array(z.string())),
  forbiddenTerms: z.array(ForbiddenTermRuleSchema),
  stats: z.object({
    totalScanned: z.number(),
    baseCount: z.number(),
    asymmetricVisibleCount: z.number(),
    progressiveVisibleCount: z.number(),
    hiddenOrSecretCount: z.number(),
  }),
});
export type CompiledVaultView = z.infer<typeof CompiledVaultViewSchema>;

export const SceneStateSchema = z.object({
  id: z.string().min(1),
  locationNodeId: z.string().min(1),
  description: z.string().min(1),
  environmentFlags: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  activeThreats: z.array(z.string()).default([]),
  turnNumber: z.number().int().nonnegative().default(1),
});
export type SceneState = z.infer<typeof SceneStateSchema>;

export const ProposedCanonUpdateSchema = z.object({
  title: z.string().min(1),
  category: z.enum([
    'new_npc',
    'faction_shift',
    'location_event',
    'chronicle_entry',
  ]),
  summary: z.string().min(1),
  targetSubfolder: z.string().min(1),
  markdownContent: z.string().min(1),
});
export type ProposedCanonUpdate = z.infer<typeof ProposedCanonUpdateSchema>;

export const StateTransitionOutputSchema = z.object({
  narration: z
    .string()
    .min(1)
    .describe(
      'Narrativa inmersiva para los jugadores en español, respetando estrictamente el tono y vocabulario de Thyrenia sin términos prohibidos.',
    ),
  mechanicalResolution: z.object({
    triggeredCheck: z.boolean(),
    skillOrAttribute: z.string().optional(),
    difficultyClass: z.number().int().optional(),
    rollResult: z.number().int().optional(),
    outcome: z
      .enum(['critical_success', 'success', 'failure', 'critical_failure'])
      .optional(),
  }),
  stateMutations: z.object({
    newlyRevealedNodeIds: z.array(z.string()).default([]),
    updatedEnvironmentFlags: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .default({}),
    factionReputationDeltas: z.record(z.string(), z.number()).default({}),
  }),
  branchingChoices: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        intentType: z.enum([
          'explore',
          'social',
          'combat',
          'arcane',
          'custom',
        ]),
      }),
    )
    .min(1),
  proposedCanonUpdates: z.array(ProposedCanonUpdateSchema).default([]),
});
export type StateTransitionOutput = z.infer<typeof StateTransitionOutputSchema>;

export const CanonProposalRecordSchema = ProposedCanonUpdateSchema.extend({
  id: z.string(),
  sceneId: z.string(),
  createdAt: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  writtenFilePath: z.string().optional(),
});
export type CanonProposalRecord = z.infer<typeof CanonProposalRecordSchema>;

export const GeminiTaskRoleSchema = z.enum([
  'fast_loop',
  'deep_arbitration',
  'canon_synthesis',
  'eval_judge',
]);
export type GeminiTaskRole = z.infer<typeof GeminiTaskRoleSchema>;

export const TransitionEvalVerdictSchema = z.object({
  passed: z.boolean(),
  loreCoherenceScore: z.number().min(0).max(1),
  vocabularyCompliance: z.boolean(),
  zeroTrustIsolationPassed: z.boolean(),
  judgeModelId: z.string().min(1),
  notes: z.string().default(''),
});
export type TransitionEvalVerdict = z.infer<typeof TransitionEvalVerdictSchema>;

export const ChronicleSynthesisOutputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  targetSubfolder: z.string().min(1),
  markdownContent: z.string().min(1),
  keyEvents: z.array(z.string()).default([]),
});
export type ChronicleSynthesisOutput = z.infer<
  typeof ChronicleSynthesisOutputSchema
>;

export const ThyreniaCalendarDateSchema = z.object({
  dayOfWeek: z.string().min(1),
  dayOfMonth: z.number().int().min(1).max(30),
  monthIndex: z.number().int().min(0).max(11),
  monthName: z.string().min(1),
  season: z.enum(['Invierno', 'Primavera', 'Verano', 'Otoño']),
  yearDgd: z.number().int().nonnegative(),
  divineInfluence: z.string().min(1),
  formatted: z.string().min(1),
});
export type ThyreniaCalendarDate = z.infer<typeof ThyreniaCalendarDateSchema>;

export const ThyreniaSkillKeySchema = z.enum([
  'arcana',
  'atletismo',
  'conduccion',
  'elaboracion',
  'hurto',
  'influencia',
  'interpretacion',
  'naturaleza',
  'percepcion',
  'sigilo',
  'sociedad',
]);
export type ThyreniaSkillKey = z.infer<typeof ThyreniaSkillKeySchema>;

export const ThyreniaSkillEntrySchema = z.object({
  key: ThyreniaSkillKeySchema,
  label: z.string().min(1),
  defaultAbility: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
  proficient: z.boolean().default(false),
  isClassSkill: z.boolean().default(false),
  rank: z.number().int().nonnegative().default(0),
});
export type ThyreniaSkillEntry = z.infer<typeof ThyreniaSkillEntrySchema>;

export const ThyreniaBeliefSchema = z.object({
  text: z.string().min(1),
  markedThisSession: z.boolean().default(false),
  resolved: z.boolean().default(false),
});

export const ThyreniaAttackEntrySchema = z.object({
  name: z.string().default(''),
  attackBonus: z.string().default('+0'),
  damage: z.string().default('1d6'),
  damageType: z.string().default(''),
});

export const ThyreniaSpellEntrySchema = z.object({
  name: z.string().default(''),
  prepared: z.boolean().default(false),
  castTime: z.string().default('1 acción'),
  damageOrEffect: z.string().default(''),
  ritual: z.boolean().default(false),
  concentration: z.boolean().default(false),
});

export const ThyreniaSpellLevelSchema = z.object({
  level: z.number().int().min(0).max(9),
  slotsTotal: z.number().int().nonnegative().default(0),
  slotsUsed: z.number().int().nonnegative().default(0),
  spells: z.array(ThyreniaSpellEntrySchema).default([]),
});

const AbilityBooleanMapSchema = z
  .object({
    str: z.boolean().default(false),
    dex: z.boolean().default(false),
    con: z.boolean().default(false),
    int: z.boolean().default(false),
    wis: z.boolean().default(false),
    cha: z.boolean().default(false),
  })
  .default({
    str: false,
    dex: false,
    con: false,
    int: false,
    wis: false,
    cha: false,
  });

export const ThyreniaCharacterSheetSchema = z.object({
  characterId: z.string().min(1),
  name: z.string().min(1),
  race: z.string().min(1),
  class: z.string().min(1),
  level: z.number().int().min(1).max(20).default(3),
  background: z.string().default(''),
  alignment: z.string().default(''),
  playerName: z.string().default(''),
  experiencePoints: z.number().int().nonnegative().default(0),
  proficiencyBonus: z.number().int().min(2).max(6).default(2),
  inspiration: z.boolean().default(false),
  speed: z.string().default('30 pies'),
  hp: z.object({
    current: z.number().int().nonnegative(),
    max: z.number().int().positive(),
    temp: z.number().int().nonnegative().default(0),
  }),
  hitDice: z
    .object({
      total: z.string().default('3d8'),
      used: z.number().int().nonnegative().default(0),
    })
    .default({ total: '3d8', used: 0 }),
  deathSaves: z
    .object({
      successes: z.number().int().min(0).max(3).default(0),
      failures: z.number().int().min(0).max(3).default(0),
    })
    .default({ successes: 0, failures: 0 }),
  armorClass: z.number().int().positive().default(13),
  mana: z.object({
    current: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  }),
  auraPoints: z
    .object({
      current: z.number().int().nonnegative().default(0),
      max: z.number().int().nonnegative().default(0),
    })
    .default({ current: 0, max: 0 }),
  abilities: z.object({
    str: z.number().int().min(1).max(30),
    dex: z.number().int().min(1).max(30),
    con: z.number().int().min(1).max(30),
    int: z.number().int().min(1).max(30),
    wis: z.number().int().min(1).max(30),
    cha: z.number().int().min(1).max(30),
  }),
  savingThrowProficiencies: AbilityBooleanMapSchema,
  fortunePoints: z.number().int().nonnegative().default(2),
  destinyPoints: z.number().int().nonnegative().default(1),
  desperateActionUsed: z.boolean().default(false),
  beliefs: z.array(ThyreniaBeliefSchema).default([]),
  flaws: z.array(z.string()).default([]),
  personalityTraits: z.string().default(''),
  ideals: z.string().default(''),
  bonds: z.string().default(''),
  skills: z.array(ThyreniaSkillEntrySchema),
  proficiencies: z
    .object({
      armors: z
        .object({
          light: z.boolean().default(false),
          medium: z.boolean().default(false),
          heavy: z.boolean().default(false),
          shield: z.boolean().default(false),
        })
        .default({ light: false, medium: false, heavy: false, shield: false }),
      weapons: z
        .object({
          simple: z.boolean().default(true),
          martial: z.boolean().default(false),
          other: z.string().default(''),
        })
        .default({ simple: true, martial: false, other: '' }),
      tools: z.string().default(''),
      languages: z.string().default('Común'),
    })
    .default({
      armors: { light: false, medium: false, heavy: false, shield: false },
      weapons: { simple: true, martial: false, other: '' },
      tools: '',
      languages: 'Común',
    }),
  attacks: z.array(ThyreniaAttackEntrySchema).default([]),
  featuresAndTraits: z.string().default(''),
  equipment: z.string().default(''),
  inventory: z.string().default(''),
  coins: z
    .object({
      pc: z.number().int().nonnegative().default(0),
      pp: z.number().int().nonnegative().default(0),
      pe: z.number().int().nonnegative().default(0),
      po: z.number().int().nonnegative().default(0),
      ppt: z.number().int().nonnegative().default(0),
    })
    .default({ pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 }),
  appearance: z
    .object({
      age: z.string().default(''),
      height: z.string().default(''),
      weight: z.string().default(''),
      eyes: z.string().default(''),
      skin: z.string().default(''),
      hair: z.string().default(''),
      portraitImage: z.string().default(''),
      symbolName: z.string().default(''),
      symbolDescription: z.string().default(''),
    })
    .default({
      age: '',
      height: '',
      weight: '',
      eyes: '',
      skin: '',
      hair: '',
      portraitImage: '',
      symbolName: '',
      symbolDescription: '',
    }),
  milonga: z.string().default(''),
  alliesAndOrganizations: z.string().default(''),
  additionalFeatures: z.string().default(''),
  treasure: z.string().default(''),
  spellcasting: z
    .object({
      castingClass: z.string().default(''),
      castingAbility: z.enum(['int', 'wis', 'cha']).default('cha'),
      levels: z.array(ThyreniaSpellLevelSchema).default([]),
    })
    .default({ castingClass: '', castingAbility: 'cha', levels: [] }),
});
export type ThyreniaCharacterSheet = z.infer<
  typeof ThyreniaCharacterSheetSchema
>;
