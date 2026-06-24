import { abilityMod, formatMod } from '../../dndUtils';

/**
 * CompanionStatBlock — presentational renderer for a normalized companion stat
 * block (built in rules/shared/companions.js). Used read-only on the Features
 * tab and, with a live HP tracker injected via `hpSlot`, inside the Combat-tab
 * CompanionCard. Pure layout: it never owns state.
 */
const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function CompanionStatBlock({ block, accent = 'var(--dnd-class-ranger)', hpSlot = null }) {
  if (!block) return null;
  return (
    <div className="dnd-companion__sb" style={{ '--block-accent': accent }}>
      <div className="dnd-companion__meta">{block.size} {block.type}</div>

      <div className="dnd-companion__topline">
        <div className="dnd-companion__stat">
          <span className="dnd-companion__stat-lbl">AC</span>
          <span className="dnd-companion__stat-val">{block.ac}</span>
        </div>
        {hpSlot != null ? hpSlot : (
          <div className="dnd-companion__stat">
            <span className="dnd-companion__stat-lbl">HP</span>
            <span className="dnd-companion__stat-val">{block.hpMax}</span>
          </div>
        )}
        <div className="dnd-companion__stat dnd-companion__stat--wide">
          <span className="dnd-companion__stat-lbl">Speed</span>
          <span className="dnd-companion__stat-val dnd-companion__stat-val--text">{block.speed}</span>
        </div>
      </div>

      <div className="dnd-companion__abilities">
        {ABILITIES.map(a => (
          <div key={a} className="dnd-companion__ability">
            <span className="dnd-companion__ability-lbl">{a}</span>
            <span className="dnd-companion__ability-score">{block.abilities[a]}</span>
            <span className="dnd-companion__ability-mod">{formatMod(abilityMod(block.abilities[a]))}</span>
          </div>
        ))}
      </div>

      <div className="dnd-companion__lines">
        {block.saves && <p className="dnd-companion__line"><strong>Saving Throws</strong> {block.saves}</p>}
        {block.immunities && <p className="dnd-companion__line"><strong>Damage Immunities</strong> {block.immunities}</p>}
        <p className="dnd-companion__line"><strong>Senses</strong> {block.senses}</p>
        <p className="dnd-companion__line"><strong>Hit Dice</strong> {block.hitDiceCount}{block.hitDie} · spendable on a short rest</p>
      </div>

      {block.traits.length > 0 && (
        <div className="dnd-companion__group">
          {block.traits.map(t => (
            <p key={t.name} className="dnd-companion__trait"><strong>{t.name}.</strong> {t.desc}</p>
          ))}
        </div>
      )}

      {block.actions.length > 0 && (
        <div className="dnd-companion__group">
          <h5 className="dnd-companion__group-title">Actions</h5>
          {block.actions.map(a => (
            <div key={a.name} className="dnd-companion__action">
              <div className="dnd-companion__action-head">
                <span className="dnd-companion__action-name">{a.name}</span>
                {a.toHit && <span className="dnd-companion__hit">{a.toHit} to hit</span>}
              </div>
              {a.damage && <div className="dnd-companion__damage">{a.damage}</div>}
              {a.desc && <p className="dnd-companion__action-desc">{a.desc}</p>}
            </div>
          ))}
        </div>
      )}

      {block.reactions.length > 0 && (
        <div className="dnd-companion__group">
          <h5 className="dnd-companion__group-title">Reactions</h5>
          {block.reactions.map(r => (
            <p key={r.name} className="dnd-companion__trait"><strong>{r.name}.</strong> {r.desc}</p>
          ))}
        </div>
      )}
    </div>
  );
}
