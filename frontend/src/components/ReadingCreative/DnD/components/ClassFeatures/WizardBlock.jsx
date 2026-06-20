import { arcaneRecoveryMax } from '../../classProgression';

/**
 * Wizard — Combat tab tracker. Arcane Recovery is the one in-fight resource the
 * base class manages: once per day on a short rest, recover slots totalling up
 * to half your level (rounded up). This tracks the *use*; the actual slot
 * recovery is done on the Spells tab by clicking expended pips back.
 */
export default function WizardBlock({ classFeature, level, onUpdate }) {
  const cf = classFeature || {};
  const ar = cf.arcaneRecovery || { maxUses: 1, currentUses: 1, rechargeOn: 'long' };
  const recoverable = arcaneRecoveryMax(level);

  const toggleUse = () => {
    const next = ar.currentUses > 0 ? 0 : ar.maxUses || 1;
    onUpdate({ classFeature: { ...cf, arcaneRecovery: { ...ar, currentUses: next } } });
  };

  return (
    <div className="dnd-generic-resource dnd-wizard-block">
      <h4 className="dnd-generic-resource__title">Arcane Recovery</h4>
      <div className="dnd-generic-resource__row">
        <span>{ar.currentUses}/{ar.maxUses} per day</span>
        <button className="dnd-generic-resource__btn" onClick={toggleUse}>
          {ar.currentUses > 0 ? 'Use' : 'Restore'}
        </button>
        <span className="dnd-generic-resource__recharge">Short Rest</span>
      </div>
      <p className="dnd-wizard-block__note">
        Recover slots totalling up to <strong>{recoverable}</strong> level{recoverable !== 1 ? 's' : ''} (none 6th+).
        Click expended slot pips back on the Spells tab.
      </p>
    </div>
  );
}
