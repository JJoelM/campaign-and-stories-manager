# Especificación UI/UX Mobile-First — Thyrenia Engine (React + Vite, `/grill-me` Q1–Q14)

## Decisiones Cerradas

- **Q1 — Navegación por Intención:** 3 destinos principales (`🎲 Campaña`, `🗺️ Atlas`, `📖 Códice`) + `🛡️ Ficha`.
- **Q2 & Q9 — Estética y Temas:** **Alta Fantasía Editorial + Estética VTT Teatral**. Tema principal **Grimorio Nocturno** (obsidiana cálida + bronce/oro envejecido) + **Pergamino de Día** de alto contraste. Acciones técnicas (FoundryVTT) en menús discretos (`⋯`).
- **Q3 & Q8 — Portada y Flujo de `Campaña`:** Hero ilustrado corto (sin texto superpuesto a la imagen) → Hilo de la Trama compacto sin scrollbar nativo feo → Escena y Posición Actual → Tablero de Misiones y Rumores → Tirador Rápido con Registro Vivo de Tiradas y Bitácora. Purga total de fugas técnicas (`ESCENA-POSADA-01`, `vecino_grafo`, `Status: Tags:`, `[cite:]`, pipes `|`).
- **Q4 & Q10 — Stack React + Vite (`ADR-0001`):** Frontend modular en `web/` compilado a `dist/web/` y servido por `pnpm web` en el mismo puerto `3000` (1 solo comando y 1 solo túnel Cloudflare), más `pnpm web:dev` con Hot Reload.
- **Q5 & Q6 — Mobile-First para Mesa Presencial:** Barra inferior fija ergonómica para el pulgar (`Campaña · Atlas · Códice · Ficha`) + mini-header de 1 línea en móvil/tablet; barra superior estricta de 1 fila (`56px`) en escritorio.
- **Q7 — Atlas Táctil:** Pines compactos de icono + *Bottom Sheet* deslizable al tocar un pin + desplazamiento anti-colisión de `📍 Grupo`; barra de submodos fuera del lienzo; **Red de Relaciones** con leyenda y alto contraste; **Constelación de Lore** limitada a 1 salto (máx. 18–20 nodos).
- **Q11 — Lector Editorial Inmediato:** Cabecera compacta (título + 1 línea de metadatos + menú `⋯`), banner superior **solo si el nodo tiene ilustración propia** (sin repetir portada genérica), modo libro limpio para `Capitulos Narrados`.
- **Q12 — Editor Móvil de Notas (`🛡️ Ficha`):** 3 botones táctiles (`🖼️ Imagen` con galería de miniaturas + subida desde dispositivo, `⏳ Sesión / Evento` agrupado, `📖 Lore`) + pestañas con estado activo inequívoco.
- **Q13 — Modo GM Híbrido:** Cajón rápido de **Acciones GM en Mesa** cómodo en móvil/tablet (`+1 Día`, Niebla, Aprobar Rumores/Imágenes, Mover Grupo) + Estudio completo de edición Markdown y Exportación Compendio FoundryVTT para laptop/tablet.
