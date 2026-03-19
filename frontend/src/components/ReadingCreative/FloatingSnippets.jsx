import { useMemo } from 'react';
import { motion } from 'framer-motion';
import './FloatingSnippets.css';

export default function FloatingSnippets({ snippets }) {
  const positioned = useMemo(() => {
    if (!snippets || snippets.length === 0) return [];
    return snippets.map((s, i) => ({
      ...s,
      x: 5 + (i % 3) * 30 + Math.random() * 15,
      y: 10 + Math.floor(i / 3) * 35 + Math.random() * 20,
      size: 0.7 + Math.random() * 0.3,
      opacity: 0.25 + Math.random() * 0.35,
      drift: 8 + Math.random() * 15,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * -10,
    }));
  }, [snippets]);

  return (
    <div className="floating-snippets card">
      {positioned.length === 0 ? (
        <div className="floating-snippets__empty">
          Your words will appear here as you write
        </div>
      ) : (
        positioned.map((s, i) => (
          <motion.div
            key={i}
            className="floating-snippets__item"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: `${s.size}rem`,
              opacity: s.opacity,
            }}
            animate={{
              x: [0, s.drift, -s.drift / 2, 0],
              y: [0, -s.drift / 2, s.drift / 3, 0],
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: s.delay,
            }}
          >
            {s.text.length > 120 ? s.text.slice(0, 120) + '...' : s.text}
          </motion.div>
        ))
      )}
    </div>
  );
}
