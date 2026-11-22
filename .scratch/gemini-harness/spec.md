# Spec: Harness Especializado de Desarrollo, Evaluación, Simulación y Ciberseguridad para Gemini

Status: ready-for-agent

## Problem Statement

El Dungeon Master (DM) de Thyrenia posee un **Vault Maestro** en Obsidian rico en cosmogonía, reglas de maná, facciones y campañas interconectadas mediante wikilinks, pero carece de una plataforma interactiva donde los jugadores puedan explorar este mundo respetando qué sabe cada personaje y qué permanece oculto. Además, al integrar modelos de IA (Google Gemini) para guiar narrativas dinámicas y decisiones ramificadas de TTRPG, existen riesgos críticos tanto narrativos como de ciberseguridad: que el modelo alucine lore no canónico, utilice vocabulario anacrónico prohibido (como "café" en lugar de "qoketh" o "robot" en lugar de "gólem"), filtre secretos exclusivos del DM a los jugadores mediante ataques de *prompt injection*, exponga la `GEMINI_API_KEY` en trazas o fixtures, permita ataques de *Path Traversal* al escribir notas generadas por IA en el sistema de archivos, o agote la cuota de la API.

## Solution

Construir un **Harness Especializado de Desarrollo, Evaluación, Simulación y Seguridad para Gemini** en el repositorio desacoplado `C:\Users\joelm\source\repos\thyrenia-engine` utilizando `pnpm` y TypeScript. El Harness actúa como el núcleo profundo y blindado del motor de Thyrenia: se conecta al **Vault Maestro** mediante `VAULT_PATH`, aplica de forma determinista (Zero-Trust) el **Filtro de Visibilidad** y la **Niebla de Guerra Estratificada** (**Capa Base**, **Capa Asimétrica** y **Capa Progresiva**) antes de invocar al LLM, protege las credenciales mediante cabeceras `x-goog-api-key` y redacción automática (`SecretRedactor`), sanitiza entradas del jugador (`InputSanitizer`), previene escrituras arbitrarias con validación canónica de rutas (`SafeVaultPathGuard`), controla cuotas mediante `RateLimiter`, orquesta la Máquina de Estados Finita (FSM) con los modelos actuales de Google AI Studio (`gemini-4-carbon`, `gemini-4-argon`, `gemini-4-hydrogen`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-decision-1`), canaliza alteraciones hacia una cola de **Propuestas de Canon** y ofrece una suite de pruebas automatizadas (`replay` y `live-eval`) junto con una CLI interactiva (Workbench).

## User Stories

1. Como DM, quiero que el motor lea directamente mi **Vault Maestro** a través de una ruta configurable (`VAULT_PATH`) desde un repositorio de código externo a Google Drive (`C:\Users\joelm\source\repos\thyrenia-engine`), para que `node_modules` y los artefactos de compilación nunca bloqueen ni saturen la sincronización en la nube de mis notas.
2. Como DM, quiero un comando de diagnóstico (`pnpm harness:models`) que consulte la API de Google AI Studio enviando mi clave mediante la cabecera segura `x-goog-api-key` (nunca en la URL) y liste todos los modelos Gemini disponibles (`gemini-4-carbon`, `gemini-4-argon`, `gemini-4-hydrogen`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-decision-1`), para verificar conectividad sin exponer credenciales en logs de red.
3. Como DM, quiero que un redactor de secretos (`SecretRedactor`) filtre automáticamente cualquier cadena con formato de API Key (`AIza...`), token Bearer o credencial antes de guardar fixtures en disco o imprimir errores en consola, para evitar fugas accidentales en el repositorio.
4. Como DM, quiero un comando de auditoría de seguridad (`pnpm security:audit`) que escanee todo el código y las fixtures en busca de posibles claves filtradas o configuraciones inseguras, para trabajar con tranquilidad antes de cada commit.
5. Como DM, quiero que las notas en `00 - Lore Central y Cosmogonia` y `02 - Compendio de Reglas y Fichas` se clasifiquen automáticamente en la **Capa Base** sin necesidad de editarlas, para que todo mi trabajo actual funcione desde el primer día.
6. Como DM, quiero que las notas ubicadas dentro de `01 - Campanas` se clasifiquen automáticamente en la **Capa Progresiva**, para que permanezcan ocultas a los jugadores hasta que el grupo las descubra en partida.
7. Como DM, quiero poder añadir frontmatter YAML opcional (`capa: asimetrica`, `requisitos`) o etiquetas estructuradas en cualquier nota, para asignar conocimientos exclusivos a la **Capa Asimétrica** según la raza, clase o trasfondo de un personaje.
8. Como DM, quiero que cualquier texto encerrado entre comentarios de Obsidian (`%%...%%`) o marcado con `#secreto` sea extirpado determinísticamente en TypeScript por el **Filtro de Visibilidad** antes de enviarse al contexto del LLM, para que ni siquiera un ataque de *prompt injection* pueda exfiltrar secretos que el modelo jamás recibió.
9. Como jugador con un personaje específico (ej. Hechicero), quiero que el motor compile una vista del mundo que incluya la **Capa Base**, los nodos descubiertos por mi grupo en la **Capa Progresiva** y únicamente los nodos de la **Capa Asimétrica** cuyos requisitos cumplo, para experimentar un descubrimiento asimétrico seguro.
10. Como DM, quiero que las acciones en texto libre de los jugadores pasen por un sanitizador (`InputSanitizer`) que limite su longitud, elimine caracteres de control, detecte patrones evidentes de inyección de instrucciones y las encapsule en etiquetas `<untrusted_player_action>`, para proteger la integridad del sistema de prompts.
11. Como DM, quiero que el parser extraiga todos los wikilinks (`[[Destino]]` y `[[Destino|Alias]]`) de las notas y construya el grafo de adyacencia filtrado según las capas visibles del jugador, evitando revelar enlaces hacia nodos ocultos.
12. Como DM, quiero que el motor cargue automáticamente la tabla de equivalencias de `Términos de Thyrenia.md`, para inyectar las restricciones léxicas en el prompt del sistema y auditar con `VocabularyGuard` que la narrativa nunca use términos prohibidos ("café", "dinero", "restaurante", "semana", "robot", "a.m./p.m.").
13. Como jugador en una sesión activa, quiero enviar una acción o decisión frente a un **Estado de Escena** y recibir una **Transición de Estado** estructurada que contenga narrativa inmersiva, resolución de tiradas de dados, cambios en banderas de entorno y nuevos **Nodos de Lore** desbloqueados.
14. Como DM, quiero que las tiradas de dados y chequeos de dificultad (DC) asociados a una acción puedan ser resueltos determinísticamente por el motor o inyectados como semilla controlada en los tests, para que la reactividad algorítmica sea reproducible.
15. Como DM, quiero que cuando ocurra un evento trascendental en una escena, el motor genere una **Propuesta de Canon** en una cola pendiente (`CanonApprovalQueue`) en lugar de modificar archivos del **Vault Maestro**, para mantener el control total sobre la fuente de verdad.
16. Como DM, quiero que al aprobar una **Propuesta de Canon**, el módulo `SafeVaultPathGuard` valide canónicamente la ruta destino asegurando que esté estrictamente contenida dentro de las carpetas permitidas del **Vault Maestro** y bloquee cualquier intento de *Path Traversal* (`..`) o escritura en `.obsidian`, `.agents`, `.git` o `.scratch`.
17. Como DM, quiero que el driver de Gemini incluya un limitador de frecuencia (`RateLimiter`) y un presupuesto máximo de tokens por turno (`TokenBudgetGuard`), para proteger mi cuenta de Google AI Studio contra bucles infinitos o agotamiento de cuota.
18. Como desarrollador del proyecto, quiero ejecutar la suite de tests en modo `replay` por defecto (`pnpm test`), resolviendo llamadas contra fixtures JSON sanitizadas en milisegundos, sin red y sin coste de API.
19. Como desarrollador del proyecto, quiero una suite de evaluaciones (`pnpm test:evals`) y un Workbench CLI interactivo (`pnpm harness`) para simular partidas, probar defensas contra *prompt injection* y congelar escenarios dorados (*golden fixtures*).

