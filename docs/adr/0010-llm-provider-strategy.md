# Estrategia de Modelos de IA: Agnóstica con Gemini por Defecto

Decidimos estructurar el cliente de IA de manera agnóstica mediante el Vercel AI SDK, utilizando Google Gemini como proveedor principal predeterminado. La ventana de contexto ultragrande de Gemini (1M-2M tokens) permite alimentar de forma directa arcos completos del lore y mecánicas de Thyrenia sin pérdidas de memoria, a la vez que la abstracción permite alternar a Claude, OpenAI u Ollama local mediante variables de entorno en `.env`.
