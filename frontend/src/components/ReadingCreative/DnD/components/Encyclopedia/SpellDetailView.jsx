import { useState, useEffect } from 'react';
import { parseSpellClasses, spellClassLabel } from '../Spellcasting/spellTags';
import { spellLevelColor, spellLevelOrdinal } from './spellTheme';
import Mech from './Mech';

const META_FIELDS = [
  ['casting_time', 'Casting Time'],
  ['range', 'Range'],
  ['aoe', 'Area'],
  ['duration', 'Duration'],
  ['components', 'Components'],
];

/**
 * Full spell readout — the deepest frame on the spell branch. Fetches the full
 * row on demand and presents it with the tier color and mechanical
 * highlighting. The end of the line: spells never link back outward.
 */
export default function SpellDetailView({ spellId, preview }) {
  const [spell, setSpell] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/dnd/spells/${spellId}`)
      .then(r => r.json())
      .then(s => { if (alive) setSpell(s); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [spellId]);

  if (!spell) return <div className="wiki-detail">{loading ? 'Loading spell…' : 'Spell not found.'}</div>;

  const accent = spellLevelColor(spell.level);
  const tags = parseSpellClasses(spell.classes);

  return (
    <div className="wiki-detail" style={{ '--accent': accent }}>
      <header className="wiki-detail__hero">
        <span className="wiki-detail__kicker">
          {spellLevelOrdinal(spell.level)}{spell.spell_type ? ` · ${spell.spell_type}` : ''}
        </span>
        <h2 className="wiki-detail__name">{spell.name}</h2>
        <div className="wiki-spell-flags">
          {spell.concentration ? <span className="wiki-flag">Concentration</span> : null}
          {spell.ritual ? <span className="wiki-flag">Ritual</span> : null}
        </div>
      </header>

      <div className="wiki-spellmeta">
        {META_FIELDS.map(([key, label]) => spell[key] ? (
          <div key={key} className="wiki-spellmeta__cell">
            <span className="wiki-spellmeta__k">{label}</span>
            <span className="wiki-spellmeta__v"><Mech text={String(spell[key])} /></span>
          </div>
        ) : null)}
        {spell.damage && (
          <div className="wiki-spellmeta__cell">
            <span className="wiki-spellmeta__k">Damage</span>
            <span className="wiki-spellmeta__v mech mech--dice">{spell.damage}</span>
          </div>
        )}
        {spell.save_type && (
          <div className="wiki-spellmeta__cell">
            <span className="wiki-spellmeta__k">Save</span>
            <span className="wiki-spellmeta__v">{spell.save_type}{spell.save_effect ? ` (${spell.save_effect})` : ''}</span>
          </div>
        )}
      </div>

      {spell.description && (
        <section className="wiki-section">
          <p className="wiki-detail__overview"><Mech text={spell.description} /></p>
        </section>
      )}

      {spell.upcast && (
        <div className="wiki-defining">
          <div>
            <span className="wiki-defining__name">At Higher Levels</span>
            <p className="wiki-defining__desc"><Mech text={spell.upcast} /></p>
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="wiki-chips">
          {tags.map(t => <span key={t} className="wiki-chip">{spellClassLabel(t)}</span>)}
        </div>
      )}
    </div>
  );
}
