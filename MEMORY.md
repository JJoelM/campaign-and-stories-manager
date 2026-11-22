# MEMORY.md — Memoria Técnica y de Arquitectura (Thyrenia Engine)

Memoria persistente del proyecto para conservar decisiones consolidadas, invariantes de seguridad, arquitectura de módulos y lecciones técnicas no evidentes en la configuración base.

## Estado Actual de la Plataforma

- **Motor y Servidor (`src/`)**:
  - **Compilador e Indexador Zero-Trust**: `src/compiler/vault-context-compiler.ts` y `src/compiler/vault-sqlite-indexer.ts` procesan el **Vault Maestro** externo filtrando de forma determinista `%%...%%`, `#secreto` y capas no autorizadas de la **Niebla de Guerra Estratificada** (**Capa Base**, **Capa Asimétrica**, **Capa Progresiva**).
  - **Persistencia y Estado**: `src/infra/sqlite-client.ts`, `src/engine/campaign-session-store.ts`, `src/engine/canon-approval-queue.ts` y `src/engine/scene-transition-engine.ts` mantienen campañas, **Estado de Escena**, hojas de PJ, pines/mapas de Atlas, misiones, sesiones y **Propuestas de Canon** en SQLite local (`.runtime/thyrenia.sqlite`).
  - **Seguridad y Auditoría**: `src/security/security-guard.ts` y `src/cli/security-audit.ts` proveen `SafeVaultPathGuard`, `InputSanitizer`, `SecretRedactor`, `VocabularyGuard`, `constantTimeEqual` y `RateLimiter`.
  - **API y Servidor Web**: `src/web/server.ts` y `src/web/app-handler.ts` sirven la SPA compilada (`dist/web/`), medios del vault (`/api/vault/media`), exportaciones compatibles con **FoundryVTT** (`buildFoundryVttActorJson`, `buildFoundryVttJournalJson`, `buildFoundryVttCompendiumBundle`) y endpoints autenticados del GM.
  - **Modo Operativo Predeterminado**: `aiGenerationLocked: true` en `src/web/server.ts` (salvo `THYRENIA_DISABLE_AI=0`), priorizando juego 100% manual en mesa y exportación directa a VTT.
- **Player Web App (`web/src/`)**:
  - Modularizada por vista y dominio en `web/src/components/` (`EntryGate.tsx`, `CampaignView.tsx`, `AtlasView.tsx`, `CodexView.tsx`, `SheetView.tsx`, `ImageCropperModal.tsx`), subcomponentes en `campaign/`, `atlas/`, `sheet/` y `drawers/`, utilidades en `web/src/lib/` (`api.ts`, `markdown.ts`, `usePopoverDismiss.ts`) y hoja de estilos unificada en `web/src/styles/app.css`.

## Reglas e Invariantes de UI/UX ("Menos es más" · WoW + Octopath + D&D 5e)

1. **Estética Artesanal Sin Clichés de IA**:
   - Inspiración combinada en **World of Warcraft**, **Octopath Traveler** y **D&D 5e**: esquineras SVG en latón envejecido (`.panel::after`), fileteado doble interior (`.panel::before`), reglas cónicas carmesí/dorado (`.section-header-rule`), divisores `◆`, temas **Grimorio Nocturno** y **Pergamino de Día**. Evitar estilos neón, glassmorphism genérico o estridencias gratuitas.
2. **Jerarquía, Grilla 8pt y Economía de Clics**:
   - Topbar estricta en 1 línea (`62px` desktop) con navegación por pilares (**Campaña**, **Atlas**, **Códice**, **Ficha**).
   - Márgenes exteriores amplios en escritorio (`width: min(1100px, calc(100% - 128px))` desde `780px` y `min(1140px, calc(100% - 176px))` desde `1280px`) y ritmo vertical de `36px`.
