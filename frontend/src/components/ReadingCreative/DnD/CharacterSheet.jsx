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
import SubclassPicker from './components/SubclassPicker';
import SummonsPanel from './components/Summons/SummonsPanel';
import SpellsTab from './components/Spellcasting/SpellsTab';
import NotesTab from './components/CampaignNotes/NotesTab';
import EncyclopediaTab from './components/Encyclopedia/EncyclopediaTab';
import TabManager from './components/TabManager';
import HelpButton from './components/Help/HelpButton';
import TabHeader from './components/Help/TabHeader';
import LevelUpControls from './components/LevelUp/LevelUpControls';
import LevelUpModal from './components/LevelUp/LevelUpModal';
import { levelUpSummary } from './components/LevelUp/levelUpSummary';
import useAutosave from './components/useAutosave';
import useItemCache from './components/useItemCache';
import useLocalStorageState from '../../../hooks/useLocalStorageState';
import { computeAC, rechargeItems, resolveItem, weaponAttack, WEAPON_KINDS } from './rules/items';
import { deepMerge, proficiencyBonus, abilityMod, hpForClassLevel, subclassHpBonus, hitDieNumber, CLASS_COLORS, CLASS_NAMES, CLASS_FEATURE_DEFAULTS, SPELLCASTING_DEFAULTS, SUBCLASS_SPELLCASTING_DEFAULTS, SUBCLASS_LISTS, TAB_REGISTRY, reconcileTabsConfig, normalizeSpellcasting } from './dndUtils';
import { grantedMaxUses } from './components/Spellcasting/GrantedSpells';
import { RACES, getSubraces } from './classProgression';
import { getClass } from './rules/registry';

