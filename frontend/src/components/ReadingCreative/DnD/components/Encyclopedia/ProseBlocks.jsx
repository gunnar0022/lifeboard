import { useState } from 'react';
import { Star, Plus, Trash2 } from 'lucide-react';
import Mech from './Mech';
import { titleFor, orderedKeys } from './loreText';

/** Hero header: kicker + name + tagline (editable in edit mode). */
export function ProseHeader({ kicker, name, tagline, editMode, prose }) {
  return (
    <header className="wiki-detail__hero">
      <span className="wiki-detail__kicker">{kicker}</span>
      <h2 className="wiki-detail__name">{name}</h2>
      {editMode ? (
        <input
          className="wiki-edit wiki-edit--tagline"
          value={tagline || ''}
          placeholder="One-line tagline…"
          onChange={e => prose.setField('tagline', e.target.value)}
          onBlur={prose.commit}
        />
      ) : tagline && <p className="wiki-detail__tagline">{tagline}</p>}
    </header>
  );
}

/** Overview paragraph (editable in edit mode). */
export function Overview({ overview, editMode, prose }) {
  if (editMode) {
    return (
      <textarea
        className="wiki-edit wiki-edit--overview"
        value={overview || ''}
        placeholder="Overview / playstyle…"
        rows={3}
        onChange={e => prose.setField('overview', e.target.value)}
        onBlur={prose.commit}
      />
    );
  }
  return overview ? <p className="wiki-detail__overview">{overview}</p> : null;
}

/** Defining-feature callout. */
export function DefiningFeature({ feature }) {
  if (!feature) return null;
  return (
    <div className="wiki-defining">
      <Star className="wiki-defining__star" size={15} />
      <div>
        <span className="wiki-defining__name">{feature.name}</span>
        <p className="wiki-defining__desc"><Mech text={feature.desc} /></p>
      </div>
    </div>
  );
}

/** Lore section list with add-section, editable in edit mode. Headers can be
 * renamed and whole sections deleted while editing. */
export function LoreBlock({ lore, order, editMode, prose, title = 'Lore', labels = {} }) {
  const [newLabel, setNewLabel] = useState('');
  const keys = orderedKeys(lore, order).filter(k => editMode || (lore[k] && String(lore[k]).trim()));
  if (keys.length === 0 && !editMode) return null;

  const add = () => { prose.addSection(newLabel); setNewLabel(''); };
  const labelFor = (key) => labels[key] || titleFor(key);

  return (
    <section className="wiki-section wiki-section--lore">
      <h3 className="wiki-section__title">{title}</h3>
      {keys.map(key => (
        <div key={key} className="wiki-lore">
          {editMode ? (
            <div className="wiki-lore__edit-head">
              <input
                className="wiki-edit wiki-edit--inline wiki-lore__label-edit"
                value={labelFor(key)}
                placeholder="Section header…"
                onChange={e => prose.setLabel(key, e.target.value)}
                onBlur={prose.commit}
              />
              <button className="wiki-lore__del" onClick={() => prose.removeSection(key)} title="Delete this section">
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <span className="wiki-lore__label">{labelFor(key)}</span>
          )}
          {editMode ? (
            <textarea
              className="wiki-edit"
              value={lore[key] || ''}
              placeholder={`${labelFor(key)}…`}
              rows={2}
              onChange={e => prose.setLore(key, e.target.value)}
              onBlur={prose.commit}
            />
          ) : (
            <p className="wiki-lore__body">{lore[key]}</p>
          )}
        </div>
      ))}
      {editMode && (
        <div className="wiki-lore__add">
          <input
            className="wiki-edit wiki-edit--inline"
            value={newLabel}
            placeholder="New section (e.g. Origin)"
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
          />
          <button className="dnd-add-btn" onClick={add}><Plus size={13} /> Add section</button>
        </div>
      )}
    </section>
  );
}
