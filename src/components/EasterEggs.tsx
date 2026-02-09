import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Konami code easter egg
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export const useKonamiCode = () => {
  const [activated, setActivated] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setKeys(prev => {
        const next = [...prev, e.key].slice(-KONAMI.length);
        if (next.join(",") === KONAMI.join(",")) {
          setActivated(true);
          setTimeout(() => setActivated(false), 5000);
        }
        return next;
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return activated;
};

// Double-tap love burst effect
export const LoveBurst = ({ x, y }: { x: number; y: number }) => (
  <div className="fixed pointer-events-none z-50" style={{ left: x - 20, top: y - 20 }}>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.span
        key={i}
        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.5, 0],
          x: Math.cos((i * 45 * Math.PI) / 180) * 60,
          y: Math.sin((i * 45 * Math.PI) / 180) * 60,
          opacity: [1, 1, 0],
        }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute text-lg"
      >
        {["🌸", "💕", "✨", "🌷", "💗", "🦋", "🌺", "💫"][i]}
      </motion.span>
    ))}
  </div>
);

// Shake to undo last swipe feedback
export const useShakeDetection = (onShake: () => void) => {
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let shakeCount = 0;
    let lastShake = 0;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const dx = Math.abs((acc.x || 0) - lastX);
      const dy = Math.abs((acc.y || 0) - lastY);
      const dz = Math.abs((acc.z || 0) - lastZ);

      if (dx + dy + dz > 30) {
        const now = Date.now();
        if (now - lastShake > 300) {
          shakeCount++;
          lastShake = now;
          if (shakeCount >= 3) {
            onShake();
            shakeCount = 0;
          }
        }
      }

      lastX = acc.x || 0;
      lastY = acc.y || 0;
      lastZ = acc.z || 0;
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [onShake]);
};

// Random witty loading messages
export const LOADING_QUIPS = [
  "Consulting the love gods...",
  "Shuffling the deck of hearts...",
  "Checking if the vibe is right...",
  "Calibrating the Maggi Metric...",
  "Asking the mess aunty for advice...",
  "Counting cherry blossoms...",
  "Rewriting your love story...",
  "Defrosting the cold Shillong air...",
  "Negotiating with the placement committee...",
  "Loading your anti-LinkedIn profile...",
];

export const getRandomQuip = () => LOADING_QUIPS[Math.floor(Math.random() * LOADING_QUIPS.length)];

// Typing indicator for chat
export const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-blossom/40"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

// Confetti burst for match celebration
export const ConfettiBurst = ({ active }: { active: boolean }) => {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: [0, 1, 0.5],
            opacity: [1, 1, 0],
            rotate: Math.random() * 720,
          }}
          transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
          className="absolute text-lg"
        >
          {["🌸", "🎉", "✨", "💕", "🌷", "🎊"][i % 6]}
        </motion.div>
      ))}
    </div>
  );
};

// Streak counter badge
export const StreakBadge = ({ days }: { days: number }) => {
  if (days < 2) return null;
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="glass rounded-full px-2.5 py-1 flex items-center gap-1"
    >
      <span className="text-sm">🔥</span>
      <span className="text-[11px] font-body font-semibold text-blossom">{days}</span>
    </motion.div>
  );
};
