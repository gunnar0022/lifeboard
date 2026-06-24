import { useState } from 'react';
import { applyOverride } from './useLoreOverrides';
import { slugify } from './loreText';

/**
 * Shared editing state for a node's flavor prose (tagline / overview / lore
 * sections). Used by both the race and class detail pages so the edit-and-
 * persist behavior lives in one place. The component must be keyed by nodeId so
 * the local draft resets on navigation; the draft is authoritative while open.
 *
 * Returns the override-merged `detail` plus mutators that commit on blur.
 */
export default function useEditableProse(nodeId, base, override, onSaveOverride) {
  const [draft, setDraft] = useState(() => override || {});

  const detail = applyOverride(base, draft);
  const commit = () => onSaveOverride?.(nodeId, draft);
  const setField = (field, value) => setDraft(d => ({ ...d, [field]: value }));
  const setLore = (key, value) => setDraft(d => ({ ...d, lore: { ...(d.lore || {}), [key]: value } }));
  // Rename a section's header (stored as a custom label so what you type shows
  // verbatim — the underlying key stays stable).
  const setLabel = (key, label) =>
    setDraft(d => ({ ...d, loreLabels: { ...(d.loreLabels || {}), [key]: label } }));
  const addSection = (label) => {
    const key = slugify(label);
    if (!key) return;
    setDraft(d => {
      const next = {
        ...d,
        lore: { ...(d.lore || {}), [key]: (d.lore?.[key] ?? '') },
        loreLabels: { ...(d.loreLabels || {}), [key]: label },
      };
      onSaveOverride?.(nodeId, next);
      return next;
    });
  };
  // Delete a section. A null value tombstones it so it's removed even when the
  // section came from the static defaults (applyOverride strips null lore keys).
  const removeSection = (key) => {
    setDraft(d => {
      const labels = { ...(d.loreLabels || {}) };
      delete labels[key];
      const next = { ...d, lore: { ...(d.lore || {}), [key]: null }, loreLabels: labels };
      onSaveOverride?.(nodeId, next);
      return next;
    });
  };

  return { detail, commit, setField, setLore, setLabel, addSection, removeSection };
}
