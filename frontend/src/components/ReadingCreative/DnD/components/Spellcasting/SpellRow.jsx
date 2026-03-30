import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Zap } from 'lucide-react';
import { CLASS_COLORS } from '../../dndUtils';

export default function SpellRow({ spell, isConcentrating, className, onConcentrate, onRemove, editMode, dragHandleProps }) {
  const [expanded, setExpanded] = useState(false);
  const classColor = CLASS_COLORS[className] || '#c9a96e';

  if (!spell) return null;

  const concBadge = !!spell.concentration;
  const isActive = isConcentrating;

  return (
    <div className={`spell-row ${isActive ? 'spell-row--concentrating' : ''}`}
      style={isActive ? { borderColor: classColor, boxShadow: `0 0 8px ${classColor}33` } : {}}>
      <div className="spell-row__compact" onClick={() => setExpanded(!expanded)}>
        {dragHandleProps && (
          <span className="spell-row__drag" {...dragHandleProps} onClick={e => e.stopPropagation()}>&#x2261;</span>
        )}

        {concBadge && (
          <span className={`spell-row__conc-badge ${isActive ? 'spell-row__conc-badge--active' : ''}`}
            style={isActive ? { background: classColor, borderColor: classColor } : {}}>
            {isActive ? 'ACTIVE' : 'CONC'}
          </span>
        )}

        <span className="spell-row__name">{spell.name}</span>

        {spell.damage && (
          <span className="spell-row__damage">{spell.damage}</span>
        )}

        <span className="spell-row__range">{spell.range}</span>

        {spell.casting_time && spell.casting_time !== '1 action' && (
          <span className="spell-row__tag">{spell.casting_time}</span>
        )}

        {spell.save_type && (
          <span className="spell-row__tag">{spell.save_type} save</span>
        )}

        {spell.ritual ? <span className="spell-row__tag spell-row__tag--ritual">Ritual</span> : null}

        <span className="spell-row__toggle">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {expanded && (
        <div className="spell-row__details">
          <div className="spell-row__detail-grid">
            <div><strong>Casting Time:</strong> {spell.casting_time}</div>
            <div><strong>Range:</strong> {spell.range}{spell.aoe ? ` (${spell.aoe})` : ''}</div>
            <div><strong>Duration:</strong> {spell.duration}{spell.concentration ? ' (concentration)' : ''}</div>
            <div><strong>Components:</strong> {spell.components}</div>
            {spell.save_type && (
              <div><strong>Save:</strong> {spell.save_type}{spell.save_effect ? ` \u00B7 ${spell.save_effect}` : ''}</div>
            )}
          </div>

          {spell.upcast && (
            <div className="spell-row__upcast">
              <strong>At Higher Levels:</strong> {spell.upcast}
            </div>
          )}

          <p className="spell-row__desc">{spell.description}</p>

          <div className="spell-row__actions">
            {spell.concentration && (
              <button
                className={`spell-row__concentrate-btn ${isActive ? 'spell-row__concentrate-btn--active' : ''}`}
                style={isActive ? { borderColor: classColor, color: classColor } : {}}
                onClick={(e) => { e.stopPropagation(); onConcentrate && onConcentrate(spell.id); }}
              >
                <Zap size={12} />
                {isActive ? 'Drop Concentration' : 'Concentrate'}
              </button>
            )}
            <button className="spell-row__remove-btn" onClick={(e) => { e.stopPropagation(); onRemove && onRemove(spell.id); }}>
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
