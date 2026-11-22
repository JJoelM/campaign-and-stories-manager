import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronRight,
  Compass,
  Eye,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Landmark,
  Lock,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  ApiViewPayload,
  AtlasMapViewLevel,
  CampaignMapPin,
  GmOverviewPayload,
  LoreNode,
  MapPinFogState,
  MapPinKind,
} from '../../types';
import { apiRequest } from '../../lib/api';
import { extractCleanExcerpt } from '../../lib/markdown';

interface AtlasGeoMapSubViewProps {
  view: ApiViewPayload;
  gmOverview: GmOverviewPayload | null;
  visibleMap: Map<string, LoreNode>;
  isGm: boolean;
  gmKey: string;
  onRefresh: () => Promise<void>;
  onOpenNode: (nodeId: string) => void;
  onShowToast: (msg: string) => void;
}

function renderPinGlyph(pin: CampaignMapPin): React.ReactNode {
  if (pin.fogState === 'rumor') return <HelpCircle size={14} />;
  if (pin.fogState === 'secret') return <Eye size={14} />;
  switch (pin.pinKind) {
    case 'continent':
      return <Compass size={14} />;
    case 'city':
      return <Building2 size={14} />;
    case 'temple':
      return <Sparkles size={14} />;
    case 'danger':
      return <AlertTriangle size={14} />;
    case 'dungeon_ruin':
      return <Landmark size={14} />;
    default:
      return <MapPin size={14} />;
  }
}

