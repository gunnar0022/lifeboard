import { ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';
import { getNodeDetail, getClass } from '../../rules/registry';
import useEditableProse from './useEditableProse';
import { LORE_ORDER } from './loreText';
import { ProseHeader, Overview, DefiningFeature, LoreBlock } from './ProseBlocks';
import ProgressionList from './ProgressionList';

const CASTER_LABEL = {
  full: 'Full caster', half: 'Half caster', third: 'Third caster',
  pact: 'Pact magic', artificer: 'Artificer caster',
};

function casterText(caster) {
  if (!caster) return 'Martial — no spellcasting';
  const kind = CASTER_LABEL[caster.type] || 'Caster';
  return caster.ability ? `${kind} · ${caster.ability}` : kind;
}

/**
 * Detail page for a class OR subclass (shared getNodeDetail surface). Leads with
 * flavor — tagline, overview, defining feature, lore — and tucks the mechanical
 * level progression behind a toggle. Classes show at-a-glance chips, a link out
 * to their spell list, and their subclass paths (flagged when not yet detailed).
 * Subclasses show a disclaimer when undetailed and can link to the parent
 * class's spell list.
 */
export default function ClassDetailView({ nodeId, accent, onOpen, onOpenSpells, editMode, override, onSaveOverride }) {
  const base = getNodeDetail(nodeId);
  const { detail, ...prose } = useEditableProse(nodeId, base, override, onSaveOverride);
  if (!base) return <div className="wiki-detail">Unknown entry.</div>;

  const { name, tagline, overview, definingFeature, lore, progression, children } = detail;
  const isSubclass = detail.type === 'subclass';

  // A subclass borrows its parent class's spell list for the cross-link.
  const parent = isSubclass && detail.parentId ? getClass(detail.parentId) : null;
  const spellTag = isSubclass ? parent?.spellList : detail.spellList;
  const spellOwner = isSubclass ? parent?.name : name;
  const undetailed = isSubclass && !detail.implemented;

  return (
    <div className="wiki-detail" style={{ '--accent': accent }}>
      <ProseHeader kicker={isSubclass ? (parent?.subclassLabel || 'Subclass') : 'Class'} name={name}
        tagline={tagline} editMode={editMode} prose={prose} />

      {undetailed && (
        <div className="wiki-disclaimer">
          <AlertTriangle size={15} />
          <span>This subclass isn't detailed yet — its mechanics haven't been authored. The overview below is a starting point.</span>
        </div>
      )}

      <Overview overview={overview} editMode={editMode} prose={prose} />

      {!isSubclass && (
        <div className="wiki-chips">
          {detail.hitDie && <span className="wiki-chip">Hit Die <strong className="mech mech--dice">{detail.hitDie}</strong></span>}
          <span className="wiki-chip">{casterText(detail.caster)}</span>
          {detail.subclassLabel && (
            <span className="wiki-chip">{detail.subclassLabel} <strong className="mech mech--num">{detail.subclassLevel}</strong></span>
          )}
        </div>
      )}

      <DefiningFeature feature={definingFeature} />

      {spellTag && onOpenSpells && (
        <button
          className="wiki-spell-link"
          style={{ '--accent': accent }}
          onClick={() => onOpenSpells({ classTag: spellTag }, `${spellOwner} Spells`)}
        >
          <Sparkles size={15} />
          <span>Browse the {spellOwner} spell list</span>
          <ChevronRight size={16} />
        </button>
      )}

      {!isSubclass && children.length > 0 && (
        <section className="wiki-section">
          <h3 className="wiki-section__title">{detail.subclassLabel ? `${detail.subclassLabel}s` : 'Subclasses'}</h3>
          <div className="wiki-cards wiki-cards--inset">
            {children.map(c => (
              <button key={c.id} className="wiki-card" style={{ '--accent': accent }} onClick={() => onOpen(c)}>
                <span className="wiki-card__accent" />
                <span className="wiki-card__body">
                  <span className="wiki-card__name">{c.name}</span>
                  {!c.implemented && <span className="wiki-card__meta wiki-card__meta--soon">Not yet detailed</span>}
                </span>
                <ChevronRight className="wiki-card__chev" size={18} />
              </button>
            ))}
          </div>
        </section>
      )}

      <ProgressionList progression={progression} label={isSubclass ? 'Subclass features' : 'Level progression'} />

      <LoreBlock lore={lore} order={LORE_ORDER.class} editMode={editMode} prose={prose} />
    </div>
  );
}
