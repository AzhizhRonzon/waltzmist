import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

interface WhoLikedMeProps {
  count: number;
}

const LIKED_COPY = [
  "Your vibe is magnetic. Keep swiping to find them 💫",
  "Someone out there is waiting for your right swipe 🌸",
  "The Clouds know something you don't... yet ✨",
  "Keep dancing, your partner might be the next card 💃",
];

const WhoLikedMe = ({ count }: WhoLikedMeProps) => {
  if (count === 0) return null;

  const copy = LIKED_COPY[Math.floor(Math.random() * LIKED_COPY.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass-strong rounded-2xl p-3.5 mb-3 border border-blossom/15"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(var(--blossom) / 0.2), hsl(var(--glow) / 0.15))" }}
        >
          <Heart className="w-4 h-4 text-blossom" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display text-foreground">
            {count} {count === 1 ? "person" : "people"} liked you
          </p>
          <p className="text-[10px] text-muted-foreground font-body mt-0.5 truncate">
            {copy}
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-blossom/40 flex-shrink-0" />
      </div>
    </motion.div>
  );
};

export default WhoLikedMe;
