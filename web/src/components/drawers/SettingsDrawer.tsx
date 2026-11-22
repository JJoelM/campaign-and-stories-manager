import React, { useState } from 'react';
import { Crown, KeyRound, LogOut, Moon, Settings, Sun, X } from 'lucide-react';
import type { ApiViewPayload, FontId, ThemeId } from '../../types';
import { apiRequest } from '../../lib/api';

export interface SettingsDrawerProps {
  open: boolean;
  view: ApiViewPayload;
  theme: ThemeId;
  font: FontId;
  fontSize: number;
  isGm: boolean;
  onClose: () => void;
  onChangeTheme: (t: ThemeId) => void;
  onChangeFont: (f: FontId) => void;
  onChangeFontSize: (s: number) => void;
  onChangeCampaign: (campaignId: string) => void;
  onGmLogin: (gmKey: string) => void;
  onGmLogout: () => void;
  onOpenGmDrawer: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  view,
  theme,
  font,
  fontSize,
  isGm,
  onClose,
  onChangeTheme,
  onChangeFont,
  onChangeFontSize,
  onChangeCampaign,
  onGmLogin,
  onGmLogout,
  onOpenGmDrawer,
  onShowToast,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  if (!open) return null;

  const attemptLogin = async (localQuickLogin: boolean) => {
    setLoggingIn(true);
    try {
      const res = await apiRequest<{
        authenticated: boolean;
        sessionToken?: string;
        gmKey: string;
      }>('/api/gm/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          localQuickLogin ? { localQuickLogin: true } : { gmKey: keyInput },
        ),
      });
      const token = res.sessionToken || res.gmKey;
      if (res.authenticated && token) {
        onGmLogin(token);
        setKeyInput('');
        onShowToast('Modo GM activado.');
      }
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : 'No se pudo activar el Modo GM.',
      );
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Ajustes y apariencia"
      >
        <div className="row-between">
          <h3 className="section-title">
            <Settings size={16} /> Ajustes
          </h3>
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar ajustes"
          >
            <X size={16} />
          </button>
        </div>

        <div className="stack divider-top">
          <strong style={{ fontSize: '0.84rem' }}>Apariencia</strong>
          <div className="two-col">
            <button
              type="button"
              className={theme === 'grimorio' ? 'btn-primary' : ''}
              onClick={() => onChangeTheme('grimorio')}
            >
              <Moon size={14} /> Grimorio Nocturno
            </button>
            <button
              type="button"
              className={theme === 'pergamino' ? 'btn-primary' : ''}
              onClick={() => onChangeTheme('pergamino')}
            >
              <Sun size={14} /> Pergamino de Día
            </button>
          </div>
        </div>

        <div className="stack divider-top">
          <strong style={{ fontSize: '0.84rem' }}>Lectura del Códice</strong>
          <select
            value={font}
            onChange={(e) => onChangeFont(e.target.value as FontId)}
          >
            <option value="editorial-serif">Crimson Pro (Editorial)</option>
            <option value="modern-sans">Plus Jakarta Sans (Limpia)</option>
            <option value="classic-lora">Lora (Crónica Clásica)</option>
          </select>
          <div className="row-between">
            <span className="muted" style={{ fontSize: '0.82rem' }}>
              Tamaño de fuente: {fontSize}px
            </span>
            <div className="row">
              <button
                type="button"
                className="btn-icon"
                onClick={() => onChangeFontSize(Math.max(15, fontSize - 1))}
              >
                A−
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => onChangeFontSize(Math.min(22, fontSize + 1))}
              >
                A+
              </button>
            </div>
          </div>
        </div>

        <div className="stack divider-top">
          <strong style={{ fontSize: '0.84rem' }}>Campaña Activa</strong>
          <select
            value={view.activeCampaign.id}
            onChange={(e) => onChangeCampaign(e.target.value)}
          >
            {view.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="stack divider-top">
          <strong style={{ fontSize: '0.84rem' }}>
            <Crown size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Director de Juego (DM)
          </strong>
          {isGm ? (
            <div className="row">
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  onClose();
                  onOpenGmDrawer();
                }}
              >
                Consola del DM
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  onGmLogout();
                  onShowToast('Sesión GM cerrada.');
                }}
              >
                <LogOut size={14} /> Salir
              </button>
            </div>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              <input
                type="password"
                placeholder="Contraseña de GM..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <div className="row">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={loggingIn || !keyInput.trim()}
                  onClick={() => attemptLogin(false)}
                >
                  <KeyRound size={14} /> Entrar
                </button>
                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={() => attemptLogin(true)}
                >
                  Acceso local
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
