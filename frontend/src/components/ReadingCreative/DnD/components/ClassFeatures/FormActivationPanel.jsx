import { motion, AnimatePresence } from 'framer-motion';

/**
 * A prominent "transform" panel modeled on the Wild Shape button — a glowing
 * hero card with a big activate/end toggle and an animated effects reveal.
 * Used by druid-subclass forms (Starry Form, Symbiotic Entity) so activating a
 * subclass feature feels as weighty as transforming.
 *
 * Pass `picker` + `isPicking` for forms that choose a variant on activation
 * (e.g. constellation), or just `onActivate` for one-tap forms.
 */
export default function FormActivationPanel({
  color, icon, title, idleLabel, endLabel, activeLabel,
  active, canActivate, disabledReason,
  isPicking, picker, onActivate, onEnd, children,
}) {
  const style = { '--form-color': color };
  return (
    <motion.div
      className={`dnd-form-panel ${active ? 'dnd-form-panel--active' : ''}`}
      style={style}
      animate={active ? { boxShadow: `0 0 22px ${color}66` } : { boxShadow: `0 0 0px ${color}00` }}
      transition={{ duration: 0.4 }}
    >
      <div className="dnd-form-panel__header">
        <h4 className="dnd-form-panel__title">{icon}{title}</h4>
        {active && (
          <motion.span className="dnd-form-panel__status"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            {activeLabel}
          </motion.span>
        )}
      </div>

      {isPicking ? (
        picker
      ) : (
        <button
          className={`dnd-form-panel__toggle ${active ? 'dnd-form-panel__toggle--end' : ''}`}
          style={style}
          onClick={active ? onEnd : onActivate}
          disabled={!active && !canActivate}
          title={!active && !canActivate ? (disabledReason || '') : ''}
        >
          {active ? endLabel : idleLabel}
        </button>
      )}

      <AnimatePresence initial={false}>
        {active && children && (
          <motion.div className="dnd-form-panel__effects"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
