---
Status: accepted (complementa y evoluciona la entrega web de ADR-0001 y ADR-0005)
---

# SPA React + Vite y Estética Artesanal WoW + Octopath + D&D 5e

Decidimos implementar la **Player Web App** como una SPA ligera en **React 19 + Vite + TypeScript** (`web/src/`) servida directamente por el servidor HTTP local de Node (`src/web/app-handler.ts`), en lugar de desplegar un runtime completo de Next.js. Además, fijamos la operación predeterminada en modo mesa 100% manual (`aiGenerationLocked: true`) con exportación compatible con **FoundryVTT** (`Actor`, `JournalEntry` y `Adventure`).

En el plano visual y de usabilidad ("menos es más", función sobre forma), adoptamos una identidad artesanal inspirada en **World of Warcraft**, **Octopath Traveler** y **D&D 5e** sobre una grilla de 8pt con márgenes exteriores generosos en escritorio (`>= 64px`): esquineras SVG de latón envejecido, fileteado doble, reglas cónicas carmesí/dorado, escudos de atributos D&D 5e, cartela de mapa e interacciones táctiles rápidas (`150ms–340ms`) con respeto estricto a `@media (prefers-reduced-motion: reduce)`, evitando temas genéricos o estilizados neón.
