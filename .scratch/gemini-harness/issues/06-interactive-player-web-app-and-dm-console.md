# 06: Player Web App Interactiva (Grafo de Niebla de Guerra Estratificada, Consola FSM y Bandeja del DM)

**What to build:** Exponer la **Player Web App** local-first sobre HTTP con un grafo visual interactivo de la **Niebla de Guerra Estratificada** (**Capa Base**, **Capa Asimétrica** y **Capa Progresiva**), selector de personaje en vivo, buscador contextual de **Nodos de Lore**, consola de juego para ejecutar **Transiciones de Estado** desde el **Estado de Escena** actual, y consola de revisión para que el DM apruebe o rechace **Propuestas de Canon** y genere **Crónicas** hacia el **Vault Maestro**.

**Blocked by:** 04: Enrutamiento Multimodelo Gemini, Síntesis de Crónicas y Juez Automatizado (LLM-as-a-Judge), 05: Persistencia SQLite de Sesiones, Bandeja de Propuestas de Canon y Sincronización de Crónicas

**Status:** resolved

- [x] La **Player Web App** sirve la interfaz interactiva con visualización en grafo de los **Nodos de Lore** diferenciando visualmente **Capa Base**, **Capa Asimétrica** y **Capa Progresiva** según el personaje seleccionado.
- [x] La API de vista y búsqueda devuelve nodos filtrados por el **Filtro de Visibilidad** sin exponer jamás secretos del DM ni nodos de capas no desbloqueadas.
- [x] La API de escena ejecuta un paso en la máquina de estados, persiste el nuevo **Estado de Escena** e historial en SQLite, y actualiza la cola de **Propuestas de Canon**.
- [x] La API del DM permite listar propuestas pendientes, aprobar o rechazar una **Propuesta de Canon** y sintetizar una **Crónica** de sesión, verificado mediante pruebas de integración HTTP.
