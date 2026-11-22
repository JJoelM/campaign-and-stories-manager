import fs from 'node:fs';
import path from 'node:path';
import {
  PartyState,
  PartyStateSchema,
  SceneState,
  SceneStateSchema,
  StateTransitionOutput,
  StateTransitionOutputSchema,
} from '../domain/schemas.js';
import {
  DatabaseSyncInstance,
  openSqliteDatabase,
} from '../infra/sqlite-client.js';
import { SecretRedactor } from '../security/security-guard.js';
import { StepSceneResult } from './scene-transition-engine.js';

export interface SessionTurnRecord {
  id: number;
  campaignId: string;
  turnNumber: number;
  sceneId: string;
  locationNodeId: string;
  playerId: string;
  playerAction: string;
  narration: string;
  transition: StateTransitionOutput;
  createdAt: string;
}

/**
 * Almacén persistente en SQLite local para el Estado de Escena, PartyState
 * y el historial de Transiciones de Estado orientado a síntesis de Crónicas (ADR-0002, ADR-0005).
 */
export class CampaignSessionStore {
  private readonly db: DatabaseSyncInstance;

  constructor(dbPath = ':memory:') {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
    }
    this.db = openSqliteDatabase(dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS campaign_sessions (
        campaign_id TEXT PRIMARY KEY,
        party_state_json TEXT NOT NULL,
        scene_state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT NOT NULL,
        turn_number INTEGER NOT NULL,
        scene_id TEXT NOT NULL,
        location_node_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_action TEXT NOT NULL,
        narration TEXT NOT NULL,
        transition_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_session_turns_campaign
        ON session_turns (campaign_id, id);
      CREATE TABLE IF NOT EXISTS campaign_metadata (
        meta_key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  saveMetadata(metaKey: string, value: unknown): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO campaign_metadata (meta_key, value_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(meta_key) DO UPDATE SET
           value_json = excluded.value_json,
           updated_at = excluded.updated_at`,
      )
      .run(metaKey, JSON.stringify(value), now);
  }

  loadMetadata<T>(metaKey: string): T | undefined {
    const row = this.db
      .prepare('SELECT value_json FROM campaign_metadata WHERE meta_key = ?')
      .get(metaKey) as { value_json: string } | undefined;
    if (!row) return undefined;
    return JSON.parse(row.value_json) as T;
  }

  close(): void {
    if (this.db.isOpen) {
      this.db.close();
    }
  }

  saveSessionState(partyState: PartyState, sceneState: SceneState): void {
    const validParty = PartyStateSchema.parse(partyState);
    const validScene = SceneStateSchema.parse(sceneState);
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO campaign_sessions (campaign_id, party_state_json, scene_state_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(campaign_id) DO UPDATE SET
           party_state_json = excluded.party_state_json,
           scene_state_json = excluded.scene_state_json,
           updated_at = excluded.updated_at`,
      )
      .run(
        validParty.campaignId,
        JSON.stringify(validParty),
        JSON.stringify(validScene),
        now,
      );
  }

  loadSessionState(
    campaignId: string,
  ): { partyState: PartyState; sceneState: SceneState } | undefined {
    const row = this.db
      .prepare(
        `SELECT party_state_json, scene_state_json
         FROM campaign_sessions
         WHERE campaign_id = ?`,
      )
      .get(campaignId) as
      | { party_state_json: string; scene_state_json: string }
      | undefined;

    if (!row) return undefined;

    return {
      partyState: PartyStateSchema.parse(JSON.parse(row.party_state_json)),
      sceneState: SceneStateSchema.parse(JSON.parse(row.scene_state_json)),
    };
  }

  recordTurn(params: {
    campaignId: string;
    playerId: string;
    playerAction: string;
    previousSceneState: SceneState;
    stepResult: StepSceneResult;
  }): void {
    const now = new Date().toISOString();
    const safeAction = SecretRedactor.redact(params.playerAction);
    const safeTransitionJson = SecretRedactor.redact(
      JSON.stringify(params.stepResult.transition),
    );
    const safeNarration = SecretRedactor.redact(
      params.stepResult.transition.narration,
    );

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare(
          `INSERT INTO session_turns (
            campaign_id, turn_number, scene_id, location_node_id, player_id, player_action, narration, transition_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          params.campaignId,
          params.previousSceneState.turnNumber,
          params.previousSceneState.id,
          params.previousSceneState.locationNodeId,
          params.playerId,
          safeAction,
          safeNarration,
          safeTransitionJson,
          now,
        );

      this.saveSessionState(
        params.stepResult.nextPartyState,
        params.stepResult.nextSceneState,
      );
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  listTurns(campaignId: string): SessionTurnRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, campaign_id, turn_number, scene_id, location_node_id, player_id, player_action, narration, transition_json, created_at
         FROM session_turns
         WHERE campaign_id = ?
         ORDER BY id ASC`,
      )
      .all(campaignId) as Array<{
      id: number;
      campaign_id: string;
      turn_number: number;
      scene_id: string;
      location_node_id: string;
      player_id: string;
      player_action: string;
      narration: string;
      transition_json: string;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      campaignId: row.campaign_id,
      turnNumber: row.turn_number,
      sceneId: row.scene_id,
      locationNodeId: row.location_node_id,
      playerId: row.player_id,
      playerAction: row.player_action,
      narration: row.narration,
      transition: StateTransitionOutputSchema.parse(
        JSON.parse(row.transition_json),
      ),
      createdAt: row.created_at,
    }));
  }
}
