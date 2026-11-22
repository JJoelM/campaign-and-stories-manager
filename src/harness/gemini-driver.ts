import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import {
  ChronicleSynthesisOutput,
  ChronicleSynthesisOutputSchema,
  CompiledVaultView,
  GeminiTaskRole,
  StateTransitionOutput,
  StateTransitionOutputSchema,
  TransitionEvalVerdict,
  TransitionEvalVerdictSchema,
} from '../domain/schemas.js';
import {
  RateLimiter,
  SecretRedactor,
  TokenBudgetGuard,
} from '../security/security-guard.js';

export type HarnessMode = 'replay' | 'record' | 'live';

export const RECOMMENDED_AI_STUDIO_MODELS = {
  fastLoop: [
    'gemini-3.8-flash',
    'gemini-4-hydrogen',
    'gemini-3.5-flash-lite',
  ],
  reasoning: ['gemini-4-argon', 'gemini-4-carbon'],
  evalJudge: ['gemini-decision-1', 'gemini-3.5-flash-lite'],
} as const;

export interface AIStudioModelInfo {
  name: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

export interface GenerateTransitionRequest {
  systemPrompt: string;
  userPrompt: string;
  fixtureKey?: string;
  modelOverride?: string;
  taskRole?: GeminiTaskRole;
}

export interface GenerateTransitionResponse {
  output: StateTransitionOutput;
  meta: {
    mode: HarnessMode;
    modelId: string;
    taskRole: GeminiTaskRole;
    fixtureHash: string;
    latencyMs: number;
  };
}

export class GeminiNarrativeDriver {
  private readonly rateLimiter: RateLimiter;
  private readonly tokenBudgetGuard: TokenBudgetGuard;
  private readonly fixturesDir: string;
  private readonly mode: HarnessMode;
  private readonly defaultModelId: string;
  private readonly maxOutputTokens: number;

  constructor(options?: {
    mode?: HarnessMode;
    fixturesDir?: string;
    defaultModelId?: string;
    rateLimiter?: RateLimiter;
    tokenBudgetGuard?: TokenBudgetGuard;
    maxOutputTokens?: number;
  }) {
    this.mode =
      options?.mode ||
      (process.env.HARNESS_MODE as HarnessMode) ||
      'replay';
    this.fixturesDir =
      options?.fixturesDir ||
      path.resolve(process.cwd(), 'test', 'fixtures');
    this.defaultModelId =
      options?.defaultModelId ||
      process.env.GEMINI_FAST_LOOP_MODEL ||
      'gemini-3.8-flash';
    this.rateLimiter = options?.rateLimiter || new RateLimiter();
    this.tokenBudgetGuard =
      options?.tokenBudgetGuard || new TokenBudgetGuard();
    this.maxOutputTokens =
      options?.maxOutputTokens ||
      Number(process.env.MAX_OUTPUT_TOKENS || 2048);

    GeminiNarrativeDriver.assertNotDeprecatedModel(this.defaultModelId);
  }

  getConsumedTokens(): number {
    return this.tokenBudgetGuard.getConsumedTokens();
  }

  resolveModelForRole(role: GeminiTaskRole): string {
    let modelId: string;
    switch (role) {
      case 'fast_loop':
        modelId = process.env.GEMINI_FAST_LOOP_MODEL || this.defaultModelId;
        break;
      case 'deep_arbitration':
        modelId = process.env.GEMINI_REASONING_MODEL || 'gemini-4-argon';
        break;
      case 'canon_synthesis':
        modelId = process.env.GEMINI_CANON_MODEL || 'gemini-4-carbon';
        break;
      case 'eval_judge':
        modelId = process.env.GEMINI_EVAL_JUDGE_MODEL || 'gemini-decision-1';
        break;
    }
    GeminiNarrativeDriver.assertNotDeprecatedModel(modelId);
    return modelId;
  }

  static assertNotDeprecatedModel(modelId: string): void {
    if (/^gemini-2\.5/i.test(modelId)) {
      throw new Error(
        `Modelo deprecado en Google AI Studio detectado ("${modelId}"). Usa modelos vigentes de la familia Gemini 4 ("gemini-4-carbon", "gemini-4-argon", "gemini-4-hydrogen") o Gemini 3 ("gemini-3.8-flash", "gemini-3.5-flash-lite").`,
      );
    }
  }

