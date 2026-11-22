import React, { useMemo } from 'react';
import { Compass, MapPin } from 'lucide-react';
import type {
  ApiViewPayload,
  LiveRollEntry,
  PlotTimelineEntry,
} from '../types';
import { capitalize, humanizeSceneTitle } from '../lib/markdown';
import { PlotTimelineSection } from './campaign/PlotTimelineSection';
import { QuestBoardSection } from './campaign/QuestBoardSection';
import { QuickRollerAndLogSection } from './campaign/QuickRollerAndLogSection';

interface CampaignViewProps {
  view: ApiViewPayload;
  isGm: boolean;
  gmKey: string;
  liveRolls: LiveRollEntry[];
  onRecordRoll: (skillLabel: string, bonus: number) => void;
  onRefresh: () => Promise<void>;
  onOpenNode: (nodeId: string) => void;
  onOpenSession: (entry: PlotTimelineEntry) => void;
  onOpenAtlasGeo: () => void;
  onShowToast: (msg: string) => void;
  astralOpen: boolean;
  astralMonthIndex: number | null;
  onToggleAstral: (open: boolean, monthIdx?: number | null) => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  view,
  isGm,
  gmKey,
  liveRolls,
  onRecordRoll,
  onRefresh,
  onOpenNode,
  onOpenSession,
  onOpenAtlasGeo,
  onShowToast,
  astralOpen,
  astralMonthIndex,
  onToggleAstral,
}) => {
  const tl = view.plotTimeline;
  const currentLocation =
    view.partyPosition?.label || view.sceneState.locationNodeId;

  const hasHeroArt = view.availableImages.some(
    (img) => img.toLowerCase() === 'image2.png' || img.toLowerCase() === 'image1.jpg',
  );
  const heroImg = view.availableImages.some((i) => i.toLowerCase() === 'image2.png')
    ? 'image2.png'
    : 'image1.jpg';

  const visibleMap = useMemo(
    () => new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n])),
    [view.visibleNodes],
  );

  return (
    <div className="stack-lg">
      {/* 1. Cabecera Unificada: Campaña + Escena en Curso (sin duplicados) */}
      <section className="hero-split">
        <div className="stack" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 6 }}>
            <span className="badge">
              {view.character.name} · {capitalize(view.character.race)}{' '}
              {capitalize(view.character.class)}
            </span>
            <span className="badge">{view.calendarDate.formatted}</span>
            <button
              type="button"
              className="badge badge-prog"
              onClick={onOpenAtlasGeo}
              title="Abrir en el Atlas"
            >
              <MapPin size={12} /> {currentLocation}
            </button>
            {view.sceneState.activeThreats.length > 0 && (
              <span className="badge badge-danger">
                Amenazas: {view.sceneState.activeThreats.join(', ')}
              </span>
            )}
          </div>

          <div className="overline">{view.activeCampaign.name}</div>
          <h1 className="hero-heading">
            {humanizeSceneTitle(view.sceneState.id, currentLocation)}
          </h1>

          <p
            style={{
              margin: 0,
              fontFamily: 'var(--reader-font)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
            }}
          >
            {view.sceneState.description}
          </p>

          <div className="row" style={{ marginTop: 2 }}>
            <button type="button" className="btn-primary" onClick={onOpenAtlasGeo}>
              <Compass size={15} /> Ver en Mapa
            </button>
            <button
              type="button"
              onClick={() =>
                onToggleAstral(true, tl.nextCosmicEvent.festival.monthIndex)
              }
            >
              {tl.nextCosmicEvent.festival.name} en {tl.nextCosmicEvent.daysUntil}d
            </button>
          </div>
        </div>

        {hasHeroArt && (
          <div className="hero-art-frame">
            <img
              src={`/api/vault/media?file=${encodeURIComponent(heroImg)}`}
              alt="Ilustración de Thyrenia"
            />
          </div>
        )}
      </section>

      {/* 2. Hilo de la Trama */}
      <PlotTimelineSection
        view={view}
        astralOpen={astralOpen}
        astralMonthIndex={astralMonthIndex}
        onToggleAstral={onToggleAstral}
        onOpenSession={onOpenSession}
      />

      {/* 3. Misiones (izq) y Tirador 1d20 + Bitácora (der) */}
      <div className="campaign-grid">
        <QuestBoardSection
          view={view}
          isGm={isGm}
          gmKey={gmKey}
          visibleMap={visibleMap}
          onRefresh={onRefresh}
          onOpenNode={onOpenNode}
          onShowToast={onShowToast}
        />

        <QuickRollerAndLogSection
          view={view}
          isGm={isGm}
          gmKey={gmKey}
          liveRolls={liveRolls}
          onRecordRoll={onRecordRoll}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
};
