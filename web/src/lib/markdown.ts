import type {
  ApiViewPayload,
  CosmicFestival,
  CosmicWheelMonth,
  LoreCardType,
  LoreNode,
  PlotTimelineEntry,
} from '../types';

export function capitalize(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return '';
  const accentMap: Record<string, string> = {
    clerigo: 'Clérigo',
    barbaro: 'Bárbaro',
    picaro: 'Pícaro',
    paladin: 'Paladín',
    bardo: 'Bardo',
    guerrero: 'Guerrero',
    hechicero: 'Hechicero',
    mago: 'Mago',
    explorador: 'Explorador',
    monje: 'Monje',
    druida: 'Druida',
    brujo: 'Brujo',
  };
  const hit = accentMap[s.toLowerCase()];
  if (hit) return hit;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function cleanBreadcrumbSegment(raw: string): string {
  return raw
    .replace(/\.md$/i, '')
    .replace(/^\d+\s*-\s*/, '')
    .replace(/\bPanteon\b/g, 'Panteón')
    .replace(/\bCosmogonia\b/g, 'Cosmogonía')
    .replace(/\bGeografia\b/g, 'Geografía')
    .replace(/\bMecanicas\b/g, 'Mecánicas')
    .replace(/\bCampanas\b/g, 'Campañas')
    .replace(/\bCampana\b/g, 'Campaña')
    .replace(/\bCapitulos\b/g, 'Capítulos')
    .replace(/\bSesion\b/g, 'Sesión')
    .trim();
}

export function classifyCategory(relativePath: string): string {
  const p = String(relativePath || '');
  if (p.startsWith('03 - Archivos Externos') || p.includes('/Personajes/')) return 'Personajes';
  if (p.includes('/Capitulos Narrados/')) return 'Crónicas y Capítulos';
  if (p.includes('/Cosmogonia/')) return 'Cosmogonía y Origen';
  if (p.includes('/Panteon Divino/')) return 'Panteón Divino';
  if (p.includes('/Geografia y Planos/')) return 'Geografía y Planos';
  if (p.includes('/Reglas y Mecanicas/')) return 'Reglas y Mecánicas';
  if (p.includes('/Razas/')) return 'Razas';
  if (p.includes('/Clases/')) return 'Clases';
  if (p.startsWith('01 - Campanas/')) return 'Campañas';
  if (p.startsWith('00 - Lore Central')) return 'Cultura y Vocabulario';
  return 'Otros';
}

export const CARD_TYPE_LABELS: Record<LoreCardType, string> = {
  character: 'Personaje',
  location: 'Lugar',
  faction: 'Facción',
  quest_clue: 'Pista / Misión',
  session: 'Sesión',
  chapter: 'Capítulo',
  deity: 'Deidad',
  rule_lore: 'Códice',
};

export function layerLabel(layer: string): string {
  if (layer === 'asimetrica') return 'Conocimiento de PJ';
  if (layer === 'progresiva') return 'Descubierto en Campaña';
  if (layer === 'dm_secret') return 'Secreto DM';
  return 'Saber Común';
}

export function humanizeSceneTitle(sceneId: string, locationNodeId: string): string {
  if (!sceneId || /^[a-z0-9_-]+$/i.test(sceneId)) {
    return locationNodeId ? `Escena en ${locationNodeId}` : 'Escena en Curso';
  }
  return sceneId;
}

/**
 * Purga metadatos crudos de Obsidian, citas [cite:], tablas con pipes | y cabeceras
 * para que ningún extracto filtre jerga técnica al jugador.
 */
export function extractCleanExcerpt(rawMd: string, maxLen = 120): string {
  const lines = String(rawMd || '')
    .replace(/%%[\s\S]*?%%/g, '')
    .replace(/\[cite:\s*[^\]]+\]/gi, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?$/.test(line)) return false;
      if (/^(?:Status|Tags|Referencias)\s*:/i.test(line)) return false;
      if (/^\|/.test(line) || /\|---/.test(line)) return false;
      if (/^#{1,4}\s*(?:Referencias|Enlaces|Notas)\s*$/i.test(line)) return false;
      if (/^!\[\[/.test(line) || /^!\[/.test(line)) return false;
      return true;
    });

  const cleaned = lines
    .join(' ')
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, a) => (a || t).trim())
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`>#~]+/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Crónica abierta para explorar en el Códice.';
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen).trim()}…` : cleaned;
}

