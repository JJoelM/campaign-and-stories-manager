# Thyrenia Engine — Gestor de Campañas, Lore e Historias

**Thyrenia Engine** es un motor narrativo y aplicación web para campañas de rol de mesa e historias conectadas a un **Vault Maestro** en Markdown (Obsidian). Compila el conocimiento del mundo mediante **Niebla de Guerra Estratificada** e incluye exportación compatible con **FoundryVTT**.

---

## Características Principales

- **Compilador Zero-Trust (`VaultContextCompiler`)**: filtra de forma determinista comentarios privados del DM (`%%...%%`), etiquetas `#secreto` y nodos no desbloqueados antes de exponer cualquier **Nodo de Lore** a los jugadores.
- **Niebla de Guerra Estratificada**:
  - **Capa Base**: conocimiento público del mundo.
  - **Capa Asimétrica**: secretos revelados solo según linaje, clase o facción del personaje.
  - **Capa Progresiva**: descubrimientos desbloqueados por el Director de Juego durante la campaña.
- **Player Web App (React + Vite, Mobile-First)**:
  - **Pantalla de Inicio**: ingreso por personaje de jugador o autenticación como Director de Juego (GM).
  - **Campaña**: escena en curso, hilo cronológico de sesiones, calendario propio, Rueda Astral, tablero de misiones/rumores y tirador rápido 1d20 con bitácora.
  - **Atlas Multi-Nivel**: navegación jerárquica (Planisferio → Continente → Ciudad) filtrada por conocimiento del grupo, red de relaciones y constelación de lore a 1 salto.
  - **Códice y Ficha de PJ**: lectura limpia con wikilinks interactivos, vitalidad y atributos editables en mesa, y compositor de crónicas con recorte de imágenes sujeto a cola de aprobación del DM (`CanonApprovalQueue`).
- **Consola del DM e Interoperabilidad FoundryVTT**: control de escena, niebla, calendario, aprobación de propuestas e imágenes, editor de Markdown y exportación de Actores, Journals y Compendios para FoundryVTT.

---

## Requisitos e Instalación Rápida

- **Node.js 22+** y **pnpm**

1. Clona el repositorio e instala dependencias:
   ```bash
   pnpm install
   ```
2. Crea tu configuración local a partir de `.env.example` y define la ruta de tu Vault Maestro (`VAULT_PATH`):
   ```bash
   cp .env.example .env
   ```
3. Compila la interfaz web e inicia el servidor:
   ```bash
   pnpm web:build
   pnpm web
   ```
   La aplicación quedará disponible en `http://127.0.0.1:3000`.

---

## Comandos Útiles

- `pnpm typecheck` y `pnpm typecheck:web`: verificación de tipos en backend y frontend.
- `pnpm test`: suite de pruebas automatizadas.
- `pnpm security:audit`: auditoría de secretos y seguridad.
- `pnpm web:dev`: servidor de desarrollo Vite con recarga rápida.

---

## Documentación

- [GLOSSARY.md](./GLOSSARY.md): vocabulario canónico del dominio.
- [AGENTS.md](./AGENTS.md): reglas de ciberseguridad y desarrollo.
- `docs/adr/`: registros de decisiones de arquitectura.
