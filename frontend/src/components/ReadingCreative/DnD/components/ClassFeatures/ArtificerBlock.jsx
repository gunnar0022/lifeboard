import { useEffect, useRef, useState } from 'react';
import { Cog, Wrench, Sparkles, Lightbulb, Boxes, Gem, Plus, Hammer, ShieldCheck } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { INFUSION_LIST, infusedItemsMax, attunementCap } from '../../classProgression';

const ACCENT = 'var(--dnd-class-artificer)';
const REPEATABLE = (name) => name === 'Replicate Magic Item';
const infData = (name) => INFUSION_LIST.find(i => i.name === name);
const newId = () => `inf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/**
 * Artificer — Combat tab. The identity is gear, so the block headlines an
 * Infusion Workbench: a rack of "infused item" slots (count = the Infused Items
 * column) that you fill, after a long rest, with the infusions you know (chosen
 * on the Features tab). Each slot names the object, shows its effect, and toggles
 * attunement against the artificer's growing attunement ceiling. Around it sit
 * the lighter resources — Magical Tinkering objects, Flash of Genius reactions,
 * the Spell-Storing Item — plus passive reminders that scale with level.
 */
export default function ArtificerBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const intMod = abilityMod(character.abilities?.INT || 10);

  const known = cf.knownInfusions || [];
  const infused = cf.infusedItems || [];
  const infusedMax = infusedItemsMax(level);
  const tinkerMax = Math.max(1, intMod);
  const flashMax = Math.max(1, intMod);
  const storeMax = Math.max(2, intMod * 2);
  const attuneMax = attunementCap(level);

  const [picking, setPicking] = useState(false);
  const prev = useRef(null);

  // Reconcile the level/INT-scaled pools, granting the delta on growth.
  useEffect(() => {
    const p = prev.current;
    prev.current = { flashMax, storeMax };
    const grow = (stored, max, oldMax) => {
      if (stored == null) return max;
      return oldMax != null && max > oldMax ? Math.min(stored + (max - oldMax), max) : Math.min(stored, max);
    };
    const patch = {};
    if (!cf.magicalTinkering) patch.magicalTinkering = { current: 0 };
    if (level >= 7 && cf.flashOfGenius?.max !== flashMax) {
      patch.flashOfGenius = { max: flashMax, current: grow(cf.flashOfGenius?.current, flashMax, p?.flashMax) };
    }
    if (level >= 11 && cf.spellStoring?.max !== storeMax) {
      patch.spellStoring = { ...(cf.spellStoring || { spell: '' }), max: storeMax,
        current: grow(cf.spellStoring?.current, storeMax, p?.storeMax) };
    }
    if (Object.keys(patch).length) onUpdate({ classFeature: { ...cf, ...patch } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashMax, storeMax, level]);

  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  // ── Magical Tinkering ──
  const tinker = cf.magicalTinkering || { current: 0 };
  const stepTinker = (d) =>
    patchCf({ magicalTinkering: { current: Math.max(0, Math.min(tinkerMax, tinker.current + d)) } });

  // ── Infusion Workbench ──
  const usedNames = infused.map(it => it.infusion);
  const availableToPlace = [...new Set(known)].filter(
    name => REPEATABLE(name) || !usedNames.includes(name)
  );
  const placeInfusion = (name) => {
    const d = infData(name);
    const item = { id: newId(), infusion: name, itemName: '', attuned: d?.attune ? false : null };
    patchCf({ infusedItems: [...infused, item] });
    setPicking(false);
  };
  const updateItem = (id, fields) =>
    patchCf({ infusedItems: infused.map(it => it.id === id ? { ...it, ...fields } : it) });
  const removeItem = (id) => patchCf({ infusedItems: infused.filter(it => it.id !== id) });
  const clearAll = () => patchCf({ infusedItems: [] });

  const attunedCount = infused.filter(it => it.attuned).length;

  // ── Flash of Genius ──
  const flash = cf.flashOfGenius || { current: 0, max: flashMax };
  const stepFlash = (d) =>
    patchCf({ flashOfGenius: { ...flash, current: Math.max(0, Math.min(flash.max, flash.current + d)) } });

  // ── Spell-Storing Item ──
  const store = cf.spellStoring || { spell: '', current: 0, max: storeMax };
  const setStore = (fields) => patchCf({ spellStoring: { ...store, ...fields } });

  return (
    <div className="dnd-warmagic dnd-artificer" style={{ '--block-accent': ACCENT }}>
      {/* ── Infusion Workbench ── */}
      {level >= 2 && (
        <div className="dnd-artificer__bench">
          <div className="dnd-artificer__bench-head">
            <h4 className="dnd-warmagic__subtitle"><Hammer size={14} /> Infusion Workbench</h4>
            <span className="dnd-warmagic__uses">{infused.length}/{infusedMax} infused</span>
          </div>

          {known.length === 0 ? (
            <p className="dnd-artificer__hint">
              Learn infusions on the <strong>Features → Infuse Item</strong> card, then infuse items here after a long rest.
            </p>
          ) : (
            <>
              <div className="dnd-artificer__slots">
                {infused.map(it => {
                  const d = infData(it.infusion);
                  return (
                    <div key={it.id} className="dnd-artificer__slot">
                      <div className="dnd-artificer__slot-icon"><Cog size={16} /></div>
                      <div className="dnd-artificer__slot-body">
                        <div className="dnd-artificer__slot-top">
                          <span className="dnd-artificer__slot-inf">{it.infusion}</span>
                          <button className="dnd-feature-choice__remove" onClick={() => removeItem(it.id)} title="End infusion">×</button>
                        </div>
                        <input
                          className="dnd-field dnd-artificer__slot-name"
                          value={it.itemName || ''}
                          placeholder={d?.target || 'Name the infused object…'}
                          onChange={e => updateItem(it.id, { itemName: e.target.value })}
                        />
                        <p className="dnd-artificer__slot-desc">{d?.desc}</p>
                        {d?.attune && (
                          <button
                            className={`dnd-artificer__attune ${it.attuned ? 'dnd-artificer__attune--on' : ''}`}
                            onClick={() => updateItem(it.id, { attuned: !it.attuned })}
                          >
                            <Gem size={11} /> {it.attuned ? 'Attuned' : 'Attune'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {infused.length < infusedMax && availableToPlace.length > 0 && (
                <>
                  <button className="dnd-artificer__add" onClick={() => setPicking(!picking)}>
                    <Plus size={13} /> Infuse an item
                  </button>
                  {picking && (
                    <div className="dnd-feature-choice__picker">
                      {availableToPlace.map(name => {
                        const d = infData(name);
                        return (
                          <button key={name} className="dnd-feature-choice__pick" onClick={() => placeInfusion(name)} title={d?.desc}>
                            {name}{d?.attune && <span className="dnd-feature-choice__pick-lvl"> ⚜</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <div className="dnd-artificer__bench-foot">
                <span className="dnd-warmagic__note">
                  <ShieldCheck size={11} /> Attuned: <strong>{attunedCount}/{attuneMax}</strong> magic items (infused shown; add others to your count manually).
                </span>
                {infused.length > 0 && (
                  <button className="dnd-warmagic__btn" onClick={clearAll} title="Free every slot to re-infuse on a long rest">Reset</button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Magical Tinkering ── */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Wrench size={13} /> Magical Tinkering</h4>
          <span className="dnd-warmagic__uses">{tinker.current}/{tinkerMax} objects</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: tinkerMax }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < tinker.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Light, recorded message, smell/sound, or static visual on a Tiny object. New one past the cap ends the oldest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => stepTinker(-1)} disabled={tinker.current <= 0}>−</button>
            <button className="dnd-warmagic__btn" onClick={() => stepTinker(1)} disabled={tinker.current >= tinkerMax}>+</button>
          </div>
        </div>
      </div>

      {/* ── Flash of Genius (7th) ── */}
      {level >= 7 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Lightbulb size={13} /> Flash of Genius</h4>
            <span className="dnd-warmagic__uses">{flash.current}/{flash.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: flash.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < flash.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reaction: add +{intMod} (INT) to an ability check or save you or an ally within 30 ft makes. Long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepFlash(1)} disabled={flash.current >= flash.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepFlash(-1)} disabled={flash.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Spell-Storing Item (11th) ── */}
      {level >= 11 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Spell-Storing Item</h4>
            <span className="dnd-warmagic__uses">{store.current}/{store.max} casts</span>
          </div>
          <input
            className="dnd-field dnd-artificer__slot-name"
            value={store.spell || ''}
            placeholder="Stored 1st/2nd-level spell (1 action)…"
            onChange={e => setStore({ spell: e.target.value })}
          />
          <div className="dnd-warmagic__pips">
            {Array.from({ length: store.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < store.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Any holder casts it with your modifier. {store.max} casts (2× INT), then re-store on a long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => setStore({ current: Math.min(store.max, store.current + 1) })} disabled={store.current >= store.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setStore({ current: Math.max(0, store.current - 1) })} disabled={store.current <= 0}>Cast</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Passive reminders ── */}
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Boxes size={12} />
          <span><strong>Spellcasting focus</strong> — cast through thieves' tools, an artisan's tool you're proficient with, or any infused item.</span>
        </div>
        {level >= 3 && (
          <div className="dnd-warmagic__reminder">
            <Wrench size={12} />
            <span><strong>The Right Tool for the Job</strong> — 1 hour of work (during a rest) conjures one set of artisan's tools until reused.</span>
          </div>
        )}
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <Cog size={12} />
            <span><strong>Tool Expertise</strong> — double your proficiency bonus on any ability check using a tool you're proficient with.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Gem size={12} />
            <span><strong>Magic Item {level >= 18 ? 'Master' : level >= 14 ? 'Savant' : 'Adept'}</strong> — attune to up to <strong>{attuneMax}</strong> magic items{level >= 14 ? '; ignore class/race/spell/level requirements on magic items' : '; craft common/uncommon items in ¼ time for ½ cost'}.</span>
          </div>
        )}
        {level >= 20 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sparkles size={12} />
            <span><strong>Soul of Artifice</strong> — +{attunedCount || 1} to all saves (one per attuned item); at 0 HP, react to end an infusion and drop to 1 HP instead.</span>
          </div>
        )}
      </div>
    </div>
  );
}
