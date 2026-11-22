import React, { useMemo, useState } from 'react';
import { Check, Lightbulb } from 'lucide-react';
import type { ApiViewPayload, LoreNode, RelationKind } from '../../types';
import { apiRequest } from '../../lib/api';

interface AtlasRelationsSubViewProps {
  view: ApiViewPayload;
  visibleMap: Map<string, LoreNode>;
  isGm: boolean;
  gmKey: string;
  onRefresh: () => Promise<void>;
  onOpenNode: (nodeId: string) => void;
  onShowToast: (msg: string) => void;
}

const REL_META: Record<RelationKind, { label: string; cssVar: string }> = {
  ally: { label: 'Aliado', cssVar: 'var(--rel-ally)' },
  rival_enemy: { label: 'Rival / Enemigo', cssVar: 'var(--rel-enemy)' },
  suspicion: { label: 'Sospecha', cssVar: 'var(--rel-suspicion)' },
  patron_loyalty: { label: 'Patrono / Lealtad', cssVar: 'var(--rel-patron)' },
  mystery_blood: { label: 'Vínculo / Misterio', cssVar: 'var(--rel-mystery)' },
};

export const AtlasRelationsSubView: React.FC<AtlasRelationsSubViewProps> = ({
  view,
  visibleMap,
  isGm,
  gmKey,
  onRefresh,
  onOpenNode,
  onShowToast,
}) => {
  const [relFocus, setRelFocus] = useState<string | null>(null);
  const [showRelForm, setShowRelForm] = useState(false);
  const [relSource, setRelSource] = useState('');
  const [relTarget, setRelTarget] = useState('');
  const [relKind, setRelKind] = useState<RelationKind>('suspicion');
  const [relLabel, setRelLabel] = useState('');

  const relEntities = useMemo(() => {
    const s = new Set<string>();
    for (const r of view.relationships || []) {
      s.add(r.sourceId);
      s.add(r.targetId);
    }
    return Array.from(s);
  }, [view.relationships]);

  const filteredRels = useMemo(
    () =>
      (view.relationships || []).filter(
        (r) => !relFocus || r.sourceId === relFocus || r.targetId === relFocus,
      ),
    [view.relationships, relFocus],
  );

  const handleProposeRel = async () => {
    if (!relSource.trim() || !relTarget.trim() || !relLabel.trim()) return;
    await apiRequest(
      '/api/player/rumor',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: view.activeCampaign.id,
          characterId: view.character.id,
          kind: 'relationship',
          sourceId: relSource.trim(),
          targetId: relTarget.trim(),
          relationKind: relKind,
          label: relLabel.trim(),
        }),
      },
      gmKey,
    );
    setRelSource('');
    setRelTarget('');
    setRelLabel('');
    setShowRelForm(false);
    onShowToast('Vínculo propuesto al DM.');
    await onRefresh();
  };

  return (
    <div className="rel-layout">
      <section className="surface-card stack" style={{ gap: 10 }}>
        <div className="row-between">
          <div>
            <h2 className="section-title">Red de Relaciones</h2>
            <div className="muted">Toca un nodo para filtrar vínculos</div>
          </div>
          <button
            type="button"
            style={{ fontSize: '0.78rem' }}
            onClick={() => setShowRelForm((v) => !v)}
          >
            <Lightbulb size={14} /> Proponer
          </button>
        </div>

        <div className="row">
          {(
            Object.entries(REL_META) as Array<
              [RelationKind, { label: string; cssVar: string }]
            >
          ).map(([k, meta]) => (
            <span
              key={k}
              className="badge"
              style={{ borderColor: meta.cssVar, color: meta.cssVar }}
            >
              ● {meta.label}
            </span>
          ))}
        </div>

        {showRelForm && (
          <div className="cosmic-box">
            <div className="row">
              <input
                style={{ flex: 1 }}
                value={relSource}
                onChange={(e) => setRelSource(e.target.value)}
                placeholder="Entidad A (ej: Olivia Zyltris)"
              />
              <select
                value={relKind}
                onChange={(e) => setRelKind(e.target.value as RelationKind)}
              >
                {Object.entries(REL_META).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                style={{ flex: 1 }}
                value={relTarget}
                onChange={(e) => setRelTarget(e.target.value)}
                placeholder="Entidad B"
              />
            </div>
            <input
              value={relLabel}
              onChange={(e) => setRelLabel(e.target.value)}
              placeholder="Descripción del vínculo..."
            />
            <div className="row">
              <button
                type="button"
                className="btn-primary"
                onClick={handleProposeRel}
              >
                Enviar
              </button>
              <button type="button" onClick={() => setShowRelForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <svg
          viewBox="0 0 540 340"
          style={{
            width: '100%',
            height: 310,
            background: 'var(--bg-subtle)',
            borderRadius: 6,
            border: '1px solid var(--border)',
          }}
        >
          {(() => {
            const cx = 270;
            const cy = 170;
            const rad = 112;
            const pos = new Map<string, { x: number; y: number }>();
            relEntities.forEach((name, idx) => {
              const ang =
                (idx / Math.max(1, relEntities.length)) * Math.PI * 2 -
                Math.PI / 2;
              pos.set(name, {
                x: cx + Math.cos(ang) * rad,
                y: cy + Math.sin(ang) * rad,
              });
            });
            return (
              <>
                {(view.relationships || []).map((r) => {
                  const a = pos.get(r.sourceId);
                  const b = pos.get(r.targetId);
                  if (!a || !b) return null;
                  const dimmed =
                    Boolean(relFocus) &&
                    r.sourceId !== relFocus &&
                    r.targetId !== relFocus;
                  return (
                    <line
                      key={r.id}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={REL_META[r.relationKind]?.cssVar || 'var(--accent)'}
                      strokeWidth={dimmed ? 1.2 : 2.6}
                      strokeDasharray={r.status === 'proposed' ? '6 4' : undefined}
                      opacity={dimmed ? 0.2 : 0.92}
                    />
                  );
                })}
                {relEntities.map((name) => {
                  const p = pos.get(name)!;
                  const isFocus = relFocus === name;
                  return (
                    <g
                      key={name}
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setRelFocus((cur) => (cur === name ? null : name))
                      }
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isFocus ? 18 : 14}
                        fill="var(--bg-elev)"
                        stroke={
                          isFocus ? 'var(--accent)' : 'var(--border-strong)'
                        }
                        strokeWidth={2}
                      />
                      <text
                        x={p.x}
                        y={p.y + 28}
                        textAnchor="middle"
                        fill="var(--text-strong)"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {name.length > 18 ? `${name.slice(0, 17)}…` : name}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </section>

      <section className="surface-card stack" style={{ gap: 10 }}>
        <div className="row-between">
          <h2 className="section-title">Vínculos ({filteredRels.length})</h2>
          {relFocus && (
            <button
              type="button"
              style={{ padding: '4px 9px', fontSize: '0.75rem' }}
              onClick={() => setRelFocus(null)}
            >
              Ver todos
            </button>
          )}
        </div>
        {filteredRels.map((r) => {
          const meta = REL_META[r.relationKind];
          return (
            <div
              key={r.id}
              className={`quest-card${r.status === 'proposed' ? ' proposed' : ''}`}
            >
              <div className="row-between">
                <span
                  className="badge"
                  style={{ borderColor: meta.cssVar, color: meta.cssVar }}
                >
                  {meta.label}
                </span>
                <span className="muted" style={{ fontSize: '0.72rem' }}>
                  {r.status === 'proposed' ? 'Propuesto' : 'Confirmado'}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong>{r.sourceId}</strong> ↔ <strong>{r.targetId}</strong>
              </div>
              <div className="muted">{r.label}</div>
              <div className="row">
                {visibleMap.has(r.sourceId.toLowerCase()) && (
                  <button
                    type="button"
                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                    onClick={() => onOpenNode(r.sourceId)}
                  >
                    {r.sourceId}
                  </button>
                )}
                {visibleMap.has(r.targetId.toLowerCase()) && (
                  <button
                    type="button"
                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                    onClick={() => onOpenNode(r.targetId)}
                  >
                    {r.targetId}
                  </button>
                )}
                {isGm && r.status === 'proposed' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                    onClick={async () => {
                      await apiRequest(
                        '/api/gm/relationships/save',
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            campaignId: view.activeCampaign.id,
                            id: r.id,
                            action: 'confirm',
                          }),
                        },
                        gmKey,
                      );
                      await onRefresh();
                    }}
                  >
                    <Check size={13} /> Confirmar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
