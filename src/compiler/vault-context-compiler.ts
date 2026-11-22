import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  AsymmetricRequirements,
  CharacterContext,
  CompiledVaultView,
  ForbiddenTermRule,
  KnowledgeLayer,
  LoreCardType,
  LoreNode,
  PartyState,
} from '../domain/schemas.js';

export interface VocabularyViolation {
  forbiddenTerm: string;
  thyrenianEquivalent: string;
  matchedText: string;
}

/**
 * Audita que ninguna narrativa o Propuesta de Canon utilice términos anacrónicos
 * prohibidos en Thyrenia (ej. café, robot, restaurante, semana, dinero, a.m./p.m.).
 */
export class VocabularyGuard {
  private static readonly DEFAULT_RULES: ForbiddenTermRule[] = [
    {
      forbidden: 'a.m.',
      thyrenianEquivalent: '(No especificado, evitar o describir)',
    },
    {
      forbidden: 'p.m.',
      thyrenianEquivalent: '(No especificado, evitar o describir)',
    },
    { forbidden: 'café', thyrenianEquivalent: 'qoketh / qokethe' },
    { forbidden: 'dinero', thyrenianEquivalent: 'moneda / oro / plata' },
    {
      forbidden: 'restaurante',
      thyrenianEquivalent: 'salón de banquetes / taberna / posada',
    },
    { forbidden: 'semana', thyrenianEquivalent: 'septimana' },
    { forbidden: 'robot', thyrenianEquivalent: 'gólem / autómata / constructo' },
    { forbidden: 'en punto', thyrenianEquivalent: 'campanada/s' },
  ];

  static parseTermsMarkdown(markdownContent: string): ForbiddenTermRule[] {
    const rules: ForbiddenTermRule[] = [];
    const lines = markdownContent.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|') || trimmed.includes('---')) {
        continue;
      }
      const cells = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length >= 2) {
        const left = cells[0];
        const right = cells[1];
        if (
          /t[eé]rmino/i.test(left) ||
          /prohibido/i.test(left) ||
          left.startsWith(':')
        ) {
          continue;
        }

        // Si una celda tiene "a.m. / p.m.", desglosamos ambas entradas
        const subTerms = left
          .replace(/\(.*?\)/g, '')
          .split('/')
          .map((s) => s.trim())
          .filter(Boolean);

        for (const subTerm of subTerms) {
          rules.push({
            forbidden: subTerm,
            thyrenianEquivalent: right.replace(/[“”"']/g, '').trim(),
          });
        }
      }
    }

    return rules.length > 0 ? rules : this.DEFAULT_RULES;
  }

  static audit(
    text: string,
    rules: ForbiddenTermRule[] = this.DEFAULT_RULES,
  ): VocabularyViolation[] {
    const violations: VocabularyViolation[] = [];
    const activeRules = rules.length > 0 ? rules : this.DEFAULT_RULES;

    for (const rule of activeRules) {
      const escaped = rule.forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const allowPlural =
        !/\s/.test(rule.forbidden) &&
        /\p{L}$/u.test(rule.forbidden) &&
        rule.forbidden.length >= 3;
      const pattern = allowPlural ? `${escaped}(?:es|s)?` : escaped;
      const regex = new RegExp(`(?<!\\p{L})${pattern}(?!\\p{L})`, 'iu');
      const match = text.match(regex);
      if (match) {
        violations.push({
          forbiddenTerm: rule.forbidden,
          thyrenianEquivalent: rule.thyrenianEquivalent,
          matchedText: match[0],
        });
      }
    }

    return violations;
  }
}

export interface NodeLockReason {
  status: 'asimetrica' | 'progresiva';
  criteria: string;
}

/**
 * Costura 1 (Seam 1): Compilador de Contexto del Vault Maestro con Niebla de Guerra Estratificada
 * y Aislamiento Zero-Trust de Secretos del DM (ADR-0007, ADR-0008, ADR-0011).
 */
