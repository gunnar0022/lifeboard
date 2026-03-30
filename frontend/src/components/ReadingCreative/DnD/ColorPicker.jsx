import { useState } from 'react';

const PRESETS = [
  '#8b0000', '#a82020', '#cc7a20', '#c9a96e',
  '#7a7a1a', '#2a6a2a', '#4a8a4a', '#2a5a6a',
  '#3a6a88', '#1a3a6a', '#4a2066', '#5a2a5a',
  '#6a3a5a', '#3a3228', '#8a7a62', '#5a4a3a',
];

export default function ColorPicker({ value, onChange }) {
  const [showHex, setShowHex] = useState(false);

  return (
    <div className="dnd-color-picker">
      <div className="dnd-color-picker__swatches">
        {PRESETS.map(c => (
          <button
            key={c}
            className={`dnd-color-picker__swatch ${value === c ? 'dnd-color-picker__swatch--active' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
      </div>
      <div className="dnd-color-picker__custom">
        <button
          className="dnd-color-picker__hex-toggle"
          onClick={() => setShowHex(!showHex)}
        >
          {showHex ? 'Hide' : 'Custom hex'}
        </button>
        {showHex && (
          <input
            className="dnd-field dnd-color-picker__hex-input"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="#4a8a4a"
            maxLength={7}
          />
        )}
      </div>
    </div>
  );
}