3. **Flujos Principales Verificados**:
   - **`EntryGate`**: acceso como Jugador (sin fricción) o GM con clave verificada en servidor.
   - **`Campaña`**: escena activa, **Hilo de la Trama** con centrado horizontal y teclado (`ArrowLeft`/`ArrowRight`), **Rueda Astral**, tablero de misiones/rumores y tirador rápido `1d20` con coreografía (`d20Tumble`, críticos `d20 === 20` y pifias `d20 === 1`).
   - **`Atlas Multi-Nivel`**: navegación jerárquica (`Planisferio → Continente → Ciudad`) filtrada por conocimiento del grupo, zoom hasta `225%` con paneo por arrastre y restablecimiento en 1 clic (`100%`), red de Relaciones y Constelación a 1 salto.
   - **`Ficha` y `Códice`**: cinta pasiva de combate, **PG / Maná** en gemas segmentadas, **Fortuna / Destino** en runas clicables con estado optimista (`pendingPatch`), escudos de atributos D&D 5e con óvalo inferior superpuesto, compositor de notas con recorte de imágenes (`ImageCropperModal`) en cola de aprobación y cierre de menús `.menu-popover` por clic externo o `Escape` (`usePopoverDismiss`).

## Seguridad de Sesión y Runtime (`ADR-0011`, `ADR-0012`)

- **Sesiones GM**: `/api/gm/verify` valida mediante `constantTimeEqual` (`crypto.timingSafeEqual` sobre SHA-256), protege contra fuerza bruta con `RateLimiter` (`gmAuthRateLimiter`: 10 intentos / 60s) y emite tokens revocables `gmsess_...`; `/api/gm/logout` los revoca explícitamente.
- **Cabeceras y Límites**: `app-handler.ts` aplica `COMMON_SECURITY_HEADERS` (CSP estricta con `img-src 'self' data: blob:`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`), control de tamaño de payload (`413`) y bloqueo remoto en `/api/canon/approve|reject` si no hay sesión GM válida.

## Lecciones Técnicas y Gotchas de Implementación

- **Select nativo en Chromium (`web/src/styles/app.css`)**: ocultar `<select class="char-select">` en móvil únicamente dentro de `@media (max-width: 779px) { .char-select { display: none; } }`. Nunca fijar `display: inline-block` en desktop porque anula el layout interno `inline-flex` del User-Agent y desplaza la flecha `▼` a una segunda línea.
- **Sin `overflow: hidden` en `.panel` / `.surface-card`**: permite que sobresalgan limpiamente los óvalos `.stat-medallion-score` (`bottom: -11px`) y los menús `.menu-popover`.
- **Especificidad en botones activos**: mantener `button:not(.btn-primary):not(.active):hover:not(:disabled)` para conservar el contraste dorado/tinta en `.nav-pill.active` y `.segmented-tab.active`.
- **Paneo y pines en el Atlas (`AtlasGeoMapSubView.tsx`)**: usar `draggable={false}` y `cursor: inherit` en la imagen del mapa para permitir arrastrar sin activar el *drag-and-drop* nativo del navegador; conservar `transform: translate(-50%, -50%)` en `button.map-icon-pin:active:not(:disabled)` para que los pines no salten al presionarlos.
- **Estado del servidor en desarrollo**: `app-handler.ts` lee `dist/web/` dinámicamente en disco por petición; tras editar `web/src/`, ejecutar `pnpm web:build` actualiza el servicio activo sin necesidad de reiniciar `pnpm web`. En PowerShell 5.1, encadenar comandos con `; if ($LASTEXITCODE -eq 0) { ... }` (sin `&&`).

## Hitos Recientes (`origin/master`)

- `ee91f7a` — Lanzamiento inicial, endurecimiento de seguridad/sesiones GM, `README.md`, `.gitignore` y modularización del frontend.
- `3b7ce02` — Primer rediseño editorial WoW + Octopath Traveler + D&D y espaciado web 8pt.
- `9f6dfa6` — Esquineras SVG Octopath, escudos D&D 5e, vitrina `1d20`, grillas tabulares y estado optimista en vitalidad/runas.
- `9503311` — Micro-interacciones táctiles (`150ms–340ms`), coreografía `1d20` (crítico/pifia), paneo/zoom del **Atlas Multi-Nivel**, centrado del **Hilo de la Trama**, `usePopoverDismiss` y accesibilidad `prefers-reduced-motion`.
