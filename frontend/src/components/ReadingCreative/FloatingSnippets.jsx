import { useRef, useEffect, useState, useCallback } from 'react';
import './FloatingSnippets.css';

/*
 * Physics-based floating text with:
 * - Gentle repulsion between snippets (inverse distance)
 * - Dead zone bouncing (momentum inversion on contact)
 * - Lifecycle queue: fade in → float → bold → float → fade out
 * - requestAnimationFrame loop, no CSS animations
 */

const REPEL_STRENGTH = 0.8;
const REPEL_RADIUS = 120;       // px — beyond this, no force
const DRAG = 0.97;              // velocity damping per frame
const MAX_SPEED = 0.4;          // px per frame cap
const CYCLE_MS = 6000;          // lifecycle tick interval
const VISIBLE_TARGET = 22;      // how many on screen at once
const FADE_DURATION = 1500;     // ms for fade in/out

// Dead zones as fractions of container size
// Title area: top center
const DEAD_ZONES = [
  { x: 0.18, y: 0, w: 0.64, h: 0.09 },  // title bar area
];

function estimateBox(snippet, containerW, containerH) {
  const charW = snippet.size * 7;
  const w = Math.min(snippet.text.length * charW * 0.48, containerW * 0.30);
  const h = snippet.size * 28;
  return { w, h };
}

function isInDeadZone(px, py, bw, bh, cw, ch) {
  for (const dz of DEAD_ZONES) {
    const dzLeft = dz.x * cw;
    const dzTop = dz.y * ch;
    const dzRight = (dz.x + dz.w) * cw;
    const dzBottom = (dz.y + dz.h) * ch;
    if (px + bw > dzLeft && px < dzRight && py + bh > dzTop && py < dzBottom) {
      return dz;
    }
  }
  return null;
}

function spawnPosition(text, size, placed, cw, ch) {
  const box = estimateBox({ text, size }, cw, ch);
  for (let attempt = 0; attempt < 30; attempt++) {
    const px = Math.random() * (cw - box.w);
    const py = Math.random() * (ch - box.h);
    // Skip dead zones
    if (isInDeadZone(px, py, box.w, box.h, cw, ch)) continue;
    // Skip overlaps with placed items
    let overlaps = false;
    for (const other of placed) {
      const ob = estimateBox(other, cw, ch);
      if (Math.abs(px - other.x) < (box.w + ob.w) * 0.5 + 10 &&
          Math.abs(py - other.y) < (box.h + ob.h) * 0.5 + 10) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) return { x: px, y: py };
  }
  // Fallback
  return { x: Math.random() * (cw - box.w), y: Math.random() * (ch - box.h) };
}

