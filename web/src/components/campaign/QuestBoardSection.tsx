import React, { useMemo, useState } from 'react';
import {
  Check,
  Download,
  Lightbulb,
  MapPin,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import type { ApiViewPayload, CampaignQuest, LoreNode } from '../../types';
import { apiRequest, downloadAuthenticatedFile } from '../../lib/api';

interface QuestBoardSectionProps {
  view: ApiViewPayload;
  isGm: boolean;
  gmKey: string;
  visibleMap: Map<string, LoreNode>;
  onRefresh: () => Promise<void>;
  onOpenNode: (nodeId: string) => void;
  onShowToast: (msg: string) => void;
}

export const QuestBoardSection: React.FC<QuestBoardSectionProps> = ({
  view,
  isGm,
  gmKey,
  visibleMap,
  onRefresh,
  onOpenNode,
  onShowToast,
}) => {
  const [questFilter, setQuestFilter] = useState<string>('all');
  const [showRumorForm, setShowRumorForm] = useState(false);
  const [showNewQuestForm, setShowNewQuestForm] = useState(false);
  const [openQuestMenuId, setOpenQuestMenuId] = useState<string | null>(null);

  const [rumorTitle, setRumorTitle] = useState('');
  const [rumorLoc, setRumorLoc] = useState('');
  const [rumorSummary, setRumorSummary] = useState('');

  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestKind, setNewQuestKind] =
    useState<CampaignQuest['kind']>('side_quest');
  const [newQuestLoc, setNewQuestLoc] = useState('');
  const [newQuestSummary, setNewQuestSummary] = useState('');
  const [newQuestObj, setNewQuestObj] = useState('');

  const filteredQuests = useMemo(
    () =>
      (view.quests || []).filter((q) =>
        questFilter === 'all' ? true : q.status === questFilter,
      ),
    [view.quests, questFilter],
  );

  const handleSubmitRumor = async () => {
    if (!rumorTitle.trim() || !rumorSummary.trim()) return;
    await apiRequest(
      '/api/player/rumor',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: view.activeCampaign.id,
          characterId: view.character.id,
          kind: 'quest_rumor',
          title: rumorTitle.trim(),
          locationNodeId: rumorLoc.trim() || undefined,
          summary: rumorSummary.trim(),
        }),
      },
      gmKey,
    );
    setRumorTitle('');
    setRumorLoc('');
    setRumorSummary('');
    setShowRumorForm(false);
    onShowToast('Rumor enviado al tablero para confirmación del DM.');
    await onRefresh();
  };

  const handleCreateQuest = async () => {
    if (!newQuestTitle.trim() || !newQuestSummary.trim()) return;
    await apiRequest(
      '/api/gm/quests/save',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: view.activeCampaign.id,
          title: newQuestTitle.trim(),
          kind: newQuestKind,
          locationNodeId: newQuestLoc.trim() || undefined,
          summary: newQuestSummary.trim(),
          objectives: newQuestObj.trim()
            ? [{ text: newQuestObj.trim(), done: false }]
            : [],
        }),
      },
      gmKey,
    );
    setNewQuestTitle('');
    setNewQuestLoc('');
    setNewQuestSummary('');
    setNewQuestObj('');
    setShowNewQuestForm(false);
    await onRefresh();
  };

  return (
    <section className="surface-card stack">
      <div className="row-between section-header-rule">
        <h2 className="section-title">Misiones y Rumores</h2>
        <div className="row">
          <button
            type="button"
            style={{ fontSize: '0.78rem' }}
            onClick={() => setShowRumorForm((v) => !v)}
          >
            <Lightbulb size={14} /> Proponer Rumor
          </button>
          {isGm && (
            <button
              type="button"
              className="btn-gm"
              style={{ fontSize: '0.78rem' }}
              onClick={() => setShowNewQuestForm((v) => !v)}
            >
              <Plus size={14} /> Nueva Misión
            </button>
          )}
        </div>
      </div>

      <div className="row">
        {[
          ['all', 'Todas'],
          ['active', 'Activas'],
          ['proposed_rumor', 'Sugerencias'],
          ['completed', 'Completadas'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={questFilter === key ? 'btn-primary' : ''}
            style={{ padding: '4px 10px', fontSize: '0.76rem' }}
            onClick={() => setQuestFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {showRumorForm && (
        <div className="cosmic-box">
          <input
            value={rumorTitle}
            onChange={(e) => setRumorTitle(e.target.value)}
            placeholder="Título del rumor o pista..."
          />
          <input
            value={rumorLoc}
            onChange={(e) => setRumorLoc(e.target.value)}
            placeholder="Lugar o personaje vinculado (opcional)"
          />
          <textarea
            rows={2}
            value={rumorSummary}
            onChange={(e) => setRumorSummary(e.target.value)}
            placeholder="Qué escuchó o sospecha tu personaje..."
          />
          <div className="row">
            <button type="button" className="btn-primary" onClick={handleSubmitRumor}>
              Enviar al DM
            </button>
            <button type="button" onClick={() => setShowRumorForm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isGm && showNewQuestForm && (
        <div className="cosmic-box" style={{ borderColor: 'var(--gm)' }}>
          <div className="row">
            <input
              style={{ flex: 1 }}
              value={newQuestTitle}
              onChange={(e) => setNewQuestTitle(e.target.value)}
              placeholder="Título de misión..."
            />
            <select
              value={newQuestKind}
              onChange={(e) =>
                setNewQuestKind(e.target.value as CampaignQuest['kind'])
              }
            >
              <option value="main_quest">Principal</option>
              <option value="side_quest">Secundaria</option>
              <option value="rumor">Rumor</option>
            </select>
          </div>
          <input
            value={newQuestLoc}
            onChange={(e) => setNewQuestLoc(e.target.value)}
            placeholder="Ubicación vinculada (opcional)"
          />
          <textarea
            rows={2}
            value={newQuestSummary}
            onChange={(e) => setNewQuestSummary(e.target.value)}
            placeholder="Descripción para los jugadores..."
          />
          <input
            value={newQuestObj}
            onChange={(e) => setNewQuestObj(e.target.value)}
            placeholder="Primer objetivo (opcional)"
          />
          <button type="button" className="btn-gm" onClick={handleCreateQuest}>
            Crear Misión
          </button>
        </div>
      )}

      {filteredQuests.length === 0 ? (
        <div className="muted">No hay misiones en esta categoría.</div>
      ) : (
        filteredQuests.map((q) => (
          <div
            key={q.id}
            className={`quest-card${q.status === 'proposed_rumor' ? ' proposed' : ''}`}
          >
            <div className="row-between quest-header-row">
              <div className="row">
                <span className="badge badge-asym">
                  {q.kind === 'main_quest'
                    ? 'Principal'
                    : q.kind === 'side_quest'
                      ? 'Secundaria'
                      : 'Rumor'}
                </span>
                <strong style={{ color: 'var(--text-strong)', fontFamily: 'var(--display-font)' }}>
                  {q.title}
                </strong>
                {q.objectives.length > 0 && (
                  <span className="badge" style={{ fontSize: '0.7rem' }}>
                    {q.objectives.filter((o) => o.done).length}/
                    {q.objectives.length} objetivos
                  </span>
                )}
              </div>
              <div className="menu-wrap">
                <button
                  type="button"
                  className="btn-icon btn-ghost"
                  aria-label="Opciones de misión"
                  onClick={() =>
                    setOpenQuestMenuId((cur) => (cur === q.id ? null : q.id))
                  }
                >
                  <MoreHorizontal size={16} />
                </button>
                {openQuestMenuId === q.id && (
                  <div className="menu-popover">
                    <button
                      type="button"
                      className="menu-item"
                      onClick={() => {
                        setOpenQuestMenuId(null);
                        downloadAuthenticatedFile(
                          `/api/foundry/journal-export?campaignId=${encodeURIComponent(view.activeCampaign.id)}&questId=${encodeURIComponent(q.id)}&download=1`,
                          `fvtt-Journal-${q.id}.json`,
                          gmKey,
                        );
                      }}
                    >
                      <Download size={14} /> Exportar Journal FoundryVTT
                    </button>
                    {isGm && q.status === 'active' && (
                      <button
                        type="button"
                        className="menu-item"
                        onClick={async () => {
                          setOpenQuestMenuId(null);
                          await apiRequest(
                            '/api/gm/quests/save',
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                campaignId: view.activeCampaign.id,
                                id: q.id,
                                status: 'completed',
                              }),
                            },
                            gmKey,
                          );
                          await onRefresh();
                        }}
                      >
                        <Check size={14} /> Marcar Completada
                      </button>
                    )}
                    {isGm && (
                      <button
                        type="button"
                        className="menu-item"
                        style={{ color: 'var(--danger)' }}
                        onClick={async () => {
                          setOpenQuestMenuId(null);
                          await apiRequest(
                            '/api/gm/quests/save',
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                campaignId: view.activeCampaign.id,
                                id: q.id,
                                action: 'delete',
                              }),
                            },
                            gmKey,
                          );
                          await onRefresh();
                        }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="muted" style={{ margin: 0, lineHeight: 1.48 }}>
              {q.summary}
            </p>

            {q.objectives.length > 0 && (
              <div className="stack" style={{ gap: 4 }}>
                {q.objectives.map((obj, idx) => (
                  <label
                    key={idx}
                    className="row"
                    style={{
                      fontSize: '0.84rem',
                      textDecoration: obj.done ? 'line-through' : 'none',
                      color: obj.done ? 'var(--muted)' : 'var(--text)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={obj.done}
                      disabled={!isGm}
                      onChange={async () => {
                        await apiRequest(
                          '/api/gm/quests/save',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              campaignId: view.activeCampaign.id,
                              id: q.id,
                              action: 'toggle_objective',
                              objectiveIdx: idx,
                            }),
                          },
                          gmKey,
                        );
                        await onRefresh();
                      }}
                    />
                    <span>{obj.text}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="row">
              {q.locationNodeId && visibleMap.has(q.locationNodeId.toLowerCase()) && (
                <button
                  type="button"
                  className="wikilink-chip"
                  onClick={() => onOpenNode(q.locationNodeId!)}
                >
                  <MapPin size={12} /> {q.locationNodeId}
                </button>
              )}
              {isGm && q.status === 'proposed_rumor' && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                  onClick={async () => {
                    await apiRequest(
                      '/api/gm/quests/save',
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          campaignId: view.activeCampaign.id,
                          id: q.id,
                          action: 'approve_rumor',
                        }),
                      },
                      gmKey,
                    );
                    await onRefresh();
                  }}
                >
                  <Check size={13} /> Aprobar
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </section>
  );
};
