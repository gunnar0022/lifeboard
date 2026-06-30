import { useState } from 'react';
import { ChevronRight, ChevronDown, Sword, PawPrint, BookOpen, Gem, Star, Check } from 'lucide-react';
import { getClassFeatures, getSubclassFeatures, getRaceFeatures, FIGHTING_STYLES, DRAGON_ANCESTRY, DRAGON_COLORS, PACT_BOONS } from '../classProgression';
import { SKILLS, abilityMod, proficiencyBonus } from '../dndUtils';
import { buildPrimalBeast, buildDrake, buildSteelDefender, PRIMAL_VARIANTS, DRAKE_ESSENCES } from '../rules/shared/companions';
import CompanionStatBlock from './ClassFeatures/CompanionStatBlock';
import InvocationPicker from './OptionPicker/InvocationPicker';
import ListPicker from './OptionPicker/ListPicker';
import FeatPicker from './OptionPicker/FeatPicker';

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
          onClick={() => set(choice.type === 'asi' ? choice : { type: 'asi', a1: '', a2: '' })}
        >Ability Score</button>
        <button
          className={`dnd-feature-choice__toggle-btn ${choice.type === 'feat' ? 'dnd-feature-choice__toggle-btn--active' : ''}`}
          onClick={() => set(choice.type === 'feat' ? choice : { type: 'feat' })}
        >Feat</button>
      </div>

      {choice.type === 'feat' ? (
        <FeatPicker
          value={choice.featId != null || choice.name ? choice : null}
          onChange={(f) => set(f ? { type: 'feat', ...f } : { type: 'feat' })}
        />
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
  if (feat.choice === 'runes') return <ListPicker configKey="runes" classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'maneuvers') return <ListPicker configKey="maneuvers" classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'arcane-shots') return <ListPicker configKey="arcaneShots" classFeature={classFeature} onUpdate={onUpdate} level={level} />;
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
  if (feat.choice === 'invocations') return <InvocationPicker classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'metamagic') return <ListPicker configKey="metamagic" classFeature={classFeature} onUpdate={onUpdate} level={level} />;
  if (feat.choice === 'infusions') return <ListPicker configKey="infusions" classFeature={classFeature} onUpdate={onUpdate} level={level} />;
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
