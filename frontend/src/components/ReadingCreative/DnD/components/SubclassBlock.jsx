import { SUBCLASS_LISTS } from '../dndUtils';
import RuneKnightBlock from './ClassFeatures/RuneKnightBlock';
import AssassinBlock from './ClassFeatures/AssassinBlock';
import CircleOfStarsBlock from './ClassFeatures/CircleOfStarsBlock';
import CircleOfSporesBlock from './ClassFeatures/CircleOfSporesBlock';

/**
 * SubclassBlock — displays subclass features in the Combat tab.
 * Wild Shape resource tracking stays in ClassFeatureBlock (WildShapeTracker).
 * Druid subclass features (spells, passives, trackers) render here separately.
 */
export default function SubclassBlock({ character, editMode, onUpdate }) {
  const meta = character.meta || {};
  const subclass = meta.subclass;
  const className = meta.className;

  if (!subclass) return null;

  const scList = SUBCLASS_LISTS[className] || [];
  const sc = scList.find(s => s.name === subclass);
  const isImplemented = sc?.implemented;

  const renderSubclassFeatures = () => {
    if (subclass === 'Rune Knight') {
      return <RuneKnightBlock character={character} editMode={editMode} onUpdate={onUpdate} />;
    }
    if (subclass === 'Assassin') {
      return <AssassinBlock character={character} />;
    }
    if (subclass === 'Circle of Stars') {
      return <CircleOfStarsBlock character={character} editMode={editMode} onUpdate={onUpdate} />;
    }
    if (subclass === 'Circle of Spores') {
      return <CircleOfSporesBlock character={character} editMode={editMode} onUpdate={onUpdate} />;
    }
    return null;
  };

  return (
    <div className="dnd-subclass-block">
      <h3 className="dnd-section-title">
        {subclass}
        <span className="dnd-subclass-block__tag">Subclass</span>
      </h3>

      {!isImplemented && (
        <div className="dnd-subclass-block__notice">
          Subclass features not yet implemented — track manually in the Features tab.
        </div>
      )}

      {isImplemented && renderSubclassFeatures()}
    </div>
  );
}
