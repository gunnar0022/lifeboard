import { useState, useEffect, useCallback } from 'react';
import { abilityMod, proficiencyBonus, CLASS_COLORS } from '../../dndUtils';
import SpellcastingHeader from './SpellcastingHeader';
import ConcentrationBanner from './ConcentrationBanner';
import SpellSlotGrid from './SpellSlotGrid';
import PactSlotDisplay from './PactSlotDisplay';
import CantripsSection from './CantripsSection';
import SpellZone from './SpellZone';
import AddSpellModal from './AddSpellModal';

export default function SpellsTab({ character, editMode, onUpdate }) {
  const sc = character.spellcasting;
  const meta = character.meta || {};
  const abilities = character.abilities || {};
  const [spellCache, setSpellCache] = useState({});
  const [addModal, setAddModal] = useState(null); // null | 'cantrip' | 'prepared' | 'known'
  const [confirmConc, setConfirmConc] = useState(null); // { newId, currentName }

  // Fetch all spell data on mount and when spell lists change
  const allSpellIds = [
    ...(sc.cantrips || []),
    ...(sc.preparedSpells || []),
    ...(sc.knownSpells || []),
  ].filter(id => typeof id === 'number');

  useEffect(() => {
    if (allSpellIds.length === 0) return;
    const uncached = allSpellIds.filter(id => !spellCache[id]);
    if (uncached.length === 0) return;

    fetch('/api/dnd/spells/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: allSpellIds }),
    })
      .then(r => r.json())
      .then(spells => {
        const cache = {};
        spells.forEach(s => { cache[s.id] = s; });
        setSpellCache(prev => ({ ...prev, ...cache }));
      })
      .catch(e => console.error('Batch spell fetch failed:', e));
  }, [JSON.stringify(allSpellIds)]);

  const isPreparedCaster = sc.type === 'prepared';
  const isPactMagic = sc.type === 'pact_magic';
  const level = meta.level || 1;
  const abilMod = abilityMod(abilities[sc.ability] || 10);
  const preparedCap = Math.max(1, abilMod + level);

  // Concentration handling
  const concentratingOn = sc.concentratingOn;
  const concentratedSpell = concentratingOn ? spellCache[concentratingOn] : null;

  const handleConcentrate = useCallback((spellId) => {
    if (concentratingOn === spellId) {
      // Drop concentration
      onUpdate({ spellcasting: { ...sc, concentratingOn: null } });
      return;
    }
    if (concentratingOn && concentratingOn !== spellId) {
      const currentName = spellCache[concentratingOn]?.name || 'current spell';
      setConfirmConc({ newId: spellId, currentName });
      return;
    }
    onUpdate({ spellcasting: { ...sc, concentratingOn: spellId } });
  }, [concentratingOn, sc, spellCache, onUpdate]);

  const confirmConcentration = () => {
    if (confirmConc) {
      onUpdate({ spellcasting: { ...sc, concentratingOn: confirmConc.newId } });
      setConfirmConc(null);
    }
  };

  const dropConcentration = () => {
    onUpdate({ spellcasting: { ...sc, concentratingOn: null } });
  };

  // Slot updates
  const handleSlotUpdate = useCallback((slotUpdates) => {
    onUpdate({ spellcasting: { ...sc, slots: { ...sc.slots, ...slotUpdates } } });
  }, [sc, onUpdate]);

  const handlePactUpdate = useCallback((pactUpdates) => {
    onUpdate({ spellcasting: { ...sc, pactSlots: { ...sc.pactSlots, ...pactUpdates } } });
  }, [sc, onUpdate]);

  // Reorder handlers
  const handleCantripReorder = useCallback((newOrder) => {
    onUpdate({
      spellcasting: {
        ...sc,
        cantrips: newOrder,
        spellOrder: { ...sc.spellOrder, cantrips: newOrder },
      }
    });
  }, [sc, onUpdate]);

  const handlePreparedReorder = useCallback((newOrder) => {
    onUpdate({
      spellcasting: {
        ...sc,
        preparedSpells: newOrder,
        spellOrder: { ...sc.spellOrder, prepared: newOrder },
      }
    });
  }, [sc, onUpdate]);

  const handleKnownReorder = useCallback((newOrder) => {
    onUpdate({
      spellcasting: {
        ...sc,
        knownSpells: newOrder,
        spellOrder: { ...sc.spellOrder, known: newOrder },
      }
    });
  }, [sc, onUpdate]);

  // Move between zones
  const moveToPrepared = useCallback((spellId) => {
    const newKnown = (sc.knownSpells || []).filter(id => id !== spellId);
    const newPrepared = [...(sc.preparedSpells || []), spellId];
    onUpdate({
      spellcasting: {
        ...sc,
        preparedSpells: newPrepared,
        knownSpells: newKnown,
        spellOrder: {
          ...sc.spellOrder,
          prepared: [...(sc.spellOrder?.prepared || []), spellId],
          known: (sc.spellOrder?.known || []).filter(id => id !== spellId),
        },
      }
    });
  }, [sc, onUpdate]);

  const moveToKnown = useCallback((spellId) => {
    const newPrepared = (sc.preparedSpells || []).filter(id => id !== spellId);
    const newKnown = [...(sc.knownSpells || []), spellId];
    // If unprepping the concentrated spell, drop concentration
    const newConc = sc.concentratingOn === spellId ? null : sc.concentratingOn;
    onUpdate({
      spellcasting: {
        ...sc,
        preparedSpells: newPrepared,
        knownSpells: newKnown,
        concentratingOn: newConc,
        spellOrder: {
          ...sc.spellOrder,
          prepared: (sc.spellOrder?.prepared || []).filter(id => id !== spellId),
          known: [...(sc.spellOrder?.known || []), spellId],
        },
      }
    });
  }, [sc, onUpdate]);

  // Remove spell from character
  const handleRemoveCantrip = useCallback((spellId) => {
    onUpdate({
      spellcasting: {
        ...sc,
        cantrips: (sc.cantrips || []).filter(id => id !== spellId),
        spellOrder: {
          ...sc.spellOrder,
          cantrips: (sc.spellOrder?.cantrips || []).filter(id => id !== spellId),
        },
      }
    });
  }, [sc, onUpdate]);

  const handleRemovePrepared = useCallback((spellId) => {
    const newConc = sc.concentratingOn === spellId ? null : sc.concentratingOn;
    onUpdate({
      spellcasting: {
        ...sc,
        preparedSpells: (sc.preparedSpells || []).filter(id => id !== spellId),
        concentratingOn: newConc,
        spellOrder: {
          ...sc.spellOrder,
          prepared: (sc.spellOrder?.prepared || []).filter(id => id !== spellId),
        },
      }
    });
  }, [sc, onUpdate]);

  const handleRemoveKnown = useCallback((spellId) => {
    onUpdate({
      spellcasting: {
        ...sc,
        knownSpells: (sc.knownSpells || []).filter(id => id !== spellId),
        spellOrder: {
          ...sc.spellOrder,
          known: (sc.spellOrder?.known || []).filter(id => id !== spellId),
        },
      }
    });
  }, [sc, onUpdate]);

  // Add spell handlers
  const handleAddSpell = useCallback((spellId, zone) => {
    if (zone === 'cantrip') {
      if ((sc.cantrips || []).includes(spellId)) return;
      onUpdate({
        spellcasting: {
          ...sc,
          cantrips: [...(sc.cantrips || []), spellId],
          spellOrder: {
            ...sc.spellOrder,
            cantrips: [...(sc.spellOrder?.cantrips || []), spellId],
          },
        }
      });
    } else if (zone === 'prepared') {
      if ((sc.preparedSpells || []).includes(spellId)) return;
      onUpdate({
        spellcasting: {
          ...sc,
          preparedSpells: [...(sc.preparedSpells || []), spellId],
          spellOrder: {
            ...sc.spellOrder,
            prepared: [...(sc.spellOrder?.prepared || []), spellId],
          },
        }
      });
    } else {
      if ((sc.knownSpells || []).includes(spellId)) return;
      onUpdate({
        spellcasting: {
          ...sc,
          knownSpells: [...(sc.knownSpells || []), spellId],
          spellOrder: {
            ...sc.spellOrder,
            known: [...(sc.spellOrder?.known || []), spellId],
          },
        }
      });
    }
    // Refresh cache for the new spell
    fetch(`/api/dnd/spells/${spellId}`).then(r => r.json()).then(spell => {
      setSpellCache(prev => ({ ...prev, [spell.id]: spell }));
    }).catch(() => {});
  }, [sc, onUpdate]);

  const preparedCount = (sc.preparedSpells || []).length;

  return (
    <div className="spells-tab">
      <SpellcastingHeader spellcasting={sc} abilities={abilities} level={level} editMode={editMode} onUpdate={onUpdate} />

      {concentratedSpell && (
        <ConcentrationBanner
          spellName={concentratedSpell.name}
          className={meta.className}
          onDrop={dropConcentration}
        />
      )}

      {/* Concentration confirm dialog */}
      {confirmConc && (
        <div className="spell-confirm-conc">
          <span>Drop concentration on <strong>{confirmConc.currentName}</strong>?</span>
          <button className="spell-confirm-conc__yes" onClick={confirmConcentration}>Confirm</button>
          <button className="spell-confirm-conc__no" onClick={() => setConfirmConc(null)}>Cancel</button>
        </div>
      )}

      {/* Slots */}
      {isPactMagic ? (
        <PactSlotDisplay pactSlots={sc.pactSlots || { max: 1, current: 1, level: 1 }} editMode={editMode} onUpdate={handlePactUpdate} />
      ) : (
        <SpellSlotGrid slots={sc.slots || {}} className={meta.className} editMode={editMode} onUpdate={handleSlotUpdate} />
      )}

      {/* Cantrips */}
      <CantripsSection
        cantripIds={sc.cantrips || []}
        spellOrder={sc.spellOrder?.cantrips}
        spellCache={spellCache}
        className={meta.className}
        editMode={editMode}
        onReorder={handleCantripReorder}
        onRemove={handleRemoveCantrip}
        onAddCantrip={() => setAddModal('cantrip')}
      />

      {/* Prepared zone (for prepared casters) */}
      {isPreparedCaster && (
        <SpellZone
          title="Prepared Spells"
          subtitle={`${preparedCount}/${preparedCap}`}
          spellIds={sc.preparedSpells || []}
          spellOrder={sc.spellOrder?.prepared}
          spellCache={spellCache}
          concentratingOn={concentratingOn}
          className={meta.className}
          editMode={editMode}
          onReorder={handlePreparedReorder}
          onConcentrate={handleConcentrate}
          onRemove={handleRemovePrepared}
          onMoveTo={moveToKnown}
          moveLabel="Move to Known"
          onAddSpell={() => setAddModal('prepared')}
        />
      )}

      {/* Known zone */}
      <SpellZone
        title={isPreparedCaster ? 'Known Spells' : 'Spells'}
        subtitle={isPreparedCaster ? 'available but not prepared today' : undefined}
        spellIds={sc.knownSpells || []}
        spellOrder={sc.spellOrder?.known}
        spellCache={spellCache}
        concentratingOn={concentratingOn}
        className={meta.className}
        editMode={editMode}
        onReorder={handleKnownReorder}
        onConcentrate={handleConcentrate}
        onRemove={handleRemoveKnown}
        onMoveTo={isPreparedCaster ? moveToPrepared : undefined}
        moveLabel={isPreparedCaster ? 'Move to Prepared' : undefined}
        onAddSpell={() => setAddModal('known')}
      />

      {/* Edit mode: spellcasting type toggle and enable/disable */}
      {editMode && (
        <div className="spells-tab__edit-controls">
          <label className="spells-tab__type-label">
            Casting Type:
            <select className="dnd-field" value={sc.type} onChange={e => onUpdate({ spellcasting: { ...sc, type: e.target.value } })}>
              <option value="prepared">Prepared</option>
              <option value="known">Known</option>
              <option value="pact_magic">Pact Magic</option>
            </select>
          </label>
        </div>
      )}

      {/* Add Spell Modal */}
      {addModal && (
        <AddSpellModal
          isCantrip={addModal === 'cantrip'}
          onAdd={(spellId) => handleAddSpell(spellId, addModal)}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
}
