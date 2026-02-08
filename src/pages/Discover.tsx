import { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SwipeCard, { SwipeActions } from "../components/SwipeCard";
import MatchOverlay from "../components/MatchOverlay";
import NudgeModal from "../components/NudgeModal";
import FallingPetals from "../components/FallingPetals";
import CountdownTimer from "../components/CountdownTimer";
import BottomNav from "../components/BottomNav";
import WhoLikedMe from "../components/WhoLikedMe";
import SkeletonCard from "../components/Skeletons";
import { Sparkles, Settings } from "lucide-react";
import { useWaltzStore } from "../context/WaltzStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { playMatchSound, playSwipeSound } from "@/lib/sounds";
import ProfileEditModal from "@/components/ProfileEditModal";

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { discoverQueue, swipeLeft, swipeRight, sendNudge, canNudgeToday, dataLoading, secretAdmirerCount, secretAdmirerHints, fetchSecretAdmirers } = useWaltzStore();
  const [matchedProfile, setMatchedProfile] = useState<{ id: string; name: string } | null>(null);
  const [nudgeTarget, setNudgeTarget] = useState<{ id: string; name: string } | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => { fetchSecretAdmirers(); }, []);

  const isPanicMode = useMemo(() => {
    const now = new Date();
    const shutdown = new Date("2026-02-15T00:00:00+05:30");
    const hoursLeft = (shutdown.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  }, []);

  const handleSwipe = async (direction: "left" | "right") => {
    const current = discoverQueue[discoverQueue.length - 1];
    if (!current || swiping) return;
    setSwiping(true);
    playSwipeSound();
    if (direction === "left") {
      await swipeLeft(current.id);
    } else {
      const matched = await swipeRight(current.id);
      if (matched) {
        playMatchSound();
        setMatchedProfile({ id: current.id, name: current.name });
      }
    }
    setSwiping(false);
  };

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative pb-20">
      <FallingPetals count={10} />

      <header className="relative z-20 px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold blossom-text">WALTZ</h1>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mt-0.5">
            {isPanicMode ? "⚡ PANIC MODE ⚡" : "Find your partner"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowEditProfile(true)} className="p-2 rounded-full hover:bg-secondary/50 transition-colors">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          <CountdownTimer />
        </div>
      </header>

      {/* Who liked me teaser */}
      <div className="relative z-10 px-5">
        <WhoLikedMe count={secretAdmirerCount} hints={secretAdmirerHints} />
      </div>

      <div className="flex-1 relative z-10 px-5 pb-2">
        <div className="relative w-full h-full max-w-sm mx-auto" style={{ minHeight: "60vh" }}>
          {dataLoading ? (
            <SkeletonCard />
          ) : discoverQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-12 h-12 text-blossom/40 mb-4" />
              <h2 className="font-display text-2xl text-foreground mb-2">No More Cards</h2>
              <p className="text-muted-foreground font-body text-sm">You've seen everyone.<br />Check back later for new faces 🌸</p>
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
                  onNudge={() => setNudgeTarget({ id: profile.id, name: profile.name })}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {discoverQueue.length > 0 && !dataLoading && (
        <div className="relative z-20 pb-4">
          <SwipeActions onLeft={() => handleSwipe("left")} onRight={() => handleSwipe("right")} panicMode={isPanicMode} />
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
    </div>
  );
};

export default DiscoverPage;
