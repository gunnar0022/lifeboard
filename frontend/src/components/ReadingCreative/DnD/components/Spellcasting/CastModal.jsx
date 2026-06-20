import { useState, useMemo } from 'react';
import { X, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { classColor as resolveClassColor } from '../../dndUtils';
import { computeScaling, scalingLabel } from '../../spellSlots';

const ORDINAL = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const ord = (n) => ORDINAL[n] || `${n}th`;

/**
 * The cast / upcast picker. Surfaces every legal casting *source* for a spell —
 * standard slots at level >= the spell's, bonus (item/feat) slots, the warlock
 * pact pool, and any per-rest "granted" uses — and previews the spell's effect
 * at the chosen level so an upcast actually feels different.
 */
export default function CastModal({
  spell, sources, charLevel, className,
  concentratingOnName, onCast, onClose,
}) {
  const color = resolveClassColor(className);
  const isCantrip = (spell.level || 0) === 0;

  // Default to the cheapest legal source (lowest level).
  const [selected, setSelected] = useState(() => {
    if (isCantrip) return { key: 'cantrip', castLevel: 0 };
    const sorted = [...sources].sort((a, b) => a.castLevel - b.castLevel);
    return sorted[0] || null;
  });

  // Cantrips scale on character level; leveled spells on the chosen slot level.
  const effectLevel = isCantrip ? charLevel : (selected?.castLevel ?? spell.level);
  const scaling = useMemo(
    () => computeScaling(spell, effectLevel),
    [spell, effectLevel]
  );
  const scaleText = scalingLabel(scaling);

  const willBreakConcentration =
    spell.concentration && concentratingOnName && concentratingOnName !== spell.name;

  const handleCast = () => {
    onCast({
      source: isCantrip ? { type: 'cantrip' } : selected,
      castLevel: effectLevel,
      isConcentration: !!spell.concentration,
    });
    onClose();
  };

  const canCast = isCantrip || !!selected;

  return (
    <div className="cast-modal__backdrop" onClick={onClose}>
      <div className="cast-modal" style={{ borderColor: color }} onClick={e => e.stopPropagation()}>
        <div className="cast-modal__head" style={{ background: `linear-gradient(90deg, ${color}22, transparent)` }}>
          <Sparkles size={16} style={{ color }} />
          <h3 className="cast-modal__title">{spell.name}</h3>
          <span className="cast-modal__base-level">{ord(spell.level || 0)}{!isCantrip ? ' level' : ''}</span>
          <button className="cast-modal__close" onClick={onClose}><X size={16} /></button>
        </div>

        {!isCantrip && (
          <div className="cast-modal__section">
            <span className="cast-modal__label">Cast using</span>
            {sources.length === 0 ? (
              <div className="cast-modal__no-slots">No slots or uses available for this spell.</div>
            ) : (
              <div className="cast-modal__sources">
                {sources.map((s) => {
                  const active = selected && selected.key === s.key;
                  return (
                    <button
                      key={s.key}
                      className={`cast-source ${active ? 'cast-source--active' : ''}`}
                      style={active ? { borderColor: color, boxShadow: `0 0 0 1px ${color}, 0 0 10px ${color}44` } : {}}
                      onClick={() => setSelected(s)}
                    >
                      <span className="cast-source__main">{s.label}</span>
                      <span className="cast-source__sub">
                        {s.remaining != null ? `${s.remaining} left` : ''}
                        {s.castLevel > spell.level ? ` · +${s.castLevel - spell.level}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Upcast / scaling preview */}
        <div className="cast-modal__preview" style={{ borderColor: `${color}44` }}>
          <div className="cast-modal__preview-head">
            <span className="cast-modal__cast-at" style={{ color }}>
              {isCantrip ? `Cantrip · character level ${charLevel}` : `Casting at ${ord(effectLevel)} level`}
            </span>
            {scaling.steps > 0 && !isCantrip && (
              <span className="cast-modal__steps">+{scaling.steps} above base</span>
            )}
          </div>

          {scaleText ? (
            <div className="cast-modal__computed">
              <Zap size={13} style={{ color }} />
              <strong>{scaleText}</strong>
              {spell.damage && scaling.kind === 'damage' && scaling.steps > 0 && (
                <span className="cast-modal__from">(base {spell.damage})</span>
              )}
            </div>
          ) : spell.upcast ? (
            <div className="cast-modal__upcast-text"><strong>At Higher Levels:</strong> {spell.upcast}</div>
          ) : (
            <div className="cast-modal__upcast-text cast-modal__upcast-text--muted">
              {isCantrip ? 'This cantrip does not scale with structured data.' : 'No upcast effect recorded for this spell.'}
            </div>
          )}
        </div>

        {willBreakConcentration && (
          <div className="cast-modal__conc-warn">
            <AlertTriangle size={14} />
            <span>This will drop concentration on <strong>{concentratingOnName}</strong>.</span>
          </div>
        )}

        <div className="cast-modal__actions">
          <button className="cast-modal__cancel" onClick={onClose}>Cancel</button>
          <button
            className="cast-modal__cast"
            disabled={!canCast}
            style={canCast ? { background: color, borderColor: color } : {}}
            onClick={handleCast}
          >
            <Zap size={14} /> {isCantrip ? 'Cast Cantrip' : 'Cast'}
          </button>
        </div>
      </div>
    </div>
  );
}
