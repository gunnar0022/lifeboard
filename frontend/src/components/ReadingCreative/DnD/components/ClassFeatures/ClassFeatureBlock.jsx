import RageTracker from './RageTracker';
import WildShapeTracker from './WildShapeTracker';
import CunningActionPanel from './CunningActionPanel';
import FighterResources from './FighterResources';
import GenericResourceDisplay from './GenericResourceDisplay';

export default function ClassFeatureBlock({ character, onUpdate, editMode }) {
  const cf = character.classFeature;
  if (!cf) return null;

  const type = cf.type;
  const level = character.meta?.level || 1;

  const handleUpdate = (updates) => onUpdate(updates);

  switch (type) {
    case 'rage':
      return <RageTracker classFeature={cf} editMode={editMode} onUpdate={handleUpdate} />;
    case 'wild_shape':
      return <WildShapeTracker classFeature={cf} editMode={editMode} onUpdate={handleUpdate} />;
    case 'cunning_action':
      return <CunningActionPanel classFeature={cf} editMode={editMode} onUpdate={handleUpdate} />;
    case 'action_surge':
      return <FighterResources classFeature={cf} level={level} editMode={editMode} onUpdate={handleUpdate} />;
    default:
      return <GenericResourceDisplay classFeature={cf} editMode={editMode} onUpdate={handleUpdate} />;
  }
}
