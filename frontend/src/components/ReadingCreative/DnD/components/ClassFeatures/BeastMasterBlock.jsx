import { PawPrint, Sparkles, Swords, Wand2, Heart } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { buildPrimalBeast, PRIMAL_VARIANTS } from '../../rules/shared/companions';
import CompanionCard from './CompanionCard';

/**
 * Beast Master — Combat tab. Two companion paths share one HP-tracked card:
 *  • Primal Companion — three computed stat blocks (Land / Sea / Sky), all
 *    scaling with ranger level & proficiency bonus via the shared builder.
 *  • Classic ranger's beast — a freeform creature (pick any CR 1/4 beast) kept
 *    as an editable mini stat block, HP defaulting to 4 × ranger level.
 * Exceptional Training / Bestial Fury / Share Spells ride below as level-gated
 * reminders. Companion live state lives in classFeature.companion.
 */
const ACCENT = 'var(--dnd-class-ranger)';

// Editable card for the classic, player-chosen beast.
function ClassicBeast({ character, onUpdate, level, pb }) {
  const cf = character.classFeature || {};
  const comp = cf.companion || {};
  const patch = (fields) => onUpdate({ classFeature: { ...cf, companion: { ...comp, ...fields } } });

  const hpMax = comp.hpMaxClassic ?? 4 * level;
  const hpCurrent = Math.min(comp.hpCurrent ?? hpMax, hpMax);
  const hpPct = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 0;
  const barColor = hpPct > 60 ? 'var(--dnd-hp-healthy)' : hpPct > 25 ? 'var(--dnd-hp-wounded)' : 'var(--dnd-hp-critical)';
  const adjustHp = (d) => patch({ hpCurrent: Math.max(0, Math.min(hpMax, hpCurrent + d)) });

  return (
    <div className="dnd-companion" style={{ '--block-accent': ACCENT }}>
      <input className="dnd-field dnd-companion__name" value={comp.name || ''} placeholder="Name your beast…"
        onChange={e => patch({ name: e.target.value })} />

      <div className="dnd-companion__classic-grid">
        <label className="dnd-companion__field"><span>Type</span>
          <input className="dnd-field dnd-field--sm" value={comp.typeClassic || ''} placeholder="e.g. Wolf"
            onChange={e => patch({ typeClassic: e.target.value })} /></label>
        <label className="dnd-companion__field"><span>AC</span>
          <input type="number" className="dnd-field dnd-field--sm" value={comp.acClassic ?? ''} placeholder="—"
            onChange={e => patch({ acClassic: parseInt(e.target.value) || 0 })} /></label>
        <label className="dnd-companion__field"><span>Speed</span>
          <input className="dnd-field dnd-field--sm" value={comp.speedClassic || ''} placeholder="40 ft."
            onChange={e => patch({ speedClassic: e.target.value })} /></label>
      </div>

      <div className="dnd-companion__hp">
        <div className="dnd-companion__hp-head">
          <span className="dnd-companion__stat-lbl"><Heart size={11} /> HP</span>
          <span className="dnd-companion__hp-num">
            {hpCurrent}<span className="dnd-companion__hp-max">/</span>
            <input type="number" className="dnd-companion__hp-max-input" value={hpMax}
              onChange={e => patch({ hpMaxClassic: Math.max(1, parseInt(e.target.value) || 1) })} />
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
        </div>
      </div>

      <label className="dnd-companion__field dnd-companion__field--full"><span>Attack</span>
        <input className="dnd-field dnd-field--sm" value={comp.atkClassic || ''} placeholder="e.g. Bite +X, 1dY + Z piercing"
          onChange={e => patch({ atkClassic: e.target.value })} /></label>

      <p className="dnd-companion__hint">
        HP max = max(beast's normal max, 4 × level = <strong>{4 * level}</strong>). Add your proficiency bonus
        (<strong>+{pb}</strong>) to the beast's AC, attack &amp; damage rolls, and any proficient saves &amp; skills.
      </p>
    </div>
  );
}

export default function BeastMasterBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const comp = cf.companion || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const ctx = { level, pb, spellAtk: pb + wisMod, spellDC: 8 + pb + wisMod, wisMod };

  const mode = comp.mode || 'primal';
  const variant = comp.variant || 'land';
  const setComp = (fields) => onUpdate({ classFeature: { ...cf, companion: { ...comp, ...fields } } });

  const primalBlock = buildPrimalBeast(variant, ctx);

  const variantPicker = (
    <div className="dnd-warmagic__pick dnd-companion__pick">
      {PRIMAL_VARIANTS.map(v => (
        <button key={v.id}
          className={`dnd-warmagic__pick-btn ${variant === v.id ? 'dnd-warmagic__pick-btn--active' : ''}`}
          onClick={() => setComp({ variant: v.id })}>{v.label.replace('Beast of the ', '')}</button>
      ))}
    </div>
  );

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Companion path toggle */}
      <div className="dnd-feature-choice__toggle dnd-companion__modes">
        <button className={`dnd-feature-choice__toggle-btn ${mode === 'primal' ? 'dnd-feature-choice__toggle-btn--active' : ''}`}
          onClick={() => setComp({ mode: 'primal' })}>Primal Companion</button>
        <button className={`dnd-feature-choice__toggle-btn ${mode === 'classic' ? 'dnd-feature-choice__toggle-btn--active' : ''}`}
          onClick={() => setComp({ mode: 'classic' })}>Classic Beast</button>
      </div>

      {mode === 'primal' ? (
        <CompanionCard block={primalBlock} character={character} onUpdate={onUpdate} accent={ACCENT}
          title="Primal Companion" icon={<PawPrint size={14} />} headerExtra={variantPicker} />
      ) : (
        <ClassicBeast character={character} onUpdate={onUpdate} level={level} pb={pb} />
      )}

      <div className="dnd-warmagic__section">
        <span className="dnd-warmagic__note">
          Acts on your initiative. Command <strong>Attack / Dash / Disengage / Help</strong> with your action (else it Dodges);
          move it for free on your turn. With Extra Attack, you also make one weapon attack when you command its Attack.
        </span>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 7 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Exceptional Training</strong> — on a turn it doesn't attack, bonus action to command Dash/Disengage/Help; its attacks count as magical.</span>
          </div>
        )}
        {level >= 11 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Swords size={12} />
            <span><strong>Bestial Fury</strong> — when you command the Attack action, the beast makes <strong>two</strong> attacks (or its Multiattack).</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder">
            <Wand2 size={12} />
            <span><strong>Share Spells</strong> — a spell you cast on yourself can also affect the beast if it's within 30 ft.</span>
          </div>
        )}
      </div>
    </div>
  );
}
