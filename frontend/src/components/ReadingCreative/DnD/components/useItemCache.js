import { useState, useEffect } from 'react';

/**
 * Resolve the library rows behind a character's gear instances. Given
 * `character.items`, batch-fetches every distinct `refId` and returns a
 * `{ [id]: itemRow }` map. Re-fetches only when the set of referenced ids
 * changes. Mirrors the spell cache in SpellsTab.
 */
export default function useItemCache(items) {
  const [cache, setCache] = useState({});

  const refIds = [...new Set(
    (items || [])
      .filter(i => i.refType === 'item' && i.refId != null)
      .map(i => i.refId)
  )];
  const key = refIds.slice().sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (refIds.length === 0) { setCache({}); return; }
    let alive = true;
    fetch('/api/dnd/items/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: refIds }),
    })
      .then(r => r.json())
      .then(rows => {
        if (!alive || !Array.isArray(rows)) return;
        const map = {};
        rows.forEach(it => { map[it.id] = it; });
        setCache(map);
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return cache;
}
