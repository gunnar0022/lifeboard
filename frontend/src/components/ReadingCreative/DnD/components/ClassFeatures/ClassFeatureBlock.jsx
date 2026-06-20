import { getBlock } from './registry';
import { CLASS_BLOCK_BY_TYPE } from '../../rules/registry';
import GenericResourceDisplay from './GenericResourceDisplay';

/**
 * Renders the active class's Combat-tab tracker. The tracker is chosen by the
 * classFeature type via the rules registry (CLASS_BLOCK_BY_TYPE) and resolved to
 * a component via the component registry — no switch. Unknown types fall back to
 * a generic resource display. All blocks receive a uniform prop set and use what
 * they need.
 */
export default function ClassFeatureBlock({ character, onUpdate, editMode }) {
  const cf = character.classFeature;
  if (!cf) return null;

  const level = character.meta?.level || 1;
  const Block = getBlock(CLASS_BLOCK_BY_TYPE[cf.type]) || GenericResourceDisplay;

  return (
    <Block
      character={character}
      classFeature={cf}
      level={level}
      editMode={editMode}
      onUpdate={onUpdate}
    />
  );
}
