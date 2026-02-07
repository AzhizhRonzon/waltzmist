import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import SwipeCard, { SwipeActions } from "../components/SwipeCard";
import MatchOverlay from "../components/MatchOverlay";
import NudgeModal from "../components/NudgeModal";
import FallingPetals from "../components/FallingPetals";
import CountdownTimer from "../components/CountdownTimer";
import BottomNav from "../components/BottomNav";
import { Sparkles, Zap } from "lucide-react";
import { useWaltzStore } from "../context/WaltzStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { discoverQueue, swipeLeft, swipeRight, sendNudge, canNudgeToday } = useWaltzStore();
  const [matchedProfile, setMatchedProfile] = useState<{ id: string; name: string } | null>(null);
  const [nudgeTarget, setNudgeTarget] = useState<{ id: string; name: string } | null>(null);

  // Check if it's the night before shutdown for Panic Mode
  const isPanicMode = useMemo(() => {
    const now = new Date();
    const shutdown = new Date("2025-02-15T00:00:00+05:30");
    const hoursLeft = (shutdown.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  }, []);

  const handleSwipe = (direction: "left" | "right") => {
    const current = discoverQueue[discoverQueue.length - 1];
    if (!current) return;

    if (direction === "left") {
      swipeLeft(current.id);
    } else {
      // swipeRight returns undefined but internally has 40% match chance
      swipeRight(current.id);
      // Check if matched (crude demo check - profile would appear in matches)
      if (Math.random() < 0.4) {
        setMatchedProfile({ id: current.id, name: current.name });
      }
    }
  };

  const handleNudge = (profileId: string, profileName: string) => {
    setNudgeTarget({ id: profileId, name: profileName });
  };

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative pb-20">
      <FallingPetals count={10} />

      {/* Header */}
      <header className="relative z-20 px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold blossom-text">WALTZ</h1>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mt-0.5">
            {isPanicMode ? "⚡ PANIC MODE ⚡" : "Find your partner"}
          </p>
        </div>
        <CountdownTimer />
      </header>

      {/* Card Stack */}
      <div className="flex-1 relative z-10 px-5 pb-2">
        <div className="relative w-full h-full max-w-sm mx-auto" style={{ minHeight: "60vh" }}>
          {discoverQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-12 h-12 text-blossom/40 mb-4" />
              <h2 className="font-display text-2xl text-foreground mb-2">
                No More Cards
              </h2>
              <p className="text-muted-foreground font-body text-sm">
                You've seen everyone. <br />
                Check back later for new faces 🌸
              </p>
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
                  onNudge={() => handleNudge(profile.id, profile.name)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Actions */}
      {discoverQueue.length > 0 && (
        <div className="relative z-20 pb-4">
          <SwipeActions
            onLeft={() => handleSwipe("left")}
            onRight={() => handleSwipe("right")}
            panicMode={isPanicMode}
          />
        </div>
      )}

      <BottomNav />

      {/* Match Overlay */}
      <AnimatePresence>
        {matchedProfile && (
          <MatchOverlay
            matchName={matchedProfile.name}
            onMessage={() => {
              navigate(`/chat/${matchedProfile.id}`);
              setMatchedProfile(null);
            }}
            onClose={() => setMatchedProfile(null)}
          />
        )}
      </AnimatePresence>

      {/* Nudge Modal */}
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
    </div>
  );
};

export default DiscoverPage;
