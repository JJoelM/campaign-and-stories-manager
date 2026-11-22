# Especificación Consolidada: Gestor Manual de Mundos de Thyrenia (`/grill-me` Q1–Q14)

> **Estado:** Generación por IA bloqueada (`aiGenerationLocked: true`, Modo 100% Manual).
> **Base documental:** Investigación de **FoundryVTT** (*Monk's Enhanced Journal*, *Pin Cushion*, *Forien's Quest Log*, *Simple Calendar*, *Quick Insert*) y **vvd (`vvd.world`)** + **LegendKeeper** + **Kanka**, aterrizada sobre la estructura real del **Vault Maestro**.

## 1. Benchmark Aplicado a Thyrenia

| Referente | Capacidad clave adaptada | Integración en Thyrenia Engine |
| :--- | :--- | :--- |
| **vvd (`vvd.world`)** | Cards estructuradas tipadas, relación visual entre entidades, lectura literaria limpia (`Quill`), postura cero-IA. | **Cards Tipadas** no destructivas + **Red de Relaciones** en Atlas + **Esfera `📚 Crónicas y Capítulos`**. |
| **FoundryVTT — *Monk's Enhanced Journal*** | Fichas visuales diferenciadas por tipo de entidad en lugar de diarios planos uniformes. | Inferencia automática de tipo (`character`, `location`, `faction`, `quest_clue`, `session`, `chapter`, `deity`, `rule_lore`) con cabecera estructurada y exportación **`JournalEntry JSON`**. |
| **FoundryVTT — *Pin Cushion* + *LegendKeeper*** | Pines con icono por categoría, tooltip rico y visibilidad por permiso sobre cartografía. | **Pines Cartográficos** sobre `image1.jpg` en **3 estados de Niebla** (`discovered`, `rumor`, `secret`) + marcador **`📍 El Grupo está Aquí`**. |
| **FoundryVTT — *Forien's Quest Log*** | Tablero vivo de misiones, objetivos marcables y rumores vinculados a PNJs y lugares. | **Tablero de Misiones y Rumores** en **Mesa de Campaña (Variante C)** con propuestas de jugadores aprobables en 1 clic por el GM. |
| **FoundryVTT — *Simple Calendar*** | Calendario propio sincronizado con estaciones y festividades. | Ya activo vía **Calendario de Thyrenia**, **Hilo de la Trama** y **Rueda Astral**. |
| **FoundryVTT — *Quick Insert*** | Salto rápido con atajo `Ctrl+K` sin navegar árboles profundos. | Paleta de índice bajo demanda (`Ctrl+K`) + portada minimalista (**Menos es Más**). |

## 2. Decisiones Cerradas en `/grill-me` (Q1–Q14)

- **Q1 — Variante C como Mesa Manual:** Convertir `Mesa de Campaña (Variante C)` en tablero manual activo (Escena actual, Posición del Grupo, Tablero de Misiones, Bitácora manual, Dado rápido) sin inputs muertos de IA.
- **Q2 & Q6 — Cards Tipadas no destructivas:** Inferir tipo y atributos al leer carpetas (`Personajes/`, `Pistas/`, `Notas de Sesion/`, `Capitulos Narrados/`, `Geografia y Planos/`, `Panteon Divino/`) y frontmatter opcional, sin modificar notas existentes salvo edición explícita desde el Estudio del GM.
- **Q3, Q7 & Q11 — Cartografía Viva con Pines de 3 Estados:** Pines dinámicos sobre `image1.jpg` en 3 estados (`Descubierto` nítido / `Rumor` ámbar difuso / `Secreto` invisible a jugadores) + `"📍 El Grupo está Aquí"`. El GM coloca pines y mueve al grupo haciendo clic directo sobre el mapa.
- **Q4, Q8 & Q12 — Misiones y Relaciones con "Menos es Más":** **Misiones/Rumores** en **Variante C** (acceso compacto en barra); **Red de Relaciones** como submodo de **Variante B (Atlas)**; **Variante A (`📖 Códice Editorial`)** libre de saturación. Control oficial del GM + sugerencias de rumores/teorías por jugadores aprobables en 1 clic.
- **Q5 — Persistencia Híbrida Segura:** SQLite `.runtime/thyrenia.sqlite` para coordenadas `x,y`, posición del grupo, progreso vivo de misiones y bitácora manual; archivos `.md` canon en el **Vault Maestro** exclusivamente vía puerta de aprobación del DM (`CanonApprovalQueue` + `SafeVaultPathGuard`, `ADR-0004`).
- **Q9 — Partidas + Novelas (`Capitulos Narrados/`):** Esfera dedicada **📚 Crónicas y Capítulos** con lectura pura estilo libro manteniendo activa la **Niebla de Guerra Estratificada**.
- **Q10 — Cards Esqueleto Colaborativas (decisión explícita del usuario):** Mantener visibles las notas esqueleto en galerías con insignia `📝 Por completar`, cabecera tipada + *Backlinks* y CTA **`✍️ Proponer Descripción al DM`** para co-crear el mundo con los jugadores.
- **Q13 — Puente Ampliado con FoundryVTT:** Exportación a demanda de **JournalEntry JSON** para cualquier Card/Misión/Sesión (con exclusión Zero-Trust de `%%...%%` para jugadores y opción privada para GM), sumada al **Actor JSON** ya existente.
- **Q14 — Ejecución por Fases:** Fases 1 (Cards Tipadas + Esqueletos + Esfera Capítulos), 2 (Pines Cartográficos + Posición del Grupo) y 3 (Mesa Manual + Misiones + Red de Relaciones + Export Journal FoundryVTT).
