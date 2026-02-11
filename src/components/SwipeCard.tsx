import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, X, Sparkles, Zap, ChevronLeft, ChevronRight, Star, Moon, Sun, Instagram } from "lucide-react";
import type { ProfileData } from "../context/WaltzStore";

interface SwipeCardProps {
  profile: ProfileData;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSuperlike?: () => void;
  onNudge?: () => void;
  isTop: boolean;
}

const SwipeCard = ({ profile, onSwipeLeft, onSwipeRight, onSuperlike, onNudge, isTop }: SwipeCardProps) => {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMultiplePhotos = profile.photos.length > 1;

  const getSwipeDirection = (): "left" | "right" | "up" | null => {
    if (dragY < -80 && Math.abs(dragX) < 60) return "up";
    if (dragX > 50) return "right";
    if (dragX < -50) return "left";
    return null;
  };

  const prevPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    setPhotoIndex((i) => (i === 0 ? profile.photos.length - 1 : i - 1));
  };

  const nextPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    setPhotoIndex((i) => (i === profile.photos.length - 1 ? 0 : i + 1));
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    setDragX(info.offset.x);
    setDragY(info.offset.y);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { x, y } = info.offset;
    const vx = info.velocity.x;
    const vy = info.velocity.y;

    if (y < -80 && Math.abs(x) < 60 && onSuperlike) {
      onSuperlike();
    } else if (x > 80 || vx > 500) {
      onSwipeRight();
    } else if (x < -80 || vx < -500) {
      onSwipeLeft();
    }

    setDragX(0);
    setDragY(0);
    setTimeout(() => setIsDragging(false), 100);
  };

  const exitVariant = (() => {
    const dir = getSwipeDirection();
    if (dir === "up") return { y: -600, opacity: 0, scale: 0.8 };
    if (dir === "right") return { x: 400, rotate: 20, opacity: 0 };
    return { x: -400, rotate: -20, opacity: 0 };
  })();

  // Maggi metric label (night owl vs early bird)
  const getMaggiLabel = () => {
    if (profile.maggiMetric <= 25) return "Early Bird 🌅";
    if (profile.maggiMetric <= 50) return "Balanced ⚖️";
    if (profile.maggiMetric <= 75) return "Night Owl 🦉";
    return "Vampire Hours 🧛";
  };

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{ zIndex: isTop ? 10 : 1 }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={isTop ? { rotate: dragX * 0.04, y: Math.min(dragY * 0.3, 0) } : { scale: 0.95, y: 10 }}
      exit={exitVariant}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="glass-strong rounded-3xl overflow-hidden h-full flex flex-col blossom-glow">
        {/* Photo area */}
        <div
          className="relative overflow-hidden transition-all duration-300 flex-shrink-0"
          style={{ height: expanded ? "45%" : "65%" }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={photoIndex}
              src={profile.photos[photoIndex]}
              alt={profile.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              loading="lazy"
              draggable={false}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Photo progress bar (Instagram-style) */}
          {hasMultiplePhotos && (
            <>
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                {profile.photos.map((_, i) => (
                  <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "hsl(var(--foreground) / 0.2)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: i < photoIndex ? "100%" : i === photoIndex ? "100%" : "0%",
                        background: i <= photoIndex ? "hsl(var(--blossom))" : "transparent",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Tap zones for prev/next */}
              <button onClick={prevPhoto} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" aria-label="Previous photo" />
              <button onClick={nextPhoto} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" aria-label="Next photo" />
            </>
          )}

          {/* Swipe indicators */}
          <AnimatePresence>
            {dragX > 50 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-6 left-6 bg-blossom/20 backdrop-blur-sm border-2 border-blossom rounded-2xl px-6 py-2 z-20"
              >
                <span className="text-blossom font-display text-2xl font-bold">VIBE ✨</span>
              </motion.div>
            )}
            {dragX < -50 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-6 right-6 bg-muted/20 backdrop-blur-sm border-2 border-muted-foreground rounded-2xl px-6 py-2 z-20"
              >
                <span className="text-muted-foreground font-display text-2xl font-bold">PASS</span>
              </motion.div>
            )}
            {dragY < -80 && Math.abs(dragX) < 60 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-sm border-2 rounded-2xl px-6 py-3 z-20"
                style={{ background: "hsl(45 100% 70% / 0.2)", borderColor: "hsl(45 100% 60%)" }}
              >
                <span className="font-display text-2xl font-bold" style={{ color: "hsl(45 100% 60%)" }}>
                  SUPERLIKE ⭐
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compatibility badge */}
          <div className="absolute top-4 right-4 glass rounded-full px-3 py-1 flex items-center gap-1.5 z-10">
            <Sparkles className="w-3.5 h-3.5 text-blossom" />
            <span className="text-sm font-bold text-blossom">{profile.compatibility}%</span>
          </div>

          {/* Nudge button */}
          {onNudge && (
            <button
              onClick={(e) => { e.stopPropagation(); onNudge(); }}
              className="absolute top-4 left-4 glass rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-blossom/10 transition-colors z-10"
            >
              <Zap className="w-3.5 h-3.5 text-blossom" />
              <span className="text-[11px] font-body text-blossom">Nudge</span>
            </button>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground leading-tight">{profile.name}, {profile.age}</h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-body mt-0.5">
                  {profile.batch}{profile.section ? ` · Sec ${profile.section}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                {profile.instagramHandle && (
                  <a
                    href={`https://instagram.com/${profile.instagramHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="glass rounded-full p-1.5 hover:bg-blossom/10 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5 text-blossom" />
                  </a>
                )}
                {hasMultiplePhotos && (
                  <span className="text-[9px] font-body text-foreground/50 glass rounded-full px-2 py-0.5">
                    {photoIndex + 1}/{profile.photos.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable info area */}
        <div
          ref={scrollRef}
          className="flex-1 p-3 sm:p-4 flex flex-col gap-2 overflow-y-auto overscroll-contain scrollbar-hide"
          onTouchStart={() => setExpanded(true)}
          onTouchEnd={() => setTimeout(() => setExpanded(false), 2000)}
        >
          {/* Night Owl / Early Bird meter */}
          <div className="glass rounded-xl p-2.5 flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profile.maggiMetric}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  background: "linear-gradient(90deg, hsl(45 90% 65%), hsl(260 60% 55%))"
                }}
              />
            </div>
            <Moon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground font-body whitespace-nowrap">{getMaggiLabel()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {profile.favoriteTrip && (
              <div className="glass rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-body">🏔 Fav Trip</p>
                <p className="text-xs text-foreground font-body mt-0.5 line-clamp-2">{profile.favoriteTrip}</p>
              </div>
            )}
            {profile.partySpot && (
              <div className="glass rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-body">🎉 Party Spot</p>
                <p className="text-xs text-foreground font-body mt-0.5 line-clamp-2">{profile.partySpot}</p>
              </div>
            )}
          </div>

          {profile.redFlag && (
            <div className="glass rounded-xl p-2.5 border border-maroon/20">
              <p className="text-[9px] text-maroon uppercase tracking-widest font-body">🚩 Red Flag</p>
              <p className="text-xs text-foreground font-body mt-0.5 italic line-clamp-2">
                "{profile.redFlag}"
              </p>
            </div>
          )}

          {/* Compatibility easter egg */}
          {profile.compatibility >= 85 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-2.5 border border-blossom/20 text-center"
            >
              <p className="text-[10px] text-blossom font-body">
                ✨ The stars align — this one's special ✨
              </p>
            </motion.div>
          )}

          <p className="text-[8px] text-muted-foreground/30 text-center font-body mt-auto pt-1">
            ← Pass · Like → · ⭐ Swipe up
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Action buttons
export const SwipeActions = ({
  onLeft,
  onRight,
  onSuperlike,
  panicMode = false,
}: {
  onLeft: () => void;
  onRight: () => void;
  onSuperlike?: () => void;
  panicMode?: boolean;
}) => (
  <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4">
    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onLeft}
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full glass flex items-center justify-center border border-muted-foreground/20 transition-colors hover:border-muted-foreground/40"
      aria-label="Pass"
    >
      <X className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
    </motion.button>

    {onSuperlike && (
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onSuperlike}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all"
        style={{
          borderColor: "hsl(45 100% 60%)",
          background: "hsl(45 100% 60% / 0.1)",
          boxShadow: "0 0 20px hsl(45 100% 60% / 0.2)",
        }}
        aria-label="Superlike"
      >
        <Star className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "hsl(45 100% 60%)" }} fill="currentColor" />
      </motion.button>
    )}

    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onRight}
      className={`rounded-full flex items-center justify-center transition-all ${panicMode ? "animate-pulse" : ""}`}
      style={{
        width: panicMode ? 72 : 64,
        height: panicMode ? 72 : 64,
        background: panicMode
          ? "linear-gradient(135deg, hsl(0 80% 55%), hsl(var(--blossom)))"
          : "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))",
        boxShadow: panicMode
          ? "0 0 30px hsl(0 80% 55% / 0.4)"
          : "0 0 40px hsl(var(--blossom) / 0.15)",
      }}
      aria-label="Like"
    >
      <div className="flex flex-col items-center">
        <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" fill="currentColor" />
        {panicMode && (
          <span className="text-[8px] font-bold text-primary-foreground mt-0.5 uppercase tracking-wider">PANIC</span>
        )}
      </div>
    </motion.button>
  </div>
);

export default SwipeCard;
