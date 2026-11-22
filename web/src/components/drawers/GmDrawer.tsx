import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  Check,
  Crown,
  Download,
  Eye,
  EyeOff,
  FileEdit,
  Save,
  X,
} from 'lucide-react';
import type {
  ApiViewPayload,
  CanonProposal,
  GmOverviewPayload,
  KnowledgeLayer,
  LoreCardType,
} from '../../types';
import { apiRequest, downloadAuthenticatedFile } from '../../lib/api';
import { layerLabel } from '../../lib/markdown';

export interface GmDrawerProps {
  open: boolean;
  view: ApiViewPayload;
  gmKey: string;
  initialEditPath: string | null;
  onClearEditPath: () => void;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const GmDrawer: React.FC<GmDrawerProps> = ({
  open,
  view,
  gmKey,
  initialEditPath,
  onClearEditPath,
  onClose,
  onRefresh,
  onShowToast,
}) => {
  const [gmTab, setGmTab] = useState<'table' | 'editor'>('table');
  const [overview, setOverview] = useState<GmOverviewPayload | null>(null);
  const [proposals, setProposals] = useState<CanonProposal[]>([]);
  const [fogSearch, setFogSearch] = useState('');

  const [sceneLoc, setSceneLoc] = useState(
    view.partyPosition?.label || view.sceneState.locationNodeId,
  );
  const [sceneDesc, setSceneDesc] = useState(view.sceneState.description);

  const [editTitle, setEditTitle] = useState('');
  const [editSubfolder, setEditSubfolder] = useState('');
  const [editLayer, setEditLayer] = useState<KnowledgeLayer>('base');
  const [editCardType, setEditCardType] = useState<LoreCardType>('rule_lore');
  const [editImage, setEditImage] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editPublicMd, setEditPublicMd] = useState('');
  const [editSecretMd, setEditSecretMd] = useState('');
  const [savingNode, setSavingNode] = useState(false);

