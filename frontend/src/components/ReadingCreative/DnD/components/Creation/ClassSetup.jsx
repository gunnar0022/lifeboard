import { Shield, Check } from 'lucide-react';
import { SKILLS } from '../../dndUtils';
import { CLASS_CREATION } from '../../rules/classes/creation';
import { classSetupPatch } from './creationUtils';

const ALL_SKILLS = SKILLS.map(s => s.name);
const joinOr = (list) => (list && list.length ? list.join(', ') : '—');

/**
 * Level-1 class mechanics inside the Class step: fixed saving throws + armor/
 * weapon/tool proficiencies (shown for reference, applied automatically), a
 * skill-choice picker, and one picker per starting-equipment choice group.
 * Every change re-derives the class grants onto the draft via classSetupPatch.
 */
export default function ClassSetup({ draft, setDraft }) {
  const className = draft.meta.className;
  const c = CLASS_CREATION[className];
  if (!c) return null;

  const chosenSkills = draft._classSkills || [];
  const equip = draft._classEquip || {};
  const skillOptions = c.skillChoices.from === 'any' ? ALL_SKILLS : c.skillChoices.from;
  const count = c.skillChoices.count;
  const atCap = chosenSkills.length >= count;

  const toggleSkill = (name) => {
    let next;
    if (chosenSkills.includes(name)) next = chosenSkills.filter(s => s !== name);
    else if (atCap) return;
    else next = [...chosenSkills, name];
    setDraft(classSetupPatch(draft, className, next, equip));
  };

  const setEquip = (gi, optIdx) => {
    setDraft(classSetupPatch(draft, className, chosenSkills, { ...equip, [gi]: optIdx }));
  };

  return (
    <div className="crt-classsetup">
      <h4 className="crt-subhead"><Shield size={15} /> Class setup — level 1</h4>

      <div className="crt-classsetup__profs">
        <div><span className="crt-classsetup__lbl">Saving throws</span> {c.savingThrows.join(', ')}</div>
        <div><span className="crt-classsetup__lbl">Armor</span> {joinOr(c.armor)}</div>
        <div><span className="crt-classsetup__lbl">Weapons</span> {joinOr(c.weapons)}</div>
        {c.tools.length > 0 && <div><span className="crt-classsetup__lbl">Tools</span> {c.tools.join(', ')}</div>}
      </div>

      <div className="crt-classsetup__block">
        <span className="crt-classsetup__lbl">
          Skills — choose {count} <em className="crt-classsetup__count">{chosenSkills.length}/{count}</em>
        </span>
        <div className="crt-chip-picker">
          {skillOptions.map(name => {
            const on = chosenSkills.includes(name);
            return (
              <button
                key={name}
                className={`crt-chip ${on ? 'crt-chip--on' : ''}`}
                onClick={() => toggleSkill(name)}
                disabled={!on && atCap}
              >
                {on && <Check size={12} />} {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="crt-classsetup__block">
        <span className="crt-classsetup__lbl">Starting equipment</span>
        {c.startingEquipment.map((grp, gi) => (
          <div key={gi} className="crt-equip-group">
            {grp.kind === 'fixed' ? (
              <div className="crt-equip-fixed">Granted: {grp.items.join(', ')}</div>
            ) : (
              <>
                <span className="crt-equip-group__label">{grp.label}</span>
                <div className="crt-chip-picker">
                  {grp.options.map((opt, oi) => {
                    const on = (equip[gi] ?? 0) === oi;
                    return (
                      <button
                        key={oi}
                        className={`crt-chip ${on ? 'crt-chip--on' : ''}`}
                        onClick={() => setEquip(gi, oi)}
                      >
                        {on && <Check size={12} />} {opt.join(' + ')}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
