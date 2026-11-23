import React from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import type {
  ThyreniaCharacterSheet,
  ThyreniaSpellEntry,
  ThyreniaSpellLevel,
} from '../../types';
import { abilityMod, formatSigned } from '../../lib/sheet-utils';

interface SheetSpellsPageProps {
  sheet: ThyreniaCharacterSheet;
  onPatchSheet: (patch: Partial<ThyreniaCharacterSheet>) => Promise<void>;
}

const ALL_SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const SheetSpellsPage: React.FC<SheetSpellsPageProps> = ({
  sheet,
  onPatchSheet,
}) => {
  const sc = sheet.spellcasting;
  const castMod = abilityMod(sheet.abilities[sc.castingAbility || 'cha']);
  const spellSaveDc = 8 + sheet.proficiencyBonus + castMod;
  const spellAttackBonus = sheet.proficiencyBonus + castMod;

  const levelMap = new Map<number, ThyreniaSpellLevel>(
    (sc.levels || []).map((lvl) => [lvl.level, lvl]),
  );

  const upsertLevel = (levelNum: number, nextLevel: ThyreniaSpellLevel) => {
    const nextLevels = ALL_SPELL_LEVELS.map((lvl) => {
      if (lvl === levelNum) return nextLevel;
      return (
        levelMap.get(lvl) || {
          level: lvl,
          slotsTotal: 0,
          slotsUsed: 0,
          spells: [],
        }
      );
    }).filter((l) => l.slotsTotal > 0 || l.spells.length > 0 || l.level === levelNum);

    void onPatchSheet({
      spellcasting: {
        ...sc,
        levels: nextLevels,
      },
    });
  };

  const getLevel = (lvl: number): ThyreniaSpellLevel =>
    levelMap.get(lvl) || {
      level: lvl,
      slotsTotal: 0,
      slotsUsed: 0,
      spells: [],
    };

  const addSpell = (lvl: number) => {
    const cur = getLevel(lvl);
    const blank: ThyreniaSpellEntry = {
      name: '',
      prepared: lvl === 0,
      castTime: '1 acción',
      damageOrEffect: '',
      ritual: false,
      concentration: false,
    };
    upsertLevel(lvl, { ...cur, spells: [...cur.spells, blank] });
  };

  return (
    <div className="stack-lg">
      {/* Cabecera mágica + Puntos de Aura */}
      <section className="panel stack" style={{ gap: 14 }}>
        <div className="row-between section-header-rule">
          <h2 className="section-title">
            <Sparkles size={16} /> Grimorio y Conjuración
          </h2>
          <span className="overline">PR Preparado · R Ritual · C Concentración</span>
        </div>

        <div className="spell-header-grid">
          <label className="stack" style={{ gap: 4 }}>
            <span className="muted" style={{ fontSize: '0.74rem' }}>
              Clase Lanzadora
            </span>
            <input
              value={sc.castingClass || ''}
              placeholder={sheet.class}
              onChange={(e) =>
                void onPatchSheet({
                  spellcasting: { ...sc, castingClass: e.target.value },
                })
              }
            />
          </label>

          <label className="stack" style={{ gap: 4 }}>
            <span className="muted" style={{ fontSize: '0.74rem' }}>
              Característica
            </span>
            <select
              value={sc.castingAbility || 'cha'}
              onChange={(e) =>
                void onPatchSheet({
                  spellcasting: {
                    ...sc,
                    castingAbility: e.target.value as 'int' | 'wis' | 'cha',
                  },
                })
              }
            >
              <option value="int">Inteligencia (INT)</option>
              <option value="wis">Sabiduría (SAB)</option>
              <option value="cha">Carisma (CAR)</option>
            </select>
          </label>

          <div className="spell-metric-box">
            <span className="muted" style={{ fontSize: '0.72rem' }}>
              CD Salvación
            </span>
            <strong>{spellSaveDc}</strong>
          </div>

          <div className="spell-metric-box">
            <span className="muted" style={{ fontSize: '0.72rem' }}>
              Ataque Conjuros
            </span>
            <strong>{formatSigned(spellAttackBonus)}</strong>
          </div>

          <div className="spell-metric-box">
            <span className="muted" style={{ fontSize: '0.72rem' }}>
              Puntos de Aura
            </span>
            <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
              <button
                type="button"
                className="mini-step-btn"
                aria-label="Restar 1 Aura"
                onClick={() =>
                  void onPatchSheet({
                    auraPoints: {
                      ...sheet.auraPoints,
                      current: Math.max(0, sheet.auraPoints.current - 1),
                    },
                  })
                }
              >
                −
              </button>
              <strong>
                {sheet.auraPoints.current}/{sheet.auraPoints.max}
              </strong>
              <button
                type="button"
                className="mini-step-btn"
                aria-label="Sumar 1 Aura"
                onClick={() =>
                  void onPatchSheet({
                    auraPoints: {
                      ...sheet.auraPoints,
                      current: Math.min(
                        Math.max(sheet.auraPoints.max, sheet.auraPoints.current + 1),
                        sheet.auraPoints.current + 1,
                      ),
                    },
                  })
                }
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trucos (0) y Niveles 1-9 */}
      <div className="spell-levels-grid">
        {ALL_SPELL_LEVELS.map((lvlNum) => {
          const data = getLevel(lvlNum);
          const title = lvlNum === 0 ? 'Trucos' : `Nivel ${lvlNum}`;
          return (
            <section key={lvlNum} className="panel stack" style={{ gap: 10 }}>
              <div className="row-between section-header-rule">
                <strong
                  style={{
                    fontFamily: 'var(--display-font)',
                    color: 'var(--text-strong)',
                    fontSize: '0.96rem',
                  }}
                >
                  {title}
                </strong>
                <div className="row" style={{ gap: 8 }}>
                  {lvlNum > 0 && (
                    <div className="row" style={{ gap: 6 }}>
                      <span className="muted" style={{ fontSize: '0.72rem' }}>
                        Slots
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={9}
                        aria-label={`Slots totales ${title}`}
                        value={data.slotsTotal}
                        style={{ width: 52, padding: '3px 6px', fontSize: '0.78rem' }}
                        onChange={(e) => {
                          const total = Math.max(0, Math.min(9, Number(e.target.value) || 0));
                          upsertLevel(lvlNum, {
                            ...data,
                            slotsTotal: total,
                            slotsUsed: Math.min(data.slotsUsed, total),
                          });
                        }}
                      />
                      {data.slotsTotal > 0 && (
                        <div className="seal-pips" title="Espacios usados">
                          {Array.from({ length: data.slotsTotal }).map((_, idx) => {
                            const used = idx < data.slotsUsed;
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`seal-pip-btn${used ? ' active' : ''}`}
                                aria-label={`${title} slot ${idx + 1}`}
                                onClick={() =>
                                  upsertLevel(lvlNum, {
                                    ...data,
                                    slotsUsed:
                                      data.slotsUsed === idx + 1 ? idx : idx + 1,
                                  })
                                }
                              >
                                {used ? '●' : '○'}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => addSpell(lvlNum)}
                  >
                    <Plus size={13} /> Conjuro
                  </button>
                </div>
              </div>

              {data.spells.length === 0 ? (
                <div className="muted" style={{ fontSize: '0.78rem' }}>
                  Sin conjuros anotados en {title}.
                </div>
              ) : (
                <div className="stack" style={{ gap: 6 }}>
                  {data.spells.map((sp, spIdx) => (
                    <div key={spIdx} className="spell-row-card">
                      {lvlNum > 0 && (
                        <input
                          type="checkbox"
                          title="Preparado (PR)"
                          checked={sp.prepared}
                          onChange={() => {
                            const nextSpells = data.spells.map((item, i) =>
                              i === spIdx ? { ...item, prepared: !item.prepared } : item,
                            );
                            upsertLevel(lvlNum, { ...data, spells: nextSpells });
                          }}
                        />
                      )}
                      <input
                        value={sp.name}
                        placeholder="Nombre del conjuro"
                        style={{ flex: '1.3 1 130px' }}
                        onChange={(e) => {
                          const nextSpells = data.spells.map((item, i) =>
                            i === spIdx ? { ...item, name: e.target.value } : item,
                          );
                          upsertLevel(lvlNum, { ...data, spells: nextSpells });
                        }}
                      />
                      <input
                        value={sp.castTime}
                        placeholder="Tiempo"
                        style={{ flex: '0.8 1 82px' }}
                        onChange={(e) => {
                          const nextSpells = data.spells.map((item, i) =>
                            i === spIdx ? { ...item, castTime: e.target.value } : item,
                          );
                          upsertLevel(lvlNum, { ...data, spells: nextSpells });
                        }}
                      />
                      <input
                        value={sp.damageOrEffect}
                        placeholder="Daño / Efecto"
                        style={{ flex: '1.2 1 120px' }}
                        onChange={(e) => {
                          const nextSpells = data.spells.map((item, i) =>
                            i === spIdx
                              ? { ...item, damageOrEffect: e.target.value }
                              : item,
                          );
                          upsertLevel(lvlNum, { ...data, spells: nextSpells });
                        }}
                      />
                      <label className="row" style={{ gap: 3, fontSize: '0.72rem' }} title="Ritual">
                        <input
                          type="checkbox"
                          checked={sp.ritual}
                          onChange={() => {
                            const nextSpells = data.spells.map((item, i) =>
                              i === spIdx ? { ...item, ritual: !item.ritual } : item,
                            );
                            upsertLevel(lvlNum, { ...data, spells: nextSpells });
                          }}
                        />
                        R
                      </label>
                      <label
                        className="row"
                        style={{ gap: 3, fontSize: '0.72rem' }}
                        title="Concentración"
                      >
                        <input
                          type="checkbox"
                          checked={sp.concentration}
                          onChange={() => {
                            const nextSpells = data.spells.map((item, i) =>
                              i === spIdx
                                ? { ...item, concentration: !item.concentration }
                                : item,
                            );
                            upsertLevel(lvlNum, { ...data, spells: nextSpells });
                          }}
                        />
                        C
                      </label>
                      <button
                        type="button"
                        className="btn-ghost btn-icon"
                        style={{ width: 28, height: 28 }}
                        aria-label="Eliminar conjuro"
                        onClick={() => {
                          const nextSpells = data.spells.filter((_, i) => i !== spIdx);
                          upsertLevel(lvlNum, { ...data, spells: nextSpells });
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
