# 02: Compilador del Vault Maestro, Niebla de Guerra Estratificada y Guardián Léxico de Thyrenia

**What to build:** Asegurar que el compilador del **Vault Maestro** aplique con fidelidad el **Filtro de Visibilidad** y la **Niebla de Guerra Estratificada** sobre notas reales de Obsidian sin requerir ediciones masivas: las fichas individuales de personajes pertenecen automáticamente a su **Capa Asimétrica**, los guiones o notas sueltas de campaña en raíz se protegen en la **Capa Progresiva**, los comentarios `%%...%%` y etiquetas `#secreto` se extirpan antes de cualquier invocación al modelo, y el guardián léxico detecta tanto singulares como plurales de palabras anacrónicas prohibidas en Thyrenia.

**Blocked by:** 01: Blindaje de Ciberseguridad, TokenBudgetGuard y Auditoría Zero-Trust

**Status:** resolved

- [x] Las fichas ubicadas en carpetas de personajes del **Vault Maestro** se infieren automáticamente en la **Capa Asimétrica** vinculadas al identificador o nombre del personaje correspondiente, siendo visibles solo para ese jugador.
- [x] Los guiones o notas de sesión ubicados en la raíz del **Vault Maestro** sin frontmatter explícito de **Capa Base** se clasifican en **Capa Progresiva** para evitar filtraciones prematuras.
- [x] El guardián léxico de Thyrenia detecta tanto formas singulares como plurales morfológicos en español de términos prohibidos (como cafés, robots, semanas, restaurantes o dineros).
- [x] Las pruebas unitarias y la compilación sobre el **Vault Maestro** real verifican el conteo correcto de la **Capa Asimétrica**, la exclusión de secretos y la detección de plurales prohibidos.
