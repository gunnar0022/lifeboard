import { useState, useEffect, useRef } from 'react';

// Indomitable uses by fighter level (0 until 9th).
function indomitableUses(level) {
  if (level >= 17) return 3;
  if (level >= 13) return 2;
  if (level >= 9) return 1;
  return 0;
}

export default function FighterResources({ classFeature, level, editMode, onUpdate }) {
  const [flashSurge, setFlashSurge] = useState(false);
  const [flashWind, setFlashWind] = useState(false);
  const prevIndomMaxRef = useRef(null);

  const surge = classFeature?.actionSurge || { maxUses: 1, currentUses: 1 };
  const wind = classFeature?.secondWind || { maxUses: 1, currentUses: 1, healDice: '1d10' };
  const indom = classFeature?.indomitable || { maxUses: 0, currentUses: 0 };
  const indomMax = indomitableUses(level);

  // Keep Indomitable max in sync with level; grant new use(s) when it increases.
  useEffect(() => {
    const prev = prevIndomMaxRef.current;
    prevIndomMaxRef.current = indomMax;
    const cur = classFeature?.indomitable;
    if (cur && cur.maxUses === indomMax) return;
    const grew = prev !== null && indomMax > prev;
    onUpdate({
      classFeature: {
        ...classFeature,
        indomitable: {
          rechargeOn: 'long',
          maxUses: indomMax,
          currentUses: cur
            ? (grew ? Math.min((cur.currentUses || 0) + (indomMax - (cur.maxUses || 0)), indomMax) : Math.min(cur.currentUses ?? indomMax, indomMax))
            : indomMax,
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indomMax]);

  const useSurge = () => {
    if (surge.currentUses <= 0) return;
    setFlashSurge(true);
    setTimeout(() => setFlashSurge(false), 400);
    onUpdate({ classFeature: { ...classFeature, actionSurge: { ...surge, currentUses: surge.currentUses - 1 } } });
  };

  const useWind = () => {
    if (wind.currentUses <= 0) return;
    setFlashWind(true);
    setTimeout(() => setFlashWind(false), 400);
    onUpdate({ classFeature: { ...classFeature, secondWind: { ...wind, currentUses: wind.currentUses - 1 } } });
  };

  const useIndom = () => {
    if (indom.currentUses <= 0) return;
    onUpdate({ classFeature: { ...classFeature, indomitable: { ...indom, currentUses: indom.currentUses - 1 } } });
  };

  return (
    <div className="dnd-fighter">
      <div className={`dnd-fighter__resource ${flashSurge ? 'dnd-fighter__resource--flash' : ''}`}>
        <h4 className="dnd-fighter__title">ACTION SURGE</h4>
        <div className="dnd-fighter__uses">{surge.currentUses} / {surge.maxUses}</div>
        <button className="dnd-fighter__use-btn" onClick={useSurge} disabled={surge.currentUses <= 0}>Use</button>
        <span className="dnd-fighter__recharge">Short Rest</span>
        {editMode && (
          <div className="dnd-fighter__edit">
            <label>Max</label>
            <input type="number" className="dnd-field dnd-field--sm" value={surge.maxUses}
              onChange={e => onUpdate({ classFeature: { ...classFeature, actionSurge: { ...surge, maxUses: parseInt(e.target.value) || 1 } } })} />
          </div>
        )}
      </div>

      <div className={`dnd-fighter__resource ${flashWind ? 'dnd-fighter__resource--flash' : ''}`}>
        <h4 className="dnd-fighter__title">SECOND WIND</h4>
        <div className="dnd-fighter__uses">{wind.currentUses} / {wind.maxUses}</div>
        <button className="dnd-fighter__use-btn" onClick={useWind} disabled={wind.currentUses <= 0}>
          Use ({wind.healDice} + {level})
        </button>
        <span className="dnd-fighter__recharge">Short Rest</span>
        {editMode && (
          <div className="dnd-fighter__edit">
            <label>Max</label>
            <input type="number" className="dnd-field dnd-field--sm" value={wind.maxUses}
              onChange={e => onUpdate({ classFeature: { ...classFeature, secondWind: { ...wind, maxUses: parseInt(e.target.value) || 1 } } })} />
            <label>Heal</label>
            <input className="dnd-field dnd-field--sm" value={wind.healDice}
              onChange={e => onUpdate({ classFeature: { ...classFeature, secondWind: { ...wind, healDice: e.target.value } } })} />
          </div>
        )}
      </div>

      {indomMax > 0 && (
        <div className="dnd-fighter__resource">
          <h4 className="dnd-fighter__title">INDOMITABLE</h4>
          <div className="dnd-fighter__uses">{indom.currentUses} / {indom.maxUses}</div>
          <button className="dnd-fighter__use-btn" onClick={useIndom} disabled={indom.currentUses <= 0}>Reroll Save</button>
          <span className="dnd-fighter__recharge">Long Rest</span>
        </div>
      )}
    </div>
  );
}
