import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles, Zap } from "lucide-react";
import type { ProfileData } from "../context/WaltzStore";

interface SwipeCardProps {
  profile: ProfileData;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onNudge?: () => void;
  isTop: boolean;
}

const SwipeCard = ({ profile, onSwipeLeft, onSwipeRight, onNudge, isTop }: SwipeCardProps) => {
  const [dragX, setDragX] = useState(0);

  const getSwipeDirection = () => {
    if (dragX > 50) return "right";
    if (dragX < -50) return "left";
    return null;
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ zIndex: isTop ? 10 : 1 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) {
          onSwipeRight();
        } else if (info.offset.x < -120) {
          onSwipeLeft();
        }
        setDragX(0);
      }}
      animate={isTop ? { rotate: dragX * 0.05 } : { scale: 0.95, y: 10 }}
      exit={
        getSwipeDirection() === "right"
          ? { x: 400, rotate: 20, opacity: 0 }
          : { x: -400, rotate: -20, opacity: 0 }
      }
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="glass-strong rounded-3xl overflow-hidden h-full flex flex-col blossom-glow">
        {/* Photo area */}
        <div className="relative h-[55%] overflow-hidden">
          <img
            src={profile.photos[0]}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Swipe indicators */}
          <AnimatePresence>
            {dragX > 50 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-6 left-6 bg-blossom/20 backdrop-blur-sm border-2 border-blossom rounded-2xl px-6 py-2"
              >
                <span className="text-blossom font-display text-2xl font-bold">VIBE ✨</span>
              </motion.div>
            )}
            {dragX < -50 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-6 right-6 bg-muted/20 backdrop-blur-sm border-2 border-muted-foreground rounded-2xl px-6 py-2"
              >
                <span className="text-muted-foreground font-display text-2xl font-bold">PASS</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compatibility badge */}
          <div className="absolute top-4 right-4 glass rounded-full px-3 py-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blossom" />
            <span className="text-sm font-bold text-blossom">{profile.compatibility}%</span>
          </div>

          {/* Nudge button */}
          {onNudge && (
            <button
              onClick={(e) => { e.stopPropagation(); onNudge(); }}
              className="absolute top-4 left-4 glass rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-blossom/10 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-blossom" />
              <span className="text-[11px] font-body text-blossom">Nudge</span>
            </button>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-3xl font-display font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              {profile.batch} · Section {profile.section}
            </p>
          </div>
        </div>

        {/* Info area */}
        <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto">
          {/* Waltz-O-Meter */}
          <div className="glass rounded-2xl p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1 font-body">
              Waltz-O-Meter
            </p>
            <p className="text-sm font-body text-blossom-soft">
              "{profile.compatibility}% Match — You both hate 8 AMs."
            </p>
          </div>

          {/* Maggi Metric */}
          <div className="flex items-center justify-between glass rounded-2xl p-3">
            <span className="text-xs text-muted-foreground font-body">Silent Slurper</span>
            <div className="flex-1 mx-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${profile.maggiMetric}%`,
                  background: "linear-gradient(90deg, hsl(var(--blossom)), hsl(var(--glow)))"
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-body">Philosophy Spouter</span>
          </div>

          {/* Trip & Spot */}
          <div className="grid grid-cols-2 gap-2">
            <div className="glass rounded-2xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-body">Fav Trip</p>
              <p className="text-sm text-foreground font-body mt-0.5">{profile.favoriteTrip}</p>
            </div>
            <div className="glass rounded-2xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-body">Party Spot</p>
              <p className="text-sm text-foreground font-body mt-0.5">{profile.partySpot}</p>
            </div>
          </div>

          {/* Red Flag */}
          {profile.redFlag && (
            <div className="glass rounded-2xl p-3 border border-maroon/20">
              <p className="text-[10px] text-maroon uppercase tracking-widest font-body">🚩 Red Flag</p>
              <p className="text-sm text-foreground font-body mt-0.5 italic">
                "I honestly believe that {profile.redFlag}"
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Action buttons
export const SwipeActions = ({
  onLeft,
  onRight,
  panicMode = false,
}: {
  onLeft: () => void;
  onRight: () => void;
  panicMode?: boolean;
}) => (
  <div className="flex items-center justify-center gap-6 mt-4">
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onLeft}
      className="w-16 h-16 rounded-full glass flex items-center justify-center border border-muted-foreground/20 transition-colors hover:border-muted-foreground/40"
    >
      <X className="w-7 h-7 text-muted-foreground" />
    </motion.button>

    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onRight}
      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${panicMode ? "animate-pulse" : ""}`}
      style={{
        background: panicMode
          ? "linear-gradient(135deg, hsl(0 80% 55%), hsl(var(--blossom)))"
          : "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))",
        boxShadow: panicMode
          ? "0 0 30px hsl(0 80% 55% / 0.4)"
          : "0 0 40px hsl(var(--blossom) / 0.15)",
      }}
    >
      <div className="flex flex-col items-center">
        <Heart className="w-8 h-8 text-primary-foreground" fill="currentColor" />
        {panicMode && (
          <span className="text-[8px] font-bold text-primary-foreground mt-0.5 uppercase tracking-wider">
            PANIC
          </span>
        )}
      </div>
    </motion.button>
  </div>
);

export default SwipeCard;
