import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ApiViewPayload } from '../../types';
import {
  classifyCategory,
  cleanBreadcrumbSegment,
  layerLabel,
} from '../../lib/markdown';

export interface SearchDrawerProps {
  open: boolean;
  view: ApiViewPayload;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  view,
  onClose,
  onSelectNode,
}) => {
  const [query, setQuery] = useState('');
  const [layerFilter, setLayerFilter] = useState<string>('all');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return view.visibleNodes
      .filter((n) => (layerFilter === 'all' ? true : n.layer === layerFilter))
      .filter((n) => {
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.relativePath.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.sanitizedContent.toLowerCase().includes(q)
        );
      })
      .slice(0, 35);
  }, [view.visibleNodes, query, layerFilter]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Buscar en el Códice"
      >
        <div className="row-between">
          <h3 className="section-title">
            <Search size={16} /> Buscar en el Códice
          </h3>
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Cerrar búsqueda"
          >
            <X size={16} />
          </button>
        </div>

        <input
          type="search"
          autoFocus
          placeholder="Buscar dioses, reinos, PNJs, reglas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="row">
          {(
            [
              ['all', 'Todas'],
              ['base', 'Base'],
              ['asimetrica', 'Asimétrica'],
              ['progresiva', 'Progresiva'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={layerFilter === id ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '0.76rem', padding: '5px 10px' }}
              onClick={() => setLayerFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="stack" style={{ gap: 8 }}>
          {results.map((node) => {
            const crumb = node.relativePath
              .split('/')
              .slice(0, -1)
              .map(cleanBreadcrumbSegment)
              .filter(Boolean)
              .join(' · ');
            return (
              <button
                key={node.relativePath}
                type="button"
                className="lore-card-btn"
                onClick={() => {
                  onSelectNode(node.id);
                  onClose();
                }}
              >
                <div className="row-between" style={{ width: '100%' }}>
                  <strong style={{ color: 'var(--text-strong)' }}>
                    {node.title}
                  </strong>
                  <span className="badge">{layerLabel(node.layer)}</span>
                </div>
                <div className="muted" style={{ fontSize: '0.76rem' }}>
                  {crumb || classifyCategory(node.relativePath)}
                  {node.isSkeleton ? ' · En construcción' : ''}
                </div>
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="muted" style={{ fontSize: '0.86rem' }}>
              No se encontraron Nodos de Lore visibles para esa búsqueda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
