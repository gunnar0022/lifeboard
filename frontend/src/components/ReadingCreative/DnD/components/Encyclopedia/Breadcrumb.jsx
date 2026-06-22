import { ChevronLeft, Home } from 'lucide-react';

/**
 * Breadcrumb + back control for the encyclopedia. Every crumb is clickable
 * (jump straight back to any ancestor — e.g. Drow → Races in one click), the
 * Home button cuts the whole stack, and Back pops one frame. Hidden on the home
 * frame, where there's nowhere to go back to.
 */
export default function Breadcrumb({ stack, onBack, onHome, onGoto }) {
  if (stack.length <= 1) return null;
  return (
    <div className="wiki-crumbs">
      <button className="wiki-crumbs__btn" onClick={onBack} title="Back">
        <ChevronLeft size={16} />
      </button>
      <button className="wiki-crumbs__btn" onClick={onHome} title="Home">
        <Home size={14} />
      </button>
      <div className="wiki-crumbs__trail">
        {stack.map((frame, i) => {
          const last = i === stack.length - 1;
          return (
            <span key={i} className="wiki-crumbs__seg">
              {i > 0 && <span className="wiki-crumbs__sep">/</span>}
              {last ? (
                <span className="wiki-crumbs__here">{frame.title}</span>
              ) : (
                <button className="wiki-crumbs__link" onClick={() => onGoto(i)}>
                  {frame.title}
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
