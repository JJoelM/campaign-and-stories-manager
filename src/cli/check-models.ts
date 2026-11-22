import 'dotenv/config';
import {
  GeminiNarrativeDriver,
  RECOMMENDED_AI_STUDIO_MODELS,
} from '../harness/gemini-driver.js';
import { SecretRedactor } from '../security/security-guard.js';

async function main(): Promise<void> {
  console.log('=============================================================');
  console.log(' THYRENIA ENGINE - VERIFICADOR DE MODELOS GOOGLE AI STUDIO');
  console.log('=============================================================\n');

  console.log('Perfiles de Modelos Recomendados (Vigentes en AI Studio):');
  console.log(
    `  - Fast Loop (FSM & Tiradas): ${RECOMMENDED_AI_STUDIO_MODELS.fastLoop.join(', ')}`,
  );
  console.log(
    `  - Razonamiento & Canon:      ${RECOMMENDED_AI_STUDIO_MODELS.reasoning.join(', ')}`,
  );
  console.log(
    `  - Juez de Evals:             ${RECOMMENDED_AI_STUDIO_MODELS.evalJudge.join(', ')}\n`,
  );

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
    console.log(
      '[AVISO] GEMINI_API_KEY no configurada en .env (modo offline/replay activo).',
    );
    console.log(
      'Para consultar en vivo tu cuenta de Google AI Studio, copia .env.example a .env y coloca tu clave.',
    );
    console.log(
      'La petición usará exclusivamente la cabecera HTTP "x-goog-api-key" (ADR-0011).',
    );
    return;
  }

  try {
    console.log(
      'Consultando https://generativelanguage.googleapis.com/v1beta/models con cabecera segura x-goog-api-key...',
    );
    const { availableModels, matchedRecommended } =
      await GeminiNarrativeDriver.verifyAvailableModels(apiKey);

    console.log(
      `\nTotal de modelos habilitados en tu clave de AI Studio: ${availableModels.length}`,
    );
    console.log(
      `Modelos recomendados detectados: ${matchedRecommended.join(', ') || '(Ver lista completa abajo)'}\n`,
    );

    for (const m of availableModels.slice(0, 20)) {
      const cleanId = m.name.replace(/^models\//, '');
      console.log(
        `  * ${cleanId.padEnd(32)} | Contexto Entrada: ${m.inputTokenLimit ?? 'N/A'} tokens`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error:', SecretRedactor.redact(msg));
    process.exitCode = 1;
  }
}

main();
