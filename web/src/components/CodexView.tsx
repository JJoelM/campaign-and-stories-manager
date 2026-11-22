import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Download,
  ImagePlus,
  MoreHorizontal,
  PenLine,
  Search,
  Shuffle,
} from 'lucide-react';
import type { ApiViewPayload, LoreNode, PlotTimelineEntry } from '../types';
import { downloadAuthenticatedFile } from '../lib/api';
import {
  CARD_TYPE_LABELS,
  classifyCategory,
  cleanBreadcrumbSegment,
  extractCleanExcerpt,
  layerLabel,
  renderMarkdownHtml,
} from '../lib/markdown';

interface CodexViewProps {
  view: ApiViewPayload;
  isGm: boolean;
  gmKey: string;
  selectedNodeId: string | null;
  activeSessionChronicle: PlotTimelineEntry | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectSession: (entry: PlotTimelineEntry | null) => void;
  onOpenCosmicEvent: (eventName: string) => void;
  onProposeForNode: (node: LoreNode) => void;
  onEditInGmStudio: (relativePath: string) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORIES = [
  { label: 'Todo', category: 'all' },
  { label: 'Panteón', category: 'Panteón Divino' },
  { label: 'Cosmogonía', category: 'Cosmogonía y Origen' },
  { label: 'Geografía', category: 'Geografía y Planos' },
  { label: 'Magia y Reglas', category: 'Reglas y Mecánicas' },
  { label: 'Razas y Clases', category: 'Clases' },
  { label: 'Cultura', category: 'Cultura y Vocabulario' },
  { label: 'Crónicas', category: 'Crónicas y Capítulos' },
];

export const CodexView: React.FC<CodexViewProps> = ({
  view,
  isGm,
  gmKey,
  selectedNodeId,
  activeSessionChronicle,
  onSelectNode,
  onSelectSession,
  onOpenCosmicEvent,
  onProposeForNode,
  onEditInGmStudio,
  onShowToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filterText, setFilterText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleMap = useMemo(
    () => new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n])),
    [view.visibleNodes],
  );

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return visibleMap.get(selectedNodeId.toLowerCase()) || null;
  }, [selectedNodeId, visibleMap]);

  useEffect(() => {
    if (selectedNodeId || activeSessionChronicle) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedNodeId, activeSessionChronicle]);

  const deduplicatedNodes = useMemo(() => {
    const byTitle = new Map<string, LoreNode>();
    for (const node of view.visibleNodes) {
      const key = node.title.trim().toLowerCase();
      const prev = byTitle.get(key);
      if (
        !prev ||
        (prev.isSkeleton && !node.isSkeleton) ||
        node.sanitizedContent.length > prev.sanitizedContent.length
      ) {
        byTitle.set(key, node);
      }
    }
    return Array.from(byTitle.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [view.visibleNodes]);

  const filteredNodes = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return deduplicatedNodes.filter((n) => {
      if (
        activeCategory !== 'all' &&
        classifyCategory(n.relativePath) !== activeCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.sanitizedContent.toLowerCase().includes(q)
      );
    });
  }, [deduplicatedNodes, activeCategory, filterText]);

  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('button');
    if (!target) return;
    const nodeId = target.getAttribute('data-node-id');
    const sessionId = target.getAttribute('data-session-id');
    const cosmicEv = target.getAttribute('data-cosmic-event');
    const lockMsg = target.getAttribute('data-lock-msg');

    if (nodeId) {
      onSelectSession(null);
      onSelectNode(nodeId);
    } else if (sessionId) {
      const hit = view.plotTimeline.entries.find((en) => en.id === sessionId);
      if (hit) onSelectSession(hit);
    } else if (cosmicEv) {
      onOpenCosmicEvent(cosmicEv);
    } else if (lockMsg) {
      onShowToast(lockMsg);
    }
  };

  // === MODO LECTOR: CRÓNICA DE SESIÓN ===
  if (activeSessionChronicle) {
    const md =
      activeSessionChronicle.chronicleMarkdown ||
      `### Resumen\n\n${activeSessionChronicle.summary}\n\n### Hitos\n${activeSessionChronicle.highlights.map((h) => `- ${h}`).join('\n')}`;
    const html = renderMarkdownHtml(md, visibleMap, view, activeSessionChronicle.title);
    return (
      <article className="reader-article chapter-mode stack">
        <div className="row-between">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onSelectSession(null)}
          >
            <ArrowLeft size={15} /> Volver al Códice
          </button>
          <span className="overline">
            {activeSessionChronicle.sessionTag} ·{' '}
            {activeSessionChronicle.thyreniaDate.formatted}
          </span>
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--display-font)',
            fontSize: 'clamp(1.4rem, 3.2vw, 1.9rem)',
            color: 'var(--text-strong)',
          }}
        >
          {activeSessionChronicle.title}
        </h1>
        <div className="muted" style={{ marginTop: -6 }}>
          {activeSessionChronicle.location}
        </div>

        <div
          className="md-body"
          onClick={handleBodyClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {activeSessionChronicle.sourceNoteRelativePath && (
          <div className="row divider-top">
            <button
              type="button"
              onClick={() => {
                const fileTitle = activeSessionChronicle
                  .sourceNoteRelativePath!.split('/')
                  .pop()!
                  .replace(/\.md$/i, '');
                if (visibleMap.has(fileTitle.toLowerCase())) {
                  onSelectSession(null);
                  onSelectNode(visibleMap.get(fileTitle.toLowerCase())!.id);
                } else {
                  onShowToast('La nota completa de sesión aún no está visible.');
                }
              }}
            >
              <BookOpen size={14} /> Abrir nota original del Vault
            </button>
          </div>
        )}
      </article>
    );
  }

  // === MODO LECTOR: NODO DE LORE ===
  if (selectedNode) {
    const html = renderMarkdownHtml(
      selectedNode.sanitizedContent,
      visibleMap,
      view,
      selectedNode.title,
    );
    const isChapter = selectedNode.cardType === 'chapter';
    const hasOwnImage = Boolean(selectedNode.image);
    const breadcrumbs = selectedNode.relativePath
      .split('/')
      .slice(0, -1)
      .map(cleanBreadcrumbSegment)
      .filter(Boolean)
      .join(' › ');

    const connectedSet = new Set<string>(view.adjacencyGraph[selectedNode.id] || []);
    for (const [src, tgts] of Object.entries(view.adjacencyGraph)) {
      if (tgts.includes(selectedNode.id)) connectedSet.add(src);
    }
    const connectedIds = Array.from(connectedSet).filter(
      (id) => id !== selectedNode.id && visibleMap.has(id.toLowerCase()),
    );

    return (
      <article className={`reader-article${isChapter ? ' chapter-mode' : ''} stack`}>
        <div className="row-between">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onSelectNode(null)}
          >
            <ArrowLeft size={15} /> Códice
          </button>

          <div className="menu-wrap">
            <button
              type="button"
              className="btn-icon btn-ghost"
              aria-label="Opciones del nodo"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="menu-popover">
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onProposeForNode(selectedNode);
                  }}
                >
                  <ImagePlus size={14} /> Añadir Ilustración o Nota
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    downloadAuthenticatedFile(
                      `/api/foundry/journal-export?campaignId=${encodeURIComponent(view.activeCampaign.id)}&characterId=${encodeURIComponent(view.character.id)}&nodeId=${encodeURIComponent(selectedNode.id)}&download=1`,
                      `fvtt-Journal-${selectedNode.id}.json`,
                      gmKey,
                    );
                  }}
                >
                  <Download size={14} /> Exportar Journal FoundryVTT
                </button>
                {isGm && (
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onEditInGmStudio(selectedNode.relativePath);
                    }}
                  >
                    <PenLine size={14} /> Editar en Estudio GM
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="overline" style={{ marginBottom: 4 }}>
            {[
              breadcrumbs,
              CARD_TYPE_LABELS[selectedNode.cardType || 'rule_lore'],
              layerLabel(selectedNode.layer),
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--display-font)',
              fontSize: 'clamp(1.4rem, 3.2vw, 1.9rem)',
              color: 'var(--text-strong)',
              lineHeight: 1.18,
            }}
          >
            {selectedNode.title}
          </h1>
        </div>

        {hasOwnImage && (
          <figure className="lore-figure" style={{ margin: 0 }}>
            <img
              src={`/api/vault/media?file=${encodeURIComponent(selectedNode.image!)}`}
              alt={selectedNode.title}
            />
          </figure>
        )}

        {selectedNode.isSkeleton && (
          <div
            className="card-inner row-between"
            style={{ borderStyle: 'dashed' }}
          >
            <div>
              <strong>Crónica en construcción</strong>
              <div className="muted">
                Propón una descripción para este nodo al DM.
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onProposeForNode(selectedNode)}
            >
              Proponer
            </button>
          </div>
        )}

        <div
          className="md-body"
          onClick={handleBodyClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {connectedIds.length > 0 && (
          <div className="stack divider-top" style={{ gap: 8 }}>
            <div className="overline">
              Senderos conectados ({connectedIds.length})
            </div>
            <div className="row">
              {connectedIds.slice(0, 12).map((cid) => (
                <button
                  key={cid}
                  type="button"
                  className="wikilink-chip"
                  onClick={() => onSelectNode(cid)}
                >
                  {cid}
                </button>
              ))}
            </div>
          </div>
        )}
      </article>
    );
  }

  // === MODO EXPLORADOR POR TOMO ===
  return (
    <div className="stack-lg">
      <section className="panel stack">
        <div className="row-between section-header-rule">
          <div>
            <h1 className="section-title" style={{ fontSize: '1.3rem' }}>
              Códice de Thyrenia
            </h1>
            <div className="muted" style={{ marginTop: 4 }}>
              {deduplicatedNodes.length} entradas visibles para{' '}
              {view.character.name}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const pool =
                filteredNodes.length > 0 ? filteredNodes : deduplicatedNodes;
              const pick = pool[Math.floor(Math.random() * pool.length)];
              if (pick) onSelectNode(pick.id);
            }}
          >
            <Shuffle size={14} /> Al azar
          </button>
        </div>

        <div className="codex-filter-bar">
          <div
            className="codex-pill-strip"
            role="tablist"
            aria-label="Categorías del Códice"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.category}
                type="button"
                role="tab"
                aria-selected={activeCategory === c.category}
                className={`codex-pill${activeCategory === c.category ? ' active' : ''}`}
                onClick={() => setActiveCategory(c.category)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="row" style={{ flex: '0 1 250px', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={14}
                className="muted"
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 10,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                placeholder="Filtrar códice..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{ width: '100%', paddingLeft: 30 }}
              />
            </div>
          </div>
        </div>
      </section>

      {filteredNodes.length === 0 ? (
        <div className="surface-card muted">
          No hay entradas reveladas que coincidan con este filtro para{' '}
          {view.character.name}.
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredNodes.slice(0, 60).map((n) => (
            <button
              key={n.relativePath}
              type="button"
              className="lore-card-btn"
              onClick={() => onSelectNode(n.id)}
            >
              <span className="overline" style={{ fontSize: '0.66rem' }}>
                {CARD_TYPE_LABELS[n.cardType || 'rule_lore']}
              </span>
              <div className="row-between" style={{ width: '100%' }}>
                <strong
                  style={{
                    fontFamily: 'var(--display-font)',
                    color: 'var(--text-strong)',
                    fontSize: '0.92rem',
                  }}
                >
                  {n.title}
                </strong>
                {n.isSkeleton && (
                  <span className="badge" style={{ fontSize: '0.66rem' }}>
                    Esqueleto
                  </span>
                )}
              </div>
              {!n.isSkeleton && (
                <span
                  className="muted"
                  style={{ fontSize: '0.8rem', lineHeight: 1.45 }}
                >
                  {extractCleanExcerpt(n.sanitizedContent, 92)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
