import { motion } from "framer-motion";
import { EyeOff, Sparkles, ChevronRight } from "lucide-react";

interface WhoLikedMeProps {
  count: number;
  hints: { program: string; section: string | null; photo_hash: string }[];
  onOpen: () => void;
}

const WhoLikedMe = ({ count, hints, onOpen }: WhoLikedMeProps) => {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="w-full text-left glass-strong rounded-2xl p-4 mb-4 blossom-glow border border-blossom/20 hover:border-blossom/40 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-blossom" />
          <h3 className="font-display text-sm text-foreground">
            {count} {count === 1 ? "person" : "people"} liked you
          </h3>
          <Sparkles className="w-3.5 h-3.5 text-blossom/60" />
        </div>
        <ChevronRight className="w-4 h-4 text-blossom/60 group-hover:text-blossom transition-colors" />
      </div>

      {/* Blurred silhouettes */}
      <div className="flex items-center gap-2 mb-2">
        {hints.slice(0, 5).map((hint, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-body"
            style={{
              background: `linear-gradient(135deg, hsl(var(--blossom) / 0.3), hsl(var(--glow) / 0.2))`,
              backdropFilter: "blur(10px)",
              border: "1px solid hsl(var(--blossom) / 0.2)",
            }}
          >
            <span className="text-lg" style={{ filter: "blur(2px)" }}>
              {hint.program === "PGP25" ? "💃" : hint.program === "PGP24" ? "🕺" : "👤"}
            </span>
          </motion.div>
        ))}
        {count > 5 && (
          <span className="text-xs text-muted-foreground font-body">+{count - 5} more</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {hints.slice(0, 3).map((hint, i) => (
          <span key={i} className="text-[10px] text-muted-foreground font-body glass rounded-full px-2 py-0.5">
            {hint.program}{hint.section ? ` · Sec ${hint.section}` : ""}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-blossom/60 font-body mt-2 italic">
        Tap to reveal who they are 👀
      </p>
    </motion.button>
  );
};

export default WhoLikedMe;
