import RageTracker from './RageTracker';
import WildShapeTracker from './WildShapeTracker';
import CunningActionPanel from './CunningActionPanel';
import FighterResources from './FighterResources';
import WizardBlock from './WizardBlock';
import WarlockBlock from './WarlockBlock';
import BardBlock from './BardBlock';
import ClericBlock from './ClericBlock';
import MonkBlock from './MonkBlock';
import PaladinBlock from './PaladinBlock';
import SorcererBlock from './SorcererBlock';
import RangerBlock from './RangerBlock';
import GenericResourceDisplay from './GenericResourceDisplay';

export default function ClassFeatureBlock({ character, onUpdate, editMode }) {
  const cf = character.classFeature;
  if (!cf) return null;

  const type = cf.type;
  const level = character.meta?.level || 1;

  const handleUpdate = (updates) => onUpdate(updates);

  switch (type) {
    case 'rage':
      return <RageTracker classFeature={cf} editMode={editMode} onUpdate={handleUpdate} level={level} />;
    case 'wild_shape':
      return <WildShapeTracker classFeature={cf} editMode={editMode} onUpdate={handleUpdate} character={character} />;
    case 'cunning_action':
      return <CunningActionPanel classFeature={cf} level={level} editMode={editMode} onUpdate={handleUpdate} />;
    case 'action_surge':
      return <FighterResources classFeature={cf} level={level} editMode={editMode} onUpdate={handleUpdate} />;
    case 'spell_slots':
      return <WizardBlock classFeature={cf} level={level} onUpdate={handleUpdate} />;
    case 'pact_magic':
      return <WarlockBlock classFeature={cf} level={level} onUpdate={handleUpdate} />;
    case 'bardic_inspiration':
      return <BardBlock character={character} onUpdate={handleUpdate} />;
    case 'channel_divinity':
      return <ClericBlock classFeature={cf} level={level} onUpdate={handleUpdate} />;
    case 'ki_points':
      return <MonkBlock character={character} onUpdate={handleUpdate} />;
    case 'divine_smite':
      return <PaladinBlock character={character} onUpdate={handleUpdate} />;
    case 'sorcery_points':
      return <SorcererBlock character={character} onUpdate={handleUpdate} />;
    case 'ranger_spells':
      return <RangerBlock character={character} onUpdate={handleUpdate} />;
    default:
      return <GenericResourceDisplay classFeature={cf} editMode={editMode} onUpdate={handleUpdate} />;
  }
}
