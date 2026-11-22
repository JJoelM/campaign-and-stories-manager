/**
 * Plantilla HTML/CSS/JS de la Player Web App y Estudio Visual del GM.
 * Incluye diseño editorial de alta legibilidad, temas Claro/Oscuro,
 * selector tipográfico persistente, Portal de Esferas de Thyrenia,
 * renderizador Markdown completo y 3 variantes estructurales conmutables
 * (?variant=A|B|C + barra flotante inferior según prototype/UI.md).
 */
export function renderPlayerWebAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thyrenia Engine — Player Web App &amp; Estudio del GM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #080d1a;
      --bg-elev: #0f172a;
      --bg-card: #151f38;
      --bg-subtle: #0b1222;
      --hero-scrim: rgba(11, 16, 32, 0.94);
      --hero-scrim-mid: rgba(15, 23, 42, 0.78);
      --border: #243252;
      --text: #e2e8f0;
      --text-strong: #ffffff;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --gold: #fbbf24;
      --base: #38bdf8;
      --asym: #c084fc;
      --prog: #34d399;
      --gm: #f59e0b;
      --danger: #f87171;
      --shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
      --display-font: 'Cinzel', Georgia, serif;
      --reader-font: 'Crimson Pro', Georgia, 'Palatino Linotype', serif;
      --reader-size: 19px;
      --ui-font: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    }
    body[data-theme="light-parchment"] {
      --bg: #f5efe2;
      --bg-elev: #fffdf8;
      --bg-card: #ffffff;
      --bg-subtle: #ede4d1;
      --hero-scrim: rgba(255, 253, 248, 0.95);
      --hero-scrim-mid: rgba(245, 239, 226, 0.84);
      --border: #dacdb4;
      --text: #1e293b;
      --text-strong: #0f172a;
      --muted: #64748b;
      --accent: #0369a1;
      --gold: #b45309;
      --base: #0284c7;
      --asym: #7e22ce;
      --prog: #047857;
      --gm: #b45309;
      --danger: #b91c1c;
      --shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }
    body[data-theme="dark-parchment"] {
      --bg: #17120e;
      --bg-elev: #211a14;
      --bg-card: #292019;
      --bg-subtle: #1c1611;
      --hero-scrim: rgba(28, 22, 17, 0.95);
      --hero-scrim-mid: rgba(33, 26, 20, 0.82);
      --border: #46392b;
      --text: #f2e8d5;
      --text-strong: #fff8eb;
      --muted: #bba78b;
      --accent: #eab308;
      --gold: #f59e0b;
      --base: #60a5fa;
      --asym: #d8b4fe;
      --prog: #4ade80;
      --shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
    }
    body[data-theme="contrast"] {
      --bg: #000000;
      --bg-elev: #0a0a0a;
      --bg-card: #121212;
      --bg-subtle: #050505;
      --hero-scrim: rgba(0, 0, 0, 0.96);
      --hero-scrim-mid: rgba(0, 0, 0, 0.85);
      --border: #52525b;
      --text: #ffffff;
      --text-strong: #ffffff;
      --muted: #d4d4d8;
      --accent: #38bdf8;
      --gold: #facc15;
      --shadow: 0 0 0 1px #52525b;
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body {
      font-family: var(--ui-font);
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    @media (max-width: 960px) {
      body { overflow: auto; height: auto; }
    }

    /* Unified Single-Row Top Header */
    .topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 18px;
      background: var(--bg-elev);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      z-index: 25;
    }
    .brand { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .brand-mark {
      width: 30px;
      height: 30px;
      border-radius: 9px;
      background: linear-gradient(135deg, var(--accent), var(--asym));
      display: grid;
      place-items: center;
      color: #ffffff;
      font-weight: 700;
      font-family: var(--display-font);
      box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
    }
    .brand h1 {
      margin: 0;
      font-family: var(--display-font);
      font-size: 1.08rem;
      letter-spacing: 0.05em;
      color: var(--text-strong);
    }
    .top-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      padding: 4px 6px;
      border-radius: 12px;
      flex-wrap: wrap;
    }
    .nav-divider {
      width: 1px;
      height: 18px;
      background: var(--border);
      margin: 0 4px;
    }
    .top-actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

    select, input, textarea, button {
      font: inherit;
      color: var(--text);
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 6px 10px;
      font-size: 0.85rem;
    }
    input:focus, select:focus, textarea:focus {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
    button {
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.12s ease, border-color 0.15s ease, background 0.15s ease;
    }
    button:disabled, input:disabled, textarea:disabled, select:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    button:hover { border-color: var(--accent); }
    button.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #ffffff;
    }
    body[data-theme="arcana"] button.primary,
    body[data-theme="contrast"] button.primary { color: #06121f; }
    button.ghost { background: transparent; border-color: transparent; }
    button.ghost:hover { border-color: var(--border); background: var(--bg-subtle); }
    button.gm-btn { background: #92400e; border-color: #d97706; color: #fef3c7; }
    button.approve { background: #065f46; border-color: #10b981; color: #ecfdf5; }
    button.reject { background: #7f1d1d; border-color: #ef4444; color: #fef2f2; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--bg-subtle);
      font-size: 0.74rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge.base { border-color: var(--base); color: var(--base); }
    .badge.asimetrica { border-color: var(--asym); color: var(--asym); }
    .badge.progresiva { border-color: var(--prog); color: var(--prog); }
    .badge.dm_secret { border-color: var(--danger); color: var(--danger); }
    .badge.gm { border-color: var(--gm); color: var(--gm); }
    .muted { color: var(--muted); font-size: 0.85rem; }
    .hidden { display: none !important; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

    /* Drawers (Font + GM) */
    .drawer-panel {
      background: var(--bg-elev);
      border-bottom: 1px solid var(--border);
      padding: 14px 22px;
      flex-shrink: 0;
      max-height: 56vh;
      overflow-y: auto;
      box-shadow: var(--shadow);
      z-index: 19;
    }
    .gm-banner { border-bottom: 2px solid var(--gm); }
    .tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .tab-btn.active { background: #92400e; border-color: var(--gm); color: #fef3c7; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(160px, 1fr)); gap: 10px; }
    @media (max-width: 820px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
    .field-label { display: block; font-size: 0.76rem; color: var(--muted); margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }

    /* Root Stage Container */
    .stage-root {
      flex: 1;
      min-height: 0;
      display: flex;
      position: relative;
      overflow: hidden;
    }
    @media (max-width: 960px) {
      .stage-root { overflow: visible; flex-direction: column; }
    }

    /* === VARIANTE A: LIENZO LIMPIO + CAJÓN ÍNDICE BAJO DEMANDA === */
    .layout-a {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
    }

    .nav-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 18, 0.56);
      backdrop-filter: blur(2px);
      z-index: 42;
    }
    .nav-rail {
      position: fixed;
      top: 56px;
      left: 0;
      bottom: 0;
      width: min(370px, 92vw);
      background: var(--bg-elev);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 45;
      box-shadow: 16px 0 42px rgba(0, 0, 0, 0.5);
      transform: translateX(-105%);
      transition: transform 0.22s ease;
    }
    .nav-rail.drawer-open {
      transform: translateX(0);
    }
    .rail-head {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-box input {
      width: 100%;
      padding-left: 32px;
      background: var(--bg-subtle);
    }
    .search-icon {
      position: absolute;
      left: 10px;
      color: var(--muted);
      pointer-events: none;
      font-size: 0.85rem;
    }
    .layer-pills {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
    }
    .layer-pill {
      padding: 5px 4px;
      font-size: 0.75rem;
      border-radius: 7px;
      background: var(--bg-subtle);
      color: var(--muted);
      border: 1px solid transparent;
      text-align: center;
    }
    .layer-pill.active {
      background: rgba(56, 189, 248, 0.14);
      border-color: var(--accent);
      color: var(--text-strong);
    }
    .adv-filters-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 4px;
    }
    .tree-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 10px 12px 36px;
    }
    .cat-group { margin-bottom: 8px; }
    .cat-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-subtle);
      border: 1px solid transparent;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 0.82rem;
      text-align: left;
      color: var(--text-strong);
    }
    .cat-header:hover { border-color: var(--border); }
    .cat-items {
      padding: 4px 0 4px 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .tree-subhead {
      font-size: 0.69rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      padding: 8px 8px 3px;
    }
    .tree-node-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 9px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 7px;
      text-align: left;
      font-size: 0.84rem;
      font-weight: 500;
      line-height: 1.35;
    }
    .tree-node-btn:hover { background: var(--bg-subtle); }
    .tree-node-btn.selected {
      background: rgba(56, 189, 248, 0.14);
      border-color: var(--accent);
      color: var(--text-strong);
      font-weight: 600;
    }
    .tree-node-title { flex: 1; text-align: left; }
    .tree-node-btn.is-unread .tree-node-title { color: var(--text-strong); }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.base { background: var(--base); }
    .dot.asimetrica { background: var(--asym); }
    .dot.progresiva { background: var(--prog); }

    /* Center Stage & Centered Book Column */
    .codex-stage {
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      padding: 28px 32px 68px;
      background: var(--bg);
    }
    @media (max-width: 720px) { .codex-stage { padding: 16px 14px 48px; } }
    .editorial-shell { max-width: 1080px; margin: 0 auto; }
    .reader-shell { max-width: 740px; margin: 0 auto; }

    /* Portal Hero & Interactive Map Inspector */
    .hero-card {
      background-color: var(--bg-elev);
      background-size: cover;
      background-position: center right;
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 28px 34px;
      margin-bottom: 22px;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }
    .hero-content { max-width: 600px; position: relative; z-index: 2; }
    .hero-title {
      font-family: var(--display-font);
      font-size: 2.1rem;
      line-height: 1.15;
      margin: 8px 0 6px;
      color: var(--text-strong);
    }
    .portal-two-col {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr);
      gap: 18px;
      margin-bottom: 26px;
      align-items: stretch;
    }
    @media (max-width: 980px) { .portal-two-col { grid-template-columns: 1fr; } }

    .map-inspector-card {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 22px 24px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      transition: border-color 0.2s ease;
    }
    .map-inspector-title {
      font-family: var(--display-font);
      font-size: 1.55rem;
      margin: 4px 0;
      color: var(--text-strong);
    }
    .map-inspector-excerpt {
      font-family: var(--reader-font);
      font-size: 1.06rem;
      line-height: 1.6;
      color: var(--text);
      margin: 0;
    }

    .sphere-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 12px;
    }
    @media (max-width: 980px) { .sphere-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 620px) { .sphere-grid { grid-template-columns: 1fr; } }
    .sphere-card {
      text-align: left;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: var(--shadow);
      transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
    }
    .sphere-card:hover, .sphere-card.active-sphere {
      transform: translateY(-2px);
      border-color: var(--accent);
      background: var(--bg-card);
    }
    .sphere-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--bg-subtle);
      display: grid;
      place-items: center;
      font-size: 1.2rem;
      border: 1px solid var(--border);
    }
    .sphere-card h3 {
      margin: 0;
      font-size: 1.04rem;
      color: var(--text-strong);
      font-family: var(--display-font);
    }
    .sphere-card p {
      margin: 0;
      font-size: 0.86rem;
      color: var(--muted);
      font-weight: 400;
      line-height: 1.45;
    }

    /* Paso 2: Galería Visual de Esfera */
    .sphere-gallery {
      margin-top: 22px;
      background: var(--bg-elev);
      border: 1px solid var(--accent);
      border-radius: 16px;
      padding: 20px 22px;
      box-shadow: var(--shadow);
    }
    .gallery-subpills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 12px 0 16px;
    }
    .sub-pill {
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 0.78rem;
      background: var(--bg-subtle);
      color: var(--muted);
      border: 1px solid var(--border);
    }
    .sub-pill.active {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
    }
    body[data-theme="arcana"] .sub-pill.active,
    body[data-theme="contrast"] .sub-pill.active { color: #06121f; }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 12px;
    }
    .lore-gallery-card {
      text-align: left;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 15px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: transform 0.14s ease, border-color 0.14s ease;
    }
    .lore-gallery-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }

    /* Acordeón Discreto de Progreso Técnico */
    .campaign-details-bar {
      margin-top: 24px;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 16px;
    }
    .campaign-details-bar summary {
      cursor: pointer;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--muted);
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .campaign-details-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1.4fr;
      gap: 14px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      align-items: start;
    }
    @media (max-width: 820px) { .campaign-details-grid { grid-template-columns: 1fr; } }
    .status-scene-btn {
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .stat-mini {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 7px 9px;
      text-align: center;
    }
    .stat-mini .num {
      font-family: var(--display-font);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-strong);
    }

    /* Floating Wikilink Hover Preview Card */
    .wikilink-preview-card {
      position: fixed;
      width: min(330px, calc(100vw - 24px));
      background: var(--bg-elev);
      border: 1px solid var(--gold);
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
      z-index: 65;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    /* Hilo de la Trama & Rueda Astral */
    .plot-timeline-section {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 22px;
      margin-bottom: 22px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .timeline-track {
      display: flex;
      align-items: stretch;
      gap: 8px;
      overflow-x: auto;
      padding: 6px 2px 8px;
      position: relative;
    }
    .timeline-node {
      flex: 1 0 132px;
      text-align: left;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 9px 11px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
      transition: border-color 0.16s ease, transform 0.16s ease, background 0.16s ease;
    }
    .timeline-node:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .timeline-node.is-current {
      border-color: var(--gold);
    }
    .timeline-node.is-upcoming {
      border-style: dashed;
      border-color: var(--prog);
    }
    .timeline-node.active {
      background: var(--bg-card);
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
    }
    .timeline-node.is-current.active {
      border-color: var(--gold);
      box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.28);
    }
    .timeline-focus-card {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(260px, 1fr);
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 20px;
    }
    @media (max-width: 880px) {
      .timeline-focus-card { grid-template-columns: 1fr; }
    }
    .timeline-highlights {
      margin: 10px 0 12px;
      padding-left: 18px;
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--text);
    }
    .timeline-highlights li { margin-bottom: 5px; }
    .cosmic-pane {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
    }
    .cosmic-event-callout {
      background: rgba(251, 191, 36, 0.08);
      border: 1px solid rgba(251, 191, 36, 0.45);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .astral-wheel-box {
      border-top: 1px solid var(--border);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .astral-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    @media (max-width: 900px) { .astral-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 540px) { .astral-grid { grid-template-columns: 1fr; } }
    .astral-month-btn {
      text-align: left;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 9px 11px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .astral-month-btn:hover, .astral-month-btn.active {
      border-color: var(--gold);
      background: var(--bg-card);
    }
    .astral-month-btn.is-now {
      box-shadow: 0 0 0 1px var(--accent) inset;
    }
    .astral-month-detail {
      background: var(--bg-subtle);
      border: 1px solid var(--gold);
      border-radius: 12px;
      padding: 12px 15px;
    }

    /* Editorial Article Styling */
    .article-card {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px 34px;
      box-shadow: var(--shadow);
    }
    @media (max-width: 720px) { .article-card { padding: 18px; } }
    .breadcrumbs {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 0.82rem;
      color: var(--muted);
    }
    .article-header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .article-header h2 {
      margin: 0 0 8px;
      font-family: var(--display-font);
      font-size: 1.9rem;
      line-height: 1.2;
      color: var(--text-strong);
    }
    .toc-box {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 18px;
      font-size: 0.84rem;
    }
    .toc-links { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .toc-link {
      padding: 3px 9px;
      border-radius: 6px;
      background: var(--bg-card);
      font-size: 0.8rem;
      font-weight: 500;
    }

    .md-body {
      font-family: var(--reader-font);
      font-size: var(--reader-size);
      line-height: 1.8;
      color: var(--text);
    }
    .md-body h1 {
      font-family: var(--display-font);
      font-size: 1.48em;
      margin: 1.25em 0 0.45em;
      color: var(--text-strong);
      border-bottom: 1px solid var(--border);
      padding-bottom: 4px;
    }
    .md-body h2 {
      font-family: var(--display-font);
      font-size: 1.26em;
      margin: 1.2em 0 0.4em;
      color: var(--accent);
    }
    .md-body h3 { font-size: 1.12em; margin: 1em 0 0.35em; color: var(--text-strong); }
    .md-body h4 { font-size: 1em; margin: 0.85em 0 0.3em; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .md-body p { margin: 0.55em 0 1em; }
    .md-body ul, .md-body ol { margin: 0.4em 0 1em; padding-left: 1.55em; }
    .md-body li { margin-bottom: 0.42em; }
    .md-body li::marker { color: var(--accent); }
    .md-body blockquote.md-quote {
      margin: 1.1em 0;
      padding: 12px 16px;
      border-left: 4px solid var(--gold);
      background: var(--bg-subtle);
      border-radius: 0 10px 10px 0;
      font-style: italic;
    }
    .md-body code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 0.84em;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      padding: 2px 6px;
      border-radius: 5px;
    }
    .md-body pre {
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      padding: 14px;
      border-radius: 10px;
      overflow-x: auto;
    }
    .md-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin: 1.1em 0;
    }
    .md-body table.md-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--ui-font);
      font-size: 0.88em;
    }
    .md-body table.md-table th,
    .md-body table.md-table td {
      border-bottom: 1px solid var(--border);
      padding: 10px 12px;
      text-align: left;
    }
    .md-body table.md-table th {
      background: var(--bg-subtle);
      color: var(--accent);
      font-weight: 700;
    }
    .md-body table.md-table tr:last-child td { border-bottom: none; }
    .md-hr { border: none; border-top: 1px solid var(--border); margin: 1.4em 0; }

    button.wikilink-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 8px;
      margin: 0 2px;
      font-size: 0.88em;
      font-family: var(--ui-font);
      background: rgba(56, 189, 248, 0.14);
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: var(--accent);
      border-radius: 6px;
      vertical-align: baseline;
    }
    button.wikilink-btn:hover { background: rgba(56, 189, 248, 0.24); }
    button.wikilink-locked {
      background: var(--bg-subtle);
      border-color: var(--border);
      color: var(--muted);
      cursor: not-allowed;
    }

    /* === Cartografía Interactiva, Figuras y Senderos === */
    .world-map-card {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px 18px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .world-map-stage {
      position: relative;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(251, 191, 36, 0.35);
      background: #0b1120;
      user-select: none;
    }
    .world-map-stage img.world-map-img {
      display: block;
      width: 100%;
      height: auto;
      max-height: 440px;
      object-fit: cover;
    }
    .world-map-stage.full-atlas {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0;
      border: none;
    }
    .world-map-stage.full-atlas .world-map-inner {
      position: relative;
      max-width: min(100%, 1040px);
      width: 100%;
    }
    .world-map-stage.full-atlas img.world-map-img {
      max-height: calc(100vh - 150px);
      object-fit: contain;
    }
    @keyframes pinPulse {
      0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
      70% { box-shadow: 0 0 0 11px rgba(251, 191, 36, 0); }
      100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
    }
    .map-pin {
      position: absolute;
      transform: translate(-50%, -50%);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px 4px 7px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(251, 191, 36, 0.75);
      color: #fef3c7;
      font-family: var(--display-font);
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
      transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
      z-index: 4;
    }
    .map-pin:hover {
      transform: translate(-50%, -56%) scale(1.06);
      background: rgba(30, 41, 59, 0.96);
      border-color: #38bdf8;
      z-index: 6;
    }
    .map-pin-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fbbf24;
      animation: pinPulse 2.4s infinite;
      flex-shrink: 0;
    }
    .map-pin.locked-pin,
    .map-pin.rumor-pin {
      border-style: dashed;
      border-color: rgba(245, 158, 11, 0.82);
      background: rgba(30, 27, 20, 0.86);
      color: #fde68a;
      box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
    }
    .map-pin.rumor-pin .map-pin-dot {
      background: #f59e0b;
      animation: pinPulse 3.2s infinite;
    }
    .map-pin.secret-pin {
      border-style: dotted;
      border-color: rgba(239, 68, 68, 0.85);
      background: rgba(45, 10, 15, 0.88);
      color: #fecaca;
    }
    .map-pin.secret-pin .map-pin-dot {
      background: #ef4444;
      animation: none;
    }
    .map-pin.party-marker {
      border: 2px solid #34d399;
      background: rgba(6, 78, 59, 0.94);
      color: #ecfdf5;
      z-index: 8;
      box-shadow: 0 0 18px rgba(16, 185, 129, 0.55);
    }
    .map-pin.party-marker .map-pin-dot {
      background: #34d399;
    }
    .gm-map-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      padding: 8px 12px;
      border-radius: 10px;
      background: rgba(146, 64, 14, 0.16);
      border: 1px solid var(--gm);
      margin-bottom: 8px;
    }
    .gm-pin-popover {
      position: absolute;
      top: 76px;
      left: 16px;
      width: min(340px, calc(100% - 32px));
      background: var(--bg-elev);
      border: 2px solid var(--gm);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
      z-index: 25;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 16px;
      padding: 10px 14px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .card-meta-pill {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 10px;
      border-radius: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      font-size: 0.78rem;
    }
    .card-meta-pill span.k {
      font-size: 0.66rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      font-weight: 700;
    }
    .skeleton-callout {
      background: rgba(251, 191, 36, 0.08);
      border: 1px dashed var(--gold);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .chapter-reading-mode {
      max-width: 720px;
      margin: 0 auto;
    }
    .chapter-reading-mode .md-body {
      font-size: calc(var(--reader-size) * 1.06);
      line-height: 1.92;
    }
    .quest-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 13px 15px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .quest-card.is-proposed {
      border-style: dashed;
      border-color: var(--gold);
    }
    .quest-obj-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.86rem;
      padding: 3px 0;
    }
    .quest-obj-item.done {
      text-decoration: line-through;
      color: var(--muted);
    }
    .rel-stage {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      padding: 78px 18px 24px;
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(290px, 0.9fr);
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 960px) { .rel-stage { grid-template-columns: 1fr; } }
    .rel-svg-box {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 14px;
      min-height: 440px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    .rel-edge-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .rel-edge-card.is-proposed {
      border-style: dashed;
      border-color: var(--gold);
    }

    .article-banner {
      margin: -4px 0 18px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--bg-subtle);
      position: relative;
    }
    .article-banner img {
      display: block;
      width: 100%;
      max-height: 280px;
      object-fit: cover;
    }
    .article-banner-caption {
      font-size: 0.76rem;
      color: var(--muted);
      padding: 6px 12px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .lore-figure {
      margin: 1.2em 0;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      background: var(--bg-subtle);
      box-shadow: var(--shadow);
    }
    .lore-figure img {
      display: block;
      width: 100%;
      max-height: 460px;
      object-fit: contain;
      background: rgba(2, 6, 23, 0.5);
    }
    .lore-figure figcaption {
      padding: 8px 12px;
      font-size: 0.82rem;
      color: var(--muted);
      text-align: center;
      font-style: italic;
    }

    .md-body > p:first-of-type::first-letter {
      float: left;
      font-family: var(--display-font);
      font-size: 3.1em;
      line-height: 0.82;
      padding: 4px 10px 2px 0;
      color: var(--gold);
      font-weight: 700;
    }

    .trail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    @media (max-width: 680px) {
      .trail-grid { grid-template-columns: 1fr; }
    }
    .trail-card {
      text-align: left;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 11px 13px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      transition: border-color 0.16s ease, transform 0.16s ease;
    }
    .trail-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .trail-card-excerpt {
      font-size: 0.8rem;
      color: var(--muted);
      font-weight: 400;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .fog-echoes-box {
      background: var(--bg-subtle);
      border: 1px dashed var(--border);
      border-radius: 11px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .relations-box {
      margin-top: 26px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* === VARIANTE B: ATLAS DE CONSTELACIONES (Map-First + Slide-Over Reader) === */
    .layout-b {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .map-top-bar {
      position: absolute;
      top: 14px;
      left: 14px;
      right: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 8px 12px;
      box-shadow: var(--shadow);
      z-index: 12;
    }
    .canvas-wrap {
      width: 100%;
      height: 100%;
      min-height: 480px;
      position: relative;
    }
    #graphCanvas { width: 100%; height: 100%; display: block; cursor: grab; }
    #graphCanvas:active { cursor: grabbing; }
    .map-overlay-controls {
      position: absolute;
      bottom: 18px;
      left: 16px;
      display: flex;
      gap: 6px;
      background: var(--bg-elev);
      padding: 6px;
      border-radius: 10px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      z-index: 12;
    }
    .map-legend {
      position: absolute;
      bottom: 18px;
      right: 16px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      background: var(--bg-elev);
      padding: 6px 10px;
      border-radius: 10px;
      border: 1px solid var(--border);
      z-index: 10;
    }
    .graph-tooltip {
      position: absolute;
      pointer-events: none;
      background: var(--bg-elev);
      border: 1px solid var(--accent);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 0.82rem;
      max-width: 250px;
      z-index: 15;
      box-shadow: var(--shadow);
    }
    .slide-drawer {
      position: absolute;
      top: 74px;
      right: 14px;
      bottom: 18px;
      width: min(460px, calc(100vw - 28px));
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: var(--shadow);
      z-index: 14;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .slide-drawer-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
    }

    /* === VARIANTE C: MESA DE CAMPAÑA (Session & Scene Hub) === */
    .layout-c {
      display: grid;
      grid-template-columns: 340px minmax(0, 1fr);
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    @media (max-width: 960px) { .layout-c { grid-template-columns: 1fr; height: auto; } }
    .campaign-rail {
      background: var(--bg-elev);
      border-right: 1px solid var(--border);
      padding: 18px 16px 42px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .scene-main {
      padding: 24px 32px 52px;
      overflow-y: auto;
    }
    .scene-shell {
      max-width: 820px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px 18px;
      background: var(--bg-elev);
      box-shadow: var(--shadow);
    }
    .choice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 10px;
    }
    .choice-card-btn {
      text-align: left;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--bg-card);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .list-scroll {
      max-height: 280px;
      overflow-y: auto;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
    }
    textarea { width: 100%; min-height: 76px; resize: vertical; }

    /* === Nav Pills Inline en Header === */
    .proto-pill {
      padding: 5px 11px;
      border-radius: 8px;
      font-size: 0.82rem;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      white-space: nowrap;
    }
    .proto-pill:hover {
      color: var(--text-strong);
      border-color: var(--border);
    }
    .proto-pill.active {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
    }
    body[data-theme="arcana"] .proto-pill.active,
    body[data-theme="contrast"] .proto-pill.active { color: #06121f; }
    .proto-arrow {
      width: 26px;
      height: 26px;
      padding: 0;
      border-radius: 7px;
      border-color: transparent;
      background: transparent;
      color: var(--muted);
      display: grid;
      place-items: center;
    }

    .prog-bar {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      overflow: hidden;
      display: block;
    }
    .prog-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), var(--prog));
      width: 0%;
      transition: width 0.25s ease;
    }

    /* === Modal Hoja de PJ & Aportaciones del Jugador === */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 18, 0.72);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 60;
    }
    .modal-dialog {
      width: min(920px, 100%);
      max-height: 90vh;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-head {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .modal-body {
      padding: 18px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .stat-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
      gap: 8px;
    }
    .stat-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 8px;
      text-align: center;
    }
    .stat-box .big {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-strong);
      font-family: var(--display-font);
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 8px;
    }
    .skill-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 0.85rem;
    }
    .lock-toast {
      position: fixed;
      bottom: 22px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-elev);
      border: 1px solid var(--gold);
      color: var(--text-strong);
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: var(--shadow);
      z-index: 55;
      max-width: min(520px, calc(100vw - 24px));
      font-size: 0.86rem;
    }
  </style>
</head>
<body data-theme="arcana">
  <header class="topbar">
    <div class="brand">
      <div class="brand-logo" id="homeLogoBtn" title="Volver al Portal de Inicio">
        <div class="brand-mark">T</div>
        <h1>Thyrenia</h1>
      </div>
      <button id="toggleIndexDrawerBtn" class="ghost" title="Abrir índice y buscador (Ctrl+K)" style="padding:5px 10px;font-size:0.83rem">📚 Índice</button>
    </div>

    <nav id="prototypeSwitcher" class="top-nav" aria-label="Vistas principales">
      <button id="protoPrevBtn" class="proto-arrow" title="Vista anterior (←)">←</button>
      <button class="proto-pill active" data-variant="A">📖 Códice Editorial</button>
      <button class="proto-pill" data-variant="B">🗺️ Atlas de Constelaciones</button>
      <button class="proto-pill" data-variant="C">🎲 Mesa de Campaña</button>
      <button id="protoNextBtn" class="proto-arrow" title="Vista siguiente (→)">→</button>
    </nav>

    <div class="top-actions">
      <select id="characterSelect" title="Perspectiva de personaje" style="padding:5px 9px;font-size:0.83rem"></select>
      <button id="quickQuestsBtn" class="ghost" style="padding:5px 10px;font-size:0.83rem" title="Abrir Tablero de Misiones y Rumores en Mesa Manual">📜 Misiones</button>
      <button id="openSheetModalBtn" class="ghost" style="padding:5px 10px;font-size:0.83rem">🛡️ Mi Ficha</button>
      <button id="toggleFontPanelBtn" class="ghost" title="Campaña, Tipografía y Modo GM" style="padding:5px 10px;font-size:0.83rem">⚙️ Mesa y Ajustes</button>
    </div>
  </header>

  <section id="fontPanel" class="drawer-panel hidden">
    <div class="row" style="justify-content:space-between; margin-bottom:12px">
      <strong style="font-family:var(--display-font); font-size:1.05rem">Ajustes de Lectura, Campaña y Dirección de Juego</strong>
      <div class="row">
        <button id="quickThemeBtn" title="Alternar entre Modo Claro y Oscuro">☀️ Claro</button>
        <button id="closeFontPanelBtn">Cerrar ✕</button>
      </div>
    </div>
    <div class="grid-3">
      <div>
        <label class="field-label" for="fontFamilySelect">Fuente del Códice</label>
        <select id="fontFamilySelect" style="width:100%">
          <option value="editorial-serif">Editorial Fantástica (Crimson Pro / Georgia)</option>
          <option value="modern-sans">Moderna Limpia (Plus Jakarta Sans)</option>
          <option value="classic-lora">Literaria Clásica (Lora)</option>
          <option value="accessible-sans">Alta Legibilidad (Verdana)</option>
          <option value="arcane-mono">Arcana (JetBrains Mono)</option>
        </select>
      </div>
      <div>
        <label class="field-label" for="fontSizeSelect">Tamaño de Lectura</label>
        <select id="fontSizeSelect" style="width:100%">
          <option value="15px">Compacta (15 px)</option>
          <option value="17px">Cómoda (17 px)</option>
          <option value="19px" selected>Amplia (19 px)</option>
          <option value="21px">Muy Grande (21 px)</option>
        </select>
      </div>
      <div>
        <label class="field-label" for="themeSelect">Tema Visual</label>
        <select id="themeSelect" style="width:100%">
          <option value="arcana">Noche Arcana (Oscuro Azulado)</option>
          <option value="light-parchment">Pergamino Día (Fondo Claro Alta Legibilidad)</option>
          <option value="dark-parchment">Pergamino Nocturno (Sepia Cálido)</option>
          <option value="contrast">Alto Contraste</option>
        </select>
      </div>
    </div>
    <div class="grid-3" style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border)">
      <div>
        <label class="field-label" for="campaignSelect">Campaña Activa y Fecha</label>
        <div class="row">
          <select id="campaignSelect" style="flex:1"></select>
          <span id="calendarDateBadge" class="badge" title="Fecha en el Calendario de Thyrenia">📅 ...</span>
          <button id="advanceDayBtn" class="gm-btn hidden" style="padding:4px 8px;font-size:0.76rem" title="Avanzar 1 día">+1 Día</button>
        </div>
      </div>
      <div>
        <label class="field-label">Tu Personaje en la Historia</label>
        <button id="openStoryModalBtn" style="width:100%">✍️ Añadir Recuerdo o Crónica</button>
      </div>
      <div>
        <label class="field-label">Rol de Mesa</label>
        <div class="row" style="justify-content:space-between">
          <span id="roleBadge" class="badge base">Jugador</span>
          <button id="toggleGmModalBtn" class="gm-btn">Entrar como GM</button>
        </div>
      </div>
    </div>
  </section>

  <section id="gmAuthPanel" class="drawer-panel gm-banner hidden">
    <div class="row" style="justify-content:space-between">
      <strong>Acceso al Estudio del GM (Director de Juego)</strong>
      <button id="closeGmAuthBtn">Cerrar</button>
    </div>
    <p class="muted" style="margin:6px 0 10px">
      Ingresa la clave del GM para editar el Vault Maestro visualmente, controlar la Niebla de Guerra en vivo y aprobar Propuestas de Canon.
    </p>
    <div class="row">
      <input id="gmKeyInput" type="password" placeholder="Clave de GM (ej. thyrenia-gm)" style="min-width:240px" />
      <button id="gmLoginKeyBtn" class="gm-btn">Entrar con Clave</button>
      <button id="gmQuickLocalBtn">Acceso Rápido GM Local (Esta Máquina)</button>
      <span id="gmAuthFeedback" class="muted"></span>
    </div>
  </section>

  <section id="gmStudioPanel" class="drawer-panel gm-banner hidden">
    <div class="row" style="justify-content:space-between; margin-bottom:10px">
      <div>
        <strong style="color:var(--gm)">Estudio Visual del GM — Sincronización Directa con Vault Maestro</strong>
        <div class="muted">Edita notas reales de Obsidian visualmente y controla la Niebla de Guerra Estratificada.</div>
      </div>
      <div class="row">
        <button id="gmExportCompendiumBtn" class="approve" title="Descargar Compendio JSON completo para FoundryVTT">📦 Exportar Compendio FoundryVTT</button>
        <button id="gmRefreshBtn">Recargar Vault</button>
        <button id="gmLogoutBtn" class="reject">Salir de Modo GM</button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="editor">Editor Visual del Vault</button>
      <button class="tab-btn" data-tab="fog">Control de Niebla de Guerra</button>
      <button class="tab-btn" data-tab="scene">Director de Escena</button>
      <button class="tab-btn" data-tab="canon">Bandeja de Canon y Crónicas</button>
    </div>

    <div id="tab-editor" class="tab-pane">
      <div class="grid-2">
        <div>
          <label class="field-label">Título del Nodo de Lore (.md)</label>
          <input id="gmNodeTitle" type="text" placeholder="Ej: Posada del Bronce" style="width:100%" />
        </div>
        <div>
          <label class="field-label">Carpeta destino en el Vault Maestro</label>
          <select id="gmFolderSelect" style="width:100%"></select>
        </div>
      </div>
      <div class="grid-2" style="margin-top:8px">
        <div>
          <label class="field-label">Capa de Visibilidad</label>
          <select id="gmLayerSelect" style="width:100%">
            <option value="base">Capa Base (Pública para todos)</option>
            <option value="progresiva">Capa Progresiva (Oculta hasta revelar)</option>
            <option value="asimetrica">Capa Asimétrica (Solo personajes con requisitos)</option>
            <option value="dm_secret">Secreto Exclusivo DM (Nunca visible a jugadores)</option>
          </select>
        </div>
        <div>
          <label class="field-label">Etiquetas (separadas por coma)</label>
          <input id="gmTagsInput" type="text" placeholder="ej: faccion, lore, posada" style="width:100%" />
        </div>
      </div>
      <div id="gmAsymFields" class="grid-2 hidden" style="margin-top:8px">
        <div>
          <label class="field-label">Clases autorizadas (coma)</label>
          <input id="gmReqClasses" type="text" placeholder="hechicero, clerigo" style="width:100%" />
        </div>
        <div>
          <label class="field-label">Personajes autorizados (coma)</label>
          <input id="gmReqChars" type="text" placeholder="Olivia Zyltris, pj-olivia" style="width:100%" />
        </div>
      </div>
      <div class="grid-2" style="margin-top:8px">
        <div>
          <label class="field-label">Imagen / Estandarte Principal (opcional, carpeta /images)</label>
          <div class="row">
            <select id="gmImageSelect" style="flex:1">
              <option value="">(Automática / Según esfera)</option>
            </select>
            <button id="gmInsertImageBtn" type="button" title="Insertar embed ![[imagen]] en el texto">Insertar ![[...]]</button>
          </div>
        </div>
        <div>
          <label class="field-label" for="gmCardTypeSelect">Tipo de Card (vvd / Enhanced Journal)</label>
          <select id="gmCardTypeSelect" style="width:100%">
            <option value="">(Automático por carpeta)</option>
            <option value="character">Personaje / PNJ</option>
            <option value="location">Lugar / Región</option>
            <option value="faction">Facción / Orden</option>
            <option value="quest_clue">Misión / Pista</option>
            <option value="session">Sesión de Campaña</option>
            <option value="chapter">Capítulo Narrado / Novela</option>
            <option value="deity">Deidad / Panteón</option>
            <option value="rule_lore">Lore y Reglas</option>
          </select>
        </div>
      </div>
      <div class="grid-2" style="margin-top:8px">
        <div>
          <label class="field-label">Contenido Visible para Jugadores (Markdown + [[Wikilinks]] + ![[imagen]])</label>
          <textarea id="gmPublicMarkdown" style="min-height:110px"></textarea>
        </div>
        <div>
          <label class="field-label">Secretos Privados del DM (guardados en %%...%%)</label>
          <textarea id="gmSecretNotes" style="min-height:110px; border-color:#7f1d1d"></textarea>
        </div>
      </div>
      <div class="row" style="margin-top:8px">
        <label class="row muted" style="gap:5px">
          <input id="gmRevealNowCheck" type="checkbox" />
          Si es Capa Progresiva, revelar inmediatamente
        </label>
        <button id="gmSaveNodeBtn" class="gm-btn">Guardar en Vault Maestro (.md)</button>
        <button id="gmNewNodeBtn">Limpiar / Nuevo Nodo</button>
        <span id="gmSaveStatus" class="muted"></span>
      </div>
    </div>

    <div id="tab-fog" class="tab-pane hidden">
      <div class="row" style="margin-bottom:8px">
        <input id="gmFogSearch" type="search" placeholder="Filtrar nodos del Vault Maestro..." style="flex:1; min-width:220px" />
        <span id="gmFogCount" class="muted"></span>
      </div>
      <div id="gmFogList" class="list-scroll"></div>
    </div>

    <div id="tab-scene" class="tab-pane hidden">
      <div class="grid-2">
        <div>
          <label class="field-label">Nodo de Ubicación Actual</label>
          <input id="gmSceneLocation" type="text" style="width:100%" />
        </div>
        <div>
          <label class="field-label">Amenazas Activas (separadas por coma)</label>
          <input id="gmSceneThreats" type="text" style="width:100%" />
        </div>
      </div>
      <div style="margin-top:8px">
        <label class="field-label">Descripción del Estado de Escena</label>
        <textarea id="gmSceneDescription"></textarea>
      </div>
      <div class="row" style="margin-top:8px">
        <button id="gmUpdateSceneBtn" class="gm-btn">Actualizar Estado de Escena</button>
        <span id="gmSceneStatus" class="muted"></span>
      </div>
    </div>

    <div id="tab-canon" class="tab-pane hidden">
      <div class="card" style="margin-bottom:8px; padding:10px 12px; border-color:var(--gold); background:var(--bg-subtle)">
        <strong>🔒 Síntesis por IA Bloqueada — Modo 100% Manual</strong>
        <div class="muted" style="font-size:0.82rem; margin-top:2px">
          La generación automática de crónicas está desactivada mientras perfeccionamos la experiencia manual. Crea o edita notas desde el <strong>Editor Visual del Vault</strong> o aprueba aportaciones de jugadores abajo.
        </div>
      </div>
      <div class="row" style="margin-bottom:8px">
        <input id="chronicleTitleInput" type="text" placeholder="Síntesis automática por IA desactivada temporalmente..." style="flex:1" disabled />
        <button id="chronicleBtn" class="gm-btn" disabled title="Bloqueado temporalmente — Modo 100% Manual">🔒 Síntesis IA Bloqueada</button>
      </div>
      <div id="gmStagedMediaList" class="row hidden" style="margin-bottom:8px;padding:8px 10px;border-radius:10px;border:1px solid var(--gold);background:var(--bg-subtle)"></div>
      <div id="canonQueueList" class="list-scroll"></div>
    </div>
  </section>

  <!-- CONTENEDOR PRINCIPAL POR VARIANTES (A / B / C) -->
  <main class="stage-root">
    <!-- VARIANTE A: LIENZO LIMPIO + CAJÓN ÍNDICE BAJO DEMANDA -->
    <section id="variantA" class="layout-a">
      <div id="navBackdrop" class="nav-drawer-backdrop hidden"></div>
      <aside id="navRail" class="nav-rail">
        <div class="rail-head">
          <div class="row" style="justify-content:space-between">
            <strong style="font-family:var(--display-font);font-size:0.95rem">Índice de Thyrenia</strong>
            <div class="row">
              <button id="openPortalBtn" class="ghost" style="padding:3px 8px;font-size:0.78rem">🏠 Inicio</button>
              <button id="closeIndexDrawerBtn" style="padding:3px 8px;font-size:0.78rem">✕</button>
            </div>
          </div>
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input id="ragQuery" type="search" placeholder="Buscar por nombre, tema o relato..." />
          </div>
          <div class="layer-pills" id="layerPills">
            <button type="button" class="layer-pill active" data-layer-pill="all">Todas</button>
            <button type="button" class="layer-pill" data-layer-pill="base">Base</button>
            <button type="button" class="layer-pill" data-layer-pill="asimetrica">Mi PJ</button>
            <button type="button" class="layer-pill" data-layer-pill="progresiva">Campaña</button>
          </div>
          <div class="row" style="justify-content:space-between">
            <button id="toggleAdvFiltersBtn" class="ghost" style="padding:2px 6px;font-size:0.76rem">Más filtros ▾</button>
            <span id="visibleCountLabel" class="muted" style="font-size:0.75rem"></span>
          </div>
          <div id="advFiltersBox" class="adv-filters-box hidden">
            <select id="layerFilter" title="Capa">
              <option value="all">Todas las Capas</option>
              <option value="base">Capa Base (Pública)</option>
              <option value="asimetrica">Capa Asimétrica (Tu PJ)</option>
              <option value="progresiva">Capa Progresiva (Descubierta)</option>
            </select>
            <select id="categoryFilter" title="Categoría">
              <option value="all">Todas las Categorías</option>
            </select>
            <select id="tagFilter" title="Etiqueta">
              <option value="all">Todas las Etiquetas</option>
            </select>
          </div>
        </div>
        <div class="tree-scroll" id="hierarchyTree"></div>
      </aside>

      <section class="codex-stage" id="codexStage">
        <div class="editorial-shell">
          <!-- Portal Enfocado: Mapa + Inspector Vivo + Explorador por Esferas -->
          <div id="welcomePortal">
            <div class="hero-card" id="welcomeHeroCard">
              <div class="hero-content">
                <span class="badge asimetrica" id="heroCharBadge">Personaje Activo</span>
                <h2 class="hero-title" id="heroGreeting">Códice de Thyrenia</h2>
                <p class="muted" id="heroSubtitle" style="font-size:0.98rem; line-height:1.55; margin:0 0 18px">
                  Explora continentes, dioses y misterios revelados según lo que sabe tu personaje.
                </p>
                <div class="row">
                  <button id="heroRandomBtn" class="primary">🎲 Sorpréndeme con un Misterio</button>
                  <button id="heroOpenSheetBtn">🛡️ Crónica de Mi PJ</button>
                  <button id="heroOpenMapBtn" class="ghost">🕸️ Constelación</button>
                </div>
              </div>
            </div>

            <!-- Hilo de la Trama (Últimas Sesiones + Punto Actual) y Rueda Astral -->
            <section id="plotTimelineSection" class="plot-timeline-section">
              <div class="row" style="justify-content:space-between">
                <div>
                  <strong id="timelineHeaderTitle" style="font-family:var(--display-font); font-size:1.1rem">⏳ ¿En qué punto de la trama estamos?</strong>
                  <div class="muted" id="timelineHorizonBadge" style="font-size:0.82rem">Cargando cronología de campaña y cielos de Thyrenia...</div>
                </div>
                <div class="row">
                  <button id="timelinePrevBtn" style="padding:4px 9px;font-size:0.8rem" title="Ir a la sesión anterior">◀ Anterior</button>
                  <button id="timelineNextBtn" style="padding:4px 9px;font-size:0.8rem" title="Ir a la sesión siguiente">Siguiente ▶</button>
                  <button id="toggleAstralWheelBtn" style="padding:4px 10px;font-size:0.8rem">🌙 Rueda Astral (12 Meses y Fiestas)</button>
                </div>
              </div>

              <div id="timelineTrack" class="timeline-track"></div>
              <div id="timelineFocusCard" class="timeline-focus-card"></div>

              <div id="astralWheelBox" class="astral-wheel-box hidden">
                <div class="row" style="justify-content:space-between">
                  <div>
                    <strong style="font-family:var(--display-font)">🌙 Rueda Astral de Thyrenia (12 Meses, Estaciones y Fiestas)</strong>
                    <div class="muted" style="font-size:0.8rem">Pulsa un mes para ver su deidad patrona, fiesta cósmica o pagana y qué sesiones ocurrieron allí</div>
                  </div>
                  <div id="astralSeasonPills" class="row"></div>
                </div>
                <div id="astralGrid" class="astral-grid"></div>
                <div id="astralMonthDetail" class="astral-month-detail hidden"></div>
              </div>
            </section>

            <div class="portal-two-col">
              <div id="portalWorldMapCard" class="world-map-card hidden">
                <div class="row" style="justify-content:space-between">
                  <div>
                    <strong style="font-family:var(--display-font); font-size:1.05rem">🗺️ Mapa del Mundo</strong>
                    <div class="muted" style="font-size:0.8rem">Pasa el cursor o pulsa en un continente para inspeccionarlo</div>
                  </div>
                  <button id="openAtlasFullBtn" class="ghost" style="font-size:0.8rem">Ampliar ⤢</button>
                </div>
                <div id="portalWorldMapStage" class="world-map-stage"></div>
              </div>

              <aside id="mapInspectorCard" class="map-inspector-card">
                <div>
                  <span class="badge base" id="inspectorBadge">Explorador Regional</span>
                  <h3 class="map-inspector-title" id="inspectorTitle">Elige un Continente</h3>
                  <div class="muted" id="inspectorRegion" style="margin-bottom:10px">Thyrenia · 6 Grandes Tierras</div>
                  <p class="map-inspector-excerpt" id="inspectorExcerpt">
                    Señala o pulsa cualquiera de los continentes iluminados en el mapa (Dracoria, Evedia, Avaloria, Marisal, Thornia o Istoria) para leer un anticipo y viajar directo a su historia.
                  </p>
                </div>
                <div class="row" style="justify-content:space-between">
                  <button id="inspectorOpenBtn" class="primary hidden">Explorar Crónica →</button>
                  <span class="muted" style="font-size:0.78rem">También puedes abrir el 📚 Índice</span>
                </div>
              </aside>
            </div>

            <div class="row" style="justify-content:space-between; margin-bottom:4px">
              <strong style="font-family:var(--display-font); font-size:1.12rem">¿Qué quieres descubrir hoy?</strong>
              <span class="muted">Elige una esfera para explorar sus crónicas visualmente</span>
            </div>
            <div class="sphere-grid" id="sphereGrid"></div>

            <!-- Paso 2: Galería Visual Interactiva al elegir una Esfera -->
            <section id="sphereGallerySection" class="sphere-gallery hidden">
              <div class="row" style="justify-content:space-between">
                <div>
                  <strong id="sphereGalleryTitle" style="font-family:var(--display-font); font-size:1.25rem; color:var(--text-strong)"></strong>
                  <div id="sphereGalleryDesc" class="muted"></div>
                </div>
                <div class="row">
                  <button id="sphereIntroBtn" class="primary" style="font-size:0.82rem">Leer Introducción →</button>
                  <button id="closeSphereGalleryBtn" style="font-size:0.82rem">Cerrar ✕</button>
                </div>
              </div>
              <div id="sphereSubPills" class="gallery-subpills"></div>
              <div id="sphereGalleryGrid" class="gallery-grid"></div>
            </section>

            <!-- Acordeón Discreto de Progreso y Escena -->
            <details class="campaign-details-bar">
              <summary>
                <span>📊 Estado de la Campaña Actual, Escena y Progreso de Exploración</span>
                <span class="muted">Desplegar ▾</span>
              </summary>
              <div class="campaign-details-grid">
                <div>
                  <div class="field-label">Escena en Curso</div>
                  <button id="ribbonSceneBtn" class="status-scene-btn">📍 Cargando escena...</button>
                </div>
                <div>
                  <div class="row" style="justify-content:space-between; margin-bottom:6px">
                    <span class="field-label" style="margin:0">Hitos Descubiertos</span>
                    <span id="worldProgSummary" class="badge progresiva">0/0</span>
                  </div>
                  <span class="prog-bar"><span id="worldProgFill" class="prog-fill"></span></span>
                  <div class="row" style="margin-top:8px">
                    <span id="readProgressBadge" class="badge">Leídos: 0</span>
                  </div>
                </div>
                <div>
                  <div class="field-label">Capas Visibles</div>
                  <div id="heroStatsRow" class="stat-list"></div>
                </div>
              </div>
            </details>
          </div>

          <!-- Paso 3: Lector Tipo Libro (Centrado y Sin Barras Laterales) -->
          <div class="reader-shell">
            <article id="articleView" class="article-card hidden">
              <div class="breadcrumbs">
                <div id="nodeBreadcrumbs"></div>
                <div class="row">
                  <button id="articleRandomBtn" style="padding:4px 9px;font-size:0.78rem">🎲 Otro Misterio</button>
                  <button id="backToPortalBtn" style="padding:4px 9px;font-size:0.78rem">🏠 Portal</button>
                  <button id="viewInMapBtn" style="padding:4px 9px;font-size:0.78rem">🕸️ Mapa</button>
                </div>
              </div>
              <header class="article-header">
                <h2 id="articleTitle"></h2>
                <div id="articleBadges" class="row"></div>
                <div id="articleActions" class="row" style="margin-top:8px"></div>
              </header>
              <div id="cardMetaBar" class="card-meta-bar hidden"></div>
              <div id="skeletonPromptBox" class="skeleton-callout hidden"></div>
              <div id="articleBanner" class="article-banner hidden"></div>
              <div id="articleToc" class="toc-box hidden"></div>
              <div id="articleBody" class="md-body"></div>
              <div id="articleRelations" class="relations-box"></div>
            </article>
          </div>
        </div>
      </section>
    </section>

    <!-- VARIANTE B: ATLAS DE CONSTELACIONES (Mapa Completo + Cartografía + Drawer Lateral) -->
    <section id="variantB" class="layout-b hidden">
      <div class="map-top-bar">
        <div class="row">
          <strong style="font-family:var(--display-font)">Atlas de Thyrenia</strong>
          <button id="atlasModeGraphBtn" class="primary" style="padding:4px 10px;font-size:0.8rem">🕸️ Constelación de Lore</button>
          <button id="atlasModeGeoBtn" style="padding:4px 10px;font-size:0.8rem">🗺️ Mapa Cartográfico</button>
          <button id="atlasModeRelBtn" style="padding:4px 10px;font-size:0.8rem">🤝 Red de Relaciones</button>
          <span id="graphCountLabel" class="muted"></span>
        </div>
        <div class="row" id="graphFilterControls">
          <input id="mapSearchInput" type="search" placeholder="Filtrar nodos en mapa..." style="width:180px" />
          <select id="mapLayerFilter">
            <option value="all">Todas las Capas</option>
            <option value="base">Base</option>
            <option value="asimetrica">Asimétrica</option>
            <option value="progresiva">Progresiva</option>
          </select>
          <select id="scopeFilter" title="Alcance del Grafo">
            <option value="neighbors2">Red del Nodo (2 saltos)</option>
            <option value="neighbors1">Vecinos Directos (1 salto)</option>
            <option value="connected">Todos Conectados</option>
            <option value="all">Todos Visibles</option>
          </select>
          <button id="togglePhysicsBtn">Pausar Física</button>
        </div>
      </div>

      <div class="canvas-wrap" id="canvasWrap">
        <canvas id="graphCanvas"></canvas>
        <div id="graphTooltip" class="graph-tooltip hidden"></div>
        <div class="map-overlay-controls">
          <button id="zoomInBtn" title="Acercar">+</button>
          <button id="zoomOutBtn" title="Alejar">−</button>
          <button id="centerGraphBtn" title="Centrar en nodo activo">Centrar</button>
        </div>
        <div class="map-legend">
          <span class="badge base">Capa Base</span>
          <span class="badge asimetrica">Capa Asimétrica</span>
          <span class="badge progresiva">Capa Progresiva</span>
        </div>
      </div>

      <div class="canvas-wrap hidden" id="geoAtlasWrap">
        <div id="gmGeoToolsBar" class="gm-map-toolbar hidden" style="position:absolute;top:74px;left:16px;z-index:20">
          <strong style="font-size:0.8rem;color:var(--gm)">Edición GM del Mapa:</strong>
          <button id="gmClickPinModeBtn" style="padding:4px 9px;font-size:0.78rem">📌 Colocar Pin con Clic</button>
          <button id="gmClickPartyModeBtn" style="padding:4px 9px;font-size:0.78rem">📍 Mover Grupo con Clic</button>
          <span id="gmMapModeHint" class="muted" style="font-size:0.76rem"></span>
        </div>
        <div id="gmPinPopover" class="gm-pin-popover hidden">
          <div class="row" style="justify-content:space-between">
            <strong id="gmPinPopoverTitle">Nuevo Pin en Mapa</strong>
            <button id="gmPinCloseBtn" style="padding:2px 7px;font-size:0.76rem">✕</button>
          </div>
          <input id="gmPinIdInput" type="hidden" />
          <div class="grid-2">
            <div>
              <label class="field-label" for="gmPinLabelInput">Nombre del Pin</label>
              <input id="gmPinLabelInput" type="text" placeholder="Ej: Posada del Bronce" style="width:100%" />
            </div>
            <div>
              <label class="field-label" for="gmPinKindSelect">Icono / Tipo</label>
              <select id="gmPinKindSelect" style="width:100%">
                <option value="city">Ciudad / Poblado</option>
                <option value="landmark">Enclave / Lugar</option>
                <option value="dungeon_ruin">Ruina / Mazmorra</option>
                <option value="temple">Templo / Altar</option>
                <option value="danger">Peligro / Amenaza</option>
                <option value="continent">Continente</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div>
              <label class="field-label" for="gmPinFogSelect">Capa de Niebla</label>
              <select id="gmPinFogSelect" style="width:100%">
                <option value="discovered">Descubierto (Nítido)</option>
                <option value="rumor">Rumor (Difuso ámbar)</option>
                <option value="secret">Secreto (Solo GM)</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="gmPinCoordsLabel">Coordenadas (%)</label>
              <input id="gmPinCoordsInput" type="text" readonly style="width:100%" />
            </div>
          </div>
          <div>
            <label class="field-label" for="gmPinNodeInput">Card Vinculada (título opcional)</label>
            <input id="gmPinNodeInput" list="vaultNodeTitlesList" type="text" placeholder="Ej: Notas 9-7-26" style="width:100%" />
          </div>
          <div>
            <label class="field-label" for="gmPinRumorInput">Texto de Rumor / Indicio (opcional)</label>
            <input id="gmPinRumorInput" type="text" placeholder="Qué oyó el grupo..." style="width:100%" />
          </div>
          <div class="row" style="justify-content:space-between;margin-top:4px">
            <button id="gmPinSaveBtn" class="gm-btn">Guardar Pin</button>
            <button id="gmPinMovePartyHereBtn" style="font-size:0.78rem">📍 Mover Grupo Aquí</button>
            <button id="gmPinDeleteBtn" class="reject hidden" style="font-size:0.78rem">Eliminar</button>
          </div>
        </div>
        <div id="atlasGeoMapStage" class="world-map-stage full-atlas"></div>
      </div>

      <div class="canvas-wrap hidden" id="relAtlasWrap">
        <div class="rel-stage">
          <div class="rel-svg-box">
            <div class="row" style="justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border)">
              <div>
                <strong style="font-family:var(--display-font)">🤝 Red de Relaciones de Campaña</strong>
                <div class="muted" style="font-size:0.78rem">Alianzas, sospechas, devociones y rivalidades activas</div>
              </div>
              <button id="toggleProposeRelBtn" style="font-size:0.78rem">💡 Proponer Vínculo</button>
            </div>
            <div id="proposeRelForm" class="hidden" style="padding:12px 14px;border-bottom:1px solid var(--border);background:var(--bg-subtle)">
              <div class="grid-3">
                <input id="relSourceInput" list="vaultNodeTitlesList" type="text" placeholder="Personaje / Entidad A" />
                <select id="relKindSelect">
                  <option value="ally">🤝 Aliado</option>
                  <option value="rival_enemy">⚔️ Rival / Enemigo</option>
                  <option value="suspicion">👁️ Sospecha / Intriga</option>
                  <option value="patron_loyalty">✨ Devoción / Patrono</option>
                  <option value="mystery_blood">🩸 Vínculo / Misterio</option>
                </select>
                <input id="relTargetInput" list="vaultNodeTitlesList" type="text" placeholder="Personaje / Entidad B" />
              </div>
              <div class="row" style="margin-top:8px">
                <input id="relLabelInput" type="text" placeholder="Descripción del vínculo (ej: Sospecha trato secreto con Nyxara)" style="flex:1" />
                <button id="submitRelProposalBtn" class="primary">Enviar Sugerencia</button>
              </div>
            </div>
            <div id="relSvgContainer" style="width:100%;height:380px"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="card" style="padding:12px 14px">
              <strong style="font-family:var(--display-font)">Vínculos Registrados</strong>
              <div class="muted" style="font-size:0.78rem">Propuestas pendientes requieren confirmación del GM</div>
              <div id="relEdgeList" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;max-height:460px;overflow-y:auto"></div>
            </div>
          </div>
        </div>
      </div>
      <datalist id="vaultNodeTitlesList"></datalist>

      <aside id="mapDrawer" class="slide-drawer hidden">
        <div class="row" style="justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border)">
          <div>
            <strong id="drawerTitle" style="font-family:var(--display-font); font-size:1.1rem"></strong>
            <div id="drawerBadges" class="row" style="margin-top:4px"></div>
          </div>
          <div class="row">
            <button id="drawerOpenCodexBtn" class="primary" style="padding:4px 9px;font-size:0.8rem">Leer en Códice</button>
            <button id="drawerCloseBtn" style="padding:4px 9px;font-size:0.8rem">✕</button>
          </div>
        </div>
        <div id="drawerBody" class="slide-drawer-body md-body" style="font-size:0.95rem"></div>
      </aside>
    </section>

    <!-- VARIANTE C: MESA DE CAMPAÑA (Personaje + Escena FSM) -->
    <section id="variantC" class="layout-c hidden">
      <aside class="campaign-rail">
        <div class="card" id="campaignCharCard"></div>
        <div class="field-label" style="margin-top:4px">Lore Relevante a la Escena Actual</div>
        <div id="sceneRagList" style="display:flex; flex-direction:column; gap:8px"></div>
      </aside>
      <section class="scene-main">
        <div class="scene-shell">
          <div class="card" id="sceneSummary"></div>

          <!-- Tablero de Misiones y Rumores (Forien's Quest Log Manual) -->
          <div class="card" id="questBoardCard">
            <div class="row" style="justify-content:space-between;margin-bottom:10px">
              <div>
                <strong style="font-family:var(--display-font);font-size:1.15rem">📜 Tablero de Misiones y Rumores</strong>
                <div class="muted" style="font-size:0.8rem">Objetivos activos de campaña, misiones secundarias y rumores propuestos</div>
              </div>
              <div class="row">
                <button id="toggleProposeRumorBtn" style="font-size:0.8rem">💡 Proponer Rumor</button>
                <button id="gmToggleNewQuestBtn" class="gm-btn hidden" style="font-size:0.8rem">+ Nueva Misión</button>
              </div>
            </div>
            <div class="row" id="questFilterPills" style="margin-bottom:10px">
              <button class="sub-pill active" data-qfilter="all">Todas</button>
              <button class="sub-pill" data-qfilter="active">Activas</button>
              <button class="sub-pill" data-qfilter="proposed_rumor">Rumores / Sugerencias</button>
              <button class="sub-pill" data-qfilter="completed">Completadas</button>
            </div>
            <div id="proposeRumorBox" class="hidden" style="margin-bottom:12px;padding:12px;border-radius:11px;background:var(--bg-subtle);border:1px solid var(--border)">
              <div class="grid-2">
                <input id="rumorTitleInput" type="text" placeholder="Título del rumor o pista..." style="width:100%" />
                <input id="rumorLocInput" list="vaultNodeTitlesList" type="text" placeholder="Lugar o Nodo vinculado (opcional)" style="width:100%" />
              </div>
              <textarea id="rumorSummaryInput" style="margin-top:8px;min-height:60px" placeholder="Describe lo que escuchó o sospecha tu personaje..."></textarea>
              <div class="row" style="margin-top:8px">
                <button id="submitRumorBtn" class="primary">Enviar Rumor al DM</button>
                <span id="rumorFeedback" class="muted"></span>
              </div>
            </div>
            <div id="gmNewQuestBox" class="hidden" style="margin-bottom:12px;padding:12px;border-radius:11px;background:rgba(146,64,14,0.12);border:1px solid var(--gm)">
              <div class="grid-3">
                <input id="gmQuestTitleInput" type="text" placeholder="Título oficial de misión..." />
                <select id="gmQuestKindSelect">
                  <option value="main_quest">Misión Principal</option>
                  <option value="side_quest">Misión Secundaria</option>
                  <option value="rumor">Rumor</option>
                </select>
                <input id="gmQuestLocInput" list="vaultNodeTitlesList" type="text" placeholder="Ubicación vinculada" />
              </div>
              <textarea id="gmQuestSummaryInput" style="margin-top:8px;min-height:56px" placeholder="Descripción para los jugadores..."></textarea>
              <input id="gmQuestObjInput" type="text" style="width:100%;margin-top:6px" placeholder="Primer objetivo (opcional, ej: Hablar con el posadero)" />
              <div class="row" style="margin-top:8px">
                <button id="gmCreateQuestBtn" class="gm-btn">Crear Misión en Tablero</button>
              </div>
            </div>
            <div id="questBoardList" style="display:flex;flex-direction:column;gap:10px"></div>
          </div>

          <!-- Tirador Manual y Bitácora de Sesión -->
          <div class="card" id="manualDiceAndLogCard">
            <div class="row" style="justify-content:space-between;margin-bottom:8px">
              <strong style="font-family:var(--display-font);font-size:1.08rem">🎲 Mesa Manual — Tirador Rápido y Bitácora</strong>
              <span id="manualRollResultBadge" class="badge base hidden"></span>
            </div>
            <div id="quickSkillRollBar" class="row" style="margin-bottom:10px"></div>
            <div id="gmManualLogBox" class="hidden" style="margin:8px 0 12px;padding:10px 12px;border-radius:10px;background:rgba(146,64,14,0.12);border:1px solid var(--gm)">
              <div class="field-label">Anotar Evento en Bitácora Manual (Solo GM)</div>
              <div class="row">
                <input id="gmManualLogTitle" type="text" placeholder="Título breve de suceso..." style="flex:1" />
                <button id="gmAddManualLogBtn" class="gm-btn">Guardar Entrada</button>
              </div>
              <textarea id="gmManualLogBody" style="margin-top:6px;min-height:52px" placeholder="Resumen manual ocurrido en mesa..."></textarea>
            </div>
            <div class="field-label" style="margin-top:6px">Bitácora y Crónica de Sesión</div>
            <div id="turnHistoryList" style="margin-top:6px; display:flex; flex-direction:column; gap:8px"></div>
          </div>

          <!-- Archivo Discreto de Controles IA Bloqueados -->
          <details class="card" id="aiArchiveDetails">
            <summary style="cursor:pointer;font-size:0.84rem;color:var(--muted);font-weight:600">
              🔒 Módulo IA Generativa (Deshabilitado temporalmente — Modo 100% Manual Activo)
            </summary>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
              <div class="card" id="aiLockBanner" style="border-color:var(--gold); background:var(--bg-subtle)">
                <strong>🔒 Generación por IA Bloqueada — Modo 100% Manual Activo</strong>
                <div class="muted" style="font-size:0.84rem; margin-top:4px">
                  Las transiciones automáticas por LLM están desactivadas mientras perfeccionamos el códice, el mapa y la mesa.
                </div>
              </div>
              <div class="choice-grid" id="quickChoices"></div>
              <div>
                <label class="field-label" for="playerActionInput">Acción libre por IA (Bloqueada en Modo Manual)</label>
                <textarea id="playerActionInput" disabled placeholder="🔒 Generación automática por IA bloqueada temporalmente."></textarea>
              </div>
              <div class="row" style="justify-content:space-between">
                <div class="row">
                  <label class="muted" for="rollInput">Dado d20:</label>
                  <input id="rollInput" type="number" min="1" max="20" placeholder="Manual" disabled style="width:92px" />
                </div>
                <button id="stepBtn" class="primary" disabled title="Generación IA bloqueada temporalmente">🔒 Generación IA Bloqueada (Modo Manual)</button>
              </div>
              <div id="transitionOutput" class="card hidden"></div>
            </div>
          </details>
        </div>
      </section>
    </section>
  </main>

  <!-- Modal: Hoja de Personaje de Thyrenia, Aportaciones del Jugador y Exportación FoundryVTT -->
  <div id="playerSheetModal" class="modal-backdrop hidden">
    <div class="modal-dialog">
      <div class="modal-head">
        <div class="row">
          <strong id="sheetModalTitle" style="font-family:var(--display-font);font-size:1.12rem">Hoja de Personaje</strong>
          <div class="tabs" style="margin:0">
            <button class="tab-btn active" data-sheet-tab="sheet">Hoja de PJ &amp; Habilidades</button>
            <button class="tab-btn" data-sheet-tab="story">Añadir a mi Historia</button>
          </div>
        </div>
        <div class="row">
          <button id="exportFoundryBtn" class="approve" style="padding:5px 10px;font-size:0.82rem">⬇️ Exportar FoundryVTT JSON</button>
          <button id="closeSheetModalBtn">Cerrar ✕</button>
        </div>
      </div>
      <div class="modal-body">
        <div id="sheetTab-sheet">
          <div class="row" style="justify-content:space-between; margin-bottom:10px">
            <div id="sheetIdentityBadges" class="row"></div>
            <div id="sheetRollResult" class="badge base hidden"></div>
          </div>
          <div class="stat-strip" id="sheetAbilitiesStrip"></div>
          <div class="grid-2" style="margin-top:12px">
            <div class="card" style="padding:12px">
              <div class="row" style="justify-content:space-between">
                <strong>Puntos de Fortuna (Antimufa)</strong>
                <div class="row">
                  <button id="fortuneMinusBtn" style="padding:2px 8px">−</button>
                  <strong id="fortuneCountBadge" class="badge base">0</strong>
                  <button id="fortunePlusBtn" style="padding:2px 8px">+</button>
                </div>
              </div>
              <p class="muted" style="margin:6px 0 0;font-size:0.78rem">Permite repetir una tirada fallida. Gánalos actuando según tus Creencias.</p>
            </div>
            <div class="card" style="padding:12px">
              <div class="row" style="justify-content:space-between">
                <strong>Puntos de Destino (Milonga)</strong>
                <div class="row">
                  <button id="destinyMinusBtn" style="padding:2px 8px">−</button>
                  <strong id="destinyCountBadge" class="badge asimetrica">0</strong>
                  <button id="destinyPlusBtn" style="padding:2px 8px">+</button>
                </div>
              </div>
              <p class="muted" style="margin:6px 0 0;font-size:0.78rem">Éxito Crítico Asegurado o Engañar a la Muerte (1 PG al caer).</p>
            </div>
          </div>
          <div style="margin-top:12px">
            <div class="field-label">Las 11 Habilidades Consolidadas de Thyrenia (clic en 🎲 para tirar)</div>
            <div class="skills-grid" id="sheetSkillsGrid"></div>
          </div>
          <div class="grid-2" style="margin-top:12px">
            <div class="card" style="padding:12px">
              <div class="field-label">Creencias del Personaje</div>
              <div id="sheetBeliefsList"></div>
            </div>
            <div class="card" style="padding:12px">
              <div class="field-label">Defectos</div>
              <div id="sheetFlawsList"></div>
            </div>
          </div>
        </div>

        <div id="sheetTab-story" class="hidden">
          <p class="muted" style="margin-top:0">
            Redacta un recuerdo, diario desde el punto de vista de tu personaje, nuevo contacto o detalle de tu trasfondo. Se enviará de forma segura a la Bandeja de Aprobación del DM antes de integrarse en el Vault Maestro.
          </p>
          <div class="grid-2">
            <div>
              <label class="field-label" for="playerStoryTitle">Título de tu Entrada o Recuerdo</label>
              <input id="playerStoryTitle" type="text" placeholder="Ej: Carta a Kaelion desde la Posada" style="width:100%" />
            </div>
            <div>
              <label class="field-label" for="playerStoryTarget">Dónde guardarla</label>
              <select id="playerStoryTarget" style="width:100%">
                <option value="character">Diario / Archivo de mi Personaje</option>
                <option value="campaign">Crónica de la Campaña Activa</option>
              </select>
            </div>
          </div>
          <div style="margin-top:10px">
            <label class="field-label" for="playerStoryBody">Relato, Nota de Trasfondo e Ilustraciones (Markdown + [[Wikilinks]])</label>
            <div class="row" style="margin-bottom:8px;padding:8px 10px;border-radius:10px;background:var(--bg-subtle);border:1px solid var(--border)">
              <input id="storyUploadImageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" />
              <button id="storyUploadImageBtn" type="button" class="approve" style="padding:4px 9px;font-size:0.78rem">📤 Subir Mi Imagen</button>
              <select id="storyInsertImageSelect" style="max-width:165px;padding:4px 8px;font-size:0.78rem">
                <option value="">🖼️ Imagen del Vault...</option>
              </select>
              <button id="storyInsertImageBtn" type="button" style="padding:4px 8px;font-size:0.78rem">+ ![[Img]]</button>
              <select id="storyInsertSessionSelect" style="max-width:175px;padding:4px 8px;font-size:0.78rem">
                <option value="">⏳ Enlazar Sesión...</option>
              </select>
              <button id="storyInsertSessionBtn" type="button" style="padding:4px 8px;font-size:0.78rem">+ [[Sesión]]</button>
              <select id="storyInsertEventSelect" style="max-width:175px;padding:4px 8px;font-size:0.78rem">
                <option value="">🌙 Enlazar Evento...</option>
              </select>
              <button id="storyInsertEventBtn" type="button" style="padding:4px 8px;font-size:0.78rem">+ [[Evento]]</button>
              <input id="storyInsertNodeInput" list="vaultNodeTitlesList" type="text" placeholder="📖 Nodo de Lore..." style="width:140px;padding:4px 8px;font-size:0.78rem" />
              <button id="storyInsertNodeBtn" type="button" style="padding:4px 8px;font-size:0.78rem">+ [[Lore]]</button>
            </div>
            <textarea id="playerStoryBody" style="min-height:140px" placeholder="Escribe lo que vivió o recuerda tu personaje, inserta imágenes con ![[archivo.png]] o enlaza sesiones y festividades..."></textarea>
          </div>
          <div class="row" style="margin-top:10px">
            <button id="submitPlayerStoryBtn" class="primary">Enviar Propuesta al DM</button>
            <span id="playerStoryFeedback" class="muted"></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="lockToast" class="lock-toast hidden"></div>
  <div id="wikilinkPreviewCard" class="wikilink-preview-card hidden"></div>

  <script>
    const FONT_PRESETS = {
      'editorial-serif': "'Crimson Pro', Georgia, 'Palatino Linotype', serif",
      'modern-sans': "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
      'classic-lora': "'Lora', Georgia, 'Times New Roman', serif",
      'accessible-sans': "Verdana, Tahoma, 'Segoe UI', sans-serif",
      'arcane-mono': "'JetBrains Mono', Consolas, monospace",
    };

    const CATEGORY_ORDER = [
      'Personajes (PJs)',
      'Lore General y Cultura',
      'Cosmogonía y Origen',
      'Panteón Divino',
      'Geografía y Planos',
      'Reglas y Mecánicas',
      'Razas',
      'Clases',
      'Campañas',
      'Crónicas y Capítulos',
      'Otros',
    ];

    const SPHERE_CARDS = [
      {
        icon: '✨',
        title: 'Magia y Maná',
        desc: 'Cómo fluyen las Venas de Maná, el Aura y los límites de conjuros en Thyrenia.',
        category: 'Reglas y Mecánicas',
        preferredNodes: ['Maná', 'Magia en Thyrenia', 'Flujos de Maná (Venas de Maná)'],
      },
      {
        icon: '🌌',
        title: 'Cosmogonía y Origen',
        desc: 'El Vacío Eterno, Kronos y el nacimiento de los Planos de Thyrenia.',
        category: 'Cosmogonía y Origen',
        preferredNodes: ['Mitología de Thyrenia - Introducción', 'Historia de la Creación', 'Origen del Multiverso (Génesis de Thyrenia)'],
      },
      {
        icon: '☀️',
        title: 'Panteón Divino',
        desc: 'Dioses Primordiales, Mayores, Menores y cultos activos del mundo.',
        category: 'Panteón Divino',
        preferredNodes: ['Panteón de Thyrenia - Jerarquía y Visión General', 'Dioses', 'Dioses Primordiales'],
      },
      {
        icon: '🗺️',
        title: 'Geografía y Planos',
        desc: 'Continentes, reinos y fronteras entre el Plano Material, Sombras y Onírico.',
        category: 'Geografía y Planos',
        preferredNodes: ['Continentes de Thyrenia', 'Planos', 'Plano Material'],
      },
      {
        icon: '🛡️',
        title: 'Razas y Clases',
        desc: 'Linajes jugables y cómo Thyrenia transforma cada vocación heroica.',
        category: 'Clases',
        preferredNodes: ['Clases de Thyrenia - Consideraciones Generales', 'Razas de Thyrenia - Introducción', 'Clase - Hechicero'],
      },
      {
        icon: '📜',
        title: 'Tono y Vocabulario',
        desc: 'Inmersión lingüística, cultura y guía de estilo de Thyrenia.',
        category: 'Lore General y Cultura',
        preferredNodes: ['Thyrenia - Tono y Temática', 'Términos de Thyrenia', 'Frases de Thyrenia'],
      },
      {
        icon: '📚',
        title: 'Crónicas y Capítulos',
        desc: 'Capítulos narrados y relatos literarios de Thyrenia en formato de libro.',
        category: 'Crónicas y Capítulos',
        preferredNodes: ['Historia General', 'Capitulo 12', 'Capitulo 14'],
      },
    ];

    const CARD_TYPE_META = {
      character: { icon: '🧑', label: 'Personaje / PNJ' },
      location: { icon: '🏰', label: 'Lugar / Región' },
      faction: { icon: '🏴', label: 'Facción / Orden' },
      quest_clue: { icon: '🔍', label: 'Misión / Pista' },
      session: { icon: '🕰️', label: 'Sesión de Campaña' },
      chapter: { icon: '📖', label: 'Capítulo Narrado' },
      deity: { icon: '☀️', label: 'Deidad / Panteón' },
      rule_lore: { icon: '📜', label: 'Lore y Reglas' },
    };

    const PIN_KIND_ICONS = {
      continent: '🗺️',
      city: '🏘️',
      dungeon_ruin: '🏚️',
      temple: '⛩️',
      danger: '⚠️',
      landmark: '📌',
    };

    const THYRENIA_CONTINENT_PINS = [
      { id: 'Dracoria', label: 'Dracoria', x: 53, y: 19, region: 'Volcanes y Altas Cumbres del Norte' },
      { id: 'Evedia', label: 'Evedia', x: 22, y: 38, region: 'Bosques Occidentales y Ríos Silvanos' },
      { id: 'Avaloria', label: 'Avaloria', x: 80, y: 39, region: 'Nieveterna y Ciudadelas Orientales' },
      { id: 'Marisal', label: 'Marisal', x: 48, y: 50, region: 'Archipiélago Central de Thyrenia' },
      { id: 'Thornia', label: 'Thornia', x: 24, y: 73, region: 'Desiertos Dorados del Suroeste' },
      { id: 'Istoria', label: 'Istoria', x: 78, y: 78, region: 'Cordilleras y Cráteres de Forja' },
    ];

    const VARIANTS = ['A', 'B', 'C'];

    const state = {
      variant: 'A',
      atlasMode: 'graph',
      role: 'player',
      gmKey: '',
      campaignId: '',
      characterId: '',
      view: null,
      gmOverview: null,
      selectedNodeId: null,
      showPortal: true,
      timelineIndex: -1,
      astralSeason: 'all',
      astralMonthIndex: null,
      questFilter: 'all',
      gmMapClickMode: 'none',
      relFocusEntity: null,
      storyContextNodeId: null,
      filters: {
        query: '',
        layer: 'all',
        category: 'all',
        tag: 'all',
        scope: 'neighbors2',
      },
      collapsedCategories: new Set(),
      physicsRunning: true,
      simNodes: [],
      simEdges: [],
      simById: new Map(),
      camera: { x: 0, y: 0, zoom: 1 },
      hoverNode: null,
      dragNode: null,
      panStart: null,
      dragMoved: false,
    };

    function escapeHtml(text) {
      return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function getReadNodesSet() {
      try {
        const raw = localStorage.getItem('thyrenia_read_nodes');
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr.map((x) => String(x).toLowerCase()) : []);
      } catch {
        return new Set();
      }
    }

    function markNodeAsRead(nodeId) {
      if (!nodeId) return;
      const s = getReadNodesSet();
      s.add(String(nodeId).toLowerCase());
      try {
        localStorage.setItem('thyrenia_read_nodes', JSON.stringify(Array.from(s)));
      } catch {
        // Ignorar si almacenamiento está lleno
      }
    }

    function extractPlainExcerpt(rawMd, maxLen = 115) {
      const cleaned = String(rawMd || '')
        .replace(/!\\[\\[[^\\]]+\\]\\]/g, '')
        .replace(/!\\[[^\\]]*\\]\\([^)]+\\)/g, '')
        .replace(/\\[\\[([^\\]|]+)(?:\\|([^\\]]+))?\\]\\]/g, (_, t, a) => (a || t).trim())
        .replace(/[#>*_~\\-]{1,}/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
      if (!cleaned) return 'Explora este Nodo de Lore en el Códice...';
      return cleaned.length > maxLen ? cleaned.slice(0, maxLen).trim() + '...' : cleaned;
    }

    function resolveMediaUrl(rawRef) {
      if (!rawRef) return null;
      const base = String(rawRef).trim().replace(/\\\\/g, '/').split('/').pop() || '';
      if (!/\\.(jpe?g|png|webp|gif|svg)$/i.test(base)) return null;
      return '/api/vault/media?file=' + encodeURIComponent(base);
    }

    function resolveContextualArt(node, availableImages) {
      const avail = new Set((availableImages || []).map((x) => x.toLowerCase()));
      if (node.image && avail.has(node.image.toLowerCase())) {
        return { file: node.image, caption: 'Ilustración de ' + node.title };
      }
      const key = (node.title + ' ' + node.relativePath).toLowerCase();
      if (/continente|dracoria|evedia|avaloria|marisal|thornia|istoria|planos|mapa/i.test(key) && avail.has('image1.jpg')) {
        return { file: 'image1.jpg', caption: 'Atlas Cartográfico de Thyrenia' };
      }
      if (/g[ée]nesis|creaci[óo]n|introducci[óo]n|tono|pante[óo]n|dioses|kronos|thyrenia/i.test(key) && avail.has('image4.png')) {
        return { file: 'image4.png', caption: 'Guía Ilustrada de Thyrenia — by Ajoelotl' };
      }
      if (/raza|clase|hechicero|cl[ée]rigo|olivia|kaelion|personaje|aventurero/i.test(key) && avail.has('image2.png')) {
        return { file: 'image2.png', caption: 'Crónica de Exploradores de Thyrenia' };
      }
      return null;
    }

    function pickRandomUnreadNode() {
      if (!state.view || state.view.visibleNodes.length === 0) return;
      const readSet = getReadNodesSet();
      const unread = state.view.visibleNodes.filter((n) => !readSet.has(n.id.toLowerCase()));
      const pool = unread.length > 0 ? unread : state.view.visibleNodes;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      if (picked) selectNode(picked.id, true);
    }

    function classifyCategory(relativePath) {
      const p = String(relativePath || '');
      if (p.startsWith('03 - Archivos Externos') || p.includes('/Personajes/')) return 'Personajes (PJs)';
      if (p.includes('/Capitulos Narrados/')) return 'Crónicas y Capítulos';
      if (p.includes('/Cosmogonia/')) return 'Cosmogonía y Origen';
      if (p.includes('/Panteon Divino/')) return 'Panteón Divino';
      if (p.includes('/Geografia y Planos/')) return 'Geografía y Planos';
      if (p.includes('/Reglas y Mecanicas/')) return 'Reglas y Mecánicas';
      if (p.includes('/Razas/')) return 'Razas';
      if (p.includes('/Clases/')) return 'Clases';
      if (p.startsWith('01 - Campanas/')) return 'Campañas';
      if (p.startsWith('00 - Lore Central')) return 'Lore General y Cultura';
      return 'Otros';
    }

    function layerLabel(layer) {
      if (layer === 'asimetrica') return 'Capa Asimétrica';
      if (layer === 'progresiva') return 'Capa Progresiva';
      if (layer === 'dm_secret') return 'Secreto DM';
      return 'Capa Base';
    }

    function getCanvasPalette() {
      const theme = document.body.getAttribute('data-theme') || 'arcana';
      if (theme === 'light-parchment') {
        return {
          bg: '#f2ece0',
          grid: 'rgba(148, 163, 184, 0.16)',
          edge: 'rgba(100, 116, 139, 0.34)',
          edgeHot: 'rgba(3, 105, 161, 0.85)',
          pillBg: 'rgba(255, 253, 248, 0.92)',
          pillText: '#0f172a',
          ring: '#0f172a',
          base: '#0284c7',
          asimetrica: '#7e22ce',
          progresiva: '#047857',
        };
      }
      return {
        bg: '#060a14',
        grid: 'rgba(56, 189, 248, 0.06)',
        edge: 'rgba(148, 163, 184, 0.22)',
        edgeHot: 'rgba(56, 189, 248, 0.88)',
        pillBg: 'rgba(15, 23, 42, 0.88)',
        pillText: '#f8fafc',
        ring: '#ffffff',
        base: '#38bdf8',
        asimetrica: '#c084fc',
        progresiva: '#34d399',
      };
    }

    async function fetchJson(url, options = {}) {
      const headers = { ...(options.headers || {}) };
      if (state.gmKey) headers['x-thyrenia-gm-key'] = state.gmKey;
      const res = await fetch(url, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en petición');
      return data;
    }

    // === Tipografía y Tema Persistentes ===
    function applyTypographyPrefs() {
      const familyKey = localStorage.getItem('thyrenia_font') || 'editorial-serif';
      const sizeVal = localStorage.getItem('thyrenia_size') || '19px';
      const themeVal = localStorage.getItem('thyrenia_theme') || 'arcana';

      document.getElementById('fontFamilySelect').value = familyKey;
      document.getElementById('fontSizeSelect').value = sizeVal;
      document.getElementById('themeSelect').value = themeVal;

      document.documentElement.style.setProperty('--reader-font', FONT_PRESETS[familyKey] || FONT_PRESETS['editorial-serif']);
      document.documentElement.style.setProperty('--reader-size', sizeVal);
      document.body.setAttribute('data-theme', themeVal);

      const quickBtn = document.getElementById('quickThemeBtn');
      quickBtn.textContent = themeVal === 'light-parchment' ? '🌙 Oscuro' : '☀️ Claro';
    }

    function saveTypographyPrefs() {
      localStorage.setItem('thyrenia_font', document.getElementById('fontFamilySelect').value);
      localStorage.setItem('thyrenia_size', document.getElementById('fontSizeSelect').value);
      localStorage.setItem('thyrenia_theme', document.getElementById('themeSelect').value);
      applyTypographyPrefs();
    }

    // === Renderizador Markdown Completo (seguro contra XSS + Imágenes de Obsidian) ===
    const BACKTICK = String.fromCharCode(96);
    const CODE_FENCE = BACKTICK + BACKTICK + BACKTICK;
    const INLINE_CODE_REGEX = new RegExp(BACKTICK + '([^' + BACKTICK + ']+)' + BACKTICK, 'g');

    function findSessionByWikilink(rawTarget) {
      const entries = state.view?.plotTimeline?.entries || [];
      const cleaned = String(rawTarget || '').trim().replace(/^sesi[oó]n\\s*:/i, '').trim().toLowerCase();
      if (!cleaned) return null;
      return entries.find((e) => {
        if (e.kind === 'upcoming') return false;
        const baseFile = e.sourceNoteRelativePath
          ? e.sourceNoteRelativePath.split('/').pop().replace(/\\.md$/i, '').toLowerCase()
          : '';
        return (
          e.id.toLowerCase() === cleaned ||
          e.title.toLowerCase() === cleaned ||
          e.sessionTag.toLowerCase() === cleaned ||
          (baseFile && baseFile === cleaned)
        );
      }) || null;
    }

    function findCosmicEventByWikilink(rawTarget) {
      const wheel = state.view?.plotTimeline?.cosmicWheel || [];
      const cleaned = String(rawTarget || '').trim().replace(/^evento\\s*:/i, '').trim().toLowerCase();
      if (!cleaned) return null;
      for (const month of wheel) {
        for (const fest of month.festivals || []) {
          if (fest.id.toLowerCase() === cleaned || fest.name.toLowerCase() === cleaned) {
            return { festival: fest, month };
          }
        }
      }
      return null;
    }

    function formatInlineMarkdown(rawText, visibleMap) {
      const tokens = [];
      const stash = (htmlFrag) => {
        const key = 'THYRENIATOK' + tokens.length + 'ENDTOK';
        tokens.push(htmlFrag);
        return key;
      };

      let s = escapeHtml(rawText);

      // 1. Embeds de imagen Obsidian ![[imagen.jpg|leyenda]]
      s = s.replace(/!\\[\\[([^\\]|]+)(?:\\|([^\\]]+))?\\]\\]/g, (full, target, caption) => {
        const mediaUrl = resolveMediaUrl(target);
        if (!mediaUrl) return full;
        const cleanCap = caption ? caption.trim() : target.split('/').pop();
        return stash(
          '<figure class="lore-figure"><img src="' + escapeHtml(mediaUrl) + '" alt="' + escapeHtml(cleanCap) + '" loading="lazy" />' +
          (caption ? '<figcaption>' + escapeHtml(cleanCap) + '</figcaption>' : '') +
          '</figure>',
        );
      });

      // 2. Imágenes Markdown locales ![alt](ruta.png)
      s = s.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, (full, alt, href) => {
        const mediaUrl = resolveMediaUrl(href);
        if (!mediaUrl) return full;
        const cleanCap = alt ? alt.trim() : '';
        return stash(
          '<figure class="lore-figure"><img src="' + escapeHtml(mediaUrl) + '" alt="' + escapeHtml(cleanCap || 'Ilustración') + '" loading="lazy" />' +
          (cleanCap ? '<figcaption>' + escapeHtml(cleanCap) + '</figcaption>' : '') +
          '</figure>',
        );
      });

      // 3. Código en línea
      s = s.replace(INLINE_CODE_REGEX, (_, code) => stash('<code>' + code + '</code>'));

      // 4. Wikilinks [[Destino|Alias]] (Nodos de Lore, Sesiones de Campaña y Eventos Cósmicos)
      s = s.replace(/\\[\\[([^\\]|#]+)(?:#[^\\]|]+)?(?:\\|([^\\]]+))?\\]\\]/g, (_, target, alias) => {
        const cleanTarget = target.trim();
        const label = (alias || cleanTarget).trim();
        const found = visibleMap.get(cleanTarget.toLowerCase());
        if (found) {
          return stash('<button class="wikilink-btn" data-node-id="' + escapeHtml(found.id) + '">📖 ' + label + '</button>');
        }
        const matchedSession = findSessionByWikilink(cleanTarget);
        if (matchedSession) {
          return stash('<button class="wikilink-btn" data-session-id="' + escapeHtml(matchedSession.id) + '">⏳ ' + label + '</button>');
        }
        const matchedEvent = findCosmicEventByWikilink(cleanTarget);
        if (matchedEvent) {
          return stash('<button class="wikilink-btn" data-cosmic-event="' + escapeHtml(matchedEvent.festival.name) + '">🌙 ' + label + '</button>');
        }
        const lockInfo = state.view?.lockReasons?.[cleanTarget.toLowerCase()];
        if (lockInfo?.status === 'asimetrica') {
          return stash('<button class="wikilink-btn wikilink-locked" data-lock-msg="' + escapeHtml(lockInfo.criteria) + '" title="' + escapeHtml(lockInfo.criteria) + '">🔮 ' + label + '</button>');
        }
        if (lockInfo?.status === 'progresiva') {
          return stash('<button class="wikilink-btn wikilink-locked" data-lock-msg="' + escapeHtml(lockInfo.criteria) + '" title="' + escapeHtml(lockInfo.criteria) + '">🗺️ ' + label + '</button>');
        }
        const missingMsg = 'Concepto mencionado en el lore que aún no tiene una nota dedicada en el Vault Maestro.';
        return stash('<button class="wikilink-btn wikilink-locked" data-lock-msg="' + missingMsg + '" title="' + missingMsg + '">📝 ' + label + '</button>');
      });

      // 5. Énfasis Markdown
      s = s.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
      s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
      s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
      s = s.replace(/(^|[\\s(>])\\*([^*\\n]+)\\*(?=[\\s.,;:!?)<]|$)/g, '$1<em>$2</em>');

      return s.replace(/THYRENIATOK(\\d+)ENDTOK/g, (_, idx) => tokens[Number(idx)] || '');
    }

    function isTableSeparator(line) {
      return /^\\|?[\\s:-]+\\|[\\s|:-]*$/.test(line.trim());
    }

    function splitTableRow(line) {
      return line.trim().replace(/^\\|/, '').replace(/\\|$/, '').split('|').map((c) => c.trim());
    }

    function renderMarkdownToHtml(rawMarkdown, visibleMap, nodeTitle) {
      const lines = String(rawMarkdown || '').replace(/\\r\\n/g, '\\n').split('\\n');
      const html = [];
      const toc = [];
      let i = 0;

      while (i < lines.length && i < 8) {
        const t = lines[i].trim();
        if (!t || /^\\d{4}-\\d{2}-\\d{2}(\\s+\\d{2}:\\d{2})?$/.test(t) || /^Status:\\s*$/i.test(t) || /^Tags:\\s*/i.test(t)) {
          i++;
          continue;
        }
        break;
      }

      let skippedFirstDupTitle = false;

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) { i++; continue; }

        if (trimmed.startsWith(CODE_FENCE)) {
          i++;
          const codeLines = [];
          while (i < lines.length && !lines[i].trim().startsWith(CODE_FENCE)) {
            codeLines.push(escapeHtml(lines[i]));
            i++;
          }
          i++;
          html.push('<pre><code>' + codeLines.join('\\n') + '</code></pre>');
          continue;
        }

        if (/^(-{3,}|\\*{3,})$/.test(trimmed)) {
          html.push('<hr class="md-hr" />');
          i++;
          continue;
        }

        const headingMatch = trimmed.match(/^(#{1,4})\\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2].trim();
          const normH = text.toLowerCase();
          if (!skippedFirstDupTitle && level === 1 && (normH === String(nodeTitle || '').toLowerCase() || normH === 'lore')) {
            skippedFirstDupTitle = true;
            i++;
            continue;
          }
          skippedFirstDupTitle = true;
          const secId = 'sec-' + toc.length;
          toc.push({ level, text, id: secId });
          html.push('<h' + level + ' id="' + secId + '">' + formatInlineMarkdown(text, visibleMap) + '</h' + level + '>');
          i++;
          continue;
        }

        if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
          const headers = splitTableRow(trimmed);
          i += 2;
          const rows = [];
          while (i < lines.length && lines[i].trim().includes('|')) {
            rows.push(splitTableRow(lines[i]));
            i++;
          }
          let tableHtml = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
          for (const h of headers) tableHtml += '<th>' + formatInlineMarkdown(h, visibleMap) + '</th>';
          tableHtml += '</tr></thead><tbody>';
          for (const r of rows) {
            tableHtml += '<tr>';
            for (let c = 0; c < headers.length; c++) {
              tableHtml += '<td>' + formatInlineMarkdown(r[c] || '', visibleMap) + '</td>';
            }
            tableHtml += '</tr>';
          }
          tableHtml += '</tbody></table></div>';
          html.push(tableHtml);
          continue;
        }

        if (trimmed.startsWith('>')) {
          const quoteLines = [];
          while (i < lines.length && lines[i].trim().startsWith('>')) {
            quoteLines.push(formatInlineMarkdown(lines[i].trim().replace(/^>\\s?/, ''), visibleMap));
            i++;
          }
          html.push('<blockquote class="md-quote">' + quoteLines.join('<br/>') + '</blockquote>');
          continue;
        }

        if (/^[-*+]\\s+/.test(trimmed) || /^\\d+\\.\\s+/.test(trimmed)) {
          const isOrdered = /^\\d+\\.\\s+/.test(trimmed);
          const tag = isOrdered ? 'ol' : 'ul';
          const items = [];
          while (i < lines.length) {
            const cur = lines[i].trim();
            if (!cur) break;
            const ulM = cur.match(/^[-*+]\\s+(.+)$/);
            const olM = cur.match(/^\\d+\\.\\s+(.+)$/);
            if (!ulM && !olM) break;
            items.push('<li>' + formatInlineMarkdown((ulM || olM)[1], visibleMap) + '</li>');
            i++;
          }
          html.push('<' + tag + '>' + items.join('') + '</' + tag + '>');
          continue;
        }

        const paraLines = [];
        while (i < lines.length) {
          const cur = lines[i].trim();
          if (!cur || cur.startsWith('#') || cur.startsWith('>') || cur.startsWith(CODE_FENCE) || /^[-*+]\\s+/.test(cur) || /^\\d+\\.\\s+/.test(cur) || /^(-{3,}|\\*{3,})$/.test(cur)) {
            break;
          }
          if (cur.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) break;
          paraLines.push(formatInlineMarkdown(cur, visibleMap));
          i++;
        }
        if (paraLines.length > 0) {
          html.push('<p>' + paraLines.join(' ') + '</p>');
        }
      }

      if (html.length === 0) {
        return { html: '<p class="muted">(Esta nota aún no tiene contenido público redactado.)</p>', toc };
      }
      return { html: html.join('\\n'), toc };
    }

    // === Conmutador de Variantes (prototype/UI.md) y Modo Cartográfico ===
    function setAtlasMode(nextMode) {
      const m = nextMode === 'geo' ? 'geo' : (nextMode === 'relations' ? 'relations' : 'graph');
      state.atlasMode = m;
      document.getElementById('canvasWrap').classList.toggle('hidden', m !== 'graph');
      document.getElementById('geoAtlasWrap').classList.toggle('hidden', m !== 'geo');
      document.getElementById('relAtlasWrap').classList.toggle('hidden', m !== 'relations');
      document.getElementById('graphFilterControls').classList.toggle('hidden', m !== 'graph');
      document.getElementById('atlasModeGraphBtn').classList.toggle('primary', m === 'graph');
      document.getElementById('atlasModeGeoBtn').classList.toggle('primary', m === 'geo');
      document.getElementById('atlasModeRelBtn').classList.toggle('primary', m === 'relations');
      if (m !== 'graph') {
        document.getElementById('mapDrawer').classList.add('hidden');
      }
      if (m === 'geo' && state.view) {
        renderInteractiveWorldMap(document.getElementById('atlasGeoMapStage'), state.view, true);
      }
      if (m === 'relations' && state.view) {
        renderRelationshipWeb(state.view);
      }
    }

    function setUiVariant(nextVariant) {
      const v = VARIANTS.includes(nextVariant) ? nextVariant : 'A';
      state.variant = v;

      document.getElementById('variantA').classList.toggle('hidden', v !== 'A');
      document.getElementById('variantB').classList.toggle('hidden', v !== 'B');
      document.getElementById('variantC').classList.toggle('hidden', v !== 'C');

      document.querySelectorAll('.proto-pill').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.variant === v);
      });

      const url = new URL(window.location.href);
      url.searchParams.set('variant', v);
      window.history.replaceState({}, '', url.toString());

      if (v === 'B') {
        rebuildGraphData(true);
        if (state.atlasMode === 'geo' && state.view) {
          renderInteractiveWorldMap(document.getElementById('atlasGeoMapStage'), state.view, true);
        } else if (state.atlasMode === 'relations' && state.view) {
          renderRelationshipWeb(state.view);
        }
      }
    }

    function cycleVariant(delta) {
      const idx = VARIANTS.indexOf(state.variant);
      const nextIdx = (idx + delta + VARIANTS.length) % VARIANTS.length;
      setUiVariant(VARIANTS[nextIdx]);
    }

    // === Filtrado y Jerarquía ===
    function getFilteredNodes() {
      if (!state.view) return [];
      const q = state.filters.query.trim().toLowerCase();
      return state.view.visibleNodes.filter((n) => {
        if (state.filters.layer !== 'all' && n.layer !== state.filters.layer) return false;
        const cat = classifyCategory(n.relativePath);
        if (state.filters.category !== 'all' && cat !== state.filters.category) return false;
        if (state.filters.tag !== 'all' && !(n.tags || []).includes(state.filters.tag)) return false;
        if (q) {
          const hay = (n.title + ' ' + n.relativePath + ' ' + (n.tags || []).join(' ') + ' ' + n.sanitizedContent).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }

    function populateFilterDropdowns(view) {
      const catSelect = document.getElementById('categoryFilter');
      const prevCat = state.filters.category;
      const catsPresent = new Set(view.visibleNodes.map((n) => classifyCategory(n.relativePath)));
      catSelect.innerHTML = '<option value="all">Todas las Categorías</option>';
      for (const c of CATEGORY_ORDER) {
        if (catsPresent.has(c)) {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          catSelect.appendChild(opt);
        }
      }
      catSelect.value = catsPresent.has(prevCat) ? prevCat : 'all';
      state.filters.category = catSelect.value;

      const tagSelect = document.getElementById('tagFilter');
      const prevTag = state.filters.tag;
      const tagSet = new Set();
      for (const n of view.visibleNodes) {
        for (const t of n.tags || []) tagSet.add(t);
      }
      tagSelect.innerHTML = '<option value="all">Todas las Etiquetas</option>';
      Array.from(tagSet).sort().forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = '#' + t;
        tagSelect.appendChild(opt);
      });
      tagSelect.value = tagSet.has(prevTag) ? prevTag : 'all';
      state.filters.tag = tagSelect.value;
    }

    function getNodeHierarchyWeight(node) {
      const t = node.title.toLowerCase();
      const p = node.relativePath.toLowerCase();
      let rank = 50;
      if (t.includes('introducción') || t.includes('jerarquía') || t.includes('consideraciones generales') || t.includes('visión general') || t === 'dioses' || t === 'planos' || t === 'clases' || t === 'maná' || t === 'calendario de thyrenia') {
        rank = 0;
      } else if (t.includes('tono y temática') || t.includes('términos de thyrenia') || t.includes('continentes de thyrenia')) {
        rank = 5;
      } else if (p.includes('01 - dioses primordiales')) rank = 10;
      else if (p.includes('02 - dioses mayores')) rank = 20;
      else if (p.includes('03 - dioses menores')) rank = 30;
      else if (p.includes('iglesias y cultos')) rank = 40;
      return rank;
    }

    function getSubfolderBadge(relativePath) {
      const parts = String(relativePath || '').split('/');
      if (parts.length < 3) return '';
      const folder = parts[parts.length - 2].replace(/^\\d+\\s*-\\s*/, '');
      return folder.length > 2 && folder.length <= 22 ? folder : '';
    }

    function renderHierarchyTree() {
      const container = document.getElementById('hierarchyTree');
      const filtered = getFilteredNodes();
      document.getElementById('visibleCountLabel').textContent = filtered.length + ' notas';
      const readSet = getReadNodesSet();

      if (filtered.length === 0) {
        container.innerHTML = '<div class="muted" style="padding:12px">Ningún Nodo de Lore coincide con los filtros.</div>';
        return;
      }

      const groups = new Map();
      for (const n of filtered) {
        const cat = classifyCategory(n.relativePath);
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(n);
      }

      container.innerHTML = '';
      for (const cat of CATEGORY_ORDER) {
        const list = groups.get(cat);
        if (!list || list.length === 0) continue;
        list.sort((a, b) => {
          const wa = getNodeHierarchyWeight(a);
          const wb = getNodeHierarchyWeight(b);
          if (wa !== wb) return wa - wb;
          const sa = getSubfolderBadge(a.relativePath);
          const sb = getSubfolderBadge(b.relativePath);
          if (sa !== sb) return sa.localeCompare(sb);
          return a.title.localeCompare(b.title);
        });

        const isCollapsed = state.collapsedCategories.has(cat) && !state.filters.query;
        const groupEl = document.createElement('div');
        groupEl.className = 'cat-group';

        const headerBtn = document.createElement('button');
        headerBtn.className = 'cat-header';
        headerBtn.innerHTML = '<span>' + (isCollapsed ? '▸ ' : '▾ ') + escapeHtml(cat) + '</span><span class="badge">' + list.length + '</span>';
        headerBtn.onclick = () => {
          if (state.collapsedCategories.has(cat)) state.collapsedCategories.delete(cat);
          else state.collapsedCategories.add(cat);
          renderHierarchyTree();
        };
        groupEl.appendChild(headerBtn);

        if (!isCollapsed) {
          const itemsEl = document.createElement('div');
          itemsEl.className = 'cat-items';
          let lastSub = null;
          for (const n of list) {
            const sub = getSubfolderBadge(n.relativePath);
            if (sub && sub !== lastSub) {
              const subEl = document.createElement('div');
              subEl.className = 'tree-subhead';
              subEl.textContent = sub;
              itemsEl.appendChild(subEl);
            }
            lastSub = sub;

            const isUnread = !readSet.has(n.id.toLowerCase());
            const btn = document.createElement('button');
            btn.className = 'tree-node-btn' + (isUnread ? ' is-unread' : '') + (!state.showPortal && n.id === state.selectedNodeId ? ' selected' : '');
            btn.innerHTML =
              '<span class="tree-node-title">' + escapeHtml(n.title) + '</span>' +
              '<span class="dot ' + escapeHtml(n.layer) + '" title="' + layerLabel(n.layer) + '"></span>';
            btn.onclick = () => selectNode(n.id, true);
            itemsEl.appendChild(btn);
          }
          groupEl.appendChild(itemsEl);
        }
        container.appendChild(groupEl);
      }
    }

    function updateReadProgressBadge(view) {
      const readSet = getReadNodesSet();
      const total = view.visibleNodes.length;
      const readCount = view.visibleNodes.filter((n) => readSet.has(n.id.toLowerCase())).length;
      document.getElementById('readProgressBadge').textContent = 'Leídos: ' + readCount + '/' + total;
    }

    function toggleIndexDrawer(forceOpen) {
      const rail = document.getElementById('navRail');
      const backdrop = document.getElementById('navBackdrop');
      const isOpen = typeof forceOpen === 'boolean' ? forceOpen : !rail.classList.contains('drawer-open');
      rail.classList.toggle('drawer-open', isOpen);
      backdrop.classList.toggle('hidden', !isOpen);
      if (isOpen) {
        setTimeout(() => document.getElementById('ragQuery').focus(), 40);
      }
    }

    function inspectMapPin(pin, view) {
      const visibleMap = new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      const targetId = (pin.linkedNodeId || pin.label || pin.id).toLowerCase();
      const hit = pin.fogState === 'discovered' ? visibleMap.get(targetId) : null;
      const lockInfo = !hit ? view.lockReasons?.[targetId] : null;

      const badge = document.getElementById('inspectorBadge');
      const titleEl = document.getElementById('inspectorTitle');
      const regionEl = document.getElementById('inspectorRegion');
      const excerptEl = document.getElementById('inspectorExcerpt');
      const openBtn = document.getElementById('inspectorOpenBtn');

      titleEl.textContent = (PIN_KIND_ICONS[pin.pinKind] || '📍') + ' ' + pin.label;
      regionEl.textContent = pin.region || 'Thyrenia';

      if (pin.fogState === 'secret') {
        badge.className = 'badge dm_secret';
        badge.textContent = '👁️‍🗨️ Pin Secreto (Solo GM)';
        excerptEl.textContent = pin.rumorTeaser || 'Enclave oculto al 100% para todos los jugadores en la Niebla de Guerra.';
        if (pin.linkedNodeId && visibleMap.has(pin.linkedNodeId.toLowerCase())) {
          openBtn.classList.remove('hidden');
          openBtn.textContent = 'Abrir Card →';
          openBtn.onclick = () => selectNode(pin.linkedNodeId, true);
        } else {
          openBtn.classList.add('hidden');
        }
        return;
      }

      if (pin.fogState === 'rumor') {
        badge.className = 'badge gm';
        badge.textContent = '💭 Rumor / Indicio';
        excerptEl.textContent = (pin.rumorTeaser || 'Tu personaje escuchó menciones vagas de este lugar.') +
          (pin.unlockCriteria ? ' — Requisito: ' + pin.unlockCriteria : '');
        openBtn.classList.add('hidden');
        return;
      }

      if (hit) {
        badge.className = 'badge ' + escapeHtml(hit.layer);
        badge.textContent = layerLabel(hit.layer) + ' · Descubierto';
        excerptEl.textContent = extractPlainExcerpt(hit.sanitizedContent, 200);
        openBtn.classList.remove('hidden');
        openBtn.textContent = hit.isSkeleton
          ? 'Abrir Card (✍️ Por completar) →'
          : 'Explorar Crónica de ' + pin.label + ' →';
        openBtn.onclick = () => selectNode(hit.id, true);
      } else {
        badge.className = 'badge ' + escapeHtml(lockInfo?.status || 'base');
        badge.textContent = lockInfo ? '🔒 Territorio en la Niebla' : '📍 Punto Descubierto';
        excerptEl.textContent = pin.rumorTeaser || lockInfo?.criteria || ('Enclave conocido en ' + (pin.region || 'Thyrenia') + '.');
        openBtn.classList.add('hidden');
      }
    }

    function openGmPinEditor(pinData) {
      const pop = document.getElementById('gmPinPopover');
      pop.classList.remove('hidden');
      document.getElementById('gmPinPopoverTitle').textContent = pinData.id ? 'Editar Pin: ' + pinData.label : 'Nuevo Pin en Mapa';
      document.getElementById('gmPinIdInput').value = pinData.id || '';
      document.getElementById('gmPinLabelInput').value = pinData.label || '';
      document.getElementById('gmPinKindSelect').value = pinData.pinKind || 'city';
      document.getElementById('gmPinFogSelect').value = pinData.fogState || 'discovered';
      document.getElementById('gmPinCoordsInput').value = pinData.x.toFixed(1) + '% , ' + pinData.y.toFixed(1) + '%';
      pop.dataset.pinX = String(pinData.x);
      pop.dataset.pinY = String(pinData.y);
      document.getElementById('gmPinNodeInput').value = pinData.linkedNodeId || '';
      document.getElementById('gmPinRumorInput').value = pinData.rumorTeaser || '';
      document.getElementById('gmPinDeleteBtn').classList.toggle('hidden', !pinData.id);
    }

    function renderInteractiveWorldMap(containerEl, view, openInDrawer) {
      const avail = new Set((view.availableImages || []).map((x) => x.toLowerCase()));
      if (!avail.has('image1.jpg')) {
        containerEl.innerHTML = '<div style="padding:28px;text-align:center" class="muted">Coloca el mapa ilustrado <code>image1.jpg</code> en la carpeta <code>/images</code> del Vault Maestro para activar la cartografía interactiva.</div>';
        return;
      }

      const visibleMap = new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      containerEl.innerHTML =
        '<div class="world-map-inner" style="position:relative">' +
        '<img class="world-map-img" src="/api/vault/media?file=image1.jpg" alt="Mapa Cartográfico de Thyrenia" />' +
        '</div>';

      const inner = containerEl.querySelector('.world-map-inner');
      const imgEl = inner.querySelector('img.world-map-img');

      if (openInDrawer && state.role === 'gm') {
        imgEl.style.cursor = state.gmMapClickMode === 'none' ? 'default' : 'crosshair';
        imgEl.onclick = async (evt) => {
          if (state.gmMapClickMode === 'none') return;
          const rect = imgEl.getBoundingClientRect();
          const xPct = Number((((evt.clientX - rect.left) / rect.width) * 100).toFixed(1));
          const yPct = Number((((evt.clientY - rect.top) / rect.height) * 100).toFixed(1));
          if (state.gmMapClickMode === 'party') {
            const label = window.prompt('Nombre de la ubicación actual del Grupo:', view.sceneState?.locationNodeId || 'Posición Actual') || view.sceneState?.locationNodeId || 'Posición Actual';
            await fetchJson('/api/gm/map/party-position', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId: state.campaignId, label, x: xPct, y: yPct }),
            });
            state.gmMapClickMode = 'none';
            document.getElementById('gmMapModeHint').textContent = 'Posición del Grupo actualizada.';
            await loadView();
            return;
          }
          if (state.gmMapClickMode === 'pin') {
            openGmPinEditor({ id: '', label: '', x: xPct, y: yPct, pinKind: 'city', fogState: 'discovered' });
          }
        };
      }

      const activePins = (state.role === 'gm' && state.gmOverview?.allMapPins)
        ? state.gmOverview.allMapPins
        : (view.mapPins || []);

      let lastInspectedId = null;
      for (const pin of activePins) {
        const linkedLower = (pin.linkedNodeId || pin.label || '').toLowerCase();
        const hit = pin.fogState === 'discovered' ? visibleMap.get(linkedLower) : null;
        const btn = document.createElement('button');
        const fogCls = pin.fogState === 'secret' ? ' secret-pin' : (pin.fogState === 'rumor' ? ' rumor-pin' : '');
        btn.className = 'map-pin' + fogCls;
        btn.style.left = pin.x + '%';
        btn.style.top = pin.y + '%';
        btn.title = pin.fogState === 'rumor'
          ? ('💭 Rumor: ' + (pin.rumorTeaser || pin.label))
          : pin.fogState === 'secret'
            ? ('👁️‍🗨️ Secreto GM: ' + pin.label)
            : (pin.label + (pin.region ? ' — ' + pin.region : ''));

        const kindIcon = PIN_KIND_ICONS[pin.pinKind] || '📍';
        const suffix = pin.fogState === 'rumor' ? ' 💭' : (pin.fogState === 'secret' ? ' 👁️' : '');
        btn.innerHTML =
          '<span class="map-pin-dot"></span><span>' +
          (pin.pinKind !== 'continent' ? kindIcon + ' ' : '') +
          escapeHtml(pin.label) + suffix + '</span>';

        btn.onmouseenter = () => {
          if (!openInDrawer) {
            inspectMapPin(pin, view);
          }
        };
        btn.onclick = () => {
          if (openInDrawer && state.role === 'gm' && state.gmMapClickMode === 'pin') {
            openGmPinEditor(pin);
            return;
          }
          if (!openInDrawer && lastInspectedId !== pin.id) {
            lastInspectedId = pin.id;
            inspectMapPin(pin, view);
            return;
          }
          if (pin.fogState === 'rumor') {
            showLockToast((pin.rumorTeaser || ('Rumor sobre "' + pin.label + '"')) + (pin.unlockCriteria ? ' — ' + pin.unlockCriteria : ''));
            return;
          }
          if (hit) {
            if (state.variant === 'B') setUiVariant('A');
            selectNode(hit.id, true);
          } else {
            inspectMapPin(pin, view);
            showLockToast(pin.unlockCriteria || (pin.label + ': enclave sin crónica completa aún.'));
          }
        };
        inner.appendChild(btn);
      }

      if (view.partyPosition) {
        const pp = view.partyPosition;
        const pBtn = document.createElement('button');
        pBtn.className = 'map-pin party-marker';
        pBtn.style.left = pp.x + '%';
        pBtn.style.top = pp.y + '%';
        pBtn.title = 'El Grupo está aquí: ' + pp.label;
        pBtn.innerHTML = '<span class="map-pin-dot"></span><span>📍 Grupo: ' + escapeHtml(pp.label) + '</span>';
        pBtn.onclick = () => {
          if (pp.linkedNodeId && visibleMap.has(pp.linkedNodeId.toLowerCase())) {
            if (state.variant === 'B') setUiVariant('A');
            selectNode(pp.linkedNodeId, true);
          } else {
            showLockToast('📍 Posición actual del grupo: ' + pp.label);
          }
        };
        inner.appendChild(pBtn);
      }
    }

    function openSphereGallery(sp, view, activeSub = 'all') {
      const section = document.getElementById('sphereGallerySection');
      section.classList.remove('hidden');
      document.querySelectorAll('.sphere-card').forEach((card) => {
        card.classList.toggle('active-sphere', card.dataset.sphereTitle === sp.title);
      });

      document.getElementById('sphereGalleryTitle').textContent = sp.icon + ' ' + sp.title;
      document.getElementById('sphereGalleryDesc').textContent = sp.desc;

      const nodes = view.visibleNodes
        .filter((n) => classifyCategory(n.relativePath) === sp.category)
        .sort((a, b) => {
          const wa = getNodeHierarchyWeight(a);
          const wb = getNodeHierarchyWeight(b);
          if (wa !== wb) return wa - wb;
          return a.title.localeCompare(b.title);
        });

      const visibleMap = new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      let introNode = null;
      for (const pref of sp.preferredNodes) {
        const hit = visibleMap.get(pref.toLowerCase());
        if (hit) { introNode = hit; break; }
      }
      if (!introNode) introNode = nodes[0] || null;
      const introBtn = document.getElementById('sphereIntroBtn');
      introBtn.classList.toggle('hidden', !introNode);
      if (introNode) {
        introBtn.onclick = () => selectNode(introNode.id, true);
      }

      const subList = Array.from(new Set(nodes.map((n) => getSubfolderBadge(n.relativePath)).filter(Boolean)));
      const pillsEl = document.getElementById('sphereSubPills');
      pillsEl.innerHTML = '';
      if (subList.length > 0) {
        ['all', ...subList].forEach((subKey) => {
          const b = document.createElement('button');
          b.className = 'sub-pill' + (activeSub === subKey ? ' active' : '');
          b.textContent = subKey === 'all' ? 'Todos (' + nodes.length + ')' : subKey;
          b.onclick = () => openSphereGallery(sp, view, subKey);
          pillsEl.appendChild(b);
        });
      }

      const shown = activeSub === 'all'
        ? nodes
        : nodes.filter((n) => getSubfolderBadge(n.relativePath) === activeSub);

      const grid = document.getElementById('sphereGalleryGrid');
      grid.innerHTML = '';
      for (const n of shown.slice(0, 48)) {
        const ct = CARD_TYPE_META[n.cardType || 'rule_lore'] || CARD_TYPE_META.rule_lore;
        const card = document.createElement('button');
        card.className = 'lore-gallery-card';
        card.innerHTML =
          '<div class="row" style="justify-content:space-between;width:100%">' +
          '<strong style="color:var(--text-strong);font-size:0.95rem">' + ct.icon + ' ' + escapeHtml(n.title) + '</strong>' +
          '<span class="dot ' + escapeHtml(n.layer) + '"></span></div>' +
          (n.isSkeleton
            ? '<div class="row"><span class="badge gm" style="font-size:0.68rem">📝 Por completar · Clic para proponer al DM</span></div>'
            : '<div class="trail-card-excerpt">' + escapeHtml(extractPlainExcerpt(n.sanitizedContent, 95)) + '</div>');
        card.onclick = () => selectNode(n.id, true);
        grid.appendChild(card);
      }
      section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // === Hilo de la Trama (Últimas Sesiones) y Rueda Astral Cósmica ===
    function openSessionChronicle(entry, view) {
      const visibleMap = new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      if (entry.sourceNoteRelativePath) {
        const hit = view.visibleNodes.find((n) => n.relativePath.toLowerCase() === entry.sourceNoteRelativePath.toLowerCase());
        if (hit) {
          selectNode(hit.id, true);
          return;
        }
      }

      state.showPortal = false;
      hideWikilinkPreview();
      toggleIndexDrawer(false);
      document.getElementById('welcomePortal').classList.add('hidden');
      document.getElementById('articleView').classList.remove('hidden');

      document.getElementById('nodeBreadcrumbs').innerHTML =
        '<span>Hilo de la Trama</span> › <span>' + escapeHtml(entry.sessionTag) + '</span>';
      document.getElementById('articleTitle').textContent = entry.title;
      const festivalBadge = entry.associatedEvent
        ? '<span class="badge gm">' + escapeHtml(entry.associatedEvent.icon + ' ' + entry.associatedEvent.name) + '</span>'
        : '';
      document.getElementById('articleBadges').innerHTML =
        '<span class="badge base">' + escapeHtml(entry.thyreniaDate.formatted) + '</span>' +
        festivalBadge +
        '<span class="badge progresiva">' + escapeHtml(entry.location) + '</span>';
      document.getElementById('articleActions').innerHTML = '';
      document.getElementById('cardMetaBar').classList.add('hidden');
      document.getElementById('skeletonPromptBox').classList.add('hidden');
      document.getElementById('articleView').classList.remove('chapter-reading-mode');
      document.getElementById('articleBanner').classList.add('hidden');
      document.getElementById('articleToc').classList.add('hidden');

      const mdContent = entry.chronicleMarkdown ||
        ('### Resumen de la Sesión\\n\\n' + entry.summary + '\\n\\n### Sucesos Clave\\n' +
          entry.highlights.map((h) => '- ' + h).join('\\n'));
      const rendered = renderMarkdownToHtml(mdContent, visibleMap, entry.title);
      const bodyEl = document.getElementById('articleBody');
      bodyEl.innerHTML = rendered.html;
      wireInteractiveLinks(bodyEl, visibleMap);

      document.getElementById('articleRelations').innerHTML =
        '<div class="fog-echoes-box"><div class="field-label">🌌 Contexto Estacional y Cósmico de Esta Fecha</div>' +
        '<div class="muted">' + escapeHtml(entry.seasonTransitionNote) + '</div>' +
        '<div class="muted">' + escapeHtml(entry.thyreniaDate.divineInfluence) + '</div></div>';
      document.getElementById('codexStage').scrollTop = 0;
    }

    function renderAstralWheel(view) {
      const tl = view.plotTimeline;
      if (!tl || !tl.cosmicWheel) return;
      const box = document.getElementById('astralWheelBox');
      if (box.classList.contains('hidden')) return;

      const seasons = ['all', 'Invierno', 'Primavera', 'Verano', 'Otoño'];
      const pillsEl = document.getElementById('astralSeasonPills');
      pillsEl.innerHTML = '';
      seasons.forEach((sKey) => {
        const b = document.createElement('button');
        b.className = 'sub-pill' + (state.astralSeason === sKey ? ' active' : '');
        b.textContent = sKey === 'all' ? 'Todo el Año' : sKey;
        b.onclick = () => {
          state.astralSeason = sKey;
          renderAstralWheel(view);
        };
        pillsEl.appendChild(b);
      });

      const currentMonthIdx = tl.currentDate.monthIndex;
      if (state.astralMonthIndex === null) state.astralMonthIndex = currentMonthIdx;

      const gridEl = document.getElementById('astralGrid');
      gridEl.innerHTML = '';
      const filteredMonths = state.astralSeason === 'all'
        ? tl.cosmicWheel
        : tl.cosmicWheel.filter((m) => m.season === state.astralSeason);

      for (const m of filteredMonths) {
        const isNow = m.monthIndex === currentMonthIdx;
        const isActive = m.monthIndex === state.astralMonthIndex;
        const btn = document.createElement('button');
        btn.className = 'astral-month-btn' + (isNow ? ' is-now' : '') + (isActive ? ' active' : '');
        btn.innerHTML =
          '<div class="row" style="justify-content:space-between;width:100%">' +
          '<strong style="font-family:var(--display-font);font-size:0.92rem">' + (m.monthIndex + 1) + '. ' + escapeHtml(m.name) + '</strong>' +
          '<span class="badge" style="font-size:0.68rem">' + escapeHtml(m.season) + (isNow ? ' · Hoy' : '') + '</span></div>' +
          '<div class="muted" style="font-size:0.75rem">Deidad: ' + escapeHtml(m.deity) + '</div>' +
          (m.festivals.length > 0
            ? '<div style="font-size:0.76rem;color:var(--gold)">' + escapeHtml(m.festivals.map((f) => f.icon + ' ' + f.name).join(' · ')) + '</div>'
            : '<div class="muted" style="font-size:0.74rem">' + escapeHtml(m.influence) + '</div>') +
          (m.sessionTitles.length > 0
            ? '<div class="badge progresiva" style="font-size:0.68rem;margin-top:2px">' + m.sessionTitles.length + ' evento(s) de campaña</div>'
            : '');
        btn.onclick = () => {
          state.astralMonthIndex = m.monthIndex;
          renderAstralWheel(view);
        };
        gridEl.appendChild(btn);
      }

      const selectedMonth = tl.cosmicWheel.find((m) => m.monthIndex === state.astralMonthIndex) || tl.cosmicWheel[currentMonthIdx];
      const detailEl = document.getElementById('astralMonthDetail');
      if (selectedMonth) {
        detailEl.classList.remove('hidden');
        detailEl.innerHTML =
          '<div class="row" style="justify-content:space-between;margin-bottom:6px">' +
          '<strong style="font-family:var(--display-font);font-size:1.05rem">' + escapeHtml(selectedMonth.name) + ' — ' + escapeHtml(selectedMonth.season) + '</strong>' +
          '<span class="badge asimetrica">Patrón: ' + escapeHtml(selectedMonth.deity) + '</span></div>' +
          '<div class="muted" style="margin-bottom:8px">' + escapeHtml(selectedMonth.influence) +
          (selectedMonth.isSeasonStart ? ' · Marca el inicio climático y simbólico de la estación.' : '') + '</div>' +
          (selectedMonth.festivals.length > 0
            ? selectedMonth.festivals.map((f) =>
                '<div class="cosmic-event-callout" style="margin-bottom:6px"><strong>' + escapeHtml(f.icon + ' ' + f.name + ' (Día ' + f.dayOfMonth + ')') + ' — ' + escapeHtml(f.kind) + '</strong>' +
                '<div class="muted">' + escapeHtml(f.description) + '</div></div>'
              ).join('')
            : '') +
          (selectedMonth.sessionTitles.length > 0
            ? '<div style="margin-top:6px"><strong style="font-size:0.82rem">Sesiones ocurridas en este mes:</strong> ' +
              escapeHtml(selectedMonth.sessionTitles.join(' | ')) + '</div>'
            : '<div class="muted" style="font-size:0.8rem">No hay sesiones registradas en este mes todavía.</div>');
      }
    }

    function renderPlotTimeline(view) {
      const section = document.getElementById('plotTimelineSection');
      const tl = view.plotTimeline;
      if (!tl || !tl.entries || tl.entries.length === 0) {
        section.classList.add('hidden');
        return;
      }
      section.classList.remove('hidden');

      if (state.timelineIndex < 0 || state.timelineIndex >= tl.entries.length) {
        const curIdx = tl.entries.findIndex((e) => e.kind === 'current');
        state.timelineIndex = curIdx >= 0 ? curIdx : 0;
      }

      document.getElementById('timelineHeaderTitle').textContent =
        '⏳ ' + tl.campaignName + ' — Hilo de la Trama';
      document.getElementById('timelineHorizonBadge').textContent =
        'Hoy en Thyrenia: ' + tl.currentDate.formatted + ' · Próximo hito astral: ' +
        tl.nextCosmicEvent.festival.icon + ' ' + tl.nextCosmicEvent.festival.name +
        (tl.nextCosmicEvent.daysUntil === 0 ? ' (hoy)' : ' en ' + tl.nextCosmicEvent.daysUntil + ' días');

      const trackEl = document.getElementById('timelineTrack');
      trackEl.innerHTML = '';
      tl.entries.forEach((entry, idx) => {
        const btn = document.createElement('button');
        btn.className = 'timeline-node is-' + entry.kind + (idx === state.timelineIndex ? ' active' : '');
        btn.innerHTML =
          '<span class="badge ' + (entry.kind === 'current' ? 'gm' : (entry.kind === 'upcoming' ? 'progresiva' : 'base')) +
          '" style="font-size:0.69rem;padding:2px 7px">' + escapeHtml(entry.sessionTag) + '</span>' +
          '<strong style="font-size:0.83rem;color:var(--text-strong);line-height:1.25">' + escapeHtml(entry.title) + '</strong>' +
          '<span class="muted" style="font-size:0.72rem">' + escapeHtml(entry.thyreniaDate.dayOfMonth + ' de ' + entry.thyreniaDate.monthName) +
          (entry.associatedEvent ? ' · ' + entry.associatedEvent.icon : '') + '</span>';
        btn.onclick = () => {
          state.timelineIndex = idx;
          renderPlotTimeline(view);
        };
        trackEl.appendChild(btn);
      });

      const activeEntry = tl.entries[state.timelineIndex];
      document.getElementById('timelinePrevBtn').disabled = state.timelineIndex <= 0;
      document.getElementById('timelineNextBtn').disabled = state.timelineIndex >= tl.entries.length - 1;

      const focusEl = document.getElementById('timelineFocusCard');
      const festivalBlock = activeEntry.associatedEvent
        ? '<div class="cosmic-event-callout">' +
          '<div class="row" style="justify-content:space-between"><strong>' +
          escapeHtml(activeEntry.associatedEvent.icon + ' ' + activeEntry.associatedEvent.name) + '</strong>' +
          '<span class="badge gm">' + escapeHtml(activeEntry.associatedEvent.kind) + '</span></div>' +
          '<div class="muted" style="margin-top:4px;font-size:0.82rem">' + escapeHtml(activeEntry.associatedEvent.description) + '</div>' +
          '<div class="muted" style="margin-top:4px;font-size:0.75rem">Deidad vinculada: ' + escapeHtml(activeEntry.associatedEvent.deity) + '</div>' +
          '</div>'
        : '<div class="muted" style="font-size:0.82rem">Fecha ordinaria dentro de la estación sin festividad cósmica mayor ese mismo día.</div>';

      const chronoLabel =
        activeEntry.daysDeltaFromNow === 0
          ? '📍 Sesión / Fecha Actual'
          : activeEntry.daysDeltaFromNow < 0
            ? 'Hace ' + Math.abs(activeEntry.daysDeltaFromNow) + ' días en Thyrenia'
            : 'Dentro de ' + activeEntry.daysDeltaFromNow + ' días';

      focusEl.innerHTML =
        '<div>' +
        '<div class="row" style="margin-bottom:6px">' +
        '<span class="badge ' + (activeEntry.kind === 'current' ? 'gm' : 'base') + '">' + escapeHtml(activeEntry.sessionTag) + '</span>' +
        '<span class="badge">' + escapeHtml(chronoLabel) + '</span>' +
        '<span class="muted">📍 ' + escapeHtml(activeEntry.location) + '</span>' +
        '</div>' +
        '<h3 style="font-family:var(--display-font);font-size:1.38rem;margin:4px 0 8px;color:var(--text-strong)">' + escapeHtml(activeEntry.title) + '</h3>' +
        '<p class="muted" style="font-size:0.92rem;line-height:1.5;margin:0">' + escapeHtml(activeEntry.summary) + '</p>' +
        '<ul class="timeline-highlights">' +
        activeEntry.highlights.map((h) => '<li>' + escapeHtml(h) + '</li>').join('') +
        '</ul>' +
        '<div class="row" style="justify-content:space-between;margin-top:10px">' +
        '<div class="row">' + activeEntry.participants.slice(0, 6).map((p) => '<span class="badge">' + escapeHtml(p) + '</span>').join('') + '</div>' +
        (activeEntry.kind !== 'upcoming' ? '<button class="primary timeline-read-btn" style="font-size:0.82rem">📖 Leer Crónica de esta Sesión →</button>' : '') +
        '</div>' +
        '</div>' +
        '<div class="cosmic-pane">' +
        '<div>' +
        '<div class="field-label">Cielo y Fecha en Thyrenia</div>' +
        '<strong style="font-size:1.02rem;color:var(--text-strong)">📅 ' + escapeHtml(activeEntry.thyreniaDate.formatted) + '</strong>' +
        '<div class="muted" style="margin-top:5px;font-size:0.82rem">' + escapeHtml(activeEntry.seasonTransitionNote) + '</div>' +
        '<div class="muted" style="margin-top:3px;font-size:0.78rem">✨ ' + escapeHtml(activeEntry.thyreniaDate.divineInfluence) + '</div>' +
        '</div>' +
        festivalBlock +
        '</div>';

      const readBtn = focusEl.querySelector('.timeline-read-btn');
      if (readBtn) {
        readBtn.onclick = () => openSessionChronicle(activeEntry, view);
      }

      renderAstralWheel(view);
    }

    // === Portal de Bienvenida (Variante A) ===
    function renderWelcomePortal(view) {
      renderPlotTimeline(view);
      const ch = view.character;
      const s = view.stats;
      document.getElementById('heroCharBadge').textContent =
        ch.name + ' · ' + ch.race + ' ' + ch.class;
      document.getElementById('heroGreeting').textContent =
        'Códice de ' + ch.name;
      document.getElementById('heroStatsRow').innerHTML =
        '<div class="stat-mini"><div class="num" style="color:var(--base)">' + s.baseCount + '</div><div class="muted" style="font-size:0.72rem">Base</div></div>' +
        '<div class="stat-mini"><div class="num" style="color:var(--asym)">' + s.asymmetricVisibleCount + '</div><div class="muted" style="font-size:0.72rem">Asimétrica</div></div>' +
        '<div class="stat-mini"><div class="num" style="color:var(--prog)">' + s.progressiveVisibleCount + '</div><div class="muted" style="font-size:0.72rem">Descubierto</div></div>' +
        '<div class="stat-mini"><div class="num">' + s.hiddenOrSecretCount + '</div><div class="muted" style="font-size:0.72rem">En Niebla</div></div>';

      const avail = new Set((view.availableImages || []).map((x) => x.toLowerCase()));
      const heroEl = document.getElementById('welcomeHeroCard');
      if (avail.has('image4.png')) {
        heroEl.style.backgroundImage = "linear-gradient(96deg, var(--hero-scrim) 34%, var(--hero-scrim-mid) 65%, rgba(15, 23, 42, 0.25) 100%), url('/api/vault/media?file=image4.png')";
      } else {
        heroEl.style.backgroundImage = 'linear-gradient(135deg, var(--bg-elev) 0%, var(--bg-card) 100%)';
      }

      updateReadProgressBadge(view);

      const grid = document.getElementById('sphereGrid');
      grid.innerHTML = '';

      for (const sp of SPHERE_CARDS) {
        const btn = document.createElement('button');
        btn.className = 'sphere-card';
        btn.dataset.sphereTitle = sp.title;
        btn.innerHTML =
          '<div class="sphere-icon">' + sp.icon + '</div>' +
          '<h3>' + escapeHtml(sp.title) + '</h3>' +
          '<p>' + escapeHtml(sp.desc) + '</p>';
        btn.onclick = () => {
          openSphereGallery(sp, view, 'all');
        };
        grid.appendChild(btn);
      }

      const mapCard = document.getElementById('portalWorldMapCard');
      if (avail.has('image1.jpg')) {
        mapCard.classList.remove('hidden');
        renderInteractiveWorldMap(document.getElementById('portalWorldMapStage'), view, false);
        const firstPin = (view.mapPins && view.mapPins[0]) || THYRENIA_CONTINENT_PINS[0];
        inspectMapPin(firstPin, view);
      } else {
        mapCard.classList.add('hidden');
      }
    }

    function showWelcomePortal() {
      state.showPortal = true;
      document.getElementById('welcomePortal').classList.remove('hidden');
      document.getElementById('articleView').classList.add('hidden');
      document.getElementById('wikilinkPreviewCard').classList.add('hidden');
      toggleIndexDrawer(false);
      renderHierarchyTree();
    }

    function hideWikilinkPreview() {
      document.getElementById('wikilinkPreviewCard').classList.add('hidden');
    }

    function showWikilinkPreview(evt, btn, visibleMap) {
      const card = document.getElementById('wikilinkPreviewCard');
      const nodeId = btn.getAttribute('data-node-id');
      const sessionId = btn.getAttribute('data-session-id');
      const cosmicEvent = btn.getAttribute('data-cosmic-event');
      const lockMsg = btn.getAttribute('data-lock-msg');

      if (nodeId) {
        const target = visibleMap.get(nodeId.toLowerCase());
        if (!target) return;
        card.innerHTML =
          '<div class="row" style="justify-content:space-between"><strong>📖 ' + escapeHtml(target.title) + '</strong>' +
          '<span class="badge ' + escapeHtml(target.layer) + '">' + escapeHtml(classifyCategory(target.relativePath)) + '</span></div>' +
          '<div class="muted" style="line-height:1.45">' + escapeHtml(extractPlainExcerpt(target.sanitizedContent, 165)) + '</div>' +
          '<div class="muted" style="font-size:0.73rem">Clic para abrir esta crónica</div>';
      } else if (sessionId) {
        const entry = (state.view?.plotTimeline?.entries || []).find((e) => e.id === sessionId);
        if (!entry) return;
        card.innerHTML =
          '<div class="row" style="justify-content:space-between"><strong>⏳ ' + escapeHtml(entry.title) + '</strong>' +
          '<span class="badge base">' + escapeHtml(entry.sessionTag) + '</span></div>' +
          '<div class="muted">📅 ' + escapeHtml(entry.thyreniaDate.formatted) + ' · 📍 ' + escapeHtml(entry.location) + '</div>' +
          (entry.associatedEvent ? '<div class="badge gm" style="width:fit-content">' + escapeHtml(entry.associatedEvent.icon + ' ' + entry.associatedEvent.name) + '</div>' : '') +
          '<div class="muted" style="line-height:1.4">' + escapeHtml(extractPlainExcerpt(entry.summary, 140)) + '</div>' +
          '<div class="muted" style="font-size:0.73rem">Clic para abrir la crónica de sesión</div>';
      } else if (cosmicEvent) {
        const hit = findCosmicEventByWikilink(cosmicEvent);
        if (!hit) return;
        card.innerHTML =
          '<div class="row" style="justify-content:space-between"><strong>' + escapeHtml(hit.festival.icon + ' ' + hit.festival.name) + '</strong>' +
          '<span class="badge gm">' + escapeHtml(hit.festival.kind) + '</span></div>' +
          '<div class="muted">📅 ' + hit.festival.dayOfMonth + ' de ' + escapeHtml(hit.month.name) + ' (' + escapeHtml(hit.month.season) + ') · Deidad: ' + escapeHtml(hit.festival.deity) + '</div>' +
          '<div class="muted" style="line-height:1.4">' + escapeHtml(hit.festival.description) + '</div>' +
          '<div class="muted" style="font-size:0.73rem">Clic para ver en la Rueda Astral</div>';
      } else if (lockMsg) {
        card.innerHTML =
          '<strong>🔒 Conocimiento Bloqueado</strong>' +
          '<div class="muted" style="line-height:1.45">' + escapeHtml(lockMsg) + '</div>';
      } else {
        return;
      }

      const rect = btn.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - 346);
      const top = rect.bottom + 130 < window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - 120);
      card.style.left = Math.max(12, left) + 'px';
      card.style.top = top + 'px';
      card.classList.remove('hidden');
    }

    function wireInteractiveLinks(containerEl, visibleMap) {
      containerEl.querySelectorAll('button.wikilink-btn[data-node-id]').forEach((btn) => {
        btn.onclick = () => selectNode(btn.getAttribute('data-node-id'), true);
        btn.onmouseenter = (e) => showWikilinkPreview(e, btn, visibleMap);
        btn.onmouseleave = hideWikilinkPreview;
      });
      containerEl.querySelectorAll('button.wikilink-btn[data-session-id]').forEach((btn) => {
        btn.onclick = () => {
          const sid = btn.getAttribute('data-session-id');
          const entries = state.view?.plotTimeline?.entries || [];
          const idx = entries.findIndex((e) => e.id === sid);
          if (idx >= 0) {
            state.timelineIndex = idx;
            setUiVariant('A');
            openSessionChronicle(entries[idx], state.view);
          }
        };
        btn.onmouseenter = (e) => showWikilinkPreview(e, btn, visibleMap);
        btn.onmouseleave = hideWikilinkPreview;
      });
      containerEl.querySelectorAll('button.wikilink-btn[data-cosmic-event]').forEach((btn) => {
        btn.onclick = () => {
          const hit = findCosmicEventByWikilink(btn.getAttribute('data-cosmic-event'));
          if (hit) {
            state.astralSeason = 'all';
            state.astralMonthIndex = hit.month.monthIndex;
            setUiVariant('A');
            showWelcomePortal();
            const wheelBox = document.getElementById('astralWheelBox');
            wheelBox.classList.remove('hidden');
            renderAstralWheel(state.view);
            wheelBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };
        btn.onmouseenter = (e) => showWikilinkPreview(e, btn, visibleMap);
        btn.onmouseleave = hideWikilinkPreview;
      });
      containerEl.querySelectorAll('button.wikilink-locked[data-lock-msg]').forEach((btn) => {
        btn.onclick = () => showLockToast(btn.getAttribute('data-lock-msg'));
        btn.onmouseenter = (e) => showWikilinkPreview(e, btn, visibleMap);
        btn.onmouseleave = hideWikilinkPreview;
      });
    }

    // === Lector del Códice & Drawer del Mapa ===
    function renderArticleBanner(node, cat) {
      const bannerEl = document.getElementById('articleBanner');
      const art = resolveContextualArt(node, state.view?.availableImages || []);
      if (art) {
        bannerEl.classList.remove('hidden');
        bannerEl.innerHTML =
          '<img src="/api/vault/media?file=' + encodeURIComponent(art.file) + '" alt="' + escapeHtml(node.title) + '" loading="lazy" />' +
          '<div class="article-banner-caption"><span>🖼️ ' + escapeHtml(art.caption) + '</span><span>' + escapeHtml(cat) + '</span></div>';
        return;
      }
      bannerEl.classList.add('hidden');
      bannerEl.innerHTML = '';
    }

    function selectNode(nodeId, centerMap = false) {
      if (!state.view) return;
      const visibleMap = new Map(state.view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      const node = visibleMap.get(String(nodeId).toLowerCase()) || state.view.visibleNodes[0];
      if (!node) return;

      hideWikilinkPreview();
      toggleIndexDrawer(false);

      state.selectedNodeId = node.id;
      state.showPortal = false;
      markNodeAsRead(node.id);
      updateReadProgressBadge(state.view);

      document.getElementById('welcomePortal').classList.add('hidden');
      const articleEl = document.getElementById('articleView');
      articleEl.classList.remove('hidden');
      articleEl.classList.toggle('chapter-reading-mode', node.cardType === 'chapter');

      const cat = classifyCategory(node.relativePath);
      const parts = node.relativePath.split('/').filter(Boolean);
      document.getElementById('nodeBreadcrumbs').innerHTML =
        parts.map((p) => '<span>' + escapeHtml(p.replace(/\\.md$/i, '')) + '</span>').join(' › ');

      const ctMeta = CARD_TYPE_META[node.cardType || 'rule_lore'] || CARD_TYPE_META.rule_lore;
      document.getElementById('articleTitle').textContent = node.title;
      const badgesHtml = [
        '<span class="badge asimetrica">' + ctMeta.icon + ' ' + escapeHtml(ctMeta.label) + '</span>',
        '<span class="badge ' + escapeHtml(node.layer) + '">' + layerLabel(node.layer) + '</span>',
        '<span class="badge">' + escapeHtml(cat) + '</span>',
        ...(node.tags || []).slice(0, 5).map((t) => '<span class="badge">#' + escapeHtml(t) + '</span>'),
      ].join('');
      document.getElementById('articleBadges').innerHTML = badgesHtml;

      const actionsEl = document.getElementById('articleActions');
      actionsEl.innerHTML = '';
      if (state.role === 'gm') {
        const editBtn = document.createElement('button');
        editBtn.className = 'gm-btn';
        editBtn.textContent = 'Editar en Estudio GM';
        editBtn.onclick = () => loadNodeIntoGmEditor(node.relativePath);
        actionsEl.appendChild(editBtn);
      }
      const journalBtn = document.createElement('button');
      journalBtn.className = 'approve';
      journalBtn.style.fontSize = '0.8rem';
      journalBtn.textContent = '⬇️ Exportar Journal FoundryVTT';
      journalBtn.onclick = () => {
        const url = '/api/foundry/journal-export?campaignId=' + encodeURIComponent(state.campaignId) +
          '&characterId=' + encodeURIComponent(state.characterId) +
          '&nodeId=' + encodeURIComponent(node.id) + '&download=1';
        window.location.href = url;
      };
      actionsEl.appendChild(journalBtn);
      const addArtBtn = document.createElement('button');
      addArtBtn.style.fontSize = '0.8rem';
      addArtBtn.textContent = '🖼️ Añadir Ilustración / Crónica';
      addArtBtn.onclick = () => {
        state.storyContextNodeId = node.id;
        document.getElementById('playerStoryTitle').value = 'Aportación visual para ' + node.title;
        document.getElementById('playerStoryTarget').value = node.cardType === 'character' ? 'character' : 'campaign';
        const bodyTa = document.getElementById('playerStoryBody');
        if (!bodyTa.value.trim()) {
          bodyTa.value = 'Enlace: [[' + node.title + ']]\\n\\n';
        }
        openSheetModal('story');
      };
      actionsEl.appendChild(addArtBtn);

      const metaBar = document.getElementById('cardMetaBar');
      const fieldsEntries = node.cardFields ? Object.entries(node.cardFields) : [];
      if (fieldsEntries.length > 0) {
        metaBar.classList.remove('hidden');
        metaBar.innerHTML = fieldsEntries.map(([k, v]) =>
          '<div class="card-meta-pill"><span class="k">' + escapeHtml(k) + '</span><strong>' + escapeHtml(v) + '</strong></div>'
        ).join('');
      } else {
        metaBar.classList.add('hidden');
      }

      const skBox = document.getElementById('skeletonPromptBox');
      if (node.isSkeleton) {
        skBox.classList.remove('hidden');
        skBox.innerHTML =
          '<div><strong>📝 Card en Construcción — ¡Co-crea este Lore!</strong>' +
          '<div class="muted" style="font-size:0.83rem;margin-top:2px">Esta ficha todavía usa la plantilla inicial. Puedes redactar su historia o descripción para que el DM la apruebe en el Vault Maestro.</div></div>' +
          '<button id="proposeSkeletonBtn" class="primary">✍️ Proponer Descripción al DM</button>';
        skBox.querySelector('#proposeSkeletonBtn').onclick = () => {
          document.getElementById('playerStoryTitle').value = node.title;
          document.getElementById('playerStoryTarget').value = node.cardType === 'character' ? 'character' : 'campaign';
          document.getElementById('playerStoryBody').value = '';
          openSheetModal('story');
        };
      } else {
        skBox.classList.add('hidden');
      }

      renderArticleBanner(node, cat);

      const rendered = renderMarkdownToHtml(node.sanitizedContent, visibleMap, node.title);
      const tocEl = document.getElementById('articleToc');
      if (rendered.toc.length >= 2) {
        tocEl.classList.remove('hidden');
        tocEl.innerHTML = '<strong>En este artículo</strong><div class="toc-links">' +
          rendered.toc.map((t) => '<button class="toc-link" data-sec="' + t.id + '">' + escapeHtml(t.text) + '</button>').join('') +
          '</div>';
        tocEl.querySelectorAll('.toc-link').forEach((b) => {
          b.onclick = () => {
            const targetEl = document.getElementById(b.getAttribute('data-sec'));
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };
        });
      } else {
        tocEl.classList.add('hidden');
      }

      const bodyEl = document.getElementById('articleBody');
      bodyEl.innerHTML = rendered.html;
      wireInteractiveLinks(bodyEl, visibleMap);

      const outgoingIds = Array.from(new Set(state.view.adjacencyGraph[node.id] || []));
      const incomingIds = [];
      for (const [src, targets] of Object.entries(state.view.adjacencyGraph)) {
        if (src !== node.id && targets.some((t) => t.toLowerCase() === node.id.toLowerCase())) {
          incomingIds.push(src);
        }
      }
      const connectedIds = Array.from(new Set([...outgoingIds, ...incomingIds]));
      const lockedRefs = (node.outgoingLinks || []).filter((t) => !visibleMap.has(t.toLowerCase()));

      const relEl = document.getElementById('articleRelations');
      const trailCardsHtml = connectedIds.length > 0
        ? '<div><div class="field-label">🧭 Senderos Conectados para Seguir Explorando (' + connectedIds.length + ')</div>' +
          '<div class="trail-grid">' +
          connectedIds.slice(0, 6).map((cid) => {
            const target = visibleMap.get(cid.toLowerCase());
            const excerpt = target ? extractPlainExcerpt(target.sanitizedContent, 95) : '';
            return '<button class="trail-card" data-rel-id="' + escapeHtml(cid) + '">' +
              '<div class="row" style="justify-content:space-between;width:100%"><strong>📖 ' + escapeHtml(cid) + '</strong>' +
              (target ? '<span class="dot ' + escapeHtml(target.layer) + '"></span>' : '') + '</div>' +
              '<div class="trail-card-excerpt">' + escapeHtml(excerpt) + '</div></button>';
          }).join('') +
          '</div></div>'
        : '<div class="muted">Sin senderos directos visibles desde esta nota.</div>';

      const lockedEchoesHtml = lockedRefs.length > 0
        ? '<div class="fog-echoes-box"><div class="field-label">🔒 Ecos en la Niebla Mencionados Aquí (' + lockedRefs.length + ')</div>' +
          lockedRefs.slice(0, 5).map((refName) => {
            const lr = state.view.lockReasons?.[refName.toLowerCase()];
            const reasonText = lr ? lr.criteria : 'Concepto aún sin crónica redactada en el Vault Maestro.';
            return '<div class="muted" style="font-size:0.82rem"><strong>' + (lr?.status === 'asimetrica' ? '🔮 ' : '🗺️ ') + escapeHtml(refName) + ':</strong> ' + escapeHtml(reasonText) + '</div>';
          }).join('') +
          '</div>'
        : '';

      relEl.innerHTML = trailCardsHtml + lockedEchoesHtml;
      relEl.querySelectorAll('button[data-rel-id]').forEach((btn) => {
        btn.onclick = () => selectNode(btn.getAttribute('data-rel-id'), true);
      });

      // Sincronizar Drawer de Variante B
      document.getElementById('drawerTitle').textContent = node.title;
      document.getElementById('drawerBadges').innerHTML = badgesHtml;
      const drawerBody = document.getElementById('drawerBody');
      drawerBody.innerHTML = rendered.html;
      wireInteractiveLinks(drawerBody, visibleMap);
      if (state.variant === 'B') {
        document.getElementById('mapDrawer').classList.remove('hidden');
      }

      renderHierarchyTree();
      rebuildGraphData(centerMap);
      document.getElementById('codexStage').scrollTop = 0;
    }

    // === Motor de Grafo de Fuerzas Interactivo ===
    function computeNeighborhood(startId, maxDepth, adjacency) {
      const visited = new Set();
      if (!startId) return visited;
      const queue = [{ id: startId, depth: 0 }];
      visited.add(startId);
      while (queue.length > 0) {
        const cur = queue.shift();
        if (cur.depth >= maxDepth) continue;
        const neighbors = new Set(adjacency[cur.id] || []);
        for (const [src, tgts] of Object.entries(adjacency)) {
          if (tgts.includes(cur.id)) neighbors.add(src);
        }
        for (const nb of neighbors) {
          if (!visited.has(nb)) {
            visited.add(nb);
            queue.push({ id: nb, depth: cur.depth + 1 });
          }
        }
      }
      return visited;
    }

    function rebuildGraphData(centerCamera = false) {
      if (!state.view) return;
      const filtered = getFilteredNodes();
      const filteredMap = new Map(filtered.map((n) => [n.id, n]));
      const allVisibleMap = new Map(state.view.visibleNodes.map((n) => [n.id, n]));
      const scope = state.filters.scope;

      let chosenNodes = [];
      if ((scope === 'neighbors1' || scope === 'neighbors2') && state.selectedNodeId && allVisibleMap.has(state.selectedNodeId)) {
        const depth = scope === 'neighbors1' ? 1 : 2;
        const neighborhood = computeNeighborhood(state.selectedNodeId, depth, state.view.adjacencyGraph);
        chosenNodes = Array.from(neighborhood)
          .map((id) => filteredMap.get(id) || (id === state.selectedNodeId ? allVisibleMap.get(id) : null))
          .filter(Boolean);
      } else if (scope === 'connected') {
        const connectedIds = new Set();
        for (const n of filtered) {
          const targets = (state.view.adjacencyGraph[n.id] || []).filter((t) => filteredMap.has(t));
          if (targets.length > 0) {
            connectedIds.add(n.id);
            targets.forEach((t) => connectedIds.add(t));
          }
        }
        chosenNodes = filtered.filter((n) => connectedIds.has(n.id));
      } else {
        chosenNodes = filtered;
      }

      if (chosenNodes.length > 90) chosenNodes = chosenNodes.slice(0, 90);

      const chosenSet = new Set(chosenNodes.map((n) => n.id));
      const edges = [];
      const degreeMap = new Map();
      for (const n of chosenNodes) {
        for (const t of state.view.adjacencyGraph[n.id] || []) {
          if (chosenSet.has(t) && n.id !== t) {
            edges.push({ source: n.id, target: t });
            degreeMap.set(n.id, (degreeMap.get(n.id) || 0) + 1);
            degreeMap.set(t, (degreeMap.get(t) || 0) + 1);
          }
        }
      }

      const prevById = state.simById;
      const newSimNodes = chosenNodes.map((n, idx) => {
        const prev = prevById.get(n.id);
        const angle = idx * 0.72;
        const r = idx === 0 ? 0 : 48 + Math.sqrt(idx) * 38;
        return {
          id: n.id,
          node: n,
          x: prev ? prev.x : Math.cos(angle) * r,
          y: prev ? prev.y : Math.sin(angle) * r,
          vx: prev ? prev.vx * 0.3 : 0,
          vy: prev ? prev.vy * 0.3 : 0,
          degree: degreeMap.get(n.id) || 0,
        };
      });

      state.simNodes = newSimNodes;
      state.simById = new Map(newSimNodes.map((s) => [s.id, s]));
      state.simEdges = edges
        .map((e) => ({ a: state.simById.get(e.source), b: state.simById.get(e.target) }))
        .filter((e) => e.a && e.b);

      document.getElementById('graphCountLabel').textContent =
        state.simNodes.length + ' nodos · ' + state.simEdges.length + ' enlaces';

      if (centerCamera) {
        const sel = state.simById.get(state.selectedNodeId);
        if (sel) {
          state.camera.x = -sel.x * state.camera.zoom;
          state.camera.y = -sel.y * state.camera.zoom;
        } else {
          state.camera.x = 0;
          state.camera.y = 0;
        }
      }
    }

    function stepPhysics() {
      const nodes = state.simNodes;
      if (!state.physicsRunning || nodes.length === 0 || state.variant !== 'B') return;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.vx += -a.x * 0.007;
        a.vy += -a.y * 0.007;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distSq = dx * dx + dy * dy;
          if (distSq < 16) {
            dx = (Math.random() - 0.5) * 4;
            dy = (Math.random() - 0.5) * 4;
            distSq = 16;
          }
          const force = Math.min(9, 2600 / distSq);
          const dist = Math.sqrt(distSq);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      for (const edge of state.simEdges) {
        const dx = edge.b.x - edge.a.x;
        const dy = edge.b.y - edge.a.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = (dist - 105) * 0.036;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        edge.a.vx += fx;
        edge.a.vy += fy;
        edge.b.vx -= fx;
        edge.b.vy -= fy;
      }

      for (const n of nodes) {
        if (state.dragNode === n) { n.vx = 0; n.vy = 0; continue; }
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    function drawGraph() {
      if (state.variant !== 'B') return;
      const canvas = document.getElementById('graphCanvas');
      const wrap = document.getElementById('canvasWrap');
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        const dpr = window.devicePixelRatio || 1;
        const targetW = Math.floor(rect.width * dpr);
        const targetH = Math.floor(rect.height * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }

      const pal = getCanvasPalette();
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, w, h);

      ctx.translate(w / 2 + state.camera.x, h / 2 + state.camera.y);
      ctx.scale(state.camera.zoom, state.camera.zoom);

      const focusId = state.hoverNode ? state.hoverNode.id : state.selectedNodeId;
      const neighborSet = new Set();
      if (focusId) {
        neighborSet.add(focusId);
        for (const e of state.simEdges) {
          if (e.a.id === focusId) neighborSet.add(e.b.id);
          if (e.b.id === focusId) neighborSet.add(e.a.id);
        }
      }

      for (const e of state.simEdges) {
        const hot = focusId && (e.a.id === focusId || e.b.id === focusId);
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.strokeStyle = hot ? pal.edgeHot : pal.edge;
        ctx.lineWidth = (hot ? 2 : 1) / state.camera.zoom;
        ctx.stroke();
      }

      for (const s of state.simNodes) {
        const isSel = s.id === state.selectedNodeId;
        const isHov = state.hoverNode === s;
        const related = !focusId || neighborSet.has(s.id);
        const radius = Math.min(14, 6 + Math.sqrt(s.degree) * 1.7);
        const color = pal[s.node.layer] || pal.base;

        ctx.globalAlpha = related ? 1 : 0.25;

        if (isSel || s.node.layer === 'asimetrica' || s.node.layer === 'progresiva') {
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius + 5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = related ? 0.2 : 0.06;
          ctx.fill();
          ctx.globalAlpha = related ? 1 : 0.25;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, isSel || isHov ? radius + 2.5 : radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (isSel || isHov) {
          ctx.strokeStyle = pal.ring;
          ctx.lineWidth = 2.2 / state.camera.zoom;
          ctx.stroke();
        }

        const showLabel = isSel || isHov || state.camera.zoom > 0.72 || s.degree >= 2 || state.simNodes.length <= 32;
        if (showLabel) {
          const labelText = s.node.title.slice(0, 26);
          const fontSize = Math.max(10, 12 / Math.min(1.25, state.camera.zoom));
          ctx.font = (isSel ? '700 ' : '600 ') + fontSize + 'px Plus Jakarta Sans, system-ui, sans-serif';
          const tw = ctx.measureText(labelText).width;
          const px = s.x + radius + 6;
          const py = s.y - fontSize * 0.6;

          ctx.fillStyle = pal.pillBg;
          ctx.beginPath();
          ctx.roundRect(px - 4, py - 2, tw + 8, fontSize + 6, 5);
          ctx.fill();

          ctx.fillStyle = pal.pillText;
          ctx.fillText(labelText, px, s.y + fontSize * 0.32);
        }
      }

      ctx.restore();
    }

    function graphLoop() {
      stepPhysics();
      drawGraph();
      requestAnimationFrame(graphLoop);
    }

    function screenToWorld(clientX, clientY) {
      const canvas = document.getElementById('graphCanvas');
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return {
        sx,
        sy,
        wx: (sx - rect.width / 2 - state.camera.x) / state.camera.zoom,
        wy: (sy - rect.height / 2 - state.camera.y) / state.camera.zoom,
      };
    }

    function findNodeAtWorld(wx, wy) {
      for (let i = state.simNodes.length - 1; i >= 0; i--) {
        const s = state.simNodes[i];
        const hitR = 16 / state.camera.zoom;
        const dx = s.x - wx;
        const dy = s.y - wy;
        if (dx * dx + dy * dy <= hitR * hitR) return s;
      }
      return null;
    }

    // === Red de Relaciones (Submodo Atlas B) ===
    const REL_KIND_META = {
      ally: { color: '#34d399', label: '🤝 Aliado' },
      rival_enemy: { color: '#f87171', label: '⚔️ Rival / Enemigo' },
      suspicion: { color: '#fbbf24', label: '👁️ Sospecha' },
      patron_loyalty: { color: '#38bdf8', label: '✨ Patrono / Lealtad' },
      mystery_blood: { color: '#c084fc', label: '🩸 Vínculo / Misterio' },
    };

    function renderRelationshipWeb(view) {
      const rels = view.relationships || [];
      const svgBox = document.getElementById('relSvgContainer');
      const listBox = document.getElementById('relEdgeList');
      const visibleMap = new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));

      const entitySet = new Set();
      for (const r of rels) {
        entitySet.add(r.sourceId);
        entitySet.add(r.targetId);
      }
      const entities = Array.from(entitySet);

      if (entities.length === 0) {
        svgBox.innerHTML = '<div class="muted" style="padding:24px;text-align:center">No hay vínculos registrados en esta campaña aún.</div>';
        listBox.innerHTML = '';
        return;
      }

      const w = Math.max(480, svgBox.clientWidth || 620);
      const h = 380;
      const cx = w / 2;
      const cy = h / 2;
      const rad = Math.min(cx, cy) - 62;
      const coords = new Map();
      entities.forEach((name, idx) => {
        const ang = (idx / entities.length) * Math.PI * 2 - Math.PI / 2;
        coords.set(name, {
          x: cx + Math.cos(ang) * rad,
          y: cy + Math.sin(ang) * rad,
        });
      });

      const linesSvg = rels.map((r) => {
        const a = coords.get(r.sourceId);
        const b = coords.get(r.targetId);
        if (!a || !b) return '';
        const km = REL_KIND_META[r.relationKind] || REL_KIND_META.ally;
        const dimmed = state.relFocusEntity && r.sourceId !== state.relFocusEntity && r.targetId !== state.relFocusEntity;
        const dash = r.status === 'proposed' ? ' stroke-dasharray="6 4"' : '';
        return '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) +
          '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) +
          '" stroke="' + km.color + '" stroke-width="' + (dimmed ? '1.2' : '2.6') +
          '" opacity="' + (dimmed ? '0.2' : '0.88') + '"' + dash + ' />';
      }).join('');

      const nodesSvg = entities.map((name) => {
        const p = coords.get(name);
        const isFocus = state.relFocusEntity === name;
        const hasNode = visibleMap.has(name.toLowerCase());
        return '<g class="rel-svg-node" data-rel-entity="' + escapeHtml(name) + '" style="cursor:pointer">' +
          '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (isFocus ? 20 : 15) +
          '" fill="' + (hasNode ? '#0ea5e9' : '#475569') + '" stroke="' + (isFocus ? '#fbbf24' : '#e2e8f0') + '" stroke-width="2" />' +
          '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 30).toFixed(1) +
          '" text-anchor="middle" fill="currentColor" font-size="11" font-weight="600">' +
          escapeHtml(name.slice(0, 22)) + '</text></g>';
      }).join('');

      svgBox.innerHTML = '<svg width="100%" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="color:var(--text-strong)">' +
        linesSvg + nodesSvg + '</svg>';

      svgBox.querySelectorAll('.rel-svg-node').forEach((gEl) => {
        gEl.onclick = () => {
          const ent = gEl.getAttribute('data-rel-entity');
          state.relFocusEntity = state.relFocusEntity === ent ? null : ent;
          renderRelationshipWeb(view);
        };
      });

      listBox.innerHTML = '';
      const filteredRels = state.relFocusEntity
        ? rels.filter((r) => r.sourceId === state.relFocusEntity || r.targetId === state.relFocusEntity)
        : rels;

      for (const r of filteredRels) {
        const km = REL_KIND_META[r.relationKind] || REL_KIND_META.ally;
        const card = document.createElement('div');
        card.className = 'rel-edge-card' + (r.status === 'proposed' ? ' is-proposed' : '');
        card.innerHTML =
          '<div class="row" style="justify-content:space-between">' +
          '<span class="badge" style="border-color:' + km.color + ';color:' + km.color + '">' + km.label + '</span>' +
          (r.status === 'proposed'
            ? '<span class="badge gm">💡 Sugerido' + (r.proposedBy ? ' por ' + escapeHtml(r.proposedBy) : '') + '</span>'
            : '<span class="badge progresiva">Confirmado</span>') +
          '</div>' +
          '<div style="font-size:0.9rem"><strong>' + escapeHtml(r.sourceId) + '</strong> ↔ <strong>' + escapeHtml(r.targetId) + '</strong></div>' +
          '<div class="muted">' + escapeHtml(r.label) + '</div>' +
          '<div class="row rel-card-actions"></div>';

        const actDiv = card.querySelector('.rel-card-actions');
        if (visibleMap.has(r.sourceId.toLowerCase())) {
          const b1 = document.createElement('button');
          b1.style.fontSize = '0.72rem';
          b1.textContent = 'Ver ' + r.sourceId;
          b1.onclick = () => { selectNode(r.sourceId, true); setUiVariant('A'); };
          actDiv.appendChild(b1);
        }
        if (state.role === 'gm') {
          if (r.status === 'proposed') {
            const okBtn = document.createElement('button');
            okBtn.className = 'approve';
            okBtn.style.fontSize = '0.72rem';
            okBtn.textContent = '✓ Confirmar';
            okBtn.onclick = async () => {
              await fetchJson('/api/gm/relationships/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: state.campaignId, id: r.id, action: 'confirm' }),
              });
              await loadView();
            };
            actDiv.appendChild(okBtn);
          }
          const delBtn = document.createElement('button');
          delBtn.className = 'reject';
          delBtn.style.fontSize = '0.72rem';
          delBtn.textContent = 'Eliminar';
          delBtn.onclick = async () => {
            await fetchJson('/api/gm/relationships/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId: state.campaignId, id: r.id, action: 'delete' }),
            });
            await loadView();
          };
          actDiv.appendChild(delBtn);
        }
        listBox.appendChild(card);
      }
    }

    // === Mesa de Campaña (Variante C — 100% Manual + Tablero de Misiones) ===
    function renderQuestBoard(view) {
      const quests = view.quests || [];
      const visibleMap = new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      document.querySelectorAll('#questFilterPills button[data-qfilter]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-qfilter') === state.questFilter);
      });

      const listEl = document.getElementById('questBoardList');
      listEl.innerHTML = '';
      const filtered = quests.filter((q) => {
        if (state.questFilter === 'all') return true;
        return q.status === state.questFilter;
      });

      if (filtered.length === 0) {
        listEl.innerHTML = '<div class="muted">No hay misiones o rumores bajo este filtro.</div>';
        return;
      }

      const kindLabels = {
        main_quest: '⚔️ Principal',
        side_quest: '🧭 Secundaria',
        rumor: '💭 Rumor',
      };
      const statusLabels = {
        active: 'Activa',
        completed: 'Completada',
        failed: 'Fallida',
        proposed_rumor: '💡 Propuesta pendiente',
      };

      for (const q of filtered) {
        const card = document.createElement('div');
        card.className = 'quest-card' + (q.status === 'proposed_rumor' ? ' is-proposed' : '');
        const doneCount = (q.objectives || []).filter((o) => o.done).length;
        const totalObjs = (q.objectives || []).length;

        card.innerHTML =
          '<div class="row" style="justify-content:space-between">' +
          '<div class="row">' +
          '<span class="badge asimetrica">' + (kindLabels[q.kind] || q.kind) + '</span>' +
          '<strong style="font-size:1rem;color:var(--text-strong)">' + escapeHtml(q.title) + '</strong>' +
          '</div>' +
          '<div class="row">' +
          (totalObjs > 0 ? '<span class="badge">' + doneCount + '/' + totalObjs + '</span>' : '') +
          '<span class="badge ' + (q.status === 'completed' ? 'progresiva' : (q.status === 'proposed_rumor' ? 'gm' : 'base')) + '">' +
          (statusLabels[q.status] || q.status) + '</span>' +
          '</div></div>' +
          '<p class="muted" style="margin:0;line-height:1.45">' + escapeHtml(q.summary) + '</p>' +
          (q.proposedBy ? '<div class="muted" style="font-size:0.76rem">Propuesto por ' + escapeHtml(q.proposedBy) + '</div>' : '') +
          '<div class="quest-objs"></div>' +
          '<div class="row quest-actions" style="justify-content:space-between;margin-top:4px"></div>';

        const objsDiv = card.querySelector('.quest-objs');
        (q.objectives || []).forEach((obj, idx) => {
          const row = document.createElement('label');
          row.className = 'quest-obj-item' + (obj.done ? ' done' : '');
          const disabledAttr = state.role === 'gm' ? '' : 'disabled';
          row.innerHTML = '<input type="checkbox" ' + (obj.done ? 'checked ' : '') + disabledAttr + ' /><span>' + escapeHtml(obj.text) + '</span>';
          if (state.role === 'gm') {
            row.querySelector('input').onchange = async () => {
              await fetchJson('/api/gm/quests/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campaignId: state.campaignId,
                  id: q.id,
                  action: 'toggle_objective',
                  objectiveIdx: idx,
                }),
              });
              await loadView();
            };
          }
          objsDiv.appendChild(row);
        });

        const actDiv = card.querySelector('.quest-actions');
        const leftActs = document.createElement('div');
        leftActs.className = 'row';
        if (q.locationNodeId && visibleMap.has(q.locationNodeId.toLowerCase())) {
          const locBtn = document.createElement('button');
          locBtn.className = 'wikilink-btn';
          locBtn.textContent = '📍 ' + q.locationNodeId;
          locBtn.onclick = () => { selectNode(q.locationNodeId, true); setUiVariant('A'); };
          leftActs.appendChild(locBtn);
        }
        const expBtn = document.createElement('button');
        expBtn.style.fontSize = '0.76rem';
        expBtn.textContent = '⬇️ Journal FoundryVTT';
        expBtn.onclick = () => {
          window.location.href = '/api/foundry/journal-export?campaignId=' + encodeURIComponent(state.campaignId) +
            '&questId=' + encodeURIComponent(q.id) + '&download=1';
        };
        leftActs.appendChild(expBtn);
        actDiv.appendChild(leftActs);

        if (state.role === 'gm') {
          const gmActs = document.createElement('div');
          gmActs.className = 'row';
          if (q.status === 'proposed_rumor') {
            const appBtn = document.createElement('button');
            appBtn.className = 'approve';
            appBtn.style.fontSize = '0.76rem';
            appBtn.textContent = '✓ Aprobar al Tablero';
            appBtn.onclick = async () => {
              await fetchJson('/api/gm/quests/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: state.campaignId, id: q.id, action: 'approve_rumor' }),
              });
              await loadView();
            };
            gmActs.appendChild(appBtn);
          } else if (q.status === 'active') {
            const doneBtn = document.createElement('button');
            doneBtn.className = 'approve';
            doneBtn.style.fontSize = '0.76rem';
            doneBtn.textContent = '✓ Completar';
            doneBtn.onclick = async () => {
              await fetchJson('/api/gm/quests/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: state.campaignId, id: q.id, status: 'completed' }),
              });
              await loadView();
            };
            gmActs.appendChild(doneBtn);
          }
          const delBtn = document.createElement('button');
          delBtn.className = 'reject';
          delBtn.style.fontSize = '0.76rem';
          delBtn.textContent = '✕';
          delBtn.onclick = async () => {
            await fetchJson('/api/gm/quests/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId: state.campaignId, id: q.id, action: 'delete' }),
            });
            await loadView();
          };
          gmActs.appendChild(delBtn);
          actDiv.appendChild(gmActs);
        }

        listEl.appendChild(card);
      }
    }

    function renderCampaignHub(view) {
      const ch = view.character;
      const visibleMap = new Map(view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      const asymNodes = view.visibleNodes.filter((n) => n.layer === 'asimetrica');
      const charCard = document.getElementById('campaignCharCard');
      charCard.innerHTML =
        '<div class="row" style="justify-content:space-between">' +
        '<strong style="font-family:var(--display-font);font-size:1.1rem">' + escapeHtml(ch.name) + '</strong>' +
        '<span class="badge asimetrica">' + escapeHtml(ch.class) + '</span></div>' +
        '<div class="muted" style="margin:4px 0 8px">' + escapeHtml(ch.race) + (ch.factions?.length ? ' · ' + escapeHtml(ch.factions.join(', ')) : '') + '</div>' +
        '<div class="field-label">Conocimiento Asimétrico Exclusivo (' + asymNodes.length + ')</div>' +
        '<div class="row">' +
        (asymNodes.length > 0
          ? asymNodes.map((n) => '<button class="wikilink-btn" data-char-node="' + escapeHtml(n.id) + '">📖 ' + escapeHtml(n.title) + '</button>').join('')
          : '<span class="muted">Sin secretos de trasfondo adicionales aún.</span>') +
        '</div>';
      charCard.querySelectorAll('button[data-char-node]').forEach((b) => {
        b.onclick = () => {
          selectNode(b.getAttribute('data-char-node'), true);
          setUiVariant('A');
        };
      });

      const ragList = document.getElementById('sceneRagList');
      ragList.innerHTML = '';
      for (const n of (view.relevantNodes || []).slice(0, 8)) {
        const btn = document.createElement('button');
        btn.className = 'choice-card-btn';
        btn.innerHTML =
          '<div class="row" style="justify-content:space-between;width:100%"><strong>' + escapeHtml(n.title) + '</strong>' +
          '<span class="badge ' + escapeHtml(n.layer) + '">' + escapeHtml(n.layer) + '</span></div>' +
          '<div class="muted">' + escapeHtml(n.matchReason || classifyCategory(n.relativePath)) + '</div>';
        btn.onclick = () => {
          if (visibleMap.has(n.id.toLowerCase())) {
            selectNode(n.id, true);
            setUiVariant('A');
          }
        };
        ragList.appendChild(btn);
      }

      const partyLoc = view.partyPosition?.label || view.sceneState.locationNodeId;
      document.getElementById('sceneSummary').innerHTML =
        '<div class="row" style="justify-content:space-between">' +
        '<div class="row"><span class="badge progresiva">📍 Grupo en: ' + escapeHtml(partyLoc) + '</span> ' +
        '<span class="badge base">Escena: ' + escapeHtml(view.sceneState.locationNodeId) + '</span> ' +
        (view.calendarDate ? '<span class="badge">📅 ' + escapeHtml(view.calendarDate.dayOfMonth + ' de ' + view.calendarDate.monthName) + '</span>' : '') + '</div>' +
        '<button id="sceneOpenGeoMapBtn" style="padding:4px 9px;font-size:0.78rem">🗺️ Ver en Mapa</button>' +
        '</div>' +
        '<h2 style="font-family:var(--display-font);margin:10px 0 6px">' + escapeHtml(view.sceneState.id) + '</h2>' +
        '<p style="font-family:var(--reader-font);font-size:var(--reader-size);margin:0">' + escapeHtml(view.sceneState.description) + '</p>' +
        (view.sceneState.activeThreats?.length
          ? '<div style="margin-top:8px"><span class="badge dm_secret">Amenazas: ' + escapeHtml(view.sceneState.activeThreats.join(', ')) + '</span></div>'
          : '');
      document.getElementById('sceneOpenGeoMapBtn').onclick = () => {
        setAtlasMode('geo');
        setUiVariant('B');
      };

      renderQuestBoard(view);

      // Barra de tirada rápida manual usando las 11 habilidades de Thyrenia
      const rollBar = document.getElementById('quickSkillRollBar');
      const sheet = view.characterSheet;
      if (rollBar && sheet) {
        rollBar.innerHTML = '';
        for (const sk of sheet.skills) {
          const baseMod = abilityMod(sheet.abilities[sk.defaultAbility]);
          const prof = sk.proficient ? sheet.proficiencyBonus : 0;
          const classBonus = sk.isClassSkill && sk.rank >= 1 ? 2 : 0;
          const total = baseMod + prof + sk.rank + classBonus;
          const b = document.createElement('button');
          b.style.padding = '4px 9px';
          b.style.fontSize = '0.78rem';
          b.textContent = '🎲 ' + sk.label + ' (' + (total >= 0 ? '+' : '') + total + ')';
          b.onclick = () => {
            const d20 = Math.floor(Math.random() * 20) + 1;
            const out = document.getElementById('manualRollResultBadge');
            out.classList.remove('hidden');
            out.textContent = sheet.name + ' · ' + sk.label + ': 1d20(' + d20 + ') + ' + total + ' = ' + (d20 + total);
          };
          rollBar.appendChild(b);
        }
      }

      const quickChoices = document.getElementById('quickChoices');
      if (quickChoices) {
        quickChoices.innerHTML =
          '<div class="card" style="padding:10px 12px; background:var(--bg-subtle); grid-column:1 / -1">' +
          '<strong>🔒 Generación IA en pausa — Mesa 100% Manual Activa</strong>' +
          '<div class="muted" style="font-size:0.82rem; margin-top:4px">' +
          'Las transiciones automáticas están bloqueadas mientras usamos el Tablero de Misiones, Cartografía y Bitácora manual.' +
          '</div></div>';
      }

      const manualLogs = (view.manualSessionLogs || []).map((m) => ({
        tag: '📝 Bitácora Manual · ' + m.dateLabel,
        loc: m.locationNodeId,
        title: m.title,
        body: m.summary,
      }));
      const histTurns = (view.turns || []).map((t) => ({
        tag: 'Turno #' + t.turnNumber,
        loc: t.locationNodeId,
        title: 'Acción: ' + t.playerAction,
        body: t.narration,
      }));
      const combined = [...manualLogs, ...histTurns].slice(-8).reverse();

      const turnList = document.getElementById('turnHistoryList');
      if (combined.length > 0) {
        turnList.innerHTML = combined.map((entry) =>
          '<div style="padding:10px;border-radius:10px;background:var(--bg-subtle);border:1px solid var(--border)">' +
          '<div><strong>' + escapeHtml(entry.tag) + '</strong> · <span class="muted">' + escapeHtml(entry.loc) + '</span></div>' +
          '<div class="muted">' + escapeHtml(entry.title) + '</div>' +
          '<div style="margin-top:4px;font-family:var(--reader-font)">' + escapeHtml(entry.body) + '</div></div>'
        ).join('');
      } else {
        turnList.innerHTML = '<div class="muted">Aún no se han registrado entradas manuales ni turnos en esta sesión.</div>';
      }
    }

    let lockToastTimer = null;
    function showLockToast(msg) {
      const toast = document.getElementById('lockToast');
      const text = String(msg || '');
      toast.textContent = text.startsWith('🔒') ? text : ('🔒 ' + text);
      toast.classList.remove('hidden');
      if (lockToastTimer) clearTimeout(lockToastTimer);
      lockToastTimer = setTimeout(() => toast.classList.add('hidden'), 4200);
    }

    function renderContextRibbon(data) {
      const campSelect = document.getElementById('campaignSelect');
      if (campSelect.options.length === 0 && data.campaigns) {
        for (const c of data.campaigns) {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          campSelect.appendChild(opt);
        }
      }
      state.campaignId = data.activeCampaign?.id || state.campaignId;
      campSelect.value = state.campaignId;

      if (data.calendarDate) {
        const badge = document.getElementById('calendarDateBadge');
        badge.textContent = '📅 ' + data.calendarDate.formatted;
        badge.title = data.calendarDate.divineInfluence;
      }

      document.getElementById('ribbonSceneBtn').innerHTML =
        '<strong>📍 ' + escapeHtml(data.sceneState.locationNodeId) + ' · Turno #' + data.sceneState.turnNumber + '</strong>' +
        '<span class="muted" style="font-size:0.78rem">' +
        escapeHtml(extractPlainExcerpt(data.sceneState.description, 88)) +
        '</span>';

      const wp = data.worldProgression || { revealedProgressiveCount: 0, totalProgressiveCount: 0 };
      const pct = wp.totalProgressiveCount > 0
        ? Math.round((wp.revealedProgressiveCount / wp.totalProgressiveCount) * 100)
        : 0;
      document.getElementById('worldProgSummary').textContent =
        wp.revealedProgressiveCount + '/' + wp.totalProgressiveCount + ' hitos';
      document.getElementById('worldProgFill').style.width = pct + '%';

      const activeQuestsCount = (data.quests || []).filter((q) => q.status === 'active').length;
      document.getElementById('quickQuestsBtn').textContent = '📜 Misiones (' + activeQuestsCount + ')';
    }

    function abilityMod(score) {
      return Math.floor((Number(score || 10) - 10) / 2);
    }

    function renderCharacterSheetModal(data) {
      const sheet = data.characterSheet;
      if (!sheet) return;
      document.getElementById('sheetModalTitle').textContent = 'Hoja de Thyrenia — ' + sheet.name;
      document.getElementById('sheetIdentityBadges').innerHTML =
        '<span class="badge asimetrica">' + escapeHtml(sheet.race) + ' · ' + escapeHtml(sheet.class) + ' Nv.' + sheet.level + '</span>' +
        '<span class="badge base">PG: ' + sheet.hp.current + '/' + sheet.hp.max + '</span>' +
        '<span class="badge">CA: ' + sheet.armorClass + '</span>' +
        '<span class="badge progresiva">Maná: ' + sheet.mana.current + '/' + sheet.mana.max + '</span>';

      document.getElementById('fortuneCountBadge').textContent = sheet.fortunePoints;
      document.getElementById('destinyCountBadge').textContent = sheet.destinyPoints;

      const abNames = { str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
      document.getElementById('sheetAbilitiesStrip').innerHTML = Object.entries(abNames).map(([k, label]) => {
        const val = sheet.abilities[k];
        const m = abilityMod(val);
        return '<div class="stat-box"><div class="muted">' + label + '</div><div class="big">' + (m >= 0 ? '+' : '') + m + '</div><div class="muted">' + val + '</div></div>';
      }).join('');

      const skillsGrid = document.getElementById('sheetSkillsGrid');
      skillsGrid.innerHTML = '';
      for (const sk of sheet.skills) {
        const baseMod = abilityMod(sheet.abilities[sk.defaultAbility]);
        const prof = sk.proficient ? sheet.proficiencyBonus : 0;
        const classBonus = sk.isClassSkill && sk.rank >= 1 ? 2 : 0;
        const total = baseMod + prof + sk.rank + classBonus;
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.innerHTML =
          '<div><strong>' + escapeHtml(sk.label) + '</strong> ' +
          (sk.isClassSkill ? '<span class="badge asimetrica" style="font-size:0.68rem">Clase</span> ' : '') +
          '<div class="muted" style="font-size:0.74rem">' + abNames[sk.defaultAbility] +
          ' · Rango ' + sk.rank + (sk.proficient ? ' · Comp.' : '') + '</div></div>' +
          '<div class="row"><strong style="font-size:1rem">' + (total >= 0 ? '+' : '') + total + '</strong>' +
          '<button style="padding:3px 8px;font-size:0.78rem">🎲</button></div>';
        row.querySelector('button').onclick = () => {
          const d20 = Math.floor(Math.random() * 20) + 1;
          const resEl = document.getElementById('sheetRollResult');
          resEl.classList.remove('hidden');
          resEl.textContent = '🎲 ' + sk.label + ': 1d20(' + d20 + ') + ' + total + ' = ' + (d20 + total);
        };
        skillsGrid.appendChild(row);
      }

      document.getElementById('sheetBeliefsList').innerHTML = sheet.beliefs.map((b, idx) =>
        '<label class="row" style="margin-bottom:6px;align-items:flex-start"><input type="checkbox" data-belief-idx="' + idx + '" ' +
        (b.markedThisSession ? 'checked' : '') + ' /><span>' + escapeHtml(b.text) + '</span></label>'
      ).join('') || '<span class="muted">Sin creencias definidas.</span>';

      document.querySelectorAll('input[data-belief-idx]').forEach((chk) => {
        chk.onchange = async () => {
          const idx = Number(chk.getAttribute('data-belief-idx'));
          const nextBeliefs = sheet.beliefs.map((b, i) => i === idx ? { ...b, markedThisSession: chk.checked } : b);
          await updateCharacterSheet({ beliefs: nextBeliefs });
        };
      });

      document.getElementById('sheetFlawsList').innerHTML = sheet.flaws.map((f) =>
        '<div style="margin-bottom:4px">• ' + escapeHtml(f) + '</div>'
      ).join('') || '<span class="muted">Sin defectos registrados.</span>';
    }

    async function updateCharacterSheet(patch) {
      if (!state.view?.characterSheet) return;
      const res = await fetchJson('/api/character/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state.view.characterSheet,
          ...patch,
          characterId: state.characterId,
        }),
      });
      state.view.characterSheet = res.characterSheet;
      renderCharacterSheetModal(state.view);
    }

    async function loadView() {
      const params = new URLSearchParams();
      if (state.campaignId) params.set('campaignId', state.campaignId);
      if (state.characterId) params.set('characterId', state.characterId);
      const data = await fetchJson('/api/view?' + params.toString());
      state.view = data;

      const select = document.getElementById('characterSelect');
      if (select.options.length === 0) {
        for (const ch of data.characters) {
          const opt = document.createElement('option');
          opt.value = ch.id;
          opt.textContent = ch.name + ' (' + ch.class + ')';
          select.appendChild(opt);
        }
      }
      state.characterId = data.character.id;
      select.value = state.characterId;

      renderContextRibbon(data);
      renderCharacterSheetModal(data);
      populateFilterDropdowns(data);
      renderWelcomePortal(data);
      renderCampaignHub(data);
      renderHierarchyTree();

      const dl = document.getElementById('vaultNodeTitlesList');
      if (dl) {
        dl.innerHTML = data.visibleNodes.map((n) => '<option value="' + escapeHtml(n.title) + '"></option>').join('');
      }
      populateStoryToolbar(data);
      if (state.variant === 'B') {
        if (state.atlasMode === 'geo') renderInteractiveWorldMap(document.getElementById('atlasGeoMapStage'), data, true);
        if (state.atlasMode === 'relations') renderRelationshipWeb(data);
      }

      if (!state.showPortal && state.selectedNodeId) {
        selectNode(state.selectedNodeId, false);
      } else {
        const visibleMap = new Map(data.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
        const fallback =
          visibleMap.get(data.character.name.toLowerCase()) ||
          visibleMap.get(data.sceneState.locationNodeId.toLowerCase()) ||
          data.visibleNodes[0];
        if (fallback) state.selectedNodeId = fallback.id;
        rebuildGraphData(false);
      }
    }

    function insertAtStoryCursor(snippet) {
      const ta = document.getElementById('playerStoryBody');
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? ta.value.length;
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);
      ta.value = before + snippet + after;
      const nextPos = start + snippet.length;
      ta.focus();
      ta.setSelectionRange(nextPos, nextPos);
    }

    function populateStoryToolbar(data) {
      const imgSel = document.getElementById('storyInsertImageSelect');
      if (imgSel) {
        const prev = imgSel.value;
        imgSel.innerHTML = '<option value="">🖼️ Imagen del Vault...</option>';
        for (const img of data.availableImages || []) {
          const opt = document.createElement('option');
          opt.value = img;
          opt.textContent = img;
          imgSel.appendChild(opt);
        }
        if (prev) imgSel.value = prev;
      }

      const sesSel = document.getElementById('storyInsertSessionSelect');
      if (sesSel) {
        sesSel.innerHTML = '<option value="">⏳ Enlazar Sesión...</option>';
        for (const e of data.plotTimeline?.entries || []) {
          if (e.kind === 'upcoming') continue;
          const opt = document.createElement('option');
          const baseName = e.sourceNoteRelativePath
            ? e.sourceNoteRelativePath.split('/').pop().replace(/\\.md$/i, '')
            : ('Sesion:' + e.id);
          opt.value = baseName + '|' + e.sessionTag + ': ' + e.title;
          opt.textContent = e.sessionTag + ' — ' + e.title.slice(0, 32);
          sesSel.appendChild(opt);
        }
      }

      const evSel = document.getElementById('storyInsertEventSelect');
      if (evSel) {
        evSel.innerHTML = '<option value="">🌙 Enlazar Evento...</option>';
        for (const m of data.plotTimeline?.cosmicWheel || []) {
          for (const f of m.festivals || []) {
            const opt = document.createElement('option');
            opt.value = 'Evento:' + f.name + '|' + f.icon + ' ' + f.name + ' (' + f.dayOfMonth + ' de ' + m.name + ')';
            opt.textContent = f.icon + ' ' + f.name + ' (' + m.name + ')';
            evSel.appendChild(opt);
          }
        }
      }
    }

    // === Estudio del GM ===
    async function loadGmOverview() {
      if (state.role !== 'gm') return;
      const params = new URLSearchParams();
      if (state.campaignId) params.set('campaignId', state.campaignId);
      const data = await fetchJson('/api/gm/vault/overview?' + params.toString());
      state.gmOverview = data;

      const folderSelect = document.getElementById('gmFolderSelect');
      const currentVal = folderSelect.value;
      folderSelect.innerHTML = '';
      for (const f of data.folders) {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        folderSelect.appendChild(opt);
      }
      if (currentVal) folderSelect.value = currentVal;

      const imgSelect = document.getElementById('gmImageSelect');
      const prevImg = imgSelect.value;
      imgSelect.innerHTML = '<option value="">(Automática / Según esfera)</option>';
      for (const imgName of data.availableImages || []) {
        const opt = document.createElement('option');
        opt.value = imgName;
        opt.textContent = imgName;
        imgSelect.appendChild(opt);
      }
      if (prevImg) imgSelect.value = prevImg;

      document.getElementById('gmSceneLocation').value = data.sceneState.locationNodeId || '';
      document.getElementById('gmSceneDescription').value = data.sceneState.description || '';
      document.getElementById('gmSceneThreats').value = (data.sceneState.activeThreats || []).join(', ');

      const stagedBox = document.getElementById('gmStagedMediaList');
      const stagedItems = data.stagedMedia || [];
      if (stagedBox) {
        if (stagedItems.length === 0) {
          stagedBox.classList.add('hidden');
          stagedBox.innerHTML = '';
        } else {
          stagedBox.classList.remove('hidden');
          stagedBox.innerHTML = '<strong style="font-size:0.82rem;width:100%">🖼️ Imágenes subidas por jugadores en espera de aprobación:</strong>';
          for (const fileName of stagedItems) {
            const chip = document.createElement('div');
            chip.className = 'row';
            chip.style.padding = '4px 8px';
            chip.style.borderRadius = '8px';
            chip.style.background = 'var(--bg-card)';
            chip.style.border = '1px solid var(--border)';
            chip.innerHTML =
              '<img src="/api/vault/media?file=' + encodeURIComponent(fileName) + '" alt="' + escapeHtml(fileName) + '" style="width:32px;height:32px;object-fit:cover;border-radius:6px" />' +
              '<span style="font-size:0.8rem">' + escapeHtml(fileName) + '</span>' +
              '<button class="approve" style="padding:3px 8px;font-size:0.74rem">✓ Guardar en /images</button>';
            chip.querySelector('button').onclick = async () => {
              await fetchJson('/api/gm/media/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName }),
              });
              await loadGmOverview();
              await loadView();
            };
            stagedBox.appendChild(chip);
          }
        }
      }

      renderGmFogList();
      await loadProposals();
    }

    function renderGmFogList() {
      if (!state.gmOverview) return;
      const filter = document.getElementById('gmFogSearch').value.trim().toLowerCase();
      const box = document.getElementById('gmFogList');
      const items = state.gmOverview.allNodes.filter((n) =>
        !filter ||
        n.title.toLowerCase().includes(filter) ||
        n.relativePath.toLowerCase().includes(filter) ||
        n.layer.toLowerCase().includes(filter)
      );
      document.getElementById('gmFogCount').textContent = items.length + ' nodos en Vault Maestro';
      box.innerHTML = '';
      for (const n of items.slice(0, 80)) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '6px';
        card.style.padding = '10px 12px';
        card.innerHTML =
          '<div class="row" style="justify-content:space-between">' +
          '<div><strong>' + escapeHtml(n.title) + '</strong> <span class="badge ' + escapeHtml(n.layer) + '">' + layerLabel(n.layer) + '</span>' +
          (n.hasDmSecrets ? ' <span class="badge dm_secret">%%Secreto%%</span>' : '') +
          '<div class="muted">' + escapeHtml(n.relativePath) + '</div></div>' +
          '<div class="row fog-actions"></div>' +
          '</div>';
        const actionsDiv = card.querySelector('.fog-actions');
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.onclick = () => loadNodeIntoGmEditor(n.relativePath);
        actionsDiv.appendChild(editBtn);

        if (n.layer === 'progresiva') {
          const toggleBtn = document.createElement('button');
          toggleBtn.className = n.isRevealedToParty ? 'reject' : 'approve';
          toggleBtn.textContent = n.isRevealedToParty ? 'Ocultar a Party' : 'Revelar a Party';
          toggleBtn.onclick = async () => {
            await fetchJson('/api/gm/fog/toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId: state.campaignId, nodeId: n.id, revealed: !n.isRevealedToParty }),
            });
            await loadGmOverview();
            await loadView();
          };
          actionsDiv.appendChild(toggleBtn);
        }
        box.appendChild(card);
      }
    }

    async function loadNodeIntoGmEditor(relativePath) {
      const data = await fetchJson('/api/gm/vault/node?relativePath=' + encodeURIComponent(relativePath));
      document.getElementById('gmNodeTitle').value = data.title;
      document.getElementById('gmFolderSelect').value = data.targetSubfolder;
      document.getElementById('gmLayerSelect').value = data.layer;
      document.getElementById('gmTagsInput').value = (data.tags || []).join(', ');
      document.getElementById('gmImageSelect').value = data.image || '';
      document.getElementById('gmCardTypeSelect').value = data.cardType || '';
      document.getElementById('gmPublicMarkdown').value = data.publicMarkdown || '';
      document.getElementById('gmSecretNotes').value = data.dmSecretNotes || '';
      document.getElementById('gmReqClasses').value = data.asymmetricRequirements?.classes?.join(', ') || '';
      document.getElementById('gmReqChars').value = data.asymmetricRequirements?.characterIds?.join(', ') || '';
      syncAsymVisibility();
      activateGmTab('editor');
      document.getElementById('gmStudioPanel').classList.remove('hidden');
    }

    function syncAsymVisibility() {
      const isAsym = document.getElementById('gmLayerSelect').value === 'asimetrica';
      document.getElementById('gmAsymFields').classList.toggle('hidden', !isAsym);
    }

    function activateGmTab(tabName) {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.toggle('hidden', p.id !== 'tab-' + tabName));
    }

    async function loadProposals() {
      if (state.role !== 'gm') return;
      const data = await fetchJson('/api/canon/proposals');
      const box = document.getElementById('canonQueueList');
      if (data.proposals.length === 0) {
        box.innerHTML = '<div class="muted">No hay Propuestas de Canon registradas aún.</div>';
        return;
      }
      box.innerHTML = '';
      for (const p of data.proposals) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '6px';
        card.style.padding = '10px 12px';
        card.innerHTML =
          '<div><strong>' + escapeHtml(p.title) + '</strong> (' + escapeHtml(p.category) + ') — <em>' + escapeHtml(p.status) + '</em></div>' +
          '<div class="muted">' + escapeHtml(p.summary) + '</div>' +
          '<div class="muted">Destino: ' + escapeHtml(p.targetSubfolder) + '</div>';
        if (p.status === 'pending') {
          const actions = document.createElement('div');
          actions.className = 'row';
          actions.style.marginTop = '6px';
          const approveBtn = document.createElement('button');
          approveBtn.className = 'approve';
          approveBtn.textContent = 'Aprobar y Escribir';
          approveBtn.onclick = async () => {
            await fetchJson('/api/canon/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ proposalId: p.id }),
            });
            await loadGmOverview();
            await loadView();
          };
          const rejectBtn = document.createElement('button');
          rejectBtn.className = 'reject';
          rejectBtn.textContent = 'Rechazar';
          rejectBtn.onclick = async () => {
            await fetchJson('/api/canon/reject', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ proposalId: p.id }),
            });
            await loadProposals();
          };
          actions.appendChild(approveBtn);
          actions.appendChild(rejectBtn);
          card.appendChild(actions);
        }
        box.appendChild(card);
      }
    }

    function applyRoleUi() {
      const isGm = state.role === 'gm';
      const badge = document.getElementById('roleBadge');
      badge.textContent = isGm ? 'GM (Estudio Activo)' : 'Jugador';
      badge.className = 'badge ' + (isGm ? 'gm' : 'base');
      document.getElementById('gmStudioPanel').classList.toggle('hidden', !isGm);
      document.getElementById('toggleGmModalBtn').classList.toggle('hidden', isGm);
      document.getElementById('advanceDayBtn').classList.toggle('hidden', !isGm);
      document.getElementById('gmGeoToolsBar').classList.toggle('hidden', !isGm);
      document.getElementById('gmToggleNewQuestBtn').classList.toggle('hidden', !isGm);
      document.getElementById('gmManualLogBox').classList.toggle('hidden', !isGm);
      if (!isGm) {
        state.gmMapClickMode = 'none';
        document.getElementById('gmPinPopover').classList.add('hidden');
      }
      if (isGm) document.getElementById('gmAuthPanel').classList.add('hidden');
      if (state.view) {
        renderQuestBoard(state.view);
        if (state.variant === 'B') {
          if (state.atlasMode === 'geo') renderInteractiveWorldMap(document.getElementById('atlasGeoMapStage'), state.view, true);
          if (state.atlasMode === 'relations') renderRelationshipWeb(state.view);
        }
      }
    }

    async function authenticateGm(payload) {
      const feedback = document.getElementById('gmAuthFeedback');
      try {
        const res = await fetchJson('/api/gm/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        state.role = 'gm';
        state.gmKey = res.gmKey;
        feedback.textContent = '';
        applyRoleUi();
        await loadGmOverview();
        if (!state.showPortal && state.selectedNodeId) selectNode(state.selectedNodeId, false);
      } catch (err) {
        feedback.textContent = err.message;
      }
    }

    async function runStep(actionOverride, fixtureKey) {
      showLockToast('La generación por IA está bloqueada temporalmente. Usa las herramientas manuales de mesa.');
      return;
    }

    // === Eventos UI ===
    function openSheetModal(tabName) {
      document.getElementById('playerSheetModal').classList.remove('hidden');
      document.querySelectorAll('button[data-sheet-tab]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-sheet-tab') === tabName);
      });
      document.getElementById('sheetTab-sheet').classList.toggle('hidden', tabName !== 'sheet');
      document.getElementById('sheetTab-story').classList.toggle('hidden', tabName !== 'story');
    }
    document.getElementById('openSheetModalBtn').addEventListener('click', () => {
      document.getElementById('fontPanel').classList.add('hidden');
      openSheetModal('sheet');
    });
    document.getElementById('openStoryModalBtn').addEventListener('click', () => {
      state.storyContextNodeId = null;
      document.getElementById('fontPanel').classList.add('hidden');
      openSheetModal('story');
    });
    document.getElementById('closeSheetModalBtn').addEventListener('click', () => {
      document.getElementById('playerSheetModal').classList.add('hidden');
    });
    document.querySelectorAll('button[data-sheet-tab]').forEach((btn) => {
      btn.addEventListener('click', () => openSheetModal(btn.getAttribute('data-sheet-tab')));
    });
    document.getElementById('fortunePlusBtn').addEventListener('click', () => {
      const cur = state.view?.characterSheet?.fortunePoints ?? 0;
      updateCharacterSheet({ fortunePoints: cur + 1 });
    });
    document.getElementById('fortuneMinusBtn').addEventListener('click', () => {
      const cur = state.view?.characterSheet?.fortunePoints ?? 0;
      updateCharacterSheet({ fortunePoints: Math.max(0, cur - 1) });
    });
    document.getElementById('destinyPlusBtn').addEventListener('click', () => {
      const cur = state.view?.characterSheet?.destinyPoints ?? 0;
      updateCharacterSheet({ destinyPoints: cur + 1 });
    });
    document.getElementById('destinyMinusBtn').addEventListener('click', () => {
      const cur = state.view?.characterSheet?.destinyPoints ?? 0;
      updateCharacterSheet({ destinyPoints: Math.max(0, cur - 1) });
    });
    document.getElementById('exportFoundryBtn').addEventListener('click', () => {
      window.location.href = '/api/character/foundry-export?characterId=' + encodeURIComponent(state.characterId) + '&download=1';
    });
    document.getElementById('gmExportCompendiumBtn').addEventListener('click', async () => {
      const url = '/api/foundry/compendium-export?campaignId=' + encodeURIComponent(state.campaignId) +
        '&characterId=' + encodeURIComponent(state.characterId) + '&includeGmSecrets=1&download=1';
      const res = await fetch(url, { headers: state.gmKey ? { 'x-thyrenia-gm-key': state.gmKey } : {} });
      if (!res.ok) {
        showLockToast('No se pudo exportar el compendio masivo.');
        return;
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = 'fvtt-Compendium-Thyrenia-' + (state.campaignId || 'campana') + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
    });
    document.getElementById('storyInsertImageBtn').addEventListener('click', () => {
      const val = document.getElementById('storyInsertImageSelect').value;
      if (val) insertAtStoryCursor('\\n![[' + val + ']]\\n');
    });
    document.getElementById('storyInsertSessionBtn').addEventListener('click', () => {
      const val = document.getElementById('storyInsertSessionSelect').value;
      if (val) insertAtStoryCursor('[[' + val + ']]');
    });
    document.getElementById('storyInsertEventBtn').addEventListener('click', () => {
      const val = document.getElementById('storyInsertEventSelect').value;
      if (val) insertAtStoryCursor('[[' + val + ']]');
    });
    document.getElementById('storyInsertNodeBtn').addEventListener('click', () => {
      const val = document.getElementById('storyInsertNodeInput').value.trim();
      if (val) {
        insertAtStoryCursor('[[' + val + ']]');
        document.getElementById('storyInsertNodeInput').value = '';
      }
    });
    document.getElementById('storyUploadImageBtn').addEventListener('click', () => {
      document.getElementById('storyUploadImageInput').click();
    });
    document.getElementById('storyUploadImageInput').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fb = document.getElementById('playerStoryFeedback');
      if (file.size > 2 * 1024 * 1024) {
        fb.textContent = 'La imagen supera el límite seguro de 2 MB.';
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          fb.textContent = 'Subiendo ilustración segura...';
          const res = await fetchJson('/api/player/media/propose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              dataUrl: String(reader.result || ''),
              characterId: state.characterId,
              campaignId: state.campaignId,
              targetNodeId: state.storyContextNodeId || undefined,
              caption: document.getElementById('playerStoryTitle').value.trim() || undefined,
            }),
          });
          insertAtStoryCursor('\\n' + res.markdownEmbed + '\\n');
          fb.textContent = 'Imagen "' + res.fileName + '" insertada y en espera de aprobación del DM para /images.';
          await loadView();
          if (state.role === 'gm') await loadGmOverview();
        } catch (err) {
          fb.textContent = 'Error al subir imagen: ' + err.message;
        } finally {
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('submitPlayerStoryBtn').addEventListener('click', async () => {
      const fb = document.getElementById('playerStoryFeedback');
      try {
        const res = await fetchJson('/api/player/propose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: state.characterId,
            campaignId: state.campaignId,
            targetKind: document.getElementById('playerStoryTarget').value,
            title: document.getElementById('playerStoryTitle').value.trim(),
            markdownContent: document.getElementById('playerStoryBody').value,
          }),
        });
        fb.textContent = 'Enviado al DM (' + res.proposal.id + '). Quedará en el Vault tras su aprobación.';
        document.getElementById('playerStoryTitle').value = '';
        document.getElementById('playerStoryBody').value = '';
        if (state.role === 'gm') await loadProposals();
      } catch (err) {
        fb.textContent = 'Error: ' + err.message;
      }
    });
    document.getElementById('campaignSelect').addEventListener('change', (e) => {
      state.campaignId = e.target.value;
      state.selectedNodeId = null;
      state.timelineIndex = -1;
      state.astralMonthIndex = null;
      state.showPortal = true;
      loadView();
      if (state.role === 'gm') loadGmOverview();
    });
    document.getElementById('timelinePrevBtn').addEventListener('click', () => {
      if (!state.view?.plotTimeline?.entries) return;
      state.timelineIndex = Math.max(0, state.timelineIndex - 1);
      renderPlotTimeline(state.view);
    });
    document.getElementById('timelineNextBtn').addEventListener('click', () => {
      const len = state.view?.plotTimeline?.entries?.length || 0;
      if (len === 0) return;
      state.timelineIndex = Math.min(len - 1, state.timelineIndex + 1);
      renderPlotTimeline(state.view);
    });
    document.getElementById('toggleAstralWheelBtn').addEventListener('click', () => {
      const box = document.getElementById('astralWheelBox');
      const hidden = box.classList.toggle('hidden');
      if (!hidden && state.view) {
        renderAstralWheel(state.view);
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    document.getElementById('ribbonSceneBtn').addEventListener('click', () => setUiVariant('C'));
    document.getElementById('advanceDayBtn').addEventListener('click', async () => {
      await fetchJson('/api/gm/calendar/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: state.campaignId, daysDelta: 1 }),
      });
      await loadView();
    });

    document.getElementById('homeLogoBtn').addEventListener('click', () => {
      setUiVariant('A');
      showWelcomePortal();
    });
    document.getElementById('toggleIndexDrawerBtn').addEventListener('click', () => toggleIndexDrawer());
    document.getElementById('closeIndexDrawerBtn').addEventListener('click', () => toggleIndexDrawer(false));
    document.getElementById('navBackdrop').addEventListener('click', () => toggleIndexDrawer(false));
    document.getElementById('closeSphereGalleryBtn').addEventListener('click', () => {
      document.getElementById('sphereGallerySection').classList.add('hidden');
      document.querySelectorAll('.sphere-card').forEach((c) => c.classList.remove('active-sphere'));
    });
    document.getElementById('openPortalBtn').addEventListener('click', showWelcomePortal);
    document.getElementById('backToPortalBtn').addEventListener('click', showWelcomePortal);
    document.getElementById('viewInMapBtn').addEventListener('click', () => {
      setAtlasMode('graph');
      setUiVariant('B');
    });
    document.getElementById('heroOpenMapBtn').addEventListener('click', () => {
      setAtlasMode('graph');
      setUiVariant('B');
    });
    document.getElementById('openAtlasFullBtn').addEventListener('click', () => {
      setAtlasMode('geo');
      setUiVariant('B');
    });
    document.getElementById('atlasModeGraphBtn').addEventListener('click', () => setAtlasMode('graph'));
    document.getElementById('atlasModeGeoBtn').addEventListener('click', () => setAtlasMode('geo'));
    document.getElementById('atlasModeRelBtn').addEventListener('click', () => setAtlasMode('relations'));
    document.getElementById('quickQuestsBtn').addEventListener('click', () => setUiVariant('C'));

    document.getElementById('gmClickPinModeBtn').addEventListener('click', () => {
      state.gmMapClickMode = state.gmMapClickMode === 'pin' ? 'none' : 'pin';
      document.getElementById('gmMapModeHint').textContent = state.gmMapClickMode === 'pin'
        ? 'Haz clic sobre cualquier punto del mapa para colocar o editar un pin.'
        : '';
      if (state.view) renderInteractiveWorldMap(document.getElementById('atlasGeoMapStage'), state.view, true);
    });
    document.getElementById('gmClickPartyModeBtn').addEventListener('click', () => {
      state.gmMapClickMode = state.gmMapClickMode === 'party' ? 'none' : 'party';
      document.getElementById('gmMapModeHint').textContent = state.gmMapClickMode === 'party'
        ? 'Haz clic sobre el mapa donde está ubicado el Grupo ahora.'
        : '';
      if (state.view) renderInteractiveWorldMap(document.getElementById('atlasGeoMapStage'), state.view, true);
    });
    document.getElementById('gmPinCloseBtn').addEventListener('click', () => {
      document.getElementById('gmPinPopover').classList.add('hidden');
    });
    document.getElementById('gmPinSaveBtn').addEventListener('click', async () => {
      const pop = document.getElementById('gmPinPopover');
      const label = document.getElementById('gmPinLabelInput').value.trim();
      if (!label) return;
      await fetchJson('/api/gm/map/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: state.campaignId,
          id: document.getElementById('gmPinIdInput').value || undefined,
          label,
          x: Number(pop.dataset.pinX || 50),
          y: Number(pop.dataset.pinY || 50),
          pinKind: document.getElementById('gmPinKindSelect').value,
          fogState: document.getElementById('gmPinFogSelect').value,
          linkedNodeId: document.getElementById('gmPinNodeInput').value.trim(),
          rumorTeaser: document.getElementById('gmPinRumorInput').value.trim(),
        }),
      });
      pop.classList.add('hidden');
      await loadGmOverview();
      await loadView();
    });
    document.getElementById('gmPinMovePartyHereBtn').addEventListener('click', async () => {
      const pop = document.getElementById('gmPinPopover');
      await fetchJson('/api/gm/map/party-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: state.campaignId,
          label: document.getElementById('gmPinLabelInput').value.trim() || 'Grupo',
          x: Number(pop.dataset.pinX || 50),
          y: Number(pop.dataset.pinY || 50),
          linkedNodeId: document.getElementById('gmPinNodeInput').value.trim() || undefined,
        }),
      });
      pop.classList.add('hidden');
      await loadView();
    });
    document.getElementById('gmPinDeleteBtn').addEventListener('click', async () => {
      const id = document.getElementById('gmPinIdInput').value;
      if (!id) return;
      await fetchJson('/api/gm/map/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: state.campaignId, id, delete: true }),
      });
      document.getElementById('gmPinPopover').classList.add('hidden');
      await loadGmOverview();
      await loadView();
    });

    document.getElementById('toggleProposeRelBtn').addEventListener('click', () => {
      document.getElementById('proposeRelForm').classList.toggle('hidden');
    });
    document.getElementById('submitRelProposalBtn').addEventListener('click', async () => {
      const sourceId = document.getElementById('relSourceInput').value.trim();
      const targetId = document.getElementById('relTargetInput').value.trim();
      const label = document.getElementById('relLabelInput').value.trim();
      if (!sourceId || !targetId || !label) return;
      await fetchJson('/api/player/rumor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: state.campaignId,
          characterId: state.characterId,
          kind: 'relationship',
          sourceId,
          targetId,
          relationKind: document.getElementById('relKindSelect').value,
          label,
        }),
      });
      document.getElementById('relLabelInput').value = '';
      document.getElementById('proposeRelForm').classList.add('hidden');
      await loadView();
    });

    document.querySelectorAll('#questFilterPills button[data-qfilter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.questFilter = btn.getAttribute('data-qfilter');
        if (state.view) renderQuestBoard(state.view);
      });
    });
    document.getElementById('toggleProposeRumorBtn').addEventListener('click', () => {
      document.getElementById('proposeRumorBox').classList.toggle('hidden');
    });
    document.getElementById('submitRumorBtn').addEventListener('click', async () => {
      const fb = document.getElementById('rumorFeedback');
      try {
        await fetchJson('/api/player/rumor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: state.campaignId,
            characterId: state.characterId,
            kind: 'quest_rumor',
            title: document.getElementById('rumorTitleInput').value.trim(),
            locationNodeId: document.getElementById('rumorLocInput').value.trim(),
            summary: document.getElementById('rumorSummaryInput').value.trim(),
          }),
        });
        fb.textContent = 'Rumor enviado al tablero para aprobación del DM.';
        document.getElementById('rumorTitleInput').value = '';
        document.getElementById('rumorSummaryInput').value = '';
        await loadView();
      } catch (err) {
        fb.textContent = 'Error: ' + err.message;
      }
    });
    document.getElementById('gmToggleNewQuestBtn').addEventListener('click', () => {
      document.getElementById('gmNewQuestBox').classList.toggle('hidden');
    });
    document.getElementById('gmCreateQuestBtn').addEventListener('click', async () => {
      const title = document.getElementById('gmQuestTitleInput').value.trim();
      const summary = document.getElementById('gmQuestSummaryInput').value.trim();
      const firstObj = document.getElementById('gmQuestObjInput').value.trim();
      if (!title || !summary) return;
      await fetchJson('/api/gm/quests/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: state.campaignId,
          title,
          kind: document.getElementById('gmQuestKindSelect').value,
          locationNodeId: document.getElementById('gmQuestLocInput').value.trim(),
          summary,
          objectives: firstObj ? [{ text: firstObj, done: false }] : [],
        }),
      });
      document.getElementById('gmQuestTitleInput').value = '';
      document.getElementById('gmQuestSummaryInput').value = '';
      document.getElementById('gmQuestObjInput').value = '';
      document.getElementById('gmNewQuestBox').classList.add('hidden');
      await loadView();
    });
    document.getElementById('gmAddManualLogBtn').addEventListener('click', async () => {
      const title = document.getElementById('gmManualLogTitle').value.trim();
      const summary = document.getElementById('gmManualLogBody').value.trim();
      if (!title || !summary) return;
      await fetchJson('/api/gm/session-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: state.campaignId,
          title,
          summary,
        }),
      });
      document.getElementById('gmManualLogTitle').value = '';
      document.getElementById('gmManualLogBody').value = '';
      await loadView();
    });
    document.getElementById('heroRandomBtn').addEventListener('click', pickRandomUnreadNode);
    document.getElementById('articleRandomBtn').addEventListener('click', pickRandomUnreadNode);
    document.getElementById('heroOpenSheetBtn').addEventListener('click', () => {
      if (!state.view) return;
      const visibleMap = new Map(state.view.visibleNodes.map((n) => [n.id.toLowerCase(), n]));
      const sheet = visibleMap.get(state.view.character.name.toLowerCase()) || visibleMap.get(state.view.character.id.toLowerCase());
      if (sheet) selectNode(sheet.id, true);
      else showWelcomePortal();
    });

    document.getElementById('characterSelect').addEventListener('change', (e) => {
      state.characterId = e.target.value;
      state.selectedNodeId = null;
      state.showPortal = true;
      loadView();
    });

    document.getElementById('quickThemeBtn').addEventListener('click', () => {
      const cur = localStorage.getItem('thyrenia_theme') || 'arcana';
      const next = cur === 'light-parchment' ? 'arcana' : 'light-parchment';
      localStorage.setItem('thyrenia_theme', next);
      applyTypographyPrefs();
    });
    document.getElementById('toggleFontPanelBtn').addEventListener('click', () => {
      document.getElementById('fontPanel').classList.toggle('hidden');
    });
    document.getElementById('closeFontPanelBtn').addEventListener('click', () => {
      document.getElementById('fontPanel').classList.add('hidden');
    });
    ['fontFamilySelect', 'fontSizeSelect', 'themeSelect'].forEach((id) => {
      document.getElementById(id).addEventListener('change', saveTypographyPrefs);
    });

    document.getElementById('toggleAdvFiltersBtn').addEventListener('click', (e) => {
      const box = document.getElementById('advFiltersBox');
      const hidden = box.classList.toggle('hidden');
      e.target.textContent = hidden ? 'Más filtros ▾' : 'Más filtros ▴';
    });

    function applyLayerFilter(nextLayer) {
      const val = nextLayer || 'all';
      state.filters.layer = val;
      document.getElementById('layerFilter').value = val;
      document.getElementById('mapLayerFilter').value = val;
      document.querySelectorAll('button[data-layer-pill]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-layer-pill') === val);
      });
      renderHierarchyTree();
      rebuildGraphData(false);
    }

    document.querySelectorAll('button[data-layer-pill]').forEach((btn) => {
      btn.addEventListener('click', () => applyLayerFilter(btn.getAttribute('data-layer-pill')));
    });

    // Sincronizar filtros entre Variante A y Variante B
    document.getElementById('ragQuery').addEventListener('input', (e) => {
      state.filters.query = e.target.value;
      document.getElementById('mapSearchInput').value = e.target.value;
      renderHierarchyTree();
      rebuildGraphData(false);
    });
    document.getElementById('mapSearchInput').addEventListener('input', (e) => {
      state.filters.query = e.target.value;
      document.getElementById('ragQuery').value = e.target.value;
      renderHierarchyTree();
      rebuildGraphData(false);
    });
    document.getElementById('layerFilter').addEventListener('change', (e) => applyLayerFilter(e.target.value));
    document.getElementById('mapLayerFilter').addEventListener('change', (e) => applyLayerFilter(e.target.value));
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      renderHierarchyTree();
      rebuildGraphData(false);
    });
    document.getElementById('tagFilter').addEventListener('change', (e) => {
      state.filters.tag = e.target.value;
      renderHierarchyTree();
      rebuildGraphData(false);
    });
    document.getElementById('scopeFilter').addEventListener('change', (e) => {
      state.filters.scope = e.target.value;
      rebuildGraphData(true);
    });

    // Eventos Drawer Variante B & Grafo
    document.getElementById('drawerCloseBtn').addEventListener('click', () => {
      document.getElementById('mapDrawer').classList.add('hidden');
    });
    document.getElementById('drawerOpenCodexBtn').addEventListener('click', () => {
      state.showPortal = false;
      setUiVariant('A');
      if (state.selectedNodeId) selectNode(state.selectedNodeId, false);
    });
    document.getElementById('togglePhysicsBtn').addEventListener('click', (e) => {
      state.physicsRunning = !state.physicsRunning;
      e.target.textContent = state.physicsRunning ? 'Pausar Física' : 'Reanudar Física';
    });
    document.getElementById('zoomInBtn').addEventListener('click', () => {
      state.camera.zoom = Math.min(3.4, state.camera.zoom * 1.25);
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
      state.camera.zoom = Math.max(0.3, state.camera.zoom / 1.25);
    });
    document.getElementById('centerGraphBtn').addEventListener('click', () => {
      const sel = state.simById.get(state.selectedNodeId);
      if (sel) {
        state.camera.x = -sel.x * state.camera.zoom;
        state.camera.y = -sel.y * state.camera.zoom;
      } else {
        state.camera.x = 0;
        state.camera.y = 0;
      }
    });

    const graphCanvas = document.getElementById('graphCanvas');
    graphCanvas.addEventListener('mousedown', (e) => {
      const pt = screenToWorld(e.clientX, e.clientY);
      const hit = findNodeAtWorld(pt.wx, pt.wy);
      state.dragMoved = false;
      if (hit) state.dragNode = hit;
      else state.panStart = { x: e.clientX - state.camera.x, y: e.clientY - state.camera.y };
    });
    window.addEventListener('mousemove', (e) => {
      const pt = screenToWorld(e.clientX, e.clientY);
      if (state.dragNode) {
        state.dragMoved = true;
        state.dragNode.x = pt.wx;
        state.dragNode.y = pt.wy;
        return;
      }
      if (state.panStart) {
        state.dragMoved = true;
        state.camera.x = e.clientX - state.panStart.x;
        state.camera.y = e.clientY - state.panStart.y;
        return;
      }
      const hit = findNodeAtWorld(pt.wx, pt.wy);
      state.hoverNode = hit;
      const tip = document.getElementById('graphTooltip');
      if (hit && e.target === graphCanvas) {
        tip.classList.remove('hidden');
        tip.style.left = Math.min(pt.sx + 14, graphCanvas.clientWidth - 240) + 'px';
        tip.style.top = Math.max(12, pt.sy - 14) + 'px';
        tip.innerHTML =
          '<strong>' + escapeHtml(hit.node.title) + '</strong><br/>' +
          '<span class="muted">' + layerLabel(hit.node.layer) + ' · ' + escapeHtml(classifyCategory(hit.node.relativePath)) + '</span><br/>' +
          '<span class="muted">' + hit.degree + ' enlaces visibles · Clic para leer</span>';
        graphCanvas.style.cursor = 'pointer';
      } else {
        tip.classList.add('hidden');
        graphCanvas.style.cursor = 'grab';
      }
    });
    window.addEventListener('mouseup', () => {
      if (state.dragNode && !state.dragMoved) {
        selectNode(state.dragNode.id, false);
      }
      state.dragNode = null;
      state.panStart = null;
    });
    graphCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      state.camera.zoom = Math.min(3.5, Math.max(0.3, state.camera.zoom * factor));
    }, { passive: false });

    // Eventos Prototipo Switcher (prototype/UI.md)
    document.querySelectorAll('.proto-pill').forEach((btn) => {
      btn.addEventListener('click', () => setUiVariant(btn.dataset.variant));
    });
    document.getElementById('protoPrevBtn').addEventListener('click', () => cycleVariant(-1));
    document.getElementById('protoNextBtn').addEventListener('click', () => cycleVariant(1));
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setUiVariant('A');
        toggleIndexDrawer();
        return;
      }
      if (e.key === 'Escape') {
        toggleIndexDrawer(false);
        hideWikilinkPreview();
        document.getElementById('fontPanel').classList.add('hidden');
        document.getElementById('playerSheetModal').classList.add('hidden');
        return;
      }
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable) return;
      if (e.key === 'ArrowLeft') cycleVariant(-1);
      if (e.key === 'ArrowRight') cycleVariant(1);
    });

    // Eventos Escena & Estudio del GM
    document.getElementById('stepBtn').addEventListener('click', () => runStep());
    document.getElementById('toggleGmModalBtn').addEventListener('click', () => {
      document.getElementById('fontPanel').classList.add('hidden');
      document.getElementById('gmAuthPanel').classList.toggle('hidden');
    });
    document.getElementById('closeGmAuthBtn').addEventListener('click', () => {
      document.getElementById('gmAuthPanel').classList.add('hidden');
    });
    document.getElementById('gmLoginKeyBtn').addEventListener('click', () => {
      authenticateGm({ gmKey: document.getElementById('gmKeyInput').value.trim() });
    });
    document.getElementById('gmQuickLocalBtn').addEventListener('click', () => {
      authenticateGm({ localQuickLogin: true });
    });
    document.getElementById('gmLogoutBtn').addEventListener('click', () => {
      state.role = 'player';
      state.gmKey = '';
      applyRoleUi();
      if (!state.showPortal && state.selectedNodeId) selectNode(state.selectedNodeId, false);
    });
    document.getElementById('gmRefreshBtn').addEventListener('click', async () => {
      await loadGmOverview();
      await loadView();
    });
    document.getElementById('gmLayerSelect').addEventListener('change', syncAsymVisibility);
    document.getElementById('gmFogSearch').addEventListener('input', renderGmFogList);
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => activateGmTab(btn.dataset.tab));
    });
    document.getElementById('gmInsertImageBtn').addEventListener('click', () => {
      const sel = document.getElementById('gmImageSelect').value;
      if (!sel) return;
      const ta = document.getElementById('gmPublicMarkdown');
      const snippet = '\\n![[' + sel + ']]\\n';
      ta.value = (ta.value || '').trimEnd() + snippet;
    });
    document.getElementById('gmSaveNodeBtn').addEventListener('click', async () => {
      const statusEl = document.getElementById('gmSaveStatus');
      try {
        const parseList = (val) => val.split(',').map((s) => s.trim()).filter(Boolean);
        const res = await fetchJson('/api/gm/vault/save-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: document.getElementById('gmNodeTitle').value.trim(),
            targetSubfolder: document.getElementById('gmFolderSelect').value,
            layer: document.getElementById('gmLayerSelect').value,
            tags: parseList(document.getElementById('gmTagsInput').value),
            image: document.getElementById('gmImageSelect').value,
            cardType: document.getElementById('gmCardTypeSelect').value || undefined,
            campaignId: state.campaignId,
            asymmetricRequirements: {
              classes: parseList(document.getElementById('gmReqClasses').value.toLowerCase()),
              characterIds: parseList(document.getElementById('gmReqChars').value.toLowerCase()),
              races: [],
              factions: [],
            },
            publicMarkdown: document.getElementById('gmPublicMarkdown').value,
            dmSecretNotes: document.getElementById('gmSecretNotes').value,
            revealImmediately: document.getElementById('gmRevealNowCheck').checked,
          }),
        });
        statusEl.textContent = 'Guardado en Vault Maestro: ' + res.relativePath;
        await loadGmOverview();
        await loadView();
      } catch (err) {
        statusEl.textContent = 'Error: ' + err.message;
      }
    });
    document.getElementById('gmNewNodeBtn').addEventListener('click', () => {
      document.getElementById('gmNodeTitle').value = '';
      document.getElementById('gmTagsInput').value = '';
      document.getElementById('gmImageSelect').value = '';
      document.getElementById('gmCardTypeSelect').value = '';
      document.getElementById('gmPublicMarkdown').value = '';
      document.getElementById('gmSecretNotes').value = '';
      document.getElementById('gmReqClasses').value = '';
      document.getElementById('gmReqChars').value = '';
      document.getElementById('gmRevealNowCheck').checked = false;
      document.getElementById('gmSaveStatus').textContent = '';
    });
    document.getElementById('gmUpdateSceneBtn').addEventListener('click', async () => {
      const statusEl = document.getElementById('gmSceneStatus');
      try {
        await fetchJson('/api/gm/scene/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: state.campaignId,
            locationNodeId: document.getElementById('gmSceneLocation').value.trim(),
            description: document.getElementById('gmSceneDescription').value.trim(),
            activeThreats: document.getElementById('gmSceneThreats').value.split(',').map((s) => s.trim()).filter(Boolean),
          }),
        });
        statusEl.textContent = 'Escena actualizada en SQLite.';
        await loadView();
      } catch (err) {
        statusEl.textContent = 'Error: ' + err.message;
      }
    });
    document.getElementById('chronicleBtn').addEventListener('click', async () => {
      showLockToast('Síntesis por IA bloqueada. Usa el Editor Visual del Vault o Propuestas Manuales.');
      return;
    });

    // Inicialización
    applyTypographyPrefs();
    applyRoleUi();
    const initialVariant = new URLSearchParams(window.location.search).get('variant') || 'A';
    setUiVariant(initialVariant);
    loadView().then(() => {
      requestAnimationFrame(graphLoop);
    }).catch((err) => console.error(err));
  </script>
</body>
</html>`;
}
