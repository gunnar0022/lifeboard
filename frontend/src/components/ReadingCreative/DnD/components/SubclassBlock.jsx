import { getBlock } from './ClassFeatures/registry';
import { getSubclass } from '../rules/registry';

/**
 * SubclassBlock — renders the active subclass's Combat-tab tracker (if any).
 * The tracker is resolved from the rules registry's `blockId` via the component
 * registry — no name-dispatch. Subclasses without a tracker show a notice.
 */
export default function SubclassBlock({ character, editMode, onUpdate }) {
  const subclass = character.meta?.subclass;
  if (!subclass) return null;

  const node = getSubclass(subclass);
  const Block = node ? getBlock(node.blockId) : null;

  return (
    <div className="dnd-subclass-block">
      <h3 className="dnd-section-title">
        {subclass}
        <span className="dnd-subclass-block__tag">Subclass</span>
      </h3>

      {Block
        ? <Block character={character} editMode={editMode} onUpdate={onUpdate} />
        : (
          <div className="dnd-subclass-block__notice">
            {node?.implemented
              ? 'No live combat tracker for this subclass — its features are listed on the Features tab.'
              : 'Subclass features not yet implemented — track manually in the Features tab.'}
          </div>
        )}
    </div>
  );
}
