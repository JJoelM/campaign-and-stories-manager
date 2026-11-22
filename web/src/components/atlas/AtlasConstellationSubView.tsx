import React, { useMemo, useState } from 'react';
import { EyeOff } from 'lucide-react';
import type { ApiViewPayload, LoreNode } from '../../types';
import { extractCleanExcerpt } from '../../lib/markdown';

interface AtlasConstellationSubViewProps {
  view: ApiViewPayload;
  visibleMap: Map<string, LoreNode>;
  selectedNodeId: string | null;
  onOpenNode: (nodeId: string) => void;
}

export const AtlasConstellationSubView: React.FC<
  AtlasConstellationSubViewProps
> = ({ view, visibleMap, selectedNodeId, onOpenNode }) => {
  const [constellationFocus, setConstellationFocus] = useState<string | null>(
    null,
  );

  const constellationHubs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of view.visibleNodes) {
      let c = 0;
      for (const t of view.adjacencyGraph[node.id] || []) {
        if (t !== node.id && visibleMap.has(t.toLowerCase())) c++;
      }
      for (const [src, tgts] of Object.entries(view.adjacencyGraph)) {
        if (
          src !== node.id &&
          tgts.includes(node.id) &&
          visibleMap.has(src.toLowerCase())
        ) {
          c++;
        }
      }
      if (c > 0) counts.set(node.id, c);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [view.visibleNodes, view.adjacencyGraph, visibleMap]);

  const constellationData = useMemo(() => {
    const getNeighbors = (id: string) => {
      const set = new Set<string>();
      for (const t of view.adjacencyGraph[id] || []) {
        if (t !== id && visibleMap.has(t.toLowerCase())) set.add(t);
      }
      for (const [src, tgts] of Object.entries(view.adjacencyGraph)) {
        if (
          src !== id &&
          tgts.includes(id) &&
          visibleMap.has(src.toLowerCase())
        ) {
          set.add(src);
        }
      }
      return Array.from(set).slice(0, 16);
    };

    const preferredId =
      (constellationFocus && visibleMap.has(constellationFocus.toLowerCase())
        ? visibleMap.get(constellationFocus.toLowerCase())!.id
        : null) ||
      (selectedNodeId && visibleMap.has(selectedNodeId.toLowerCase())
        ? visibleMap.get(selectedNodeId.toLowerCase())!.id
        : null);

    if (preferredId) {
      const nbs = getNeighbors(preferredId);
      if (nbs.length > 0 || constellationFocus) {
        return { center: preferredId, neighbors: nbs };
      }
    }

    const topHub = constellationHubs[0]?.[0] || view.visibleNodes[0]?.id || null;
    if (!topHub) return { center: null, neighbors: [] as string[] };
    return { center: topHub, neighbors: getNeighbors(topHub) };
  }, [
    constellationFocus,
    selectedNodeId,
    constellationHubs,
    view.adjacencyGraph,
    view.visibleNodes,
    visibleMap,
  ]);

  return (
    <section className="surface-card stack" style={{ gap: 12 }}>
      <div className="row-between">
        <div>
          <h2 className="section-title">
            Conexiones: {constellationData.center || 'Thyrenia'}
          </h2>
          <div className="muted">
            {constellationData.neighbors.length} nodos vinculados directamente
          </div>
        </div>
        <div className="row">
          {constellationHubs.length > 0 && (
            <select
              aria-label="Cambiar nodo central de la constelación"
              value={constellationData.center || ''}
              onChange={(e) => setConstellationFocus(e.target.value || null)}
            >
              {constellationHubs.map(([id, count]) => (
                <option key={id} value={id}>
                  {id} ({count})
                </option>
              ))}
            </select>
          )}
          {constellationData.center && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onOpenNode(constellationData.center!)}
            >
              Abrir en Códice
            </button>
          )}
        </div>
      </div>

      {constellationData.neighbors.length === 0 ? (
        <div className="muted">
          <EyeOff size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Este nodo aún no tiene enlaces visibles directos.
        </div>
      ) : (
        <div className="gallery-grid">
          {constellationData.neighbors.map((nbId) => {
            const nb = visibleMap.get(nbId.toLowerCase());
            if (!nb) return null;
            return (
              <button
                key={nb.relativePath}
                type="button"
                className="lore-card-btn"
                onClick={() => onOpenNode(nb.id)}
              >
                <strong style={{ color: 'var(--text-strong)' }}>{nb.title}</strong>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  {extractCleanExcerpt(nb.sanitizedContent, 85)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