export default function CharacterSheet({ characterId, initialEditMode, campaignId, onBack, onEditModeChange }) {
  const [character, setCharacter] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(initialEditMode || false);
  // Level Up overlay: null | { mode: 'celebrate' | 'recap', level }
  const [levelUpView, setLevelUpView] = useState(null);
  // Subclass chooser overlay (opened from the level-up reveal or the sheet flag).
  const [subclassPickerOpen, setSubclassPickerOpen] = useState(false);
  // Active tab persists per-character so a refresh reopens the same tab.
  const [tab, setTab] = useLocalStorageState(`lifeboard-dnd-tab-${characterId}`, 'combat');
  // Inner Character / Summons switch within the Combat tab.
  const [combatSub, setCombatSub] = useLocalStorageState(`lifeboard-dnd-combatsub-${characterId}`, 'character');
  const prevClassRef = useRef(null);
  const prevSubclassRef = useRef(null);
  // Tracks the class|level the HP/hit-dice auto-calc last saw, so it only fires
  // on an actual change (never overwrites stored HP on load).
  const hpAutoKeyRef = useRef(null);

  const saveStatus = useAutosave(character, characterId);
  const itemCache = useItemCache(character?.items);

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
        prevSubclassRef.current = charData?.meta?.subclass || '';
        hpAutoKeyRef.current = `${charData?.meta?.className || ''}|${charData?.meta?.subclass || ''}|${charData?.meta?.level || 1}`;
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

  // Subclass third-casters (Eldritch Knight / Arcane Trickster): when chosen,
  // seed a blank spellcasting blob and enable the Spells tab, mirroring how
  // caster classes are handled. Skips the first run after load.
  useEffect(() => {
    if (!character) return;
    const currentSubclass = character.meta?.subclass || '';
    if (prevSubclassRef.current !== null && currentSubclass !== prevSubclassRef.current && currentSubclass) {
      const scDefaults = SUBCLASS_SPELLCASTING_DEFAULTS[currentSubclass];
      if (scDefaults && !character.spellcasting) {
        setCharacter(prev => ({
          ...prev,
          spellcasting: { ...scDefaults },
          tabsConfig: (prev.tabsConfig || []).map(t => t.id === 'spells' ? { ...t, enabled: true } : t),
        }));
      }
    }
    prevSubclassRef.current = currentSubclass;
  }, [character?.meta?.subclass]);

  // Auto-calc max HP + hit dice whenever level (or class) changes. Uses fixed
  // average values (no dice rolls): level 1 = max die + CON, each later level =
  // (die/2 + 1) + CON. Skips the first run after load so stored/manual HP is
  // never clobbered just by opening the sheet.
  useEffect(() => {
    if (!character) return;
    const className = character.meta?.className;
    const subclass = character.meta?.subclass;
    const lvl = character.meta?.level || 1;
    const key = `${className || ''}|${subclass || ''}|${lvl}`;
    const prevKey = hpAutoKeyRef.current;
    hpAutoKeyRef.current = key;
    if (prevKey === null || prevKey === key) return;

    const die = getClass(className)?.hitDie;
    const base = hpForClassLevel(die, lvl, abilityMod(character.abilities?.CON || 10));
    if (!base) return; // unknown class / hit die — leave HP under manual control
    // Layer on any subclass HP bonus (e.g. Draconic Resilience: +1 per sorcerer level).
    const derivedMax = base + subclassHpBonus(subclass, lvl);

    setCharacter(prev => {
      const combat = prev.combat || {};
      // Preserve both manual max-HP modifiers (a standing bonus like the Tough
      // feat, and a reduction like a max-HP drain) across level/class changes so
      // the recalculated value stays consistent.
      const newMax = Math.max(1, derivedMax + (combat.hpMaxBonus || 0) - (combat.hpMaxPenalty || 0));
      const delta = newMax - (combat.hpMax || 0);
      return {
        ...prev,
        combat: {
          ...combat,
          hpMax: newMax,
          // Carry the gain (or loss) into current HP, clamped to the new max.
          hpCurrent: Math.max(0, Math.min(newMax, (combat.hpCurrent || 0) + delta)),
          hitDiceType: hitDieNumber(die),
          hitDiceRemaining: lvl,
        },
      };
    });
  }, [character?.meta?.level, character?.meta?.className, character?.meta?.subclass]);

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
      // War Magic: end a short rest with no power surges → gain one.
      if (cf.powerSurge && (cf.powerSurge.current || 0) <= 0) {
        cf.powerSurge = { ...cf.powerSurge, current: 1 };
      }
      // Chronurgy: Arcane Abeyance recharges on a short or long rest.
      if ('abeyanceUsed' in cf) cf.abeyanceUsed = false;
      // Divination: The Third Eye recharges on a short or long rest.
      if (cf.thirdEye) cf.thirdEye = { benefit: null, used: false };
      // Illusion: Illusory Self recharges on a short or long rest.
      if ('illusorySelf' in cf) cf.illusorySelf = false;
      // Transmutation: free Polymorph (Shapechanger) recharges on a short or long rest.
      if ('shapechangerUsed' in cf) cf.shapechangerUsed = false;
      // Archfey: Fey Presence / Misty Escape / Dark Delirium recharge on short rest.
      if ('feyPresenceUsed' in cf) cf.feyPresenceUsed = false;
      if ('mistyEscapeUsed' in cf) cf.mistyEscapeUsed = false;
      if ('darkDeliriumUsed' in cf) cf.darkDeliriumUsed = false;
      // Bard: Font of Inspiration (5th+) recharges Bardic Inspiration on a short rest.
      if (cf.type === 'bardic_inspiration' && (character.meta?.level || 1) >= 5) {
        cf.currentUses = cf.maxUses || 0;
      }
      // Monk: ki recharges on a short or long rest.
      if (cf.type === 'ki_points') cf.currentPoints = cf.maxPoints || 0;
      // Sorcerer: Sorcerous Restoration (20th) regains 4 sorcery points on a short rest.
      if (cf.type === 'sorcery_points' && (character.meta?.level || 1) >= 20) {
        cf.currentPoints = Math.min(cf.maxPoints || 0, (cf.currentPoints || 0) + 4);
      }
      // Paladin: Channel Divinity recharges on a short or long rest.
      if (cf.channelDivinity) cf.channelDivinity = { ...cf.channelDivinity, current: cf.channelDivinity.max || 1 };
      // Ranger subclasses — short-or-long-rest abilities
      if ('detectPortalUsed' in cf) cf.detectPortalUsed = false;   // Horizon Walker
      if ('etherealStepUsed' in cf) cf.etherealStepUsed = false;   // Horizon Walker
      if ('nemesisUsed' in cf) cf.nemesisUsed = false;             // Monster Slayer
      if ('quarry' in cf) cf.quarry = '';                          // Monster Slayer: Slayer's Prey ends on a rest
      // Bard / College of Glamour: Enthralling Performance & Unbreakable Majesty recharge on a short rest.
      if ('enthrallingUsed' in cf) cf.enthrallingUsed = false;
      if ('unbreakableMajestyUsed' in cf) cf.unbreakableMajestyUsed = false;
      // College of Whispers: Words of Terror & Mantle of Whispers recharge on a short rest.
      if ('wordsOfTerrorUsed' in cf) cf.wordsOfTerrorUsed = false;
      if ('mantleWhispersUsed' in cf) cf.mantleWhispersUsed = false;
      // Battle Master superiority dice & Arcane Shot uses recharge on a short rest.
      if (cf.superiorityDice) cf.superiorityDice = { ...cf.superiorityDice, current: cf.superiorityDice.max || 0 };
      if (cf.arcaneShotUses) cf.arcaneShotUses = { ...cf.arcaneShotUses, current: cf.arcaneShotUses.max || 2 };
      // Echo Knight: Shadow Martyr recharges on a short rest.
      if ('shadowMartyrUsed' in cf) cf.shadowMartyrUsed = false;
      // Psi Warrior: the bonus-action Psionic Energy regain recharges on a short rest.
      if ('psiRegainUsed' in cf) cf.psiRegainUsed = false;
      // Circle of the Shepherd: Spirit Totem recharges on a short rest.
      if ('spiritTotemUsed' in cf) cf.spiritTotemUsed = false;
      // Divine Soul: Favored by the Gods recharges on a short rest.
      if ('favoredUsed' in cf) cf.favoredUsed = false;
      // Swashbuckler: Master Duelist recharges on a short rest.
      if ('masterDuelistUsed' in cf) cf.masterDuelistUsed = false;
      // Warlock subclasses — short-or-long-rest abilities
      if ('fathomlessPlungeUsed' in cf) cf.fathomlessPlungeUsed = false;  // Fathomless
      if ('darkLuckUsed' in cf) cf.darkLuckUsed = false;                  // Fiend: Dark One's Own Luck
      if ('entropicWardUsed' in cf) cf.entropicWardUsed = false;          // Great Old One
      if ('hexCurseUsed' in cf) { cf.hexCurseUsed = false; cf.curseTarget = ''; }  // Hexblade's Curse
      if ('indestructibleLifeUsed' in cf) cf.indestructibleLifeUsed = false;       // Undying
      if ('windSoulUsed' in cf) cf.windSoulUsed = false;                  // Storm Sorcery: Wind Soul
      updates.classFeature = cf;
    }

    // Spellcasting short-rest recovery: pact slots, short-rest extra sources,
    // and granted spells that recharge on a short rest.
    if (character.spellcasting) {
      const sc = normalizeSpellcasting(character.spellcasting, character.meta?.className);
      updates.spellcasting = {
        ...sc,
        pact: sc.casterType === 'pact' ? { ...sc.pact, expended: 0 } : sc.pact,
        extraSlots: (sc.extraSlots || []).map(e =>
          e.recharge === 'Short Rest' ? { ...e, expended: 0 } : e),
        grantedSpells: (sc.grantedSpells || []).map(g =>
          g.useType === 'per_short_rest' ? { ...g, used: 0 } : g),
      };
    }

    // Dragonborn Breath Weapon recharges on a short or long rest
    if (character.racialFeature?.breathWeaponUsed) {
      updates.racialFeature = { ...character.racialFeature, breathWeaponUsed: false };
    }

    // Item charges that recharge on a short rest.
    const charged = rechargeItems(character.items, 'short', itemCache);
    if (charged.changed) updates.items = charged.items;

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
      // Wizard: Arcane Recovery use returns; War Magic Power Surge resets to 1
      if (cf.arcaneRecovery) {
        cf.arcaneRecovery = { ...cf.arcaneRecovery, currentUses: cf.arcaneRecovery.maxUses || 1 };
      }
      if (cf.powerSurge) {
        cf.powerSurge = { ...cf.powerSurge, current: 1 };
      }
      // Wizard — School of Abjuration: the Arcane Ward fades; you can weave a new one.
      if (cf.arcaneWard) cf.arcaneWard = { hp: 0, created: false };
      // Wizard — Bladesinging: Bladesong uses refill; the song falls silent.
      if (cf.bladesong) cf.bladesong = { ...cf.bladesong, active: false, uses: { ...cf.bladesong.uses, current: cf.bladesong.uses?.max || 0 } };
      // Wizard — Chronurgy: Chronal Shift + Momentary Stasis refill; the bead recharges.
      if (cf.chronalShift) cf.chronalShift = { ...cf.chronalShift, current: cf.chronalShift.max || 2 };
      if (cf.momentaryStasis) cf.momentaryStasis = { ...cf.momentaryStasis, current: cf.momentaryStasis.max || 1 };
      if ('abeyanceUsed' in cf) cf.abeyanceUsed = false;
      // Wizard — School of Conjuration: Benign Transportation resets; conjured object fades.
      if ('benignTransportUsed' in cf) cf.benignTransportUsed = false;
      if (cf.minorConjuration) cf.minorConjuration = { ...cf.minorConjuration, active: false };
      // Wizard — School of Divination: Portent clears (re-enter your dawn d20s); The Third Eye resets.
      if (cf.portent) {
        const portentCount = (character.meta?.level || 1) >= 14 ? 3 : 2;
        cf.portent = { rolls: Array.from({ length: portentCount }, () => ({ v: null, used: false })) };
      }
      if (cf.thirdEye) cf.thirdEye = { benefit: null, used: false };
      // Wizard — School of Enchantment: Hypnotic Gaze releases.
      if (cf.hypnoticGaze) cf.hypnoticGaze = { ...cf.hypnoticGaze, active: false };
      // Wizard — School of Evocation: Overchannel backlash resets.
      if (cf.overchannel) cf.overchannel = { uses: 0 };
      // Wizard — Graviturgy: Adjust Density / Event Horizon end; Violent Attraction refills.
      if (cf.adjustDensity) cf.adjustDensity = { ...cf.adjustDensity, active: false };
      if (cf.violentAttraction) cf.violentAttraction = { ...cf.violentAttraction, current: cf.violentAttraction.max || 1 };
      if ('eventHorizonActive' in cf) cf.eventHorizonActive = false;
      if ('eventHorizonUsed' in cf) cf.eventHorizonUsed = false;
      // Wizard — School of Illusion: Illusory Self returns; made-real object fades.
      if ('illusorySelf' in cf) cf.illusorySelf = false;
      if (cf.illusoryReality) cf.illusoryReality = { ...cf.illusoryReality, active: false };
      // Wizard — Order of Scribes: Manifest Mind refills & dismisses; ritual, scroll & gambit reset.
      if (cf.manifestMind) cf.manifestMind = { ...cf.manifestMind, active: false, uses: { ...cf.manifestMind.uses, current: cf.manifestMind.uses?.max || 0 } };
      if ('awakenedRitualUsed' in cf) cf.awakenedRitualUsed = false;
      if (cf.masterScroll) cf.masterScroll = { ...cf.masterScroll, used: false };
      if (cf.oneWithWord) cf.oneWithWord = { used: false, lastRoll: null };
      // Wizard — School of Transmutation: free Polymorph returns; a shattered stone can be reforged.
      if ('shapechangerUsed' in cf) cf.shapechangerUsed = false;
      if (cf.transmutersStone?.consumed) cf.transmutersStone = { ...cf.transmutersStone, consumed: false };
      // Warlock Pact of the Talisman recharges on long rest
      if (cf.talisman) {
        cf.talisman = { ...cf.talisman, current: cf.talisman.max || 0 };
      }
      // Warlock Mystic Arcanum — each level's spell recharges on a long rest
      if (cf.mysticArcanum) {
        cf.mysticArcanum = Object.fromEntries(
          Object.entries(cf.mysticArcanum).map(([l, a]) => [l, { ...a, used: false }])
        );
      }
      // Cleric / Paladin Harness Divine Power pool recharges on long rest
      if (cf.harnessDivinePower) {
        cf.harnessDivinePower = { ...cf.harnessDivinePower, current: cf.harnessDivinePower.max || 0 };
      }
      // Paladin: Divine Sense, Channel Divinity, Cleansing Touch recharge on long rest
      if (cf.divineSense) cf.divineSense = { ...cf.divineSense, current: cf.divineSense.max || 0 };
      if (cf.channelDivinity) cf.channelDivinity = { ...cf.channelDivinity, current: cf.channelDivinity.max || 1 };
      if (cf.cleansingTouch) cf.cleansingTouch = { ...cf.cleansingTouch, current: cf.cleansingTouch.max || 0 };
      // Ranger: Favored Foe, Nature's Veil, Tireless recharge on long rest
      if (cf.favoredFoe) cf.favoredFoe = { ...cf.favoredFoe, current: cf.favoredFoe.max || 0 };
      if (cf.naturesVeil) cf.naturesVeil = { ...cf.naturesVeil, current: cf.naturesVeil.max || 0 };
      if (cf.tireless) cf.tireless = { ...cf.tireless, current: cf.tireless.max || 0 };
      // Ranger subclasses — recharge on long rest (also covers their short-rest abilities)
      if ('detectPortalUsed' in cf) cf.detectPortalUsed = false;     // Horizon Walker
      if ('etherealStepUsed' in cf) cf.etherealStepUsed = false;     // Horizon Walker
      if ('nemesisUsed' in cf) cf.nemesisUsed = false;               // Monster Slayer
      if ('quarry' in cf) cf.quarry = '';                            // Monster Slayer: Slayer's Prey
      if ('huntersSenseUsed' in cf) cf.huntersSenseUsed = 0;         // Monster Slayer
      if ('writhingTideUsed' in cf) cf.writhingTideUsed = 0;         // Swarmkeeper
      if ('swarmDispersalUsed' in cf) cf.swarmDispersalUsed = 0;     // Swarmkeeper
      if ('drakeBreathUsed' in cf) cf.drakeBreathUsed = false;       // Drakewarden
      if ('reflexUsed' in cf) cf.reflexUsed = 0;                     // Drakewarden
      if ('summonFeyUsed' in cf) cf.summonFeyUsed = false;           // Fey Wanderer
      if ('mistyStepUsed' in cf) cf.mistyStepUsed = 0;               // Fey Wanderer
      // Paladin oaths — once-per-long-rest survival / capstone abilities
      if ('undyingSentinelUsed' in cf) cf.undyingSentinelUsed = false;        // Ancients
      if ('elderChampionUsed' in cf) cf.elderChampionUsed = false;            // Ancients
      if ('invincibleConquerorUsed' in cf) cf.invincibleConquerorUsed = false; // Conquest
      if ('exaltedChampionUsed' in cf) cf.exaltedChampionUsed = false;        // Crown
      if ('holyNimbusUsed' in cf) cf.holyNimbusUsed = false;                  // Devotion
      if ('gloriousDefenseUsed' in cf) cf.gloriousDefenseUsed = 0;            // Glory
      if ('livingLegendUsed' in cf) cf.livingLegendUsed = false;             // Glory
      if ('avengingAngelUsed' in cf) cf.avengingAngelUsed = false;           // Vengeance
      if ('mortalBulwarkUsed' in cf) cf.mortalBulwarkUsed = false;           // Watchers
      if ('dreadLordUsed' in cf) cf.dreadLordUsed = false;                   // Oathbreaker
      // Archfey: short-or-long-rest abilities also recharge on a long rest
      if ('feyPresenceUsed' in cf) cf.feyPresenceUsed = false;
      if ('mistyEscapeUsed' in cf) cf.mistyEscapeUsed = false;
      if ('darkDeliriumUsed' in cf) cf.darkDeliriumUsed = false;
      // Warlock — Celestial: Healing Light pool refills; Searing Vengeance resets.
      if (cf.healingLight) cf.healingLight = { ...cf.healingLight, current: cf.healingLight.max || 0 };
      if ('searingVengeanceUsed' in cf) cf.searingVengeanceUsed = false;
      // Warlock — Fathomless: tentacle uses refill & dismiss; Grasping/Plunge reset.
      if ('tentacleUses' in cf) cf.tentacleUses = 0;
      if ('tentacleActive' in cf) cf.tentacleActive = false;
      if ('graspingUsed' in cf) cf.graspingUsed = false;
      if ('fathomlessPlungeUsed' in cf) cf.fathomlessPlungeUsed = false;
      // Warlock — Fiend: Dark One's Own Luck & Hurl Through Hell reset (resistance persists).
      if ('darkLuckUsed' in cf) cf.darkLuckUsed = false;
      if ('hurlUsed' in cf) cf.hurlUsed = false;
      // Warlock — Genie: Bottled Respite & Elemental Flight reset (Limited Wish is manual: 1d4 rests).
      if ('bottledRespiteUsed' in cf) cf.bottledRespiteUsed = false;
      if ('genieFlightUsed' in cf) cf.genieFlightUsed = 0;
      // Warlock — Great Old One: Entropic Ward resets (thrall persists).
      if ('entropicWardUsed' in cf) cf.entropicWardUsed = false;
      // Warlock — Hexblade: Curse & Accursed Specter reset (curse target clears).
      if ('hexCurseUsed' in cf) { cf.hexCurseUsed = false; cf.curseTarget = ''; }
      if ('specterBound' in cf) cf.specterBound = false;
      // Warlock — Undead: Form of Dread uses refill & end; Spirit Projection resets (Husk is manual: 1d4 rests).
      if ('formDreadUses' in cf) cf.formDreadUses = 0;
      if ('formDreadActive' in cf) cf.formDreadActive = false;
      if ('spiritProjectionUsed' in cf) cf.spiritProjectionUsed = false;
      // Warlock — Undying: Defy Death & Indestructible Life reset.
      if ('defyDeathUsed' in cf) cf.defyDeathUsed = false;
      if ('indestructibleLifeUsed' in cf) cf.indestructibleLifeUsed = false;
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
      // Path of the Beast: Infectious Fury and Call the Hunt refill on a long rest
      if (cf.infectiousFury) {
        cf.infectiousFury = { ...cf.infectiousFury, currentUses: cf.infectiousFury.maxUses || 0 };
      }
      if (cf.callTheHunt) {
        cf.callTheHunt = { ...cf.callTheHunt, currentUses: cf.callTheHunt.maxUses || 0 };
      }
      // Path of Wild Magic: Magic Awareness and Bolstering Magic refill; clear surge
      if (cf.magicAwareness) {
        cf.magicAwareness = { ...cf.magicAwareness, currentUses: cf.magicAwareness.maxUses || 0 };
      }
      if (cf.bolsteringMagic) {
        cf.bolsteringMagic = { ...cf.bolsteringMagic, currentUses: cf.bolsteringMagic.maxUses || 0 };
      }
      if (cf.wildSurge) cf.wildSurge = { current: null, options: null };
      // Path of the Zealot: Zealous Presence (long rest) and Fanatical Focus reset
      if ('zealousPresenceUsed' in cf) cf.zealousPresenceUsed = false;
      if ('fanaticalFocusUsed' in cf) cf.fanaticalFocusUsed = false;
      // College of Eloquence: Universal Speech + Infectious Inspiration refill
      if ('universalSpeechUsed' in cf) cf.universalSpeechUsed = false;
      if (cf.infectiousInspiration) {
        cf.infectiousInspiration = { ...cf.infectiousInspiration, currentUses: cf.infectiousInspiration.maxUses || 0 };
      }
      // College of Glamour: Enthralling Performance, Mantle of Majesty, Unbreakable Majesty
      if ('enthrallingUsed' in cf) cf.enthrallingUsed = false;
      if ('mantleMajestyUsed' in cf) cf.mantleMajestyUsed = false;
      if ('unbreakableMajestyUsed' in cf) cf.unbreakableMajestyUsed = false;
      // College of Creation: Performance of Creation + Animating Performance
      if ('performanceCreationUsed' in cf) cf.performanceCreationUsed = false;
      if ('animatingUsed' in cf) cf.animatingUsed = false;
      // College of Spirits: Spirit Session refills; retained tale fades on a long rest
      if ('spiritSessionUsed' in cf) cf.spiritSessionUsed = false;
      if (cf.spiritTale) cf.spiritTale = { current: null, options: null, bestowed: false };
      // College of Whispers: short-rest features also reset, plus Shadow Lore (long rest)
      if ('wordsOfTerrorUsed' in cf) cf.wordsOfTerrorUsed = false;
      if ('mantleWhispersUsed' in cf) cf.mantleWhispersUsed = false;
      if ('shadowLoreUsed' in cf) cf.shadowLoreUsed = false;
      // Battle Master / Arcane Archer: pools also refill on a long rest.
      if (cf.superiorityDice) cf.superiorityDice = { ...cf.superiorityDice, current: cf.superiorityDice.max || 0 };
      if (cf.arcaneShotUses) cf.arcaneShotUses = { ...cf.arcaneShotUses, current: cf.arcaneShotUses.max || 2 };
      // Echo Knight: Unleash Incarnation + Reclaim Potential refill; Shadow Martyr resets.
      if (cf.unleashIncarnation) cf.unleashIncarnation = { ...cf.unleashIncarnation, current: cf.unleashIncarnation.max || 0 };
      if (cf.reclaimPotential) cf.reclaimPotential = { ...cf.reclaimPotential, current: cf.reclaimPotential.max || 0 };
      if ('shadowMartyrUsed' in cf) cf.shadowMartyrUsed = false;
      // Cavalier: Unwavering Mark + Warding Maneuver refill on a long rest.
      if (cf.unwaveringMark) cf.unwaveringMark = { ...cf.unwaveringMark, current: cf.unwaveringMark.max || 0 };
      if (cf.wardingManeuver) cf.wardingManeuver = { ...cf.wardingManeuver, current: cf.wardingManeuver.max || 0 };
      // Psi Warrior: Psionic Energy refills; bonus-action regain resets.
      if (cf.psionicEnergy) cf.psionicEnergy = { ...cf.psionicEnergy, current: cf.psionicEnergy.max || 0 };
      if ('psiRegainUsed' in cf) cf.psiRegainUsed = false;
      // Samurai: Fighting Spirit refills; Strength Before Death resets.
      if (cf.fightingSpirit) cf.fightingSpirit = { ...cf.fightingSpirit, current: cf.fightingSpirit.max || 3 };
      if ('strengthBeforeDeathUsed' in cf) cf.strengthBeforeDeathUsed = false;
      // Circle of Dreams: Balm dice + Hidden Paths refill; Walker in Dreams resets.
      if (cf.balmDice) cf.balmDice = { ...cf.balmDice, current: cf.balmDice.max || 0 };
      if (cf.hiddenPaths) cf.hiddenPaths = { ...cf.hiddenPaths, current: cf.hiddenPaths.max || 0 };
      if ('walkerUsed' in cf) cf.walkerUsed = false;
      // Circle of the Land: Natural Recovery resets on a long rest.
      if ('naturalRecoveryUsed' in cf) cf.naturalRecoveryUsed = false;
      // Circle of the Shepherd: Spirit Totem + Faithful Summons reset.
      if ('spiritTotemUsed' in cf) cf.spiritTotemUsed = false;
      if ('faithfulSummonsUsed' in cf) cf.faithfulSummonsUsed = false;
      // Circle of Wildfire: Cauterizing Flames refills; Blazing Revival resets; spirit fades.
      if (cf.cauterizingFlames) cf.cauterizingFlames = { ...cf.cauterizingFlames, current: cf.cauterizingFlames.max || 0 };
      if ('blazingRevivalUsed' in cf) cf.blazingRevivalUsed = false;
      if ('wildfireSpirit' in cf) cf.wildfireSpirit = false;
      // Aberrant Mind: Warping Implosion resets; Revelation transform ends.
      if ('warpingUsed' in cf) cf.warpingUsed = false;
      if ('revelationBenefits' in cf) cf.revelationBenefits = {};
      // Clockwork Soul: Restore Balance refills; Bastion ward fades; Trance/Cavalcade reset.
      if (cf.restoreBalance) cf.restoreBalance = { ...cf.restoreBalance, current: cf.restoreBalance.max || 0 };
      if (cf.bastionWard) cf.bastionWard = { dice: 0 };
      if ('tranceUsed' in cf) cf.tranceUsed = false;
      if ('cavalcadeUsed' in cf) cf.cavalcadeUsed = false;
      // Divine Soul: Favored by the Gods + Unearthly Recovery reset; wings furl.
      if ('favoredUsed' in cf) cf.favoredUsed = false;
      if ('unearthlyUsed' in cf) cf.unearthlyUsed = false;
      if ('angelicWings' in cf) cf.angelicWings = false;
      // Draconic Bloodline: wings furl on a long rest.
      if ('dragonWings' in cf) cf.dragonWings = false;
      // Shadow Magic: Strength of the Grave, Hound of Ill Omen, Umbral Form reset.
      if ('strengthGraveUsed' in cf) cf.strengthGraveUsed = false;
      if ('houndActive' in cf) cf.houndActive = false;
      if ('umbralForm' in cf) cf.umbralForm = false;
      // Storm Sorcery: Wind Soul flight-share resets.
      if ('windSoulUsed' in cf) cf.windSoulUsed = false;
      // Wild Magic: Tides of Chaos resets; clear the last surge readout.
      if ('tidesUsed' in cf) cf.tidesUsed = false;
      if (cf.surge) cf.surge = { a: null, b: null };
      // Lunar Sorcery: free casts + Lunar Boons refill; Phenomenon resets (phase persists).
      if (cf.lunarFreeCast) cf.lunarFreeCast = {};
      if (cf.lunarBoons) cf.lunarBoons = { ...cf.lunarBoons, current: cf.lunarBoons.max || 0 };
      if ('lunarPhenomenonUsed' in cf) cf.lunarPhenomenonUsed = false;
      // Inquisitive: Unerring Eye refills; the Insightful Fighting read clears.
      if (cf.unerringEye) cf.unerringEye = { ...cf.unerringEye, current: cf.unerringEye.max || 0 };
      if ('insightfulTarget' in cf) cf.insightfulTarget = false;
      // Phantom: Wails refill; Ghost Walk resets; Death's Friend grants a trinket if none.
      if (cf.wailsFromGrave) cf.wailsFromGrave = { ...cf.wailsFromGrave, current: cf.wailsFromGrave.max || 0 };
      if ('ghostWalkUsed' in cf) cf.ghostWalkUsed = false;
      if ('ghostWalkActive' in cf) cf.ghostWalkActive = false;
      if (typeof cf.soulTrinkets === 'number' && cf.soulTrinkets === 0 && level >= 17) cf.soulTrinkets = 1;
      // Soulknife: Psychic Veil + Rend Mind reset (Psionic Energy refills with Psi Warrior's reset above).
      if ('psychicVeilUsed' in cf) cf.psychicVeilUsed = false;
      if ('psychicVeilActive' in cf) cf.psychicVeilActive = false;
      if ('rendMindUsed' in cf) cf.rendMindUsed = false;
      // Arcane Trickster: Spell Thief; Swashbuckler: Master Duelist (also short rest).
      if ('spellThiefUsed' in cf) cf.spellThiefUsed = false;
      if ('masterDuelistUsed' in cf) cf.masterDuelistUsed = false;
      // Circle of Spores: reset fungal infestation, spreading spores
      if ('fungalInfestationUsed' in cf) {
        cf.fungalInfestationUsed = 0;
      }
      if (cf.spreadingSporesActive) {
        cf.spreadingSporesActive = false;
      }
      updates.classFeature = cf;
    }

    // Long rest: recover all spell slots, pact slots, extra sources, granted
    // uses, and clear concentration.
    if (character.spellcasting) {
      const sc = normalizeSpellcasting(character.spellcasting, character.meta?.className);
      const prof = proficiencyBonus(character.meta?.level || 1);
      updates.spellcasting = {
        ...sc,
        concentratingOn: null,
        // Explicit zeros (not {}) so deepMerge actually clears expended levels.
        slotsExpended: Object.fromEntries(Object.keys(sc.slotsExpended || {}).map(l => [l, 0])),
        pact: { ...sc.pact, expended: 0 },
        extraSlots: (sc.extraSlots || []).map(e => ({ ...e, expended: 0 })),
        grantedSpells: (sc.grantedSpells || []).map(g =>
          g.useType === 'at_will' ? g : { ...g, used: 0, max: grantedMaxUses(g, prof) }),
      };
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

    // Item charges that recharge at dawn / on a long (or short) rest.
    const charged = rechargeItems(character.items, 'long', itemCache);
    if (charged.changed) updates.items = charged.items;

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
  // Subclass-choice flag: at/past the class's subclass level with none chosen.
  const classNode = getClass(meta.className);
  const subclassLevel = classNode?.subclassLevel || null;
  const subclassLabel = classNode?.subclassLabel || 'Subclass';
  const subclassDue = !!meta.className && !meta.subclass && !!subclassLevel && level >= subclassLevel;
  const profBonus = proficiencyBonus(level);
  const hasSpellcasting = !!character.spellcasting;

  const hasCampaign = !!campaignId;

  // ── Level Up ──
  // Leveling is a normal player action (available any time, like resting). It
  // bumps meta.level — HP, slots, proficiency, and features all re-derive from
  // that — and opens the celebratory reveal for the level just reached.
  const doLevelUp = () => {
    if (level >= 20) return;
    const newLevel = level + 1;
    handleUpdate({ meta: { ...meta, level: newLevel } });
    setLevelUpView({ mode: 'celebrate', level: newLevel });
  };
  const openRecap = () => setLevelUpView({ mode: 'recap', level });

  // ── Equipment-derived combat values ──────────────────────────────────────────
  // Resolve every equipped, library-backed item once, then derive AC and the
  // read-only "from equipment" attack cards from it.
  const equippedResolved = (character.items || [])
    .filter(it => it.equipped && it.refType === 'item' && itemCache[it.refId])
    .map(it => resolveItem(it, itemCache[it.refId]));
  const derivedAC = computeAC(character, equippedResolved, abilities);
  const derivedAttacks = equippedResolved
    .filter(r => WEAPON_KINDS.has(r.kind))
    .map(r => weaponAttack(r, abilities, level, { proficient: r.instance.proficient !== false }))
    .filter(Boolean);

  // Visible tabs derive from the per-character config, resolved against the registry.
  const tabRegistryMap = Object.fromEntries(TAB_REGISTRY.map(t => [t.id, t]));
  const tabsConfig = character.tabsConfig || [];
  const tabs = tabsConfig
    .filter(t => t.enabled)
    .map(t => tabRegistryMap[t.id])
    .filter(reg => reg && (!reg.requiresCampaign || hasCampaign));
  // Fall back to the first visible tab if the persisted tab is now hidden.
  const activeTab = tabs.some(t => t.id === tab) ? tab : (tabs[0]?.id || 'combat');
  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || '';

  // Persist tab config changes; enabling Spells seeds spellcasting defaults.
  const handleTabsConfigChange = (newConfig) => {
    const wasSpells = (character.tabsConfig || []).find(t => t.id === 'spells')?.enabled;
    const nowSpells = newConfig.find(t => t.id === 'spells')?.enabled;
    const updates = { tabsConfig: newConfig };
    if (nowSpells && !wasSpells && !character.spellcasting) {
      const scDefaults = SPELLCASTING_DEFAULTS[meta.className];
      // Non-caster classes manually enabling Spells get a generic full-caster
      // scaffold (normalizeSpellcasting fills any gaps).
      updates.spellcasting = scDefaults
        ? { ...scDefaults }
        : normalizeSpellcasting({ ability: 'WIS', casterType: 'full', preparation: 'prepared' }, meta.className);
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
          <div className="dnd-sheet__name-row">
            {editMode ? (
              <input className="dnd-sheet__name-input" value={meta.name || ''}
                onChange={e => handleUpdate({ meta: { ...meta, name: e.target.value } })}
                placeholder="Character Name" />
            ) : (
              <h1 className="dnd-sheet__name">{meta.name || 'Unnamed'}</h1>
            )}
            <HelpButton topic="topbar" label="About your vital stats (HP, AC, dice…)" size={18} />
          </div>

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
                {subclassDue && (
                  <button
                    className="dnd-sheet__subclass-flag"
                    onClick={() => setSubclassPickerOpen(true)}
                    title={`Choose your ${subclassLabel}`}
                  >
                    Choose {subclassLabel}
                  </button>
                )}
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

        <LevelUpControls level={level} onLevelUp={doLevelUp} onRecap={openRecap} />

        <div className="dnd-sheet__header-right">
          {campaignName && (
            <span className="dnd-sheet__campaign-name">{campaignName}</span>
          )}
          <div className="dnd-sheet__edit-row">
            <HelpButton topic="editmode" label="About Edit mode" size={18} />
            <button className="dnd-sheet__edit-toggle" onClick={() => {
              const next = !editMode;
              setEditMode(next);
              onEditModeChange?.(next);
            }}>
              {editMode ? <><Eye size={14} /> View</> : <><Edit3 size={14} /> Edit</>}
            </button>
          </div>
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
      <StatBlock character={character} editMode={editMode} onUpdate={handleUpdate} derivedAC={derivedAC} />

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
        {/* Encyclopedia has its own "Encyclopedia" heading (with the ? inline). */}
        {activeTab !== 'encyclopedia' && <TabHeader topic={activeTab} title={activeTabLabel} />}
        {activeTab === 'combat' && (
          <>
          <div className={`dnd-sheet__subtabs dnd-sheet__subtabs--${combatSub}`}>
            <span className="dnd-sheet__subtabs-thumb" aria-hidden="true" />
            <button
              className="dnd-sheet__subtab dnd-sheet__subtab--left"
              aria-pressed={combatSub === 'character'}
              onClick={() => setCombatSub('character')}>
              <span className="dnd-sheet__subtab-label">Character</span>
            </button>
            <button
              className="dnd-sheet__subtab dnd-sheet__subtab--right"
              aria-pressed={combatSub === 'summons'}
              onClick={() => setCombatSub('summons')}>
              <span className="dnd-sheet__subtab-label">Summons</span>
              {(character.summons || []).length > 0 && (
                <span className="dnd-sheet__subtab-badge">{(character.summons || []).length}</span>
              )}
            </button>
          </div>
          {combatSub === 'summons' ? (
            <SummonsPanel character={character} onUpdate={handleUpdate} />
          ) : (
          <div className="dnd-sheet__combat-2col">
            <div className="dnd-sheet__combat-col-left">
              <ClassFeatureBlock character={character} editMode={editMode} onUpdate={handleUpdate} />
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
                derivedAttacks={derivedAttacks}
                editMode={editMode} onUpdate={handleUpdate} />
              <RacialBlock character={character} onUpdate={handleUpdate} />
              <ProficiencyTags proficiencies={character.proficiencies || {}}
                meta={meta} editMode={editMode} onUpdate={handleUpdate} />
            </div>
          </div>
          )}
          </>
        )}

        {activeTab === 'equipment' && (
          <EquipmentTab character={character} editMode={editMode} onUpdate={handleUpdate} itemCache={itemCache} />
        )}

        {activeTab === 'stats' && (
          <StatsTab character={character} editMode={editMode} onUpdate={handleUpdate} />
        )}

        {activeTab === 'features' && (
          <FeatureList features={character.features || []}
            editMode={editMode} onUpdate={handleUpdate} level={level}
            className={meta.className} subclass={meta.subclass}
            classFeature={character.classFeature} abilities={character.abilities}
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

        {activeTab === 'encyclopedia' && (
          <EncyclopediaTab editMode={editMode} />
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

      {levelUpView && (
        <LevelUpModal
          summary={levelUpSummary(character, levelUpView.level)}
          mode={levelUpView.mode}
          character={character}
          onUpdate={handleUpdate}
          onChooseSubclass={() => setSubclassPickerOpen(true)}
          onClose={() => setLevelUpView(null)}
        />
      )}

      {subclassPickerOpen && meta.className && (
        <SubclassPicker
          className={meta.className}
          subclassLabel={subclassLabel}
          currentSubclass={meta.subclass}
          onConfirm={(name) => { handleUpdate({ meta: { subclass: name } }); setSubclassPickerOpen(false); }}
          onClose={() => setSubclassPickerOpen(false)}
        />
      )}
    </div>
  );
}
