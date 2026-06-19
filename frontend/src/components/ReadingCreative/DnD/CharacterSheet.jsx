import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit3, Eye, Check, Loader } from 'lucide-react';
import StatBlock from './components/StatBlock';
import StatusBar from './components/StatusBar';
import AttackList from './components/AttackList';
import StatsTab from './components/StatsTab';
import FeatureList from './components/FeatureList';
import ProficiencyTags from './components/ProficiencyTags';
import InfoPanel from './components/InfoPanel';
import EquipmentTab from './components/EquipmentTab';
import ClassFeatureBlock from './components/ClassFeatures/ClassFeatureBlock';
import RacialBlock from './components/ClassFeatures/RacialBlock';
import SubclassBlock from './components/SubclassBlock';
import SpellsTab from './components/Spellcasting/SpellsTab';
import NotesTab from './components/CampaignNotes/NotesTab';
import TabManager from './components/TabManager';
import useAutosave from './components/useAutosave';
import useLocalStorageState from '../../../hooks/useLocalStorageState';
import { deepMerge, proficiencyBonus, CLASS_COLORS, CLASS_NAMES, CLASS_FEATURE_DEFAULTS, SPELLCASTING_DEFAULTS, SUBCLASS_LISTS, TAB_REGISTRY, reconcileTabsConfig } from './dndUtils';
import { RACES, getSubraces } from './classProgression';

