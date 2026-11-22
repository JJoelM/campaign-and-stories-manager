# Thyrenia Engine

Plataforma y motor narrativo interactivo para campañas TTRPG de Thyrenia, utilizando notas interconectadas como fuente de verdad y modelos de IA guiados por flujos lógicos.

## Language

**Vault Maestro**:
El repositorio original de notas de Obsidian del DM que contiene todo el lore, secretos, mecánicas y preparación de campañas.
_Avoid_: Base de datos cruda, notas sueltas

**Player Web App**:
La aplicación web interactiva que consumen los jugadores para explorar el mapa de conocimiento, fichas reveladas y tomar decisiones narrativas guiadas por IA.
_Avoid_: Portal web, Obsidian publish

**Nodo de Lore**:
Entidad o concepto del mundo (personaje, facción, lugar, reliquia, evento) representado como una nota markdown interconectada mediante wikilinks con propiedades estructuradas.
_Avoid_: Página, archivo de texto

**Filtro de Visibilidad**:
Mecanismo que evalúa metadatos (tags, frontmatter o comentarios `%%...%%`) para determinar qué partes de un nodo de lore son visibles para los jugadores y cuáles son exclusivas del DM.
_Avoid_: Censura, filtro de permisos

**Niebla de Guerra Estratificada**:
Sistema de visualización del grafo en tres niveles de visibilidad: Capa Base (pública y compartida), Capa Asimétrica (revelada solo a jugadores específicos por su trasfondo/clase) y Capa Progresiva (desbloqueada grupalmente por hitos de campaña).
_Avoid_: Mapa estático, revelación binaria

**Capa Base**:
Nodos públicos y fundamentales del mundo que todos los jugadores conocen al ingresar a Thyrenia.
_Avoid_: Lore general

**Capa Asimétrica**:
Nodos y conexiones visibles únicamente para un jugador o rol específico en función de sus condiciones de personaje.
_Avoid_: Secretos individuales

**Capa Progresiva**:
Nodos activados y revelados para toda la party tras alcanzar transiciones y logros validados por el motor de estados.
_Avoid_: Nodos descubiertos

**Estado de Escena**:
Momento y contexto activo dentro de la partida (participantes presentes, ubicación, amenazas activas, variables de entorno y opciones de acción válidas).
_Avoid_: Turno, situación, pantalla


**Transición de Estado**:
Cambio determinista o probabilístico del estado del mundo provocado por las acciones de los jugadores o eventos del entorno, validado contra las reglas del juego y esquemas JSON.
_Avoid_: Respuesta del bot, siguiente mensaje

**Propuesta de Canon**:
Sugerencia estructurada generada por el motor narrativo (nuevo PNJ, cambio en una facción, evento histórico) que requiere la validación del DM antes de convertirse en una nota permanente del Vault Maestro.
_Avoid_: Borrador, sugerencia de texto

**Crónica**:
Registro canónico de eventos, elecciones y consecuencias ocurridas durante una sesión o interacción, persistido de vuelta en el vault maestro.
_Avoid_: Log, historial de chat



