import { SUBCLASS_LISTS } from '../dndUtils';
import RuneKnightBlock from './ClassFeatures/RuneKnightBlock';

/**
 * SubclassBlock — displays subclass info in the Combat tab.
 * Shows the selected subclass name and either its features or
 * an "unimplemented" notice.
 * Druid subclasses (Spores, Stars) are handled by WildShapeTracker in the
 * base ClassFeatureBlock — they don't render here to avoid duplication.
 */
const DRUID_HANDLED_SUBCLASSES = ['Circle of Spores', 'Circle of Stars'];

export default function SubclassBlock({ character, editMode, onUpdate }) {
  const meta = character.meta || {};
  const subclass = meta.subclass;
  const className = meta.className;

  if (!subclass) return null;

  // Druid subclasses handled by WildShapeTracker — skip here
  if (className === 'Druid' && DRUID_HANDLED_SUBCLASSES.includes(subclass)) {
    return null;
  }

  const scList = SUBCLASS_LISTS[className] || [];
  const sc = scList.find(s => s.name === subclass);
  const isImplemented = sc?.implemented;

  // Render implemented subclass component
  const renderSubclassFeatures = () => {
    if (subclass === 'Rune Knight') {
      return <RuneKnightBlock character={character} editMode={editMode} onUpdate={onUpdate} />;
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
