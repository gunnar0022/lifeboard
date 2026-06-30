import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Shield, Sparkles, ScrollText, Wand2 } from 'lucide-react';
import { CLASS_COLORS } from '../../dndUtils';
import { AutoFeatureCard } from '../FeatureList';
import LevelUpSpells from './LevelUpSpells';

function FeatureZone({ title, features, accent, ctx }) {
  if (!features || features.length === 0) return null;
  return (
    <section className="dnd-lvlup__zone">
      <h4 className="dnd-lvlup__zone-title" style={{ color: accent }}>{title}</h4>
      <div className="dnd-features__grid">
        {features.map(f => <AutoFeatureCard key={f.id || f.name} feat={f} {...ctx} />)}
      </div>
    </section>
  );
}

/**
 * Level Up reveal + recap. `mode='celebrate'` plays the staged entrance
 * animation (big level, then stat chips, then the persistent panel); `mode='recap'`
 * skips straight to a static summary. Both share the same Features / Spells panel.
 * Features render exactly like the Features tab (AutoFeatureCard) so choices like
 * ASI / feat are editable right here.
 */
export default function LevelUpModal({ summary, mode = 'celebrate', character, onUpdate, onClose }) {
  const celebrate = mode === 'celebrate';
  const accent = CLASS_COLORS?.[summary.className] || 'var(--dnd-accent)';
  const [tab, setTab] = useState('features');

  const featureCtx = {
    classFeature: character.classFeature,
    racialFeature: character.racialFeature,
    onUpdate,
    level: summary.level,
    abilities: character.abilities,
  };

  // Stagger the entrance only when celebrating.
  const container = celebrate
    ? { hidden: {}, show: { transition: { staggerChildren: 0.18, delayChildren: 0.15 } } }
    : {};
  const rise = celebrate
    ? { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }
    : { hidden: {}, show: {} };

  const showSpellsTab = summary.isCaster;

  // Backdrop-only close: a click that originated on a nested modal (the Add Spell
  // picker) has a different target, so it won't close the reveal too.
  const onOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="dnd-lvlup__overlay" onClick={onOverlayClick}>
      <div className="dnd-lvlup" role="dialog" aria-modal="true" style={{ '--lvlup-accent': accent }}>
        <button className="dnd-lvlup__close" onClick={onClose} aria-label="Close"><X size={18} /></button>

        <motion.div
          className="dnd-lvlup__hero"
          variants={container}
          initial={celebrate ? 'hidden' : false}
          animate="show"
        >
          {/* Big level badge */}
          <motion.div
            className="dnd-lvlup__badge"
            variants={rise}
            initial={celebrate ? { scale: 0.4, opacity: 0, rotate: -8 } : false}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={celebrate ? { type: 'spring', stiffness: 220, damping: 14 } : { duration: 0 }}
          >
            <span className="dnd-lvlup__badge-kicker">{celebrate ? 'Level Up!' : 'Level'}</span>
            <span className="dnd-lvlup__badge-num">{summary.level}</span>
            <span className="dnd-lvlup__badge-class">
              {summary.className}{summary.subclass ? ` · ${summary.subclass}` : ''}
            </span>
          </motion.div>

          {/* Stat chips — only render the ones that actually changed (no +0) */}
          <motion.div className="dnd-lvlup__chips" variants={rise}>
            {summary.hpGain > 0 && (
              <div className="dnd-lvlup__chip dnd-lvlup__chip--hp">
                <Heart size={16} />
                <span className="dnd-lvlup__chip-val">+{summary.hpGain}</span>
                <span className="dnd-lvlup__chip-label">Max HP</span>
              </div>
            )}
            {summary.profIncreased && (
              <div className="dnd-lvlup__chip dnd-lvlup__chip--prof">
                <Shield size={16} />
                <span className="dnd-lvlup__chip-val">+{summary.profAfter}</span>
                <span className="dnd-lvlup__chip-label">Proficiency</span>
              </div>
            )}
            {summary.slotsChanged && (
              <div className="dnd-lvlup__chip dnd-lvlup__chip--slots">
                <Sparkles size={16} />
                <span className="dnd-lvlup__chip-val">↑</span>
                <span className="dnd-lvlup__chip-label">Spell Slots</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Persistent panel: tabs */}
        <motion.div
          className="dnd-lvlup__panel"
          initial={celebrate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={celebrate ? { delay: 0.7, duration: 0.4 } : { duration: 0 }}
        >
          <div className="dnd-lvlup__tabs">
            <button
              className={`dnd-lvlup__tab ${tab === 'features' ? 'dnd-lvlup__tab--active' : ''}`}
              onClick={() => setTab('features')}
            >
              <ScrollText size={14} /> Features{summary.featureCount > 0 ? ` (${summary.featureCount})` : ''}
            </button>
            {showSpellsTab && (
              <button
                className={`dnd-lvlup__tab ${tab === 'spells' ? 'dnd-lvlup__tab--active' : ''}`}
                onClick={() => setTab('spells')}
              >
                <Wand2 size={14} /> Spells
              </button>
            )}
          </div>

          <div className="dnd-lvlup__body">
            {tab === 'features' && (
              summary.featureCount === 0 ? (
                <p className="dnd-lvlup__empty">No new features at this level — but your HP, slots, or proficiency still grow above.</p>
              ) : (
                <div className="dnd-lvlup__zones">
                  <FeatureZone title={summary.className} features={summary.features.class} accent={accent} ctx={featureCtx} />
                  <FeatureZone title={summary.subclass || 'Subclass'} features={summary.features.subclass} accent={accent} ctx={featureCtx} />
                  <FeatureZone title={summary.race || 'Racial'} features={summary.features.race} accent="var(--dnd-class-druid)" ctx={featureCtx} />
                </div>
              )
            )}

            {tab === 'spells' && showSpellsTab && (
              <LevelUpSpells character={character} summary={summary} onUpdate={onUpdate} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