  const loadGmData = async () => {
    if (!gmKey) return;
    try {
      const [ov, pr] = await Promise.all([
        apiRequest<GmOverviewPayload>(
          `/api/gm/vault/overview?campaignId=${encodeURIComponent(view.activeCampaign.id)}`,
          {},
          gmKey,
        ),
        apiRequest<{ proposals: CanonProposal[] }>(
          '/api/canon/proposals',
          {},
          gmKey,
        ),
      ]);
      setOverview(ov);
      setProposals(pr.proposals || []);
      setSceneLoc(
        ov.partyPosition?.label ||
          view.partyPosition?.label ||
          ov.sceneState.locationNodeId,
      );
      setSceneDesc(ov.sceneState.description);
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : 'No se pudo cargar consola GM.',
      );
    }
  };

  const loadNodeIntoEditor = async (relativePath: string) => {
    try {
      const node = await apiRequest<{
        title: string;
        targetSubfolder: string;
        layer: KnowledgeLayer;
        cardType?: LoreCardType;
        image?: string;
        tags?: string[];
        publicMarkdown: string;
        dmSecretNotes: string;
      }>(
        `/api/gm/vault/node?relativePath=${encodeURIComponent(relativePath)}`,
        {},
        gmKey,
      );
      setEditTitle(node.title);
      setEditSubfolder(node.targetSubfolder || '');
      setEditLayer(node.layer || 'base');
      setEditCardType(node.cardType || 'rule_lore');
      setEditImage(node.image || '');
      setEditTags((node.tags || []).join(', '));
      setEditPublicMd(node.publicMarkdown || '');
      setEditSecretMd(node.dmSecretNotes || '');
      setGmTab('editor');
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : 'No se pudo abrir la nota.',
      );
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadGmData();
  }, [open, view.activeCampaign.id, gmKey]);

  useEffect(() => {
    if (!open || !initialEditPath) return;
    void loadNodeIntoEditor(initialEditPath);
    onClearEditPath();
  }, [open, initialEditPath]);

  const fogNodes = useMemo(() => {
    const list = overview?.allNodes || [];
    const q = fogSearch.trim().toLowerCase();
    return list
      .filter((n) =>
        q
          ? n.title.toLowerCase().includes(q) ||
            n.relativePath.toLowerCase().includes(q)
          : n.layer === 'progresiva' || n.isRevealedToParty,
      )
      .slice(0, 24);
  }, [overview, fogSearch]);

  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === 'pending'),
    [proposals],
  );

  if (!open) return null;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="drawer-sheet"
        style={{ width: gmTab === 'editor' ? 'min(640px, 100vw)' : undefined }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Consola del Director de Juego"
      >
        <div className="row-between">
          <h3 className="section-title">
            <Crown size={16} /> Consola del DM
          </h3>
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar consola GM"
          >
            <X size={16} />
          </button>
        </div>

        <div className="segmented-tabs">
          <button
            type="button"
            className={`segmented-tab${gmTab === 'table' ? ' active' : ''}`}
            onClick={() => setGmTab('table')}
          >
            Acciones en Mesa
          </button>
          <button
            type="button"
            className={`segmented-tab${gmTab === 'editor' ? ' active' : ''}`}
            onClick={() => setGmTab('editor')}
          >
            <FileEdit size={14} /> Editor Vault
          </button>
        </div>

        {gmTab === 'table' && (
          <div className="stack">
            <div className="stack divider-top">
              <strong style={{ fontSize: '0.84rem' }}>
                Calendario · {view.calendarDate.formatted}
              </strong>
              <div className="row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={async () => {
                    await apiRequest(
                      '/api/gm/calendar/advance',
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          campaignId: view.activeCampaign.id,
                          daysDelta: 1,
                        }),
                      },
                      gmKey,
                    );
                    await onRefresh();
                    onShowToast('Calendario avanzado +1 día.');
                  }}
                >
                  <CalendarPlus size={14} /> +1 Día
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await apiRequest(
                      '/api/gm/calendar/advance',
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          campaignId: view.activeCampaign.id,
                          daysDelta: 7,
                        }),
                      },
                      gmKey,
                    );
                    await onRefresh();
                    onShowToast('Calendario avanzado +1 septimana (7 días).');
                  }}
                >
                  +1 Septimana
                </button>
              </div>
            </div>

            <div className="stack divider-top">
              <strong style={{ fontSize: '0.84rem' }}>Escena Actual</strong>
              <input
                type="text"
                placeholder="Lugar (Nodo de Lore o nombre)..."
                value={sceneLoc}
                onChange={(e) => setSceneLoc(e.target.value)}
              />
              <textarea
                rows={3}
                placeholder="Descripción de la escena..."
                value={sceneDesc}
                onChange={(e) => setSceneDesc(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  await apiRequest(
                    '/api/gm/scene/update',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        campaignId: view.activeCampaign.id,
                        locationNodeId: sceneLoc.trim(),
                        description: sceneDesc.trim(),
                      }),
                    },
                    gmKey,
                  );
                  await onRefresh();
                  onShowToast('Escena actualizada para todos los jugadores.');
                }}
              >
                <Save size={14} /> Actualizar escena
              </button>
            </div>

            <div className="stack divider-top">
              <strong style={{ fontSize: '0.84rem' }}>
                Cola de Aprobación ({pendingProposals.length} notas ·{' '}
                {overview?.stagedMedia.length || 0} imágenes)
              </strong>
              {pendingProposals.map((p) => (
                <div key={p.id} className="card-inner stack" style={{ gap: 6 }}>
                  <strong style={{ fontSize: '0.84rem' }}>{p.title}</strong>
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    {p.summary}
                  </span>
                  <div className="row">
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                      onClick={async () => {
                        await apiRequest(
                          '/api/canon/approve',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ proposalId: p.id }),
                          },
                          gmKey,
                        );
                        await Promise.all([loadGmData(), onRefresh()]);
                        onShowToast(`Propuesta "${p.title}" aprobada en el Vault.`);
                      }}
                    >
                      <Check size={13} /> Aprobar
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                      onClick={async () => {
                        await apiRequest(
                          '/api/canon/reject',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ proposalId: p.id }),
                          },
                          gmKey,
                        );
                        await loadGmData();
                        onShowToast(`Propuesta "${p.title}" rechazada.`);
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
              {(overview?.stagedMedia || []).map((file) => (
                <div key={file} className="row-between">
                  <span style={{ fontSize: '0.82rem' }}>{file}</span>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    onClick={async () => {
                      await apiRequest(
                        '/api/gm/media/approve',
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ fileName: file }),
                        },
                        gmKey,
                      );
                      await Promise.all([loadGmData(), onRefresh()]);
                      onShowToast(`Imagen "${file}" guardada en /images.`);
                    }}
                  >
                    <Check size={13} /> Guardar en /images
                  </button>
                </div>
              ))}
              {pendingProposals.length === 0 &&
                (overview?.stagedMedia.length || 0) === 0 && (
                  <span className="muted" style={{ fontSize: '0.82rem' }}>
                    Sin propuestas pendientes.
                  </span>
                )}
            </div>

            <div className="stack divider-top">
              <strong style={{ fontSize: '0.84rem' }}>
                Niebla de Guerra (Capa Progresiva)
              </strong>
              <input
                type="search"
                placeholder="Filtrar nodos del Vault..."
                value={fogSearch}
                onChange={(e) => setFogSearch(e.target.value)}
              />
              <div className="stack" style={{ gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                {fogNodes.map((n) => (
                  <div key={n.relativePath} className="row-between">
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {n.title}
                      </div>
                      <div className="muted" style={{ fontSize: '0.72rem' }}>
                        {layerLabel(n.layer)}
                      </div>
                    </div>
                    <div className="row">
                      <button
                        type="button"
                        className={n.isRevealedToParty ? 'btn-primary' : ''}
                        style={{ fontSize: '0.74rem', padding: '4px 9px' }}
                        onClick={async () => {
                          await apiRequest(
                            '/api/gm/fog/toggle',
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                campaignId: view.activeCampaign.id,
                                nodeId: n.id,
                                revealed: !n.isRevealedToParty,
                              }),
                            },
                            gmKey,
                          );
                          await Promise.all([loadGmData(), onRefresh()]);
                        }}
                      >
                        {n.isRevealedToParty ? (
                          <>
                            <Eye size={13} /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} /> Oculto
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-icon"
                        title="Editar nota"
                        onClick={() => loadNodeIntoEditor(n.relativePath)}
                      >
                        <FileEdit size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stack divider-top">
              <strong style={{ fontSize: '0.84rem' }}>
                Exportación FoundryVTT
              </strong>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadAuthenticatedFile(
                      `/api/foundry/compendium-export?campaignId=${encodeURIComponent(view.activeCampaign.id)}&characterId=${encodeURIComponent(view.character.id)}&includeGmSecrets=1&download=1`,
                      `Thyrenia_Compendium_${view.activeCampaign.id}.json`,
                      gmKey,
                    );
                    onShowToast('Compendio completo FoundryVTT descargado.');
                  } catch (err) {
                    onShowToast(
                      err instanceof Error ? err.message : 'Error al exportar.',
                    );
                  }
                }}
              >
                <Download size={14} /> Descargar Compendio Completo (.json)
              </button>
            </div>
          </div>
        )}

        {gmTab === 'editor' && (
          <div className="stack">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) void loadNodeIntoEditor(e.target.value);
              }}
            >
              <option value="">Cargar nota existente del Vault...</option>
              {(overview?.allNodes || []).map((n) => (
                <option key={n.relativePath} value={n.relativePath}>
                  {n.relativePath}
                </option>
              ))}
            </select>

            <div className="two-col">
              <input
                type="text"
                placeholder="Título del Nodo de Lore"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <input
                type="text"
                placeholder="Subcarpeta (ej: 01 - Geografia)"
                value={editSubfolder}
                onChange={(e) => setEditSubfolder(e.target.value)}
              />
            </div>

            <div className="two-col">
              <select
                value={editLayer}
                onChange={(e) => setEditLayer(e.target.value as KnowledgeLayer)}
              >
                <option value="base">Capa Base</option>
                <option value="asimetrica">Capa Asimétrica</option>
                <option value="progresiva">Capa Progresiva</option>
                <option value="dm_secret">Solo DM</option>
              </select>
              <select
                value={editCardType}
                onChange={(e) => setEditCardType(e.target.value as LoreCardType)}
              >
                <option value="rule_lore">Reglas y Lore</option>
                <option value="character">Personaje / PNJ</option>
                <option value="location">Lugar</option>
                <option value="faction">Facción</option>
                <option value="deity">Deidad</option>
                <option value="quest_clue">Pista / Misión</option>
                <option value="session">Crónica de Sesión</option>
                <option value="chapter">Capítulo Narrado</option>
              </select>
            </div>

            <div className="two-col">
              <select
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
              >
                <option value="">Sin ilustración principal</option>
                {view.availableImages.map((img) => (
                  <option key={img} value={img}>
                    {img}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Etiquetas separadas por coma"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
            </div>

            <label className="stack" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                Contenido público (visible según capa)
              </span>
              <textarea
                rows={8}
                value={editPublicMd}
                onChange={(e) => setEditPublicMd(e.target.value)}
              />
            </label>

            <label className="stack" style={{ gap: 4 }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                Secretos del DM (envueltos automáticamente en %%...%%)
              </span>
              <textarea
                rows={4}
                value={editSecretMd}
                onChange={(e) => setEditSecretMd(e.target.value)}
              />
            </label>

            <button
              type="button"
              className="btn-primary"
              disabled={savingNode || !editTitle.trim()}
              onClick={async () => {
                setSavingNode(true);
                try {
                  await apiRequest(
                    '/api/gm/vault/save-node',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        campaignId: view.activeCampaign.id,
                        title: editTitle.trim(),
                        targetSubfolder: editSubfolder.trim(),
                        layer: editLayer,
                        cardType: editCardType,
                        image: editImage || undefined,
                        tags: editTags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                        publicMarkdown: editPublicMd,
                        dmSecretNotes: editSecretMd,
                      }),
                    },
                    gmKey,
                  );
                  await Promise.all([loadGmData(), onRefresh()]);
                  onShowToast(`Nodo "${editTitle}" guardado en el Vault Maestro.`);
                } catch (err) {
                  onShowToast(
                    err instanceof Error ? err.message : 'Error guardando nota.',
                  );
                } finally {
                  setSavingNode(false);
                }
              }}
            >
              <Save size={14} />{' '}
              {savingNode ? 'Guardando...' : 'Guardar en el Vault Maestro'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