export function findSessionByTarget(
  rawTarget: string,
  view: ApiViewPayload | null,
): PlotTimelineEntry | null {
  const entries = view?.plotTimeline?.entries || [];
  const cleaned = rawTarget.trim().replace(/^sesi[oó]n\s*:/i, '').trim().toLowerCase();
  if (!cleaned) return null;
  return (
    entries.find((e) => {
      if (e.kind === 'upcoming') return false;
      const baseFile = e.sourceNoteRelativePath
        ? e.sourceNoteRelativePath.split('/').pop()!.replace(/\.md$/i, '').toLowerCase()
        : '';
      return (
        e.id.toLowerCase() === cleaned ||
        e.title.toLowerCase() === cleaned ||
        e.sessionTag.toLowerCase() === cleaned ||
        (Boolean(baseFile) && baseFile === cleaned)
      );
    }) || null
  );
}

export function findCosmicEventByTarget(
  rawTarget: string,
  view: ApiViewPayload | null,
): { festival: CosmicFestival; month: CosmicWheelMonth } | null {
  const wheel = view?.plotTimeline?.cosmicWheel || [];
  const cleaned = rawTarget.trim().replace(/^evento\s*:/i, '').trim().toLowerCase();
  if (!cleaned) return null;
  for (const month of wheel) {
    for (const festival of month.festivals || []) {
      if (
        festival.id.toLowerCase() === cleaned ||
        festival.name.toLowerCase() === cleaned
      ) {
        return { festival, month };
      }
    }
  }
  return null;
}

export function escapeHtml(raw: string): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveMediaUrl(rawRef: string): string | null {
  const base = String(rawRef || '').trim().replace(/\\/g, '/').split('/').pop() || '';
  if (!/\.(jpe?g|png|webp|gif|svg)$/i.test(base)) return null;
  return `/api/vault/media?file=${encodeURIComponent(base)}`;
}

