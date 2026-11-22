import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Moon, ScrollText } from 'lucide-react';
import type { ApiViewPayload, PlotTimelineEntry } from '../../types';

interface PlotTimelineSectionProps {
  view: ApiViewPayload;
  astralOpen: boolean;
  astralMonthIndex: number | null;
  onToggleAstral: (open: boolean, monthIdx?: number | null) => void;
  onOpenSession: (entry: PlotTimelineEntry) => void;
}

export const PlotTimelineSection: React.FC<PlotTimelineSectionProps> = ({
  view,
  astralOpen,
  astralMonthIndex,
  onToggleAstral,
  onOpenSession,
}) => {
  const tl = view.plotTimeline;
  const defaultIdx = useMemo(() => {
    const i = tl.entries.findIndex((e) => e.kind === 'current');
    return i >= 0 ? i : 0;
  }, [tl.entries]);

  const [selectedIdx, setSelectedIdx] = useState<number>(defaultIdx);
  const [astralSeason, setAstralSeason] = useState<string>('all');
  const stripRef = useRef<HTMLDivElement>(null);
  const astralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (astralOpen) {
      setTimeout(() => {
        astralRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [astralOpen]);

  const activeEntry =
    tl.entries[Math.min(selectedIdx, Math.max(0, tl.entries.length - 1))] ||
    tl.entries[0];

  const activeMonth =
    tl.cosmicWheel.find(
      (m) => m.monthIndex === (astralMonthIndex ?? tl.currentDate.monthIndex),
    ) || tl.cosmicWheel[0];

  const scrollStrip = (dir: number) => {
    const next = Math.max(0, Math.min(tl.entries.length - 1, selectedIdx + dir));
    setSelectedIdx(next);
    stripRef.current?.scrollBy({ left: dir * 195, behavior: 'smooth' });
  };

  return (
    <section className="surface-card stack">
      <div className="row-between">
        <h2 className="section-title">Hilo de la Trama</h2>
        <div className="row">
          <button
            type="button"
            style={{ fontSize: '0.78rem', padding: '5px 10px' }}
            onClick={() => onToggleAstral(!astralOpen, tl.currentDate.monthIndex)}
          >
            <Moon size={14} /> Rueda Astral
          </button>
          <button
            type="button"
            className="btn-icon"
            aria-label="Sesión anterior"
            disabled={selectedIdx <= 0}
            onClick={() => scrollStrip(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            aria-label="Sesión siguiente"
            disabled={selectedIdx >= tl.entries.length - 1}
            onClick={() => scrollStrip(1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="timeline-strip" ref={stripRef}>
        {tl.entries.map((entry, idx) => (
          <button
            key={entry.id}
            type="button"
            className={`timeline-chip${idx === selectedIdx ? ' active' : ''}`}
            onClick={() => {
              if (idx === selectedIdx && entry.kind !== 'upcoming') {
                onOpenSession(entry);
              } else {
                setSelectedIdx(idx);
              }
            }}
          >
            <span
              className={`badge ${
                entry.kind === 'current'
                  ? 'badge-gold'
                  : entry.kind === 'upcoming'
                    ? 'badge-prog'
                    : ''
              }`}
            >
              {entry.sessionTag}
            </span>
            <span className="timeline-chip-title">{entry.title}</span>
            <span className="muted" style={{ fontSize: '0.72rem' }}>
              {entry.thyreniaDate.dayOfMonth} de {entry.thyreniaDate.monthName}
            </span>
          </button>
        ))}
      </div>

      {activeEntry && (
        <div className="timeline-focus">
          <div className="row-between">
            <div className="row">
              <span className="badge badge-gold">{activeEntry.sessionTag}</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                {activeEntry.thyreniaDate.formatted} · {activeEntry.location}
                {activeEntry.associatedEvent
                  ? ` · ${activeEntry.associatedEvent.name}`
                  : ''}
              </span>
            </div>
            {activeEntry.kind !== 'upcoming' && (
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => onOpenSession(activeEntry)}
              >
                <ScrollText size={14} /> Leer Crónica
              </button>
            )}
          </div>

          <strong
            style={{
              fontFamily: 'var(--display-font)',
              fontSize: '1.02rem',
              color: 'var(--text-strong)',
            }}
          >
            {activeEntry.title}
          </strong>

          <p className="muted" style={{ margin: 0 }}>
            {activeEntry.summary}
          </p>

          {activeEntry.highlights.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem' }}>
              {activeEntry.highlights.slice(0, 3).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {astralOpen && (
        <div ref={astralRef} className="stack divider-top">
          <div className="row-between">
            <strong style={{ fontFamily: 'var(--display-font)' }}>
              Rueda Astral (12 Meses)
            </strong>
            <div className="row">
              {['all', 'Invierno', 'Primavera', 'Verano', 'Otoño'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={astralSeason === s ? 'btn-primary' : ''}
                  style={{ padding: '4px 9px', fontSize: '0.74rem' }}
                  onClick={() => setAstralSeason(s)}
                >
                  {s === 'all' ? 'Todas' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="astral-grid">
            {tl.cosmicWheel
              .filter((m) => astralSeason === 'all' || m.season === astralSeason)
              .map((m) => (
                <button
                  key={m.monthIndex}
                  type="button"
                  className="lore-card-btn"
                  style={{
                    borderColor:
                      activeMonth?.monthIndex === m.monthIndex
                        ? 'var(--accent)'
                        : undefined,
                  }}
                  onClick={() => onToggleAstral(true, m.monthIndex)}
                >
                  <div className="row-between" style={{ width: '100%' }}>
                    <strong style={{ fontFamily: 'var(--display-font)' }}>
                      {m.monthIndex + 1}. {m.name}
                    </strong>
                    <span className="badge" style={{ fontSize: '0.68rem' }}>
                      {m.season}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.75rem' }}>
                    {m.deity}
                  </div>
                  {m.festivals.length > 0 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--accent)' }}>
                      {m.festivals.map((f) => f.name).join(' · ')}
                    </div>
                  )}
                </button>
              ))}
          </div>

          {activeMonth && (
            <div className="card-inner stack" style={{ gap: 6 }}>
              <div className="row-between">
                <strong style={{ fontFamily: 'var(--display-font)' }}>
                  {activeMonth.name} ({activeMonth.season})
                </strong>
                <span className="badge badge-asym">
                  Deidad: {activeMonth.deity}
                </span>
              </div>
              <div className="muted">{activeMonth.influence}</div>
              {activeMonth.festivals.map((f) => (
                <div key={f.id} style={{ fontSize: '0.84rem' }}>
                  <strong>
                    {f.name} (Día {f.dayOfMonth} · {f.kind}):
                  </strong>{' '}
                  <span className="muted">{f.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
