# AGENTS.md — Thyrenia Engine

Este repositorio (`C:\Users\joelm\source\repos\thyrenia-engine`) aloja el código del motor narrativo, el compilador de **Niebla de Guerra Estratificada**, el Harness Especializado de Gemini y toda la documentación de arquitectura, skills y especificaciones de Thyrenia.

El **Vault Maestro** de Obsidian reside de forma externa y limpia de artefactos de desarrollo (configurable mediante `VAULT_PATH` en `.env`, según `ADR-0006`).

## Reglas Fundamentales de Dominio y Ciberseguridad

1. **Glosario y ADRs Obligatorios**:
   - Antes de realizar cualquier cambio, lee `GLOSSARY.md` y los registros en `docs/adr/0001-*.md` hasta `docs/adr/0011-*.md` en la raíz de este repositorio.
   - Usa estrictamente los términos canónicos: **Vault Maestro**, **Player Web App**, **Nodo de Lore**, **Filtro de Visibilidad**, **Niebla de Guerra Estratificada** (**Capa Base**, **Capa Asimétrica**, **Capa Progresiva**), **Estado de Escena**, **Transición de Estado**, **Propuesta de Canon** y **Crónica**.
2. **Vocabulario Inmersivo de Thyrenia**:
   - Respeta siempre la tabla de `00 - Lore Central y Cosmogonia/Términos de Thyrenia.md` del **Vault Maestro**. Está prohibido que las narrativas generadas utilicen términos anacrónicos como "café" (usar *qoketh*), "robot" (usar *gólem/autómata/constructo*), "semana" (usar *septimana*), "restaurante" (usar *salón de banquetes/taberna/posada*), "dinero" (usar *moneda/oro/plata*) o "a.m./p.m.".
3. **Ciberseguridad y Protección del Vault (`ADR-0004`, `ADR-0011`)**:
   - Ningún proceso automático de IA puede sobreescribir notas del **Vault Maestro** sin pasar por la puerta de aprobación del DM (`CanonApprovalQueue`).
   - Toda escritura aprobada debe validarse con `SafeVaultPathGuard` contra *Path Traversal* (bloqueando `..` y directorios `.obsidian`, `.agents`, `.git`, `.scratch`).
   - Las claves `GEMINI_API_KEY` jamás deben pasarse por query params (`?key=`), jamás deben exponerse en el cliente y deben ser redactadas con `SecretRedactor` antes de guardar logs o fixtures.
4. **Verificación Continua**:
   - Ejecuta `pnpm typecheck`, `pnpm test` y `pnpm security:audit` antes de dar por finalizada cualquier tarea.

## Agent skills

### Issue tracker

Issues and specs are tracked as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` and `docs/adr/` at the repo root). See `docs/agents/domain.md`.
