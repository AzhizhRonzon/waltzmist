import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface MatchOverlayProps {
  matchName: string;
  onMessage: () => void;
  onClose: () => void;
}

const MatchOverlay = ({ matchName, onMessage, onClose }: MatchOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "hsl(var(--night) / 0.9)" }}
    >
      {/* Bloom petals */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 1],
            opacity: [0, 0.8, 0.4],
            x: Math.cos((i * 30 * Math.PI) / 180) * 150,
            y: Math.sin((i * 30 * Math.PI) / 180) * 150,
          }}
          transition={{ delay: 0.2 + i * 0.05, duration: 0.8, ease: "easeOut" }}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2C16 2 24 8 24 16C24 24 16 30 16 30C16 30 8 24 8 16C8 8 16 2 16 2Z"
              fill="hsl(4 100% 85% / 0.6)"
            />
          </svg>
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="text-center z-10"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Heart className="w-20 h-20 text-blossom mx-auto mb-6" fill="currentColor" />
        </motion.div>

        <h1 className="font-display text-4xl font-bold blossom-text mb-2">
          It's a Match!
        </h1>
        <p className="text-muted-foreground font-body text-lg mb-8">
          You and <span className="text-blossom font-semibold">{matchName}</span> vibed 🌸
        </p>

        <div className="flex flex-col gap-3">
          <button className="btn-waltz text-lg" onClick={onMessage}>
            Send a Message
          </button>
          <button className="btn-ghost-waltz" onClick={onClose}>
            Keep Swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MatchOverlay;
