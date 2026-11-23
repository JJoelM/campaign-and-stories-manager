export type KnowledgeLayer = 'base' | 'asimetrica' | 'progresiva' | 'dm_secret';

export type LoreCardType =
  | 'character'
  | 'location'
  | 'faction'
  | 'quest_clue'
  | 'session'
  | 'chapter'
  | 'deity'
  | 'rule_lore';

export interface LoreNode {
  id: string;
  title: string;
  relativePath: string;
  layer: KnowledgeLayer;
  sanitizedContent: string;
  outgoingLinks: string[];
  tags: string[];
  image?: string;
  cardType?: LoreCardType;
  isSkeleton?: boolean;
  cardFields?: Record<string, string>;
}

export interface CharacterContext {
  id: string;
  name: string;
  race: string;
  class: string;
  factions: string[];
}

export interface CampaignInfo {
  id: string;
  name: string;
  vaultFolder: string;
  defaultCharacterId?: string;
}

export interface ThyreniaCalendarDate {
  dayOfWeek: string;
  dayOfMonth: number;
  monthIndex: number;
  monthName: string;
  season: 'Invierno' | 'Primavera' | 'Verano' | 'Otoño';
  yearDgd: number;
  divineInfluence: string;
  formatted: string;
}

export interface CosmicFestival {
  id: string;
  monthIndex: number;
  dayOfMonth: number;
  icon: string;
  name: string;
  kind: string;
  deity: string;
  description: string;
}

export interface PlotTimelineEntry {
  id: string;
  sessionNumber: number;
  kind: 'past' | 'current' | 'upcoming';
  sessionTag: string;
  title: string;
  location: string;
  thyreniaDate: ThyreniaCalendarDate;
  daysDeltaFromNow: number;
  associatedEvent?: CosmicFestival;
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
  season: string;
  isSeasonStart: boolean;
  deity: string;
  influence: string;
  festivals: CosmicFestival[];
  sessionTitles: string[];
}

export interface CampaignPlotTimeline {
  campaignId: string;
  campaignName: string;
  currentDate: ThyreniaCalendarDate;
  nextCosmicEvent: {
    festival: CosmicFestival;
    daysUntil: number;
    dateFormatted: string;
  };
  entries: PlotTimelineEntry[];
  cosmicWheel: CosmicWheelMonth[];
}

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

export interface AtlasMapViewLevel {
  id: string;
  parentMapId?: string;
  parentPinId?: string;
  name: string;
  scale: 'world' | 'continent' | 'city';
  subtitle: string;
  imageFile?: string;
  fogLayer: KnowledgeLayer;
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

export interface CampaignQuest {
  id: string;
  campaignId: string;
  title: string;
  kind: 'main_quest' | 'side_quest' | 'rumor';
  status: 'active' | 'completed' | 'failed' | 'proposed_rumor';
  giverNodeId?: string;
  locationNodeId?: string;
  summary: string;
  objectives: Array<{ text: string; done: boolean }>;
  proposedBy?: string;
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

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface ThyreniaSkillEntry {
  key: string;
  label: string;
  defaultAbility: AbilityKey;
  proficient: boolean;
  isClassSkill: boolean;
  rank: number;
}

export interface ThyreniaAttackEntry {
  name: string;
  attackBonus: string;
  damage: string;
  damageType: string;
}

export interface ThyreniaSpellEntry {
  name: string;
  prepared: boolean;
  castTime: string;
  damageOrEffect: string;
  ritual: boolean;
  concentration: boolean;
}

export interface ThyreniaSpellLevel {
  level: number;
  slotsTotal: number;
  slotsUsed: number;
  spells: ThyreniaSpellEntry[];
}

export interface ThyreniaCharacterSheet {
  characterId: string;
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  playerName: string;
  experiencePoints: number;
  proficiencyBonus: number;
  inspiration: boolean;
  speed: string;
  hp: { current: number; max: number; temp: number };
  hitDice: { total: string; used: number };
  deathSaves: { successes: number; failures: number };
  armorClass: number;
  mana: { current: number; max: number };
  auraPoints: { current: number; max: number };
  abilities: Record<AbilityKey, number>;
  savingThrowProficiencies: Record<AbilityKey, boolean>;
  fortunePoints: number;
  destinyPoints: number;
  desperateActionUsed: boolean;
  beliefs: Array<{ text: string; markedThisSession: boolean; resolved: boolean }>;
  flaws: string[];
  personalityTraits: string;
  ideals: string;
  bonds: string;
  skills: ThyreniaSkillEntry[];
  proficiencies: {
    armors: { light: boolean; medium: boolean; heavy: boolean; shield: boolean };
    weapons: { simple: boolean; martial: boolean; other: string };
    tools: string;
    languages: string;
  };
  attacks: ThyreniaAttackEntry[];
  featuresAndTraits: string;
  equipment: string;
  inventory: string;
  coins: { pc: number; pp: number; pe: number; po: number; ppt: number };
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    portraitImage: string;
    symbolName: string;
    symbolDescription: string;
  };
  milonga: string;
  alliesAndOrganizations: string;
  additionalFeatures: string;
  treasure: string;
  spellcasting: {
    castingClass: string;
    castingAbility: 'int' | 'wis' | 'cha';
    levels: ThyreniaSpellLevel[];
  };
}

export interface SceneState {
  id: string;
  locationNodeId: string;
  description: string;
  activeThreats: string[];
  turnNumber: number;
}

export interface LiveRollEntry {
  id: string;
  characterName: string;
  skillLabel: string;
  d20: number;
  bonus: number;
  total: number;
  timeLabel: string;
}

export interface ApiViewPayload {
  character: CharacterContext;
  characters: CharacterContext[];
  campaigns: CampaignInfo[];
  activeCampaign: CampaignInfo;
  aiGenerationLocked: boolean;
  calendarDate: ThyreniaCalendarDate;
  plotTimeline: CampaignPlotTimeline;
  mapPins: CampaignMapPin[];
  atlasMaps: AtlasMapViewLevel[];
  partyPosition: PartyMapPosition;
  quests: CampaignQuest[];
  relationships: EntityRelationship[];
  manualSessionLogs: ManualSessionLogEntry[];
  characterSheet: ThyreniaCharacterSheet;
  worldProgression: {
    revealedProgressiveCount: number;
    totalProgressiveCount: number;
  };
  lockReasons: Record<string, { status: 'asimetrica' | 'progresiva'; criteria: string }>;
  availableImages: string[];
  sceneState: SceneState;
  stats: {
    totalScanned: number;
    baseCount: number;
    asymmetricVisibleCount: number;
    progressiveVisibleCount: number;
    hiddenOrSecretCount: number;
  };
  visibleNodes: LoreNode[];
  adjacencyGraph: Record<string, string[]>;
  relevantNodes: LoreNode[];
}

export interface GmOverviewPayload {
  folders: string[];
  allNodes: Array<{
    id: string;
    title: string;
    relativePath: string;
    layer: KnowledgeLayer;
    tags: string[];
    isRevealedToParty: boolean;
    hasDmSecrets: boolean;
  }>;
  allMapPins: CampaignMapPin[];
  partyPosition: PartyMapPosition;
  stagedMedia: string[];
  availableImages: string[];
  sceneState: SceneState;
}

export interface CanonProposal {
  id: string;
  title: string;
  category: string;
  summary: string;
  targetSubfolder: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type MainTab = 'campaign' | 'atlas' | 'codex' | 'sheet';
export type ThemeId = 'grimorio' | 'pergamino';
export type FontId = 'editorial-serif' | 'modern-sans' | 'classic-lora';
