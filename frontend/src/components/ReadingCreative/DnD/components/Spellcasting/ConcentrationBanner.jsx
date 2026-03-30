import { CLASS_COLORS } from '../../dndUtils';

export default function ConcentrationBanner({ spellName, className, onDrop }) {
  const classColor = CLASS_COLORS[className] || '#c9a96e';

  return (
    <div className="spell-concentration-banner" style={{ borderColor: classColor, boxShadow: `0 0 12px ${classColor}33` }}>
      <span className="spell-concentration-banner__icon" style={{ color: classColor }}>&#x29BF;</span>
      <span className="spell-concentration-banner__text">
        Concentrating on: <strong>{spellName}</strong>
      </span>
      <button className="spell-concentration-banner__drop" onClick={onDrop}>
        Drop Concentration
      </button>
    </div>
  );
}
