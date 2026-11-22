import React, { useState } from 'react';
import { Crown, KeyRound, Shield } from 'lucide-react';
import type { ApiViewPayload } from '../types';
import { apiRequest } from '../lib/api';
import { capitalize } from '../lib/markdown';

interface EntryGateProps {
  view: ApiViewPayload;
  onEnterAsPlayer: (characterId: string, campaignId: string) => void;
  onEnterAsGm: (gmKey: string, campaignId: string) => void;
}

export const EntryGate: React.FC<EntryGateProps> = ({
  view,
  onEnterAsPlayer,
  onEnterAsGm,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    view.activeCampaign.id,
  );
  const [gmPassword, setGmPassword] = useState('');
  const [gmError, setGmError] = useState<string | null>(null);
  const [submittingGm, setSubmittingGm] = useState(false);

  const handleGmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmPassword.trim()) {
      setGmError('Ingresa la contraseña de Director de Juego.');
      return;
    }
    setSubmittingGm(true);
    setGmError(null);
    try {
      const res = await apiRequest<{
        authenticated: boolean;
        sessionToken?: string;
        gmKey: string;
      }>('/api/gm/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmKey: gmPassword }),
      });
      const token = res.sessionToken || res.gmKey;
      if (res.authenticated && token) {
        onEnterAsGm(token, selectedCampaignId);
      } else {
        setGmError('Contraseña incorrecta.');
      }
    } catch (err) {
      setGmError(
        err instanceof Error ? err.message : 'Contraseña de GM incorrecta.',
      );
    } finally {
      setSubmittingGm(false);
    }
  };

  return (
    <div className="entry-gate-shell">
      <div className="entry-gate-container">
        <header className="entry-masthead">
          <div className="row" style={{ gap: 12 }}>
            <div className="brand-crest">T</div>
            <div>
              <h1 className="entry-title">THYRENIA</h1>
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                {view.calendarDate.formatted}
              </span>
            </div>
          </div>

          <div className="row">
            <label
              htmlFor="entryCampaignSelect"
              className="muted"
              style={{ fontSize: '0.82rem' }}
            >
              Campaña
            </label>
            <select
              id="entryCampaignSelect"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
            >
              {view.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="entry-grid">
          <section className="panel entry-card-panel">
            <div className="row section-header-rule" style={{ gap: 8 }}>
              <Shield size={16} />
              <h2 className="section-title">Entrar como Jugador</h2>
            </div>

            <div className="entry-player-grid">
              {view.characters.map((ch) => {
                const initials = ch.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <button
                    key={ch.id}
                    type="button"
                    className="entry-player-card"
                    onClick={() => onEnterAsPlayer(ch.id, selectedCampaignId)}
                  >
                    <div className="entry-avatar">{initials}</div>
                    <div className="entry-player-meta">
                      <strong className="entry-player-name">{ch.name}</strong>
                      <span className="muted" style={{ fontSize: '0.8rem' }}>
                        {capitalize(ch.race)} · {capitalize(ch.class)}
                      </span>
                      <span className="muted" style={{ fontSize: '0.74rem' }}>
                        {ch.factions[0] || 'Aventurero Libre'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel entry-card-panel">
            <div className="row section-header-rule" style={{ gap: 8 }}>
              <Crown size={16} />
              <h2 className="section-title">Director de Juego (GM)</h2>
            </div>

            <form className="stack" onSubmit={handleGmSubmit}>
              <label className="stack" style={{ gap: 6 }}>
                <span className="muted" style={{ fontSize: '0.82rem' }}>
                  Contraseña de GM
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ingresa la contraseña de GM..."
                  value={gmPassword}
                  onChange={(e) => {
                    setGmPassword(e.target.value);
                    if (gmError) setGmError(null);
                  }}
                />
              </label>

              {gmError && (
                <div className="entry-error" role="alert">
                  {gmError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={submittingGm}
                style={{ width: '100%', padding: '9px 14px' }}
              >
                <KeyRound size={15} />
                {submittingGm ? 'Verificando...' : 'Ingresar como GM'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
