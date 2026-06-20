# D&D Rules Registry — Refactor & Foundation Plan

## Why
Four upcoming features (character creation, level-up, encyclopedia, spell tagging)
are all *readers* of the same rules data the character sheet already uses. Today
that data is a 1,350-line monolith (`classProgression.js`) plus a hand-synced
menu (`SUBCLASS_LISTS`) plus name-dispatch (`SubclassBlock` if/else). To scale to
100+ subclasses **and** feed the new features, we convert it into one rich,
navigable **rules tree** that every consumer reads through a single API.

Guiding principle: **one standardized source of truth per fact; everything else
derives.** No feature gets its own private copy of class/race info.

---

## 1. The shared node schema (`rules/types.js`)

Every race / subrace / class / subclass becomes a **node**. Nodes carry three
layers so a single node serves the sheet, creation (shallow), and encyclopedia
(deep) — note: creation and encyclopedia read the *same* data, just render to
different depth.

```
FeatureEntry = {
  id, name, level, source,
  desc,                 // full mechanical text
  combat?: boolean,     // has a Combat-tab tracker
  choice?: string,      // inline build-choice id (e.g. 'metamagic')
  options?: string[],   // choices for that picker
}

Node = {
  id, name,
  type: 'class' | 'subclass' | 'race' | 'subrace',
  parentId?: string,    // tree edge UP   (subclass→class, subrace→race)
  childIds: string[],   // tree edges DOWN

  // ── OVERVIEW layer (creation lands here; encyclopedia headlines with it) ──
  tagline?: string,                       // one-liner
  overview: string,                       // 1–2 paragraph playstyle / flavor
  definingFeature: { name, desc },        // the single most iconic hook

  // ── LORE layer (encyclopedia "fluff") ──
  lore?: {                                // freeform, type-specific sections
    // races:   lifespan, society, physical, names, ...
    // classes: role, party-fit, subclass-branching summary, ...
  },

  // ── MECHANICAL layer (the deep drill-in) ──
  progression: FeatureEntry[],            // level-gated, sorted

  // ── type-specific mechanical config (see below) ──
  ...
}
```

### ClassNode (folds in the SIX scattered per-class sources)
```
ClassNode = Node & {
  caster: { ability, type, preparation } | null,   // was CLASS_CASTER_PROFILE
  hitDie: 'd6' | 'd8' | 'd10' | 'd12',
  trackerSeed: {...} | null,                        // was CLASS_FEATURE_DEFAULTS
  blockId?: string,                                 // component-registry key (NO React import)
  helpers: { [name]: (level)=>any },                // co-located scaling fns
  spellList?: string,                               // tag joining to DB spells (feature 3.5)
  subclassLabel: string,                            // 'Arcane Tradition', 'Sacred Oath'...
  subclassLevel: number,                            // when the subclass is chosen
  // childIds = its subclass ids   (replaces SUBCLASS_LISTS)
  creation: {
    startingCantrips?: number,
    startingSpells?: number,
    savingThrows: [ability, ability],
    skillChoices?: { count, from: [] },
    ...
  },
}
```

### SubclassNode
```
SubclassNode = Node & {
  // parentId = its class id
  blockId?: string,
  // implemented is DERIVED: progression.length > 0  (no stored flag)
}
```

### RaceNode / SubraceNode
```
RaceNode = Node & {
  abilityBonuses: { [ability]: number },   // DEFAULT racial ASI (see §4) — authored from
                                           // canonical 5e where the current prose lacks it
  speed, size, creatureType,
  blockId?: string,
  // childIds = its subrace ids
  // progression == its traits[]
}
SubraceNode = Node & { abilityBonuses, /* parentId = race */ }
```

---

## 2. The registry & query API (`rules/registry.js`)

One module assembles all nodes and is the **only** read surface.

```
getNode(id)                         // any node
getClass / getRace / getSubclass / getSubrace (id)
getRoots('class' | 'race')          // tops of the two trees (encyclopedia + creation lists)
getChildren(id) / getParent(id)     // tree navigation (encyclopedia, creation drill-down)

getNodeDetail(id)                   // ⭐ the SHARED surface creation + encyclopedia both read.
                                    //    Returns { overview, definingFeature, lore, progression,
                                    //    children, creation }. Creation renders shallow; the
                                    //    encyclopedia renders deep. Same call, one truth.

getUnlockedFeatures(sel, level)     // features at level ≤ L  (sheet Features tab — exists today)
featuresUnlockedAt(sel, level)      // features at level == L  (level-up diff — NEW, ~5 lines)
```

