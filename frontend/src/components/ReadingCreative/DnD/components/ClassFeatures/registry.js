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
import BerserkerBlock from './BerserkerBlock';
import BattleragerBlock from './BattleragerBlock';
import BeastBlock from './BeastBlock';
import GiantBlock from './GiantBlock';
import StormHeraldBlock from './StormHeraldBlock';
import TotemWarriorBlock from './TotemWarriorBlock';
import WildMagicBlock from './WildMagicBlock';
import ZealotBlock from './ZealotBlock';
import LoreBlock from './LoreBlock';
import EloquenceBlock from './EloquenceBlock';
import GlamourBlock from './GlamourBlock';
import CreationBlock from './CreationBlock';
import SpiritsBlock from './SpiritsBlock';
import SwordsBlock from './SwordsBlock';
import ValorBlock from './ValorBlock';
import WhispersBlock from './WhispersBlock';
import BattleMasterBlock from './BattleMasterBlock';
import ArcaneArcherBlock from './ArcaneArcherBlock';
import BanneretBlock from './BanneretBlock';
import EchoKnightBlock from './EchoKnightBlock';
import ChampionBlock from './ChampionBlock';
import CavalierBlock from './CavalierBlock';
import EldritchKnightBlock from './EldritchKnightBlock';
import PsiWarriorBlock from './PsiWarriorBlock';
import SamuraiBlock from './SamuraiBlock';
import DreamsBlock from './DreamsBlock';
import LandBlock from './LandBlock';
import MoonBlock from './MoonBlock';
import ShepherdBlock from './ShepherdBlock';
import WildfireBlock from './WildfireBlock';
import DraconicBlock from './DraconicBlock';
import AberrantMindBlock from './AberrantMindBlock';
import ClockworkSoulBlock from './ClockworkSoulBlock';
import DivineSoulBlock from './DivineSoulBlock';
import InquisitiveBlock from './InquisitiveBlock';
import MastermindBlock from './MastermindBlock';
import PhantomBlock from './PhantomBlock';
import ScoutBlock from './ScoutBlock';
import SoulknifeBlock from './SoulknifeBlock';
import ArcaneTricksterBlock from './ArcaneTricksterBlock';
import ThiefBlock from './ThiefBlock';
import SwashbucklerBlock from './SwashbucklerBlock';

export const BLOCKS = {
  // class trackers
  RageTracker, WildShapeTracker, CunningActionPanel, FighterResources,
  WizardBlock, WarlockBlock, BardBlock, ClericBlock, MonkBlock, PaladinBlock,
  SorcererBlock, RangerBlock,
  // subclass trackers
  RuneKnightBlock, AssassinBlock, CircleOfStarsBlock, CircleOfSporesBlock,
  AncestralGuardianBlock, WarMagicBlock, ArchfeyBlock, BerserkerBlock,
  BattleragerBlock, BeastBlock, GiantBlock,
  StormHeraldBlock, TotemWarriorBlock, WildMagicBlock, ZealotBlock,
  LoreBlock, EloquenceBlock, GlamourBlock, CreationBlock,
  SpiritsBlock, SwordsBlock, ValorBlock, WhispersBlock,
  BattleMasterBlock, ArcaneArcherBlock, BanneretBlock, EchoKnightBlock,
  ChampionBlock, CavalierBlock, EldritchKnightBlock, PsiWarriorBlock, SamuraiBlock,
  DreamsBlock, LandBlock, MoonBlock, ShepherdBlock, WildfireBlock,
  DraconicBlock, AberrantMindBlock, ClockworkSoulBlock, DivineSoulBlock,
  InquisitiveBlock, MastermindBlock, PhantomBlock, ScoutBlock, SoulknifeBlock,
  ArcaneTricksterBlock, ThiefBlock, SwashbucklerBlock,
};

/** Look up a tracker component by blockId (null if none/unknown). */
export function getBlock(blockId) {
  return blockId ? (BLOCKS[blockId] || null) : null;
}
