import React from 'react';
import type { ThyreniaCharacterSheet } from '../../types';

interface SheetBackstoryPageProps {
  sheet: ThyreniaCharacterSheet;
  availableImages: string[];
  onPatchSheet: (patch: Partial<ThyreniaCharacterSheet>) => Promise<void>;
}

export const SheetBackstoryPage: React.FC<SheetBackstoryPageProps> = ({
  sheet,
  availableImages,
  onPatchSheet,
}) => {
  const ap = sheet.appearance;

  const updateAppearance = (patch: Partial<typeof ap>) =>
    void onPatchSheet({ appearance: { ...ap, ...patch } });

  return (
    <div className="stack-lg">
      <div className="two-col">
        {/* Apariencia física y retrato */}
        <section className="panel stack" style={{ gap: 14 }}>
          <div className="row-between section-header-rule">
            <h2 className="section-title">Apariencia del Personaje</h2>
            <span className="overline">Rasgos físicos</span>
          </div>

          <div className="sheet-physical-grid">
            {(
              [
                ['age', 'Edad'],
                ['height', 'Altura'],
                ['weight', 'Peso'],
                ['eyes', 'Ojos'],
                ['skin', 'Piel'],
                ['hair', 'Cabello'],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="stack" style={{ gap: 4 }}>
                <span className="muted" style={{ fontSize: '0.74rem' }}>
                  {label}
                </span>
                <input
                  value={ap[field] || ''}
                  placeholder="—"
                  onChange={(e) => updateAppearance({ [field]: e.target.value })}
                />
              </label>
            ))}
          </div>

          <label className="stack" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: '0.76rem' }}>
              Imagen de retrato (Vault)
            </span>
            <select
              value={ap.portraitImage || ''}
              onChange={(e) => updateAppearance({ portraitImage: e.target.value })}
            >
              <option value="">Sin retrato asignado</option>
              {availableImages.map((img) => (
                <option key={img} value={img}>
                  {img}
                </option>
              ))}
            </select>
          </label>

          {ap.portraitImage && (
            <div className="sheet-portrait-preview">
              <img
                src={`/api/vault/media?file=${encodeURIComponent(ap.portraitImage)}`}
                alt={`Retrato de ${sheet.name}`}
              />
            </div>
          )}
        </section>

        {/* Aliados, Organizaciones y Símbolo */}
        <section className="panel stack" style={{ gap: 14 }}>
          <div className="row-between section-header-rule">
            <h2 className="section-title">Aliados, Organizaciones y Símbolo</h2>
          </div>

          <label className="stack" style={{ gap: 4 }}>
            <span className="muted" style={{ fontSize: '0.76rem' }}>
              Nombre del símbolo o emblema
            </span>
            <input
              value={ap.symbolName || ''}
              placeholder="Ej. Sello de Lamú"
              onChange={(e) => updateAppearance({ symbolName: e.target.value })}
            />
          </label>

          <label className="stack" style={{ gap: 4 }}>
            <span className="muted" style={{ fontSize: '0.76rem' }}>
              Descripción o insignia de facción
            </span>
            <textarea
              rows={2}
              value={ap.symbolDescription || ''}
              placeholder="Blasón, estandarte o marca personal..."
              onChange={(e) =>
                updateAppearance({ symbolDescription: e.target.value })
              }
            />
          </label>

          <label className="stack" style={{ gap: 4 }}>
            <span className="muted" style={{ fontSize: '0.76rem' }}>
              Aliados y Organizaciones
            </span>
            <textarea
              rows={4}
              value={sheet.alliesAndOrganizations || ''}
              placeholder="Gremios, órdenes, camaradas y contactos..."
              onChange={(e) =>
                void onPatchSheet({ alliesAndOrganizations: e.target.value })
              }
            />
          </label>
        </section>
      </div>

      {/* Milonga (Historia y Trasfondo) */}
      <section className="panel stack" style={{ gap: 12 }}>
        <div className="row-between section-header-rule">
          <h2 className="section-title">Milonga</h2>
          <span className="overline">Historia y Crónica Personal</span>
        </div>
        <textarea
          rows={6}
          value={sheet.milonga || ''}
          placeholder="Relata la historia de origen, juramentos y sucesos pasados del personaje..."
          onChange={(e) => void onPatchSheet({ milonga: e.target.value })}
        />
      </section>

      <div className="two-col">
        <section className="panel stack" style={{ gap: 10 }}>
          <h2 className="section-title section-header-rule">
            Características y Rasgos Adicionales
          </h2>
          <textarea
            rows={4}
            value={sheet.additionalFeatures || ''}
            placeholder="Bendiciones, maldiciones, dotes o rasgos secundarios..."
            onChange={(e) =>
              void onPatchSheet({ additionalFeatures: e.target.value })
            }
          />
        </section>

        <section className="panel stack" style={{ gap: 10 }}>
          <h2 className="section-title section-header-rule">Tesoro</h2>
          <textarea
            rows={4}
            value={sheet.treasure || ''}
            placeholder="Reliquias, objetos mágicos, escrituras o gemas..."
            onChange={(e) => void onPatchSheet({ treasure: e.target.value })}
          />
        </section>
      </div>
    </div>
  );
};
