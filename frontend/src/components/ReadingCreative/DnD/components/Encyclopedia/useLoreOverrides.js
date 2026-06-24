import { useState, useEffect, useCallback } from 'react';

/**
 * Loads and persists per-node lore overrides (editable flavor text) from the
 * backend, and merges them over the static rules-tree defaults at read time.
 * Only prose is stored — overview, tagline, and lore sections — never the
 * mechanical traits/progression.
 */
export default function useLoreOverrides() {
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    let alive = true;
    fetch('/api/dnd/rules-overrides')
      .then(r => r.json())
      .then(map => { if (alive && map && typeof map === 'object') setOverrides(map); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const saveOverride = useCallback((nodeId, data) => {
    setOverrides(prev => ({ ...prev, [nodeId]: data }));
    fetch(`/api/dnd/rules-overrides/${encodeURIComponent(nodeId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(e => console.error('Failed to save lore override:', e));
  }, []);

  return { overrides, saveOverride };
}

/** Merge a node's override prose over its static getNodeDetail result.
 * Lore keys whose override value is null are tombstones — dropped entirely, so a
 * default section can be deleted. `loreLabels` carries custom section headers. */
export function applyOverride(detail, ov) {
  if (!detail || !ov) return detail;
  const lore = { ...(detail.lore || {}), ...(ov.lore || {}) };
  Object.keys(lore).forEach(k => { if (lore[k] == null) delete lore[k]; });
  return {
    ...detail,
    tagline: ov.tagline ?? detail.tagline,
    overview: ov.overview ?? detail.overview,
    lore,
    loreLabels: { ...(detail.loreLabels || {}), ...(ov.loreLabels || {}) },
  };
}
