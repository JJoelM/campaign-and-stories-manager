import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Dices,
  Flame,
  Heart,
  Plus,
  ScrollText,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
} from 'lucide-react';
import type {
  AbilityKey,
  ApiViewPayload,
  ThyreniaAttackEntry,
  ThyreniaCharacterSheet,
} from '../../types';
import { apiRequest } from '../../lib/api';
import {
  ABILITY_META,
  ABILITY_SHORT,
  abilityMod,
  computeSkillBreakdown,
  formatSigned,
  normalizeCharacterSheet,
} from '../../lib/sheet-utils';
import { SheetBackstoryPage } from './SheetBackstoryPage';
import { SheetSpellsPage } from './SheetSpellsPage';

interface CharacterVttSheetTabProps {
  view: ApiViewPayload;
  gmKey: string;
  onRecordRoll: (skillLabel: string, bonus: number) => void;
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

type SheetPage = 'main' | 'backstory' | 'spells';

const COIN_KEYS: Array<{ key: keyof ThyreniaCharacterSheet['coins']; label: string }> = [
  { key: 'pc', label: 'PC' },
  { key: 'pp', label: 'PP' },
  { key: 'pe', label: 'PE' },
  { key: 'po', label: 'PO' },
  { key: 'ppt', label: 'PPT' },
];

export const CharacterVttSheetTab: React.FC<CharacterVttSheetTabProps> = ({
  view,
  gmKey,
  onRecordRoll,
  onRefresh,
  onShowToast,
}) => {
  const [sheetPage, setSheetPage] = useState<SheetPage>('main');
  const [pendingPatch, setPendingPatch] = useState<{
    characterId: string;
    fields: Partial<ThyreniaCharacterSheet>;
  } | null>(null);
  const [lastRollText, setLastRollText] = useState<string>('');
  const [justRolledKey, setJustRolledKey] = useState<string | null>(null);
  const rollTimerRef = useRef<number | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const queuedPatchRef = useRef<Partial<ThyreniaCharacterSheet>>({});

  const baseSheet = view.characterSheet;

  useEffect(
    () => () => {
      if (rollTimerRef.current !== null) window.clearTimeout(rollTimerRef.current);
      if (syncTimerRef.current !== null) window.clearTimeout(syncTimerRef.current);
    },
    [],
  );

  const triggerRollHighlight = (key: string) => {
    setJustRolledKey(key);
    if (rollTimerRef.current !== null) window.clearTimeout(rollTimerRef.current);
    rollTimerRef.current = window.setTimeout(() => setJustRolledKey(null), 650);
  };

  const sheet: ThyreniaCharacterSheet = normalizeCharacterSheet(
    pendingPatch && pendingPatch.characterId === baseSheet.characterId
      ? { ...baseSheet, ...pendingPatch.fields }
      : baseSheet,
  );

  const commitPatchToServer = async (
    targetId: string,
    payload: Partial<ThyreniaCharacterSheet>,
  ) => {
    try {
      await apiRequest(
        '/api/character/sheet',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: targetId,
            ...payload,
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

  const patchSheet = async (patch: Partial<ThyreniaCharacterSheet>) => {
    const targetId = baseSheet.characterId;
    setPendingPatch((prev) => ({
      characterId: targetId,
      fields: {
        ...(prev && prev.characterId === targetId ? prev.fields : {}),
        ...patch,
      },
    }));
    queuedPatchRef.current = { ...queuedPatchRef.current, ...patch };
    if (syncTimerRef.current !== null) window.clearTimeout(syncTimerRef.current);

    return new Promise<void>((resolve) => {
      syncTimerRef.current = window.setTimeout(() => {
        const merged = queuedPatchRef.current;
        queuedPatchRef.current = {};
        void commitPatchToServer(targetId, merged).finally(resolve);
      }, 280);
    });
  };

  const hpPct = Math.max(
    0,
    Math.min(100, Math.round((sheet.hp.current / Math.max(1, sheet.hp.max)) * 100)),
  );
  const auraMax = sheet.auraPoints?.max > 0 ? sheet.auraPoints.max : sheet.mana.max;
  const auraCurrent =
    sheet.auraPoints?.max > 0 ? sheet.auraPoints.current : sheet.mana.current;
  const auraPct = Math.max(
    0,
    Math.min(100, Math.round((auraCurrent / Math.max(1, auraMax)) * 100)),
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
    10 + (percSkill ? computeSkillBreakdown(sheet, percSkill).total : abilityMod(sheet.abilities.wis));

  const rollWithFeedback = (key: string, label: string, bonus: number) => {
    onRecordRoll(label, bonus);
    setLastRollText(`${label} (${formatSigned(bonus)})`);
    triggerRollHighlight(key);
  };

  return (
    <div className="stack-lg">
      {/* Cabecera unificada de ficha + datos de Página 1 del PDF */}
      <section className="panel sheet-hero-panel">
        <div className="sheet-identity-row">
          <div className="sheet-portrait-crest" aria-hidden="true">
            {initials}
          </div>
          <div className="sheet-identity-meta">
            <h1 className="sheet-char-name">{sheet.name}</h1>
            <p className="sheet-char-sub">
              {sheet.race} · {sheet.class} Nv.{sheet.level}
              {sheet.background ? ` · ${sheet.background}` : ''}
              {sheet.alignment ? ` · ${sheet.alignment}` : ''}
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className={`badge${sheet.inspiration ? ' badge-gold' : ''}`}
              onClick={() => void patchSheet({ inspiration: !sheet.inspiration })}
              title="Alternar Inspiración"
            >
              {sheet.inspiration ? '★ Inspiración' : '☆ Inspiración'}
            </button>
            <div className="sheet-ac-box" title="Clase de Armadura">
              <span>
                <Shield size={11} style={{ verticalAlign: 'middle' }} /> CA
              </span>
              <strong>{sheet.armorClass}</strong>
            </div>
          </div>
        </div>

        <div className="passive-ribbon sheet-combat-ribbon">
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.72rem' }}>Nivel</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>{sheet.level}</strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.72rem' }}>Iniciativa</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>
              {formatSigned(initMod)}
            </strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.72rem' }}>Velocidad</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>{sheet.speed}</strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.72rem' }}>Perc. Pasiva</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>{passivePerception}</strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.72rem' }}>Competencia</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>
              +{sheet.proficiencyBonus}
            </strong>
          </div>
          <div className="passive-stat">
            <span className="muted" style={{ fontSize: '0.72rem' }}>PX</span>
            <strong style={{ fontFamily: 'var(--display-font)' }}>
              {sheet.experiencePoints}
            </strong>
          </div>
        </div>

        {/* Vitalidad, Dados de Golpe, Salvaciones de Muerte, Aura, Fortuna, Destino y Acción Desesperada */}
        <div className="sheet-vitals-strip">
          {/* PG Actual / Máx / Temp */}
          <div className="vital-card">
            <div className="row-between">
              <span className="vital-label hp">
                <Heart size={13} /> PG
              </span>
              <div className="row" style={{ gap: 5 }}>
                <button
                  type="button"
                  className="mini-step-btn"
                  aria-label="Restar 1 PG"
                  onClick={() =>
                    void patchSheet({
                      hp: { ...sheet.hp, current: Math.max(0, sheet.hp.current - 1) },
                    })
                  }
                >
                  −
                </button>
                <strong className="vital-value">
                  {sheet.hp.current}/{sheet.hp.max}
                  {sheet.hp.temp > 0 ? ` (+${sheet.hp.temp})` : ''}
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
            <div className="row-between" style={{ fontSize: '0.72rem' }}>
              <span className="muted">
                Dados: <strong>{sheet.hitDice.total}</strong> ({sheet.hitDice.used} usados)
              </span>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '1px 6px', fontSize: '0.7rem' }}
                onClick={() =>
                  void patchSheet({
                    hp: { ...sheet.hp, temp: sheet.hp.temp + 1 },
                  })
                }
                title="Añadir PG temporal"
              >
                +Temp ({sheet.hp.temp})
              </button>
            </div>
          </div>

