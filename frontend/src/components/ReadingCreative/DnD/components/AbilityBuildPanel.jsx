// The three-layer ability build (point-buy base + racial + ASI/feat), shared by
// the Stats tab and the character-creation flow. Reads/writes `character.abilityBuild`
// and keeps `character.abilities` (the totals) in sync via onUpdate.

const BUILD_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
// 5e point-buy cost table and budget
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUDGET = 27;
const RACIAL_MAX = 2; // any stat can be raised up to twice for racial reasons

// The three-layer build, derived from the final scores if not stored yet.
// Migration preserves totals: base = min(15, score), asi = max(0, score - 15).
export function deriveBuild(character) {
  const stored = character.abilityBuild;
  const abilities = character.abilities || {};
  const base = {}, racial = {}, asi = {};
  BUILD_ORDER.forEach(ab => {
    if (stored) {
      base[ab] = stored.base?.[ab] ?? 10;
      racial[ab] = stored.racial?.[ab] ?? 0;
      asi[ab] = stored.asi?.[ab] ?? 0;
    } else {
      const s = abilities[ab] ?? 10;
      base[ab] = Math.min(15, s);
      racial[ab] = 0;
      asi[ab] = Math.max(0, s - 15);
    }
  });
  return { base, racial, asi };
}

/** A fresh point-buy build with every base at 8 (the creation starting point). */
export function freshAbilityBuild() {
  const base = {}, racial = {}, asi = {}, abilities = {};
  BUILD_ORDER.forEach(ab => { base[ab] = 8; racial[ab] = 0; asi[ab] = 0; abilities[ab] = 8; });
  return { abilityBuild: { base, racial, asi }, abilities };
}

function Stepper({ value, prefix = '', cost, onDec, onInc, decDisabled, incDisabled }) {
  return (
    <div className="dnd-build__stepper">
      <button onClick={onDec} disabled={decDisabled}>&minus;</button>
      <span className="dnd-build__value">{prefix}{value}{cost != null && <em className="dnd-build__cost">{cost}</em>}</span>
      <button onClick={onInc} disabled={incDisabled}>+</button>
    </div>
  );
}

// Point buy (base) + racial bonus + ASI/feat layers.
export default function AbilityBuildPanel({ character, onUpdate }) {
  const { base, racial, asi } = deriveBuild(character);
  const pointsUsed = BUILD_ORDER.reduce((sum, ab) => sum + (POINT_COST[base[ab]] ?? 0), 0);
  const remaining = POINT_BUDGET - pointsUsed;

  const commit = (next) => {
    const abilities = { ...(character.abilities || {}) };
    BUILD_ORDER.forEach(ab => {
      abilities[ab] = (next.base[ab] || 0) + (next.racial[ab] || 0) + (next.asi[ab] || 0);
    });
    onUpdate({ abilityBuild: next, abilities });
  };

  const setLayer = (layer, ab, val) => {
    const next = { base: { ...base }, racial: { ...racial }, asi: { ...asi } };
    next[layer][ab] = val;
    commit(next);
  };

  const changeBase = (ab, dir) => {
    const target = base[ab] + dir;
    if (target < 8 || target > 15) return;
    if (dir > 0) {
      const newUsed = pointsUsed - (POINT_COST[base[ab]] || 0) + (POINT_COST[target] || 0);
      if (newUsed > POINT_BUDGET) return;
    }
    setLayer('base', ab, target);
  };

  const canAffordInc = (ab) => {
    if (base[ab] >= 15) return false;
    const newUsed = pointsUsed - (POINT_COST[base[ab]] || 0) + (POINT_COST[base[ab] + 1] || 0);
    return newUsed <= POINT_BUDGET;
  };

  return (
    <div className="dnd-build">
      <div className="dnd-build__header">
        <span className="dnd-build__title">Ability Scores</span>
        <span className={`dnd-build__points ${remaining < 0 ? 'dnd-build__points--over' : ''}`}>
          Point Buy: {pointsUsed} / {POINT_BUDGET}
        </span>
      </div>
      <table className="dnd-build__table">
        <thead>
          <tr>
            <th></th><th>Base</th><th>Racial</th><th>ASI / Feat</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {BUILD_ORDER.map(ab => {
            const total = (base[ab] || 0) + (racial[ab] || 0) + (asi[ab] || 0);
            return (
              <tr key={ab}>
                <td className="dnd-build__ab">{ab}</td>
                <td>
                  <Stepper
                    value={base[ab]}
                    cost={`(${POINT_COST[base[ab]] ?? '–'})`}
                    onDec={() => changeBase(ab, -1)}
                    onInc={() => changeBase(ab, 1)}
                    decDisabled={base[ab] <= 8}
                    incDisabled={!canAffordInc(ab)}
                  />
                </td>
                <td>
                  <Stepper
                    value={racial[ab] || 0}
                    prefix="+"
                    onDec={() => setLayer('racial', ab, Math.max(0, (racial[ab] || 0) - 1))}
                    onInc={() => setLayer('racial', ab, Math.min(RACIAL_MAX, (racial[ab] || 0) + 1))}
                    decDisabled={(racial[ab] || 0) <= 0}
                    incDisabled={(racial[ab] || 0) >= RACIAL_MAX}
                  />
                </td>
                <td>
                  <Stepper
                    value={asi[ab] || 0}
                    prefix="+"
                    onDec={() => setLayer('asi', ab, Math.max(0, (asi[ab] || 0) - 1))}
                    onInc={() => setLayer('asi', ab, (asi[ab] || 0) + 1)}
                    decDisabled={(asi[ab] || 0) <= 0}
                  />
                </td>
                <td className="dnd-build__total">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="dnd-build__hint">
        Point buy: base scores 8–15 (27 points). Racial: up to +2 per ability. ASI / Feat: level-up boosts (no cap).
      </p>
    </div>
  );
}
