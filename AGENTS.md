# AGENTS.md — Thyrenia Engine

Este repositorio (`C:\Users\joelm\source\repos\thyrenia-engine`) aloja el código del motor narrativo, el compilador de **Niebla de Guerra Estratificada**, el Harness Especializado de Gemini y toda la documentación de arquitectura, skills y especificaciones de Thyrenia.

El **Vault Maestro** de Obsidian reside de forma externa y limpia de artefactos de desarrollo (configurable mediante `VAULT_PATH` en `.env`, según `ADR-0006`).

## Reglas Fundamentales de Dominio y Ciberseguridad

1. **Glosario, Memoria y ADRs Obligatorios**:
   - Antes de realizar cualquier cambio, lee `GLOSSARY.md`, `MEMORY.md` y los registros en `docs/adr/0001-*.md` hasta `docs/adr/0012-*.md` en la raíz de este repositorio.
   - Usa estrictamente los términos canónicos: **Vault Maestro**, **Player Web App**, **Nodo de Lore**, **Filtro de Visibilidad**, **Niebla de Guerra Estratificada** (**Capa Base**, **Capa Asimétrica**, **Capa Progresiva**), **Estado de Escena**, **Transición de Estado**, **Propuesta de Canon**, **Crónica**, **Atlas Multi-Nivel** y **Rueda Astral**.
2. **Vocabulario Inmersivo de Thyrenia**:
   - Respeta siempre la tabla de `00 - Lore Central y Cosmogonia/Términos de Thyrenia.md` del **Vault Maestro**. Está prohibido que las narrativas generadas utilicen términos anacrónicos como "café" (usar *qoketh*), "robot" (usar *gólem/autómata/constructo*), "semana" (usar *septimana*), "restaurante" (usar *salón de banquetes/taberna/posada*), "dinero" (usar *moneda/oro/plata*) o "a.m./p.m.".
3. **Ciberseguridad, Sesiones GM y Protección del Vault (`ADR-0004`, `ADR-0011`)**:
   - Ningún proceso automático de IA puede sobreescribir notas del **Vault Maestro** sin pasar por la puerta de aprobación del DM (`CanonApprovalQueue`). El servidor web opera por defecto con `aiGenerationLocked: true` salvo habilitación explícita.
   - Toda escritura aprobada debe validarse con `SafeVaultPathGuard` contra *Path Traversal* (bloqueando `..` y directorios `.obsidian`, `.agents`, `.git`, `.scratch`).
   - Las claves `GEMINI_API_KEY` jamás deben pasarse por query params (`?key=`), jamás deben exponerse en el cliente y deben ser redactadas con `SecretRedactor` antes de guardar logs o fixtures.
   - La autenticación de GM debe usar comparación en tiempo constante (`constantTimeEqual`), limitación de tasa (`RateLimiter`), tokens de sesión revocables (`gmsess_...` con `/api/gm/logout`), cabeceras de seguridad CSP/`X-Frame-Options`/`nosniff` y bloqueo remoto de aprobación/rechazo de canon sin sesión válida.
4. **Diseño UI/UX Artesanal y Arquitectura Frontend (`ADR-0012`)**:
   - Sigue la regla de *"menos es más"* (función sobre forma, economía de clics y jerarquía clara) con estética **World of Warcraft + Octopath Traveler + D&D 5e** (temas *Grimorio Nocturno* y *Pergamino de Día*, fileteado doble, esquineras SVG en latón, escudos D&D 5e y micro-interacciones táctiles de `150ms–340ms` con `@media (prefers-reduced-motion: reduce)`), evitando temas genéricos neón/luxury de IA.
   - Respeta la grilla de 8pt (márgenes exteriores `>= 64px` en escritorio), la modularización en `web/src/components/{campaign,atlas,sheet,drawers}/` y los cuidados técnicos documentados en `MEMORY.md` (`.char-select`, `.menu-popover` sin `overflow: hidden` en `.panel`, paneo del Atlas).
5. **Verificación Continua**:
   - Ejecuta `pnpm typecheck`, `pnpm typecheck:web`, `pnpm web:build`, `pnpm test` y `pnpm security:audit` antes de dar por finalizada cualquier tarea (en PowerShell 5.1 encadena con `; if ($LASTEXITCODE -eq 0) { ... }`).

## Agent skills

### Project memory

Architectural state, verified flows, security invariants, and non-obvious CSS/browser gotchas live in `MEMORY.md` at the repo root. Read before touching `web/src/` or `src/web/`.

### Issue tracker

Issues and specs are tracked as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` and `docs/adr/` at the repo root). See `docs/agents/domain.md`.
