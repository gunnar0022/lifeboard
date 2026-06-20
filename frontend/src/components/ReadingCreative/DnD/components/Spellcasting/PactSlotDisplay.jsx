import { classColor as resolveClassColor } from '../../dndUtils';

const LEVEL_LABELS = ['', '1st', '2nd', '3rd', '4th', '5th'];

/**
 * Warlock pact slots — count and slot level are DERIVED from Warlock level.
 * Pact slots always cast at the highest available level, so the cast picker
 * never asks; here we just track expended (recovers on a short rest).
 */
export default function PactSlotDisplay({ pactInfo, expended, onExpend }) {
  const color = resolveClassColor('Warlock');
  const { count, slotLevel } = pactInfo;
  const used = expended || 0;

  const togglePip = (i) => {
    // i is a slot index; clicking an available slot expends it, an expended one recovers.
    const available = i >= used;
    onExpend(available ? used + 1 : used);
  };

  if (count <= 0) return null;

  return (
    <div className="spell-pact">
      <h3 className="dnd-section-title">Pact Magic</h3>
      <div className="spell-pact__row">
        <span className="spell-pact__level">{LEVEL_LABELS[slotLevel] || `${slotLevel}th`}-level slots</span>
        <div className="spell-slots__pips">
          {Array.from({ length: count }, (_, i) => {
            const available = i >= used;
            return (
              <button key={i}
                className={`spell-slots__pip spell-pact__pip ${available ? 'spell-slots__pip--available' : 'spell-slots__pip--expended'}`}
                style={available ? { background: color, borderColor: color } : {}}
                onClick={() => togglePip(i)}
                title={available ? 'Expend pact slot' : 'Recover pact slot'}
              />
            );
          })}
        </div>
        <span className="spell-pact__recharge">Short Rest &#x21BA;</span>
      </div>
    </div>
  );
}
