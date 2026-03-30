export default function GenericResourceDisplay({ classFeature, editMode, onUpdate }) {
  if (!classFeature) return null;

  const type = classFeature.type || 'unknown';
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Find use-based fields
  const hasUses = 'maxUses' in classFeature && 'currentUses' in classFeature;
  const hasPoints = 'maxPoints' in classFeature && 'currentPoints' in classFeature;
  const hasPool = classFeature.layOnHands;
  const hasPactSlots = classFeature.pactSlots;

  const useOne = () => {
    if (hasUses && classFeature.currentUses > 0) {
      onUpdate({ classFeature: { ...classFeature, currentUses: classFeature.currentUses - 1 } });
    } else if (hasPoints && classFeature.currentPoints > 0) {
      onUpdate({ classFeature: { ...classFeature, currentPoints: classFeature.currentPoints - 1 } });
    }
  };

  return (
    <div className="dnd-generic-resource">
      <h4 className="dnd-generic-resource__title">{label}</h4>

      {hasUses && (
        <div className="dnd-generic-resource__row">
          <span>Uses: {classFeature.currentUses} / {classFeature.maxUses}</span>
          <button className="dnd-generic-resource__btn" onClick={useOne}
            disabled={classFeature.currentUses <= 0}>Use</button>
          {classFeature.rechargeOn && (
            <span className="dnd-generic-resource__recharge">
              {classFeature.rechargeOn === 'short' ? 'Short Rest' : 'Long Rest'}
            </span>
          )}
        </div>
      )}

      {hasPoints && (
        <div className="dnd-generic-resource__row">
          <span>Points: {classFeature.currentPoints} / {classFeature.maxPoints}</span>
          <button className="dnd-generic-resource__btn" onClick={useOne}
            disabled={classFeature.currentPoints <= 0}>Use</button>
        </div>
      )}

      {hasPool && (
        <div className="dnd-generic-resource__row">
          <span>Lay on Hands: {classFeature.layOnHands.currentPool} / {classFeature.layOnHands.maxPool}</span>
        </div>
      )}

      {hasPactSlots && (
        <div className="dnd-generic-resource__row">
          <span>Pact Slots: {classFeature.pactSlots.current} / {classFeature.pactSlots.max} (Level {classFeature.pactSlots.slotLevel})</span>
        </div>
      )}

      {classFeature.active !== undefined && (
        <div className="dnd-generic-resource__row">
          <span>Status: {classFeature.active ? 'Active' : 'Inactive'}</span>
        </div>
      )}
    </div>
  );
}
