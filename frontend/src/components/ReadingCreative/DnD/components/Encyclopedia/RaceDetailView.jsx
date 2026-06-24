import { ChevronRight } from 'lucide-react';
import { getNodeDetail } from '../../rules/registry';
import useEditableProse from './useEditableProse';
import { LORE_ORDER } from './loreText';
import { ProseHeader, Overview, DefiningFeature, LoreBlock } from './ProseBlocks';
import Mech from './Mech';
import DragonAncestryPicker from './DragonAncestryPicker';
import ChoiceTabs from './ChoiceTabs';

const ABILITY_LABEL = { STR: 'STR', DEX: 'DEX', CON: 'CON', INT: 'INT', WIS: 'WIS', CHA: 'CHA' };

/** A single trait card; renders an inline choice browser when the trait carries one. */
function TraitCard({ trait }) {
  return (
    <div className="wiki-trait">
      <span className="wiki-trait__name">{trait.name}</span>
      {trait.desc && <p className="wiki-trait__desc"><Mech text={trait.desc} /></p>}
      {trait.choice === 'dragon' && <DragonAncestryPicker />}
      {Array.isArray(trait.options) && trait.options.length > 0 && <ChoiceTabs options={trait.options} />}
    </div>
  );
}

/**
 * Detail page for a race OR subrace (both read the same getNodeDetail surface).
 * Overview + defining feature + ability bonuses + traits, with editable lore.
 * Traits with an inline choice (Dragonborn ancestry, Half-Elf / Human
 * versatility) render a picker/tabs. A race with lineages lists them as
 * drill-in cards; a subrace simply has none.
 */
export default function RaceDetailView({ nodeId, accent, onOpen, editMode, override, onSaveOverride }) {
  const base = getNodeDetail(nodeId);
  const { detail, ...prose } = useEditableProse(nodeId, base, override, onSaveOverride);
  if (!base) return <div className="wiki-detail">Unknown entry.</div>;

  const { name, tagline, overview, definingFeature, lore, progression, abilityBonuses, children } = detail;
  const bonuses = Object.entries(abilityBonuses || {});
  const isSubrace = detail.type === 'subrace';

  return (
    <div className="wiki-detail" style={{ '--accent': accent }}>
      <ProseHeader kicker={isSubrace ? 'Lineage' : 'Race'} name={name} tagline={tagline} editMode={editMode} prose={prose} />
      <Overview overview={overview} editMode={editMode} prose={prose} />

      {bonuses.length > 0 && (
        <div className="wiki-chips">
          {bonuses.map(([ab, n]) => (
            <span key={ab} className="wiki-chip">
              {ABILITY_LABEL[ab] || ab} <strong className="mech mech--num">+{n}</strong>
            </span>
          ))}
        </div>
      )}

      <DefiningFeature feature={definingFeature} />

      {progression.length > 0 && (
        <section className="wiki-section">
          <h3 className="wiki-section__title">{isSubrace ? 'Lineage Traits' : 'Shared Traits'}</h3>
          <div className="wiki-traits">
            {progression.map(t => <TraitCard key={t.id || t.name} trait={t} />)}
          </div>
        </section>
      )}

      {children.length > 0 && (
        <section className="wiki-section">
          <h3 className="wiki-section__title">Lineages</h3>
          <div className="wiki-cards wiki-cards--inset">
            {children.map(c => (
              <button key={c.id} className="wiki-card" style={{ '--accent': accent }} onClick={() => onOpen(c)}>
                <span className="wiki-card__accent" />
                <span className="wiki-card__body">
                  <span className="wiki-card__name">{c.name}</span>
                </span>
                <ChevronRight className="wiki-card__chev" size={18} />
              </button>
            ))}
          </div>
        </section>
      )}

      <LoreBlock lore={lore} order={LORE_ORDER.race} editMode={editMode} prose={prose} labels={detail.loreLabels} />
    </div>
  );
}