  static computeFixtureHash(systemPrompt: string, userPrompt: string): string {
    return crypto
      .createHash('sha256')
      .update(`${systemPrompt}\n---\n${userPrompt}`)
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * Consulta en vivo los modelos disponibles en Google AI Studio usando EXCLUSIVAMENTE
   * la cabecera x-goog-api-key (nunca ?key= en la URL para evitar exposición en logs).
   */
  static async verifyAvailableModels(
    apiKey = process.env.GEMINI_API_KEY,
    fetchImpl: typeof fetch = fetch,
  ): Promise<{
    availableModels: AIStudioModelInfo[];
    matchedRecommended: string[];
  }> {
    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      throw new Error(
        'GEMINI_API_KEY no está configurada o contiene el valor de ejemplo.',
      );
    }

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const safeErrorText = SecretRedactor.redact(await response.text(), [
        apiKey,
      ]);
      throw new Error(
        `Error al consultar Google AI Studio (${response.status}): ${safeErrorText}`,
      );
    }

    const data = (await response.json()) as { models?: AIStudioModelInfo[] };
    const availableModels = data.models || [];
    const normalizedIds = availableModels.map((m) =>
      m.name.replace(/^models\//, ''),
    );

    const allRecommended = [
      ...RECOMMENDED_AI_STUDIO_MODELS.fastLoop,
      ...RECOMMENDED_AI_STUDIO_MODELS.reasoning,
      ...RECOMMENDED_AI_STUDIO_MODELS.evalJudge,
    ];

    const matchedRecommended = Array.from(new Set(allRecommended)).filter(
      (rec) => normalizedIds.some((id) => id.includes(rec)),
    );

    return {
      availableModels,
      matchedRecommended,
    };
  }

