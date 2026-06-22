import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronRight, Droplet } from 'lucide-react';
import { SPELL_CLASS_TAGS } from '../Spellcasting/spellTags';
import { spellLevelColor, spellLevelShort, spellLevelOrdinal } from './spellTheme';

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const lvlOption = (l) => (l === 0 ? 'Cantrip' : `Level ${l}`);
const CASTING_TIMES = ['1 action', '1 bonus action', '1 reaction', '1 minute', '10 minutes', '1 hour', '8 hours'];

/**
 * The spell library browser. The general filter surface the whole feature
 * funnels into — search by name, class, level range (cantrip→9), and casting
 * time. Arriving from a class page pre-applies that class's filter
 * (initialFilter) but leaves every control free to change. Results are grouped
 * by tier with the spell-level color language; clicking a spell drills in.
 */
export default function SpellListView({ initialFilter, onOpenSpell }) {
  const [q, setQ] = useState('');
  const [classTag, setClassTag] = useState(initialFilter?.classTag || 'any');
  const [levelMin, setLevelMin] = useState(initialFilter?.levelMin ?? 0);
  const [levelMax, setLevelMax] = useState(initialFilter?.levelMax ?? 9);
  const [castingTime, setCastingTime] = useState(initialFilter?.castingTime || 'any');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (classTag !== 'any') params.set('cls', classTag);
      if (levelMin > 0) params.set('level_min', levelMin);
      if (levelMax < 9) params.set('level_max', levelMax);
      if (castingTime !== 'any') params.set('casting_time', castingTime);
      params.set('limit', '400');
      setLoading(true);
      fetch(`/api/dnd/spells?${params}`)
        .then(r => r.json())
        .then(rows => setResults(Array.isArray(rows) ? rows : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, classTag, levelMin, levelMax, castingTime]);

  // Group by level so the tier color ramp organizes the list.
  const groups = useMemo(() => {
    const byLevel = new Map();
    for (const s of results) {
      if (!byLevel.has(s.level)) byLevel.set(s.level, []);
      byLevel.get(s.level).push(s);
    }
    return [...byLevel.entries()].sort((a, b) => a[0] - b[0]);
  }, [results]);

  return (
    <div className="wiki-spells">
      <h2 className="wiki-list__title">Spells</h2>

      <div className="wiki-spellfilter">
        <div className="wiki-spellfilter__search">
          <Search size={14} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name…" />
        </div>
        <select value={classTag} onChange={e => setClassTag(e.target.value)} className="dnd-field">
          <option value="any">Any class</option>
          {SPELL_CLASS_TAGS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={levelMin} onChange={e => setLevelMin(Number(e.target.value))} className="dnd-field" title="Minimum level">
          {LEVELS.map(l => <option key={l} value={l}>{lvlOption(l)}+</option>)}
        </select>
        <select value={levelMax} onChange={e => setLevelMax(Number(e.target.value))} className="dnd-field" title="Maximum level">
          {LEVELS.map(l => <option key={l} value={l}>≤ {lvlOption(l)}</option>)}
        </select>
        <select value={castingTime} onChange={e => setCastingTime(e.target.value)} className="dnd-field">
          <option value="any">Any cast time</option>
          {CASTING_TIMES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {groups.length === 0 ? (
        <p className="wiki-spells__empty">{loading ? 'Searching…' : 'No spells match these filters.'}</p>
      ) : (
        groups.map(([level, spells]) => (
          <section key={level} className="wiki-spelltier" style={{ '--tier': spellLevelColor(level) }}>
            <h3 className="wiki-spelltier__head">
              <span className="wiki-spelltier__badge">{spellLevelShort(level)}</span>
              {spellLevelOrdinal(level)} <span className="wiki-spelltier__count">{spells.length}</span>
            </h3>
            <div className="wiki-spellrows">
              {spells.map(s => (
                <button key={s.id} className="wiki-spellrow" onClick={() => onOpenSpell(s)}>
                  <span className="wiki-spellrow__name">{s.name}</span>
                  {s.damage && <span className="wiki-spellrow__dmg mech mech--dice">{s.damage}</span>}
                  {s.range && <span className="wiki-spellrow__range">{s.range}</span>}
                  {s.concentration ? <Droplet size={12} className="wiki-spellrow__conc" title="Concentration" /> : null}
                  <ChevronRight size={15} className="wiki-spellrow__chev" />
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