export class VaultContextCompiler {
  private static readonly IGNORED_DIRS = new Set([
    '.obsidian',
    '.agents',
    '.agent',
    '.git',
    '.github',
    '.scratch',
    'docs',
    'node_modules',
    '0 - Plantillas',
    'images',
  ]);

  static stripObsidianComments(rawMarkdown: string): string {
    // Extirpa físicamente bloques %%...%% (incluyendo multilínea)
    return rawMarkdown.replace(/%%[\s\S]*?%%/g, '').trim();
  }

  static splitPublicAndDmSecrets(rawMarkdown: string): {
    publicMarkdown: string;
    dmSecrets: string[];
  } {
    const dmSecrets: string[] = [];
    const regex = /%%([\s\S]*?)%%/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rawMarkdown)) !== null) {
      const cleaned = match[1].replace(/^SECRETO_DM:\s*/i, '').trim();
      if (cleaned) {
        dmSecrets.push(cleaned);
      }
    }
    return {
      publicMarkdown: this.stripObsidianComments(rawMarkdown),
      dmSecrets,
    };
  }

  static composeNodeMarkdown(params: {
    title: string;
    layer: KnowledgeLayer;
    asymmetricRequirements?: AsymmetricRequirements;
    tags?: string[];
    image?: string;
    cardType?: LoreCardType;
    cardAttributes?: Record<string, string>;
    publicMarkdown: string;
    dmSecretNotes?: string;
  }): string {
    const frontmatter: Record<string, unknown> = {};

    if (params.layer === 'dm_secret') {
      frontmatter.capa = 'dm_secret';
      frontmatter.visibilidad = 'dm_only';
    } else if (params.layer === 'asimetrica') {
      frontmatter.capa = 'asimetrica';
      const req = params.asymmetricRequirements;
      const cleanReq: Record<string, string[]> = {};
      if (req?.classes?.length) cleanReq.clases = req.classes;
      if (req?.races?.length) cleanReq.razas = req.races;
      if (req?.factions?.length) cleanReq.facciones = req.factions;
      if (req?.characterIds?.length) cleanReq.characterIds = req.characterIds;
      if (Object.keys(cleanReq).length > 0) {
        frontmatter.requisitos = cleanReq;
      }
    } else if (params.layer === 'progresiva') {
      frontmatter.capa = 'progresiva';
    } else if (params.layer === 'base') {
      frontmatter.capa = 'base';
    }

    if (params.cardType) {
      frontmatter.tipo = params.cardType;
    }

    if (params.cardAttributes) {
      for (const [key, value] of Object.entries(params.cardAttributes)) {
        const cleanKey = key.trim().toLowerCase();
        const cleanVal = String(value || '').trim();
        if (cleanKey && cleanVal) {
          frontmatter[cleanKey] = cleanVal;
        }
      }
    }

    const cleanTags = (params.tags || [])
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);
    if (cleanTags.length > 0) {
      frontmatter.tags = cleanTags;
    }

    if (params.image?.trim()) {
      frontmatter.imagen = path.posix.basename(
        params.image.trim().replace(/\\/g, '/'),
      );
    }

    const bodyBase = params.publicMarkdown.trim() || `# ${params.title}`;
    const secretBlock = params.dmSecretNotes?.trim()
      ? `\n\n%%SECRETO_DM:\n${params.dmSecretNotes.trim()}\n%%`
      : '';
    const fullBody = `${bodyBase}${secretBlock}\n`;

    if (Object.keys(frontmatter).length > 0) {
      return matter.stringify(fullBody, frontmatter);
    }
    return fullBody;
  }

  static listVaultFolders(vaultPath: string): string[] {
    const resolvedRoot = path.resolve(vaultPath);
    if (!fs.existsSync(resolvedRoot)) {
      throw new Error(`VAULT_PATH no existe: "${resolvedRoot}"`);
    }

    const folders: string[] = [];
    const walkDirs = (dirPath: string): void => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (
          !entry.isDirectory() ||
          entry.name.startsWith('.') ||
          this.IGNORED_DIRS.has(entry.name)
        ) {
          continue;
        }
        const fullPath = path.join(dirPath, entry.name);
        const rel = path.relative(resolvedRoot, fullPath).replace(/\\/g, '/');
        folders.push(rel);
        walkDirs(fullPath);
      }
    };

    walkDirs(resolvedRoot);
    return folders.sort((a, b) => a.localeCompare(b));
  }

  static scanVaultNodesForGm(
    vaultPath: string,
    revealedProgressiveNodeIds: string[] = [],
  ): Array<{
    id: string;
    title: string;
    relativePath: string;
    layer: KnowledgeLayer;
    asymmetricRequirements?: AsymmetricRequirements;
    tags: string[];
    isRevealedToParty: boolean;
    hasDmSecrets: boolean;
  }> {
    const resolvedRoot = path.resolve(vaultPath);
    if (!fs.existsSync(resolvedRoot)) {
      throw new Error(`VAULT_PATH no existe: "${resolvedRoot}"`);
    }

    const mdFiles = this.walkMarkdownFiles(resolvedRoot, resolvedRoot);
    const revealedSet = new Set(
      revealedProgressiveNodeIds.map((id) => id.toLowerCase()),
    );

    return mdFiles
      .map((filePath) => {
        const relativePath = path
          .relative(resolvedRoot, filePath)
          .replace(/\\/g, '/');
        const rawFile = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(rawFile);
        const title = path.basename(filePath, '.md');
        const { publicMarkdown, dmSecrets } = this.splitPublicAndDmSecrets(
          parsed.content,
        );
        const tags = this.extractInlineTags(publicMarkdown, parsed.data?.tags);
        const { layer, asymmetricRequirements } =
          this.inferLayerAndRequirements(relativePath, parsed.data || {}, tags);

        const isRevealedToParty =
          layer === 'base' ||
          (layer === 'progresiva' &&
            (revealedSet.has(title.toLowerCase()) ||
              revealedSet.has(relativePath.toLowerCase())));

        return {
          id: title,
          title,
          relativePath,
          layer,
          asymmetricRequirements,
          tags,
          isRevealedToParty,
          hasDmSecrets: dmSecrets.length > 0 || layer === 'dm_secret',
        };
      })
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  static extractWikilinks(markdown: string): string[] {
    const links = new Set<string>();
    const regex = /(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
      const target = match[1].trim();
      if (target) {
        links.add(target);
      }
    }
    return Array.from(links);
  }

  static extractPrimaryImage(
    frontmatter: Record<string, unknown>,
    sanitizedMarkdown: string,
  ): string | undefined {
    const rawFm =
      frontmatter.imagen ?? frontmatter.banner ?? frontmatter.image ?? '';
    const isMediaExt = (name: string): boolean =>
      /\.(jpe?g|png|webp|gif|svg)$/i.test(name);

    if (typeof rawFm === 'string' && rawFm.trim()) {
      const cleaned = rawFm
        .trim()
        .replace(/^!\[\[|\]\]$/g, '')
        .split('|')[0]
        .trim();
      const base = path.posix.basename(cleaned.replace(/\\/g, '/'));
      if (isMediaExt(base)) return base;
    }

    const obsidianEmbed = sanitizedMarkdown.match(
      /!\[\[([^\]|]+?\.(?:jpe?g|png|webp|gif|svg))(?:\|[^\]]*)?\]\]/i,
    );
    if (obsidianEmbed?.[1]) {
      return path.posix.basename(obsidianEmbed[1].trim().replace(/\\/g, '/'));
    }

    const mdImg = sanitizedMarkdown.match(
      /!\[[^\]]*\]\(([^)]+?\.(?:jpe?g|png|webp|gif|svg))\)/i,
    );
    if (mdImg?.[1] && !/^https?:\/\//i.test(mdImg[1])) {
      return path.posix.basename(mdImg[1].trim().replace(/\\/g, '/'));
    }

    return undefined;
  }

  static extractInlineTags(
    markdown: string,
    frontmatterTags: unknown,
  ): string[] {
    const tags = new Set<string>();

    if (Array.isArray(frontmatterTags)) {
      for (const t of frontmatterTags) {
        if (typeof t === 'string') {
          tags.add(t.replace(/^#/, '').toLowerCase().trim());
        }
      }
    } else if (typeof frontmatterTags === 'string') {
      for (const t of frontmatterTags.split(/[,\s]+/)) {
        if (t.trim()) {
          tags.add(t.replace(/^#/, '').toLowerCase().trim());
        }
      }
    }

    const inlineRegex = /(?:^|\s)#([a-zA-Z0-9_\-/áéíóúÁÉÍÓÚñÑ]+)/g;
    let match: RegExpExecArray | null;
    while ((match = inlineRegex.exec(markdown)) !== null) {
      tags.add(match[1].toLowerCase());
    }

    return Array.from(tags);
  }

  static inferLayerAndRequirements(
    relativePath: string,
    frontmatter: Record<string, unknown>,
    tags: string[],
  ): {
    layer: KnowledgeLayer;
    asymmetricRequirements?: AsymmetricRequirements;
  } {
    // 1. Verificar si es secreto exclusivo del DM
    const isDmSecret =
      frontmatter.visibilidad === 'dm_only' ||
      frontmatter.capa === 'dm_secret' ||
      frontmatter.secret === true ||
      tags.includes('secreto') ||
      tags.includes('dm_only');

    if (isDmSecret) {
      return { layer: 'dm_secret' };
    }

    // 2. Verificar Capa Asimétrica por frontmatter o tags (#lore/asimetrico/clase/hechicero)
    const asymmetricTags = tags.filter((t) =>
      t.startsWith('lore/asimetrico/'),
    );
    if (
      frontmatter.capa === 'asimetrica' ||
      frontmatter.layer === 'asimetrica' ||
      asymmetricTags.length > 0
    ) {
      const rawReq = (frontmatter.requisitos ||
        frontmatter.requirements ||
        {}) as Record<string, unknown>;

      const toArray = (val: unknown): string[] => {
        if (Array.isArray(val)) return val.map((v) => String(v).toLowerCase());
        if (typeof val === 'string') return [val.toLowerCase()];
        return [];
      };

      const races = toArray(rawReq.races ?? rawReq.raza ?? rawReq.razas);
      const classes = toArray(rawReq.classes ?? rawReq.clase ?? rawReq.clases);
      const factions = toArray(
        rawReq.factions ?? rawReq.faccion ?? rawReq.facciones,
      );
      const characterIds = toArray(rawReq.characterIds ?? rawReq.personaje);

      for (const tag of asymmetricTags) {
        const parts = tag.split('/');
        // formato: lore/asimetrico/<tipo>/<valor> o lore/asimetrico/<clase>
        if (parts.length === 4) {
          const [, , kind, val] = parts;
          if (kind === 'clase') classes.push(val);
          else if (kind === 'raza') races.push(val);
          else if (kind === 'faccion') factions.push(val);
          else if (kind === 'personaje') characterIds.push(val);
        } else if (parts.length === 3) {
          classes.push(parts[2]);
        }
      }

      return {
        layer: 'asimetrica',
        asymmetricRequirements: {
          races: Array.from(new Set(races)),
          classes: Array.from(new Set(classes)),
          factions: Array.from(new Set(factions)),
          characterIds: Array.from(new Set(characterIds)),
        },
      };
    }

    // 3. Verificar override explícito en frontmatter
    if (frontmatter.capa === 'progresiva' || frontmatter.layer === 'progresiva') {
      return { layer: 'progresiva' };
    }
    if (frontmatter.capa === 'base' || frontmatter.layer === 'base') {
      return { layer: 'base' };
    }

    // 4. Inferencia por Carpeta (ADR-0008)
    const normalizedPath = relativePath.replace(/\\/g, '/');

    if (
      normalizedPath.startsWith('03 - Archivos Externos - Mis PJs/') ||
      /^01 - Campanas\/.+\/Personajes\/[^/]+\.md$/i.test(normalizedPath)
    ) {
      const characterSlug = path.posix
        .basename(normalizedPath, '.md')
        .toLowerCase();
      return {
        layer: 'asimetrica',
        asymmetricRequirements: {
          races: [],
          classes: [],
          factions: [],
          characterIds: [characterSlug],
        },
      };
    }

    if (normalizedPath.startsWith('01 - Campanas/')) {
      return { layer: 'progresiva' };
    }

    if (
      normalizedPath.startsWith('00 - Lore Central y Cosmogonia/') ||
      normalizedPath.startsWith('02 - Compendio de Reglas y Fichas/')
    ) {
      return { layer: 'base' };
    }

    if (!normalizedPath.includes('/')) {
      const rootBaseName = path.posix
        .basename(normalizedPath, '.md')
        .toLowerCase();
      if (/gu[ií][oó]n|sesi[oó]n|campa[ñn]a|teaser/i.test(rootBaseName)) {
        return { layer: 'progresiva' };
      }
    }

    return { layer: 'base' };
  }

  static matchesAsymmetricRequirements(
    character: CharacterContext,
    req?: AsymmetricRequirements,
  ): boolean {
    if (!req) return false;

    const hasAnyRequirement =
      req.races.length > 0 ||
      req.classes.length > 0 ||
      req.factions.length > 0 ||
      req.characterIds.length > 0;

    if (!hasAnyRequirement) {
      return false;
    }

    if (
      req.characterIds.length > 0 &&
      (req.characterIds.includes(character.id.toLowerCase()) ||
        req.characterIds.includes(character.name.toLowerCase()))
    ) {
      return true;
    }
    if (
      req.classes.length > 0 &&
      req.classes.includes(character.class.toLowerCase())
    ) {
      return true;
    }
    if (
      req.races.length > 0 &&
      req.races.includes(character.race.toLowerCase())
    ) {
      return true;
    }
    if (
      req.factions.length > 0 &&
      character.factions.some((f) => req.factions.includes(f.toLowerCase()))
    ) {
      return true;
    }

    return false;
  }

  private static walkMarkdownFiles(
    dirPath: string,
    vaultRoot: string,
    results: string[] = [],
  ): string[] {
    if (!fs.existsSync(dirPath)) {
      return results;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || this.IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        this.walkMarkdownFiles(fullPath, vaultRoot, results);
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith('.md') &&
        entry.name !== 'GLOSSARY.md' &&
        entry.name !== 'AGENTS.md' &&
        entry.name !== 'GEMINI.md'
      ) {
        results.push(fullPath);
      }
    }

    return results;
  }

  static compileView(
    vaultPath: string,
    partyState: PartyState,
    activeCharacter: CharacterContext,
  ): CompiledVaultView {
    const resolvedRoot = path.resolve(vaultPath);
    if (!fs.existsSync(resolvedRoot)) {
      throw new Error(`VAULT_PATH no existe: "${resolvedRoot}"`);
    }

    const mdFiles = this.walkMarkdownFiles(resolvedRoot, resolvedRoot);
    const revealedProgressiveSet = new Set(
      partyState.revealedProgressiveNodeIds.map((id) => id.toLowerCase()),
    );

    let forbiddenTerms: ForbiddenTermRule[] = [];
    const visibleNodes: LoreNode[] = [];

    let baseCount = 0;
    let asymmetricVisibleCount = 0;
    let progressiveVisibleCount = 0;
    let hiddenOrSecretCount = 0;

    for (const filePath of mdFiles) {
      const relativePath = path
        .relative(resolvedRoot, filePath)
        .replace(/\\/g, '/');
      const rawFile = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(rawFile);
      const title = path.basename(filePath, '.md');
      const nodeId = title;

      if (title.toLowerCase().includes('términos de thyrenia') || title.toLowerCase().includes('terminos de thyrenia')) {
        forbiddenTerms = VocabularyGuard.parseTermsMarkdown(parsed.content);
      }

      // Extirpar comentarios %%...%% ANTES de extraer wikilinks o contenido (Zero-Trust)
      const sanitizedContent = this.stripObsidianComments(parsed.content);
      const tags = this.extractInlineTags(sanitizedContent, parsed.data?.tags);
      const { layer, asymmetricRequirements } = this.inferLayerAndRequirements(
        relativePath,
        parsed.data || {},
        tags,
      );

      // Evaluación de visibilidad en las 3 Capas
      let isVisible = false;
      if (layer === 'base') {
        isVisible = true;
        baseCount++;
      } else if (layer === 'asimetrica') {
        if (
          this.matchesAsymmetricRequirements(
            activeCharacter,
            asymmetricRequirements,
          )
        ) {
          isVisible = true;
          asymmetricVisibleCount++;
        } else {
          hiddenOrSecretCount++;
        }
      } else if (layer === 'progresiva') {
        if (
          revealedProgressiveSet.has(nodeId.toLowerCase()) ||
          revealedProgressiveSet.has(relativePath.toLowerCase())
        ) {
          isVisible = true;
          progressiveVisibleCount++;
        } else {
          hiddenOrSecretCount++;
        }
      } else {
        // dm_secret
        hiddenOrSecretCount++;
      }

      if (isVisible) {
        const outgoingLinks = this.extractWikilinks(sanitizedContent);
        const image = this.extractPrimaryImage(
          parsed.data || {},
          sanitizedContent,
        );
        const cardMeta = this.inferCardMetadata(
          relativePath,
          title,
          parsed.data || {},
          sanitizedContent,
          tags,
        );
        visibleNodes.push({
          id: nodeId,
          title,
          relativePath,
          layer,
          asymmetricRequirements,
          sanitizedContent,
          outgoingLinks,
          tags,
          cardType: cardMeta.cardType,
          isSkeleton: cardMeta.isSkeleton,
          cardFields: cardMeta.cardFields,
          ...(image ? { image } : {}),
        });
      }
    }

    if (forbiddenTerms.length === 0) {
      forbiddenTerms = VocabularyGuard.parseTermsMarkdown('');
    }

    // Construir grafo de adyacencia filtrado: solo enlaces entre nodos visibles para este jugador
    const visibleIdSet = new Set(visibleNodes.map((n) => n.id.toLowerCase()));
    const adjacencyGraph: Record<string, string[]> = {};

    for (const node of visibleNodes) {
      adjacencyGraph[node.id] = node.outgoingLinks.filter((target) =>
        visibleIdSet.has(target.toLowerCase()),
      );
    }

    return {
      activeCharacter,
      visibleNodes,
      adjacencyGraph,
      forbiddenTerms,
      stats: {
        totalScanned: mdFiles.length,
        baseCount,
        asymmetricVisibleCount,
        progressiveVisibleCount,
        hiddenOrSecretCount,
      },
    };
  }

  /**
   * Calcula los criterios públicos de bloqueo para nodos de Capa Asimétrica o Capa Progresiva
   * no visibles al personaje activo. NUNCA expone nodos dm_secret ni contenido privado.
   */
  static computeLockReasons(
    vaultPath: string,
    partyState: PartyState,
    activeCharacter: CharacterContext,
  ): Record<string, NodeLockReason> {
    const resolvedRoot = path.resolve(vaultPath);
    if (!fs.existsSync(resolvedRoot)) {
      return {};
    }

    const mdFiles = this.walkMarkdownFiles(resolvedRoot, resolvedRoot);
    const revealedProgressiveSet = new Set(
      partyState.revealedProgressiveNodeIds.map((id) => id.toLowerCase()),
    );
    const reasons: Record<string, NodeLockReason> = {};

    for (const filePath of mdFiles) {
      const relativePath = path
        .relative(resolvedRoot, filePath)
        .replace(/\\/g, '/');
      const rawFile = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(rawFile);
      const title = path.basename(filePath, '.md');
      const sanitizedContent = this.stripObsidianComments(parsed.content);
      const tags = this.extractInlineTags(sanitizedContent, parsed.data?.tags);
      const { layer, asymmetricRequirements } = this.inferLayerAndRequirements(
        relativePath,
        parsed.data || {},
        tags,
      );

      if (layer === 'dm_secret' || layer === 'base') {
        continue;
      }

      if (layer === 'asimetrica') {
        if (
          !this.matchesAsymmetricRequirements(
            activeCharacter,
            asymmetricRequirements,
          )
        ) {
          const parts: string[] = [];
          if (asymmetricRequirements?.classes.length) {
            parts.push(`clase (${asymmetricRequirements.classes.join('/')})`);
          }
          if (asymmetricRequirements?.races.length) {
            parts.push(`raza (${asymmetricRequirements.races.join('/')})`);
          }
          if (asymmetricRequirements?.factions.length) {
            parts.push(
              `facción (${asymmetricRequirements.factions.join('/')})`,
            );
          }
          if (asymmetricRequirements?.characterIds.length) {
            parts.push('trasfondo personal de otro personaje');
          }
          reasons[title.toLowerCase()] = {
            status: 'asimetrica',
            criteria:
              parts.length > 0
                ? `Capa Asimétrica: requiere ${parts.join(', ')}.`
                : 'Capa Asimétrica: conocimiento exclusivo de otro perfil de personaje.',
          };
        }
      } else if (layer === 'progresiva') {
        const isRevealed =
          revealedProgressiveSet.has(title.toLowerCase()) ||
          revealedProgressiveSet.has(relativePath.toLowerCase());
        if (!isRevealed) {
          reasons[title.toLowerCase()] = {
            status: 'progresiva',
            criteria:
              'Capa Progresiva: oculto hasta que la Party descubra este hito o lugar en campaña.',
          };
        }
      }
    }

    return reasons;
  }

  static inferCardMetadata(
    relativePath: string,
    title: string,
    frontmatter: Record<string, unknown>,
    sanitizedContent: string,
    tags: string[],
  ): {
    cardType: LoreCardType;
    isSkeleton: boolean;
    cardFields: Record<string, string>;
  } {
    const normPath = relativePath.replace(/\\/g, '/');
    const rawType = String(frontmatter.tipo ?? frontmatter.cardType ?? '')
      .trim()
      .toLowerCase();

    const CARD_TYPE_LABELS: Record<LoreCardType, string> = {
      character: 'Personaje / PNJ',
      location: 'Lugar / Región',
      faction: 'Facción / Orden',
      quest_clue: 'Misión / Pista',
      session: 'Sesión de Campaña',
      chapter: 'Capítulo Narrado',
      deity: 'Deidad / Panteón',
      rule_lore: 'Lore y Reglas',
    };

    const mapExplicitType = (raw: string): LoreCardType | null => {
      if (!raw) return null;
      if (raw in CARD_TYPE_LABELS) return raw as LoreCardType;
      if (/personaje|pj|pnj|npc/.test(raw)) return 'character';
      if (/lugar|ciudad|region|regi[oó]n|plano|locaci[oó]n/.test(raw))
        return 'location';
      if (/facci[oó]n|orden|culto|gremio/.test(raw)) return 'faction';
      if (/misi[oó]n|quest|pista|rumor/.test(raw)) return 'quest_clue';
      if (/sesi[oó]n|acta/.test(raw)) return 'session';
      if (/cap[ií]tulo|novela|relato/.test(raw)) return 'chapter';
      if (/deidad|dios/.test(raw)) return 'deity';
      if (/regla|lore|mecanica/.test(raw)) return 'rule_lore';
      return null;
    };

    let cardType: LoreCardType | null = mapExplicitType(rawType);
    if (!cardType) {
      if (
        normPath.startsWith('03 - Archivos Externos - Mis PJs/') ||
        /\/Personajes\//i.test(normPath)
      ) {
        cardType = 'character';
      } else if (/\/Capitulos Narrados\//i.test(normPath)) {
        cardType = 'chapter';
      } else if (/\/Notas de Sesion\//i.test(normPath)) {
        cardType = 'session';
      } else if (/\/Pistas\//i.test(normPath)) {
        cardType = 'quest_clue';
      } else if (normPath.startsWith('00 - Lore Central y Cosmogonia/Geografia y Planos/')) {
        cardType = 'location';
      } else if (normPath.startsWith('00 - Lore Central y Cosmogonia/Panteon Divino/')) {
        cardType = 'deity';
      } else if (
        tags.some((t) => /^(faccion|orden|culto|escuadron)$/i.test(t)) ||
        /\b(culto|orden|escuadr[oó]n|sindicato|gremio)\b/i.test(title)
      ) {
        cardType = 'faction';
      } else if (
        /\b(posada|ciudad|templo|bosque|pozo|marisal|dracoria|evedia|avaloria|thornia|istoria)\b/i.test(
          title,
        )
      ) {
        cardType = 'location';
      } else {
        cardType = 'rule_lore';
      }
    }

    const strippedLines = sanitizedContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((line) => {
        if (!line) return false;
        if (/^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?$/.test(line)) return false;
        if (/^(?:Status|Tags)\s*:/i.test(line)) return false;
        if (/^#+\s*(?:Referencias|Enlaces|Notas)\s*$/i.test(line)) return false;
        if (/^#\s+/.test(line) && line.replace(/^#+\s*/, '').toLowerCase() === title.toLowerCase()) {
          return false;
        }
        return true;
      });
    const cleanProse = strippedLines.join(' ').replace(/[*_`>#-]/g, '').trim();
    const isSkeleton = cleanProse.length < 45;

    const cardFields: Record<string, string> = {
      Tipo: CARD_TYPE_LABELS[cardType],
      Estado: String(
        frontmatter.estado ??
          frontmatter.status ??
          (isSkeleton ? 'En construcción' : 'Canónica'),
      ),
    };

    const parts = normPath.split('/');
    if (parts[0] === '01 - Campanas' && parts[1]) {
      cardFields['Campaña'] = parts[1].replace(/^\d+\s*-\s*/, '');
    } else if (parts.length > 1) {
      cardFields['Esfera'] = parts[parts.length - 2].replace(/^\d+\s*-\s*/, '');
    }

    const optionalFields: Array<[string, string[]]> = [
      ['Región', ['region', 'región', 'ubicacion', 'ubicación']],
      ['Facción', ['faccion', 'facción']],
      ['Peligro', ['peligro', 'amenaza']],
      ['Actitud', ['actitud', 'alineamiento']],
      ['Raza', ['raza', 'race']],
      ['Clase', ['clase', 'class']],
      ['Fecha', ['fecha', 'date']],
    ];
    for (const [label, keys] of optionalFields) {
      for (const k of keys) {
        const val = frontmatter[k];
        if (val !== undefined && val !== null && String(val).trim()) {
          cardFields[label] = String(val).trim();
          break;
        }
      }
    }

    return { cardType, isSkeleton, cardFields };
  }
}
