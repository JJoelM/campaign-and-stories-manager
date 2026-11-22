# GEMINI.md — Directrices Especializadas para Modelos Gemini en Thyrenia Engine

Lee y respeta todas las directrices definidas en `AGENTS.md`, `MEMORY.md`, `GLOSSARY.md` y `docs/adr/0001` a `0012` en la raíz de este repositorio.

## Modelos Vigentes de Google AI Studio
- No utilices identificadores deprecados de la serie 2.5 (`gemini-2.5-pro`).
- Utiliza los modelos vigentes en Google AI Studio:
  - **Bucle Rápido de Máquina de Estados (FSM)**: `gemini-3.8-flash` o `gemini-4-hydrogen`.
  - **Razonamiento Profundo y Arbitraje Narrativo**: `gemini-4-argon`.
  - **Síntesis de Propuestas de Canon**: `gemini-4-carbon`.
  - **Evaluación Automatizada (LLM-as-a-Judge)**: `gemini-decision-1` o `gemini-3.5-flash-lite`.
- Verifica siempre la disponibilidad dinámica mediante `pnpm harness:models` (`GET https://generativelanguage.googleapis.com/v1beta/models` enviando la clave exclusivamente por cabecera `x-goog-api-key`).

## Reglas de Ejecución y Desarrollo
1. **Gestor de Paquetes**: Utiliza exclusivamente `pnpm` en `C:\Users\joelm\source\repos\thyrenia-engine`.
2. **Aislamiento Zero-Trust de Secretos**: El filtrado de comentarios `%%...%%`, etiquetas `#secreto` y capas no autorizadas de la **Niebla de Guerra Estratificada** debe ejecutarse en código TypeScript determinista (`VaultContextCompiler`) antes de construir cualquier prompt para el LLM.
3. **Salidas Estructuradas**: Toda transición de la FSM debe validarse mediante esquemas Zod estrictos (`StateTransitionOutputSchema`).
