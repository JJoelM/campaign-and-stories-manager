import React, { useMemo, useState } from 'react';
import { Compass, Network, Users } from 'lucide-react';
import type { ApiViewPayload, GmOverviewPayload } from '../types';
import { AtlasGeoMapSubView } from './atlas/AtlasGeoMapSubView';
import { AtlasRelationsSubView } from './atlas/AtlasRelationsSubView';
import { AtlasConstellationSubView } from './atlas/AtlasConstellationSubView';

interface AtlasViewProps {
  view: ApiViewPayload;
  gmOverview: GmOverviewPayload | null;
  isGm: boolean;
  gmKey: string;
  selectedNodeId: string | null;
  onRefresh: () => Promise<void>;
  onOpenNode: (nodeId: string) => void;
  onShowToast: (msg: string) => void;
}

export const AtlasView: React.FC<AtlasViewProps> = ({
  view,
  gmOverview,
  isGm,
  gmKey,
  selectedNodeId,
  onRefresh,
  onOpenNode,
  onShowToast,
}) => {
  const [subMode, setSubMode] = useState<'geo' | 'relations' | 'constellation'>(
    'geo',
  );

  const visibleMap = useMemo(
    () => new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n])),
    [view.visibleNodes],
  );

  return (
    <div className="stack">
      <div className="atlas-toolbar">
        <div className="segmented-tabs">
          <button
            type="button"
            className={`segmented-tab${subMode === 'geo' ? ' active' : ''}`}
            onClick={() => setSubMode('geo')}
          >
            <Compass size={14} /> Mapa
          </button>
          <button
            type="button"
            className={`segmented-tab${subMode === 'relations' ? ' active' : ''}`}
            onClick={() => setSubMode('relations')}
          >
            <Users size={14} /> Relaciones
          </button>
          <button
            type="button"
            className={`segmented-tab${subMode === 'constellation' ? ' active' : ''}`}
            onClick={() => setSubMode('constellation')}
          >
            <Network size={14} /> Constelación
          </button>
        </div>
      </div>

      {subMode === 'geo' && (
        <AtlasGeoMapSubView
          view={view}
          gmOverview={gmOverview}
          visibleMap={visibleMap}
          isGm={isGm}
          gmKey={gmKey}
          onRefresh={onRefresh}
          onOpenNode={onOpenNode}
          onShowToast={onShowToast}
        />
      )}

      {subMode === 'relations' && (
        <AtlasRelationsSubView
          view={view}
          visibleMap={visibleMap}
          isGm={isGm}
          gmKey={gmKey}
          onRefresh={onRefresh}
          onOpenNode={onOpenNode}
          onShowToast={onShowToast}
        />
      )}

      {subMode === 'constellation' && (
        <AtlasConstellationSubView
          view={view}
          visibleMap={visibleMap}
          selectedNodeId={selectedNodeId}
          onOpenNode={onOpenNode}
        />
      )}
    </div>
  );
};
