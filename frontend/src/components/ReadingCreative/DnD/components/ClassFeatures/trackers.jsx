/**
 * Shared Combat-tab trackers — small, accent-aware building blocks so each
 * subclass block can compose resource pools and single-use abilities without
 * re-implementing the pip/toggle plumbing. They render in the `dnd-warmagic`
 * idiom (the block sets `--block-accent`), so they inherit the host's color.
 */

/** A pool of N uses that recharge on a rest (pips + Use / restore). */
export function UsePool({ icon, title, used, max, note, onUse, onRestore }) {
  const remaining = Math.max(0, max - used);
  return (
    <div className="dnd-warmagic__section">
      <div className="dnd-warmagic__head">
        <h4 className="dnd-warmagic__subtitle">{icon} {title}</h4>
        <span className="dnd-warmagic__uses">{remaining}/{max}</span>
      </div>
      <div className="dnd-warmagic__pips">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`dnd-warmagic__pip ${i < remaining ? 'dnd-warmagic__pip--full' : ''}`} />
        ))}
      </div>
      <div className="dnd-warmagic__row">
        <span className="dnd-warmagic__note">{note}</span>
        <div className="dnd-warmagic__btns">
          <button className="dnd-warmagic__btn" onClick={onRestore} disabled={used <= 0}>+</button>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={onUse} disabled={remaining <= 0}>Use</button>
        </div>
      </div>
    </div>
  );
}

/** A single ability that recharges on a rest (spent / ready toggle). */
export function OnceToggle({ icon, title, used, rest = 'short rest', note, onToggle, children }) {
  return (
    <div className={`dnd-warmagic__section ${used ? 'dnd-archfey__spent' : ''}`}>
      <div className="dnd-warmagic__head">
        <h4 className="dnd-warmagic__subtitle">{icon} {title}</h4>
        <span className="dnd-warmagic__uses">{used ? 'spent' : `1 / ${rest}`}</span>
      </div>
      {children}
      <div className="dnd-warmagic__row">
        <span className="dnd-warmagic__note">{note}</span>
        <div className="dnd-warmagic__btns">
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={onToggle}>{used ? 'Reset' : 'Use'}</button>
        </div>
      </div>
    </div>
  );
}