          {/* Puntos de Aura / Maná */}
          <div className="vital-card">
            <div className="row-between">
              <span className="vital-label mana">
                <Sparkles size={13} /> Aura / Maná
              </span>
              <div className="row" style={{ gap: 5 }}>
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
                      ...(sheet.auraPoints.max > 0
                        ? {
                            auraPoints: {
                              ...sheet.auraPoints,
                              current: Math.max(0, sheet.auraPoints.current - 1),
                            },
                          }
                        : {}),
                    })
                  }
                >
                  −
                </button>
                <strong className="vital-value">
                  {auraCurrent}/{auraMax}
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
                      ...(sheet.auraPoints.max > 0
                        ? {
                            auraPoints: {
                              ...sheet.auraPoints,
                              current: Math.min(
                                sheet.auraPoints.max,
                                sheet.auraPoints.current + 1,
                              ),
                            },
                          }
                        : {}),
                    })
                  }
                >
                  +
                </button>
              </div>
            </div>
            <div className="vital-bar-track">
              <div className="vital-bar-fill mana" style={{ width: `${auraPct}%` }} />
            </div>
            <div className="death-saves-row">
              <span className="muted" style={{ fontSize: '0.7rem' }}>Éxitos</span>
              <div className="seal-pips" style={{ gap: 2 }}>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`seal-pip-btn${i < sheet.deathSaves.successes ? ' active' : ''}`}
                    aria-label={`Éxito salvación ${i + 1}`}
                    onClick={() =>
                      void patchSheet({
                        deathSaves: {
                          ...sheet.deathSaves,
                          successes: sheet.deathSaves.successes === i + 1 ? i : i + 1,
                        },
                      })
                    }
                  >
                    {i < sheet.deathSaves.successes ? '●' : '○'}
                  </button>
                ))}
              </div>
              <span className="muted" style={{ fontSize: '0.7rem' }}>Fallos</span>
              <div className="seal-pips" style={{ gap: 2 }}>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`seal-pip-btn${i < sheet.deathSaves.failures ? ' active' : ''}`}
                    style={i < sheet.deathSaves.failures ? { color: 'var(--danger)' } : undefined}
                    aria-label={`Fallo salvación ${i + 1}`}
                    onClick={() =>
                      void patchSheet({
                        deathSaves: {
                          ...sheet.deathSaves,
                          failures: sheet.deathSaves.failures === i + 1 ? i : i + 1,
                        },
                      })
                    }
                  >
                    {i < sheet.deathSaves.failures ? '✕' : '○'}
                  </button>
                ))}
              </div>
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

          {/* Destino + Acción Desesperada */}
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
            <div className="row-between" style={{ gap: 6 }}>
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
              <button
                type="button"
                className={`badge${sheet.desperateActionUsed ? ' badge-danger' : ''}`}
                style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                title="Acción Desesperada (Thyrenia)"
                onClick={() =>
                  void patchSheet({ desperateActionUsed: !sheet.desperateActionUsed })
                }
              >
                <Skull size={11} />
                {sheet.desperateActionUsed ? 'Desesperada usada' : 'Acc. Desesperada'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Selector de las 3 páginas de la Ficha Editable */}
      <div className="row-between">
        <div className="segmented-tabs" role="tablist" aria-label="Páginas de la hoja de personaje">
          <button
            type="button"
            role="tab"
            aria-selected={sheetPage === 'main'}
            className={`segmented-tab${sheetPage === 'main' ? ' active' : ''}`}
            onClick={() => setSheetPage('main')}
          >
            <Swords size={14} /> Principal y Combate
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sheetPage === 'backstory'}
            className={`segmented-tab${sheetPage === 'backstory' ? ' active' : ''}`}
            onClick={() => setSheetPage('backstory')}
          >
            <ScrollText size={14} /> Trasfondo y Milonga
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sheetPage === 'spells'}
            className={`segmented-tab${sheetPage === 'spells' ? ' active' : ''}`}
            onClick={() => setSheetPage('spells')}
          >
            <BookOpen size={14} /> Conjuros y Aura
          </button>
        </div>

        {lastRollText && (
          <span key={lastRollText} className="badge badge-gold">
            {lastRollText}
          </span>
        )}
      </div>

      {/* === PÁGINA 1: COMBATE, SALVACIONES, HABILIDADES, ATAQUES Y EQUIPO === */}
      {sheetPage === 'main' && (
        <div key="page-main" className="stack-lg view-stage">
          {/* Atributos + Tiradas de Salvación */}
          <section className="panel stack" style={{ gap: 16 }}>
            <div className="row-between section-header-rule">
              <h2 className="section-title">Atributos y Tiradas de Salvación</h2>
              <span className="overline">1d20 · Clic para tirar</span>
            </div>
            <div className="stat-grid">
              {ABILITY_META.map((ab) => {
                const score = sheet.abilities[ab.key];
                const mod = abilityMod(score);
                const saveProf = Boolean(sheet.savingThrowProficiencies?.[ab.key]);
                const saveBonus = mod + (saveProf ? sheet.proficiencyBonus : 0);
                return (
                  <div key={ab.key} className="stat-medallion-wrap">
                    <button
                      type="button"
                      className={`stat-medallion${justRolledKey === ab.key ? ' just-rolled' : ''}`}
                      title={`Tirar ${ab.full}`}
                      onClick={() => rollWithFeedback(ab.key, ab.full, mod)}
                    >
                      <span className="stat-medallion-label">{ab.label}</span>
                      <span className="stat-medallion-mod">{formatSigned(mod)}</span>
                      <span className="stat-medallion-score">{score}</span>
                    </button>
                    <div className="saving-throw-pill">
                      <input
                        type="checkbox"
                        checked={saveProf}
                        aria-label={`Competencia en salvación de ${ab.full}`}
                        onChange={() =>
                          void patchSheet({
                            savingThrowProficiencies: {
                              ...sheet.savingThrowProficiencies,
                              [ab.key]: !saveProf,
                            },
                          })
                        }
                      />
                      <button
                        type="button"
                        className={`btn-ghost${justRolledKey === `save-${ab.key}` ? ' just-rolled' : ''}`}
                        style={{ padding: '2px 6px', fontSize: '0.74rem' }}
                        onClick={() =>
                          rollWithFeedback(
                            `save-${ab.key}`,
                            `Salvación ${ab.label}`,
                            saveBonus,
                          )
                        }
                      >
                        Salv. {formatSigned(saveBonus)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tabla completa de 11 Habilidades de Thyrenia */}
          <section className="panel stack" style={{ gap: 14 }}>
            <div className="row-between section-header-rule">
              <h2 className="section-title">
                <Dices size={16} /> Habilidades de Thyrenia
              </h2>
              <span className="overline">Mod. + Prof. + Rango + Clase (+2 si Rango ≥ 1)</span>
            </div>

            <div className="skill-table-wrap">
              <div className="skill-table-head">
                <span>Habilidad</span>
                <span>Total</span>
                <span>Mod.</span>
                <span>Prof.</span>
                <span>Rango</span>
                <span>Clase</span>
              </div>
              {sheet.skills.map((sk) => {
                const { abilityModValue, total } = computeSkillBreakdown(sheet, sk);
                return (
                  <div
                    key={sk.key}
                    className={`skill-table-row${justRolledKey === sk.key ? ' just-rolled' : ''}`}
                  >
                    <div className="skill-info">
                      <span className="skill-name">{sk.label}</span>
                      <span className="skill-meta">{ABILITY_SHORT[sk.defaultAbility]}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', minWidth: 54 }}
                      onClick={() => rollWithFeedback(sk.key, sk.label, total)}
                      title={`Tirar 1d20 ${formatSigned(total)}`}
                    >
                      {formatSigned(total)}
                    </button>
                    <span className="muted" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                      {formatSigned(abilityModValue)}
                    </span>
                    <input
                      type="checkbox"
                      checked={sk.proficient}
                      aria-label={`Proficiencia en ${sk.label}`}
                      onChange={() => {
                        const next = sheet.skills.map((item) =>
                          item.key === sk.key
                            ? { ...item, proficient: !item.proficient }
                            : item,
                        );
                        void patchSheet({ skills: next });
                      }}
                    />
                    <div className="row" style={{ gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}>
                      <button
                        type="button"
                        className="mini-step-btn"
                        aria-label={`Restar rango en ${sk.label}`}
                        onClick={() => {
                          const next = sheet.skills.map((item) =>
                            item.key === sk.key
                              ? { ...item, rank: Math.max(0, item.rank - 1) }
                              : item,
                          );
                          void patchSheet({ skills: next });
                        }}
                      >
                        −
                      </button>
                      <strong style={{ minWidth: 16, textAlign: 'center', fontSize: '0.84rem' }}>
                        {sk.rank}
                      </strong>
                      <button
                        type="button"
                        className="mini-step-btn"
                        aria-label={`Sumar rango en ${sk.label}`}
                        onClick={() => {
                          const next = sheet.skills.map((item) =>
                            item.key === sk.key
                              ? { ...item, rank: item.rank + 1 }
                              : item,
                          );
                          void patchSheet({ skills: next });
                        }}
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="checkbox"
                      checked={sk.isClassSkill}
                      aria-label={`Habilidad de clase en ${sk.label}`}
                      onChange={() => {
                        const next = sheet.skills.map((item) =>
                          item.key === sk.key
                            ? { ...item, isClassSkill: !item.isClassSkill }
                            : item,
                        );
                        void patchSheet({ skills: next });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Ataques y Conjuros + Competencias */}
          <div className="two-col">
            <section className="panel stack" style={{ gap: 12 }}>
              <div className="row-between section-header-rule">
                <h2 className="section-title">Ataques y Conjuros</h2>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => {
                    const blank: ThyreniaAttackEntry = {
                      name: '',
                      attackBonus: '+0',
                      damage: '1d6',
                      damageType: '',
                    };
                    void patchSheet({ attacks: [...sheet.attacks, blank] });
                  }}
                >
                  <Plus size={13} /> Ataque
                </button>
              </div>

              {sheet.attacks.length === 0 ? (
                <div className="muted" style={{ fontSize: '0.82rem' }}>
                  Sin ataques registrados.
                </div>
              ) : (
                <div className="stack" style={{ gap: 8 }}>
                  {sheet.attacks.map((atk, idx) => (
                    <div key={idx} className="attack-row-card">
                      <input
                        value={atk.name}
                        placeholder="Arma o conjuro"
                        style={{ flex: '1.4 1 120px' }}
                        onChange={(e) => {
                          const next = sheet.attacks.map((it, i) =>
                            i === idx ? { ...it, name: e.target.value } : it,
                          );
                          void patchSheet({ attacks: next });
                        }}
                      />
                      <input
                        value={atk.attackBonus}
                        placeholder="+5"
                        style={{ width: 64 }}
                        onChange={(e) => {
                          const next = sheet.attacks.map((it, i) =>
                            i === idx ? { ...it, attackBonus: e.target.value } : it,
                          );
                          void patchSheet({ attacks: next });
                        }}
                      />
                      <input
                        value={atk.damage}
                        placeholder="1d8+3"
                        style={{ width: 82 }}
                        onChange={(e) => {
                          const next = sheet.attacks.map((it, i) =>
                            i === idx ? { ...it, damage: e.target.value } : it,
                          );
                          void patchSheet({ attacks: next });
                        }}
                      />
                      <input
                        value={atk.damageType}
                        placeholder="Tipo"
                        style={{ flex: '0.9 1 82px' }}
                        onChange={(e) => {
                          const next = sheet.attacks.map((it, i) =>
                            i === idx ? { ...it, damageType: e.target.value } : it,
                          );
                          void patchSheet({ attacks: next });
                        }}
                      />
                      <button
                        type="button"
                        className="btn-ghost btn-icon"
                        style={{ width: 28, height: 28 }}
                        aria-label="Eliminar ataque"
                        onClick={() =>
                          void patchSheet({
                            attacks: sheet.attacks.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="stack divider-top" style={{ gap: 8 }}>
                <strong style={{ fontSize: '0.86rem', color: 'var(--text-strong)' }}>
                  Rasgos y Atributos
                </strong>
                <textarea
                  rows={3}
                  value={sheet.featuresAndTraits || ''}
                  placeholder="Rasgos raciales, dotes y aptitudes de clase..."
                  onChange={(e) =>
                    void patchSheet({ featuresAndTraits: e.target.value })
                  }
                />
              </div>
            </section>

            {/* Competencias y Monedas + Equipamiento */}
            <section className="panel stack" style={{ gap: 12 }}>
              <h2 className="section-title section-header-rule">
                Competencias, Monedas y Equipo
              </h2>

              <div className="stack" style={{ gap: 6, fontSize: '0.82rem' }}>
                <div className="row">
                  <span className="muted" style={{ minWidth: 74 }}>Armaduras:</span>
                  {(
                    [
                      ['light', 'Ligera'],
                      ['medium', 'Mediana'],
                      ['heavy', 'Pesada'],
                      ['shield', 'Escudo'],
                    ] as const
                  ).map(([k, lbl]) => (
                    <label key={k} className="row" style={{ gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={sheet.proficiencies.armors[k]}
                        onChange={() =>
                          void patchSheet({
                            proficiencies: {
                              ...sheet.proficiencies,
                              armors: {
                                ...sheet.proficiencies.armors,
                                [k]: !sheet.proficiencies.armors[k],
                              },
                            },
                          })
                        }
                      />
                      {lbl}
                    </label>
                  ))}
                </div>
                <div className="row">
                  <span className="muted" style={{ minWidth: 74 }}>Armas:</span>
                  <label className="row" style={{ gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={sheet.proficiencies.weapons.simple}
                      onChange={() =>
                        void patchSheet({
                          proficiencies: {
                            ...sheet.proficiencies,
                            weapons: {
                              ...sheet.proficiencies.weapons,
                              simple: !sheet.proficiencies.weapons.simple,
                            },
                          },
                        })
                      }
                    />
                    Simples
                  </label>
                  <label className="row" style={{ gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={sheet.proficiencies.weapons.martial}
                      onChange={() =>
                        void patchSheet({
                          proficiencies: {
                            ...sheet.proficiencies,
                            weapons: {
                              ...sheet.proficiencies.weapons,
                              martial: !sheet.proficiencies.weapons.martial,
                            },
                          },
                        })
                      }
                    />
                    Marciales
                  </label>
                </div>
                <input
                  value={sheet.proficiencies.tools || ''}
                  placeholder="Kit y herramientas..."
                  onChange={(e) =>
                    void patchSheet({
                      proficiencies: { ...sheet.proficiencies, tools: e.target.value },
                    })
                  }
                />
                <input
                  value={sheet.proficiencies.languages || ''}
                  placeholder="Idiomas..."
                  onChange={(e) =>
                    void patchSheet({
                      proficiencies: {
                        ...sheet.proficiencies,
                        languages: e.target.value,
                      },
                    })
                  }
                />
              </div>

              {/* Monedas PC, PP, PE, PO, PPT */}
              <div className="coin-strip">
                {COIN_KEYS.map((c) => (
                  <label key={c.key} className="coin-box">
                    <span>{c.label}</span>
                    <input
                      type="number"
                      min={0}
                      value={sheet.coins[c.key]}
                      onChange={(e) =>
                        void patchSheet({
                          coins: {
                            ...sheet.coins,
                            [c.key]: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>

              <textarea
                rows={2}
                value={sheet.equipment || ''}
                placeholder="Equipamiento..."
                onChange={(e) => void patchSheet({ equipment: e.target.value })}
              />
              <textarea
                rows={2}
                value={sheet.inventory || ''}
                placeholder="Inventario de mochila..."
                onChange={(e) => void patchSheet({ inventory: e.target.value })}
              />
            </section>
          </div>

          {/* Personalidad, Creencias y Defectos */}
          <div className="two-col">
            <section className="panel stack" style={{ gap: 10 }}>
              <h2 className="section-title section-header-rule">
                Personalidad, Ideales y Lazos
              </h2>
              <textarea
                rows={2}
                value={sheet.personalityTraits || ''}
                placeholder="Rasgos de personalidad..."
                onChange={(e) =>
                  void patchSheet({ personalityTraits: e.target.value })
                }
              />
              <textarea
                rows={2}
                value={sheet.ideals || ''}
                placeholder="Ideales..."
                onChange={(e) => void patchSheet({ ideals: e.target.value })}
              />
              <textarea
                rows={2}
                value={sheet.bonds || ''}
                placeholder="Lazos..."
                onChange={(e) => void patchSheet({ bonds: e.target.value })}
              />
            </section>

            <section className="panel stack" style={{ gap: 10 }}>
              <h2 className="section-title section-header-rule">
                Creencias y Defectos
              </h2>
              {sheet.beliefs.map((b, idx) => (
                <label key={idx} className="belief-card">
                  <input
                    type="checkbox"
                    checked={b.markedThisSession}
                    onChange={() => {
                      const next = sheet.beliefs.map((item, i) =>
                        i === idx
                          ? { ...item, markedThisSession: !item.markedThisSession }
                          : item,
                      );
                      void patchSheet({ beliefs: next });
                    }}
                  />
                  <span>{b.text}</span>
                </label>
              ))}
              {sheet.flaws.map((f, idx) => (
                <div key={idx} className="flaw-card">
                  {f}
                </div>
              ))}
            </section>
          </div>
        </div>
      )}

      {/* === PÁGINA 2: TRASFONDO, APARIENCIA Y MILONGA === */}
      {sheetPage === 'backstory' && (
        <div key="page-backstory" className="view-stage">
          <SheetBackstoryPage
            sheet={sheet}
            availableImages={view.availableImages}
            onPatchSheet={patchSheet}
          />
        </div>
      )}

      {/* === PÁGINA 3: GRIMORIO, CONJUROS Y AURA === */}
      {sheetPage === 'spells' && (
        <div key="page-spells" className="view-stage">
          <SheetSpellsPage sheet={sheet} onPatchSheet={patchSheet} />
        </div>
      )}
    </div>
  );
};
