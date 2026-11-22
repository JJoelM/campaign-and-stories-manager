# Inferencia de Capas por Carpeta y Frontmatter Opcional

Decidimos aplicar un principio de "convención sobre configuración" para que el Vault Maestro funcione de inmediato sin requerir la edición manual masiva de notas existentes:

- **Capa Base (Pública)**: Se infiere automáticamente para las notas en `00 - Lore Central y Cosmogonia` y `02 - Compendio de Reglas y Fichas`, salvo que contengan etiquetas `#secreto` o bloques de comentarios `%%dm_only%%`.
- **Capa Progresiva (Campaña)**: Se infiere automáticamente para las notas dentro de `01 - Campanas`, permaneciendo bloqueadas hasta que el motor de estados o el DM las active para la Party.
- **Capa Asimétrica / Anulaciones**: Se definen de forma opcional mediante frontmatter YAML (`capa: asimetrica`, `requisitos: [...]`) o etiquetas estructuradas (`#lore/asimetrico/clase/hechicero`).
