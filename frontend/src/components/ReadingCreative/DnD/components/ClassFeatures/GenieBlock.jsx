import { Lamp, Sparkles, Wind, Wand2, ShieldHalf } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { UsePool, OnceToggle } from './trackers';

/**
 * The Genie — Combat tab. Everything keys off the chosen kind: pick dao / djinni /
 * efreeti / marid and the block recolors its element, the Genie's Wrath damage
 * type, and the Elemental Gift resistance. The Genie's Vessel is a stat-bearing
 * hero card (Bottled Respite once / long rest, Sanctuary Vessel folded in at 10th),
 * Elemental Gift flight is a PB pool, and Limited Wish is a 1d4-long-rest action.
 * State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-warlock)';
const KINDS = {
  dao:     { label: 'Dao',     element: 'Earth', dmg: 'bludgeoning' },
  djinni:  { label: 'Djinni',  element: 'Air',   dmg: 'thunder' },
  efreeti: { label: 'Efreeti', element: 'Fire',  dmg: 'fire' },
  marid:   { label: 'Marid',   element: 'Water', dmg: 'cold' },
};

export default function GenieBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const saveDC = 8 + pb + chaMod;
  const vesselHp = level + pb;
  const respiteHours = pb * 2;

  const kind = cf.genieKind || null;
  const k = kind ? KINDS[kind] : null;

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const flightUsed = cf.genieFlightUsed || 0;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Kind picker */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Genie's Kind</h4>
          {k && <span className="dnd-warmagic__chip">{k.element} · {k.dmg}</span>}
        </div>
        <div className="dnd-warmagic__pick">
          {Object.entries(KINDS).map(([key, v]) => (
            <button key={key}
              className={`dnd-warmagic__pick-btn ${kind === key ? 'dnd-warmagic__pick-btn--active' : ''}`}
              onClick={() => patch({ genieKind: kind === key ? null : key })}>{v.label}</button>
          ))}
        </div>
        {!k && <p className="dnd-warmagic__note">Choose your patron's kind to set your element, Genie's Wrath damage, and Elemental Gift resistance.</p>}
      </div>

      {/* Genie's Vessel — signature hero card */}
      <div className="dnd-sig dnd-sig--locked" style={{ '--block-accent': ACCENT }}>
        <div className="dnd-sig__token"><Lamp size={20} /></div>
        <div className="dnd-sig__body">
          <span className="dnd-sig__title"><Lamp size={13} /> Genie's Vessel</span>
          <div className="dnd-companion__topline">
            <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">AC</span><span className="dnd-companion__stat-val">{saveDC}</span></div>
            <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">HP</span><span className="dnd-companion__stat-val">{vesselHp}</span></div>
            <div className="dnd-companion__stat dnd-companion__stat--wide">
              <span className="dnd-companion__stat-lbl">Immune</span>
              <span className="dnd-companion__stat-val dnd-companion__stat-val--text">poison · psychic</span>
            </div>
          </div>
          <span className="dnd-sig__desc">
            <strong>Genie's Wrath</strong> — once per turn when you hit, deal <strong>+{pb} {k ? k.dmg : 'elemental'}</strong> damage{k ? '' : ' (pick a kind above)'}.
          </span>
        </div>
      </div>

      {/* Bottled Respite (+ Sanctuary Vessel at 10th) */}
      <OnceToggle
        icon={<Lamp size={13} />} title="Bottled Respite" rest="long rest"
        used={!!cf.bottledRespiteUsed}
        note={<>Action: vanish into the vessel for up to <strong>{respiteHours} hours</strong>.{level >= 10 ? <> <strong>Sanctuary Vessel:</strong> draw up to 5 willing creatures in; 10 min inside grants a short rest (+{pb} HP per Hit Die spent).</> : ''}</>}
        onToggle={() => patch({ bottledRespiteUsed: !cf.bottledRespiteUsed })}
      />

      {/* Elemental Gift — resistance + flight */}
      {level >= 6 && (
        <>
          <div className="dnd-warmagic__reminders">
            <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
              <ShieldHalf size={12} />
              <span><strong>Elemental Gift</strong> — resistance to {k ? <strong>{k.dmg}</strong> : 'your kind\'s'} damage.</span>
            </div>
          </div>
          <UsePool
            icon={<Wind size={13} />} title="Elemental Flight" used={flightUsed} max={pb}
            note="Bonus action: flying speed 30 ft (hover) for 10 minutes. Long rest."
            onUse={() => patch({ genieFlightUsed: Math.min(pb, flightUsed + 1) })}
            onRestore={() => patch({ genieFlightUsed: Math.max(0, flightUsed - 1) })}
          />
        </>
      )}

      {/* Limited Wish — 1d4 long rests */}
      {level >= 14 && (
        <OnceToggle
          icon={<Wand2 size={13} />} title="Limited Wish" rest="1d4 long rests"
          used={!!cf.limitedWishUsed}
          note="Action: gain the effect of any spell of 6th level or lower (1-action cast) from any class list — no components needed. Reset manually after 1d4 long rests."
          onToggle={() => patch({ limitedWishUsed: !cf.limitedWishUsed })}
        />
      )}
    </div>
  );
}
