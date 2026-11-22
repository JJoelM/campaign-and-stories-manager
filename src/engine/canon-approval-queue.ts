import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  CanonProposalRecord,
  CanonProposalRecordSchema,
  ProposedCanonUpdate,
} from '../domain/schemas.js';
import { GeminiNarrativeDriver } from '../harness/gemini-driver.js';
import {
  DatabaseSyncInstance,
  openSqliteDatabase,
} from '../infra/sqlite-client.js';
import { SafeVaultPathGuard, SecretRedactor } from '../security/security-guard.js';

/**
 * Bandeja de Aprobación del DM (Human-in-the-Loop, ADR-0004).
 * Retiene todas las Propuestas de Canon y Crónicas en estado 'pending' (con respaldo opcional en SQLite)
 * y garantiza que sólo se escriban notas Markdown en el Vault Maestro cuando el DM invoca approve(),
 * pasando por SafeVaultPathGuard contra Path Traversal (ADR-0011).
 */
export class CanonApprovalQueue {
  private proposals = new Map<string, CanonProposalRecord>();
  private readonly db?: DatabaseSyncInstance;

  constructor(
    private readonly vaultRootPath: string,
    dbPath?: string,
  ) {
    if (dbPath) {
      if (dbPath !== ':memory:') {
        fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
      }
      this.db = openSqliteDatabase(dbPath);
      this.db.exec(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS canon_proposals (
          id TEXT PRIMARY KEY,
          scene_id TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          summary TEXT NOT NULL,
          target_subfolder TEXT NOT NULL,
          markdown_content TEXT NOT NULL,
          created_at TEXT NOT NULL,
          status TEXT NOT NULL,
          written_file_path TEXT
        );
      `);
      this.loadFromDb();
    }
  }

  private loadFromDb(): void {
    if (!this.db) return;
    const rows = this.db
      .prepare(
        `SELECT id, scene_id, title, category, summary, target_subfolder, markdown_content, created_at, status, written_file_path
         FROM canon_proposals
         ORDER BY created_at ASC`,
      )
      .all() as Array<{
      id: string;
      scene_id: string;
      title: string;
      category: CanonProposalRecord['category'];
      summary: string;
      target_subfolder: string;
      markdown_content: string;
      created_at: string;
      status: CanonProposalRecord['status'];
      written_file_path: string | null;
    }>;

    for (const row of rows) {
      const record = CanonProposalRecordSchema.parse({
        id: row.id,
        sceneId: row.scene_id,
        title: row.title,
        category: row.category,
        summary: row.summary,
        targetSubfolder: row.target_subfolder,
        markdownContent: row.markdown_content,
        createdAt: row.created_at,
        status: row.status,
        writtenFilePath: row.written_file_path ?? undefined,
      });
      this.proposals.set(record.id, record);
    }
  }

  private persistRecord(record: CanonProposalRecord): void {
    if (!this.db) return;
    this.db
      .prepare(
        `INSERT INTO canon_proposals (
          id, scene_id, title, category, summary, target_subfolder, markdown_content, created_at, status, written_file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          written_file_path = excluded.written_file_path`,
      )
      .run(
        record.id,
        record.sceneId,
        record.title,
        record.category,
        record.summary,
        record.targetSubfolder,
        record.markdownContent,
        record.createdAt,
        record.status,
        record.writtenFilePath ?? null,
      );
  }

  close(): void {
    if (this.db?.isOpen) {
      this.db.close();
    }
  }

  enqueue(sceneId: string, update: ProposedCanonUpdate): CanonProposalRecord {
    const id = `canon-${crypto.randomUUID().slice(0, 8)}`;
    const record: CanonProposalRecord = CanonProposalRecordSchema.parse({
      ...update,
      id,
      sceneId,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });

    this.proposals.set(id, record);
    this.persistRecord(record);
    return record;
  }

  async enqueueChronicle(params: {
    driver: GeminiNarrativeDriver;
    campaignId: string;
    sceneId: string;
    sessionTitle: string;
    targetSubfolder: string;
    events: Array<{
      turnNumber: number;
      locationNodeId: string;
      playerAction: string;
      narration: string;
    }>;
  }): Promise<CanonProposalRecord> {
    const { chronicle } = await params.driver.synthesizeChronicle({
      campaignId: params.campaignId,
      sessionTitle: params.sessionTitle,
      targetSubfolder: params.targetSubfolder,
      events: params.events,
    });

    return this.enqueue(params.sceneId, {
      title: chronicle.title,
      category: 'chronicle_entry',
      summary: chronicle.summary,
      targetSubfolder: chronicle.targetSubfolder,
      markdownContent: chronicle.markdownContent,
    });
  }

  listPending(): CanonProposalRecord[] {
    return Array.from(this.proposals.values()).filter(
      (p) => p.status === 'pending',
    );
  }

  listAll(): CanonProposalRecord[] {
    return Array.from(this.proposals.values());
  }

  getById(proposalId: string): CanonProposalRecord | undefined {
    return this.proposals.get(proposalId);
  }

  reject(proposalId: string): CanonProposalRecord {
    const existing = this.proposals.get(proposalId);
    if (!existing) {
      throw new Error(`Propuesta de Canon no encontrada: "${proposalId}"`);
    }
    if (existing.status !== 'pending') {
      throw new Error(
        `La Propuesta de Canon "${proposalId}" ya fue procesada (${existing.status}).`,
      );
    }

    const updated: CanonProposalRecord = {
      ...existing,
      status: 'rejected',
    };
    this.proposals.set(proposalId, updated);
    this.persistRecord(updated);
    return updated;
  }

  approve(proposalId: string): CanonProposalRecord {
    const existing = this.proposals.get(proposalId);
    if (!existing) {
      throw new Error(`Propuesta de Canon no encontrada: "${proposalId}"`);
    }
    if (existing.status !== 'pending') {
      throw new Error(
        `La Propuesta de Canon "${proposalId}" ya fue procesada (${existing.status}).`,
      );
    }

    // Validación canónica anti-Path Traversal (ADR-0011)
    const safeDestinationPath = SafeVaultPathGuard.resolveSafeWritePath(
      this.vaultRootPath,
      existing.targetSubfolder,
      existing.title,
    );

    const safeMarkdown = SecretRedactor.redact(existing.markdownContent);
    fs.mkdirSync(path.dirname(safeDestinationPath), { recursive: true });
    fs.writeFileSync(safeDestinationPath, safeMarkdown, 'utf-8');

    const updated: CanonProposalRecord = {
      ...existing,
      status: 'approved',
      writtenFilePath: safeDestinationPath,
    };
    this.proposals.set(proposalId, updated);
    this.persistRecord(updated);
    return updated;
  }
}
