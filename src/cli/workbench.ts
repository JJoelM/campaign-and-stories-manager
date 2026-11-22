import 'dotenv/config';
import path from 'node:path';
import { VaultContextCompiler } from '../compiler/vault-context-compiler.js';
import { VaultSqliteIndexer } from '../compiler/vault-sqlite-indexer.js';
import { CampaignSessionStore } from '../engine/campaign-session-store.js';
import { CanonApprovalQueue } from '../engine/canon-approval-queue.js';
import { SceneTransitionEngine } from '../engine/scene-transition-engine.js';
import {
  GeminiNarrativeDriver,
  HarnessMode,
} from '../harness/gemini-driver.js';

async function main(): Promise<void> {
  const vaultPath =
    process.env.VAULT_PATH ||
    'G:/Otros ordenadores/Mi PC/Google Drive/Thyrenia';
  const mode = (process.env.HARNESS_MODE as HarnessMode) || 'replay';

  console.log('=============================================================');
  console.log(' THYRENIA ENGINE - GEMINI WORKBENCH & HARNESS SIMULATOR');
  console.log('=============================================================');
  console.log(`Vault Maestro: ${path.resolve(vaultPath)}`);
  console.log(`Modo Harness:  ${mode.toUpperCase()}\n`);

  const activeCharacter = {
    id: 'pj-olivia',
    name: 'Olivia Zyltris',
    race: 'elfo',
    class: 'hechicero',
    factions: ['Luz de Medialuna'],
    skillModifiers: { arcana: 4, percepcion: 2 },
  };

  const partyState = {
    campaignId: 'luz-de-medialuna',
    revealedProgressiveNodeIds: [],
    factionReputation: { 'Luz de Medialuna': 1 },
  };

  console.log('[1/4] Compilando Niebla de Guerra Estratificada (Zero-Trust)...');
  const compiledView = VaultContextCompiler.compileView(
    vaultPath,
    partyState,
    activeCharacter,
  );

  console.log(
    `  -> Nodos escaneados en Vault:      ${compiledView.stats.totalScanned}`,
  );
  console.log(
    `  -> Capa Base (Pública):            ${compiledView.stats.baseCount}`,
  );
  console.log(
    `  -> Capa Asimétrica (Personaje):    ${compiledView.stats.asymmetricVisibleCount}`,
  );
  console.log(
    `  -> Capa Progresiva (Desbloqueada): ${compiledView.stats.progressiveVisibleCount}`,
  );
  console.log(
    `  -> Nodos Ocultos / Secretos DM:    ${compiledView.stats.hiddenOrSecretCount}`,
  );
  console.log(
    `  -> Reglas Léxicas Prohibidas:      ${compiledView.forbiddenTerms.length} términos cargados\n`,
  );

  console.log('[2/4] Indexando Grafo Visible en SQLite Local (RAG Zero-Trust)...');
  const sqliteIndexer = new VaultSqliteIndexer(':memory:');
  const indexStats = sqliteIndexer.indexCompiledView(compiledView);
  const initialScene = {
    id: 'escena-posada-01',
    locationNodeId: 'Maná',
    description:
      'Olivia Zyltris descansa en una posada junto a una antigua Vena de Maná mientras observa un extraño constructo inactivo en el rincón.',
    environmentFlags: { flujo_mana_activo: true },
    activeThreats: [],
    turnNumber: 1,
  };
  const playerAction =
    'Pido una taza de bebida caliente estimulante al posadero y examino las runas de maná del constructo inactivo.';

  const topRagNodes = sqliteIndexer.retrieveRelevantNodes({
    character: activeCharacter,
    locationNodeId: initialScene.locationNodeId,
    sceneDescription: initialScene.description,
    playerAction,
    limit: 5,
  });
  console.log(
    `  -> Nodos/Aristas indexados en SQLite: ${indexStats.indexedNodes} nodos, ${indexStats.indexedEdges} aristas`,
  );
  console.log(
    `  -> Top RAG para la escena:           ${topRagNodes.map((n) => `${n.title} (${n.layer})`).join(', ')}\n`,
  );

  console.log(
    '[3/4] Ejecutando Transición de Escena en la FSM + Juez (Escenario Dorado: Posada de Thyrenia)...',
  );
  const driver = new GeminiNarrativeDriver({ mode });
  const canonQueue = new CanonApprovalQueue(vaultPath);
  const sessionStore = new CampaignSessionStore(':memory:');
  const engine = new SceneTransitionEngine(driver, canonQueue, sqliteIndexer);

  const stepResult = await engine.step(
    initialScene,
    partyState,
    playerAction,
    compiledView,
    {
      fixtureKey: 'golden-tavern-qoketh',
      deterministicRollD20: 17,
      strictVocabularyEnforcement: true,
    },
  );
  sessionStore.recordTurn({
    campaignId: partyState.campaignId,
    playerId: activeCharacter.id,
    playerAction,
    previousSceneState: initialScene,
    stepResult,
  });

  console.log(
    `  -> Modelo: ${stepResult.driverMeta.modelId} [rol: ${stepResult.driverMeta.taskRole}] (${stepResult.driverMeta.mode}, ${stepResult.driverMeta.latencyMs}ms)`,
  );
  console.log(`  -> Narrativa:\n     "${stepResult.transition.narration}"`);
  console.log(
    `  -> Resolución Mecánica: Tirada=${stepResult.transition.mechanicalResolution.rollResult} vs DC=${stepResult.transition.mechanicalResolution.difficultyClass} (${stepResult.transition.mechanicalResolution.outcome})`,
  );
  console.log(
    `  -> Violaciones de Vocabulario Prohibido: ${stepResult.vocabularyViolations.length}`,
  );
  console.log(
    `  -> Veredicto del Juez (${stepResult.evalVerdict?.judgeModelId}): ${stepResult.evalVerdict?.passed ? 'APROBADO' : 'OBSERVADO'} (score=${stepResult.evalVerdict?.loreCoherenceScore})`,
  );
  console.log(
    `  -> Opciones Ramificadas Generadas: ${stepResult.transition.branchingChoices.map((c) => `[${c.intentType}] ${c.label}`).join(' | ')}\n`,
  );

  console.log('[4/4] Sintetizando Crónica y Revisando Bandeja de Propuestas de Canon del DM:');
  await canonQueue.enqueueChronicle({
    driver,
    campaignId: partyState.campaignId,
    sceneId: initialScene.id,
    sessionTitle: 'Crónica de Simulación - Posada del Bronce',
    targetSubfolder:
      '01 - Campanas/01 - Campana Principal (Luz de Medialuna)/Notas de Sesion',
    events: sessionStore.listTurns(partyState.campaignId).map((t) => ({
      turnNumber: t.turnNumber,
      locationNodeId: t.locationNodeId,
      playerAction: t.playerAction,
      narration: t.narration,
    })),
  });

  const pending = canonQueue.listPending();
  console.log(
    `  -> Propuestas en cola pendientes de aprobación del DM: ${pending.length} (Ningún archivo del Vault Maestro fue modificado automáticamente)`,
  );
  for (const p of pending) {
    console.log(
      `     * [${p.id}] (${p.category}) "${p.title}" -> Destino propuesto: ${p.targetSubfolder}`,
    );
  }

  sqliteIndexer.close();
  sessionStore.close();
  canonQueue.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
