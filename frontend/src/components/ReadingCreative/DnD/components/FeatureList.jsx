import { useState } from 'react';
import { getClassFeatures, getSubclassFeatures, getRaceFeatures, FIGHTING_STYLES, RUNE_LIST, maxRunesKnown } from '../classProgression';

const sourceColors = {
  Barbarian: 'var(--dnd-class-barbarian)', Rogue: 'var(--dnd-class-rogue)',
  Fighter: 'var(--dnd-class-fighter)', Subclass: 'var(--dnd-accent)',
  Race: 'var(--dnd-class-druid)', Homebrew: 'var(--dnd-class-sorcerer)',
  Wizard: 'var(--dnd-class-wizard)', Warlock: 'var(--dnd-class-warlock)',
  Cleric: 'var(--dnd-class-cleric)', Druid: 'var(--dnd-class-druid)',
  Paladin: 'var(--dnd-class-paladin)', Ranger: 'var(--dnd-class-ranger)',
  Bard: 'var(--dnd-class-bard)', Monk: 'var(--dnd-class-monk)',
  Artificer: 'var(--dnd-class-artificer)', Sorcerer: 'var(--dnd-class-sorcerer)',
  // Subclasses inherit their parent class color
  'Rune Knight': 'var(--dnd-class-fighter)',
  'Assassin': 'var(--dnd-class-rogue)',
  'Path of the Ancestral Guardian': 'var(--dnd-class-barbarian)',
  'Circle of Stars': 'var(--dnd-class-druid)',
  'Circle of Spores': 'var(--dnd-class-druid)',
};

// ── Inline build-choice: Fighting Style ────────────────────────────────
function FightingStyleChoice({ classFeature, onUpdate }) {
  const cf = classFeature || {};
  const selected = cf.fightingStyle || '';
  const style = FIGHTING_STYLES.find(s => s.name === selected);
  return (
    <div className="dnd-feature-choice">
      <select
        className="dnd-field dnd-feature-choice__select"
        value={selected}
        onChange={e => onUpdate({ classFeature: { ...cf, fightingStyle: e.target.value } })}
      >
        <option value="">— Choose a Fighting Style —</option>
        {FIGHTING_STYLES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
      </select>
      {style && <p className="dnd-feature-choice__detail">{style.desc}</p>}
    </div>
  );
}

// ── Inline build-choice: Rune Carver runes ─────────────────────────────
function RuneChoice({ classFeature, onUpdate, level }) {
  const cf = classFeature || {};
  const known = cf.knownRunes || [];
  const max = maxRunesKnown(level);
  const [picking, setPicking] = useState(false);

  const addRune = (name) => {
    if (known.includes(name) || known.length >= max) return;
    onUpdate({ classFeature: { ...cf, knownRunes: [...known, name] } });
    setPicking(false);
  };
  const removeRune = (name) => {
    const inv = { ...(cf.runeInvocations || {}) };
    delete inv[name];
    onUpdate({ classFeature: { ...cf, knownRunes: known.filter(r => r !== name), runeInvocations: inv } });
  };

  const available = RUNE_LIST.filter(r => !known.includes(r.name) && r.minLevel <= level);
  const locked = RUNE_LIST.filter(r => r.minLevel > level);

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__rune-head">
        <span className="dnd-feature-choice__count">{known.length}/{max} runes known</span>
        {known.length < max && available.length > 0 && (
          <button className="dnd-feature-choice__add" onClick={() => setPicking(!picking)}>+ Rune</button>
        )}
      </div>

      {picking && (
        <div className="dnd-feature-choice__picker">
          {available.map(r => (
            <button key={r.name} className="dnd-feature-choice__pick" onClick={() => addRune(r.name)} title={r.passive}>
              {r.name}{r.minLevel > 3 && <span className="dnd-feature-choice__pick-lvl"> Lvl {r.minLevel}+</span>}
            </button>
          ))}
        </div>
      )}

      {known.length === 0 && <p className="dnd-feature-choice__empty">No runes inscribed yet — click + Rune.</p>}

      {known.map(name => {
        const r = RUNE_LIST.find(x => x.name === name);
        return (
          <div key={name} className="dnd-feature-choice__rune">
            <div className="dnd-feature-choice__rune-top">
              <span className="dnd-feature-choice__rune-name">{name}</span>
              <button className="dnd-feature-choice__remove" onClick={() => removeRune(name)} title="Replace / remove rune">×</button>
            </div>
            <p className="dnd-feature-choice__rune-line"><strong>Passive:</strong> {r?.passive}</p>
            <p className="dnd-feature-choice__rune-line"><strong>Invoke:</strong> {r?.invoke}</p>
          </div>
        );
      })}

      {locked.length > 0 && (
        <p className="dnd-feature-choice__locked">
          Available later: {locked.map(r => `${r.name} (Lvl ${r.minLevel})`).join(', ')}
        </p>
      )}
    </div>
  );
}

