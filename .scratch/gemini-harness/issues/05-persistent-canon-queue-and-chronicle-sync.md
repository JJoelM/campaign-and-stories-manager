# 05: Persistencia SQLite de Sesiones, Bandeja de Propuestas de Canon y Sincronización de Crónicas

**What to build:** Dotar de persistencia duradera en SQLite local al estado de campaña (**Estado de Escena**, estado del grupo e historial de **Transiciones de Estado**) y a la Bandeja de **Propuestas de Canon** del DM, incorporando la capacidad de sintetizar una **Crónica** canónica a partir de los turnos jugados y encolarla para aprobación explícita del DM antes de persistirse como nota Markdown en el **Vault Maestro** bajo protección contra *Path Traversal*.

**Blocked by:** 03: Indexador SQLite del Grafo de Nodos de Lore y Recuperación Contextual (RAG Local), 04: Enrutamiento Multimodelo Gemini, Síntesis de Crónicas y Juez Automatizado (LLM-as-a-Judge)

**Status:** resolved

- [x] El almacén de sesiones persiste y recupera desde SQLite el **Estado de Escena**, el estado de revelación progresiva y reputación del grupo, y el historial ordenado de turnos jugados.
- [x] La bandeja de **Propuestas de Canon** soporta persistencia opcional en SQLite conservando propuestas pendientes, aprobadas y rechazadas entre reinicios.
- [x] La síntesis de **Crónica** genera una propuesta de categoría `chronicle_entry` que permanece en estado pendiente y solo se escribe en el **Vault Maestro** tras aprobación explícita del DM validada por la guardia de rutas seguras y redacción de secretos.
- [x] Las pruebas verifican la persistencia entre instancias de base de datos, el encolado de **Crónicas** y el bloqueo de rutas inseguras al aprobar.
