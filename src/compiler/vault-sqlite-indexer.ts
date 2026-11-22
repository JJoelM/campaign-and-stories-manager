import fs from 'node:fs';
import path from 'node:path';
import {
  DatabaseSyncInstance,
  openSqliteDatabase,
} from '../infra/sqlite-client.js';
import {
  CharacterContext,
  CompiledVaultView,
  KnowledgeLayer,
  LoreNode,
} from '../domain/schemas.js';

export interface LoreRetrievalQuery {
  locationNodeId?: string;
  playerAction?: string;
  sceneDescription?: string;
  character?: CharacterContext;
  limit?: number;
}

export interface RankedLoreNode extends LoreNode {
  score: number;
  matchReason: string;
}

const STOPWORDS = new Set([
  'los',
  'las',
  'uno',
  'una',
  'unos',
  'unas',
  'del',
  'con',
  'por',
  'para',
  'que',
  'como',
  'pero',
  'sin',
  'sobre',
  'entre',
  'hacia',
  'desde',
  'todo',
  'toda',
  'todos',
  'todas',
  'esta',
  'este',
  'esto',
  'ese',
  'eso',
  'esa',
  'son',
  'fue',
  'ser',
  'hay',
  'sus',
  'mas',
]);

function normalizeText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function tokenize(raw: string): string[] {
  const normalized = normalizeText(raw);
  const matches = normalized.match(/[a-z0-9]{3,}/g) || [];
  return matches.filter((token) => !STOPWORDS.has(token));
}

