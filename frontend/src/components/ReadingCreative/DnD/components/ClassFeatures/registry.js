/**
 * Component registry — resolves a node's `blockId` string (from the React-free
 * rules registry) to its Combat-tab tracker component. This is the wiring layer
 * that replaces the old name-dispatch in SubclassBlock/ClassFeatureBlock:
 * adding a class/subclass tracker = add the component + one line here.
 */
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
import RuneKnightBlock from './RuneKnightBlock';
import AssassinBlock from './AssassinBlock';
import CircleOfStarsBlock from './CircleOfStarsBlock';
import CircleOfSporesBlock from './CircleOfSporesBlock';
import AncestralGuardianBlock from './AncestralGuardianBlock';
import WarMagicBlock from './WarMagicBlock';
import ArchfeyBlock from './ArchfeyBlock';

export const BLOCKS = {
  // class trackers
  RageTracker, WildShapeTracker, CunningActionPanel, FighterResources,
  WizardBlock, WarlockBlock, BardBlock, ClericBlock, MonkBlock, PaladinBlock,
  SorcererBlock, RangerBlock,
  // subclass trackers
  RuneKnightBlock, AssassinBlock, CircleOfStarsBlock, CircleOfSporesBlock,
  AncestralGuardianBlock, WarMagicBlock, ArchfeyBlock,
};

/** Look up a tracker component by blockId (null if none/unknown). */
export function getBlock(blockId) {
  return blockId ? (BLOCKS[blockId] || null) : null;
}
