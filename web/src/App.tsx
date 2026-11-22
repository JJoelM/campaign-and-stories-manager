import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Crown,
  Dices,
  LogOut,
  Map as MapIcon,
  Search,
  Settings,
  Shield,
} from 'lucide-react';
import type {
  ApiViewPayload,
  FontId,
  GmOverviewPayload,
  LiveRollEntry,
  LoreNode,
  MainTab,
  PlotTimelineEntry,
  ThemeId,
} from './types';
import { apiRequest } from './lib/api';
import { CampaignView } from './components/CampaignView';
import { AtlasView } from './components/AtlasView';
import { CodexView } from './components/CodexView';
import { SheetView, type StoryPrefill } from './components/SheetView';
import { EntryGate } from './components/EntryGate';
import {
  GmDrawer,
  SearchDrawer,
  SettingsDrawer,
} from './components/Drawers';

const STORAGE_THEME = 'thyrenia-theme';
const STORAGE_FONT = 'thyrenia-font';
const STORAGE_SIZE = 'thyrenia-font-size';
const STORAGE_GM_KEY = 'thyrenia-gm-key';
const STORAGE_SESSION_ENTERED = 'thyrenia-session-entered';

const NAV_ITEMS: Array<{
  id: MainTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'campaign', label: 'Campaña', icon: <Dices size={17} /> },
  { id: 'atlas', label: 'Atlas', icon: <MapIcon size={17} /> },
  { id: 'codex', label: 'Códice', icon: <BookOpen size={17} /> },
  { id: 'sheet', label: 'Ficha', icon: <Shield size={17} /> },
];