  async generateTransition(
    req: GenerateTransitionRequest,
  ): Promise<GenerateTransitionResponse> {
    const startMs = Date.now();
    const taskRole: GeminiTaskRole = req.taskRole || 'fast_loop';
    const modelId =
      req.modelOverride ||
      (req.taskRole
        ? this.resolveModelForRole(req.taskRole)
        : this.defaultModelId);
    GeminiNarrativeDriver.assertNotDeprecatedModel(modelId);

    const fixtureHash =
      req.fixtureKey ||
      GeminiNarrativeDriver.computeFixtureHash(
        req.systemPrompt,
        req.userPrompt,
      );
    const fixtureFile = path.join(this.fixturesDir, `${fixtureHash}.json`);

    if (this.mode === 'replay') {
      if (fs.existsSync(fixtureFile)) {
        const rawJson = fs.readFileSync(fixtureFile, 'utf-8');
        const parsed = JSON.parse(rawJson);
        const validated = StateTransitionOutputSchema.parse(parsed.output);
        return {
          output: validated,
          meta: {
            mode: 'replay',
            modelId,
            taskRole,
            fixtureHash,
            latencyMs: Date.now() - startMs,
          },
        };
      }

      throw new Error(
        `Fixture no encontrada en modo replay: "${fixtureFile}". Ejecuta en modo "record" o registra una fixture dorada con saveGoldenFixture("${fixtureHash}", ...).`,
      );
    }

    // En modos 'record' o 'live', aplicamos RateLimiter, TokenBudgetGuard y verificamos GEMINI_API_KEY
    this.rateLimiter.checkAndRecord();
    const budgetStatus = this.tokenBudgetGuard.assertTurnBudget(
      `${req.systemPrompt}\n${req.userPrompt}`,
      this.maxOutputTokens,
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      throw new Error(
        'GEMINI_API_KEY no configurada para ejecución en vivo contra Google AI Studio.',
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateObject({
      model: google(modelId),
      schema: StateTransitionOutputSchema,
      system: req.systemPrompt,
      prompt: req.userPrompt,
      maxTokens: this.maxOutputTokens,
      temperature: 0.4,
    });

    const validatedOutput = StateTransitionOutputSchema.parse(result.object);
    const inputUsed =
      typeof result.usage?.promptTokens === 'number' &&
      !Number.isNaN(result.usage.promptTokens)
        ? result.usage.promptTokens
        : budgetStatus.estimatedInputTokens;
    const outputUsed =
      typeof result.usage?.completionTokens === 'number' &&
      !Number.isNaN(result.usage.completionTokens)
        ? result.usage.completionTokens
        : TokenBudgetGuard.estimateTokens(JSON.stringify(validatedOutput));
    this.tokenBudgetGuard.recordUsage(inputUsed, outputUsed);

    if (this.mode === 'record') {
      this.saveGoldenFixture(fixtureHash, validatedOutput, {
        modelId,
        taskRole,
        recordedAt: new Date().toISOString(),
      });
    }

    return {
      output: validatedOutput,
      meta: {
        mode: this.mode,
        modelId,
        taskRole,
        fixtureHash,
        latencyMs: Date.now() - startMs,
      },
    };
  }

  async evaluateTransitionWithJudge(params: {
    transition: StateTransitionOutput;
    compiledView: CompiledVaultView;
    playerAction: string;
    vocabularyViolationsCount: number;
    hiddenSecretSnippets?: string[];
  }): Promise<TransitionEvalVerdict> {
    const judgeModelId = this.resolveModelForRole('eval_judge');
    const vocabularyCompliance = params.vocabularyViolationsCount === 0;
    const narration = params.transition.narration;

    const leakedSecret =
      /%%[\s\S]*?%%/.test(narration) ||
      SecretRedactor.containsUnredactedKey(narration) ||
      (params.hiddenSecretSnippets || []).some(
        (snippet) =>
          snippet.length > 0 &&
          narration.toLowerCase().includes(snippet.toLowerCase()),
      );
    const zeroTrustIsolationPassed = !leakedSecret;

    if (this.mode === 'replay') {
      const visibleTitles = params.compiledView.visibleNodes.map((n) =>
        n.title.toLowerCase(),
      );
      const referencesVisibleLore = visibleTitles.some(
        (t) => t.length >= 3 && narration.toLowerCase().includes(t),
      );
      const loreCoherenceScore = Math.min(
        1,
        (narration.trim().length >= 30 ? 0.65 : 0.3) +
          (referencesVisibleLore ? 0.2 : 0.1) +
          (params.transition.branchingChoices.length >= 2 ? 0.15 : 0.05),
      );
      const passed =
        vocabularyCompliance &&
        zeroTrustIsolationPassed &&
        loreCoherenceScore >= 0.7;

      return TransitionEvalVerdictSchema.parse({
        passed,
        loreCoherenceScore: Number(loreCoherenceScore.toFixed(2)),
        vocabularyCompliance,
        zeroTrustIsolationPassed,
        judgeModelId,
        notes: passed
          ? 'Evaluación determinista replay superada: léxico, coherencia y Zero-Trust conformes.'
          : 'Evaluación determinista replay observada: revisar vocabulario o aislamiento.',
      });
    }

    const systemPrompt =
      'Eres el Juez Automatizado (LLM-as-a-Judge) de calidad narrativa y seguridad de Thyrenia. Evalúa objetivamente la transición.';
    const userPrompt = [
      `Acción del jugador: ${params.playerAction}`,
      `Narrativa generada: ${narration}`,
      `Nodos visibles autorizados: ${params.compiledView.visibleNodes
        .slice(0, 15)
        .map((n) => n.title)
        .join(', ')}`,
      `Violaciones léxicas deterministas: ${params.vocabularyViolationsCount}`,
      `Aislamiento determinista Zero-Trust superado: ${zeroTrustIsolationPassed}`,
    ].join('\n');

    this.rateLimiter.checkAndRecord();
    const budgetStatus = this.tokenBudgetGuard.assertTurnBudget(
      `${systemPrompt}\n${userPrompt}`,
      Math.min(512, this.maxOutputTokens),
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      throw new Error(
        'GEMINI_API_KEY no configurada para ejecución del Juez en vivo.',
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateObject({
      model: google(judgeModelId),
      schema: TransitionEvalVerdictSchema,
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: Math.min(512, this.maxOutputTokens),
      temperature: 0.1,
    });

    this.tokenBudgetGuard.recordUsage(
      result.usage?.promptTokens ?? budgetStatus.estimatedInputTokens,
      result.usage?.completionTokens ?? 128,
    );

    const parsed = TransitionEvalVerdictSchema.parse(result.object);
    const finalVocab = parsed.vocabularyCompliance && vocabularyCompliance;
    const finalZeroTrust =
      parsed.zeroTrustIsolationPassed && zeroTrustIsolationPassed;

    return TransitionEvalVerdictSchema.parse({
      ...parsed,
      judgeModelId,
      vocabularyCompliance: finalVocab,
      zeroTrustIsolationPassed: finalZeroTrust,
      passed: parsed.passed && finalVocab && finalZeroTrust,
    });
  }

  async synthesizeChronicle(params: {
    campaignId: string;
    sessionTitle: string;
    targetSubfolder: string;
    events: Array<{
      turnNumber: number;
      locationNodeId: string;
      playerAction: string;
      narration: string;
    }>;
  }): Promise<{
    chronicle: ChronicleSynthesisOutput;
    modelId: string;
  }> {
    const modelId = this.resolveModelForRole('canon_synthesis');

    if (this.mode === 'replay') {
      const keyEvents = params.events.map(
        (e) =>
          `Turno ${e.turnNumber} (${e.locationNodeId}): ${e.narration.slice(0, 140)}`,
      );
      const summary =
        params.events.length > 0
          ? `Crónica de ${params.events.length} turno(s) en ${params.campaignId}.`
          : `Crónica inicial de sesión en ${params.campaignId}.`;
      const markdownLines = [
        `# ${params.sessionTitle}`,
        '',
        `- **Campaña:** ${params.campaignId}`,
        `- **Modelo Sintetizador:** ${modelId}`,
        '',
        '## Crónica de Eventos',
        ...params.events.map(
          (e) =>
            `### Turno ${e.turnNumber} — [[${e.locationNodeId}]]\n- **Acción:** ${e.playerAction}\n- **Resolución:** ${e.narration}`,
        ),
      ];

      return {
        modelId,
        chronicle: ChronicleSynthesisOutputSchema.parse({
          title: params.sessionTitle,
          summary,
          targetSubfolder: params.targetSubfolder,
          markdownContent: SecretRedactor.redact(markdownLines.join('\n')),
          keyEvents,
        }),
      };
    }

    const systemPrompt =
      'Eres el Cronista de Thyrenia. Sintetiza los eventos de sesión en una Crónica Markdown canónica con wikilinks [[...]] y sin palabras prohibidas.';
    const userPrompt = JSON.stringify(params);

    this.rateLimiter.checkAndRecord();
    const budgetStatus = this.tokenBudgetGuard.assertTurnBudget(
      `${systemPrompt}\n${userPrompt}`,
      this.maxOutputTokens,
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      throw new Error(
        'GEMINI_API_KEY no configurada para síntesis de Crónica en vivo.',
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateObject({
      model: google(modelId),
      schema: ChronicleSynthesisOutputSchema,
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: this.maxOutputTokens,
      temperature: 0.3,
    });

    this.tokenBudgetGuard.recordUsage(
      result.usage?.promptTokens ?? budgetStatus.estimatedInputTokens,
      result.usage?.completionTokens ?? 256,
    );

    const parsed = ChronicleSynthesisOutputSchema.parse(result.object);
    return {
      modelId,
      chronicle: {
        ...parsed,
        markdownContent: SecretRedactor.redact(parsed.markdownContent),
      },
    };
  }

  saveGoldenFixture(
    fixtureKeyOrHash: string,
    output: StateTransitionOutput,
    metadata: Record<string, unknown> = {},
  ): string {
    const validated = StateTransitionOutputSchema.parse(output);
    fs.mkdirSync(this.fixturesDir, { recursive: true });

    const payload = JSON.stringify(
      {
        fixtureKey: fixtureKeyOrHash,
        metadata,
        output: validated,
      },
      null,
      2,
    );

    // Sanitizamos con SecretRedactor ANTES de escribir a disco (ADR-0011)
    const redactedPayload = SecretRedactor.redact(payload);
    if (SecretRedactor.containsUnredactedKey(redactedPayload)) {
      throw new Error(
        'Abortando escritura de fixture: Se detectó un patrón de API Key no redactado.',
      );
    }

    const filePath = path.join(this.fixturesDir, `${fixtureKeyOrHash}.json`);
    fs.writeFileSync(filePath, redactedPayload, 'utf-8');
    return filePath;
  }
}
