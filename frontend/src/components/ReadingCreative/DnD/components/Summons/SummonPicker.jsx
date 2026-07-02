import { useState, useEffect, useCallback } from 'react';
import { X, Search, Wand2, Sparkles, ChevronDown, ChevronRight, Save, Zap } from 'lucide-react';
import SummonForm from './SummonForm';
import CompanionStatBlock from '../ClassFeatures/CompanionStatBlock';
import {
  toStatBlock, spawnInstances, blankSummonDraft, draftToPayload,
  SUMMON_CATEGORIES,
} from '../../rules/shared/summons';

/**
 * Top-layer picker for the Summons sub-tab. Browse/search the /api/dnd/summons
 * library (category-filtered), pick a template, choose a quantity + custom name,
 * and spawn that many independently-tracked instances. Also authors custom
 * creatures — save to the library (persistent) or summon once without saving.
 * Reuses the option-picker overlay skin (op-picker__*).
 */
export default function SummonPicker({ onSpawn, onClose }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [spawnCfg, setSpawnCfg] = useState({}); // rowId -> { quantity, name }
  const [builder, setBuilder] = useState(false);
  const [draft, setDraft] = useState(blankSummonDraft);
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    fetch(`/api/dnd/summons?${params}`).then(r => r.json()).then(setResults).catch(() => setResults([]));
  }, [query, category]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  const cfgFor = (id) => spawnCfg[id] || { quantity: 1, name: '' };
  const setCfg = (id, fields) => setSpawnCfg(p => ({ ...p, [id]: { ...cfgFor(id), ...fields } }));

  const spawnFromRow = (row) => {
    const { quantity, name } = cfgFor(row.id);
    onSpawn(spawnInstances(row, quantity, name.trim() || undefined));
    onClose();
  };

  const saveCustom = async (alsoSummon) => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dnd/summons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftToPayload({ ...draft, is_custom: true })),
      });
      const row = await res.json();
      if (alsoSummon) { onSpawn(spawnInstances(row, 1)); onClose(); }
      else { setBuilder(false); setDraft(blankSummonDraft()); fetchList(); }
    } finally {
      setSaving(false);
    }
  };

  const summonDraftOnce = () => {
    if (!draft.name.trim()) return;
    // templateId stays null — an ad-hoc creature not saved to the library.
    onSpawn(spawnInstances({ ...draftToPayload(draft), id: null }, 1));
    onClose();
  };

  return (
    <div className="op-picker__overlay" onClick={onOverlayClick}>
      <div className="op-picker op-picker--conjure" role="dialog" aria-modal="true"
        style={{ '--op-accent': 'var(--dnd-class-warlock, #8a5fb0)' }}>
        <button className="op-picker__close" onClick={onClose} aria-label="Close"><X size={18} /></button>

        <div className="op-picker__banner">
          <div className="op-picker__banner-icon"><Sparkles size={26} /></div>
          <div className="op-picker__banner-text">
            <h3 className="op-picker__title">Summon a Creature</h3>
            <p className="op-picker__tagline">Call an ally to the battlefield from your library.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="op-picker__controls">
          <div className="op-picker__search">
            <Search size={14} />
            <input className="dnd-field" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search summons…" disabled={builder} />
          </div>
          <button className={`op-picker__builder-toggle ${builder ? 'op-picker__builder-toggle--on' : ''}`}
            onClick={() => setBuilder(b => !b)}>
            <Wand2 size={14} /> {builder ? 'Back to library' : 'Create custom'}
          </button>
        </div>

        {!builder && (
          <div className="dnd-summon-picker__cats">
            <button className={category === '' ? 'is-on' : ''} onClick={() => setCategory('')}>All</button>
            {SUMMON_CATEGORIES.map(c => (
              <button key={c.id} className={category === c.id ? 'is-on' : ''}
                onClick={() => setCategory(c.id)}>{c.label}</button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="op-picker__body">
          {builder ? (
            <div className="op-picker__builder">
              <SummonForm draft={draft} onChange={setDraft} />
              <div className="dnd-summon-picker__builder-actions">
                <button className="dnd-summon-picker__spawn-btn" disabled={saving || !draft.name.trim()}
                  onClick={() => saveCustom(true)}>
                  <Save size={14} /> Save to library & summon
                </button>
                <button className="dnd-summon-picker__spawn-btn dnd-summon-picker__spawn-btn--ghost"
                  disabled={saving || !draft.name.trim()} onClick={() => saveCustom(false)}>
                  <Save size={14} /> Save only
                </button>
                <button className="dnd-summon-picker__spawn-btn dnd-summon-picker__spawn-btn--ghost"
                  disabled={!draft.name.trim()} onClick={summonDraftOnce}>
                  <Zap size={14} /> Summon once (no save)
                </button>
              </div>
            </div>
          ) : (
            <div className="op-picker__list">
              {results.length === 0 && <div className="op-picker__no-results">No summons found. Try “Create custom”.</div>}
              {results.map(row => {
                const open = expanded === row.id;
                const cfg = cfgFor(row.id);
                return (
                  <div key={row.id} className={`op-picker__opt ${open ? 'op-picker__opt--selected' : ''}`}>
                    <button className="op-picker__opt-main" onClick={() => setExpanded(open ? null : row.id)}>
                      <span className="op-picker__opt-chev">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
                      <span className="op-picker__opt-name">{row.name}</span>
                      <span className="op-picker__opt-meta">
                        {row.size} {row.creature_type}{row.requires_concentration ? ' · conc.' : ''}
                      </span>
                    </button>
                    {open && (
                      <div className="dnd-summon-picker__detail">
                        <CompanionStatBlock block={toStatBlock(row)} accent="var(--dnd-class-warlock, #8a5fb0)" />
                        <div className="dnd-summon-picker__spawn">
                          <label>Qty
                            <input type="number" min="1" max="50" className="dnd-field" value={cfg.quantity}
                              onChange={e => setCfg(row.id, { quantity: e.target.value })} />
                          </label>
                          <label className="dnd-summon-picker__spawn-name">Name
                            <input className="dnd-field" value={cfg.name} placeholder={row.name}
                              onChange={e => setCfg(row.id, { name: e.target.value })} />
                          </label>
                          <button className="dnd-summon-picker__spawn-btn" onClick={() => spawnFromRow(row)}>
                            <Sparkles size={14} /> Summon
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
