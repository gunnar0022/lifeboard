import { useState, useEffect, useMemo } from 'react';
import { abilityMod, casterProfileFor, normalizeSpellcasting, buildEmptySpellcasting } from '../../dndUtils';
import { slotOrd, prepCap } from './levelUpSummary';
import SpellZone from '../Spellcasting/SpellZone';
import AddSpellModal from '../Spellcasting/AddSpellModal';

const CLASS_TAG = {
  Artificer: 'artificer', Bard: 'bard', Cleric: 'cleric', Druid: 'druid',
  Paladin: 'paladin', Ranger: 'ranger', Sorcerer: 'sorcerer', Warlock: 'warlock', Wizard: 'wizard',
};
function classTagFor(className, subclass) {
  if (CLASS_TAG[className]) return CLASS_TAG[className];
  if (subclass === 'Eldritch Knight' || subclass === 'Arcane Trickster') return 'wizard';
  return '';
}

/**
 * Hands-on spell management for the Level Up reveal: shows the slot-capacity
 * gains and (for prepared casters) the higher prepared cap, lists the spells the
 * character knows / has prepared, and lets them prepare, learn, or add a spell
 * right here. Reads/writes the same `character.spellcasting` as the Spells tab.
 */
export default function LevelUpSpells({ character, summary, onUpdate }) {
  const profile = useMemo(() => casterProfileFor(summary.className, summary.subclass), [summary]);
  const sc = useMemo(
    () => normalizeSpellcasting(character.spellcasting, summary.className) || buildEmptySpellcasting(profile),
    [character.spellcasting, summary.className, profile]
  );

  const [spellCache, setSpellCache] = useState({});
  const [addModal, setAddModal] = useState(null); // null | { zone, isCantrip }

  const isPrepared = summary.preparation === 'prepared';
  const classLevel = summary.level;
  const abilMod = abilityMod(character.abilities?.[sc?.ability] || 10);
  const preparedCap = prepCap(summary.casterType, classLevel, abilMod);
  const prevCap = prepCap(summary.casterType, classLevel - 1, abilMod);
  const alwaysSet = useMemo(() => new Set(sc?.alwaysPrepared || []), [sc]);
  const preparedDisplayIds = useMemo(
    () => (sc?.prepared || []).filter(id => !alwaysSet.has(id)),
    [sc, alwaysSet]
  );
  const preparedCount = preparedDisplayIds.length;
  const preparedFull = preparedCount >= preparedCap;

  const classTag = classTagFor(summary.className, summary.subclass);
  const newSlotLevel = summary.pact
    ? summary.pact.slotLevel
    : (summary.slotDeltas.length ? Math.max(...summary.slotDeltas.map(d => d.slotLevel)) : undefined);

  // ── Spell cache (names/levels for the zones) ──
  const allIds = useMemo(() => [
    ...(sc?.cantrips || []), ...(sc?.prepared || []), ...(sc?.known || []),
  ].filter(id => typeof id === 'number'), [sc]);

  useEffect(() => {
    const uncached = allIds.filter(id => !spellCache[id]);
    if (uncached.length === 0) return;
    fetch('/api/dnd/spells/batch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: uncached }),
    })
      .then(r => r.json())
      .then(spells => setSpellCache(prev => {
        const next = { ...prev };
        spells.forEach(s => { next[s.id] = s; });
        return next;
      }))
      .catch(() => {});
  }, [JSON.stringify(allIds)]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations (mirror the Spells tab, writing the same blob) ──
  const writeSc = (patch) => onUpdate({ spellcasting: { ...sc, ...patch } });

  const addSpell = (spellId, zone) => {
    const key = zone === 'cantrip' ? 'cantrips' : zone === 'prepared' ? 'prepared' : 'known';
    if ((sc[key] || []).includes(spellId)) return;
    writeSc({ [key]: [...(sc[key] || []), spellId] });
    fetch(`/api/dnd/spells/${spellId}`).then(r => r.json())
      .then(spell => setSpellCache(prev => ({ ...prev, [spell.id]: spell }))).catch(() => {});
  };

  const moveToPrepared = (spellId) => {
    if (preparedFull) return;
    writeSc({ prepared: [...(sc.prepared || []), spellId], known: (sc.known || []).filter(id => id !== spellId) });
  };
  const moveToKnown = (spellId) => {
    writeSc({
      prepared: (sc.prepared || []).filter(id => id !== spellId),
      known: [...(sc.known || []), spellId],
      alwaysPrepared: (sc.alwaysPrepared || []).filter(id => id !== spellId),
    });
  };
  const removeFrom = (key, spellId) => {
    const patch = { [key]: (sc[key] || []).filter(id => id !== spellId) };
    if (key === 'prepared') patch.alwaysPrepared = (sc.alwaysPrepared || []).filter(id => id !== spellId);
    writeSc(patch);
  };

  return (
    <div className="dnd-lvlup__spells">
      {/* What grew */}
      {(summary.slotsChanged || preparedCap > prevCap) && (
        <div className="dnd-lvlup__slot-list">
          {summary.slotDeltas.map(d => (
            <div key={d.slotLevel} className="dnd-lvlup__slot-row">
              <span className="dnd-lvlup__slot-name">{slotOrd(d.slotLevel)}-level slots</span>
              {d.isNew
                ? <span className="dnd-lvlup__slot-new">Unlocked — {d.after}</span>
                : <span className="dnd-lvlup__slot-delta">{d.before} → <strong>{d.after}</strong></span>}
            </div>
          ))}
          {summary.pact && summary.pact.deltas.map((d, i) => (
            <div key={`pact-${i}`} className="dnd-lvlup__slot-row">
              <span className="dnd-lvlup__slot-name">{d.kind === 'pactLevel' ? 'Pact slot level' : 'Pact slots'}</span>
              <span className="dnd-lvlup__slot-delta">{d.before} → <strong>{d.after}</strong></span>
            </div>
          ))}
          {isPrepared && preparedCap > prevCap && (
            <div className="dnd-lvlup__slot-row dnd-lvlup__slot-row--cap">
              <span className="dnd-lvlup__slot-name">Spells you can prepare</span>
              <span className="dnd-lvlup__slot-delta">{prevCap} → <strong>{preparedCap}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Cantrips */}
      <SpellZone
        title="Cantrips"
        spellIds={sc?.cantrips || []}
        spellCache={spellCache}
        className={summary.className}
        editMode={false}
        onRemove={(id) => removeFrom('cantrips', id)}
        onAddSpell={() => setAddModal({ zone: 'cantrip', isCantrip: true })}
      />

      {isPrepared ? (
        <>
          {/* Prepared (excludes always-prepared, which don't count against the cap) */}
          <SpellZone
            title="Prepared Spells"
            subtitle={`${preparedCount}/${preparedCap} prepared`}
            spellIds={preparedDisplayIds}
            spellCache={spellCache}
            className={summary.className}
            editMode={false}
            onMove={moveToKnown}
            moveLabel="Unprepare"
            onRemove={(id) => removeFrom('prepared', id)}
            onAddSpell={() => setAddModal({ zone: 'prepared', isCantrip: false })}
          />
          {/* Spellbook / known-but-not-prepared */}
          <SpellZone
            title="Spellbook"
            subtitle="known — prepare what you need"
            spellIds={sc?.known || []}
            spellCache={spellCache}
            className={summary.className}
            editMode={false}
            onMove={moveToPrepared}
            moveLabel={preparedFull ? 'Prepared full' : 'Prepare'}
            moveDisabled={preparedFull}
            onRemove={(id) => removeFrom('known', id)}
            onAddSpell={() => setAddModal({ zone: 'known', isCantrip: false })}
          />
        </>
      ) : (
        <SpellZone
          title="Known Spells"
          spellIds={sc?.known || []}
          spellCache={spellCache}
          className={summary.className}
          editMode={false}
          onRemove={(id) => removeFrom('known', id)}
          onAddSpell={() => setAddModal({ zone: 'known', isCantrip: false })}
        />
      )}

      <p className="dnd-lvlup__spell-note">
        Browsing the {summary.className} list. Everything here syncs with your <strong>Spells</strong> tab.
      </p>

      {addModal && (
        <AddSpellModal
          isCantrip={addModal.isCantrip}
          defaultClass={classTag}
          defaultLevel={addModal.isCantrip ? undefined : newSlotLevel}
          onAdd={(spellId) => addSpell(spellId, addModal.zone)}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
}
