import React, { useEffect, useState } from 'react';
import { Download, MoreHorizontal, PenLine, Shield } from 'lucide-react';
import type { ApiViewPayload } from '../types';
import { downloadAuthenticatedFile } from '../lib/api';
import { usePopoverDismiss } from '../lib/usePopoverDismiss';
import { CharacterVttSheetTab } from './sheet/CharacterVttSheetTab';
import {
  PlayerNotesComposerTab,
  type StoryPrefill,
} from './sheet/PlayerNotesComposerTab';

export type { StoryPrefill };

interface SheetViewProps {
  view: ApiViewPayload;
  gmKey: string;
  prefill: StoryPrefill | null;
  onClearPrefill: () => void;
  onRecordRoll: (skillLabel: string, bonus: number) => void;
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const SheetView: React.FC<SheetViewProps> = ({
  view,
  gmKey,
  prefill,
  onClearPrefill,
  onRecordRoll,
  onRefresh,
  onShowToast,
}) => {
  const sheet = view.characterSheet;
  const [subTab, setSubTab] = useState<'sheet' | 'notes'>('sheet');
  const [menuOpen, setMenuOpen] = useState(false);

  usePopoverDismiss(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    if (prefill) {
      setSubTab(prefill.subTab || 'notes');
    }
  }, [prefill]);

  return (
    <div className="stack-lg">
      <div className="row-between sheet-topbar-row">
        <div className="segmented-tabs" role="tablist" aria-label="Vista de ficha">
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'sheet'}
            className={`segmented-tab${subTab === 'sheet' ? ' active' : ''}`}
            onClick={() => setSubTab('sheet')}
          >
            <Shield size={14} /> Hoja de PJ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'notes'}
            className={`segmented-tab${subTab === 'notes' ? ' active' : ''}`}
            onClick={() => setSubTab('notes')}
          >
            <PenLine size={14} /> Notas y Crónicas
          </button>
        </div>

        <div className="menu-wrap">
          <button
            type="button"
            className="btn-ghost btn-icon"
            title="Opciones de ficha"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="menu-popover">
              <button
                type="button"
                className="menu-item"
                onClick={async () => {
                  setMenuOpen(false);
                  try {
                    await downloadAuthenticatedFile(
                      `/api/character/foundry-export?characterId=${encodeURIComponent(sheet.characterId)}&download=1`,
                      `${sheet.name.replace(/\s+/g, '_')}_FoundryActor.json`,
                      gmKey,
                    );
                    onShowToast('Actor JSON de FoundryVTT descargado.');
                  } catch (err) {
                    onShowToast(
                      err instanceof Error ? err.message : 'Error al exportar',
                    );
                  }
                }}
              >
                <Download size={14} /> Exportar Actor FoundryVTT (.json)
              </button>
            </div>
          )}
        </div>
      </div>

      <div key={subTab} className="view-stage">
        {subTab === 'sheet' ? (
          <CharacterVttSheetTab
            view={view}
            gmKey={gmKey}
            onRecordRoll={onRecordRoll}
            onRefresh={onRefresh}
            onShowToast={onShowToast}
          />
        ) : (
          <PlayerNotesComposerTab
            view={view}
            gmKey={gmKey}
            prefill={prefill}
            onClearPrefill={onClearPrefill}
            onRefresh={onRefresh}
            onShowToast={onShowToast}
          />
        )}
      </div>
    </div>
  );
};
