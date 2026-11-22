import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { URL } from 'node:url';
import matter from 'gray-matter';
import { VaultContextCompiler } from '../compiler/vault-context-compiler.js';
import { VaultSqliteIndexer } from '../compiler/vault-sqlite-indexer.js';
import {
  AsymmetricRequirements,
  CharacterContext,
  KnowledgeLayerSchema,
  LoreCardType,
  LoreCardTypeSchema,
  PartyState,
  SceneState,
  SceneStateSchema,
  ThyreniaCharacterSheet,
  ThyreniaCharacterSheetSchema,
} from '../domain/schemas.js';
import {
  advanceThyreniaDate,
  buildAtlasMapsForView,
  buildCampaignPlotTimeline,
  buildDefaultSheetForCharacter,
  buildFoundryVttActorJson,
  buildFoundryVttCompendiumBundle,
  buildFoundryVttJournalJson,
  CalendarCoords,
  CampaignDefinition,
  CampaignMapPin,
  CampaignQuest,
  DEFAULT_THYRENIA_CHARACTERS,
  EntityRelationship,
  filterMapPinsForPlayer,
  formatThyreniaDate,
  getDefaultMapPinsForCampaign,
  getDefaultPartyPositionForCampaign,
  getDefaultQuestsForCampaign,
  getDefaultRelationshipsForCampaign,
  ManualSessionLogEntry,
  MapPinFogState,
  MapPinKind,
  PartyMapPosition,
  RelationKind,
  THYRENIA_CAMPAIGNS,
} from '../domain/thyrenia-world.js';
import { CampaignSessionStore } from '../engine/campaign-session-store.js';
import { CanonApprovalQueue } from '../engine/canon-approval-queue.js';
import { SceneTransitionEngine } from '../engine/scene-transition-engine.js';
import {
  GeminiNarrativeDriver,
  HarnessMode,
} from '../harness/gemini-driver.js';
import {
  constantTimeEqual,
  InputSanitizer,
  RateLimiter,
  SafeVaultPathGuard,
  SecretRedactor,
} from '../security/security-guard.js';
import { renderPlayerWebAppHtml } from './player-ui.js';

export interface ThyreniaWebAppOptions {
  vaultPath: string;
  mode?: HarnessMode;
  dbPath?: string;
  campaignId?: string;
  characters?: CharacterContext[];
  staticWebDir?: string;
  initialSceneState?: SceneState;
  gmAccessKey?: string;
  aiGenerationLocked?: boolean;
}

export interface AppRequest {
  method: string;
  url: string;
  bodyText?: string;
  headers?: Record<string, string | undefined>;
  isLocalhost?: boolean;
}

export interface AppResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  binaryBody?: Buffer;
}

export interface ThyreniaWebApp {
  handleRequest: (req: AppRequest) => Promise<AppResponse>;
  listener: http.RequestListener;
  close: () => void;
}

const DEFAULT_CHARACTERS: CharacterContext[] = DEFAULT_THYRENIA_CHARACTERS;

const COMMON_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
};

const HTML_CSP_HEADER =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

function jsonResponse(status: number, data: unknown): AppResponse {
  return {
    status,
    headers: {
      ...COMMON_SECURITY_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(data),
  };
}

function htmlResponse(html: string): AppResponse {
  return {
    status: 200,
    headers: {
      ...COMMON_SECURITY_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': HTML_CSP_HEADER,
    },
    body: html,
  };
}

function getHeaderCaseInsensitive(
  headers: Record<string, string | undefined> | undefined,
  headerName: string,
): string | undefined {
  if (!headers) return undefined;
  const target = headerName.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target) {
      return v;
    }
  }
  return undefined;
}

function readNodeRequestBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const maxBytes = 4 * 1024 * 1024;
    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error('Payload excede el límite permitido (4MB).'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

/**
 * Crea el controlador HTTP/REST local-first de la Player Web App y el Estudio Visual del GM (ADR-0001, ADR-0009).
 */
export function createThyreniaWebApp(
  options: ThyreniaWebAppOptions,
): ThyreniaWebApp {
  const mode: HarnessMode =
    options.mode || (process.env.HARNESS_MODE as HarnessMode) || 'replay';
  const aiGenerationLocked =
    options.aiGenerationLocked ?? process.env.THYRENIA_DISABLE_AI === '1';
  const dbPath = options.dbPath ?? ':memory:';
  const defaultCampaignId = options.campaignId ?? 'luz-de-medialuna';
  const gmAccessKey =
    options.gmAccessKey || process.env.GM_ACCESS_KEY || 'Contra.123!';
  const characters =
    options.characters && options.characters.length > 0
      ? options.characters
      : DEFAULT_CHARACTERS;

  const sqliteIndexer = new VaultSqliteIndexer(dbPath);
  const sessionStore = new CampaignSessionStore(dbPath);
  const canonQueue = new CanonApprovalQueue(options.vaultPath, dbPath);
  const driver = new GeminiNarrativeDriver({ mode });
  const engine = new SceneTransitionEngine(driver, canonQueue, sqliteIndexer);

  const gmSessions = new Map<string, { expiresAt: number }>();
  const GM_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
  const gmAuthRateLimiter = new RateLimiter(10, 60_000);

  function issueGmSessionToken(): string {
    const now = Date.now();
    for (const [tok, meta] of gmSessions.entries()) {
      if (now > meta.expiresAt) gmSessions.delete(tok);
    }
    const token = `gmsess_${crypto.randomBytes(24).toString('hex')}`;
    gmSessions.set(token, { expiresAt: now + GM_SESSION_TTL_MS });
    return token;
  }

  function resolveCampaign(campaignIdParam?: string | null): CampaignDefinition {
    const targetId = campaignIdParam || defaultCampaignId;
    const found = THYRENIA_CAMPAIGNS.find((c) => c.id === targetId);
    if (found) return found;
    return {
      id: targetId,
      name: targetId,
      vaultFolder: '01 - Campanas/01 - Campana Principal (Luz de Medialuna)',
      defaultCharacterId: characters[0].id,
      initialDate: { yearDgd: 524, monthIndex: 2, dayOfMonth: 1 },
      initialScene: options.initialSceneState ?? {
        id: 'escena-posada-01',
        locationNodeId: 'Maná',
        description:
          'La party se reúne en una posada junto a una antigua Vena de Maná observando un constructo inactivo.',
        environmentFlags: { flujo_mana_activo: true },
        activeThreats: [],
        turnNumber: 1,
      },
    };
  }

  function resolveCharacter(characterId?: string | null): CharacterContext {
    if (!characterId) return characters[0];
    return (
      characters.find(
        (c) =>
          c.id.toLowerCase() === characterId.toLowerCase() ||
          c.name.toLowerCase() === characterId.toLowerCase(),
      ) ?? characters[0]
    );
  }

  function getCurrentSession(targetCampaignId?: string | null): {
    partyState: PartyState;
    sceneState: SceneState;
  } {
    const camp = resolveCampaign(targetCampaignId);
    const existing = sessionStore.loadSessionState(camp.id);
    if (existing) return existing;

    const freshParty: PartyState = {
      campaignId: camp.id,
      revealedProgressiveNodeIds: [],
      factionReputation: { 'Luz de Medialuna': 1 },
    };
    const freshScene: SceneState =
      camp.id === defaultCampaignId && options.initialSceneState
        ? options.initialSceneState
        : camp.initialScene;
    sessionStore.saveSessionState(freshParty, freshScene);
    return { partyState: freshParty, sceneState: freshScene };
  }

  function getCalendarCoords(targetCampaignId?: string | null): CalendarCoords {
    const camp = resolveCampaign(targetCampaignId);
    return (
      sessionStore.loadMetadata<CalendarCoords>(`calendar:${camp.id}`) ??
      camp.initialDate
    );
  }

  function getCharacterSheet(
    character: CharacterContext,
  ): ThyreniaCharacterSheet {
    const stored = sessionStore.loadMetadata<ThyreniaCharacterSheet>(
      `sheet:${character.id}`,
    );
    if (stored) {
      return ThyreniaCharacterSheetSchema.parse(stored);
    }
    const fresh = buildDefaultSheetForCharacter(character);
    sessionStore.saveMetadata(`sheet:${character.id}`, fresh);
    return fresh;
  }

  function getMapPins(campaignId: string): CampaignMapPin[] {
    return (
      sessionStore.loadMetadata<CampaignMapPin[]>(`mappins:${campaignId}`) ??
      getDefaultMapPinsForCampaign(campaignId)
    );
  }

  function getPartyPosition(campaignId: string): PartyMapPosition {
    return (
      sessionStore.loadMetadata<PartyMapPosition>(`partypos:${campaignId}`) ??
      getDefaultPartyPositionForCampaign(campaignId)
    );
  }

  function getQuests(campaignId: string): CampaignQuest[] {
    return (
      sessionStore.loadMetadata<CampaignQuest[]>(`quests:${campaignId}`) ??
      getDefaultQuestsForCampaign(campaignId)
    );
  }

  function getRelationships(campaignId: string): EntityRelationship[] {
    return (
      sessionStore.loadMetadata<EntityRelationship[]>(`rels:${campaignId}`) ??
      getDefaultRelationshipsForCampaign(campaignId)
    );
  }

  function getManualSessionLogs(campaignId: string): ManualSessionLogEntry[] {
    return (
      sessionStore.loadMetadata<ManualSessionLogEntry[]>(
        `manual_log:${campaignId}`,
      ) ?? []
    );
  }

  interface StagedMediaRecord {
    fileName: string;
    mimeType: string;
    base64Data: string;
    proposedBy: string;
    createdAt: string;
  }

  function getStagedMediaNames(): string[] {
    return (
      sessionStore.loadMetadata<string[]>('staged_media_index') ?? []
    );
  }

  function materializeStagedMedia(rawName: string): string | null {
    const cleanBase = path.posix.basename(rawName.trim().replace(/\\/g, '/'));
    const staged = sessionStore.loadMetadata<StagedMediaRecord>(
      `staged_media:${cleanBase}`,
    );
    if (!staged) return null;

    const { filePath } = SafeVaultPathGuard.resolveSafeMediaReadPath(
      options.vaultPath,
      staged.fileName,
    );
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(staged.base64Data, 'base64'));

    const remaining = getStagedMediaNames().filter(
      (n) => n.toLowerCase() !== staged.fileName.toLowerCase(),
    );
    sessionStore.saveMetadata('staged_media_index', remaining);
    sessionStore.saveMetadata(`staged_media:${staged.fileName}`, null);
    return filePath;
  }

  function listAvailableImages(): string[] {
    const names = new Set<string>(getStagedMediaNames());
    const imagesDir = path.resolve(options.vaultPath, 'images');
    if (fs.existsSync(imagesDir)) {
      for (const e of fs.readdirSync(imagesDir, { withFileTypes: true })) {
        if (
          e.isFile() &&
          !e.name.startsWith('.') &&
          Boolean(SafeVaultPathGuard.getMediaMimeType(e.name))
        ) {
          names.add(e.name);
        }
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }

  getCurrentSession(defaultCampaignId);

  function verifyGmAuth(req: AppRequest, bodyGmKey?: string): boolean {
    const headerKey = getHeaderCaseInsensitive(
      req.headers,
      'x-thyrenia-gm-key',
    );
    const provided = (headerKey ?? bodyGmKey)?.trim();
    if (!provided) return false;
    const session = gmSessions.get(provided);
    if (session) {
      if (Date.now() <= session.expiresAt) return true;
      gmSessions.delete(provided);
      return false;
    }
    return constantTimeEqual(provided, gmAccessKey);
  }

  async function handleRequest(req: AppRequest): Promise<AppResponse> {
    try {
      if (
        req.bodyText &&
        Buffer.byteLength(req.bodyText, 'utf-8') > 4 * 1024 * 1024
      ) {
        return jsonResponse(413, {
          error: 'Payload excede el límite permitido (4MB).',
        });
      }
      const parsedUrl = new URL(req.url, 'http://localhost');
      const pathname = parsedUrl.pathname;

      if (req.method === 'GET' && pathname === '/') {
        if (options.staticWebDir) {
          const builtIndex = path.resolve(options.staticWebDir, 'index.html');
          if (fs.existsSync(builtIndex)) {
            return {
              status: 200,
              headers: {
                ...COMMON_SECURITY_HEADERS,
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Content-Security-Policy': HTML_CSP_HEADER,
              },
              body: fs.readFileSync(builtIndex, 'utf-8'),
            };
          }
        }
        return htmlResponse(renderPlayerWebAppHtml());
      }

      if (
        req.method === 'GET' &&
        options.staticWebDir &&
        pathname.startsWith('/assets/')
      ) {
        const rawSub = decodeURIComponent(pathname.slice('/assets/'.length));
        const assetsRoot = path.resolve(options.staticWebDir, 'assets');
        const candidate = path.resolve(assetsRoot, rawSub);
        const rel = path.relative(assetsRoot, candidate);
        if (
          !rel ||
          rel.startsWith('..') ||
          path.isAbsolute(rel) ||
          rawSub.includes('..') ||
          rel.split(/[\\/]/).some((seg) => seg.startsWith('.'))
        ) {
          return jsonResponse(400, {
            error: 'Violación de seguridad (Path Traversal): activo no permitido.',
          });
        }
        if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
          return jsonResponse(404, { error: 'Activo estático no encontrado.' });
        }
        const ext = path.extname(candidate).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.json': 'application/json; charset=utf-8',
          '.ico': 'image/x-icon',
        };
        const contentType = mimeMap[ext];
        if (!contentType) {
          return jsonResponse(403, { error: 'Tipo de activo no permitido.' });
        }
        const buffer = fs.readFileSync(candidate);
        return {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Content-Length': String(buffer.length),
          },
          body: '',
          binaryBody: buffer,
        };
      }

      if (req.method === 'GET' && pathname === '/api/health') {
        return jsonResponse(200, {
          status: 'ok',
          mode,
          aiGenerationLocked,
          campaignId: defaultCampaignId,
        });
      }

      if (req.method === 'GET' && pathname === '/api/vault/media/list') {
        return jsonResponse(200, { images: listAvailableImages() });
      }

      if (req.method === 'GET' && pathname === '/api/vault/media') {
        const requestedFile = parsedUrl.searchParams.get('file') || '';
        const { filePath, fileName, mimeType } =
          SafeVaultPathGuard.resolveSafeMediaReadPath(
            options.vaultPath,
            requestedFile,
          );
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          return {
            status: 200,
            headers: {
              'Content-Type': mimeType,
              'X-Content-Type-Options': 'nosniff',
              'Cache-Control': 'public, max-age=300',
              'Content-Length': String(buffer.length),
            },
            body: '',
            binaryBody: buffer,
          };
        }

        const staged = sessionStore.loadMetadata<StagedMediaRecord>(
          `staged_media:${fileName}`,
        );
        if (staged) {
          const buffer = Buffer.from(staged.base64Data, 'base64');
          return {
            status: 200,
            headers: {
              'Content-Type': staged.mimeType,
              'X-Content-Type-Options': 'nosniff',
              'Cache-Control': 'no-store',
              'Content-Length': String(buffer.length),
            },
            body: '',
            binaryBody: buffer,
          };
        }

        return jsonResponse(404, {
          error: `Imagen no encontrada en el Vault Maestro: "${requestedFile}"`,
        });
      }

      if (req.method === 'GET' && pathname === '/api/view') {
        const activeCampaign = resolveCampaign(
          parsedUrl.searchParams.get('campaignId'),
        );
        const character = resolveCharacter(
          parsedUrl.searchParams.get('characterId'),
        );
        const queryText = parsedUrl.searchParams.get('q') || '';
        const session = getCurrentSession(activeCampaign.id);

        const compiledView = VaultContextCompiler.compileView(
          options.vaultPath,
          session.partyState,
          character,
        );
        const lockReasons = VaultContextCompiler.computeLockReasons(
          options.vaultPath,
          session.partyState,
          character,
        );
        sqliteIndexer.indexCompiledView(compiledView);

        const relevantNodes = sqliteIndexer.retrieveRelevantNodes({
          character,
          locationNodeId: session.sceneState.locationNodeId,
          sceneDescription: session.sceneState.description,
          playerAction: queryText,
          limit: 30,
        });

        const lockedProgressiveCount = Object.values(lockReasons).filter(
          (r) => r.status === 'progresiva',
        ).length;
        const currentCoords = getCalendarCoords(activeCampaign.id);
        const calendarDate = formatThyreniaDate(currentCoords);
        const characterSheet = getCharacterSheet(character);
        const turns = sessionStore.listTurns(activeCampaign.id);
        const plotTimeline = buildCampaignPlotTimeline(
          activeCampaign.id,
          currentCoords,
          options.vaultPath,
          session.sceneState,
          turns,
        );
        const isGmView = verifyGmAuth(req);
        const allCampaignPins = getMapPins(activeCampaign.id);
        const mapPins = filterMapPinsForPlayer(
          allCampaignPins,
          lockReasons,
          isGmView,
        );
        const customMapImages =
          sessionStore.loadMetadata<Record<string, string>>(
            `atlas_images:${activeCampaign.id}`,
          ) || {};
        const atlasMaps = buildAtlasMapsForView({
          campaignId: activeCampaign.id,
          worldPins: allCampaignPins,
          character,
          revealedProgressiveNodeIds:
            session.partyState.revealedProgressiveNodeIds,
          lockReasons,
          isGm: isGmView,
          customMapImages,
        });
        const partyPosition = getPartyPosition(activeCampaign.id);
        const quests = getQuests(activeCampaign.id);
        const relationships = getRelationships(activeCampaign.id);
        const manualSessionLogs = getManualSessionLogs(activeCampaign.id);

        return jsonResponse(200, {
          character,
          characters,
          campaigns: THYRENIA_CAMPAIGNS.map((c) => ({
            id: c.id,
            name: c.name,
            vaultFolder: c.vaultFolder,
            defaultCharacterId: c.defaultCharacterId,
          })),
          activeCampaign: {
            id: activeCampaign.id,
            name: activeCampaign.name,
            vaultFolder: activeCampaign.vaultFolder,
          },
          aiGenerationLocked,
          calendarDate,
          plotTimeline,
          mapPins,
          atlasMaps,
          partyPosition,
          quests,
          relationships,
          manualSessionLogs,
          characterSheet,
          worldProgression: {
            revealedProgressiveCount:
              compiledView.stats.progressiveVisibleCount,
            totalProgressiveCount:
              compiledView.stats.progressiveVisibleCount +
              lockedProgressiveCount,
            factionReputation: session.partyState.factionReputation,
          },
          lockReasons,
          availableImages: listAvailableImages(),
          sceneState: session.sceneState,
          partyState: session.partyState,
          stats: compiledView.stats,
          visibleNodes: compiledView.visibleNodes,
          adjacencyGraph: compiledView.adjacencyGraph,
          relevantNodes,
          turns,
        });
      }

      if (req.method === 'POST' && pathname === '/api/scene/step') {
        if (aiGenerationLocked) {
          return jsonResponse(403, {
            error:
              'Generación por IA bloqueada: Thyrenia opera actualmente en Modo 100% Manual.',
          });
        }

        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          playerAction?: string;
          characterId?: string;
          fixtureKey?: string;
          deterministicRollD20?: number;
          activeThreats?: string[];
          locationNodeId?: string;
        };

        if (!body.playerAction || typeof body.playerAction !== 'string') {
          return jsonResponse(400, {
            error: 'El campo playerAction es obligatorio.',
          });
        }

        const activeCampaign = resolveCampaign(body.campaignId);
        const character = resolveCharacter(body.characterId);
        const session = getCurrentSession(activeCampaign.id);
        const activeScene: SceneState = {
          ...session.sceneState,
          ...(body.locationNodeId
            ? { locationNodeId: body.locationNodeId }
            : {}),
          ...(body.activeThreats ? { activeThreats: body.activeThreats } : {}),
        };

        const compiledView = VaultContextCompiler.compileView(
          options.vaultPath,
          session.partyState,
          character,
        );

        const stepResult = await engine.step(
          activeScene,
          session.partyState,
          body.playerAction,
          compiledView,
          {
            fixtureKey: body.fixtureKey,
            deterministicRollD20: body.deterministicRollD20,
          },
        );

        sessionStore.recordTurn({
          campaignId: activeCampaign.id,
          playerId: character.id,
          playerAction: stepResult.securityAudit.sanitizedInput.cleanText,
          previousSceneState: activeScene,
          stepResult,
        });

        return jsonResponse(200, {
          stepResult,
          sceneState: stepResult.nextSceneState,
          partyState: stepResult.nextPartyState,
          pendingProposals: canonQueue.listPending(),
        });
      }

      if (req.method === 'POST' && pathname === '/api/player/propose') {
        const body = JSON.parse(req.bodyText || '{}') as {
          characterId?: string;
          campaignId?: string;
          category?: 'chronicle_entry' | 'new_npc' | 'location_event';
          title?: string;
          summary?: string;
          markdownContent?: string;
          targetKind?: 'character' | 'campaign';
        };

        if (!body.title?.trim() || !body.markdownContent?.trim()) {
          return jsonResponse(400, {
            error: 'El título y el contenido narrativo son obligatorios.',
          });
        }

        const character = resolveCharacter(body.characterId);
        const activeCampaign = resolveCampaign(body.campaignId);
        const session = getCurrentSession(activeCampaign.id);
        const sanitizedTitle = InputSanitizer.sanitize(
          body.title.trim(),
          120,
        ).cleanText;
        const sanitizedBody = InputSanitizer.sanitize(
          body.markdownContent.trim(),
          4000,
        ).cleanText;
        const safeMarkdown = SecretRedactor.redact(
          `# ${sanitizedTitle}\n\n*Aportado por el jugador de **${character.name}** (${activeCampaign.name})*\n\n${sanitizedBody}\n`,
        );

        const targetSubfolder =
          body.targetKind === 'campaign'
            ? `${activeCampaign.vaultFolder}/Notas de Sesion`
            : '03 - Archivos Externos - Mis PJs';

        const proposal = canonQueue.enqueue(session.sceneState.id, {
          title: sanitizedTitle,
          category: body.category || 'chronicle_entry',
          summary:
            body.summary?.trim() ||
            `Aportación de ${character.name}: ${sanitizedTitle}`,
          targetSubfolder,
          markdownContent: safeMarkdown,
        });

        return jsonResponse(201, { proposal });
      }

      if (req.method === 'POST' && pathname === '/api/character/sheet') {
        const body = JSON.parse(
          req.bodyText || '{}',
        ) as Partial<ThyreniaCharacterSheet>;
        const character = resolveCharacter(body.characterId);
        const current = getCharacterSheet(character);
        const updated = ThyreniaCharacterSheetSchema.parse({
          ...current,
          ...body,
          characterId: character.id,
        });
        sessionStore.saveMetadata(`sheet:${character.id}`, updated);
        return jsonResponse(200, { characterSheet: updated });
      }

      if (req.method === 'GET' && pathname === '/api/character/foundry-export') {
        const character = resolveCharacter(
          parsedUrl.searchParams.get('characterId'),
        );
        const sheet = getCharacterSheet(character);
        const actorJson = buildFoundryVttActorJson(sheet);
        const asDownload = parsedUrl.searchParams.get('download') === '1';
        const safeName = sheet.name.replace(/[^a-zA-Z0-9_-]+/g, '_');
        return {
          status: 200,
          headers: {
            ...COMMON_SECURITY_HEADERS,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...(asDownload
              ? {
                  'Content-Disposition': `attachment; filename="fvtt-Actor-${safeName}.json"`,
                }
              : {}),
          },
          body: JSON.stringify(actorJson, null, 2),
        };
      }

      if (req.method === 'GET' && pathname === '/api/foundry/journal-export') {
        const activeCampaign = resolveCampaign(
          parsedUrl.searchParams.get('campaignId'),
        );
        const character = resolveCharacter(
          parsedUrl.searchParams.get('characterId'),
        );
        const nodeId = parsedUrl.searchParams.get('nodeId')?.trim();
        const questId = parsedUrl.searchParams.get('questId')?.trim();
        const includeGmSecrets =
          parsedUrl.searchParams.get('includeGmSecrets') === '1';
        const asDownload = parsedUrl.searchParams.get('download') === '1';
        const isGm = verifyGmAuth(req);

        if (includeGmSecrets && !isGm) {
          return jsonResponse(403, {
            error:
              'Exportar secretos del DM requiere autenticación de GM (x-thyrenia-gm-key).',
          });
        }

        if (questId) {
          const quest = getQuests(activeCampaign.id).find(
            (q) => q.id === questId,
          );
          if (!quest) {
            return jsonResponse(404, {
              error: `Misión o rumor no encontrado: "${questId}"`,
            });
          }
          const mdLines = [
            `# ${quest.title}`,
            '',
            quest.summary,
            '',
            '## Objetivos',
            ...quest.objectives.map(
              (o) => `- [${o.done ? 'x' : ' '}] ${o.text}`,
            ),
          ];
          const journal = buildFoundryVttJournalJson({
            title: quest.title,
            publicMarkdown: mdLines.join('\n'),
            cardType: 'quest_clue',
            cardFields: {
              Tipo: quest.kind,
              Estado: quest.status,
              ...(quest.locationNodeId ? { Lugar: quest.locationNodeId } : {}),
              ...(quest.giverNodeId ? { Otorgante: quest.giverNodeId } : {}),
            },
          });
          const safeName = quest.title.replace(/[^a-zA-Z0-9_-]+/g, '_');
          return {
            status: 200,
            headers: {
              ...COMMON_SECURITY_HEADERS,
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
              ...(asDownload
                ? {
                    'Content-Disposition': `attachment; filename="fvtt-Journal-${safeName}.json"`,
                  }
                : {}),
            },
            body: JSON.stringify(journal, null, 2),
          };
        }

        if (!nodeId) {
          return jsonResponse(400, {
            error: 'Debes indicar nodeId o questId para exportar a FoundryVTT.',
          });
        }

        const session = getCurrentSession(activeCampaign.id);
        const compiledView = VaultContextCompiler.compileView(
          options.vaultPath,
          session.partyState,
          character,
        );
        const targetLower = nodeId.toLowerCase();
        const visibleNode = compiledView.visibleNodes.find(
          (n) =>
            n.id.toLowerCase() === targetLower ||
            n.title.toLowerCase() === targetLower,
        );

        if (!visibleNode && !isGm) {
          return jsonResponse(403, {
            error: `Nodo "${nodeId}" oculto por la Niebla de Guerra Estratificada para ${character.name}.`,
          });
        }

        let journalTitle = visibleNode?.title || nodeId;
        let publicMarkdown = visibleNode?.sanitizedContent || '';
        let dmSecretNotes = '';
        let cardType = visibleNode?.cardType;
        let cardFields = visibleNode?.cardFields;
        let tags = visibleNode?.tags || [];
        let linkedImage = visibleNode?.image;

        if (isGm) {
          const allNodes = VaultContextCompiler.scanVaultNodesForGm(
            options.vaultPath,
            session.partyState.revealedProgressiveNodeIds,
          );
          const gmMatch = allNodes.find(
            (n) =>
              n.id.toLowerCase() === targetLower ||
              n.title.toLowerCase() === targetLower,
          );
          if (!gmMatch && !visibleNode) {
            return jsonResponse(404, {
              error: `Nodo de Lore no encontrado: "${nodeId}"`,
            });
          }
          if (gmMatch) {
            const absPath = path.resolve(options.vaultPath, gmMatch.relativePath);
            if (fs.existsSync(absPath)) {
              const parsed = matter(fs.readFileSync(absPath, 'utf-8'));
              const split = VaultContextCompiler.splitPublicAndDmSecrets(
                parsed.content,
              );
              journalTitle = gmMatch.title;
              publicMarkdown = split.publicMarkdown;
              dmSecretNotes = split.dmSecrets.join('\n\n');
              tags = gmMatch.tags;
              linkedImage = VaultContextCompiler.extractPrimaryImage(
                parsed.data || {},
                split.publicMarkdown,
              );
              const meta = VaultContextCompiler.inferCardMetadata(
                gmMatch.relativePath,
                gmMatch.title,
                parsed.data || {},
                split.publicMarkdown,
                gmMatch.tags,
              );
              cardType = meta.cardType;
              cardFields = meta.cardFields;
            }
          }
        }

        const journalJson = buildFoundryVttJournalJson({
          title: journalTitle,
          publicMarkdown,
          dmSecretNotes,
          includeGmSecrets,
          tags,
          linkedImage,
          cardType,
          cardFields,
        });
        const safeName = journalTitle.replace(/[^a-zA-Z0-9_-]+/g, '_');
        return {
          status: 200,
          headers: {
            ...COMMON_SECURITY_HEADERS,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...(asDownload
              ? {
                  'Content-Disposition': `attachment; filename="fvtt-Journal-${safeName}.json"`,
                }
              : {}),
          },
          body: JSON.stringify(journalJson, null, 2),
        };
      }

      if (req.method === 'GET' && pathname === '/api/foundry/compendium-export') {
        const activeCampaign = resolveCampaign(
          parsedUrl.searchParams.get('campaignId'),
        );
        const character = resolveCharacter(
          parsedUrl.searchParams.get('characterId'),
        );
        const includeGmSecrets =
          parsedUrl.searchParams.get('includeGmSecrets') === '1';
        const asDownload = parsedUrl.searchParams.get('download') === '1';
        const isGm = verifyGmAuth(req);

        if (includeGmSecrets && !isGm) {
          return jsonResponse(403, {
            error:
              'Exportar secretos del DM en el compendio masivo requiere clave de GM.',
          });
        }

        const session = getCurrentSession(activeCampaign.id);
        const compiledView = VaultContextCompiler.compileView(
          options.vaultPath,
          session.partyState,
          character,
        );

        const journals: Array<{
          folderPath: string;
          entry: Record<string, unknown>;
        }> = [];

        if (includeGmSecrets && isGm) {
          const allNodes = VaultContextCompiler.scanVaultNodesForGm(
            options.vaultPath,
            session.partyState.revealedProgressiveNodeIds,
          );
          for (const gmNode of allNodes) {
            const absPath = path.resolve(options.vaultPath, gmNode.relativePath);
            if (!fs.existsSync(absPath)) continue;
            const parsed = matter(fs.readFileSync(absPath, 'utf-8'));
            const split = VaultContextCompiler.splitPublicAndDmSecrets(
              parsed.content,
            );
            const linkedImage = VaultContextCompiler.extractPrimaryImage(
              parsed.data || {},
              split.publicMarkdown,
            );
            const meta = VaultContextCompiler.inferCardMetadata(
              gmNode.relativePath,
              gmNode.title,
              parsed.data || {},
              split.publicMarkdown,
              gmNode.tags,
            );
            const folderPath = path.posix.dirname(
              gmNode.relativePath.replace(/\\/g, '/'),
            );
            journals.push({
              folderPath: folderPath === '.' ? 'Raíz' : folderPath,
              entry: buildFoundryVttJournalJson({
                title: gmNode.title,
                publicMarkdown: split.publicMarkdown,
                dmSecretNotes: split.dmSecrets.join('\n\n'),
                includeGmSecrets: true,
                tags: gmNode.tags,
                linkedImage,
                cardType: meta.cardType,
                cardFields: meta.cardFields,
              }),
            });
          }
        } else {
          for (const node of compiledView.visibleNodes) {
            const folderPath = path.posix.dirname(
              node.relativePath.replace(/\\/g, '/'),
            );
            journals.push({
              folderPath: folderPath === '.' ? 'Raíz' : folderPath,
              entry: buildFoundryVttJournalJson({
                title: node.title,
                publicMarkdown: node.sanitizedContent,
                includeGmSecrets: false,
                tags: node.tags,
                linkedImage: node.image,
                cardType: node.cardType,
                cardFields: node.cardFields,
              }),
            });
          }
        }

        const quests = getQuests(activeCampaign.id);
        for (const q of quests) {
          if (!isGm && q.status === 'proposed_rumor') continue;
          const mdLines = [
            `# ${q.title}`,
            '',
            q.summary,
            '',
            '## Objetivos',
            ...q.objectives.map((o) => `- [${o.done ? 'x' : ' '}] ${o.text}`),
          ];
          journals.push({
            folderPath: `${activeCampaign.name}/Misiones y Rumores`,
            entry: buildFoundryVttJournalJson({
              title: q.title,
              publicMarkdown: mdLines.join('\n'),
              cardType: 'quest_clue',
              cardFields: {
                Tipo: q.kind,
                Estado: q.status,
                ...(q.locationNodeId ? { Lugar: q.locationNodeId } : {}),
              },
            }),
          });
        }

        const lockReasons = VaultContextCompiler.computeLockReasons(
          options.vaultPath,
          session.partyState,
          character,
        );
        const exportedPins =
          includeGmSecrets && isGm
            ? getMapPins(activeCampaign.id)
            : filterMapPinsForPlayer(getMapPins(activeCampaign.id), lockReasons, false);

        const actors = characters.map((ch) =>
          buildFoundryVttActorJson(getCharacterSheet(ch)),
        );

        const bundle = buildFoundryVttCompendiumBundle({
          campaignId: activeCampaign.id,
          campaignName: activeCampaign.name,
          journals,
          actors,
          mapPins: exportedPins,
          includeGmSecrets: includeGmSecrets && isGm,
        });

        const safeCamp = activeCampaign.id.replace(/[^a-zA-Z0-9_-]+/g, '_');
        return {
          status: 200,
          headers: {
            ...COMMON_SECURITY_HEADERS,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...(asDownload
              ? {
                  'Content-Disposition': `attachment; filename="fvtt-Compendium-Thyrenia-${safeCamp}.json"`,
                }
              : {}),
          },
          body: JSON.stringify(bundle, null, 2),
        };
      }

      if (req.method === 'POST' && pathname === '/api/player/media/propose') {
        const body = JSON.parse(req.bodyText || '{}') as {
          fileName?: string;
          dataUrl?: string;
          characterId?: string;
          campaignId?: string;
          targetNodeId?: string;
          caption?: string;
        };
        if (!body.fileName?.trim() || !body.dataUrl?.trim()) {
          return jsonResponse(400, {
            error: 'fileName y dataUrl base64 son obligatorios.',
          });
        }

        const { fileName: safeName, mimeType } =
          SafeVaultPathGuard.sanitizeMediaFileName(body.fileName);

        const match = body.dataUrl.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/,
        );
        if (!match) {
          return jsonResponse(400, {
            error: 'Formato dataUrl inválido. Debe ser una imagen codificada en base64.',
          });
        }

        const buffer = Buffer.from(match[2], 'base64');
        const maxImageBytes = 2 * 1024 * 1024;
        if (buffer.length === 0 || buffer.length > maxImageBytes) {
          return jsonResponse(400, {
            error: 'La imagen debe pesar entre 1 byte y 2 MB.',
          });
        }

        if (!SafeVaultPathGuard.validateImageMagicBytes(buffer, mimeType)) {
          return jsonResponse(400, {
            error: 'El contenido binario no corresponde a una imagen válida del tipo indicado.',
          });
        }

        const character = resolveCharacter(body.characterId);
        const activeCampaign = resolveCampaign(body.campaignId);
        const record: StagedMediaRecord = {
          fileName: safeName,
          mimeType,
          base64Data: buffer.toString('base64'),
          proposedBy: character.name,
          createdAt: new Date().toISOString(),
        };
        sessionStore.saveMetadata(`staged_media:${safeName}`, record);
        const nextIdx = Array.from(new Set([...getStagedMediaNames(), safeName]));
        sessionStore.saveMetadata('staged_media_index', nextIdx);

        const cleanCaption = body.caption?.trim()
          ? InputSanitizer.sanitize(body.caption.trim(), 120).cleanText
          : '';
        const markdownEmbed = cleanCaption
          ? `![[${safeName}|${cleanCaption}]]`
          : `![[${safeName}]]`;

        let proposal = undefined;
        if (body.targetNodeId?.trim()) {
          const cleanTarget = InputSanitizer.sanitize(
            body.targetNodeId.trim(),
            120,
          ).cleanText;
          const session = getCurrentSession(activeCampaign.id);
          proposal = canonQueue.enqueue(session.sceneState.id, {
            title: `Ilustración para ${cleanTarget}`,
            category: 'chronicle_entry',
            summary: `${character.name} propone añadir la imagen ${safeName} a "${cleanTarget}".`,
            targetSubfolder: '03 - Archivos Externos - Mis PJs',
            markdownContent: `# Ilustración: ${cleanTarget}\n\n*Imagen propuesta por **${character.name}** para [[${cleanTarget}]]*\n\n${markdownEmbed}\n`,
          });
        }

        return jsonResponse(201, {
          fileName: safeName,
          mimeType,
          staged: true,
          markdownEmbed,
          ...(proposal ? { proposal } : {}),
        });
      }

      if (req.method === 'POST' && pathname === '/api/player/rumor') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          characterId?: string;
          kind?: 'quest_rumor' | 'relationship';
          title?: string;
          summary?: string;
          locationNodeId?: string;
          sourceId?: string;
          targetId?: string;
          relationKind?: RelationKind;
          label?: string;
        };
        const activeCampaign = resolveCampaign(body.campaignId);
        const character = resolveCharacter(body.characterId);

        if (body.kind === 'relationship') {
          if (!body.sourceId?.trim() || !body.targetId?.trim() || !body.label?.trim()) {
            return jsonResponse(400, {
              error: 'Origen, destino y descripción de relación son obligatorios.',
            });
          }
          const validKinds: RelationKind[] = [
            'ally',
            'rival_enemy',
            'suspicion',
            'patron_loyalty',
            'mystery_blood',
          ];
          const relationKind: RelationKind =
            body.relationKind && validKinds.includes(body.relationKind)
              ? body.relationKind
              : 'suspicion';

          const nextRel: EntityRelationship = {
            id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            campaignId: activeCampaign.id,
            sourceId: SecretRedactor.redact(
              InputSanitizer.sanitize(body.sourceId.trim(), 120).cleanText,
            ),
            targetId: SecretRedactor.redact(
              InputSanitizer.sanitize(body.targetId.trim(), 120).cleanText,
            ),
            relationKind,
            label: SecretRedactor.redact(
              InputSanitizer.sanitize(body.label.trim(), 140).cleanText,
            ),
            status: 'proposed',
            proposedBy: character.name,
          };
          const rels = [...getRelationships(activeCampaign.id), nextRel];
          sessionStore.saveMetadata(`rels:${activeCampaign.id}`, rels);
          return jsonResponse(201, { relationship: nextRel, relationships: rels });
        }

        if (!body.title?.trim() || !body.summary?.trim()) {
          return jsonResponse(400, {
            error: 'Título y descripción del rumor o pista son obligatorios.',
          });
        }
        const nextQuest: CampaignQuest = {
          id: `rumor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          campaignId: activeCampaign.id,
          title: SecretRedactor.redact(
            InputSanitizer.sanitize(body.title.trim(), 120).cleanText,
          ),
          kind: 'rumor',
          status: 'proposed_rumor',
          ...(body.locationNodeId?.trim()
            ? {
                locationNodeId: InputSanitizer.sanitize(
                  body.locationNodeId.trim(),
                  120,
                ).cleanText,
              }
            : {}),
          summary: SecretRedactor.redact(
            InputSanitizer.sanitize(body.summary.trim(), 1200).cleanText,
          ),
          objectives: [
            {
              text: 'Investigar este rumor en campaña.',
              done: false,
            },
          ],
          proposedBy: character.name,
        };
        const quests = [...getQuests(activeCampaign.id), nextQuest];
        sessionStore.saveMetadata(`quests:${activeCampaign.id}`, quests);
        return jsonResponse(201, { quest: nextQuest, quests });
      }

      if (req.method === 'GET' && pathname === '/api/canon/proposals') {
        return jsonResponse(200, {
          proposals: canonQueue.listAll(),
          pendingCount: canonQueue.listPending().length,
        });
      }

      if (req.method === 'POST' && pathname === '/api/canon/approve') {
        const providedGmHeader = getHeaderCaseInsensitive(
          req.headers,
          'x-thyrenia-gm-key',
        );
        if (
          (req.isLocalhost === false || providedGmHeader !== undefined) &&
          !verifyGmAuth(req)
        ) {
          return jsonResponse(403, {
            error:
              'Aprobar Propuestas de Canon requiere autenticación de GM.',
          });
        }
        const body = JSON.parse(req.bodyText || '{}') as {
          proposalId?: string;
        };
        if (!body.proposalId) {
          return jsonResponse(400, { error: 'proposalId es obligatorio.' });
        }
        const proposal = canonQueue.approve(body.proposalId);
        const embedMatches = proposal.markdownContent.matchAll(
          /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g,
        );
        for (const m of embedMatches) {
          if (m[1]) {
            materializeStagedMedia(m[1]);
          }
        }
        return jsonResponse(200, { proposal });
      }

      if (req.method === 'POST' && pathname === '/api/canon/reject') {
        const providedGmHeader = getHeaderCaseInsensitive(
          req.headers,
          'x-thyrenia-gm-key',
        );
        if (
          (req.isLocalhost === false || providedGmHeader !== undefined) &&
          !verifyGmAuth(req)
        ) {
          return jsonResponse(403, {
            error:
              'Rechazar Propuestas de Canon requiere autenticación de GM.',
          });
        }
        const body = JSON.parse(req.bodyText || '{}') as {
          proposalId?: string;
        };
        if (!body.proposalId) {
          return jsonResponse(400, { error: 'proposalId es obligatorio.' });
        }
        const proposal = canonQueue.reject(body.proposalId);
        return jsonResponse(200, { proposal });
      }

      if (req.method === 'POST' && pathname === '/api/canon/chronicle') {
        if (aiGenerationLocked) {
          return jsonResponse(403, {
            error:
              'Generación por IA bloqueada: Thyrenia opera actualmente en Modo 100% Manual.',
          });
        }

        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          sessionTitle?: string;
          targetSubfolder?: string;
        };
        const activeCampaign = resolveCampaign(body.campaignId);
        const session = getCurrentSession(activeCampaign.id);
        const turns = sessionStore.listTurns(activeCampaign.id);
        const proposal = await canonQueue.enqueueChronicle({
          driver,
          campaignId: activeCampaign.id,
          sceneId: session.sceneState.id,
          sessionTitle:
            body.sessionTitle ||
            `Crónica ${activeCampaign.name} - Turno ${session.sceneState.turnNumber}`,
          targetSubfolder:
            body.targetSubfolder ||
            `${activeCampaign.vaultFolder}/Notas de Sesion`,
          events: turns.map((t) => ({
            turnNumber: t.turnNumber,
            locationNodeId: t.locationNodeId,
            playerAction: t.playerAction,
            narration: t.narration,
          })),
        });
        return jsonResponse(201, { proposal });
      }

      // === Endpoints Exclusivos del Estudio del GM ===

      if (
        req.method === 'POST' &&
        (pathname === '/api/gm/auth' || pathname === '/api/gm/login')
      ) {
        const body = JSON.parse(req.bodyText || '{}') as {
          gmKey?: string;
          localQuickLogin?: boolean;
        };
        if (body.gmKey && constantTimeEqual(body.gmKey, gmAccessKey)) {
          const sessionToken = issueGmSessionToken();
          return jsonResponse(200, {
            authenticated: true,
            role: 'gm',
            sessionToken,
            gmKey: sessionToken,
          });
        }
        if (body.localQuickLogin === true && req.isLocalhost !== false) {
          const sessionToken = issueGmSessionToken();
          return jsonResponse(200, {
            authenticated: true,
            role: 'gm',
            sessionToken,
            gmKey: sessionToken,
          });
        }
        try {
          gmAuthRateLimiter.checkAndRecord();
        } catch {
          return jsonResponse(429, {
            authenticated: false,
            error:
              'Demasiados intentos fallidos de acceso GM. Espera un minuto.',
          });
        }
        return jsonResponse(403, {
          authenticated: false,
          error:
            body.localQuickLogin && req.isLocalhost === false
              ? 'El acceso rápido local solo está habilitado desde la máquina del anfitrión. Ingresa la clave de GM.'
              : 'Clave de GM incorrecta.',
        });
      }

      if (req.method === 'POST' && pathname === '/api/gm/logout') {
        const headerKey = getHeaderCaseInsensitive(
          req.headers,
          'x-thyrenia-gm-key',
        )?.trim();
        if (headerKey) {
          gmSessions.delete(headerKey);
        }
        return jsonResponse(200, { authenticated: false, loggedOut: true });
      }

      if (pathname.startsWith('/api/gm/')) {
        if (!verifyGmAuth(req)) {
          return jsonResponse(403, {
            error: 'Clave de GM inválida o acceso no autorizado.',
          });
        }
      }

      if (req.method === 'GET' && pathname === '/api/gm/vault/overview') {
        const activeCampaign = resolveCampaign(
          parsedUrl.searchParams.get('campaignId'),
        );
        const session = getCurrentSession(activeCampaign.id);
        const folders = VaultContextCompiler.listVaultFolders(
          options.vaultPath,
        );
        const allNodes = VaultContextCompiler.scanVaultNodesForGm(
          options.vaultPath,
          session.partyState.revealedProgressiveNodeIds,
        );
        return jsonResponse(200, {
          folders,
          allNodes,
          allMapPins: getMapPins(activeCampaign.id),
          partyPosition: getPartyPosition(activeCampaign.id),
          quests: getQuests(activeCampaign.id),
          relationships: getRelationships(activeCampaign.id),
          stagedMedia: getStagedMediaNames(),
          availableImages: listAvailableImages(),
          sceneState: session.sceneState,
          partyState: session.partyState,
          calendarDate: formatThyreniaDate(
            getCalendarCoords(activeCampaign.id),
          ),
        });
      }

      if (req.method === 'GET' && pathname === '/api/gm/vault/node') {
        const relativePath = parsedUrl.searchParams.get('relativePath') || '';
        if (!relativePath || path.isAbsolute(relativePath)) {
          return jsonResponse(400, {
            error: 'relativePath inválido.',
          });
        }
        const resolvedRoot = path.resolve(options.vaultPath);
        const candidate = path.resolve(resolvedRoot, relativePath);
        const rel = path.relative(resolvedRoot, candidate);
        if (
          !rel ||
          rel.startsWith('..') ||
          path.isAbsolute(rel) ||
          rel.split(/[\\/]/).some((s) => s.startsWith('.')) ||
          !rel.toLowerCase().endsWith('.md')
        ) {
          return jsonResponse(400, {
            error: 'Violación de seguridad (Path Traversal): ruta no permitida.',
          });
        }
        if (!fs.existsSync(candidate)) {
          return jsonResponse(404, {
            error: `Nodo no encontrado: "${relativePath}"`,
          });
        }

        const rawFile = fs.readFileSync(candidate, 'utf-8');
        const parsed = matter(rawFile);
        const normalizedRel = rel.replace(/\\/g, '/');
        const title = path.basename(candidate, '.md');
        const targetSubfolder = path.posix.dirname(normalizedRel);
        const { publicMarkdown, dmSecrets } =
          VaultContextCompiler.splitPublicAndDmSecrets(parsed.content);
        const tags = VaultContextCompiler.extractInlineTags(
          publicMarkdown,
          parsed.data?.tags,
        );
        const { layer, asymmetricRequirements } =
          VaultContextCompiler.inferLayerAndRequirements(
            normalizedRel,
            parsed.data || {},
            tags,
          );
        const image = VaultContextCompiler.extractPrimaryImage(
          parsed.data || {},
          publicMarkdown,
        );
        const cardMeta = VaultContextCompiler.inferCardMetadata(
          normalizedRel,
          title,
          parsed.data || {},
          publicMarkdown,
          tags,
        );

        return jsonResponse(200, {
          title,
          relativePath: normalizedRel,
          targetSubfolder: targetSubfolder === '.' ? '' : targetSubfolder,
          layer,
          asymmetricRequirements,
          tags,
          image: image || '',
          cardType: cardMeta.cardType,
          cardFields: cardMeta.cardFields,
          publicMarkdown,
          dmSecretNotes: dmSecrets.join('\n\n'),
        });
      }

      if (req.method === 'POST' && pathname === '/api/gm/vault/save-node') {
        const body = JSON.parse(req.bodyText || '{}') as {
          title?: string;
          targetSubfolder?: string;
          layer?: string;
          asymmetricRequirements?: AsymmetricRequirements;
          tags?: string[];
          image?: string;
          cardType?: LoreCardType;
          cardAttributes?: Record<string, string>;
          publicMarkdown?: string;
          dmSecretNotes?: string;
          revealImmediately?: boolean;
          campaignId?: string;
        };

        if (!body.title || !body.title.trim()) {
          return jsonResponse(400, {
            error: 'El título del Nodo de Lore es obligatorio.',
          });
        }
        const layer = KnowledgeLayerSchema.parse(body.layer || 'base');
        const parsedCardType = body.cardType
          ? LoreCardTypeSchema.parse(body.cardType)
          : undefined;
        const cleanTitle = body.title.trim().replace(/\.md$/i, '');
        const targetSubfolder = (body.targetSubfolder || '').trim();

        const safeDestinationPath = SafeVaultPathGuard.resolveSafeWritePath(
          options.vaultPath,
          targetSubfolder,
          cleanTitle,
        );

        const composedMarkdown = VaultContextCompiler.composeNodeMarkdown({
          title: cleanTitle,
          layer,
          asymmetricRequirements: body.asymmetricRequirements,
          tags: body.tags,
          image: body.image,
          cardType: parsedCardType,
          cardAttributes: body.cardAttributes,
          publicMarkdown: body.publicMarkdown || '',
          dmSecretNotes: body.dmSecretNotes,
        });
        const safeMarkdown = SecretRedactor.redact(composedMarkdown);

        fs.mkdirSync(path.dirname(safeDestinationPath), { recursive: true });
        fs.writeFileSync(safeDestinationPath, safeMarkdown, 'utf-8');

        if (layer === 'progresiva' && body.revealImmediately === true) {
          const session = getCurrentSession();
          const updatedIds = Array.from(
            new Set([
              ...session.partyState.revealedProgressiveNodeIds,
              cleanTitle,
            ]),
          );
          sessionStore.saveSessionState(
            {
              ...session.partyState,
              revealedProgressiveNodeIds: updatedIds,
            },
            session.sceneState,
          );
        }

        const relativePath = path
          .relative(path.resolve(options.vaultPath), safeDestinationPath)
          .replace(/\\/g, '/');

        return jsonResponse(200, {
          savedPath: safeDestinationPath,
          relativePath,
          title: cleanTitle,
          layer,
        });
      }

      if (req.method === 'POST' && pathname === '/api/gm/fog/toggle') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          nodeId?: string;
          revealed?: boolean;
        };
        if (!body.nodeId || typeof body.revealed !== 'boolean') {
          return jsonResponse(400, {
            error: 'nodeId y revealed (boolean) son obligatorios.',
          });
        }

        const activeCampaign = resolveCampaign(body.campaignId);
        const session = getCurrentSession(activeCampaign.id);
        const targetLower = body.nodeId.toLowerCase();
        const filtered = session.partyState.revealedProgressiveNodeIds.filter(
          (id) => id.toLowerCase() !== targetLower,
        );
        if (body.revealed) {
          filtered.push(body.nodeId);
        }

        const updatedParty: PartyState = {
          ...session.partyState,
          revealedProgressiveNodeIds: filtered,
        };
        sessionStore.saveSessionState(updatedParty, session.sceneState);

        return jsonResponse(200, { partyState: updatedParty });
      }

      if (req.method === 'POST' && pathname === '/api/gm/scene/update') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          locationNodeId?: string;
          description?: string;
          activeThreats?: string[];
          environmentFlags?: Record<string, string | number | boolean>;
        };
        const activeCampaign = resolveCampaign(body.campaignId);
        const session = getCurrentSession(activeCampaign.id);
        const updatedScene = SceneStateSchema.parse({
          ...session.sceneState,
          ...(body.locationNodeId?.trim()
            ? { locationNodeId: body.locationNodeId.trim() }
            : {}),
          ...(body.description?.trim()
            ? { description: body.description.trim() }
            : {}),
          ...(Array.isArray(body.activeThreats)
            ? { activeThreats: body.activeThreats }
            : {}),
          ...(body.environmentFlags
            ? { environmentFlags: body.environmentFlags }
            : {}),
        });
        sessionStore.saveSessionState(session.partyState, updatedScene);

        return jsonResponse(200, { sceneState: updatedScene });
      }

      if (req.method === 'POST' && pathname === '/api/gm/calendar/advance') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          daysDelta?: number;
          yearDgd?: number;
          monthIndex?: number;
          dayOfMonth?: number;
        };
        const activeCampaign = resolveCampaign(body.campaignId);
        const current = getCalendarCoords(activeCampaign.id);
        const nextCoords: CalendarCoords =
          typeof body.daysDelta === 'number'
            ? advanceThyreniaDate(current, body.daysDelta)
            : {
                yearDgd: body.yearDgd ?? current.yearDgd,
                monthIndex: body.monthIndex ?? current.monthIndex,
                dayOfMonth: body.dayOfMonth ?? current.dayOfMonth,
              };
        sessionStore.saveMetadata(`calendar:${activeCampaign.id}`, nextCoords);
        const session = getCurrentSession(activeCampaign.id);
        return jsonResponse(200, {
          calendarDate: formatThyreniaDate(nextCoords),
          plotTimeline: buildCampaignPlotTimeline(
            activeCampaign.id,
            nextCoords,
            options.vaultPath,
            session.sceneState,
            sessionStore.listTurns(activeCampaign.id),
          ),
        });
      }

      if (req.method === 'POST' && pathname === '/api/gm/map/level-image') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          mapId?: string;
          imageFile?: string;
        };
        if (!body.mapId?.trim()) {
          return jsonResponse(400, { error: 'mapId es obligatorio.' });
        }
        const activeCampaign = resolveCampaign(body.campaignId);
        const currentImages =
          sessionStore.loadMetadata<Record<string, string>>(
            `atlas_images:${activeCampaign.id}`,
          ) || {};
        const nextImages = { ...currentImages };
        if (body.imageFile?.trim()) {
          nextImages[body.mapId.trim()] = body.imageFile.trim();
        } else {
          delete nextImages[body.mapId.trim()];
        }
        sessionStore.saveMetadata(`atlas_images:${activeCampaign.id}`, nextImages);
        return jsonResponse(200, { customMapImages: nextImages });
      }

      if (req.method === 'POST' && pathname === '/api/gm/map/pin') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          id?: string;
          mapId?: string;
          childMapId?: string;
          label?: string;
          x?: number;
          y?: number;
          pinKind?: MapPinKind;
          fogState?: MapPinFogState;
          linkedNodeId?: string;
          region?: string;
          rumorTeaser?: string;
          unlockCriteria?: string;
          delete?: boolean;
        };
        const activeCampaign = resolveCampaign(body.campaignId);
        const existing = getMapPins(activeCampaign.id);

        let updated: CampaignMapPin[];
        if (body.delete && body.id) {
          updated = existing.filter((p) => p.id !== body.id);
        } else {
          if (!body.label?.trim() || typeof body.x !== 'number' || typeof body.y !== 'number') {
            return jsonResponse(400, {
              error: 'label, x y y numéricos son obligatorios para guardar un pin.',
            });
          }
          const validKinds: MapPinKind[] = [
            'continent',
            'city',
            'dungeon_ruin',
            'temple',
            'danger',
            'landmark',
          ];
          const validFog: MapPinFogState[] = ['discovered', 'rumor', 'secret'];
          const pin: CampaignMapPin = {
            id:
              body.id?.trim() ||
              `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            campaignId: activeCampaign.id,
            ...(body.mapId?.trim() ? { mapId: body.mapId.trim() } : {}),
            ...(body.childMapId?.trim() ? { childMapId: body.childMapId.trim() } : {}),
            label: InputSanitizer.sanitize(body.label.trim(), 80).cleanText,
            x: Math.max(2, Math.min(98, Number(body.x.toFixed(1)))),
            y: Math.max(2, Math.min(98, Number(body.y.toFixed(1)))),
            pinKind:
              body.pinKind && validKinds.includes(body.pinKind)
                ? body.pinKind
                : 'landmark',
            fogState:
              body.fogState && validFog.includes(body.fogState)
                ? body.fogState
                : 'discovered',
            ...(body.linkedNodeId?.trim()
              ? { linkedNodeId: body.linkedNodeId.trim() }
              : {}),
            ...(body.region?.trim()
              ? { region: InputSanitizer.sanitize(body.region.trim(), 120).cleanText }
              : {}),
            ...(body.rumorTeaser?.trim()
              ? {
                  rumorTeaser: SecretRedactor.redact(
                    InputSanitizer.sanitize(body.rumorTeaser.trim(), 400).cleanText,
                  ),
                }
              : {}),
            ...(body.unlockCriteria?.trim()
              ? {
                  unlockCriteria: InputSanitizer.sanitize(
                    body.unlockCriteria.trim(),
                    220,
                  ).cleanText,
                }
              : {}),
          };
          const idx = existing.findIndex((p) => p.id === pin.id);
          updated =
            idx >= 0
              ? existing.map((p, i) => (i === idx ? pin : p))
              : [...existing, pin];
        }

        sessionStore.saveMetadata(`mappins:${activeCampaign.id}`, updated);
        return jsonResponse(200, {
          allMapPins: updated,
          mapPins: filterMapPinsForPlayer(updated, {}, false),
        });
      }

      if (req.method === 'POST' && pathname === '/api/gm/map/party-position') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          label?: string;
          x?: number;
          y?: number;
          linkedNodeId?: string;
        };
        if (typeof body.x !== 'number' || typeof body.y !== 'number') {
          return jsonResponse(400, {
            error: 'Las coordenadas x e y son obligatorias.',
          });
        }
        const activeCampaign = resolveCampaign(body.campaignId);
        const pos: PartyMapPosition = {
          campaignId: activeCampaign.id,
          label: InputSanitizer.sanitize(
            (body.label || 'Posición Actual del Grupo').trim(),
            80,
          ).cleanText,
          x: Math.max(2, Math.min(98, Number(body.x.toFixed(1)))),
          y: Math.max(2, Math.min(98, Number(body.y.toFixed(1)))),
          ...(body.linkedNodeId?.trim()
            ? { linkedNodeId: body.linkedNodeId.trim() }
            : {}),
        };
        sessionStore.saveMetadata(`partypos:${activeCampaign.id}`, pos);
        return jsonResponse(200, { partyPosition: pos });
      }

      if (req.method === 'POST' && pathname === '/api/gm/quests/save') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          id?: string;
          action?: 'save' | 'toggle_objective' | 'approve_rumor' | 'delete';
          objectiveIdx?: number;
          title?: string;
          kind?: CampaignQuest['kind'];
          status?: CampaignQuest['status'];
          giverNodeId?: string;
          locationNodeId?: string;
          summary?: string;
          objectives?: Array<{ text: string; done: boolean }>;
        };
        const activeCampaign = resolveCampaign(body.campaignId);
        const current = getQuests(activeCampaign.id);
        let updated: CampaignQuest[];

        if (body.action === 'delete' && body.id) {
          updated = current.filter((q) => q.id !== body.id);
        } else if (body.action === 'approve_rumor' && body.id) {
          updated = current.map((q) =>
            q.id === body.id ? { ...q, status: 'active' } : q,
          );
        } else if (
          body.action === 'toggle_objective' &&
          body.id &&
          typeof body.objectiveIdx === 'number'
        ) {
          updated = current.map((q) => {
            if (q.id !== body.id) return q;
            const objs = q.objectives.map((o, idx) =>
              idx === body.objectiveIdx ? { ...o, done: !o.done } : o,
            );
            return { ...q, objectives: objs };
          });
        } else {
          const idx = body.id
            ? current.findIndex((q) => q.id === body.id)
            : -1;
          const prev = idx >= 0 ? current[idx] : undefined;
          const nextTitle = (body.title ?? prev?.title ?? '').trim();
          if (!nextTitle) {
            return jsonResponse(400, {
              error: 'El título de la misión es obligatorio.',
            });
          }
          const nextQuest: CampaignQuest = {
            id:
              prev?.id ||
              body.id?.trim() ||
              `quest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            campaignId: activeCampaign.id,
            title: SecretRedactor.redact(nextTitle),
            kind: body.kind ?? prev?.kind ?? 'side_quest',
            status: body.status ?? prev?.status ?? 'active',
            ...(body.giverNodeId !== undefined
              ? body.giverNodeId.trim()
                ? { giverNodeId: body.giverNodeId.trim() }
                : {}
              : prev?.giverNodeId
                ? { giverNodeId: prev.giverNodeId }
                : {}),
            ...(body.locationNodeId !== undefined
              ? body.locationNodeId.trim()
                ? { locationNodeId: body.locationNodeId.trim() }
                : {}
              : prev?.locationNodeId
                ? { locationNodeId: prev.locationNodeId }
                : {}),
            summary: SecretRedactor.redact(
              (body.summary ?? prev?.summary ?? 'Objetivo en curso en Thyrenia.').trim(),
            ),
            objectives: body.objectives ?? prev?.objectives ?? [],
            ...(prev?.proposedBy ? { proposedBy: prev.proposedBy } : {}),
          };
          updated =
            idx >= 0
              ? current.map((q, i) => (i === idx ? nextQuest : q))
              : [...current, nextQuest];
        }

        sessionStore.saveMetadata(`quests:${activeCampaign.id}`, updated);
        return jsonResponse(200, { quests: updated });
      }

      if (req.method === 'POST' && pathname === '/api/gm/relationships/save') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          id?: string;
          action?: 'save' | 'confirm' | 'delete';
          sourceId?: string;
          targetId?: string;
          relationKind?: RelationKind;
          label?: string;
          status?: 'confirmed' | 'proposed';
        };
        const activeCampaign = resolveCampaign(body.campaignId);
        const current = getRelationships(activeCampaign.id);
        let updated: EntityRelationship[];

        if (body.action === 'delete' && body.id) {
          updated = current.filter((r) => r.id !== body.id);
        } else if (body.action === 'confirm' && body.id) {
          updated = current.map((r) =>
            r.id === body.id ? { ...r, status: 'confirmed' } : r,
          );
        } else {
          if (!body.sourceId?.trim() || !body.targetId?.trim() || !body.label?.trim()) {
            return jsonResponse(400, {
              error: 'sourceId, targetId y label son obligatorios.',
            });
          }
          const nextRel: EntityRelationship = {
            id:
              body.id?.trim() ||
              `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            campaignId: activeCampaign.id,
            sourceId: SecretRedactor.redact(body.sourceId.trim()),
            targetId: SecretRedactor.redact(body.targetId.trim()),
            relationKind: body.relationKind ?? 'ally',
            label: SecretRedactor.redact(body.label.trim()),
            status: body.status ?? 'confirmed',
          };
          const idx = current.findIndex((r) => r.id === nextRel.id);
          updated =
            idx >= 0
              ? current.map((r, i) => (i === idx ? nextRel : r))
              : [...current, nextRel];
        }

        sessionStore.saveMetadata(`rels:${activeCampaign.id}`, updated);
        return jsonResponse(200, { relationships: updated });
      }

      if (req.method === 'POST' && pathname === '/api/gm/session-log') {
        const body = JSON.parse(req.bodyText || '{}') as {
          campaignId?: string;
          title?: string;
          summary?: string;
          locationNodeId?: string;
          dateLabel?: string;
        };
        if (!body.title?.trim() || !body.summary?.trim()) {
          return jsonResponse(400, {
            error: 'Título y resumen de la entrada manual son obligatorios.',
          });
        }
        const activeCampaign = resolveCampaign(body.campaignId);
        const currentCal = formatThyreniaDate(getCalendarCoords(activeCampaign.id));
        const session = getCurrentSession(activeCampaign.id);
        const entry: ManualSessionLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          campaignId: activeCampaign.id,
          dateLabel: body.dateLabel?.trim() || currentCal.formatted,
          locationNodeId:
            body.locationNodeId?.trim() || session.sceneState.locationNodeId,
          title: SecretRedactor.redact(
            InputSanitizer.sanitize(body.title.trim(), 120).cleanText,
          ),
          summary: SecretRedactor.redact(
            InputSanitizer.sanitize(body.summary.trim(), 2000).cleanText,
          ),
          authorRole: 'gm',
          createdAt: new Date().toISOString(),
        };
        const currentLogs = getManualSessionLogs(activeCampaign.id);
        const nextLogs = [...currentLogs, entry];
        sessionStore.saveMetadata(`manual_log:${activeCampaign.id}`, nextLogs);
        return jsonResponse(201, { entry, manualSessionLogs: nextLogs });
      }

      if (req.method === 'POST' && pathname === '/api/gm/media/approve') {
        const body = JSON.parse(req.bodyText || '{}') as {
          fileName?: string;
        };
        if (!body.fileName?.trim()) {
          return jsonResponse(400, {
            error: 'fileName es obligatorio para aprobar la imagen.',
          });
        }
        const writtenPath = materializeStagedMedia(body.fileName);
        if (!writtenPath) {
          return jsonResponse(404, {
            error: `No existe imagen pendiente en espera con nombre "${body.fileName}".`,
          });
        }
        return jsonResponse(200, {
          approved: true,
          fileName: path.posix.basename(body.fileName.trim()),
          writtenPath,
        });
      }

      return jsonResponse(404, { error: `Ruta no encontrada: ${pathname}` });
    } catch (err) {
      if (err instanceof SyntaxError) {
        return jsonResponse(400, {
          error: 'JSON inválido en el cuerpo de la petición.',
        });
      }
      const message = SecretRedactor.redact(
        err instanceof Error ? err.message : String(err),
      );
      const status =
        /no encontrad/i.test(message)
          ? 404
          : /Payload excede/i.test(message)
            ? 413
            : /Path Traversal|directorio oculto|inválido|ya fue procesada|no permitid/i.test(
                  message,
                )
              ? 400
              : 500;
      return jsonResponse(status, { error: message });
    }
  }

  const listener: http.RequestListener = async (nodeReq, nodeRes) => {
    let bodyText: string | undefined;
    if (nodeReq.method === 'POST' || nodeReq.method === 'PUT') {
      try {
        bodyText = await readNodeRequestBody(nodeReq);
      } catch (err) {
        const errResp = jsonResponse(413, {
          error:
            err instanceof Error
              ? err.message
              : 'Payload excede el límite permitido.',
        });
        nodeRes.writeHead(errResp.status, errResp.headers);
        nodeRes.end(errResp.body);
        return;
      }
    }
    const normalizedHeaders: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(nodeReq.headers)) {
      normalizedHeaders[k.toLowerCase()] = Array.isArray(v) ? v[0] : v;
    }

    const remoteAddr = nodeReq.socket?.remoteAddress || '';
    const hasProxyHeaders = Boolean(
      normalizedHeaders['cf-connecting-ip'] ||
        normalizedHeaders['x-forwarded-for'],
    );
    const isLocalhost =
      !hasProxyHeaders &&
      (remoteAddr === '127.0.0.1' ||
        remoteAddr === '::1' ||
        remoteAddr === '::ffff:127.0.0.1');

    const response = await handleRequest({
      method: nodeReq.method || 'GET',
      url: nodeReq.url || '/',
      bodyText,
      headers: normalizedHeaders,
      isLocalhost,
    });
    nodeRes.writeHead(response.status, response.headers);
    nodeRes.end(response.binaryBody ?? response.body);
  };

  function close(): void {
    sqliteIndexer.close();
    sessionStore.close();
    canonQueue.close();
  }

  return { handleRequest, listener, close };
}