## Implementation Decisions

- **Módulos Profundos del Harness**:
  1. `SecurityGuard` (`SecretRedactor`, `SafeVaultPathGuard`, `InputSanitizer`, `RateLimiter`):
     - `SecretRedactor`: Reemplaza patrones `/AIza[0-9A-Za-z\-_]{35}/g`, tokens `Bearer ...` y valores de `GEMINI_API_KEY` por `[REDACTED_API_KEY]`.
     - `SafeVaultPathGuard`: Verifica mediante `path.resolve` y `path.relative` que toda ruta de escritura resida dentro del directorio raíz del **Vault Maestro**, no contenga segmentos que comiencen con `.` (bloqueando `.obsidian`, `.agents`, `.git`, `.scratch`) y fuerce extensión `.md`.
     - `InputSanitizer`: Trunca entradas superiores al límite configurado (ej. 1000 caracteres), limpia caracteres de control ASCII no imprimibles, neutraliza cierres prematuros de etiquetas `</untrusted_player_action>` y envuelve la entrada en el contenedor aislado.
     - `RateLimiter`: Ventana deslizante en memoria para limitar el número máximo de llamadas a la API por minuto.
  2. `VaultContextCompiler`:
     - Escanea `VAULT_PATH` en modo de sólo lectura, parsea frontmatter YAML, etiquetas y wikilinks, extirpa bloques `%%...%%`, aplica las reglas de `ADR-0007` y `ADR-0008` para filtrar **Capa Base**, **Capa Asimétrica** y **Capa Progresiva**, y extrae el diccionario de términos prohibidos desde `00 - Lore Central y Cosmogonia/Términos de Thyrenia.md`.
  3. `GeminiNarrativeDriver`:
     - Configura `@ai-sdk/google` con lectura segura de `GEMINI_API_KEY` desde entorno de servidor.
     - Implementa `verifyAvailableModels()` usando `fetch('https://generativelanguage.googleapis.com/v1beta/models', { headers: { 'x-goog-api-key': apiKey } })`.
     - Soporta modos `replay` (offline con fixtures), `record` (graba fixtures pasando por `SecretRedactor`) y `live`.
  4. `SceneTransitionEngine` & `CanonApprovalQueue`:
     - Orquesta la transición `Estado de Escena` -> `Transición de Estado` validada con Zod, aplica `VocabularyGuard` sobre la salida y retiene las **Propuestas de Canon** hasta que se invoque `approve(proposalId)` bajo la protección de `SafeVaultPathGuard`.

