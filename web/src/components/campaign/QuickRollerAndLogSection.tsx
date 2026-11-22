import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import type { ApiViewPayload, LiveRollEntry } from '../../types';
import { apiRequest } from '../../lib/api';

interface QuickRollerAndLogSectionProps {
  view: ApiViewPayload;
  isGm: boolean;
  gmKey: string;
  liveRolls: LiveRollEntry[];
  onRecordRoll: (skillLabel: string, bonus: number) => void;
  onRefresh: () => Promise<void>;
}

function abilityMod(score: number): number {
  return Math.floor((Number(score || 10) - 10) / 2);
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
  const sheet = view.characterSheet;

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

  return (
    <section className="surface-card stack">
      <div className="row-between">
        <h2 className="section-title">
          <Dices size={16} /> Tirador 1d20 y Bitácora
        </h2>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          {sheet.name}
        </span>
      </div>

      <div className="row">
        {sheet.skills.map((sk) => {
          const mod = abilityMod(sheet.abilities[sk.defaultAbility]);
          const prof = sk.proficient ? sheet.proficiencyBonus : 0;
          const clsBonus = sk.isClassSkill && sk.rank >= 1 ? 2 : 0;
          const total = mod + prof + sk.rank + clsBonus;
          return (
            <button
              key={sk.key}
              type="button"
              style={{
                padding: '5px 9px',
                fontSize: '0.78rem',
                borderColor: sk.proficient ? 'var(--accent)' : undefined,
              }}
              onClick={() => onRecordRoll(sk.label, total)}
            >
              <span>{sk.label}</span>
              <strong style={{ color: 'var(--accent)' }}>
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