export function renderMarkdownHtml(
  rawMarkdown: string,
  visibleMap: Map<string, LoreNode>,
  view: ApiViewPayload | null,
  nodeTitle?: string,
): string {
  const cleanedMd = String(rawMarkdown || '')
    .replace(/%%[\s\S]*?%%/g, '')
    .replace(/\[cite:\s*[^\]]+\]/gi, '');

  // Construir patrón ligero para auto-enlazar nombres de Nodos de Lore visibles en prosa
  const currentTitleLower = (nodeTitle || '').trim().toLowerCase();
  const autoLinkCandidates = Array.from(visibleMap.values())
    .filter((n) => {
      const t = n.title.trim();
      return (
        t.length >= 4 &&
        t.toLowerCase() !== currentTitleLower &&
        !/^\d/.test(t) &&
        !/^(notas|sesi[oó]n|cap[ií]tulo|lista|tabla|reglas)/i.test(t)
      );
    })
    .sort((a, b) => b.title.length - a.title.length)
    .slice(0, 120);

  const autoLinkRegex =
    autoLinkCandidates.length > 0
      ? new RegExp(
          `(?<![\\p{L}\\p{N}_])(${autoLinkCandidates
            .map((n) => n.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|')})(?![\\p{L}\\p{N}_])`,
          'gu',
        )
      : null;

  const formatInline = (text: string): string => {
    const tokens: string[] = [];
    const stash = (frag: string) => {
      const key = `THYTOK${tokens.length}END`;
      tokens.push(frag);
      return key;
    };

    let s = escapeHtml(text);

    s = s.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (full, target, caption) => {
      const url = resolveMediaUrl(target);
      if (!url) return full;
      const cap = caption ? caption.trim() : '';
      return stash(
        `<figure class="lore-figure"><img src="${escapeHtml(url)}" alt="${escapeHtml(cap || 'Ilustración')}" loading="lazy" />${cap ? `<figcaption>${escapeHtml(cap)}</figcaption>` : ''}</figure>`,
      );
    });

    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, href) => {
      const url = resolveMediaUrl(href);
      if (!url) return full;
      const cap = alt ? alt.trim() : '';
      return stash(
        `<figure class="lore-figure"><img src="${escapeHtml(url)}" alt="${escapeHtml(cap || 'Ilustración')}" loading="lazy" />${cap ? `<figcaption>${escapeHtml(cap)}</figcaption>` : ''}</figure>`,
      );
    });

    s = s.replace(/`([^`]+)`/g, (_m, code) => stash(`<code>${code}</code>`));

    s = s.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_m, target, alias) => {
      const cleanTarget = target.trim();
      const label = (alias || cleanTarget).trim();
      const found = visibleMap.get(cleanTarget.toLowerCase());
      if (found) {
        return stash(
          `<button type="button" class="wikilink-chip" data-node-id="${escapeHtml(found.id)}">${label}</button>`,
        );
      }
      const sess = findSessionByTarget(cleanTarget, view);
      if (sess) {
        return stash(
          `<button type="button" class="wikilink-chip wikilink-session" data-session-id="${escapeHtml(sess.id)}">${label}</button>`,
        );
      }
      const ev = findCosmicEventByTarget(cleanTarget, view);
      if (ev) {
        return stash(
          `<button type="button" class="wikilink-chip wikilink-event" data-cosmic-event="${escapeHtml(ev.festival.name)}">${label}</button>`,
        );
      }
      const lockInfo = view?.lockReasons?.[cleanTarget.toLowerCase()];
      if (lockInfo) {
        return stash(
          `<button type="button" class="wikilink-chip wikilink-locked" data-lock-msg="${escapeHtml(lockInfo.criteria)}">${label}</button>`,
        );
      }
      return stash(
        `<button type="button" class="wikilink-chip wikilink-locked" data-lock-msg="Mención aún sin crónica redactada en el Vault Maestro.">${label}</button>`,
      );
    });

    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(>])\*([^*\n]+)\*(?=[\s.,;:!?)<]|$)/g, '$1<em>$2</em>');

    // Auto-enlazar menciones de Nodos de Lore visibles en prosa (fuera de etiquetas HTML y tokens)
    if (autoLinkRegex) {
      s = s
        .split(/(<[^>]+>|THYTOK\d+END)/g)
        .map((segment) => {
          if (
            !segment ||
            segment.startsWith('<') ||
            /^THYTOK\d+END$/.test(segment)
          ) {
            return segment;
          }
          return segment.replace(autoLinkRegex, (match) => {
            const hit = visibleMap.get(match.toLowerCase());
            if (!hit) return match;
            return stash(
              `<button type="button" class="wikilink-chip wikilink-inline" data-node-id="${escapeHtml(hit.id)}">${match}</button>`,
            );
          });
        })
        .join('');
    }

    return s.replace(/THYTOK(\d+)END/g, (_m, idx) => tokens[Number(idx)] || '');
  };

  const lines = cleanedMd.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;

  // Omitir líneas de plantilla vacías al inicio
  while (i < lines.length && i < 8) {
    const t = lines[i].trim();
    if (
      !t ||
      /^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?$/.test(t) ||
      /^Status:\s*$/i.test(t) ||
      /^Tags:\s*/i.test(t)
    ) {
      i++;
      continue;
    }
    break;
  }

  let skippedTitle = false;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i++;
      continue;
    }
    if (/^#{1,4}\s*Referencias\s*$/i.test(trimmed)) {
      const restHasText = lines.slice(i + 1).some((l) => l.trim().length > 0);
      if (!restHasText) {
        i++;
        continue;
      }
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      html.push('<hr class="md-hr" />');
      i++;
      continue;
    }
    const hm = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (hm) {
      const lvl = hm[1].length;
      const text = hm[2].trim();
      if (!skippedTitle && lvl === 1 && text.toLowerCase() === String(nodeTitle || '').toLowerCase()) {
        skippedTitle = true;
        i++;
        continue;
      }
      skippedTitle = true;
      html.push(`<h${lvl}>${formatInline(text)}</h${lvl}>`);
      i++;
      continue;
    }
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      /^\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1].trim())
    ) {
      const splitRow = (r: string) =>
        r
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
      const headers = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      html.push(
        `<div class="md-table-wrap"><table class="md-table"><thead><tr>${headers.map((h) => `<th>${formatInline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((_, ci) => `<td>${formatInline(r[ci] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
      );
      continue;
    }
    if (trimmed.startsWith('>')) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        qLines.push(formatInline(lines[i].trim().replace(/^>\s?/, '')));
        i++;
      }
      html.push(`<blockquote class="md-quote">${qLines.join('<br/>')}</blockquote>`);
      continue;
    }
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(`<li>${formatInline(lines[i].trim().replace(/^[-*+]\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${formatInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|>|[-*+]\s|\d+\.\s|-{3,})/.test(lines[i].trim())
    ) {
      para.push(formatInline(lines[i].trim()));
      i++;
    }
    if (para.length > 0) {
      html.push(`<p>${para.join(' ')}</p>`);
    }
  }

  return html.length > 0
    ? html.join('\n')
    : '<p class="muted">Esta ficha todavía está esperando su relato.</p>';
}