function countOccurrences(haystack: string, needle: string): number {
  if (!haystack || !needle) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

/**
 * Indexador SQLite local del grafo de Nodos de Lore y recuperación contextual RAG (ADR-0002, ADR-0005).
 * Indexa exclusivamente nodos ya aprobados por el Filtro de Visibilidad (Zero-Trust).
 */
export class VaultSqliteIndexer {
  private readonly db: DatabaseSyncInstance;

  constructor(dbPath = ':memory:') {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
    }
    this.db = openSqliteDatabase(dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS lore_nodes (
        character_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        title TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        layer TEXT NOT NULL,
        sanitized_content TEXT NOT NULL,
        tags_json TEXT NOT NULL,
        outgoing_links_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (character_id, relative_path)
      );
      CREATE INDEX IF NOT EXISTS idx_lore_nodes_node_id
        ON lore_nodes (character_id, node_id);
      CREATE TABLE IF NOT EXISTS lore_edges (
        character_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        PRIMARY KEY (character_id, source_id, target_id)
      );
      CREATE INDEX IF NOT EXISTS idx_lore_edges_source
        ON lore_edges (character_id, source_id);
      CREATE INDEX IF NOT EXISTS idx_lore_edges_target
        ON lore_edges (character_id, target_id);
    `);
  }

  close(): void {
    if (this.db.isOpen) {
      this.db.close();
    }
  }

  indexCompiledView(compiledView: CompiledVaultView): {
    indexedNodes: number;
    indexedEdges: number;
  } {
    const characterId = compiledView.activeCharacter.id;
    const now = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare('DELETE FROM lore_edges WHERE character_id = ?')
        .run(characterId);
      this.db
        .prepare('DELETE FROM lore_nodes WHERE character_id = ?')
        .run(characterId);

      const insertNode = this.db.prepare(`
        INSERT INTO lore_nodes (
          character_id,
          node_id,
          title,
          relative_path,
          layer,
          sanitized_content,
          tags_json,
          outgoing_links_json,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertEdge = this.db.prepare(`
        INSERT OR IGNORE INTO lore_edges (character_id, source_id, target_id)
        VALUES (?, ?, ?)
      `);

      let indexedEdges = 0;
      for (const node of compiledView.visibleNodes) {
        insertNode.run(
          characterId,
          node.id,
          node.title,
          node.relativePath,
          node.layer,
          node.sanitizedContent,
          JSON.stringify(node.tags),
          JSON.stringify(node.outgoingLinks),
          now,
        );
      }

      for (const [sourceId, targets] of Object.entries(
        compiledView.adjacencyGraph,
      )) {
        for (const targetId of targets) {
          insertEdge.run(characterId, sourceId, targetId);
          indexedEdges++;
        }
      }

      this.db.exec('COMMIT');
      return {
        indexedNodes: compiledView.visibleNodes.length,
        indexedEdges,
      };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  getIndexStats(characterId?: string): {
    nodeCount: number;
    edgeCount: number;
  } {
    const nodeRow = (
      characterId
        ? this.db
            .prepare(
              'SELECT COUNT(*) AS cnt FROM lore_nodes WHERE character_id = ?',
            )
            .get(characterId)
        : this.db.prepare('SELECT COUNT(*) AS cnt FROM lore_nodes').get()
    ) as { cnt: number };

    const edgeRow = (
      characterId
        ? this.db
            .prepare(
              'SELECT COUNT(*) AS cnt FROM lore_edges WHERE character_id = ?',
            )
            .get(characterId)
        : this.db.prepare('SELECT COUNT(*) AS cnt FROM lore_edges').get()
    ) as { cnt: number };

    return {
      nodeCount: Number(nodeRow?.cnt ?? 0),
      edgeCount: Number(edgeRow?.cnt ?? 0),
    };
  }

  retrieveRelevantNodes(
    query: LoreRetrievalQuery & { character: CharacterContext },
  ): RankedLoreNode[] {
    const characterId = query.character.id;
    const rows = this.db
      .prepare(
        `SELECT node_id, title, relative_path, layer, sanitized_content, tags_json, outgoing_links_json
         FROM lore_nodes
         WHERE character_id = ?`,
      )
      .all(characterId) as Array<{
      node_id: string;
      title: string;
      relative_path: string;
      layer: KnowledgeLayer;
      sanitized_content: string;
      tags_json: string;
      outgoing_links_json: string;
    }>;

    if (rows.length === 0) {
      return [];
    }

    const edgeRows = this.db
      .prepare(
        `SELECT source_id, target_id
         FROM lore_edges
         WHERE character_id = ?`,
      )
      .all(characterId) as Array<{ source_id: string; target_id: string }>;

    const nodes: LoreNode[] = rows.map((row) => ({
      id: row.node_id,
      title: row.title,
      relativePath: row.relative_path,
      layer: row.layer,
      sanitizedContent: row.sanitized_content,
      tags: JSON.parse(row.tags_json) as string[],
      outgoingLinks: JSON.parse(row.outgoing_links_json) as string[],
    }));

    const adjacencyGraph: Record<string, string[]> = {};
    for (const edge of edgeRows) {
      if (!adjacencyGraph[edge.source_id]) {
        adjacencyGraph[edge.source_id] = [];
      }
      adjacencyGraph[edge.source_id].push(edge.target_id);
    }

    return VaultSqliteIndexer.rankNodes(nodes, adjacencyGraph, query);
  }

  static rankNodesForContext(
    compiledView: CompiledVaultView,
    query: Omit<LoreRetrievalQuery, 'character'>,
  ): RankedLoreNode[] {
    return this.rankNodes(
      compiledView.visibleNodes,
      compiledView.adjacencyGraph,
      query,
    );
  }

  private static rankNodes(
    nodes: LoreNode[],
    adjacencyGraph: Record<string, string[]>,
    query: Omit<LoreRetrievalQuery, 'character'>,
  ): RankedLoreNode[] {
    const limit = query.limit ?? 25;
    const queryTokens = Array.from(
      new Set(
        tokenize(
          [
            query.locationNodeId || '',
            query.sceneDescription || '',
            query.playerAction || '',
          ].join(' '),
        ),
      ),
    );

    const locationLower = query.locationNodeId?.toLowerCase();
    const neighborLowerSet = new Set<string>();
    if (locationLower) {
      for (const [source, targets] of Object.entries(adjacencyGraph)) {
        const sourceLower = source.toLowerCase();
        if (sourceLower === locationLower) {
          for (const t of targets) {
            neighborLowerSet.add(t.toLowerCase());
          }
        }
        if (targets.some((t) => t.toLowerCase() === locationLower)) {
          neighborLowerSet.add(sourceLower);
        }
      }
    }

    const preparedDocs = nodes.map((node) => ({
      node,
      normTitle: normalizeText(node.title),
      normTags: normalizeText(node.tags.join(' ')),
      normContent: normalizeText(node.sanitizedContent),
    }));

    const totalDocs = Math.max(1, preparedDocs.length);
    const idfByToken = new Map<string, number>();
    for (const token of queryTokens) {
      let df = 0;
      for (const doc of preparedDocs) {
        if (
          doc.normTitle.includes(token) ||
          doc.normTags.includes(token) ||
          doc.normContent.includes(token)
        ) {
          df++;
        }
      }
      idfByToken.set(token, Math.log(1 + totalDocs / (1 + df)));
    }

    const ranked: RankedLoreNode[] = preparedDocs.map((doc) => {
      const reasons: string[] = [];
      let score = 0;

      if (doc.node.layer === 'asimetrica') {
        score += 3;
        reasons.push('capa_asimetrica');
      } else if (doc.node.layer === 'progresiva') {
        score += 2;
        reasons.push('capa_progresiva');
      } else {
        score += 0.5;
      }

      const idLower = doc.node.id.toLowerCase();
      if (locationLower && idLower === locationLower) {
        score += 10;
        reasons.push('ubicacion_actual');
      } else if (neighborLowerSet.has(idLower)) {
        score += 5;
        reasons.push('vecino_grafo');
      }

      let lexicalScore = 0;
      for (const token of queryTokens) {
        const idf = idfByToken.get(token) ?? 0;
        const titleHits = countOccurrences(doc.normTitle, token);
        const tagHits = countOccurrences(doc.normTags, token);
        const contentHits = Math.min(
          5,
          countOccurrences(doc.normContent, token),
        );
        const tf = titleHits * 3 + tagHits * 2 + contentHits;
        if (tf > 0) {
          lexicalScore += tf * idf;
        }
      }

      if (lexicalScore > 0) {
        score += lexicalScore;
        reasons.push('relevancia_rag');
      }

      return {
        ...doc.node,
        score: Number(score.toFixed(4)),
        matchReason: reasons.join(', ') || 'base_lore',
      };
    });

    ranked.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

    return ranked.slice(0, limit);
  }
}