export const AtlasGeoMapSubView: React.FC<AtlasGeoMapSubViewProps> = ({
  view,
  gmOverview,
  visibleMap,
  isGm,
  gmKey,
  onRefresh,
  onOpenNode,
  onShowToast,
}) => {
  const [currentMapId, setCurrentMapId] = useState<string>('world-thyrenia');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    origX: number;
    origY: number;
  } | null>(null);
  const didDragRef = useRef(false);
  const [selectedPin, setSelectedPin] = useState<CampaignMapPin | 'party' | null>(null);
  const [gmClickMode, setGmClickMode] = useState<'none' | 'pin' | 'party'>('none');
  const [pinDraft, setPinDraft] = useState<{
    id: string;
    label: string;
    x: number;
    y: number;
    pinKind: MapPinKind;
    fogState: MapPinFogState;
    linkedNodeId: string;
    rumorTeaser: string;
  } | null>(null);

  const atlasMapById = useMemo(() => {
    const map = new Map<string, AtlasMapViewLevel>();
    for (const lvl of view.atlasMaps || []) {
      map.set(lvl.id, lvl);
    }
    return map;
  }, [view.atlasMaps]);

  const currentMap: AtlasMapViewLevel = useMemo(() => {
    const found = atlasMapById.get(currentMapId);
    if (found && (found.isUnlocked || isGm)) return found;
    return (
      atlasMapById.get('world-thyrenia') || {
        id: 'world-thyrenia',
        name: 'Planisferio de Thyrenia',
        scale: 'world',
        subtitle: 'Mapa global de Thyrenia',
        imageFile: 'image1.jpg',
        fogLayer: 'base',
        isUnlocked: true,
        roads: [],
        pins: view.mapPins || [],
      }
    );
  }, [atlasMapById, currentMapId, isGm, view.mapPins]);

  const breadcrumbTrail = useMemo(() => {
    const trail: AtlasMapViewLevel[] = [];
    let cursor: AtlasMapViewLevel | undefined = currentMap;
    let guard = 0;
    while (cursor && guard < 6) {
      trail.unshift(cursor);
      cursor = cursor.parentMapId ? atlasMapById.get(cursor.parentMapId) : undefined;
      guard++;
    }
    return trail;
  }, [currentMap, atlasMapById]);

  const pins = useMemo(() => {
    if (currentMap.id === 'world-thyrenia' && isGm && gmOverview?.allMapPins) {
      return gmOverview.allMapPins.filter(
        (p) => !p.mapId || p.mapId === 'world-thyrenia',
      );
    }
    return currentMap.pins || [];
  }, [currentMap, isGm, gmOverview]);

  const clampPan = (x: number, y: number, scale: number) => {
    const limit = Math.max(0, (scale - 1) * 260);
    return {
      x: Math.max(-limit, Math.min(limit, x)),
      y: Math.max(-limit, Math.min(limit, y)),
    };
  };

  const changeZoom = (delta: number) => {
    setZoom((z) => {
      const next = Math.max(1, Math.min(2.25, Number((z + delta).toFixed(2))));
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
      } else {
        setPan((p) => clampPan(p.x, p.y, next));
      }
      return next;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const navigateToMap = (targetMapId: string) => {
    const target = atlasMapById.get(targetMapId);
    if (!target) return;
    if (!target.isUnlocked && !isGm) {
      onShowToast(
        target.lockReason ||
          'Este mapa detallado está oculto por la Niebla de Guerra Estratificada.',
      );
      return;
    }
    setCurrentMapId(target.id);
    setSelectedPin(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const partyOffset = useMemo(() => {
    const pp = view.partyPosition;
    if (!pp) return { x: 50, y: 50 };
    const collides = pins.some(
      (p) => Math.hypot(p.x - pp.x, p.y - pp.y) < 3.5,
    );
    return collides
      ? { x: Math.min(96, pp.x + 3.2), y: Math.max(4, pp.y - 3.6) }
      : { x: pp.x, y: pp.y };
  }, [pins, view.partyPosition]);

  const handleMapClick = async (evt: React.MouseEvent<HTMLElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (!isGm || gmClickMode === 'none') return;
    const rect = evt.currentTarget.getBoundingClientRect();
    const x = Number((((evt.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = Number((((evt.clientY - rect.top) / rect.height) * 100).toFixed(1));
    if (gmClickMode === 'party') {
      const label =
        window.prompt(
          'Ubicación actual del Grupo:',
          view.partyPosition?.label || view.sceneState.locationNodeId,
        ) || view.sceneState.locationNodeId;
      await apiRequest(
        '/api/gm/map/party-position',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: view.activeCampaign.id, label, x, y }),
        },
        gmKey,
      );
      setGmClickMode('none');
      onShowToast(`Posición del Grupo movida a ${label}.`);
      await onRefresh();
      return;
    }
    setPinDraft({
      id: '',
      label: '',
      x,
      y,
      pinKind: currentMap.scale === 'city' ? 'landmark' : 'city',
      fogState: 'discovered',
      linkedNodeId: '',
      rumorTeaser: '',
    });
  };

  const handleSavePin = async () => {
    if (!pinDraft || !pinDraft.label.trim()) return;
    await apiRequest(
      '/api/gm/map/pin',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: view.activeCampaign.id,
          mapId: currentMap.id,
          id: pinDraft.id || undefined,
          label: pinDraft.label.trim(),
          x: pinDraft.x,
          y: pinDraft.y,
          pinKind: pinDraft.pinKind,
          fogState: pinDraft.fogState,
          linkedNodeId: pinDraft.linkedNodeId.trim() || undefined,
          rumorTeaser: pinDraft.rumorTeaser.trim() || undefined,
        }),
      },
      gmKey,
    );
    setPinDraft(null);
    setGmClickMode('none');
    await onRefresh();
  };

  return (
    <div className="stack">
      {/* Barra compacta unificada de navegación, zoom y herramientas GM */}
      <div className="row-between">
        <div className="row" style={{ gap: 6 }}>
          {currentMap.parentMapId && (
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              onClick={() => navigateToMap(currentMap.parentMapId!)}
            >
              <ArrowLeft size={14} /> Volver
            </button>
          )}
          <nav className="atlas-breadcrumb" aria-label="Nivel del Atlas">
            {breadcrumbTrail.map((lvl, idx) => (
              <React.Fragment key={lvl.id}>
                {idx > 0 && <ChevronRight size={13} className="muted" />}
                <button
                  type="button"
                  className={`atlas-crumb-btn${lvl.id === currentMap.id ? ' active' : ''}`}
                  onClick={() => navigateToMap(lvl.id)}
                >
                  {lvl.scale === 'world' ? (
                    <Globe size={12} />
                  ) : lvl.scale === 'continent' ? (
                    <Compass size={12} />
                  ) : (
                    <MapPin size={12} />
                  )}
                  <span>{lvl.name}</span>
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className="btn-icon"
            aria-label="Alejar mapa"
            disabled={zoom <= 1}
            onClick={() => changeZoom(-0.25)}
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.78rem', minWidth: 48, padding: '4px 6px' }}
            title="Restablecer zoom (100%)"
            onClick={resetZoom}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="btn-icon"
            aria-label="Acercar mapa"
            disabled={zoom >= 2.25}
            onClick={() => changeZoom(0.25)}
          >
            <ZoomIn size={15} />
          </button>

          {isGm && (
            <>
              <button
                type="button"
                className={gmClickMode === 'pin' ? 'btn-primary' : 'btn-gm'}
                style={{ fontSize: '0.76rem', padding: '5px 9px' }}
                onClick={() =>
                  setGmClickMode((m) => (m === 'pin' ? 'none' : 'pin'))
                }
              >
                <Plus size={13} /> Pin
              </button>
              <button
                type="button"
                className={gmClickMode === 'party' ? 'btn-primary' : 'btn-gm'}
                style={{ fontSize: '0.76rem', padding: '5px 9px' }}
                onClick={() =>
                  setGmClickMode((m) => (m === 'party' ? 'none' : 'party'))
                }
              >
                <MapPin size={13} /> Grupo
              </button>
              <label
                className="row"
                style={{ fontSize: '0.76rem', color: 'var(--muted)' }}
                title="Imagen de fondo del nivel actual"
              >
                <ImageIcon size={13} />
                <select
                  aria-label="Imagen de este nivel del Atlas"
                  value={currentMap.imageFile || ''}
                  style={{ padding: '4px 7px', fontSize: '0.76rem' }}
                  onChange={async (e) => {
                    await apiRequest(
                      '/api/gm/map/level-image',
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          campaignId: view.activeCampaign.id,
                          mapId: currentMap.id,
                          imageFile: e.target.value,
                        }),
                      },
                      gmKey,
                    );
                    onShowToast(`Mapa actualizado para ${currentMap.name}.`);
                    await onRefresh();
                  }}
                >
                  <option value="">Plano SVG</option>
                  {view.availableImages.map((img) => (
                    <option key={img} value={img}>
                      {img}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </div>

      {isGm && gmClickMode !== 'none' && (
        <div
          className="badge badge-gold"
          style={{ padding: '5px 10px', width: 'fit-content' }}
        >
          {gmClickMode === 'pin'
            ? `Haz clic en ${currentMap.name} para colocar un pin.`
            : 'Haz clic donde se encuentra el Grupo.'}
        </div>
      )}

      {/* Marco del mapa con cartela cartográfica e inspector anclado */}
      <div
        className={`map-frame${zoom > 1 && gmClickMode === 'none' ? ' can-pan' : ''}${
          isPanning ? ' is-panning' : ''
        }`}
        onMouseDown={(e) => {
          if (zoom <= 1 || gmClickMode !== 'none' || e.button !== 0) return;
          const target = e.target as Element | null;
          if (target?.closest('button, .atlas-pin-overlay')) return;
          e.preventDefault();
          didDragRef.current = false;
          setIsPanning(true);
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            origX: pan.x,
            origY: pan.y,
          };
        }}
        onMouseMove={(e) => {
          if (!isPanning || !dragStartRef.current) return;
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            didDragRef.current = true;
          }
          setPan(
            clampPan(
              dragStartRef.current.origX + dx,
              dragStartRef.current.origY + dy,
              zoom,
            ),
          );
        }}
        onMouseUp={() => {
          setIsPanning(false);
          dragStartRef.current = null;
        }}
        onMouseLeave={() => {
          setIsPanning(false);
          dragStartRef.current = null;
        }}
      >
        <div className="map-cartouche">
          <div className="map-cartouche-title">{currentMap.name}</div>
          <div className="map-cartouche-sub">
            {currentMap.scale === 'world'
              ? 'Planisferio Global'
              : currentMap.scale === 'continent'
                ? 'Mapa Continental'
                : 'Plano Urbano'}
          </div>
        </div>
        <div
          className={`map-canvas-inner${isPanning ? ' is-panning' : ''}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <div key={currentMap.id} className="map-level-stage">
          {currentMap.imageFile ? (
            <img
              src={`/api/vault/media?file=${encodeURIComponent(currentMap.imageFile)}`}
              alt={currentMap.name}
              draggable={false}
              style={{
                cursor: isGm && gmClickMode !== 'none' ? 'crosshair' : 'inherit',
              }}
              onClick={handleMapClick}
            />
          ) : (
            <div
              className={`cartographic-svg-stage scale-${currentMap.scale}`}
              style={{
                cursor: isGm && gmClickMode !== 'none' ? 'crosshair' : 'inherit',
              }}
              onClick={handleMapClick}
            >
              <svg
                viewBox="0 0 1000 580"
                className="cartographic-svg"
                aria-label={`Plano cartográfico de ${currentMap.name}`}
              >
                <defs>
                  <pattern
                    id="atlasGrid"
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
                <rect width="1000" height="580" fill="url(#atlasGrid)" />

                {currentMap.scale === 'continent' ? (
                  <path
                    d="M 140 120 Q 320 55 560 95 T 880 180 Q 910 340 810 470 T 430 510 Q 170 480 130 310 Z"
                    fill="var(--bg-elev)"
                    fillOpacity="0.65"
                    stroke="var(--accent)"
                    strokeOpacity="0.35"
                    strokeWidth="2.5"
                  />
                ) : (
                  <path
                    d="M 170 110 L 830 110 L 870 470 L 140 470 Z"
                    fill="var(--bg-elev)"
                    fillOpacity="0.72"
                    stroke="var(--accent)"
                    strokeOpacity="0.4"
                    strokeWidth="3"
                    strokeDasharray="10 6"
                  />
                )}

                {currentMap.roads.map((road, idx) => {
                  const p1 = pins.find((p) => p.id === road.fromPinId);
                  const p2 = pins.find((p) => p.id === road.toPinId);
                  if (!p1 || !p2) return null;
                  const x1 = p1.x * 10;
                  const y1 = p1.y * 5.8;
                  const x2 = p2.x * 10;
                  const y2 = p2.y * 5.8;
                  const mx = (x1 + x2) / 2;
                  const my = (y1 + y2) / 2 - 14;
                  const strokeColor =
                    road.kind === 'royal'
                      ? 'var(--accent)'
                      : road.kind === 'sea'
                        ? 'var(--arcane)'
                        : road.kind === 'secret'
                          ? 'var(--danger)'
                          : 'var(--muted)';
                  return (
                    <g key={idx}>
                      <path
                        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={road.kind === 'royal' ? 3.2 : 2.2}
                        strokeDasharray={
                          road.kind === 'royal' ? undefined : '7 5'
                        }
                        strokeOpacity="0.85"
                      />
                      {road.label && (
                        <text
                          x={mx}
                          y={my - 4}
                          textAnchor="middle"
                          fill="var(--muted)"
                          fontSize="12"
                          fontFamily="var(--ui-font)"
                        >
                          {road.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                <g transform="translate(915, 75)" opacity="0.65">
                  <circle
                    r="30"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.2"
                  />
                  <path d="M 0 -26 L 4 0 L 0 26 L -4 0 Z" fill="var(--accent)" />
                  <path
                    d="M -22 0 L 0 -4 L 22 0 L 0 4 Z"
                    fill="var(--accent)"
                    opacity="0.5"
                  />
                  <text
                    x="0"
                    y="-34"
                    textAnchor="middle"
                    fill="var(--accent)"
                    fontSize="11"
                    fontWeight="700"
                  >
                    N
                  </text>
                </g>

                <text
                  x="36"
                  y="545"
                  fill="var(--accent)"
                  fontSize="18"
                  fontFamily="var(--display-font)"
                  letterSpacing="2"
                  opacity="0.8"
                >
                  {currentMap.name.toUpperCase()}
                </text>
              </svg>
            </div>
          )}

          {pins.map((pin) => {
            const isSel = selectedPin !== 'party' && selectedPin?.id === pin.id;
            const childMap = pin.childMapId
              ? atlasMapById.get(pin.childMapId)
              : undefined;
            const hasUnlockedChild = Boolean(
              childMap && (childMap.isUnlocked || isGm),
            );
            const hasLockedChild = Boolean(
              childMap && !childMap.isUnlocked && !isGm,
            );
            return (
              <button
                key={pin.id}
                type="button"
                aria-label={pin.label}
                className={`map-icon-pin${
                  pin.fogState === 'rumor'
                    ? ' rumor'
                    : pin.fogState === 'secret'
                      ? ' secret'
                      : ''
                }${hasUnlockedChild ? ' has-submap' : ''}${isSel ? ' selected' : ''}`}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isGm && gmClickMode === 'pin') {
                    setPinDraft({
                      id: pin.id,
                      label: pin.label,
                      x: pin.x,
                      y: pin.y,
                      pinKind: pin.pinKind,
                      fogState: pin.fogState,
                      linkedNodeId: pin.linkedNodeId || '',
                      rumorTeaser: pin.rumorTeaser || '',
                    });
                    return;
                  }
                  setSelectedPin(pin);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (pin.childMapId) {
                    navigateToMap(pin.childMapId);
                  }
                }}
              >
                {renderPinGlyph(pin)}
                {(currentMap.scale === 'world' ||
                  hasLockedChild ||
                  hasUnlockedChild) && (
                  <span className="map-pin-tooltip">
                    {currentMap.scale === 'world'
                      ? `${pin.label}${
                          hasLockedChild
                            ? ' (Velado)'
                            : hasUnlockedChild
                              ? ' · Doble clic para entrar'
                              : ''
                        }`
                      : hasLockedChild
                        ? 'Mapa detallado velado'
                        : 'Doble clic para entrar al plano'}
                  </span>
                )}
                {currentMap.scale !== 'world' && (
                  <span className="map-pin-label">{pin.label}</span>
                )}
              </button>
            );
          })}

          {currentMap.id === 'world-thyrenia' && view.partyPosition && (
            <button
              type="button"
              aria-label={`Grupo en ${view.partyPosition.label}`}
              className={`map-icon-pin party${selectedPin === 'party' ? ' selected' : ''}`}
              style={{ left: `${partyOffset.x}%`, top: `${partyOffset.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPin('party');
              }}
            >
              <Users size={15} />
              <span className="map-pin-tooltip">
                Grupo: {view.partyPosition.label}
              </span>
            </button>
          )}
          </div>
        </div>

        {/* Tarjeta superpuesta dentro del propio marco del mapa (0 scroll extra en desktop) */}
        {selectedPin && (
          <div className="atlas-pin-overlay anchored stack" style={{ gap: 8 }}>
            {selectedPin === 'party' ? (
              <>
                <div className="row-between pin-header-row">
                  <div className="row">
                    <span className="badge badge-prog">Posición del Grupo</span>
                    <strong style={{ fontFamily: 'var(--display-font)' }}>
                      {view.partyPosition.label}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    aria-label="Cerrar detalle"
                    onClick={() => setSelectedPin(null)}
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="muted">{view.sceneState.description}</div>
                {view.partyPosition.linkedNodeId &&
                  visibleMap.has(view.partyPosition.linkedNodeId.toLowerCase()) && (
                    <div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                          onOpenNode(view.partyPosition.linkedNodeId!)
                        }
                      >
                        Leer Crónica →
                      </button>
                    </div>
                  )}
              </>
            ) : (
              <>
                <div className="row-between pin-header-row">
                  <div className="row">
                    <span
                      className={`badge ${
                        selectedPin.fogState === 'secret'
                          ? 'badge-danger'
                          : selectedPin.fogState === 'rumor'
                            ? 'badge-gold'
                            : 'badge-prog'
                      }`}
                    >
                      {selectedPin.fogState === 'secret'
                        ? 'Secreto GM'
                        : selectedPin.fogState === 'rumor'
                          ? 'Rumor'
                          : 'Descubierto'}
                    </span>
                    <strong style={{ fontFamily: 'var(--display-font)' }}>
                      {selectedPin.label}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    aria-label="Cerrar detalle"
                    onClick={() => setSelectedPin(null)}
                  >
                    <X size={15} />
                  </button>
                </div>
                {selectedPin.region && (
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {selectedPin.region}
                  </div>
                )}

                {selectedPin.childMapId && (() => {
                  const child = atlasMapById.get(selectedPin.childMapId!);
                  if (!child) return null;
                  if (child.isUnlocked || isGm) {
                    return (
                      <div>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => navigateToMap(child.id)}
                        >
                          <ZoomIn size={14} /> Entrar a {child.name}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div
                      className="card-inner row"
                      style={{ fontSize: '0.82rem', color: 'var(--muted)' }}
                    >
                      <Lock size={14} />
                      <span>{child.lockReason}</span>
                    </div>
                  );
                })()}

                {selectedPin.fogState === 'rumor' ? (
                  <div className="muted" style={{ fontSize: '0.84rem' }}>
                    {selectedPin.rumorTeaser ||
                      'Rumores mencionan este enclave, aún velado por la Niebla.'}
                    {selectedPin.unlockCriteria && (
                      <div style={{ marginTop: 4, color: 'var(--accent)' }}>
                        Requisito: {selectedPin.unlockCriteria}
                      </div>
                    )}
                  </div>
                ) : selectedPin.linkedNodeId &&
                  visibleMap.has(selectedPin.linkedNodeId.toLowerCase()) ? (
                  <>
                    <div className="muted" style={{ fontSize: '0.84rem' }}>
                      {extractCleanExcerpt(
                        visibleMap.get(selectedPin.linkedNodeId.toLowerCase())!
                          .sanitizedContent,
                        150,
                      )}
                    </div>
                    <div className="row">
                      <button
                        type="button"
                        onClick={() => onOpenNode(selectedPin.linkedNodeId!)}
                      >
                        Abrir en Códice →
                      </button>
                    </div>
                  </>
                ) : (
                  selectedPin.rumorTeaser && (
                    <div className="muted" style={{ fontSize: '0.84rem' }}>
                      {selectedPin.rumorTeaser}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Leyenda discreta en una sola línea */}
      <div className="muted" style={{ fontSize: '0.76rem' }}>
        <span style={{ color: 'var(--prog)' }}>●</span> Grupo ·{' '}
        <span style={{ color: 'var(--accent)' }}>■</span> Submapa disponible ·{' '}
        <span>●</span> Enclave · <span style={{ color: 'var(--gm)' }}>○</span>{' '}
        Rumor
        {isGm ? ' · ◉ Secreto GM' : ''}
      </div>

      {/* Editor GM de Pin */}
      {isGm && pinDraft && (
        <div className="surface-card stack" style={{ borderColor: 'var(--gm)' }}>
          <div className="row-between">
            <strong>
              {pinDraft.id ? `Editar Pin: ${pinDraft.label}` : 'Nuevo Pin en Mapa'}
            </strong>
            <span className="muted">
              ({pinDraft.x}%, {pinDraft.y}%)
            </span>
          </div>
          <div className="row">
            <input
              style={{ flex: 1 }}
              value={pinDraft.label}
              onChange={(e) =>
                setPinDraft({ ...pinDraft, label: e.target.value })
              }
              placeholder="Nombre del lugar..."
            />
            <select
              value={pinDraft.pinKind}
              onChange={(e) =>
                setPinDraft({
                  ...pinDraft,
                  pinKind: e.target.value as MapPinKind,
                })
              }
            >
              <option value="city">Ciudad</option>
              <option value="landmark">Enclave</option>
              <option value="dungeon_ruin">Ruina</option>
              <option value="temple">Templo</option>
              <option value="danger">Peligro</option>
              <option value="continent">Continente</option>
            </select>
            <select
              value={pinDraft.fogState}
              onChange={(e) =>
                setPinDraft({
                  ...pinDraft,
                  fogState: e.target.value as MapPinFogState,
                })
              }
            >
              <option value="discovered">Descubierto</option>
              <option value="rumor">Rumor</option>
              <option value="secret">Secreto GM</option>
            </select>
          </div>
          <input
            value={pinDraft.linkedNodeId}
            onChange={(e) =>
              setPinDraft({ ...pinDraft, linkedNodeId: e.target.value })
            }
            placeholder="Título de Nodo de Lore vinculado (opcional)"
          />
          <input
            value={pinDraft.rumorTeaser}
            onChange={(e) =>
              setPinDraft({ ...pinDraft, rumorTeaser: e.target.value })
            }
            placeholder="Texto de rumor o descripción breve (opcional)"
          />
          <div className="row">
            <button type="button" className="btn-primary" onClick={handleSavePin}>
              Guardar Pin
            </button>
            {pinDraft.id && (
              <button
                type="button"
                className="btn-danger"
                onClick={async () => {
                  await apiRequest(
                    '/api/gm/map/pin',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        campaignId: view.activeCampaign.id,
                        id: pinDraft.id,
                        delete: true,
                      }),
                    },
                    gmKey,
                  );
                  setPinDraft(null);
                  await onRefresh();
                }}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            )}
            <button type="button" onClick={() => setPinDraft(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