export default function CharacterSheet({ characterId, initialEditMode, campaignId, onBack, onEditModeChange }) {
  const [character, setCharacter] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(initialEditMode || false);
  // Active tab persists per-character so a refresh reopens the same tab.
  const [tab, setTab] = useLocalStorageState(`lifeboard-dnd-tab-${characterId}`, 'combat');
  const prevClassRef = useRef(null);

  const saveStatus = useAutosave(character, characterId);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/dnd/characters/${characterId}`);
        if (!res.ok) throw new Error(`Character ${characterId} not found`);
        const data = await res.json();
        const charData = data.data;
        if (!charData) throw new Error(`Character ${characterId} has no data`);
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
        // Migrate split equipment lists -> single unified items array
        if (!charData.items && (charData.equippedItems || charData.carriedItems)) {
          const norm = (it, isEquipped) => ({
            id: it.id || Date.now() + Math.floor(Math.random() * 100000),
            name: it.name || '',
            quantity: it.quantity || 1,
            equipped: isEquipped,
            slot: it.slot || 'other',
            notes: it.notes || '',
          });
          charData.items = [
            ...(charData.equippedItems || []).map(it => norm(it, true)),
            ...(charData.carriedItems || []).map(it => norm(it, false)),
          ];
          delete charData.equippedItems;
          delete charData.carriedItems;
        }
        // Seed / reconcile per-character tab configuration against the registry
        charData.tabsConfig = reconcileTabsConfig(charData.tabsConfig, charData, !!campaignId);
        setCharacter(charData);
        prevClassRef.current = charData?.meta?.className || '';
      } catch (e) {
        console.error('Failed to load character:', e);
        // Stale persisted reference — drop back to the picker instead of a dead screen.
        setLoading(false);
        onBack?.();
        return;
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
    // Handle temp HP grant from Wild Shape (Spores)
    if (updates.classFeature?._grantTempHp) {
      const tempHp = updates.classFeature._grantTempHp;
      delete updates.classFeature._grantTempHp;
      setCharacter(prev => {
        const merged = deepMerge(prev, updates);
        if (tempHp > (merged.combat?.hpTemp || 0)) {
          merged.combat = { ...merged.combat, hpTemp: tempHp };
        }
        return merged;
      });
      return;
    }
    // Handle beast form transform — store real stats
    if (updates.classFeature?._beastTransform) {
      const beast = updates.classFeature._beastTransform;
      delete updates.classFeature._beastTransform;
      setCharacter(prev => {
        const merged = deepMerge(prev, updates);
        // Store real stats for revert
        merged._realStats = {
          combat: { ...prev.combat },
          abilities: { ...prev.abilities },
        };
        // Swap to beast stats
        merged.combat = {
          ...merged.combat,
          hpCurrent: beast.hp,
          hpMax: beast.hp,
          ac: beast.ac,
          acSource: `${beast.name} (Beast Form)`,
        };
        merged.abilities = {
          ...merged.abilities,
          STR: beast.ability_scores?.STR || 10,
          DEX: beast.ability_scores?.DEX || 10,
          CON: beast.ability_scores?.CON || 10,
        };
        return merged;
      });
      return;
    }
    setCharacter(prev => deepMerge(prev, updates));
  };

  // Beast form revert — when wild shape ends, restore real stats
  useEffect(() => {
    if (!character) return;
    const cf = character.classFeature;
    const realStats = character._realStats;
    if (realStats && (!cf?.active || cf?.activeForm !== 'monster')) {
      setCharacter(prev => {
        const restored = { ...prev };
        // Restore real HP, but apply overflow damage
        const beastHpLeft = prev.combat.hpCurrent;
        if (beastHpLeft <= 0) {
          // Beast dropped to 0 — overflow damage carries
          const overflowDmg = Math.abs(beastHpLeft);
          restored.combat = { ...realStats.combat, hpCurrent: Math.max(0, realStats.combat.hpCurrent - overflowDmg) };
        } else {
          restored.combat = { ...realStats.combat };
        }
        restored.abilities = { ...realStats.abilities };
        delete restored._realStats;
        return restored;
      });
    }
  }, [character?.classFeature?.activeForm, character?.classFeature?.active]);

  // Class change detection
  useEffect(() => {
    if (!character) return;
    const currentClass = character.meta?.className || '';
    if (prevClassRef.current !== null && currentClass !== prevClassRef.current && currentClass) {
      const defaults = CLASS_FEATURE_DEFAULTS[currentClass];
      if (defaults) {
        setCharacter(prev => ({ ...prev, classFeature: { ...defaults } }));
      }
      // Auto-seed spellcasting defaults for caster classes + enable the Spells tab
      const scDefaults = SPELLCASTING_DEFAULTS[currentClass];
      if (scDefaults && !character.spellcasting) {
        setCharacter(prev => ({
          ...prev,
          spellcasting: { ...scDefaults },
          tabsConfig: (prev.tabsConfig || []).map(t => t.id === 'spells' ? { ...t, enabled: true } : t),
        }));
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
      // Ancestral Guardian: Consult the Spirits resets on short rest
      if ('consultSpiritsUsed' in cf) {
        cf.consultSpiritsUsed = false;
      }
      // Rune Knight: rune invocations reset on short rest
      if (cf.runeInvocations) {
        const resetInvocations = {};
        for (const key of Object.keys(cf.runeInvocations)) {
          resetInvocations[key] = { usedCount: 0 };
        }
        cf.runeInvocations = resetInvocations;
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

    // Dragonborn Breath Weapon recharges on a short or long rest
    if (character.racialFeature?.breathWeaponUsed) {
      updates.racialFeature = { ...character.racialFeature, breathWeaponUsed: false };
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
      // For Barbarian rage, calculate max from level (not stored value)
      if (cf.type === 'rage') {
        const rageMax = level >= 20 ? 999 : level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2;
        cf.currentUses = rageMax;
        cf.maxUses = rageMax;
      } else if ('currentUses' in cf) {
        cf.currentUses = cf.maxUses || 0;
      }
      if ('currentPoints' in cf) cf.currentPoints = cf.maxPoints || 0;
      if ('active' in cf) cf.active = false;
      if (cf.type === 'action_surge') {
        cf.actionSurge = { ...cf.actionSurge, currentUses: cf.actionSurge?.maxUses || 1 };
        cf.secondWind = { ...cf.secondWind, currentUses: cf.secondWind?.maxUses || 1 };
      }
      // Fighter: Indomitable recharges on long rest
      if (cf.indomitable) {
        cf.indomitable = { ...cf.indomitable, currentUses: cf.indomitable.maxUses || 0 };
      }
      if (cf.layOnHands) {
        cf.layOnHands = { ...cf.layOnHands, currentPool: cf.layOnHands.maxPool || 0 };
      }
      if (cf.pactSlots) {
        cf.pactSlots = { ...cf.pactSlots, current: cf.pactSlots.max || 0 };
      }
      // Rune Knight: reset Giant's Might, rune invocations, Runic Shield
      if (cf.giantsMight) {
        cf.giantsMight = { ...cf.giantsMight, currentUses: cf.giantsMight.maxUses || 2, active: false };
      }
      if (cf.runeInvocations) {
        const resetInvocations = {};
        for (const key of Object.keys(cf.runeInvocations)) {
          resetInvocations[key] = { usedCount: 0 };
        }
        cf.runeInvocations = resetInvocations;
      }
      if (cf.runicShield) {
        cf.runicShield = { ...cf.runicShield, currentUses: cf.runicShield.maxUses || 1 };
      }
      // Circle of Stars: reset guiding bolt uses and cosmic omen
      if ('guidingBoltUsed' in cf) {
        cf.guidingBoltUsed = 0;
      }
      if (cf.cosmicOmen) {
        cf.cosmicOmen = { type: null, usesRemaining: 0 };
      }
      // Circle of Spores: reset fungal infestation, spreading spores
      if ('fungalInfestationUsed' in cf) {
        cf.fungalInfestationUsed = 0;
      }
      if (cf.spreadingSporesActive) {
        cf.spreadingSporesActive = false;
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

    // Long rest: racial use-limited traits (Stone's Endurance, Breath Weapon)
    if (character.racialFeature) {
      const rf = { ...character.racialFeature };
      if (rf.stoneEndurance) {
        const max = rf.stoneEndurance.maxUses || proficiencyBonus(character.meta?.level || 1);
        rf.stoneEndurance = { ...rf.stoneEndurance, currentUses: max };
      }
      if (rf.breathWeaponUsed) rf.breathWeaponUsed = false;
      if (rf.relentlessEnduranceUsed) rf.relentlessEnduranceUsed = false;
      if (rf.spellUses) rf.spellUses = {};
      if (rf.spellCounts) rf.spellCounts = {};
      updates.racialFeature = rf;
    }

    // Long rest: reduce exhaustion by 1 (if any), clear unconscious condition
    if (character.exhaustionLevel > 0) {
      updates.exhaustionLevel = character.exhaustionLevel - 1;
    }
    if (character.activeConditions?.length > 0) {
      updates.activeConditions = character.activeConditions.filter(c => c !== 'Unconscious');
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

  // Visible tabs derive from the per-character config, resolved against the registry.
  const tabRegistryMap = Object.fromEntries(TAB_REGISTRY.map(t => [t.id, t]));
  const tabsConfig = character.tabsConfig || [];
  const tabs = tabsConfig
    .filter(t => t.enabled)
    .map(t => tabRegistryMap[t.id])
    .filter(reg => reg && (!reg.requiresCampaign || hasCampaign));
  // Fall back to the first visible tab if the persisted tab is now hidden.
  const activeTab = tabs.some(t => t.id === tab) ? tab : (tabs[0]?.id || 'combat');

  // Persist tab config changes; enabling Spells seeds spellcasting defaults.
  const handleTabsConfigChange = (newConfig) => {
    const wasSpells = (character.tabsConfig || []).find(t => t.id === 'spells')?.enabled;
    const nowSpells = newConfig.find(t => t.id === 'spells')?.enabled;
    const updates = { tabsConfig: newConfig };
    if (nowSpells && !wasSpells && !character.spellcasting) {
      const scDefaults = SPELLCASTING_DEFAULTS[meta.className];
      updates.spellcasting = scDefaults ? { ...scDefaults } : {
        ability: 'WIS', type: 'prepared', slots: { '1': { max: 2, expended: 0 } },
        cantrips: [], preparedSpells: [], knownSpells: [],
        spellOrder: { cantrips: [], prepared: [], known: [] }, concentratingOn: null,
      };
    }
    handleUpdate(updates);
  };

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
                <select className="dnd-field" value={meta.race || ''}
                  onChange={e => handleUpdate({ meta: { ...meta, race: e.target.value, subrace: '' } })}>
                  <option value="">-- Race --</option>
                  {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                  {meta.race && !RACES.includes(meta.race) && (
                    <option value={meta.race}>{meta.race}</option>
                  )}
                </select>
                {getSubraces(meta.race).length > 0 && (
                  <select className="dnd-field" value={meta.subrace || ''}
                    onChange={e => handleUpdate({ meta: { ...meta, subrace: e.target.value } })}>
                    <option value="">-- Subrace --</option>
                    {getSubraces(meta.race).map(sr => <option key={sr} value={sr}>{sr}</option>)}
                  </select>
                )}
                <select className="dnd-field" value={meta.className || ''}
                  onChange={e => handleUpdate({ meta: { ...meta, className: e.target.value } })}>
                  <option value="">-- Class --</option>
                  {CLASS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" className="dnd-field dnd-field--sm" value={level} min={1} max={20}
                  onChange={e => handleUpdate({ meta: { ...meta, level: parseInt(e.target.value) || 1 } })} />
                <select className="dnd-field" value={meta.subclass || ''}
                  onChange={e => handleUpdate({ meta: { ...meta, subclass: e.target.value } })}>
                  <option value="">-- Subclass --</option>
                  {(SUBCLASS_LISTS[meta.className] || []).map(sc => (
                    <option key={sc.name} value={sc.name}>{sc.name}{sc.implemented ? '' : ' *'}</option>
                  ))}
                </select>
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
          <button className="dnd-sheet__edit-toggle" onClick={() => {
            const next = !editMode;
            setEditMode(next);
            onEditModeChange?.(next);
          }}>
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
      {/* Beast form banner */}
      {character.classFeature?.activeForm === 'monster' && character.classFeature?.monsterForm && (
        <div className="dnd-sheet__beast-banner">
          <span>Wild Shaped: <strong>{character.classFeature.monsterForm.name}</strong></span>
          {character._realStats && (
            <span className="dnd-sheet__beast-peek">
              Real HP: {character._realStats.combat.hpCurrent}/{character._realStats.combat.hpMax}
            </span>
          )}
        </div>
      )}

      {/* Top section: 3-row stat block */}
      <StatBlock character={character} editMode={editMode} onUpdate={handleUpdate} />

      {/* Status bar: inspiration, conditions, exhaustion */}
      <StatusBar character={character} onUpdate={handleUpdate} />

      {/* Edit-mode tab manager */}
      {editMode && (
        <TabManager config={tabsConfig} onChange={handleTabsConfigChange} hasCampaign={hasCampaign} />
      )}

      {/* Tabs */}
      <div className="dnd-sheet__tabs">
        {tabs.map(t => (
          <button key={t.id}
            className={`dnd-sheet__tab ${activeTab === t.id ? 'dnd-sheet__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="dnd-sheet__tab-content">
        {activeTab === 'combat' && (
          <div className="dnd-sheet__combat-2col">
            <div className="dnd-sheet__combat-col-left">
              <ClassFeatureBlock character={character} editMode={editMode} onUpdate={handleUpdate} />
              <RacialBlock character={character} onUpdate={handleUpdate} />
              <SubclassBlock character={character} editMode={editMode} onUpdate={handleUpdate} />
            </div>
            <div className="dnd-sheet__combat-col-right">
              {/* Beast form attacks + abilities overlay */}
              {character.classFeature?.activeForm === 'monster' && character.classFeature?.monsterForm && (
                <div className="dnd-sheet__beast-combat">
                  <div className="dnd-sheet__beast-attacks">
                    <h3 className="dnd-section-title">Beast Attacks</h3>
                    {(character.classFeature.monsterForm.attacks || []).map((atk, i) => (
                      <div key={i} className="dnd-sheet__beast-atk-card">
                        <div className="dnd-sheet__beast-atk-header">
                          <span className="dnd-attacks__name">{atk.name}</span>
                          <span className={`dnd-attacks__range-tag dnd-attacks__range-tag--${atk.attackRange || 'melee'}`}>
                            {(atk.attackRange || 'melee') === 'melee' ? 'Melee' : 'Ranged'}
                          </span>
                          {atk.toHit && <span className="dnd-attacks__hit">{atk.toHit} to hit</span>}
                        </div>
                        {atk.damage && <div className="dnd-attacks__damage">{atk.damage}</div>}
                        {atk.reach && <div className="dnd-attacks__props">Reach/Range: {atk.reach}</div>}
                        {atk.notes && <div className="dnd-attacks__props">{atk.notes}</div>}
                      </div>
                    ))}
                  </div>
                  {(character.classFeature.monsterForm.special_abilities || []).length > 0 && (
                    <div className="dnd-sheet__beast-abilities">
                      <h3 className="dnd-section-title">Special Abilities</h3>
                      {character.classFeature.monsterForm.special_abilities.map((ab, i) => (
                        <div key={i} className="dnd-sheet__beast-ability-card">{ab}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <AttackList attacks={character.attacks || []} abilities={abilities}
                level={level} classFeature={character.classFeature}
                editMode={editMode} onUpdate={handleUpdate} />
              <ProficiencyTags proficiencies={character.proficiencies || {}}
                meta={meta} editMode={editMode} onUpdate={handleUpdate} />
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <EquipmentTab character={character} editMode={editMode} onUpdate={handleUpdate} />
        )}

        {activeTab === 'stats' && (
          <StatsTab character={character} editMode={editMode} onUpdate={handleUpdate} />
        )}

        {activeTab === 'features' && (
          <FeatureList features={character.features || []}
            editMode={editMode} onUpdate={handleUpdate} level={level}
            className={meta.className} subclass={meta.subclass}
            classFeature={character.classFeature}
            race={meta.race} subrace={meta.subrace} racialFeature={character.racialFeature} />
        )}

        {activeTab === 'spells' && hasSpellcasting && (
          <SpellsTab character={character} editMode={editMode} onUpdate={handleUpdate} />
        )}

        {activeTab === 'info' && (
          <InfoPanel
            customBoxes={character.customBoxes || []}
            editMode={editMode} onUpdate={handleUpdate} />
        )}

        {activeTab === 'notes' && hasCampaign && (
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
