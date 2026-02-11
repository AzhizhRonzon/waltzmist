import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard, { SwipeActions } from "../components/SwipeCard";
import MatchOverlay from "../components/MatchOverlay";
import NudgeModal from "../components/NudgeModal";
import FallingPetals from "../components/FallingPetals";
import CountdownTimer from "../components/CountdownTimer";
import BottomNav from "../components/BottomNav";
import WhoLikedMe from "../components/WhoLikedMe";
import SecretAdmirerRevealModal from "../components/SecretAdmirerRevealModal";
import SkeletonCard from "../components/Skeletons";
import { ConfettiBurst, LoveBurst } from "../components/EasterEggs";
import { Sparkles, Settings, ShieldAlert } from "lucide-react";
import { useWaltzStore } from "../context/WaltzStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { playMatchSound, playSwipeSound } from "@/lib/sounds";
import ProfileEditModal from "@/components/ProfileEditModal";

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { discoverQueue, swipeLeft, swipeRight, swipesRemaining, sendNudge, canNudgeToday, dataLoading, secretAdmirerCount, secretAdmirerHints, fetchSecretAdmirers, isShadowBanned } = useWaltzStore();
  const [matchedProfile, setMatchedProfile] = useState<{ id: string; name: string } | null>(null);
  const [nudgeTarget, setNudgeTarget] = useState<{ id: string; name: string } | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loveBurst, setLoveBurst] = useState<{ x: number; y: number } | null>(null);
  const [superlikedId, setSuperlikedId] = useState<string | null>(null);
  const [showAdmirerReveal, setShowAdmirerReveal] = useState(false);

  useEffect(() => { fetchSecretAdmirers(); }, []);

  const isPanicMode = useMemo(() => {
    const now = new Date();
    const shutdown = new Date("2026-02-14T12:00:00+05:30");
    const hoursLeft = (shutdown.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  }, []);

  const handleSwipe = async (direction: "left" | "right") => {
    const current = discoverQueue[discoverQueue.length - 1];
    if (!current || swiping) return;
    if (swipesRemaining <= 0) {
      toast({ title: "Daily limit reached 🛑", description: "Come back tomorrow for more swipes!", variant: "destructive" });
      return;
    }
    setSwiping(true);
    playSwipeSound();
    if (direction === "left") {
      await swipeLeft(current.id);
    } else {
      const matched = await swipeRight(current.id);
      if (matched) {
        playMatchSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        setMatchedProfile({ id: current.id, name: current.name });
      }
    }
    setSwiping(false);
  };

  const handleSuperlike = async () => {
    const current = discoverQueue[discoverQueue.length - 1];
    if (!current || swiping) return;
    if (swipesRemaining <= 0) {
      toast({ title: "Daily limit reached 🛑", description: "Come back tomorrow!", variant: "destructive" });
      return;
    }
    setSwiping(true);
    setSuperlikedId(current.id);
    playSwipeSound();
    toast({ title: "⭐ Superliked!", description: `You superliked ${current.name}. They'll know!` });
    const matched = await swipeRight(current.id);
    if (matched) {
      playMatchSound();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setMatchedProfile({ id: current.id, name: current.name });
    }
    setTimeout(() => setSuperlikedId(null), 1000);
    setSwiping(false);
  };

  // Double-tap like easter egg
  const handleDoubleTap = (e: React.MouseEvent) => {
    setLoveBurst({ x: e.clientX, y: e.clientY });
    setTimeout(() => setLoveBurst(null), 800);
  };

  return (
    <div className="h-[100dvh] breathing-bg flex flex-col relative pb-20 overflow-hidden">
      <FallingPetals count={6} />
      <ConfettiBurst active={showConfetti} />
      {loveBurst && <LoveBurst x={loveBurst.x} y={loveBurst.y} />}

      <header className="relative z-20 px-3 sm:px-5 pt-3 sm:pt-5 pb-2 sm:pb-3 flex items-center justify-between">
        <div className="flex-shrink-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold blossom-text">WALTZ</h1>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-body uppercase tracking-widest mt-0.5">
            {isPanicMode ? "⚡ PANIC MODE ⚡" : "Find your partner"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Swipe counter */}
          <div className="glass rounded-full px-2 py-1 flex items-center gap-1">
            <span className={`text-[11px] font-body font-semibold ${swipesRemaining <= 5 ? "text-destructive" : "text-blossom"}`}>
              {swipesRemaining}
            </span>
            <span className="text-[9px] text-muted-foreground font-body">left</span>
          </div>
          <button onClick={() => setShowEditProfile(true)} className="p-1.5 sm:p-2 rounded-full hover:bg-secondary/50 transition-colors" aria-label="Settings">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          {/* Compact countdown that fits on mobile */}
          <CountdownTimer compact />
        </div>
      </header>

      {/* Shadow ban warning */}
      {isShadowBanned && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 mx-3 sm:mx-5 mb-2"
        >
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 backdrop-blur-sm p-3 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-body font-semibold text-destructive">You've been shadow-banned! 👻</p>
              <p className="text-xs font-body text-destructive/80 mt-1 leading-relaxed">
                Please set up your profile properly, with the same dedication that your batchmates put into attendance fraud. 📋✨
              </p>
              <p className="text-[10px] font-body text-destructive/60 mt-1.5">
                Contact admin (Ashish) if you think this is a mistake.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Who liked me teaser */}
      <div className="relative z-10 px-3 sm:px-5">
        <WhoLikedMe count={secretAdmirerCount} hints={secretAdmirerHints} onOpen={() => setShowAdmirerReveal(true)} />
      </div>

      <div className="flex-1 relative z-10 px-3 sm:px-5 pb-2" onDoubleClick={handleDoubleTap}>
        <div className="relative w-full h-full max-w-sm mx-auto" style={{ minHeight: "55vh" }}>
          {dataLoading ? (
            <SkeletonCard />
          ) : swipesRemaining <= 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="text-5xl mb-4">⏰</div>
              </motion.div>
              <h2 className="font-display text-2xl text-foreground mb-2">Daily Limit Reached</h2>
              <p className="text-muted-foreground font-body text-sm">You've used all your swipes today.<br />Come back tomorrow for more! 🌸</p>
              <p className="text-[10px] text-muted-foreground/50 font-body mt-3">
                Pro tip: Quality over quantity. Every swipe counts.
              </p>
            </div>
          ) : discoverQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-12 h-12 text-blossom/40 mb-4" />
              <h2 className="font-display text-2xl text-foreground mb-2">No More Cards</h2>
              <p className="text-muted-foreground font-body text-sm">You've seen everyone.<br />Check back later for new faces 🌸</p>
              <button onClick={() => navigate("/crushes")} className="btn-ghost-waltz mt-6 text-sm">
                Send a Secret Crush Instead 💌
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {discoverQueue.slice(-2).map((profile, i) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  isTop={i === discoverQueue.slice(-2).length - 1}
                  onSwipeLeft={() => handleSwipe("left")}
                  onSwipeRight={() => handleSwipe("right")}
                  onSuperlike={handleSuperlike}
                  onNudge={() => setNudgeTarget({ id: profile.id, name: profile.name })}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {discoverQueue.length > 0 && !dataLoading && swipesRemaining > 0 && (
        <div className="relative z-20 pb-4">
          <SwipeActions
            onLeft={() => handleSwipe("left")}
            onRight={() => handleSwipe("right")}
            onSuperlike={handleSuperlike}
            panicMode={isPanicMode}
          />
        </div>
      )}

      <BottomNav />

      <AnimatePresence>
        {matchedProfile && (
          <MatchOverlay
            matchName={matchedProfile.name}
            onMessage={() => { navigate(`/chat/${matchedProfile.id}`); setMatchedProfile(null); }}
            onClose={() => setMatchedProfile(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nudgeTarget && (
          <NudgeModal
            targetName={nudgeTarget.name}
            disabled={!canNudgeToday}
            onSend={(message) => {
              sendNudge(nudgeTarget.id, message);
              setNudgeTarget(null);
              toast({ title: "Nudge sent! 🌸", description: "They'll see it anonymously." });
            }}
            onClose={() => setNudgeTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditProfile && <ProfileEditModal onClose={() => setShowEditProfile(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAdmirerReveal && <SecretAdmirerRevealModal onClose={() => { setShowAdmirerReveal(false); fetchSecretAdmirers(); }} />}
      </AnimatePresence>
    </div>
  );
};

export default DiscoverPage;
