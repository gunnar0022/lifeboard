import { useState, useEffect, useCallback, useMemo } from 'react';
import { abilityMod, proficiencyBonus, normalizeSpellcasting, CLASS_CASTER_PROFILE } from '../../dndUtils';
import { maxSlotsForSources, pactSlotsForLevel } from '../../spellSlots';
import { wizardCantripsKnown, warlockCantripsKnown, druidCantripsKnown, bardCantripsKnown, clericCantripsKnown, bardSpellsKnown } from '../../classProgression';
import { AlertTriangle } from 'lucide-react';
import SpellcastingHeader from './SpellcastingHeader';
import ConcentrationBanner from './ConcentrationBanner';
import SpellSlotGrid from './SpellSlotGrid';
import PactSlotDisplay from './PactSlotDisplay';
import CantripsSection from './CantripsSection';
import SpellZone from './SpellZone';
import GrantedSpells, { grantedMaxUses } from './GrantedSpells';
import AddSpellModal from './AddSpellModal';
import CastModal from './CastModal';

const ORD = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const ord = (n) => ORD[n] || `${n}th`;

export default function SpellsTab({ character, editMode, onUpdate }) {
  const meta = character.meta || {};
  const abilities = character.abilities || {};
  const level = meta.level || 1;

  // Normalize once per render so old-shape saves keep working.
  const sc = useMemo(
    () => normalizeSpellcasting(character.spellcasting, meta.className),
    [character.spellcasting, meta.className]
  );

  const [spellCache, setSpellCache] = useState({});
  const [addModal, setAddModal] = useState(null);   // null | 'cantrip' | 'prepared' | 'known' | 'granted'
  const [castState, setCastState] = useState(null);  // { spell, grantedEntry }

  const writeSc = useCallback((patch) => {
    onUpdate({ spellcasting: { ...sc, ...patch } });
  }, [sc, onUpdate]);

  // ── Class-authoritative handshake ──
  // The main slot area follows rigid class rules: caster type, preparation
  // style, and slot counts all come from the class profile (not stored data),
  // so switching class instantly grants/revokes the right slots.
  const profile = CLASS_CASTER_PROFILE[meta.className] || null;
  const isCaster = !!profile;
  const casterType = profile?.casterType || null;

  const classLevel = sc.classLevel ?? level;
  const sources = useMemo(
    () => (isCaster ? [{ casterType, classLevel }] : []),
    [isCaster, casterType, classLevel]
  );
  const maxSlots = useMemo(() => maxSlotsForSources(sources), [sources]);
  const pactInfo = casterType === 'pact' ? pactSlotsForLevel(classLevel) : { count: 0, slotLevel: 0 };

  const abilMod = abilityMod(abilities[sc.ability] || 10);
  const profBonus = proficiencyBonus(level);
  const isPrepared = profile?.preparation === 'prepared';

  // Prepared cap scales with spellcasting level by caster type.
  const prepLevel = casterType === 'full' ? classLevel
    : (casterType === 'half' || casterType === 'artificer') ? Math.floor(classLevel / 2)
    : classLevel;
  const preparedCap = Math.max(1, abilMod + prepLevel);
  // Cantrips-known cap is display-only (per-class table; Wizard supplied).
  const CANTRIP_CAPS = {
    Wizard: wizardCantripsKnown, Warlock: warlockCantripsKnown, Druid: druidCantripsKnown,
    Bard: bardCantripsKnown, Cleric: clericCantripsKnown,
  };
  const cantripCap = CANTRIP_CAPS[meta.className] ? CANTRIP_CAPS[meta.className](classLevel) : null;
  // Known-spell cap (display-only) for "known" casters that have one.
  const knownCap = meta.className === 'Bard' ? bardSpellsKnown(classLevel) : null;
  const alwaysSet = useMemo(() => new Set(sc.alwaysPrepared || []), [sc.alwaysPrepared]);
  const preparedCount = (sc.prepared || []).filter(id => !alwaysSet.has(id)).length;
  const preparedFull = preparedCount >= preparedCap;

  // ── Spell cache ──
  const allSpellIds = useMemo(() => {
    const grantedIds = (sc.grantedSpells || []).map(g => g.spellId);
    return [...(sc.cantrips || []), ...(sc.prepared || []), ...(sc.known || []), ...grantedIds]
      .filter(id => typeof id === 'number');
  }, [sc.cantrips, sc.prepared, sc.known, sc.grantedSpells]);

  useEffect(() => {
    const uncached = allSpellIds.filter(id => !spellCache[id]);
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
      .catch(e => console.error('Batch spell fetch failed:', e));
  }, [JSON.stringify(allSpellIds)]); // eslint-disable-line react-hooks/exhaustive-deps

  const concentratedSpell = sc.concentratingOn ? spellCache[sc.concentratingOn] : null;

  // ── Concentration ──
  const handleConcentrate = useCallback((spellId) => {
    writeSc({ concentratingOn: sc.concentratingOn === spellId ? null : spellId });
  }, [sc.concentratingOn, writeSc]);

  const dropConcentration = useCallback(() => writeSc({ concentratingOn: null }), [writeSc]);

  // ── Slot tracking ──
  const handleExpendSlot = useCallback((lvl, expended) => {
    writeSc({ slotsExpended: { ...sc.slotsExpended, [String(lvl)]: expended } });
  }, [sc.slotsExpended, writeSc]);

  const handleUpdateExtra = useCallback((extraSlots) => writeSc({ extraSlots }), [writeSc]);
  const handleExpendPact = useCallback((expended) => writeSc({ pact: { ...sc.pact, expended } }), [sc.pact, writeSc]);

  // ── Cast picker ──
  const buildSources = useCallback((spell, grantedEntry) => {
    const out = [];
    const spellLevel = spell.level || 0;

    if (grantedEntry) {
      const max = grantedMaxUses(grantedEntry, profBonus);
      const atWill = grantedEntry.useType === 'at_will';
      const remaining = atWill ? null : max - (grantedEntry.used || 0);
      if (atWill || remaining > 0) {
        out.push({
          key: 'granted', type: 'granted', grantedId: grantedEntry.id,
          castLevel: grantedEntry.castLevel ?? spellLevel,
          label: grantedEntry.source || 'Granted use', remaining,
        });
      }
      if (!grantedEntry.canUseSlots) return out; // locked to its own resource
    }

    if (casterType === 'pact' && pactInfo.slotLevel >= spellLevel) {
      const remaining = pactInfo.count - (sc.pact?.expended || 0);
      if (remaining > 0) {
        out.push({ key: 'pact', type: 'pact', castLevel: pactInfo.slotLevel,
          label: `Pact slot (${ord(pactInfo.slotLevel)})`, remaining });
      }
    }

    Object.entries(maxSlots).forEach(([lvl, max]) => {
      const L = Number(lvl);
      if (L < spellLevel) return;
      const remaining = max - (sc.slotsExpended?.[lvl] || 0);
      if (remaining > 0) out.push({ key: `slot-${L}`, type: 'slot', level: L, castLevel: L,
        label: `${ord(L)} slot`, remaining });
    });

    (sc.extraSlots || []).forEach((e) => {
      if (e.level < spellLevel) return;
      const remaining = e.max - (e.expended || 0);
      if (remaining > 0) out.push({ key: `extra-${e.id}`, type: 'extra', extraId: e.id, level: e.level,
        castLevel: e.level, label: e.label, remaining });
    });

    return out;
  }, [sc, casterType, maxSlots, pactInfo, profBonus]);

  const openCast = useCallback((spell, grantedEntry) => {
    setCastState({ spell, grantedEntry: grantedEntry || null });
  }, []);

  const applyCast = useCallback(({ source, isConcentration }) => {
    if (!castState) return;
    const spell = castState.spell;
    const patch = {};

    if (source.type === 'slot') {
      patch.slotsExpended = { ...sc.slotsExpended, [String(source.level)]: (sc.slotsExpended?.[String(source.level)] || 0) + 1 };
    } else if (source.type === 'pact') {
      patch.pact = { ...sc.pact, expended: (sc.pact?.expended || 0) + 1 };
    } else if (source.type === 'extra') {
      patch.extraSlots = (sc.extraSlots || []).map(e => e.id === source.extraId ? { ...e, expended: (e.expended || 0) + 1 } : e);
    } else if (source.type === 'granted') {
      patch.grantedSpells = (sc.grantedSpells || []).map(g =>
        g.id === source.grantedId && g.useType !== 'at_will' ? { ...g, used: (g.used || 0) + 1 } : g);
    }

    if (isConcentration) patch.concentratingOn = spell.id; // auto-drops the prior one

    writeSc(patch);
  }, [castState, sc, writeSc]);

  // ── Spell list mutations ──
  const moveToPrepared = useCallback((spellId) => {
    if (preparedFull) return;
    writeSc({
      prepared: [...(sc.prepared || []), spellId],
      known: (sc.known || []).filter(id => id !== spellId),
    });
  }, [sc.prepared, sc.known, preparedFull, writeSc]);

  const moveToKnown = useCallback((spellId) => {
    writeSc({
      prepared: (sc.prepared || []).filter(id => id !== spellId),
      known: [...(sc.known || []), spellId],
      alwaysPrepared: (sc.alwaysPrepared || []).filter(id => id !== spellId),
      concentratingOn: sc.concentratingOn === spellId ? null : sc.concentratingOn,
    });
  }, [sc, writeSc]);

  const toggleAlwaysPrepared = useCallback((spellId) => {
    const set = new Set(sc.alwaysPrepared || []);
    set.has(spellId) ? set.delete(spellId) : set.add(spellId);
    writeSc({ alwaysPrepared: [...set] });
  }, [sc.alwaysPrepared, writeSc]);

  const removeFrom = useCallback((key, spellId) => {
    const patch = { [key]: (sc[key] || []).filter(id => id !== spellId) };
    if (key === 'prepared') {
      patch.alwaysPrepared = (sc.alwaysPrepared || []).filter(id => id !== spellId);
      if (sc.concentratingOn === spellId) patch.concentratingOn = null;
    }
    writeSc(patch);
  }, [sc, writeSc]);

  const handleAddSpell = useCallback((spellId, zone) => {
    if (zone === 'granted') {
      if ((sc.grantedSpells || []).some(g => g.spellId === spellId)) return;
      writeSc({
        grantedSpells: [...(sc.grantedSpells || []), {
          id: `g-${Date.now()}`, spellId, source: '', useType: 'per_long_rest',
          max: 1, used: 0, castLevel: null, canUseSlots: true,
        }],
      });
    } else {
      const key = zone === 'cantrip' ? 'cantrips' : zone === 'prepared' ? 'prepared' : 'known';
      if ((sc[key] || []).includes(spellId)) return;
      writeSc({ [key]: [...(sc[key] || []), spellId] });
    }
    fetch(`/api/dnd/spells/${spellId}`).then(r => r.json())
      .then(spell => setSpellCache(prev => ({ ...prev, [spell.id]: spell }))).catch(() => {});
  }, [sc, writeSc]);

  const handleEditSpell = useCallback(async (spellData) => {
    try {
      await fetch(`/api/dnd/spells/${spellData.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(spellData),
      });
      setSpellCache(prev => ({ ...prev, [spellData.id]: spellData }));
    } catch (e) { console.error('Failed to update spell:', e); }
  }, []);

  return (
    <div className="spells-tab">
      <SpellcastingHeader spellcasting={sc} abilities={abilities} level={level} editMode={editMode} onUpdate={onUpdate} />

      {concentratedSpell && (
        <ConcentrationBanner spellName={concentratedSpell.name} className={meta.className} onDrop={dropConcentration} />
      )}

      {/* Non-caster classes have NO class spell slots — only the granted area
          (items / feats / racial) below remains available. */}
      {!isCaster && (
        <div className="spells-tab__no-caster">
          <AlertTriangle size={15} />
          <span><strong>{meta.className || 'This class'}</strong> has no class spellcasting — spell slots are unavailable. Spells from items, feats, or racial traits still appear under <strong>Granted Spells</strong>.</span>
        </div>
      )}

      {/* Class-derived slots */}
      {isCaster && (casterType === 'pact' ? (
        <>
          <PactSlotDisplay pactInfo={pactInfo} expended={sc.pact?.expended} onExpend={handleExpendPact} />
          {((sc.extraSlots || []).length > 0 || editMode) && (
            <SpellSlotGrid maxSlots={{}} slotsExpended={{}} extraSlots={sc.extraSlots} className={meta.className}
              editMode={editMode} onExpendSlot={handleExpendSlot} onUpdateExtra={handleUpdateExtra} />
          )}
        </>
      ) : (
        <SpellSlotGrid maxSlots={maxSlots} slotsExpended={sc.slotsExpended} extraSlots={sc.extraSlots}
          className={meta.className} editMode={editMode} onExpendSlot={handleExpendSlot} onUpdateExtra={handleUpdateExtra} />
      ))}

      {/* Cantrips */}
      {isCaster && (
        <CantripsSection
          cantripIds={sc.cantrips}
          cap={cantripCap}
          spellCache={spellCache}
          className={meta.className}
          editMode={editMode}
          onRemove={(id) => removeFrom('cantrips', id)}
          onEditSpell={handleEditSpell}
          onAddCantrip={() => setAddModal('cantrip')}
          onCast={openCast}
        />
      )}

      {/* Prepared zone */}
      {isCaster && isPrepared && (
        <SpellZone
          title="Prepared Spells"
          subtitle={`${preparedCount}/${preparedCap} prepared`}
          spellIds={sc.prepared}
          spellCache={spellCache}
          concentratingOn={sc.concentratingOn}
          className={meta.className}
          editMode={editMode}
          onConcentrate={handleConcentrate}
          onRemove={(id) => removeFrom('prepared', id)}
          onEditSpell={handleEditSpell}
          onCast={openCast}
          onMove={moveToKnown}
          moveLabel="Unprepare"
          alwaysPrepared={sc.alwaysPrepared}
          onToggleAlwaysPrepared={toggleAlwaysPrepared}
          onAddSpell={() => setAddModal('prepared')}
        />
      )}

      {/* Known / accessible zone */}
      {isCaster && (
        <SpellZone
          title={isPrepared ? 'Spellbook' : 'Spells'}
          subtitle={isPrepared ? 'known but not prepared'
            : knownCap != null ? `${(sc.known || []).length}/${knownCap} known` : undefined}
          spellIds={sc.known}
          spellCache={spellCache}
          concentratingOn={sc.concentratingOn}
          className={meta.className}
          editMode={editMode}
          onConcentrate={handleConcentrate}
          onRemove={(id) => removeFrom('known', id)}
          onEditSpell={handleEditSpell}
          onCast={isPrepared ? undefined : openCast}
          onMove={isPrepared ? moveToPrepared : undefined}
          moveLabel={isPrepared ? (preparedFull ? 'Prepared full' : 'Prepare') : undefined}
          moveDisabled={isPrepared ? preparedFull : false}
          onAddSpell={() => setAddModal('known')}
        />
      )}

      {/* Granted spells */}
      <GrantedSpells
        grantedSpells={sc.grantedSpells}
        spellCache={spellCache}
        className={meta.className}
        profBonus={profBonus}
        editMode={editMode}
        onCast={openCast}
        onUpdate={(grantedSpells) => writeSc({ grantedSpells })}
        onRemove={(id) => writeSc({ grantedSpells: (sc.grantedSpells || []).filter(g => g.id !== id) })}
        onAddGranted={editMode ? () => setAddModal('granted') : undefined}
      />

      {editMode && (
        <div className="spells-tab__edit-controls">
          <span className="spells-tab__derived-note">
            {isCaster
              ? `Slots, caster type (${casterType}), and ${profile.preparation} access are set by the class: ${meta.className} ${classLevel}. Edit these by changing class/level.`
              : `${meta.className || 'This class'} grants no spellcasting. Add item/feat/racial spells under Granted Spells.`}
          </span>
        </div>
      )}

      {addModal && (
        <AddSpellModal
          isCantrip={addModal === 'cantrip'}
          onAdd={(spellId) => handleAddSpell(spellId, addModal)}
          onClose={() => setAddModal(null)}
        />
      )}

      {castState && (
        <CastModal
          spell={castState.spell}
          sources={buildSources(castState.spell, castState.grantedEntry)}
          charLevel={level}
          className={meta.className}
          concentratingOnName={concentratedSpell?.name}
          onCast={applyCast}
          onClose={() => setCastState(null)}
        />
      )}
    </div>
  );
}
