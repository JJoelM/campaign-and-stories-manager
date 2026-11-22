# 03: Indexador SQLite del Grafo de Nodos de Lore y Recuperación Contextual (RAG Local)

**What to build:** Indexar en una base de datos SQLite local los **Nodos de Lore** y enlaces del grafo ya filtrados por el **Filtro de Visibilidad** (Zero-Trust) para recuperar automáticamente los nodos más relevantes según la ubicación actual del **Estado de Escena**, sus vecinos directos en el grafo de adyacencia y la similitud semántica/léxica con la acción del jugador, alimentando al motor de estados con contexto preciso sin desbordar la ventana del modelo ni exponer nodos ocultos.

**Blocked by:** 02: Compilador del Vault Maestro, Niebla de Guerra Estratificada y Guardián Léxico de Thyrenia

**Status:** resolved

- [x] El indexador SQLite crea y actualiza transaccionalmente las tablas de **Nodos de Lore** y aristas exclusivamente a partir de la vista ya filtrada para el personaje activo.
- [x] La búsqueda contextual combina cercanía en el grafo desde la ubicación del **Estado de Escena**, prioridad por **Capa Asimétrica** o **Capa Progresiva**, y relevancia léxica TF-IDF frente a la consulta del jugador.
- [x] El constructor de prompts del motor de **Transición de Estado** utiliza el ranking contextual para priorizar los **Nodos de Lore** vinculados a la escena y a la acción del jugador.
- [x] Las pruebas automatizadas confirman que ningún nodo oculto o secreto del DM entra al índice ni aparece en los resultados de recuperación.