`sel` = `{ className, subclass, race, subrace }` (the character's selections).

During migration, keep `CLASS_PROGRESSION` / `SUBCLASS_LISTS` / etc. as **thin
re-exports** off the registry so nothing breaks while files move.

---

## 3. Component registry (kills the dispatch list)

`components/ClassFeatures/registry.js`:
```
export const BLOCKS = { WizardBlock, WarMagicBlock, RuneKnightBlock, ... };
```
`SubclassBlock` and `ClassFeatureBlock` become: look up `BLOCKS[node.blockId]`
and render it. No `if/else`, no `switch`. **Adding a subclass = add one data
module + (optionally) one block file + one registry line.** Zero edits to central
dispatch.

---

## 4. Racial ability bonuses — kept LOOSE (per your note)

- **Race/subrace node** holds the *default* `abilityBonuses` (e.g. Elf `{DEX:2}`,
  High Elf `{INT:1}`). Authored from canonical 5e; where current prose omits it,
  fill on best-knowledge — errors are player-correctable by design.
- **Character data** gains `abilityBonusAllocation` — defaults to the summed
  race+subrace map but is **freely editable** (move a +2 from DEX to STR).
- **Derived:** `effectiveAbilities(character) = pointBuyBase + abilityBonusAllocation`.

So: race node = single source for the *default*, character = single source for the
*placement*, sheet = *derives* the total. Loose, but still one truth per fact.

---

## 5. Spell tagging (feature 3.5 — gates creation P5)

- DB: add a class-tag list to `dnd_spells` (`+ other` for homebrew/edge cases),
  with a join/filter so spells can be queried by class.
- Each `ClassNode.spellList` declares its tag; AddSpellModal + creation P5 + the
  encyclopedia filter spells through it.
- This is the bridge between the JS rules tree and the DB spell table. Land it
  **before** the spell steps of character creation.

---

## 6. Target directory layout

```
DnD/
  rules/
    types.js            # node typedefs (this doc, as JSDoc)
    registry.js         # assembles nodes + query API (the read surface)
    classes/
      wizard.js  warlock.js  ...          # one ClassNode each
      subclasses/
        warMagic.js  archfey.js  ...       # one SubclassNode each
    races/
      elf.js  ...                          # race + its subraces
    shared/
      fightingStyles.js  metamagic.js  pactBoons.js   # shared option lists
  components/
    ClassFeatures/
      registry.js                          # blockId → component
      classes/  subclasses/  races/  shared/   # trackers, grouped
    Creation/      # feature 1 (new)
    LevelUp/       # feature 2 (new)
    Encyclopedia/  # feature 3 (new)
```

---

## 7. Phased execution (strangler-fig — app stays green every phase)

- **P0 — Schema.** Write `rules/types.js`. No behavior change.
- **P1 — Registry adapter.** Build `rules/registry.js` that assembles nodes from
  the *existing* `classProgression`/`dndUtils` data and exposes the query API +
  `getNodeDetail`. Old files untouched. → one read surface immediately.
- **P2 — Component registry.** Add `blockId` to nodes; replace `SubclassBlock`
  if/else and `ClassFeatureBlock` switch with `BLOCKS` lookup. → worst list gone.
- **P3 — Move data into modules.** Migrate one class/race at a time into
  `rules/classes|races/*`; registry sources from the new module; delete the moved
  section from the monolith. App keeps working (everyone reads the registry).
- **P4 — Enrich.** Add `creation` fields (racial ASIs first) + `overview` /
  `definingFeature` / `lore`. Incremental, parallelizable authoring.
- **P5 — Spell tags.** DB migration + `spellList` + filter UI.
- **P6 — Features.** Creation → Level-up → Encyclopedia, each a pure consumer of
  the registry. No new copies of rules data.

Each phase is independently shippable and reversible. P1–P2 alone already unblock
the 100-subclass push; P3 is the big mechanical lift that turns the monolith back
into a tree.

---

## Invariants to hold the line
1. One fact, one home. Features read the registry; they never hardcode a copy.
2. `rules/` imports no React. Nodes reference components by `blockId` string.
3. `implemented` is derived (data exists?), never a separate boolean.
4. Creation and encyclopedia share `getNodeDetail` — depth differs, data doesn't.
5. Scaling math lives once (node `helpers`) and is reused by trackers *and* the
   encyclopedia's mechanical detail.
```
