# 01: Blindaje de Ciberseguridad, TokenBudgetGuard y Auditoría Zero-Trust

**What to build:** Garantizar que el motor y el Harness de Gemini operen con límites estrictos de presupuesto de tokens por turno y por sesión (`TokenBudgetGuard`), eviten el agotamiento de cuota en Google AI Studio y mantengan una auditoría automatizada del repositorio libre de falsos positivos sobre binarios y capaz de detectar identificadores de modelos deprecados (`gemini-2.5-*`) o fugas de `GEMINI_API_KEY`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] El controlador de presupuestos de tokens estima tokens de entrada, valida el presupuesto máximo por turno y acumula el consumo de sesión lanzando un error explícito cuando se excede el límite configurado.
- [x] El driver de Gemini valida el presupuesto de tokens antes de cada llamada en modos en vivo o grabación y registra el consumo tras recibir la respuesta.
- [x] La auditoría de seguridad omite archivos binarios o bases de datos locales, verifica la ausencia de claves `AIza...` o parámetros `?key=`, y bloquea configuraciones o fixtures de producción que referencien modelos deprecados `gemini-2.5-*`.
- [x] Existen pruebas automatizadas que verifican el bloqueo por exceso de presupuesto de tokens y el rechazo de modelos deprecados.
