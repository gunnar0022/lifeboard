import { ChevronLeft } from 'lucide-react';
import { getRoots, getChildren } from '../../rules/registry';
import { raceAccent } from '../Encyclopedia/accents';
import RaceDetailView from '../Encyclopedia/RaceDetailView';
import ChooserShell from './ChooserShell';
import { racialLayerPatch } from './creationUtils';

/**
 * Race step. Lists the major races; the detail pane reuses the encyclopedia
 * RaceDetailView. A race's lineage (subrace) cards double as the subrace picker —
 * clicking one selects it and focuses its detail; a breadcrumb steps back up.
 * Selecting a race/subrace seeds the racial ability bonuses (editable later).
 */
export default function RaceStep({ draft, setDraft }) {
  const races = getRoots('race');
  const race = draft.meta.race || null;
  const subrace = draft.meta.subrace || '';
  const accent = raceAccent(race);

  const items = races.map(n => {
    const subCount = (n.childIds || []).length;
    return { id: n.id, name: n.name, meta: subCount > 0 ? `${subCount} lineage${subCount > 1 ? 's' : ''}` : undefined };
  });

  const selectRace = (name) => {
    setDraft({ meta: { race: name, subrace: '' }, ...racialLayerPatch(draft, name, '') });
  };
  const selectSubrace = (name) => {
    setDraft({ meta: { subrace: name }, ...racialLayerPatch(draft, race, name) });
  };
  const clearSubrace = () => {
    setDraft({ meta: { subrace: '' }, ...racialLayerPatch(draft, race, '') });
  };

  const renderDetail = () => {
    const hasLineages = race && getChildren(race).length > 0;
    const focus = subrace || race;
    return (
      <div>
        {subrace && (
          <button className="crt-breadcrumb" onClick={clearSubrace}>
            <ChevronLeft size={14} /> {race} · {subrace} — change lineage
          </button>
        )}
        {!subrace && hasLineages && (
          <p className="crt-hint-inline">This race has lineages — pick one from the cards below to lock in its traits.</p>
        )}
        <RaceDetailView
          key={focus}
          nodeId={focus}
          accent={accent}
          editMode={false}
          onOpen={(child) => selectSubrace(child.name)}
        />
      </div>
    );
  };

  return (
    <ChooserShell
      items={items}
      selectedId={race}
      onSelect={selectRace}
      renderDetail={renderDetail}
      accent={accent}
      emptyHint="Pick a race on the left to read its traits and ability bonuses."
    />
  );
}
