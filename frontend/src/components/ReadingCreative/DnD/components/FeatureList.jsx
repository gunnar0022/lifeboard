import { useState } from 'react';
import { ChevronRight, ChevronDown, Sword, PawPrint, BookOpen, Gem, Star, Check } from 'lucide-react';
import { getClassFeatures, getSubclassFeatures, getRaceFeatures, FIGHTING_STYLES, RUNE_LIST, maxRunesKnown, DRAGON_ANCESTRY, DRAGON_COLORS, PACT_BOONS, invocationsKnown, METAMAGIC_OPTIONS, metamagicKnown, MANEUVER_LIST, maneuversKnown, ARCANE_SHOT_LIST, arcaneShotsKnown, INFUSION_LIST, infusionsKnown } from '../classProgression';
import { SKILLS, abilityMod, proficiencyBonus } from '../dndUtils';
import { buildPrimalBeast, buildDrake, buildSteelDefender, PRIMAL_VARIANTS, DRAKE_ESSENCES } from '../rules/shared/companions';
import CompanionStatBlock from './ClassFeatures/CompanionStatBlock';

const EXPERTISE_OPTIONS = [...SKILLS.map(s => s.name), "Thieves' Tools"];

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
  'Battle Master': 'var(--dnd-class-fighter)',
  'Arcane Archer': 'var(--dnd-class-fighter)',
  'Banneret': 'var(--dnd-class-fighter)',
  'Echo Knight': 'var(--dnd-class-fighter)',
  'Draconic Bloodline': 'var(--dnd-class-sorcerer)',
  'Aberrant Mind': 'var(--dnd-class-sorcerer)',
  'Clockwork Soul': 'var(--dnd-class-sorcerer)',
  'Divine Soul': 'var(--dnd-class-sorcerer)',
  'Inquisitive': 'var(--dnd-class-rogue)',
  'Mastermind': 'var(--dnd-class-rogue)',
  'Phantom': 'var(--dnd-class-rogue)',
  'Scout': 'var(--dnd-class-rogue)',
  'Soulknife': 'var(--dnd-class-rogue)',
  'Arcane Trickster': 'var(--dnd-class-rogue)',
  'Thief': 'var(--dnd-class-rogue)',
  'Swashbuckler': 'var(--dnd-class-rogue)',
  'Assassin': 'var(--dnd-class-rogue)',
  'Path of the Ancestral Guardian': 'var(--dnd-class-barbarian)',
  'Circle of Stars': 'var(--dnd-class-druid)',
  'Circle of Spores': 'var(--dnd-class-druid)',
  'War Magic': 'var(--dnd-class-wizard)',
  'The Archfey': 'var(--dnd-class-warlock)',
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

