import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit3, Eye, Check, Loader } from 'lucide-react';
import StatBlock from './components/StatBlock';
import AttackList from './components/AttackList';
import SkillList from './components/SkillList';
import SaveThrows from './components/SaveThrows';
import FeatureList from './components/FeatureList';
import ProficiencyTags from './components/ProficiencyTags';
import InfoPanel from './components/InfoPanel';
import ClassFeatureBlock from './components/ClassFeatures/ClassFeatureBlock';
import SpellsTab from './components/Spellcasting/SpellsTab';
import NotesTab from './components/CampaignNotes/NotesTab';
import useAutosave from './components/useAutosave';
import { deepMerge, proficiencyBonus, CLASS_COLORS, CLASS_NAMES, CLASS_FEATURE_DEFAULTS, SPELLCASTING_DEFAULTS } from './dndUtils';

export default function CharacterSheet({ characterId, initialEditMode, campaignId, onBack }) {
  const [character, setCharacter] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(initialEditMode || false);
  const [tab, setTab] = useState('combat');
  const prevClassRef = useRef(null);

  const saveStatus = useAutosave(character, characterId);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/dnd/characters/${characterId}`);
        const data = await res.json();
        const charData = data.data;
        // Migrate old personality format to customBoxes
        if (charData.personality && !charData.customBoxes) {
          const p = charData.personality;
          charData.customBoxes = [{
            title: 'Personality',
            fields: Object.entries(p)
              .filter(([, v]) => v)
              .map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v })),
          }];
          if (charData.meta?.appearance) {
            charData.customBoxes.push({
              title: 'Appearance',
              fields: [{ label: 'Description', value: charData.meta.appearance }],
            });
          }
        }
        setCharacter(charData);
        prevClassRef.current = charData?.meta?.className || '';
      } catch (e) {
        console.error('Failed to load character:', e);
      } finally {
        setLoading(false);
      }
    })();
    // Fetch campaign name if campaignId provided
    if (campaignId) {
      fetch(`/api/dnd/campaigns/${campaignId}`).then(r => r.json())
        .then(c => setCampaignName(c.name || ''))
        .catch(() => {});
    }
  }, [characterId, campaignId]);

  const handleUpdate = (updates) => {
    setCharacter(prev => deepMerge(prev, updates));
  };

  // Class change detection
  useEffect(() => {
    if (!character) return;
    const currentClass = character.meta?.className || '';
    if (prevClassRef.current !== null && currentClass !== prevClassRef.current && currentClass) {
      const defaults = CLASS_FEATURE_DEFAULTS[currentClass];
      if (defaults) {
        setCharacter(prev => ({ ...prev, classFeature: { ...defaults } }));
      }
      // Auto-seed spellcasting defaults for caster classes
      const scDefaults = SPELLCASTING_DEFAULTS[currentClass];
      if (scDefaults && !character.spellcasting) {
        setCharacter(prev => ({ ...prev, spellcasting: { ...scDefaults } }));
      } else if (!scDefaults) {
        // Non-caster class: clear spellcasting if it was auto-seeded
        // (don't clear if user manually enabled it)
      }
    }
    prevClassRef.current = currentClass;
  }, [character?.meta?.className]);

  // Rest functions
  const shortRest = () => {
    if (!character) return;
    const updates = {
      combat: {
        ...character.combat,
        deathSaves: { successes: 0, failures: 0 },
      },
    };

    // Reset short-rest resources
    if (character.classFeature) {
      const cf = { ...character.classFeature };
      if (cf.type === 'action_surge') {
        cf.actionSurge = { ...cf.actionSurge, currentUses: cf.actionSurge?.maxUses || 1 };
        cf.secondWind = { ...cf.secondWind, currentUses: cf.secondWind?.maxUses || 1 };
      }
      if (cf.rechargeOn === 'short') {
        if ('currentUses' in cf) cf.currentUses = cf.maxUses || 0;
      }
      updates.classFeature = cf;
    }

    // Warlock pact slots recover on short rest
    if (character.spellcasting?.type === 'pact_magic' && character.spellcasting.pactSlots) {
      updates.spellcasting = {
        ...character.spellcasting,
        pactSlots: { ...character.spellcasting.pactSlots, current: character.spellcasting.pactSlots.max },
      };
    }

    setCharacter(prev => deepMerge(prev, updates));
  };

  const longRest = () => {
    if (!character) return;
    const maxHitDice = character.meta?.level || 1;
    const restoreHitDice = Math.max(1, Math.ceil(maxHitDice / 2));

    const updates = {
      combat: {
        ...character.combat,
        hpCurrent: character.combat.hpMax,
        hpTemp: 0,
        hitDiceRemaining: Math.min(
          maxHitDice,
          character.combat.hitDiceRemaining + restoreHitDice
        ),
        deathSaves: { successes: 0, failures: 0 },
      },
    };

    // Reset all resources
    if (character.classFeature) {
      const cf = { ...character.classFeature };
      if ('currentUses' in cf) cf.currentUses = cf.maxUses || 0;
      if ('currentPoints' in cf) cf.currentPoints = cf.maxPoints || 0;
      if ('active' in cf) cf.active = false;
      if (cf.type === 'action_surge') {
        cf.actionSurge = { ...cf.actionSurge, currentUses: cf.actionSurge?.maxUses || 1 };
        cf.secondWind = { ...cf.secondWind, currentUses: cf.secondWind?.maxUses || 1 };
      }
      if (cf.layOnHands) {
        cf.layOnHands = { ...cf.layOnHands, currentPool: cf.layOnHands.maxPool || 0 };
      }
      if (cf.pactSlots) {
        cf.pactSlots = { ...cf.pactSlots, current: cf.pactSlots.max || 0 };
      }
      updates.classFeature = cf;
    }

    // Long rest: recover all spell slots + clear concentration
    if (character.spellcasting) {
      const sc = { ...character.spellcasting, concentratingOn: null };
      if (sc.slots) {
        const newSlots = {};
        Object.entries(sc.slots).forEach(([lvl, slot]) => {
          newSlots[lvl] = { ...slot, expended: 0 };
        });
        sc.slots = newSlots;
      }
      if (sc.pactSlots) {
        sc.pactSlots = { ...sc.pactSlots, current: sc.pactSlots.max || 0 };
      }
      updates.spellcasting = sc;
    }

    setCharacter(prev => deepMerge(prev, updates));
  };

  if (loading) {
    return (
      <div className="dnd-sheet dnd-sheet--loading">
        <Loader className="dnd-sheet__spinner" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="dnd-sheet">
        <button className="dnd-sheet__back" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <p>Character not found.</p>
      </div>
    );
  }

  const meta = character.meta || {};
  const abilities = character.abilities || {};
  const classColor = CLASS_COLORS[meta.className] || 'var(--dnd-border)';
  const level = meta.level || 1;
  const profBonus = proficiencyBonus(level);
  const hasSpellcasting = !!character.spellcasting;

  const hasCampaign = !!campaignId;

  const tabs = [
    { id: 'combat', label: 'Combat' },
    { id: 'skills', label: 'Skills' },
    { id: 'features', label: 'Features' },
    ...(hasSpellcasting ? [{ id: 'spells', label: 'Spells' }] : []),
    { id: 'info', label: 'Info' },
    ...(hasCampaign ? [{ id: 'notes', label: 'Notes' }] : []),
  ];

  return (
    <div className="dnd-sheet">
      {/* Header */}
      <div className="dnd-sheet__header">
        <button className="dnd-sheet__back" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="dnd-sheet__header-center">
          {editMode ? (
            <input className="dnd-sheet__name-input" value={meta.name || ''}
              onChange={e => handleUpdate({ meta: { ...meta, name: e.target.value } })}
              placeholder="Character Name" />
          ) : (
            <h1 className="dnd-sheet__name">{meta.name || 'Unnamed'}</h1>
          )}

          <div className="dnd-sheet__subtitle">
            {editMode ? (
              <div className="dnd-sheet__subtitle-edit">
                <input className="dnd-field" value={meta.race || ''} placeholder="Race"
                  onChange={e => handleUpdate({ meta: { ...meta, race: e.target.value } })} />
                <select className="dnd-field" value={meta.className || ''}
                  onChange={e => handleUpdate({ meta: { ...meta, className: e.target.value } })}>
                  <option value="">-- Class --</option>
                  {CLASS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" className="dnd-field dnd-field--sm" value={level} min={1} max={20}
                  onChange={e => handleUpdate({ meta: { ...meta, level: parseInt(e.target.value) || 1 } })} />
                <input className="dnd-field" value={meta.subclass || ''} placeholder="Subclass"
                  onChange={e => handleUpdate({ meta: { ...meta, subclass: e.target.value } })} />
              </div>
            ) : (
              <>
                <span>{meta.race}</span>
                {meta.className && (
                  <span style={{ color: classColor }}>{meta.className} {level}</span>
                )}
                {meta.subclass && <span>{meta.subclass}</span>}
              </>
            )}
          </div>

          {!editMode && (
            <div className="dnd-sheet__meta-row">
              {meta.background && <span>{meta.background}</span>}
              {meta.alignment && <span>{meta.alignment}</span>}
            </div>
          )}

          {editMode && (
            <div className="dnd-sheet__subtitle-edit" style={{ marginTop: '0.25rem' }}>
              <input className="dnd-field" value={meta.background || ''} placeholder="Background"
                onChange={e => handleUpdate({ meta: { ...meta, background: e.target.value } })} />
              <input className="dnd-field" value={meta.alignment || ''} placeholder="Alignment"
                onChange={e => handleUpdate({ meta: { ...meta, alignment: e.target.value } })} />
            </div>
          )}
        </div>

        <div className="dnd-sheet__header-right">
          {campaignName && (
            <span className="dnd-sheet__campaign-name">{campaignName}</span>
          )}
          <button className="dnd-sheet__edit-toggle" onClick={() => setEditMode(!editMode)}>
            {editMode ? <><Eye size={14} /> View</> : <><Edit3 size={14} /> Edit</>}
          </button>
          <span className={`dnd-sheet__save-status dnd-sheet__save-status--${saveStatus}`}>
            {saveStatus === 'saving' && <><Loader size={12} className="dnd-sheet__spinner-sm" /> Saving...</>}
            {saveStatus === 'saved' && <><Check size={12} /> Saved</>}
            {saveStatus === 'unsaved' && 'Unsaved'}
          </span>
        </div>
      </div>

      {/* Top section: 3-row stat block */}
      <StatBlock character={character} editMode={editMode} onUpdate={handleUpdate} />

      {/* Tabs */}
      <div className="dnd-sheet__tabs">
        {tabs.map(t => (
          <button key={t.id}
            className={`dnd-sheet__tab ${tab === t.id ? 'dnd-sheet__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        {editMode && !hasSpellcasting && (
          <button className="dnd-sheet__tab dnd-sheet__tab--enable-spell"
            onClick={() => {
              const scDefaults = SPELLCASTING_DEFAULTS[meta.className];
              const fallback = { ability: 'WIS', type: 'prepared', slots: { '1': { max: 2, expended: 0 } }, cantrips: [], preparedSpells: [], knownSpells: [], spellOrder: { cantrips: [], prepared: [], known: [] }, concentratingOn: null };
              handleUpdate({ spellcasting: scDefaults || fallback });
            }}
            title="Enable spellcasting for this character"
          >
            + Spells
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="dnd-sheet__tab-content">
        {tab === 'combat' && (
          <div className="dnd-sheet__combat-2col">
            <div className="dnd-sheet__combat-col-left">
              <ClassFeatureBlock character={character} editMode={editMode} onUpdate={handleUpdate} />
              <ProficiencyTags proficiencies={character.proficiencies || {}}
                meta={meta} editMode={editMode} onUpdate={handleUpdate} />
              <SaveThrows abilities={abilities} saveProficiencies={character.saveProficiencies || []}
                level={level} editMode={editMode} onUpdate={handleUpdate} />
            </div>
            <div className="dnd-sheet__combat-col-right">
              <AttackList attacks={character.attacks || []} abilities={abilities}
                level={level} classFeature={character.classFeature}
                editMode={editMode} onUpdate={handleUpdate} />
            </div>
          </div>
        )}

        {tab === 'skills' && (
          <SkillList abilities={abilities}
            skillProficiencies={character.skillProficiencies || []}
            skillExpertise={character.skillExpertise || []}
            level={level} editMode={editMode} onUpdate={handleUpdate} />
        )}

        {tab === 'features' && (
          <FeatureList features={character.features || []}
            editMode={editMode} onUpdate={handleUpdate} />
        )}

        {tab === 'spells' && hasSpellcasting && (
          <SpellsTab character={character} editMode={editMode} onUpdate={handleUpdate} />
        )}

        {tab === 'info' && (
          <InfoPanel
            customBoxes={character.customBoxes || []}
            equipment={character.equipment || []}
            coins={character.coins || {}}
            editMode={editMode} onUpdate={handleUpdate} />
        )}

        {tab === 'notes' && hasCampaign && (
          <NotesTab campaignId={campaignId} />
        )}
      </div>

      {/* Rest buttons */}
      <div className="dnd-sheet__rest">
        <button className="dnd-sheet__rest-btn" onClick={shortRest}>Short Rest</button>
        <button className="dnd-sheet__rest-btn dnd-sheet__rest-btn--long" onClick={longRest}>Long Rest</button>
      </div>
    </div>
  );
}
