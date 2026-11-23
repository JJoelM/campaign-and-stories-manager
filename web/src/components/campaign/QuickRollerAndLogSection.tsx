import React, { useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import type { ApiViewPayload, LiveRollEntry } from '../../types';
import { apiRequest } from '../../lib/api';
import { computeSkillBreakdown } from '../../lib/sheet-utils';

interface QuickRollerAndLogSectionProps {
  view: ApiViewPayload;
  isGm: boolean;
  gmKey: string;
  liveRolls: LiveRollEntry[];
  onRecordRoll: (skillLabel: string, bonus: number) => void;
  onRefresh: () => Promise<void>;
}

export const QuickRollerAndLogSection: React.FC<QuickRollerAndLogSectionProps> = ({
  view,
  isGm,
  gmKey,
  liveRolls,
  onRecordRoll,
  onRefresh,
}) => {
  const [logTitle, setLogTitle] = useState('');
  const [logBody, setLogBody] = useState('');
  const [lastRolledKey, setLastRolledKey] = useState<string | null>(null);
  const rollTimerRef = useRef<number | null>(null);
  const sheet = view.characterSheet;

  useEffect(
    () => () => {
      if (rollTimerRef.current !== null) {
        window.clearTimeout(rollTimerRef.current);
      }
    },
    [],
  );

  const handleAddLog = async () => {
    if (!logTitle.trim() || !logBody.trim()) return;
    await apiRequest(
      '/api/gm/session-log',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: view.activeCampaign.id,
          title: logTitle.trim(),
          summary: logBody.trim(),
        }),
      },
      gmKey,
    );
    setLogTitle('');
    setLogBody('');
    await onRefresh();
  };

  const latestRoll = liveRolls[0];
  const rollTone =
    latestRoll?.d20 === 20
      ? ' is-crit'
      : latestRoll?.d20 === 1
        ? ' is-fumble'
        : '';

  return (
    <section className="surface-card stack">
      <div className="row-between section-header-rule">
        <h2 className="section-title">
          <Dices size={16} /> Tirador 1d20 y Bitácora
        </h2>
        <span className="overline">{sheet.name}</span>
      </div>

      {/* Vitrina D20 en vivo */}
      <div
        key={latestRoll ? latestRoll.id : 'idle'}
        className={`d20-showcase${rollTone}`}
      >
        <div
          className={`d20-crest${latestRoll ? ` rolling${rollTone}` : ''}`}
          aria-hidden="true"
        >
          {latestRoll ? (
            latestRoll.d20
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
              <polyline points="12 2 12 22" />
              <polyline points="3 7 12 13 21 7" />
            </svg>
          )}
        </div>
        {latestRoll ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 6 }}>
              <strong style={{ color: 'var(--text-strong)', fontSize: '0.92rem' }}>
                {latestRoll.skillLabel} = {latestRoll.total}
              </strong>
              {latestRoll.d20 === 20 && (
                <span className="badge badge-gold">¡Crítico!</span>
              )}
              {latestRoll.d20 === 1 && (
                <span className="badge badge-danger">¡Pifia!</span>
              )}
            </div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              1d20 ({latestRoll.d20}){' '}
              {latestRoll.bonus >= 0 ? `+ ${latestRoll.bonus}` : latestRoll.bonus} ·{' '}
              {latestRoll.timeLabel}
            </div>
          </div>
        ) : (
          <div className="muted" style={{ flex: 1, fontSize: '0.82rem' }}>
            Selecciona una habilidad para lanzar 1d20 en mesa.
          </div>
        )}
      </div>

      {/* Tabla alineada de 2 columnas para habilidades rápidas */}
      <div className="quick-skill-grid">
        {sheet.skills.map((sk) => {
          const { total } = computeSkillBreakdown(sheet, sk);
          return (
            <button
              key={sk.key}
              type="button"
              className={`quick-skill-btn${sk.proficient ? ' proficient' : ''}${
                lastRolledKey === sk.key ? ' just-rolled' : ''
              }`}
              onClick={() => {
                onRecordRoll(sk.label, total);
                setLastRolledKey(sk.key);
                if (rollTimerRef.current !== null) {
                  window.clearTimeout(rollTimerRef.current);
                }
                rollTimerRef.current = window.setTimeout(
                  () => setLastRolledKey(null),
                  650,
                );
              }}
            >
              <span className="row" style={{ gap: 6, flexWrap: 'nowrap', minWidth: 0 }}>
                <span
                  className={`skill-dot${sk.proficient ? ' filled' : ''}`}
                  aria-hidden="true"
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sk.label}
                </span>
              </span>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--display-font)' }}>
                {total >= 0 ? `+${total}` : total}
              </strong>
            </button>
          );
        })}
      </div>

      <div className="stack divider-top" style={{ gap: 8 }}>
        {isGm && (
          <div className="cosmic-box" style={{ borderColor: 'var(--gm)' }}>
            <input
              value={logTitle}
              onChange={(e) => setLogTitle(e.target.value)}
              placeholder="Anotar suceso de mesa..."
            />
            <textarea
              rows={2}
              value={logBody}
              onChange={(e) => setLogBody(e.target.value)}
              placeholder="Resumen breve ocurrido en la partida..."
            />
            <button type="button" className="btn-gm" onClick={handleAddLog}>
              Guardar en Bitácora
            </button>
          </div>
        )}

        {liveRolls.length === 0 && view.manualSessionLogs.length === 0 ? (
          <div className="muted" style={{ fontSize: '0.82rem' }}>
            Toca una habilidad para lanzar 1d20.
          </div>
        ) : (
          <div className="stack" style={{ gap: 6 }}>
            {liveRolls.slice(0, 6).map((r) => (
              <div key={r.id} className="roll-feed-item">
                <div>
                  <strong>{r.skillLabel}</strong>{' '}
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    · {r.characterName} ({r.timeLabel})
                  </span>
                  <div className="muted" style={{ fontSize: '0.74rem' }}>
                    1d20({r.d20}) {r.bonus >= 0 ? `+ ${r.bonus}` : r.bonus}
                  </div>
                </div>
                <span
                  className={`badge ${
                    r.d20 === 20
                      ? 'badge-gold'
                      : r.d20 === 1
                        ? 'badge-danger'
                        : 'badge-prog'
                  }`}
                  style={{ fontSize: '0.88rem' }}
                >
                  {r.total}
                </span>
              </div>
            ))}

            {view.manualSessionLogs
              .slice(-6)
              .reverse()
              .map((m) => (
                <div
                  key={m.id}
                  className="card-inner stack"
                  style={{ gap: 3, padding: '9px 11px' }}
                >
                  <div className="row-between">
                    <strong style={{ fontSize: '0.85rem' }}>{m.title}</strong>
                    <span className="muted" style={{ fontSize: '0.72rem' }}>
                      {m.dateLabel}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    {m.summary}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
};
