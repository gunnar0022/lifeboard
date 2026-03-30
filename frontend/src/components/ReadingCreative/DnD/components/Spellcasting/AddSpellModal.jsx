import { useState, useRef, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';

const SPELL_TYPE_OPTIONS = ['damage', 'healing', 'buff', 'debuff', 'utility', 'control'];
const SAVE_OPTIONS = ['', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function AddSpellModal({ isCantrip, onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState(isCantrip ? 0 : '');
  const [results, setResults] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const [newSpell, setNewSpell] = useState({
    name: '', level: isCantrip ? 0 : 1, casting_time: '1 action', range: '',
    aoe: '', duration: 'Instantaneous', concentration: false, ritual: false,
    components: '', spell_type: 'utility', damage: '', save_type: '',
    save_effect: '', description: '', upcast: '', source: 'PHB',
  });

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!query && levelFilter === '') {
        // Show recent spells
        fetch('/api/dnd/spells?limit=10').then(r => r.json()).then(setResults).catch(() => {});
        return;
      }
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (levelFilter !== '') params.set('level', levelFilter);
      params.set('limit', '20');
      fetch(`/api/dnd/spells?${params}`).then(r => r.json()).then(setResults).catch(() => {});
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, levelFilter]);

  const handleSelect = (spell) => {
    onAdd(spell.id);
    onClose();
  };

  const handleCreate = async () => {
    if (!newSpell.name.trim() || !newSpell.description.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/dnd/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpell),
      });
      const spell = await res.json();
      onAdd(spell.id);
      onClose();
    } catch (e) {
      console.error('Create spell failed:', e);
    } finally {
      setCreating(false);
    }
  };

  const updateNew = (fields) => setNewSpell(prev => ({ ...prev, ...fields }));

  const levelLabel = (lvl) => lvl === 0 ? 'Cantrip' : `Level ${lvl}`;

  return (
    <div className="spell-modal__overlay" onClick={onClose}>
      <div className="spell-modal" onClick={e => e.stopPropagation()}>
        <div className="spell-modal__header">
          <h3>{isCantrip ? 'Add Cantrip' : 'Add Spell'}</h3>
          <button className="spell-modal__close" onClick={onClose}><X size={16} /></button>
        </div>

        {!showCreate ? (
          <>
            <div className="spell-modal__search">
              <Search size={14} />
              <input ref={searchRef} className="dnd-field" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search spell library..." />
              {!isCantrip && (
                <select className="dnd-field spell-modal__level-filter" value={levelFilter}
                  onChange={e => setLevelFilter(e.target.value === '' ? '' : parseInt(e.target.value))}>
                  <option value="">All levels</option>
                  {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{levelLabel(l)}</option>)}
                </select>
              )}
            </div>

            <div className="spell-modal__results">
              {results.map(spell => (
                <button key={spell.id} className="spell-modal__result" onClick={() => handleSelect(spell)}>
                  <span className="spell-modal__result-name">{spell.name}</span>
                  <span className="spell-modal__result-level">{levelLabel(spell.level)}</span>
                  {spell.damage && <span className="spell-modal__result-damage">{spell.damage}</span>}
                  <span className="spell-modal__result-range">{spell.range}</span>
                </button>
              ))}
              {results.length === 0 && query && (
                <div className="spell-modal__no-results">No spells found</div>
              )}
            </div>

            <button className="dnd-add-btn spell-modal__create-btn" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create New Spell
            </button>
          </>
        ) : (
          <div className="spell-modal__create-form">
            <div className="spell-modal__form-row">
              <div className="spell-modal__form-field spell-modal__form-field--wide">
                <label>Name *</label>
                <input className="dnd-field" value={newSpell.name} onChange={e => updateNew({ name: e.target.value })} />
              </div>
              <div className="spell-modal__form-field">
                <label>Level</label>
                <input type="number" className="dnd-field" value={newSpell.level} min={0} max={9}
                  onChange={e => updateNew({ level: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="spell-modal__form-row">
              <div className="spell-modal__form-field">
                <label>Casting Time</label>
                <input className="dnd-field" value={newSpell.casting_time} onChange={e => updateNew({ casting_time: e.target.value })} />
              </div>
              <div className="spell-modal__form-field">
                <label>Range</label>
                <input className="dnd-field" value={newSpell.range} onChange={e => updateNew({ range: e.target.value })} />
              </div>
              <div className="spell-modal__form-field">
                <label>AOE</label>
                <input className="dnd-field" value={newSpell.aoe} onChange={e => updateNew({ aoe: e.target.value })} placeholder="Optional" />
              </div>
            </div>

            <div className="spell-modal__form-row">
              <div className="spell-modal__form-field">
                <label>Duration</label>
                <input className="dnd-field" value={newSpell.duration} onChange={e => updateNew({ duration: e.target.value })} />
              </div>
              <div className="spell-modal__form-field">
                <label>Components</label>
                <input className="dnd-field" value={newSpell.components} onChange={e => updateNew({ components: e.target.value })} placeholder="V, S, M (...)" />
              </div>
            </div>

            <div className="spell-modal__form-row">
              <label className="spell-modal__checkbox">
                <input type="checkbox" checked={newSpell.concentration} onChange={e => updateNew({ concentration: e.target.checked })} />
                Concentration
              </label>
              <label className="spell-modal__checkbox">
                <input type="checkbox" checked={newSpell.ritual} onChange={e => updateNew({ ritual: e.target.checked })} />
                Ritual
              </label>
              <div className="spell-modal__form-field">
                <label>Type</label>
                <select className="dnd-field" value={newSpell.spell_type} onChange={e => updateNew({ spell_type: e.target.value })}>
                  {SPELL_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="spell-modal__form-row">
              <div className="spell-modal__form-field">
                <label>Damage</label>
                <input className="dnd-field" value={newSpell.damage} onChange={e => updateNew({ damage: e.target.value })} placeholder="e.g. 2d6 fire" />
              </div>
              <div className="spell-modal__form-field">
                <label>Save Type</label>
                <select className="dnd-field" value={newSpell.save_type} onChange={e => updateNew({ save_type: e.target.value })}>
                  {SAVE_OPTIONS.map(s => <option key={s} value={s}>{s || 'None'}</option>)}
                </select>
              </div>
              <div className="spell-modal__form-field">
                <label>Save Effect</label>
                <input className="dnd-field" value={newSpell.save_effect} onChange={e => updateNew({ save_effect: e.target.value })} placeholder="e.g. half damage" />
              </div>
            </div>

            <div className="spell-modal__form-field spell-modal__form-field--full">
              <label>Description *</label>
              <textarea className="dnd-field dnd-field--textarea" rows={3} value={newSpell.description}
                onChange={e => updateNew({ description: e.target.value })} />
            </div>

            <div className="spell-modal__form-field spell-modal__form-field--full">
              <label>At Higher Levels</label>
              <input className="dnd-field" value={newSpell.upcast} onChange={e => updateNew({ upcast: e.target.value })} placeholder="Optional" />
            </div>

            <div className="spell-modal__form-actions">
              <button className="dnd-add-btn" onClick={() => setShowCreate(false)}>Back to Search</button>
              <button className="spell-modal__submit" onClick={handleCreate} disabled={creating || !newSpell.name.trim() || !newSpell.description.trim()}>
                {creating ? 'Creating...' : 'Create & Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
