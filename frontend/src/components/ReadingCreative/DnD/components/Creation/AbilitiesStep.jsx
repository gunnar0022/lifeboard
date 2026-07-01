import AbilityBuildPanel from '../AbilityBuildPanel';

/**
 * Abilities step — reuses the shared point-buy panel. The racial layer arrives
 * pre-seeded from the Race step; the player spends 27 points on base scores and
 * can still nudge the racial placement.
 */
export default function AbilitiesStep({ draft, setDraft }) {
  return (
    <div className="crt-abilities">
      <AbilityBuildPanel character={draft} onUpdate={setDraft} />
    </div>
  );
}