export const App: React.FC = () => {
  const [view, setView] = useState<ApiViewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [campaignId, setCampaignId] = useState<string>('');
  const [characterId, setCharacterId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MainTab>('campaign');

  // Codex / Timeline state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeSessionChronicle, setActiveSessionChronicle] =
    useState<PlotTimelineEntry | null>(null);
  const [astralOpen, setAstralOpen] = useState(false);
  const [astralMonthIndex, setAstralMonthIndex] = useState<number | null>(null);

  // Live Roll feed
  const [liveRolls, setLiveRolls] = useState<LiveRollEntry[]>([]);

  // Story composer prefill (from Codex / Skeleton CTA)
  const [storyPrefill, setStoryPrefill] = useState<StoryPrefill | null>(null);

  // Drawers
  const [drawer, setDrawer] = useState<'none' | 'search' | 'settings' | 'gm'>(
    'none',
  );
  const [gmEditPath, setGmEditPath] = useState<string | null>(null);

  // Theme & typography
  const [theme, setTheme] = useState<ThemeId>(
    () => (localStorage.getItem(STORAGE_THEME) as ThemeId) || 'grimorio',
  );
  const [font, setFont] = useState<FontId>(
    () => (localStorage.getItem(STORAGE_FONT) as FontId) || 'editorial-serif',
  );
  const [fontSize, setFontSize] = useState<number>(
    () => Number(localStorage.getItem(STORAGE_SIZE)) || 17,
  );
  const [gmKey, setGmKey] = useState<string>(
    () => sessionStorage.getItem(STORAGE_GM_KEY) || '',
  );
  const isGm = Boolean(gmKey);
  const [gmOverview, setGmOverview] = useState<GmOverviewPayload | null>(null);
  const [hasEntered, setHasEntered] = useState<boolean>(
    () => sessionStorage.getItem(STORAGE_SESSION_ENTERED) === '1',
  );

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  // Apply theme & font attributes on <html> and <body>
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.font = font;
    document.body.dataset.font = font;
    localStorage.setItem(STORAGE_FONT, font);
  }, [font]);

  useEffect(() => {
    document.documentElement.style.setProperty('--reader-size', `${fontSize}px`);
    localStorage.setItem(STORAGE_SIZE, String(fontSize));
  }, [fontSize]);

  // Fetch /api/view
  const fetchView = useCallback(
    async (cId = campaignId, chId = characterId) => {
      try {
        const params = new URLSearchParams();
        if (cId) params.set('campaignId', cId);
        if (chId) params.set('characterId', chId);
        const data = await apiRequest<ApiViewPayload>(
          `/api/view${params.toString() ? `?${params.toString()}` : ''}`,
          {},
          gmKey,
        );
        setView(data);
        setCampaignId(data.activeCampaign.id);
        setCharacterId(data.character.id);
        if (gmKey) {
          try {
            const ov = await apiRequest<GmOverviewPayload>(
              `/api/gm/vault/overview?campaignId=${encodeURIComponent(data.activeCampaign.id)}`,
              {},
              gmKey,
            );
            setGmOverview(ov);
          } catch {
            setGmOverview(null);
          }
        } else {
          setGmOverview(null);
        }
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la vista de Thyrenia.',
        );
      } finally {
        setLoading(false);
      }
    },
    [campaignId, characterId, gmKey],
  );

  useEffect(() => {
    void fetchView();
  }, [campaignId, characterId, gmKey]);

  // Keyboard shortcuts (Ctrl+K / Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setDrawer((d) => (d === 'search' ? 'none' : 'search'));
      } else if (e.key === 'Escape') {
        setDrawer('none');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleRecordRoll = useCallback(
    (skillLabel: string, bonus: number) => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + bonus;
      const now = new Date();
      const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const entry: LiveRollEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        characterName: view?.character.name || 'Aventurero',
        skillLabel,
        d20,
        bonus,
        total,
        timeLabel,
      };
      setLiveRolls((prev) => [entry, ...prev].slice(0, 12));
      const crit =
        d20 === 20 ? ' (Crítico)' : d20 === 1 ? ' (Pifia)' : '';
      showToast(
        `${skillLabel}: 1d20(${d20}) ${bonus >= 0 ? `+${bonus}` : bonus} = ${total}${crit}`,
      );
    },
    [view?.character.name, showToast],
  );

  const handleOpenNode = useCallback((nodeId: string) => {
    setActiveSessionChronicle(null);
    setSelectedNodeId(nodeId);
    setActiveTab('codex');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenSession = useCallback((entry: PlotTimelineEntry) => {
    setSelectedNodeId(null);
    setActiveSessionChronicle(entry);
    setActiveTab('codex');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenCosmicEvent = useCallback(
    (eventName: string) => {
      const month = view?.plotTimeline.cosmicWheel.find((m) =>
        m.festivals.some(
          (f) => f.name.toLowerCase() === eventName.toLowerCase(),
        ),
      );
      setAstralMonthIndex(month ? month.monthIndex : null);
      setAstralOpen(true);
      setActiveTab('campaign');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [view?.plotTimeline.cosmicWheel],
  );

  const handleProposeForNode = useCallback((node: LoreNode) => {
    setStoryPrefill({
      title: node.isSkeleton
        ? `Ampliación: ${node.title}`
        : `Aporte para ${node.title}`,
      category:
        node.cardType === 'character'
          ? 'new_npc'
          : node.cardType === 'location'
            ? 'location_event'
            : 'chronicle_entry',
      body: `Referencia: [[${node.title}]]\n\n`,
      subTab: 'notes',
    });
    setActiveTab('sheet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading && !view) {
    return (
      <div className="app-shell">
        <main className="main-container">
          <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
            <h2 className="section-title" style={{ justifyContent: 'center' }}>
              Desplegando el Grimorio de Thyrenia...
            </h2>
          </div>
        </main>
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="app-shell">
        <main className="main-container">
          <div className="panel stack">
            <h2 className="section-title">Error de conexión</h2>
            <p className="muted">{error || 'No hay datos disponibles.'}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => fetchView()}
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!hasEntered) {
    return (
      <>
        <EntryGate
          view={view}
          onEnterAsPlayer={(chId, cId) => {
            sessionStorage.removeItem(STORAGE_GM_KEY);
            sessionStorage.setItem(STORAGE_SESSION_ENTERED, '1');
            setGmKey('');
            setCampaignId(cId);
            setCharacterId(chId);
            setHasEntered(true);
            setActiveTab('campaign');
          }}
          onEnterAsGm={(key, cId) => {
            sessionStorage.setItem(STORAGE_GM_KEY, key);
            sessionStorage.setItem(STORAGE_SESSION_ENTERED, '1');
            setGmKey(key);
            setCampaignId(cId);
            setHasEntered(true);
            setActiveTab('campaign');
            showToast('Sesión de Director de Juego (GM) iniciada.');
          }}
        />
        {toast && (
          <div className="toast-bar" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-shell">
      {/* === TOPBAR ESTRICTA DE 1 SOLA LÍNEA (56px) === */}
      <header className="topbar">
        <button
          type="button"
          className="brand-btn"
          onClick={() => {
            setActiveTab('campaign');
            setSelectedNodeId(null);
            setActiveSessionChronicle(null);
          }}
        >
          <span className="brand-crest">T</span>
          <span className="brand-title">THYRENIA</span>
        </button>

        {/* Navegación Desktop (>= 900px) */}
        <nav className="desktop-nav" aria-label="Secciones principales">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-pill${activeTab === item.id ? ' active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Controles compactos derechos */}
        <div className="topbar-right">
          <select
            className="char-select"
            aria-label="Personaje activo"
            value={view.character.id}
            onChange={(e) => setCharacterId(e.target.value)}
          >
            {view.characters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-icon"
            title="Buscar en el Códice (Ctrl+K)"
            aria-label="Buscar"
            onClick={() => setDrawer('search')}
          >
            <Search size={16} />
          </button>

          {isGm && (
            <button
              type="button"
              className="btn-primary btn-icon"
              title="Acciones GM"
              aria-label="Consola del DM"
              onClick={() => setDrawer('gm')}
            >
              <Crown size={16} />
            </button>
          )}

          <button
            type="button"
            className="btn-icon"
            title="Ajustes y tema"
            aria-label="Ajustes"
            onClick={() => setDrawer('settings')}
          >
            <Settings size={16} />
          </button>

          <button
            type="button"
            className="btn-ghost btn-icon"
            title="Volver a la pantalla de inicio (Cambiar jugador o GM)"
            aria-label="Cambiar rol"
            onClick={() => {
              if (gmKey) {
                void apiRequest('/api/gm/logout', { method: 'POST' }, gmKey).catch(() => {});
              }
              sessionStorage.removeItem(STORAGE_GM_KEY);
              sessionStorage.removeItem(STORAGE_SESSION_ENTERED);
              setGmKey('');
              setHasEntered(false);
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* === CONTENIDO PRINCIPAL === */}
      <main className="main-container">
        {activeTab === 'campaign' && (
          <CampaignView
            view={view}
            isGm={isGm}
            gmKey={gmKey}
            liveRolls={liveRolls}
            onRecordRoll={handleRecordRoll}
            onRefresh={() => fetchView()}
            onOpenNode={handleOpenNode}
            onOpenSession={handleOpenSession}
            onOpenAtlasGeo={() => setActiveTab('atlas')}
            onShowToast={showToast}
            astralOpen={astralOpen}
            astralMonthIndex={astralMonthIndex}
            onToggleAstral={(open, monthIdx) => {
              setAstralOpen(open);
              if (monthIdx !== undefined) setAstralMonthIndex(monthIdx);
            }}
          />
        )}

        {activeTab === 'atlas' && (
          <AtlasView
            view={view}
            gmOverview={gmOverview}
            isGm={isGm}
            gmKey={gmKey}
            selectedNodeId={selectedNodeId}
            onRefresh={() => fetchView()}
            onOpenNode={handleOpenNode}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'codex' && (
          <CodexView
            view={view}
            isGm={isGm}
            gmKey={gmKey}
            selectedNodeId={selectedNodeId}
            activeSessionChronicle={activeSessionChronicle}
            onSelectNode={setSelectedNodeId}
            onSelectSession={setActiveSessionChronicle}
            onOpenCosmicEvent={handleOpenCosmicEvent}
            onProposeForNode={handleProposeForNode}
            onEditInGmStudio={(relPath) => {
              setGmEditPath(relPath);
              setDrawer('gm');
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'sheet' && (
          <SheetView
            view={view}
            gmKey={gmKey}
            prefill={storyPrefill}
            onClearPrefill={() => setStoryPrefill(null)}
            onRecordRoll={handleRecordRoll}
            onRefresh={() => fetchView()}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* === BOTTOM NAVIGATION BAR MÓVIL (< 900px) === */}
      <nav className="bottom-nav" aria-label="Navegación móvil">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-btn${activeTab === item.id ? ' active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* === DRAWERS === */}
      <SearchDrawer
        open={drawer === 'search'}
        view={view}
        onClose={() => setDrawer('none')}
        onSelectNode={handleOpenNode}
      />

      <SettingsDrawer
        open={drawer === 'settings'}
        view={view}
        theme={theme}
        font={font}
        fontSize={fontSize}
        isGm={isGm}
        onClose={() => setDrawer('none')}
        onChangeTheme={setTheme}
        onChangeFont={setFont}
        onChangeFontSize={setFontSize}
        onChangeCampaign={(cId) => {
          setCampaignId(cId);
          setSelectedNodeId(null);
          setActiveSessionChronicle(null);
        }}
        onGmLogin={(key) => {
          setGmKey(key);
          sessionStorage.setItem(STORAGE_GM_KEY, key);
        }}
        onGmLogout={() => {
          if (gmKey) {
            void apiRequest('/api/gm/logout', { method: 'POST' }, gmKey).catch(() => {});
          }
          setGmKey('');
          sessionStorage.removeItem(STORAGE_GM_KEY);
          setDrawer('none');
        }}
        onOpenGmDrawer={() => setDrawer('gm')}
        onShowToast={showToast}
      />

      <GmDrawer
        open={drawer === 'gm' && isGm}
        view={view}
        gmKey={gmKey}
        initialEditPath={gmEditPath}
        onClearEditPath={() => setGmEditPath(null)}
        onClose={() => setDrawer('none')}
        onRefresh={() => fetchView()}
        onShowToast={showToast}
      />

      {toast && (
        <div className="toast-bar" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
