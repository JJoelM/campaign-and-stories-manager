# 04: Enrutamiento Multimodelo Gemini, Síntesis de Crónicas y Juez Automatizado (LLM-as-a-Judge)

**What to build:** Permitir que el motor de **Transición de Estado** seleccione dinámicamente el modelo vigente de Google AI Studio adecuado para cada rol operativo (bucle rápido de máquina de estados, arbitraje profundo ante amenazas activas, síntesis de **Propuestas de Canon** / **Crónicas** y juez automatizado de evaluación), validando siempre salidas estructuradas mediante Zod y evaluando coherencia de lore, cumplimiento léxico y aislamiento Zero-Trust.

**Blocked by:** 01: Blindaje de Ciberseguridad, TokenBudgetGuard y Auditoría Zero-Trust, 03: Indexador SQLite del Grafo de Nodos de Lore y Recuperación Contextual (RAG Local)

**Status:** resolved

- [x] El dominio define los esquemas Zod para roles de tarea de Gemini, veredictos de evaluación (`TransitionEvalVerdict`) y síntesis estructurada de **Crónica** (`ChronicleSynthesisOutput`).
- [x] El driver de Gemini resuelve el modelo vigente correcto por rol de tarea y ejecuta evaluaciones automatizadas con modo replay determinista y modo en vivo.
- [x] El motor de **Transición de Estado** enruta automáticamente a razonamiento profundo cuando el **Estado de Escena** tiene amenazas activas o cuando el llamador lo solicita, e incluye el veredicto de evaluación en el resultado del turno.
- [x] Las pruebas verifican el enrutamiento por rol, el rechazo de modelos deprecados y la emisión del veredicto estructurado del juez.
