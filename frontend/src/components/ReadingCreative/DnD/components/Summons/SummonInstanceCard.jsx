import { useState } from 'react';
import { Heart, Trash2, Pencil, Check, Skull, Plus, X, Sparkles } from 'lucide-react';
import CompanionStatBlock from '../ClassFeatures/CompanionStatBlock';
import SummonForm from './SummonForm';
import { toStatBlock, applyHpDelta, ALLEGIANCES } from '../../rules/shared/summons';

const COMMON_CONDITIONS = [
  'Blinded', 'Charmed', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible',
  'Paralyzed', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
];

const ALLEGIANCE_ACCENT = {
  friendly: 'var(--dnd-positive, #4ea86b)',
  neutral: 'var(--dnd-class-ranger, #c9a96e)',
  hostile: 'var(--dnd-negative, #c0504d)',
};

/**
 * One live summoned creature: the shared stat block plus everything you track at
 * the table — hit points (temp-first damage/heal), conditions, allegiance, a
 * concentration link, a dying/dead flag, free notes, and inline stat editing of
 * its snapshot. Owns nothing; the parent SummonsPanel persists via onChange.
 */
export default function SummonInstanceCard({
  instance, onChange, onRemove, holdsConcentration, onClaimConcentration, onDropConcentration,
}) {
  const [editing, setEditing] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  const block = instance.block || {};
  const sb = toStatBlock(block);
  const accent = ALLEGIANCE_ACCENT[instance.allegiance] || ALLEGIANCE_ACCENT.friendly;
  const needsConc = !!block.requires_concentration;

  const hpMax = sb.hpMax || 1;
  const hpCurrent = Math.min(instance.hpCurrent ?? hpMax, hpMax);
  const hpTemp = instance.hpTemp || 0;
  const hpPct = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 0;
  const barColor = hpPct > 60 ? 'var(--dnd-hp-healthy)' : hpPct > 25 ? 'var(--dnd-hp-wounded)' : 'var(--dnd-hp-critical)';

  const patch = (fields) => onChange({ ...instance, ...fields });
  const adjustHp = (delta) => patch(applyHpDelta({ hpCurrent, hpTemp, hpMax }, delta));

  const conditions = instance.conditions || [];
  const addCondition = (c) => { if (!conditions.includes(c)) patch({ conditions: [...conditions, c] }); };
  const removeCondition = (c) => patch({ conditions: conditions.filter(x => x !== c) });

  const hpSlot = (
    <div className="dnd-companion__hp">
      <div className="dnd-companion__hp-head">
        <span className="dnd-companion__stat-lbl"><Heart size={11} /> HP</span>
        <span className="dnd-companion__hp-num">
          {hpCurrent}<span className="dnd-companion__hp-max">/{hpMax}</span>
          {hpTemp > 0 && <span className="dnd-companion__hp-temp-num"> +{hpTemp}</span>}
        </span>
      </div>
      <div className="dnd-companion__hp-bar">
        <div className="dnd-companion__hp-fill" style={{ width: `${Math.min(100, hpPct)}%`, background: barColor }} />
      </div>
      <div className="dnd-companion__hp-btns">
        <button onClick={() => adjustHp(-5)}>−5</button>
        <button onClick={() => adjustHp(-1)}>−1</button>
        <button onClick={() => adjustHp(1)}>+1</button>
        <button onClick={() => adjustHp(5)}>+5</button>
        <input type="number" className="dnd-companion__temp-input" value={hpTemp} title="Temp HP"
          onChange={e => patch({ hpTemp: Math.max(0, parseInt(e.target.value) || 0) })} />
      </div>
    </div>
  );

  return (
    <div className={`dnd-summon-card ${instance.dead ? 'dnd-summon-card--dead' : ''}`}
      style={{ '--block-accent': accent }}>
      {/* Header */}
      <div className="dnd-summon-card__header">
        {editing ? (
          <input className="dnd-field dnd-summon-card__name" value={instance.name}
            placeholder="Name this creature…" onChange={e => patch({ name: e.target.value })} />
        ) : (
          <span className="dnd-summon-card__name dnd-summon-card__name--static">
            {instance.name || 'Unnamed summon'}
          </span>
        )}
        <select className="dnd-summon-card__allegiance" value={instance.allegiance}
          onChange={e => patch({ allegiance: e.target.value })}
          style={{ color: accent, borderColor: accent }}>
          {ALLEGIANCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <div className="dnd-summon-card__header-btns">
          <button className={`dnd-summon-card__icon-btn ${editing ? 'dnd-summon-card__icon-btn--on' : ''}`}
            onClick={() => setEditing(e => !e)} title={editing ? 'Done editing' : 'Edit stats'}>
            {editing ? <Check size={14} /> : <Pencil size={14} />}
          </button>
          <button className={`dnd-summon-card__icon-btn ${instance.dead ? 'dnd-summon-card__icon-btn--on' : ''}`}
            onClick={() => patch({ dead: !instance.dead })} title={instance.dead ? 'Revive' : 'Mark dead'}>
            <Skull size={14} />
          </button>
          <button className="dnd-summon-card__icon-btn dnd-summon-card__icon-btn--danger"
            onClick={onRemove} title="Dismiss summon"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Subtitle */}
      <div className="dnd-summon-card__sub">
        {block.source_spell && <span>{block.source_spell}</span>}
        {block.cr && <span>CR {block.cr}</span>}
        {instance.templateId == null && <span className="dnd-summon-card__custom-tag">custom</span>}
      </div>

      {/* Concentration link */}
      {needsConc && (
        holdsConcentration ? (
          <button className="dnd-summon-card__conc dnd-summon-card__conc--active" onClick={onDropConcentration}>
            <Sparkles size={12} /> Concentrating — click to drop
          </button>
        ) : (
          <button className="dnd-summon-card__conc" onClick={() => onClaimConcentration(instance)}>
            <Sparkles size={12} /> Requires concentration — claim it
          </button>
        )
      )}

      {/* Editor or stat block */}
      {editing ? (
        <div className="dnd-summon-card__editor">
          <SummonForm draft={block} onChange={(b) => patch({ block: b })} />
        </div>
      ) : (
        <CompanionStatBlock block={sb} accent={accent} hpSlot={hpSlot} wide />
      )}

      {/* Conditions */}
      <div className="dnd-summon-card__conditions">
        {conditions.map(c => (
          <span key={c} className="dnd-summon-card__cond" onClick={() => removeCondition(c)}>
            {c} <X size={9} />
          </span>
        ))}
        <div className="dnd-summon-card__cond-add-wrap">
          <button className="dnd-summon-card__cond-add" onClick={() => setShowConditions(s => !s)}>
            <Plus size={11} /> Condition
          </button>
          {showConditions && (
            <div className="dnd-summon-card__cond-picker">
              {COMMON_CONDITIONS.filter(c => !conditions.includes(c)).map(c => (
                <button key={c} onClick={() => { addCondition(c); setShowConditions(false); }}>{c}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <textarea className="dnd-field dnd-field--textarea dnd-summon-card__notes" rows={2}
        value={instance.notes || ''} placeholder="Notes (position, orders, duration remaining…)"
        onChange={e => patch({ notes: e.target.value })} />
    </div>
  );
}