## Testing Decisions

- **Costuras de Prueba (Seams)**:
  1. `VaultContextCompiler.compileView`: Prueba el aislamiento Zero-Trust de la **Niebla de Guerra Estratificada**, la extirpación total de bloques `%%...%%` y nodos `#secreto`, y la carga de términos prohibidos de Thyrenia.
  2. `SceneTransitionEngine.step`: Prueba la ejecución completa de una transición de escena en modo `replay`, la defensa ante intentos de *prompt injection* en `playerAction`, la detección de vocabulario prohibido en `VocabularyGuard` y el encolado seguro de **Propuestas de Canon**.
  3. `SecurityGuard`: Prueba unitaria y de integración de `SecretRedactor` (enmascaramiento de claves `AIza...`), `SafeVaultPathGuard` (rechazo de `../../Windows`, `.obsidian/plugins/evil.js`, etc.), `InputSanitizer` y `RateLimiter`.

## Out of Scope

- Interfaz gráfica frontend en Next.js y visualización `react-force-graph` (fase siguiente).
- Configuración de Cloudflare Tunnel para acceso remoto de jugadores.

## Further Notes

- El repositorio `C:\Users\joelm\source\repos\thyrenia-engine` incluirá un `.gitignore` estricto desde su inicialización para impedir que `.env` o archivos temporales puedan subirse a cualquier remoto.