// ── Inline build-choice: Battle Master maneuvers (capped pick from a fixed list) ──
function ManeuverChoice({ classFeature, onUpdate, level }) {
  const cf = classFeature || {};
  const known = cf.knownManeuvers || [];
  const max = maneuversKnown(level);
  const [picking, setPicking] = useState(false);

  const add = (name) => {
    if (known.includes(name) || known.length >= max) return;
    onUpdate({ classFeature: { ...cf, knownManeuvers: [...known, name] } });
    setPicking(false);
  };
  const remove = (name) => onUpdate({ classFeature: { ...cf, knownManeuvers: known.filter(m => m !== name) } });
  const available = MANEUVER_LIST.filter(m => !known.includes(m.name));

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__rune-head">
        <span className="dnd-feature-choice__count">{known.length}/{max} maneuvers known</span>
        {known.length < max && available.length > 0 && (
          <button className="dnd-feature-choice__add" onClick={() => setPicking(!picking)}>+ Maneuver</button>
        )}
      </div>
      {picking && (
        <div className="dnd-feature-choice__picker">
          {available.map(m => (
            <button key={m.name} className="dnd-feature-choice__pick" onClick={() => add(m.name)} title={m.desc}>{m.name}</button>
          ))}
        </div>
      )}
      {known.length === 0 && <p className="dnd-feature-choice__empty">No maneuvers chosen yet — click + Maneuver.</p>}
      {known.map(name => {
        const m = MANEUVER_LIST.find(x => x.name === name);
        return (
          <div key={name} className="dnd-feature-choice__rune">
            <div className="dnd-feature-choice__rune-top">
              <span className="dnd-feature-choice__rune-name">{name}</span>
              <button className="dnd-feature-choice__remove" onClick={() => remove(name)} title="Replace / remove maneuver">×</button>
            </div>
            <p className="dnd-feature-choice__rune-line">{m?.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline build-choice: Arcane Archer shot options (capped pick from a fixed list) ──
function ArcaneShotChoice({ classFeature, onUpdate, level }) {
  const cf = classFeature || {};
  const known = cf.knownArcaneShots || [];
  const max = arcaneShotsKnown(level);
  const [picking, setPicking] = useState(false);

  const add = (name) => {
    if (known.includes(name) || known.length >= max) return;
    onUpdate({ classFeature: { ...cf, knownArcaneShots: [...known, name] } });
    setPicking(false);
  };
  const remove = (name) => onUpdate({ classFeature: { ...cf, knownArcaneShots: known.filter(s => s !== name) } });
  const available = ARCANE_SHOT_LIST.filter(s => !known.includes(s.name));

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__rune-head">
        <span className="dnd-feature-choice__count">{known.length}/{max} shots known</span>
        {known.length < max && available.length > 0 && (
          <button className="dnd-feature-choice__add" onClick={() => setPicking(!picking)}>+ Arcane Shot</button>
        )}
      </div>
      {picking && (
        <div className="dnd-feature-choice__picker">
          {available.map(s => (
            <button key={s.name} className="dnd-feature-choice__pick" onClick={() => add(s.name)} title={s.desc}>{s.name}</button>
          ))}
        </div>
      )}
      {known.length === 0 && <p className="dnd-feature-choice__empty">No Arcane Shots chosen yet — click + Arcane Shot.</p>}
      {known.map(name => {
        const s = ARCANE_SHOT_LIST.find(x => x.name === name);
        return (
          <div key={name} className="dnd-feature-choice__rune">
            <div className="dnd-feature-choice__rune-top">
              <span className="dnd-feature-choice__rune-name">{name} <em className="dnd-feature-choice__pick-lvl">{s?.school}</em></span>
              <button className="dnd-feature-choice__remove" onClick={() => remove(name)} title="Replace / remove Arcane Shot">×</button>
            </div>
            <p className="dnd-feature-choice__rune-line">{s?.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline build-choice: Artificer Infusions (capped, level-gated pick) ──
// Stored as a list of infusion names in classFeature.knownInfusions; Replicate
// Magic Item may be taken more than once, so removal is by index.
function InfusionChoice({ classFeature, onUpdate, level }) {
  const cf = classFeature || {};
  const known = cf.knownInfusions || [];
  const max = infusionsKnown(level);
  const [picking, setPicking] = useState(false);

  const add = (name) => {
    if (known.length >= max) return;
    onUpdate({ classFeature: { ...cf, knownInfusions: [...known, name] } });
    setPicking(false);
  };
  const removeAt = (idx) => {
    const removed = known[idx];
    const nextKnown = known.filter((_, i) => i !== idx);
    // Drop any infused item that was using the now-forgotten infusion.
    const stillKnown = nextKnown.includes(removed);
    const infusedItems = stillKnown
      ? cf.infusedItems
      : (cf.infusedItems || []).filter(it => it.infusion !== removed);
    onUpdate({ classFeature: { ...cf, knownInfusions: nextKnown, infusedItems } });
  };

  const repeatable = (name) => name === 'Replicate Magic Item';
  const available = INFUSION_LIST.filter(
    inf => inf.prereq <= level && (repeatable(inf.name) || !known.includes(inf.name))
  );
  const locked = INFUSION_LIST.filter(inf => inf.prereq > level);

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__rune-head">
        <span className="dnd-feature-choice__count">{known.length}/{max} infusions known</span>
        {known.length < max && available.length > 0 && (
          <button className="dnd-feature-choice__add" onClick={() => setPicking(!picking)}>+ Infusion</button>
        )}
      </div>

      {picking && (
        <div className="dnd-feature-choice__picker">
          {available.map(inf => (
            <button key={inf.name} className="dnd-feature-choice__pick" onClick={() => add(inf.name)} title={inf.desc}>
              {inf.name}
              {inf.attune && <span className="dnd-feature-choice__pick-lvl"> ⚜</span>}
              {inf.prereq > 2 && <span className="dnd-feature-choice__pick-lvl"> Lvl {inf.prereq}+</span>}
            </button>
          ))}
        </div>
      )}

      {known.length === 0 && <p className="dnd-feature-choice__empty">No infusions learned yet — click + Infusion.</p>}

      {known.map((name, idx) => {
        const inf = INFUSION_LIST.find(x => x.name === name);
        return (
          <div key={`${name}-${idx}`} className="dnd-feature-choice__rune">
            <div className="dnd-feature-choice__rune-top">
              <span className="dnd-feature-choice__rune-name">
                {name}{inf?.attune && <em className="dnd-feature-choice__pick-lvl"> requires attunement</em>}
              </span>
              <button className="dnd-feature-choice__remove" onClick={() => removeAt(idx)} title="Replace / remove infusion">×</button>
            </div>
            <p className="dnd-feature-choice__rune-line"><strong>Item:</strong> {inf?.target}</p>
            <p className="dnd-feature-choice__rune-line">{inf?.desc}</p>
          </div>
        );
      })}

      {locked.length > 0 && (
        <p className="dnd-feature-choice__locked">
          Available later: {locked.map(inf => `${inf.name} (Lvl ${inf.prereq})`).join(', ')}
        </p>
      )}
    </div>
  );
}

// ── Inline build-choice: Warlock Pact Boon (dropdown) ──────────────────
const BOON_TAB_ICON = {
  'Pact of the Blade': <Sword size={14} />,
  'Pact of the Chain': <PawPrint size={14} />,
  'Pact of the Tome': <BookOpen size={14} />,
  'Pact of the Talisman': <Gem size={14} />,
  'Pact of the Star Chain (UA)': <Star size={14} />,
};
const boonShortName = (name) => name.replace(/^Pact of the\s+/, '');

function PactBoonChoice({ classFeature, onUpdate }) {
  const cf = classFeature || {};
  const selected = cf.pactBoon || '';
  const [active, setActive] = useState(selected || PACT_BOONS[0].name);
  const boon = PACT_BOONS.find(b => b.name === active) || PACT_BOONS[0];
  const isSelected = selected === boon.name;

  return (
    <div className="dnd-boon-picker">
      <div className="dnd-boon-tabs" role="tablist">
        {PACT_BOONS.map(b => (
          <button
            key={b.name}
            role="tab"
            aria-selected={active === b.name}
            className={`dnd-boon-tab ${active === b.name ? 'dnd-boon-tab--active' : ''} ${selected === b.name ? 'dnd-boon-tab--chosen' : ''}`}
            onClick={() => setActive(b.name)}
          >
            {BOON_TAB_ICON[b.name]}
            <span className="dnd-boon-tab__name">{boonShortName(b.name)}</span>
            {selected === b.name && <Check size={12} className="dnd-boon-tab__check" />}
          </button>
        ))}
      </div>

      <div className="dnd-boon-detail">
        <div className="dnd-boon-detail__head">
          <h5 className="dnd-boon-detail__title">{BOON_TAB_ICON[boon.name]} {boon.name}</h5>
          <button
            className={`dnd-boon-detail__select ${isSelected ? 'dnd-boon-detail__select--on' : ''}`}
            onClick={() => onUpdate({ classFeature: { ...cf, pactBoon: isSelected ? '' : boon.name } })}
          >
            {isSelected ? <><Check size={13} /> Selected</> : 'Choose this Pact'}
          </button>
        </div>
        <p className="dnd-boon-detail__tagline">{boon.tagline}</p>
        <ul className="dnd-boon-detail__points">
          {(boon.points || [boon.desc]).map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
    </div>
  );
}

// ── Inline build-choice: Giant's Power cantrip (druidcraft / thaumaturgy) ──
const GIANT_CANTRIPS = [
  { name: 'Druidcraft', desc: 'Predict weather, bloom a flower, sense nature, snuff or light a small flame, or make a harmless sensory effect.' },
  { name: 'Thaumaturgy', desc: 'Booming voice, flickering flames, tremors, an instantaneous sound, opening/closing doors, or altering eye appearance.' },
];
function GiantCantripChoice({ classFeature, onUpdate }) {
  const cf = classFeature || {};
  const selected = cf.giantCantrip || '';
  const cantrip = GIANT_CANTRIPS.find(c => c.name === selected);
  return (
    <div className="dnd-feature-choice">
      <select
        className="dnd-field dnd-feature-choice__select"
        value={selected}
        onChange={e => onUpdate({ classFeature: { ...cf, giantCantrip: e.target.value } })}
      >
        <option value="">— Choose a cantrip (WIS) —</option>
        {GIANT_CANTRIPS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>
      {cantrip && <p className="dnd-feature-choice__detail">{cantrip.desc}</p>}
    </div>
  );
}

// ── Inline build-choice: Eldritch Invocations (capped manual list) ──────
function InvocationsChoice({ classFeature, onUpdate, level }) {
  const cf = classFeature || {};
  const list = cf.invocations || [];
  const max = invocationsKnown(level);
  const setList = (next) => onUpdate({ classFeature: { ...cf, invocations: next } });
  const add = () => { if (list.length < max) setList([...list, { name: '', desc: '' }]); };
  const update = (i, field, value) => setList(list.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  const remove = (i) => setList(list.filter((_, idx) => idx !== i));

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__rune-head">
        <span className="dnd-feature-choice__count">{list.length}/{max} invocations known</span>
        {list.length < max && <button className="dnd-feature-choice__add" onClick={add}>+ Invocation</button>}
      </div>
      {list.length === 0 && <p className="dnd-feature-choice__empty">None chosen yet — click + Invocation.</p>}
      {list.map((inv, i) => (
        <div key={i} className="dnd-feature-choice__rune">
          <div className="dnd-feature-choice__rune-top">
            <input className="dnd-field dnd-feature-choice__select" value={inv.name} placeholder="Invocation name (e.g. Agonizing Blast)"
              onChange={e => update(i, 'name', e.target.value)} />
            <button className="dnd-feature-choice__remove" onClick={() => remove(i)} title="Remove">×</button>
          </div>
          <textarea className="dnd-field dnd-field--textarea" rows={2} value={inv.desc} placeholder="Effect"
            onChange={e => update(i, 'desc', e.target.value)} />
        </div>
      ))}
    </div>
  );
}

// ── Inline build-choice: Sorcerer Metamagic (capped pick from a fixed list) ──
function MetamagicChoice({ classFeature, onUpdate, level }) {
  const cf = classFeature || {};
  const known = cf.metamagic || [];
  const max = metamagicKnown(level);
  const [picking, setPicking] = useState(false);

  const add = (name) => {
    if (known.includes(name) || known.length >= max) return;
    onUpdate({ classFeature: { ...cf, metamagic: [...known, name] } });
    setPicking(false);
  };
  const remove = (name) => onUpdate({ classFeature: { ...cf, metamagic: known.filter(m => m !== name) } });
  const available = METAMAGIC_OPTIONS.filter(o => !known.includes(o.name));

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__rune-head">
        <span className="dnd-feature-choice__count">{known.length}/{max} metamagic known</span>
        {known.length < max && available.length > 0 && (
          <button className="dnd-feature-choice__add" onClick={() => setPicking(!picking)}>+ Metamagic</button>
        )}
      </div>
      {picking && (
        <div className="dnd-feature-choice__picker">
          {available.map(o => (
            <button key={o.name} className="dnd-feature-choice__pick" onClick={() => add(o.name)} title={o.desc}>
              {o.name}<span className="dnd-feature-choice__pick-lvl"> {o.cost}</span>
            </button>
          ))}
        </div>
      )}
      {known.length === 0 && <p className="dnd-feature-choice__empty">No Metamagic chosen yet — click + Metamagic.</p>}
      {known.map(name => {
        const o = METAMAGIC_OPTIONS.find(x => x.name === name);
        return (
          <div key={name} className="dnd-feature-choice__rune">
            <div className="dnd-feature-choice__rune-top">
              <span className="dnd-feature-choice__rune-name">{name} <span className="dnd-feature-choice__count">{o?.cost}</span></span>
              <button className="dnd-feature-choice__remove" onClick={() => remove(name)} title="Replace / remove">×</button>
            </div>
            <p className="dnd-feature-choice__rune-line">{o?.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline build-choice: pick one option from a fixed set (e.g. Hunter tiers) ──
// Stores the selection in classFeature[feat.group][feat.id]; shows the chosen
// option's full text. Reusable for any "choose one of the following" feature.
function OptionChoice({ feat, classFeature, onUpdate }) {
  const cf = classFeature || {};
  const group = feat.group || 'optionChoices';
  const map = cf[group] || {};
  const selected = map[feat.id] || '';
  const opt = (feat.options || []).find(o => o.name === selected);
  const choose = (name) =>
    onUpdate({ classFeature: { ...cf, [group]: { ...map, [feat.id]: selected === name ? '' : name } } });

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__picker">
        {(feat.options || []).map(o => (
          <button
            key={o.name}
            className={`dnd-feature-choice__pick ${selected === o.name ? 'dnd-feature-choice__pick--active' : ''}`}
            onClick={() => choose(o.name)}
          >{o.name}</button>
        ))}
      </div>
      {opt && <p className="dnd-feature-choice__detail">{opt.desc}</p>}
    </div>
  );
}

// ── Inline info: companion stat-block viewer (Beast Master / Drakewarden) ──
// Collapsible so the dense numbers stay tidy; a dropdown switches variant/essence.
// Read-only here — live HP & summoning live on the Combat tab.
const capWord = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function StatBlockPreview({ kind, level, abilities }) {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState(kind === 'drake' ? 'fire' : 'land');
  const lvl = level || 3;
  const pb = proficiencyBonus(lvl);
  const wisMod = abilityMod(abilities?.WIS || 10);
  const intMod = abilityMod(abilities?.INT || 10);

  let block, options;
  if (kind === 'steelDefender') {
    block = buildSteelDefender({ level: lvl, pb, spellAtk: pb + intMod, intMod, improved: lvl >= 15 });
    options = null;
  } else {
    const ctx = { level: lvl, pb, spellAtk: pb + wisMod, spellDC: 8 + pb + wisMod, wisMod };
    block = kind === 'drake' ? buildDrake(variant, ctx) : buildPrimalBeast(variant, ctx);
    options = kind === 'drake'
      ? DRAKE_ESSENCES.map(e => ({ id: e, label: `${capWord(e)} essence` }))
      : PRIMAL_VARIANTS.map(v => ({ id: v.id, label: v.label }));
  }

  return (
    <div className="dnd-feature-choice">
      <button className="dnd-features__toggle" onClick={() => setOpen(o => !o)}>
        {open ? 'Hide stat block' : 'View stat block'}
      </button>
      {open && (
        <>
          {options && (
            <select className="dnd-field dnd-feature-choice__select" value={variant}
              onChange={e => setVariant(e.target.value)}>
              {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          )}
          <CompanionStatBlock block={block} />
        </>
      )}
    </div>
  );
}

const ASI_ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

// ── Inline build-choice: Expertise (two doubled proficiencies) ─────────
function ExpertiseChoice({ featId, classFeature, onUpdate }) {
  const cf = classFeature || {};
  const all = cf.expertiseChoices || {};
  const choice = all[featId] || { a: '', b: '' };
  const set = (next) => onUpdate({ classFeature: { ...cf, expertiseChoices: { ...all, [featId]: next } } });

  const renderSelect = (key, label) => (
    <select className="dnd-field" value={choice[key] || ''}
      onChange={e => set({ ...choice, [key]: e.target.value })}>
      <option value="">{label}</option>
      {EXPERTISE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="dnd-feature-choice">
      <div className="dnd-feature-choice__asi">
        {renderSelect('a', 'Proficiency 1…')}
        {renderSelect('b', 'Proficiency 2…')}
      </div>
    </div>
  );
}

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

// ── Inline build-choice: Draconic Ancestry (dragon color) ──────────────
function DragonChoice({ racialFeature, onUpdate }) {
  const rf = racialFeature || {};
  const color = rf.dragonAncestry || '';
  const a = DRAGON_ANCESTRY[color];
  return (
    <div className="dnd-feature-choice">
      <select
        className="dnd-field dnd-feature-choice__select"
        value={color}
        onChange={e => onUpdate({ racialFeature: { ...rf, dragonAncestry: e.target.value } })}
      >
        <option value="">— Choose a dragon —</option>
        {DRAGON_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      {a && (
        <p className="dnd-feature-choice__detail">
          {color} dragon: <strong>{a.damage}</strong> damage · {a.area} ({a.save} save) · resist {a.damage}.
        </p>
      )}
    </div>
  );
}

// ── Inline build-choice: generic single-option (e.g. artisan's tools) ──
function ToolChoice({ racialFeature, onUpdate, options }) {
  const rf = racialFeature || {};
  return (
    <div className="dnd-feature-choice">
      <select
        className="dnd-field dnd-feature-choice__select"
        value={rf.tool || ''}
        onChange={e => onUpdate({ racialFeature: { ...rf, tool: e.target.value } })}
      >
        <option value="">— Choose tools —</option>
        {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Inline build-choice: Half-Elf Versatility (one of several traits) ──
function VersatilityChoice({ racialFeature, onUpdate, options }) {
  const rf = racialFeature || {};
  const sel = rf.versatility || '';
  const opt = (options || []).find(o => o.name === sel);
  return (
    <div className="dnd-feature-choice">
      <select
        className="dnd-field dnd-feature-choice__select"
        value={sel}
        onChange={e => onUpdate({ racialFeature: { ...rf, versatility: e.target.value } })}
      >
        <option value="">— Choose a versatility trait —</option>
        {(options || []).map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
      </select>
      {opt && <p className="dnd-feature-choice__detail">{opt.desc}</p>}
    </div>
  );
}

// ── Inline build-choice: racial spellcasting ability (INT/WIS/CHA) ─────
function SpellAbilityChoice({ racialFeature, onUpdate }) {
  const rf = racialFeature || {};
  return (
    <div className="dnd-feature-choice">
      <select
        className="dnd-field dnd-feature-choice__select"
        value={rf.spellAbility || ''}
        onChange={e => onUpdate({ racialFeature: { ...rf, spellAbility: e.target.value } })}
      >
        <option value="">— Spellcasting ability —</option>
        <option value="INT">Intelligence</option>
        <option value="WIS">Wisdom</option>
        <option value="CHA">Charisma</option>
      </select>
    </div>
  );
}

// ── Inline build-choice: chosen cantrip (free text) ────────────────────
function CantripChoice({ racialFeature, onUpdate }) {
  const rf = racialFeature || {};
  return (
    <div className="dnd-feature-choice">
      <input
        className="dnd-field dnd-feature-choice__select"
        value={rf.cantrip || ''}
        placeholder="Your chosen wizard cantrip (e.g. Fire Bolt, Minor Illusion…)"
        onChange={e => onUpdate({ racialFeature: { ...rf, cantrip: e.target.value } })}
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

// Render the inline build-choice UI for a feature (ASI/feat, fighting style,
// expertise, runes, etc.). Module-level so it can be shared by the Features tab
// and the Level Up reveal. `ctx` carries everything the choice editors need.
export function renderFeatureChoice(feat, { classFeature, racialFeature, onUpdate, level, abilities }) {
  if (feat.choice === 'fighting-style') return <FightingStyleChoice classFeature={classFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'runes') return <RuneChoice classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'maneuvers') return <ManeuverChoice classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'arcane-shots') return <ArcaneShotChoice classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'language') return <LanguageChoice racialFeature={racialFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'skill') return <SkillChoice racialFeature={racialFeature} onUpdate={onUpdate} options={feat.options} />;
  if (feat.choice === 'dragon') return <DragonChoice racialFeature={racialFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'tool') return <ToolChoice racialFeature={racialFeature} onUpdate={onUpdate} options={feat.options} />;
  if (feat.choice === 'cantrip') return <CantripChoice racialFeature={racialFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'giant-cantrip') return <GiantCantripChoice classFeature={classFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'versatility') return <VersatilityChoice racialFeature={racialFeature} onUpdate={onUpdate} options={feat.options} />;
  if (feat.choice === 'spellAbility') return <SpellAbilityChoice racialFeature={racialFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'asi') return <ASIChoice featId={feat.id} classFeature={classFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'expertise') return <ExpertiseChoice featId={feat.id} classFeature={classFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'pact-boon') return <PactBoonChoice classFeature={classFeature} onUpdate={onUpdate} />;
  if (feat.choice === 'invocations') return <InvocationsChoice classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'metamagic') return <MetamagicChoice classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'infusions') return <InfusionChoice classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'option') return <OptionChoice feat={feat} classFeature={classFeature} onUpdate={onUpdate} />;
  return null;
}

// Read-only auto feature card (class / subclass / racial progression). Collapsed
// to a clickable title row by default; unfurls the full description and any build
// choice / stat block. Self-contained open state so it's reusable anywhere.
export function AutoFeatureCard({ feat, classFeature, racialFeature, onUpdate, level, abilities }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`dnd-features__card dnd-features__card--auto ${open ? 'dnd-features__card--open' : ''}`}>
      <button className="dnd-features__header dnd-features__header--toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="dnd-features__chev">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        <span className="dnd-features__name">{feat.name}</span>
        {feat.level && <span className="dnd-features__level">Lvl {feat.level}</span>}
      </button>
      {open && (
        <>
          <p className="dnd-features__desc">{feat.desc}</p>
          {feat.choice && renderFeatureChoice(feat, { classFeature, racialFeature, onUpdate, level, abilities })}
          {feat.statBlock && <StatBlockPreview kind={feat.statBlock} level={level} abilities={abilities} />}
        </>
      )}
    </div>
  );
}

export default function FeatureList({ features, editMode, onUpdate, level, className, subclass, classFeature, race, subrace, racialFeature, abilities }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const classFeatures = getClassFeatures(className, level);
  const subclassFeatures = getSubclassFeatures(subclass, level);
  const raceFeatures = getRaceFeatures(race, subrace);

  // ── Manual feature CRUD (homebrew / racial / custom) ──
  const handleChange = (index, field, value) => {
    const updated = features.map((f, i) => i === index ? { ...f, [field]: value } : f);
    onUpdate({ features: updated });
  };
  const addFeature = () => onUpdate({ features: [...features, { name: '', source: '', desc: '' }] });
  const removeFeature = (index) => onUpdate({ features: features.filter((_, i) => i !== index) });

  const renderAutoCard = (feat) => (
    <AutoFeatureCard
      key={feat.id}
      feat={feat}
      classFeature={classFeature}
      racialFeature={racialFeature}
      onUpdate={onUpdate}
      level={level}
      abilities={abilities}
    />
  );

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
    const open = !!expanded[key];
    return (
      <div key={i} className={`dnd-features__card ${open ? 'dnd-features__card--open' : ''}`}>
        <button className="dnd-features__header dnd-features__header--toggle" onClick={() => toggle(key)} aria-expanded={open}>
          <span className="dnd-features__chev">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          <span className="dnd-features__name">{feat.name}</span>
          {feat.source && (
            <span className="dnd-features__source"
              style={{ borderColor: sourceColors[feat.source] || 'var(--dnd-border)' }}>
              {feat.source}
            </span>
          )}
        </button>
        {open && <p className="dnd-features__desc">{feat.desc}</p>}
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
          <h3 className="dnd-features__zone-title">{race ? (subrace ? `${race} · ${subrace}` : race) : 'Racial'}</h3>
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