export default function FloatingSnippets({ snippets }) {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const queueRef = useRef([]);
  const boldIndexRef = useRef(-1);
  const lastCycleRef = useRef(0);
  const frameRef = useRef(null);
  const [renderTick, setRenderTick] = useState(0);

  // Initialize particles and queue from snippets
  useEffect(() => {
    if (!snippets || snippets.length === 0 || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cw = rect.width || 800;
    const ch = rect.height || 600;

    const all = snippets.map((s, i) => ({
      id: i,
      text: s.text.length > 100 ? s.text.slice(0, 100) + '...' : s.text,
      size: 0.82 + Math.random() * 0.3,
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: 0,
      phase: 'waiting', // waiting | fading_in | floating | bolded | fading_out
      phaseStart: 0,
    }));

    // Place initial visible set
    const visible = all.slice(0, VISIBLE_TARGET);
    const waiting = all.slice(VISIBLE_TARGET);
    const placed = [];

    for (const p of visible) {
      const pos = spawnPosition(p.text, p.size, placed, cw, ch);
      p.x = pos.x;
      p.y = pos.y;
      p.opacity = 0.12 + Math.random() * 0.06;
      p.phase = 'floating';
      placed.push(p);
    }

    particlesRef.current = visible;
    queueRef.current = waiting;
    boldIndexRef.current = -1;
    lastCycleRef.current = performance.now();

    setRenderTick(t => t + 1);
  }, [snippets]);

  // Physics + lifecycle loop
  useEffect(() => {
    if (!containerRef.current) return;

    const tick = (now) => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth || 800;
      const ch = el.clientHeight || 600;

      const particles = particlesRef.current;

      // --- Lifecycle tick ---
      if (now - lastCycleRef.current > CYCLE_MS) {
        lastCycleRef.current = now;

        // 1. Un-bold previous
        const prevBold = boldIndexRef.current;
        if (prevBold >= 0 && prevBold < particles.length && particles[prevBold].phase === 'bolded') {
          particles[prevBold].phase = 'floating';
          particles[prevBold].opacity = 0.15;
        }

        // 2. Bold a random floating one
        const floaters = particles.filter(p => p.phase === 'floating');
        if (floaters.length > 0) {
          const pick = floaters[Math.floor(Math.random() * floaters.length)];
          pick.phase = 'bolded';
          pick.opacity = 0.85;
          pick.phaseStart = now;
          boldIndexRef.current = particles.indexOf(pick);
        }

        // 3. Fade one out (not the bold one)
        const canFadeOut = particles.filter(p => p.phase === 'floating');
        if (canFadeOut.length > 1 && particles.length > VISIBLE_TARGET - 3) {
          const victim = canFadeOut[Math.floor(Math.random() * canFadeOut.length)];
          victim.phase = 'fading_out';
          victim.phaseStart = now;
        }

        // 4. Fade one in from queue
        if (queueRef.current.length > 0 && particles.length < VISIBLE_TARGET + 3) {
          const newP = queueRef.current.shift();
          const pos = spawnPosition(newP.text, newP.size, particles, cw, ch);
          newP.x = pos.x;
          newP.y = pos.y;
          newP.vx = (Math.random() - 0.5) * 0.2;
          newP.vy = (Math.random() - 0.5) * 0.2;
          newP.opacity = 0;
          newP.phase = 'fading_in';
          newP.phaseStart = now;
          particles.push(newP);
        }
      }

      // --- Physics ---
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const aBox = estimateBox(a, cw, ch);

        // Repulsion from other particles
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < REPEL_RADIUS) {
            const force = REPEL_STRENGTH / (dist * dist) * 0.5;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }

        // Clamp speed
        const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        if (speed > MAX_SPEED) {
          a.vx = (a.vx / speed) * MAX_SPEED;
          a.vy = (a.vy / speed) * MAX_SPEED;
        }

        // Apply drag
        a.vx *= DRAG;
        a.vy *= DRAG;

        // Move
        a.x += a.vx;
        a.y += a.vy;

        // Wall bounce (container edges)
        if (a.x < 0) { a.x = 0; a.vx = Math.abs(a.vx) * 0.5; }
        if (a.y < 0) { a.y = 0; a.vy = Math.abs(a.vy) * 0.5; }
        if (a.x + aBox.w > cw) { a.x = cw - aBox.w; a.vx = -Math.abs(a.vx) * 0.5; }
        if (a.y + aBox.h > ch) { a.y = ch - aBox.h; a.vy = -Math.abs(a.vy) * 0.5; }

        // Dead zone bounce — invert perpendicular momentum
        const dz = isInDeadZone(a.x, a.y, aBox.w, aBox.h, cw, ch);
        if (dz) {
          const dzCx = (dz.x + dz.w / 2) * cw;
          const dzCy = (dz.y + dz.h / 2) * ch;
          const aCx = a.x + aBox.w / 2;
          const aCy = a.y + aBox.h / 2;
          // Push away from dead zone center
          if (Math.abs(aCx - dzCx) > Math.abs(aCy - dzCy)) {
            a.vx = -a.vx;
            a.x += a.vx * 3;
          } else {
            a.vy = -a.vy;
            a.y += a.vy * 3;
          }
        }

        // Fade transitions
        if (a.phase === 'fading_in') {
          const progress = (now - a.phaseStart) / FADE_DURATION;
          a.opacity = Math.min(0.15, progress * 0.15);
          if (progress >= 1) {
            a.phase = 'floating';
            a.opacity = 0.15;
          }
        } else if (a.phase === 'fading_out') {
          const progress = (now - a.phaseStart) / FADE_DURATION;
          a.opacity = Math.max(0, 0.15 * (1 - progress));
          if (progress >= 1) {
            // Recycle to queue
            a.phase = 'waiting';
            a.opacity = 0;
            queueRef.current.push(a);
            particles.splice(i, 1);
            i--;
          }
        }
      }

      setRenderTick(t => t + 1);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [snippets]);

  const particles = particlesRef.current;

  return (
    <div className="floating-snippets" ref={containerRef}>
      {(!snippets || snippets.length === 0) && (
        <div className="floating-snippets__empty">
          Your words will appear here as you write
        </div>
      )}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`floating-snippets__item ${p.phase === 'bolded' ? 'floating-snippets__item--focus' : ''}`}
          style={{
            transform: `translate(${p.x}px, ${p.y}px)`,
            fontSize: `${p.size}rem`,
            opacity: p.opacity,
            zIndex: p.phase === 'bolded' ? 2 : 0,
          }}
        >
          {p.text}
        </div>
      ))}
    </div>
  );
}