const ASI_ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

// ── Inline build-choice: ASI vs Feat (per Ability Score Improvement) ────
function ASIChoice({ featId, classFeature, onUpdate }) {
  const cf = classFeature || {};
  const all = cf.asiChoices || {};
  const choice = all[featId] || { type: 'asi' };
  const set = (next) => onUpdate({ classFeature: { ...cf, asiChoices: { ...all, [featId]: next } } });

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__toggle">
        <button
          className={`dnd-feature-choice__toggle-btn ${choice.type === 'asi' ? 'dnd-feature-choice__toggle-btn--active' : ''}`}
          onClick={() => set({ type: 'asi', a1: choice.a1 || '', a2: choice.a2 || '' })}
        >Ability Score</button>
        <button
          className={`dnd-feature-choice__toggle-btn ${choice.type === 'feat' ? 'dnd-feature-choice__toggle-btn--active' : ''}`}
          onClick={() => set({ type: 'feat', name: choice.name || '', desc: choice.desc || '' })}
        >Feat</button>
      </div>

      {choice.type === 'feat' ? (
        <>
          <input
            className="dnd-field dnd-feature-choice__select"
            value={choice.name || ''}
            placeholder="Feat name"
            onChange={e => set({ ...choice, type: 'feat', name: e.target.value })}
          />
          <textarea
            className="dnd-field dnd-field--textarea"
            value={choice.desc || ''}
            placeholder="Feat description"
            rows={3}
            onChange={e => set({ ...choice, type: 'feat', desc: e.target.value })}
          />
        </>
      ) : (
        <div className="dnd-feature-choice__asi">
          <select className="dnd-field" value={choice.a1 || ''}
            onChange={e => set({ ...choice, type: 'asi', a1: e.target.value })}>
            <option value="">+2, or first +1…</option>
            {ASI_ABILITIES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="dnd-field" value={choice.a2 || ''}
            onChange={e => set({ ...choice, type: 'asi', a2: e.target.value })}>
            <option value="">second +1 (optional)</option>
            {ASI_ABILITIES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ── Inline build-choice: chosen language (DM-approved extra language) ───
function LanguageChoice({ racialFeature, onUpdate }) {
  const rf = racialFeature || {};
  return (
    <div className="dnd-feature-choice">
      <input
        className="dnd-field dnd-feature-choice__select"
        value={rf.language || ''}
        placeholder="Your chosen language (e.g. Elvish, Giant, Draconic…)"
        onChange={e => onUpdate({ racialFeature: { ...rf, language: e.target.value } })}
      />
    </div>
  );
}

// ── Inline build-choice: racial skill proficiency ──────────────────────
function SkillChoice({ racialFeature, onUpdate, options }) {
  const rf = racialFeature || {};
  return (
    <div className="dnd-feature-choice">
      <select
        className="dnd-field dnd-feature-choice__select"
        value={rf.skill || ''}
        onChange={e => onUpdate({ racialFeature: { ...rf, skill: e.target.value } })}
      >
        <option value="">— Choose a skill —</option>
        {(options || []).map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

export default function FeatureList({ features, editMode, onUpdate, level, className, subclass, classFeature, race, racialFeature }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const classFeatures = getClassFeatures(className, level);
  const subclassFeatures = getSubclassFeatures(subclass, level);
  const raceFeatures = getRaceFeatures(race);

  // ── Manual feature CRUD (homebrew / racial / custom) ──
  const handleChange = (index, field, value) => {
    const updated = features.map((f, i) => i === index ? { ...f, [field]: value } : f);
    onUpdate({ features: updated });
  };
  const addFeature = () => onUpdate({ features: [...features, { name: '', source: '', desc: '' }] });
  const removeFeature = (index) => onUpdate({ features: features.filter((_, i) => i !== index) });

  const renderChoice = (feat) => {
    if (feat.choice === 'fighting-style') return <FightingStyleChoice classFeature={classFeature} onUpdate={onUpdate} />;
    if (feat.choice === 'runes') return <RuneChoice classFeature={classFeature} onUpdate={onUpdate} level={level} />;
    if (feat.choice === 'language') return <LanguageChoice racialFeature={racialFeature} onUpdate={onUpdate} />;
    if (feat.choice === 'skill') return <SkillChoice racialFeature={racialFeature} onUpdate={onUpdate} options={feat.options} />;
    if (feat.choice === 'asi') return <ASIChoice featId={feat.id} classFeature={classFeature} onUpdate={onUpdate} />;
    return null;
  };

  // Read-only auto feature card (class / subclass progression)
  const renderAutoCard = (feat) => {
    const isLong = feat.desc && feat.desc.length > 160;
    const showFull = expanded[feat.id] || !isLong;
    return (
      <div key={feat.id} className="dnd-features__card dnd-features__card--auto">
        <div className="dnd-features__header">
          <span className="dnd-features__name">{feat.name}</span>
          {feat.level && <span className="dnd-features__level">Lvl {feat.level}</span>}
        </div>
        <p className="dnd-features__desc">
          {showFull ? feat.desc : `${feat.desc.slice(0, 160)}...`}
        </p>
        {isLong && (
          <button className="dnd-features__toggle" onClick={() => toggle(feat.id)}>
            {showFull ? 'Show less' : 'Show more'}
          </button>
        )}
        {feat.choice && renderChoice(feat)}
      </div>
    );
  };

  const renderManualCard = (feat, i) => {
    if (!editMode && feat.unlockLevel && level && feat.unlockLevel > level) return null;

    if (editMode) {
      return (
        <div key={i} className="dnd-features__card dnd-features__card--edit">
          <button className="dnd-features__remove" onClick={() => removeFeature(i)}>X</button>
          <input className="dnd-field" value={feat.name} placeholder="Feature name"
            onChange={e => handleChange(i, 'name', e.target.value)} />
          <input className="dnd-field" value={feat.source} placeholder="Source"
            onChange={e => handleChange(i, 'source', e.target.value)} />
          <textarea className="dnd-field dnd-field--textarea" value={feat.desc} placeholder="Description"
            onChange={e => handleChange(i, 'desc', e.target.value)} rows={3} />
          <div className="dnd-features__edit-meta">
            <label>Unlock Lvl: <input type="number" className="dnd-field dnd-field--sm" value={feat.unlockLevel || ''}
              onChange={e => handleChange(i, 'unlockLevel', parseInt(e.target.value) || null)} min={1} max={20} placeholder="—" /></label>
          </div>
        </div>
      );
    }

    const key = `m${i}`;
    const isLong = feat.desc && feat.desc.length > 100;
    const showFull = expanded[key] || !isLong;
    return (
      <div key={i} className="dnd-features__card">
        <div className="dnd-features__header">
          <span className="dnd-features__name">{feat.name}</span>
          {feat.source && (
            <span className="dnd-features__source"
              style={{ borderColor: sourceColors[feat.source] || 'var(--dnd-border)' }}>
              {feat.source}
            </span>
          )}
        </div>
        <p className="dnd-features__desc">
          {showFull ? feat.desc : `${feat.desc.slice(0, 100)}...`}
        </p>
        {isLong && (
          <button className="dnd-features__toggle" onClick={() => toggle(key)}>
            {showFull ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="dnd-features">
      <div className="dnd-features__zones">
        {/* Top-left: Class */}
        <section className="dnd-features__zone">
          <h3 className="dnd-features__zone-title">{className || 'Class'}</h3>
          <div className="dnd-features__grid">
            {classFeatures.map(renderAutoCard)}
            {classFeatures.length === 0 && (
              <p className="dnd-features__empty-note">No class features.</p>
            )}
          </div>
        </section>

        {/* Top-right: Subclass */}
        <section className="dnd-features__zone">
          <h3 className="dnd-features__zone-title">{subclass || 'Subclass'}</h3>
          <div className="dnd-features__grid">
            {subclassFeatures.map(renderAutoCard)}
            {subclassFeatures.length === 0 && (
              <p className="dnd-features__empty-note">No subclass features.</p>
            )}
          </div>
        </section>

        {/* Bottom-left: Racial */}
        <section className="dnd-features__zone">
          <h3 className="dnd-features__zone-title">{race || 'Racial'}</h3>
          <div className="dnd-features__grid">
            {raceFeatures.map(renderAutoCard)}
            {raceFeatures.length === 0 && (
              <p className="dnd-features__empty-note">Choose a race to see its traits.</p>
            )}
          </div>
        </section>

        {/* Bottom-right: Other (manual / homebrew) */}
        <section className="dnd-features__zone">
          <h3 className="dnd-features__zone-title">Other</h3>
          <div className="dnd-features__grid">
            {features.map(renderManualCard)}
            {features.length === 0 && !editMode && (
              <p className="dnd-features__empty-note">No custom features yet.</p>
            )}
            {editMode && (
              <button className="dnd-add-btn" onClick={addFeature}>+ Add Feature</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
