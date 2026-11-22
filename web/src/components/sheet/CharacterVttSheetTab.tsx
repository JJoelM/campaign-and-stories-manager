import React, { useEffect, useRef, useState } from 'react';
import { Dices, Flame, Heart, Shield, Sparkles } from 'lucide-react';
import type { ApiViewPayload, ThyreniaCharacterSheet } from '../../types';
import { apiRequest } from '../../lib/api';
import { capitalize } from '../../lib/markdown';

interface CharacterVttSheetTabProps {
  view: ApiViewPayload;
  gmKey: string;
  onRecordRoll: (skillLabel: string, bonus: number) => void;
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

const ABILITY_META: Array<{
  key: keyof ThyreniaCharacterSheet['abilities'];
  label: string;
  full: string;
}> = [
  { key: 'str', label: 'FUE', full: 'Fuerza' },
  { key: 'dex', label: 'DES', full: 'Destreza' },
  { key: 'con', label: 'CON', full: 'Constitución' },
  { key: 'int', label: 'INT', full: 'Inteligencia' },
  { key: 'wis', label: 'SAB', full: 'Sabiduría' },
  { key: 'cha', label: 'CAR', full: 'Carisma' },
];

const ABILITY_SHORT: Record<
  keyof ThyreniaCharacterSheet['abilities'],
  string
> = {
  str: 'FUE',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};

function abilityMod(score: number): number {
  return Math.floor((Number(score || 10) - 10) / 2);
}

export const CharacterVttSheetTab: React.FC<CharacterVttSheetTabProps> = ({
  view,
  gmKey,
  onRecordRoll,
  onRefresh,
  onShowToast,
}) => {
  const [pendingPatch, setPendingPatch] = useState<{
    characterId: string;
    fields: Partial<ThyreniaCharacterSheet>;
  } | null>(null);
  const [lastRollText, setLastRollText] = useState<string>('');
  const [justRolledKey, setJustRolledKey] = useState<string | null>(null);
  const rollTimerRef = useRef<number | null>(null);
  const baseSheet = view.characterSheet;

  useEffect(
    () => () => {
      if (rollTimerRef.current !== null) {
        window.clearTimeout(rollTimerRef.current);
      }
    },
    [],
  );

  const triggerRollHighlight = (key: string) => {
    setJustRolledKey(key);
    if (rollTimerRef.current !== null) {
      window.clearTimeout(rollTimerRef.current);
    }
    rollTimerRef.current = window.setTimeout(() => setJustRolledKey(null), 650);
  };
  const sheet: ThyreniaCharacterSheet =
    pendingPatch && pendingPatch.characterId === baseSheet.characterId
      ? { ...baseSheet, ...pendingPatch.fields }
      : baseSheet;

  const patchSheet = async (patch: Partial<ThyreniaCharacterSheet>) => {
    const targetId = baseSheet.characterId;
    setPendingPatch((prev) => ({
      characterId: targetId,
      fields: {
        ...(prev && prev.characterId === targetId ? prev.fields : {}),
        ...patch,
      },
    }));
    try {
      await apiRequest(
        '/api/character/sheet',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: targetId,
            ...patch,
          }),
        },
        gmKey,
      );
      await onRefresh();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Error guardando ficha');
    } finally {
      setPendingPatch((prev) =>
        prev?.characterId === targetId ? null : prev,
      );
    }
  };

  const hpPct = Math.max(
    0,
    Math.min(100, Math.round((sheet.hp.current / Math.max(1, sheet.hp.max)) * 100)),
  );
  const manaPct = Math.max(
    0,
    Math.min(
      100,
      Math.round((sheet.mana.current / Math.max(1, sheet.mana.max)) * 100),
    ),
  );
  const initials = sheet.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const initMod = abilityMod(sheet.abilities.dex);
  const percSkill = sheet.skills.find((s) => s.key === 'percepcion');
  const passivePerception =
    10 +
    abilityMod(sheet.abilities.wis) +
    (percSkill?.proficient ? sheet.proficiencyBonus : 0) +
    (percSkill?.rank || 0);

  return (
    <div className="stack-lg">
      {/* Cabecera compacta de combate, estadísticas pasivas y vitalidad editable */}
      <section className="panel sheet-hero-panel">
        <div className="sheet-identity-row">
          <div className="sheet-portrait-crest" aria-hidden="true">
            {initials}
          </div>
          <div className="sheet-identity-meta">
            <h1 className="sheet-char-name">{sheet.name}</h1>
            <p className="sheet-char-sub">
              {capitalize(sheet.race)} · {capitalize(sheet.class)}
              {view.character.factions.length > 0
                ? ` · ${view.character.factions.join(', ')}`
                : ''}
            </p>
          </div>
          <div className="sheet-ac-box" title="Clase de Armadura">
            <span>
              <Shield size={11} style={{ verticalAlign: 'middle' }} /> CA
            </span>
            <strong>{sheet.armorClass}</strong>
          </div>
        </div>

        <div className="passive-ribbon">
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.74rem' }}>Nivel</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>{sheet.level}</strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.74rem' }}>Iniciativa</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>
              {initMod >= 0 ? `+${initMod}` : initMod}
            </strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.74rem' }}>Perc. Pasiva</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>{passivePerception}</strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.74rem' }}>Competencia</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>
              +{sheet.proficiencyBonus}
            </strong>
          </div>
        </div>

        <div className="sheet-vitals-strip">
          {/* Puntos de Golpe editables */}
          <div className="vital-card">
            <div className="row-between">
              <span className="vital-label hp">
                <Heart size={13} /> PG
              </span>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Restar 1 PG"
                  onClick={() =>
                    void patchSheet({
                      hp: {
                        ...sheet.hp,
                        current: Math.max(0, sheet.hp.current - 1),
                      },
                    })
                  }
                >
                  −
                </button>
                <strong className="vital-value">
                  {sheet.hp.current}/{sheet.hp.max}
                </strong>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Sumar 1 PG"
                  onClick={() =>
                    void patchSheet({
                      hp: {
                        ...sheet.hp,
                        current: Math.min(sheet.hp.max, sheet.hp.current + 1),
                      },
                    })
                  }
                >
                  +
                </button>
              </div>
            </div>
            <div className="vital-bar-track">
              <div className="vital-bar-fill hp" style={{ width: `${hpPct}%` }} />
            </div>
          </div>

          {/* Maná editable */}
          <div className="vital-card">
            <div className="row-between">
              <span className="vital-label mana">
                <Sparkles size={13} /> Maná
              </span>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Restar 1 Maná"
                  onClick={() =>
                    void patchSheet({
                      mana: {
                        ...sheet.mana,
                        current: Math.max(0, sheet.mana.current - 1),
                      },
                    })
                  }
                >
                  −
                </button>
                <strong className="vital-value">
                  {sheet.mana.current}/{sheet.mana.max}
                </strong>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Sumar 1 Maná"
                  onClick={() =>
                    void patchSheet({
                      mana: {
                        ...sheet.mana,
                        current: Math.min(sheet.mana.max, sheet.mana.current + 1),
                      },
                    })
                  }
                >
                  +
                </button>
              </div>
            </div>
            <div className="vital-bar-track">
              <div
                className="vital-bar-fill mana"
                style={{ width: `${manaPct}%` }}
              />
            </div>
          </div>

          {/* Fortuna */}
          <div className="vital-card" style={{ justifyContent: 'space-between' }}>
            <div className="row-between">
              <span className="vital-label">Fortuna</span>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Restar Punto de Fortuna"
                  onClick={() =>
                    void patchSheet({
                      fortunePoints: Math.max(0, sheet.fortunePoints - 1),
                    })
                  }
                >
                  −
                </button>
                <strong className="vital-value" style={{ color: 'var(--accent)' }}>
                  {sheet.fortunePoints}
                </strong>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Sumar Punto de Fortuna"
                  onClick={() =>
                    void patchSheet({ fortunePoints: sheet.fortunePoints + 1 })
                  }
                >
                  +
                </button>
              </div>
            </div>
            <div className="seal-pips">
              {Array.from({ length: Math.max(3, sheet.fortunePoints) }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`seal-pip-btn${i < sheet.fortunePoints ? ' active' : ''}`}
                  aria-label={`Fijar Fortuna en ${i + 1}`}
                  onClick={() =>
                    void patchSheet({
                      fortunePoints: sheet.fortunePoints === i + 1 ? i : i + 1,
                    })
                  }
                >
                  {i < sheet.fortunePoints ? '◆' : '◇'}
                </button>
              ))}
            </div>
          </div>

          {/* Destino */}
          <div className="vital-card" style={{ justifyContent: 'space-between' }}>
            <div className="row-between">
              <span className="vital-label">
                <Flame size={13} /> Destino
              </span>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Restar Punto de Destino"
                  onClick={() =>
                    void patchSheet({
                      destinyPoints: Math.max(0, sheet.destinyPoints - 1),
                    })
                  }
                >
                  −
                </button>
                <strong className="vital-value" style={{ color: 'var(--accent)' }}>
                  {sheet.destinyPoints}
                </strong>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Sumar Punto de Destino"
                  onClick={() =>
                    void patchSheet({ destinyPoints: sheet.destinyPoints + 1 })
                  }
                >
                  +
                </button>
              </div>
            </div>
            <div className="seal-pips">
              {Array.from({ length: Math.max(3, sheet.destinyPoints) }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`seal-pip-btn${i < sheet.destinyPoints ? ' active' : ''}`}
                  aria-label={`Fijar Destino en ${i + 1}`}
                  onClick={() =>
                    void patchSheet({
                      destinyPoints: sheet.destinyPoints === i + 1 ? i : i + 1,
                    })
                  }
                >
                  {i < sheet.destinyPoints ? '◆' : '◇'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Atributos en Panel de Grimorio D&D */}
      <section className="panel stack" style={{ gap: 16 }}>
        <div className="row-between section-header-rule">
          <h2 className="section-title">Atributos de Personaje</h2>
          <span className="overline">Modificadores 1d20</span>
        </div>
        <div className="stat-grid">
          {ABILITY_META.map((ab) => {
            const score = sheet.abilities[ab.key];
            const mod = abilityMod(score);
            return (
              <button
                key={ab.key}
                type="button"
                className={`stat-medallion${justRolledKey === ab.key ? ' just-rolled' : ''}`}
                title={`Tirar ${ab.full}`}
                onClick={() => {
                  onRecordRoll(ab.full, mod);
                  setLastRollText(`${ab.full} (${mod >= 0 ? '+' : ''}${mod})`);
                  triggerRollHighlight(ab.key);
                }}
              >
                <span className="stat-medallion-label">{ab.label}</span>
                <span className="stat-medallion-mod">
                  {mod >= 0 ? `+${mod}` : mod}
                </span>
                <span className="stat-medallion-score">{score}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Habilidades en lista densa */}
      <section className="panel stack" style={{ gap: 14 }}>
        <div className="row-between section-header-rule">
          <h2 className="section-title">
            <Dices size={16} /> Habilidades
          </h2>
          {lastRollText && (
            <span key={lastRollText} className="badge badge-gold">
              {lastRollText}
            </span>
          )}
        </div>

        <div className="skills-grid">
          {sheet.skills.map((sk) => {
            const mod =
              abilityMod(sheet.abilities[sk.defaultAbility]) +
              (sk.proficient ? sheet.proficiencyBonus : 0) +
              (sk.isClassSkill ? 2 : 0) +
              (sk.rank || 0);
            return (
              <button
                key={sk.key}
                type="button"
                className={`skill-row-btn${sk.proficient ? ' proficient' : ''}${
                  justRolledKey === sk.key ? ' just-rolled' : ''
                }`}
                onClick={() => {
                  onRecordRoll(sk.label, mod);
                  setLastRollText(`${sk.label} (${mod >= 0 ? '+' : ''}${mod})`);
                  triggerRollHighlight(sk.key);
                }}
              >
                <span
                  className={`skill-dot${sk.proficient ? ' filled' : ''}`}
                  aria-hidden="true"
                />
                <div className="skill-info">
                  <span className="skill-name">{sk.label}</span>
                  <span className="skill-meta">
                    {ABILITY_SHORT[sk.defaultAbility]}
                  </span>
                </div>
                <span className="skill-mod-pill">
                  {mod >= 0 ? `+${mod}` : mod}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Creencias y Defectos */}
      <div className="two-col">
        <section className="panel stack" style={{ gap: 12 }}>
          <h2 className="section-title section-header-rule">Creencias</h2>
          {sheet.beliefs.map((b, idx) => (
            <label key={idx} className="belief-card">
              <input
                type="checkbox"
                checked={b.markedThisSession}
                onChange={() => {
                  const next = sheet.beliefs.map((item, i) =>
                    i === idx
                      ? {
                          ...item,
                          markedThisSession: !item.markedThisSession,
                        }
                      : item,
                  );
                  void patchSheet({ beliefs: next });
                }}
              />
              <span>{b.text}</span>
            </label>
          ))}
        </section>

        <section className="panel stack" style={{ gap: 12 }}>
          <h2 className="section-title section-header-rule">
            Defectos y Cicatrices
          </h2>
          {sheet.flaws.map((f, idx) => (
            <div key={idx} className="flaw-card">
              {f}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
