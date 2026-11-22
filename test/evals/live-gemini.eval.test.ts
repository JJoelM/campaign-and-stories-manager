import 'dotenv/config';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { VaultContextCompiler } from '../../src/compiler/vault-context-compiler.js';
import { CanonApprovalQueue } from '../../src/engine/canon-approval-queue.js';
import { SceneTransitionEngine } from '../../src/engine/scene-transition-engine.js';
import { GeminiNarrativeDriver } from '../../src/harness/gemini-driver.js';

const hasLiveApiKey =
  Boolean(process.env.GEMINI_API_KEY) &&
  process.env.GEMINI_API_KEY !== 'TU_CLAVE_AQUI';

describe('Thyrenia Live Gemini Evals Suite (Google AI Studio)', () => {
  it.skipIf(!hasLiveApiKey)(
    'ejecuta una evaluación en vivo contra Gemini respetando esquemas Zod y 0 términos prohibidos',
    async () => {
      const vaultPath = path.resolve(
        process.env.VAULT_PATH ||
          'G:/Otros ordenadores/Mi PC/Google Drive/Thyrenia',
      );
      const compiledView = VaultContextCompiler.compileView(
        vaultPath,
        {
          campaignId: 'eval-live',
          revealedProgressiveNodeIds: [],
          factionReputation: {},
        },
        {
          id: 'pj-olivia',
          name: 'Olivia Zyltris',
          race: 'elfo',
          class: 'hechicero',
          factions: [],
          skillModifiers: {},
        },
      );

      const driver = new GeminiNarrativeDriver({ mode: 'live' });
      const queue = new CanonApprovalQueue(vaultPath);
      const engine = new SceneTransitionEngine(driver, queue);

      const result = await engine.step(
        {
          id: 'eval-scene-1',
          locationNodeId: 'Thyrenia',
          description: 'Olivia entra a una taberna buscando una bebida estimulante y noticias sobre un autómata.',
          environmentFlags: {},
          activeThreats: [],
          turnNumber: 1,
        },
        {
          campaignId: 'eval-live',
          revealedProgressiveNodeIds: [],
          factionReputation: {},
        },
        'Pido la bebida típica de Thyrenia y pregunto cuánto tiempo lleva el constructo aquí.',
        compiledView,
        {
          deterministicRollD20: 15,
          strictVocabularyEnforcement: true,
        },
      );

      expect(result.vocabularyViolations).toHaveLength(0);
      expect(result.transition.branchingChoices.length).toBeGreaterThan(0);
    },
    30_000,
  );
});
