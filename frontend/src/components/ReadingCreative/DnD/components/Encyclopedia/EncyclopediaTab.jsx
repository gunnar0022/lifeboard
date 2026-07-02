import useNavStack from './useNavStack';
import useLoreOverrides from './useLoreOverrides';
import { getNode } from '../../rules/registry';
import Breadcrumb from './Breadcrumb';
import HomeView from './HomeView';
import RaceListView from './RaceListView';
import RaceDetailView from './RaceDetailView';
import ClassListView from './ClassListView';
import ClassDetailView from './ClassDetailView';
import SpellListView from './SpellListView';
import SpellDetailView from './SpellDetailView';
import ItemsListView from './ItemsListView';
import ItemDetailView from './ItemDetailView';
import FeatListView from './FeatListView';
import FeatDetailView from './FeatDetailView';
import BackgroundListView from './BackgroundListView';
import BackgroundDetailView from './BackgroundDetailView';
import OptionLibraryView from './OptionLibraryView';
import { raceAccent, classAccent } from './accents';

// Default page accent for a node when one isn't carried down from a parent.
function accentFor(node) {
  if (!node) return 'var(--dnd-accent)';
  if (node.type === 'class') return classAccent(node.name);
  if (node.type === 'subclass') return classAccent(node.parentId);
  if (node.type === 'race') return raceAccent(node.name);
  return 'var(--dnd-accent)';
}

/**
 * Encyclopedia tab — the standalone wiki navigator. Owns the browser-like nav
 * stack and dispatches the current frame to a view. Kept self-contained (no
 * character coupling beyond the edit toggle) so it can later be lifted into a
 * pre-character creation flow with minimal change.
 *
 * Two trees plus a spell bridge: race→subrace, and class→subclass→spell-list→
 * spell (classes link out to the filtered spell library; spells never link
 * back). In edit mode the flavor prose is directly editable and persisted.
 */
export default function EncyclopediaTab({ editMode = false }) {
  const { stack, current, push, pop, home, goto } = useNavStack();
  const { overrides, saveOverride } = useLoreOverrides();

  const openPillar = (id) => {
    if (id === 'races') push({ view: 'raceList', title: 'Races' });
    else if (id === 'classes') push({ view: 'classList', title: 'Classes' });
    else if (id === 'spells') push({ view: 'spellList', title: 'Spells', filter: {} });
    else if (id === 'items') push({ view: 'itemList', title: 'Items' });
    else if (id === 'feats') push({ view: 'featList', title: 'Feats' });
    else if (id === 'backgrounds') push({ view: 'backgroundList', title: 'Backgrounds' });
  };

  const openItem = (item) => push({ view: 'item', title: item.name, itemId: item.id, preview: item });
  const openFeat = (feat) => push({ view: 'feat', title: feat.name, featId: feat.id, preview: feat });
  const openBackground = (bg) => push({ view: 'background', title: bg.name, bgId: bg.id, preview: bg });
  // Open a class-option library (Invocations, Maneuvers, …), themed by its key.
  const openOptions = (categoryKey, label) => push({ view: 'optionLib', title: label, categoryKey });

  // Open a race/subrace/class/subclass node. Children inherit their parent's
  // accent so a lineage / subclass reads as a variation on the same page.
  const openNode = (node, accent) => {
    push({ view: 'node', nodeId: node.id, title: node.name, accent: accent || accentFor(node) });
  };

  // Cross-link from a class/subclass to the filtered spell library.
  const openSpells = (filter, label) => push({ view: 'spellList', title: label || 'Spells', filter: filter || {} });
  const openSpell = (spell) => push({ view: 'spell', title: spell.name, spellId: spell.id, preview: spell });

  let body;
  switch (current.view) {
    case 'raceList':
      body = <RaceListView onOpen={(node) => openNode(node)} />;
      break;
    case 'classList':
      body = <ClassListView onOpen={(node) => openNode(node)} />;
      break;
    case 'node': {
      const node = getNode(current.nodeId);
      const isClassy = node && (node.type === 'class' || node.type === 'subclass');
      const Detail = isClassy ? ClassDetailView : RaceDetailView;
      body = (
        <Detail
          key={current.nodeId}
          nodeId={current.nodeId}
          accent={current.accent}
          editMode={editMode}
          override={overrides[current.nodeId]}
          onSaveOverride={saveOverride}
          onOpen={(child) => openNode(child, current.accent)}
          onOpenSpells={openSpells}
          onOpenOptions={openOptions}
        />
      );
      break;
    }
    case 'spellList':
      body = <SpellListView key={current.filter?.classTag || 'all'} initialFilter={current.filter} onOpenSpell={openSpell} />;
      break;
    case 'spell':
      body = <SpellDetailView key={current.spellId} spellId={current.spellId} preview={current.preview} editMode={editMode} onDeleted={pop} />;
      break;
    case 'itemList':
      body = <ItemsListView onOpenItem={openItem} />;
      break;
    case 'item':
      body = (
        <ItemDetailView
          key={current.itemId}
          itemId={current.itemId}
          preview={current.preview}
          editMode={editMode}
          onDeleted={pop}
        />
      );
      break;
    case 'featList':
      body = <FeatListView onOpenFeat={openFeat} />;
      break;
    case 'feat':
      body = <FeatDetailView key={current.featId} featId={current.featId} preview={current.preview} editMode={editMode} onDeleted={pop} />;
      break;
    case 'backgroundList':
      body = <BackgroundListView onOpenBackground={openBackground} />;
      break;
    case 'background':
      body = <BackgroundDetailView key={current.bgId} bgId={current.bgId} preview={current.preview} editMode={editMode} onDeleted={pop} />;
      break;
    case 'optionLib':
      body = <OptionLibraryView key={current.categoryKey} categoryKey={current.categoryKey} />;
      break;
    case 'home':
    default:
      body = <HomeView onOpen={openPillar} />;
  }

  return (
    <div className="wiki">
      <Breadcrumb stack={stack} onBack={pop} onHome={home} onGoto={goto} />
      <div className="wiki__body">{body}</div>
    </div>
  );
}
