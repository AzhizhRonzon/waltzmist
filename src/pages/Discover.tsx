import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SwipeCard, { SwipeActions, ProfileData } from "../components/SwipeCard";
import MatchOverlay from "../components/MatchOverlay";
import FallingPetals from "../components/FallingPetals";
import CountdownTimer from "../components/CountdownTimer";
import { Sparkles } from "lucide-react";

// Mock profiles for demo
const MOCK_PROFILES: ProfileData[] = [
  {
    id: 1,
    name: "Ananya",
    batch: "PGP25",
    section: "3",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
    maggiMetric: 75,
    favoriteTrip: "Dawki Crystal Waters",
    partySpot: "Cloud 9",
    redFlag: "finance is a personality trait",
    compatibility: 88,
  },
  {
    id: 2,
    name: "Rohan",
    batch: "PGP24",
    section: "1",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    maggiMetric: 30,
    favoriteTrip: "Nongriat Trek",
    partySpot: "ML 05 Café",
    redFlag: "we should network at the prom",
    compatibility: 72,
  },
  {
    id: 3,
    name: "Priya",
    batch: "PGP25",
    section: "5",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    maggiMetric: 90,
    favoriteTrip: "Mawlynnong Village",
    partySpot: "The Terrace",
    redFlag: "PowerPoint is an art form",
    compatibility: 94,
  },
  {
    id: 4,
    name: "Arjun",
    batch: "PGPEx",
    section: "2",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
    maggiMetric: 55,
    favoriteTrip: "Laitlum Canyons",
    partySpot: "Déjà Vu",
    compatibility: 65,
  },
];

const DiscoverPage = () => {
  const [profiles, setProfiles] = useState<ProfileData[]>(MOCK_PROFILES);
  const [matchedProfile, setMatchedProfile] = useState<ProfileData | null>(null);

  const handleSwipe = (direction: "left" | "right") => {
    const current = profiles[profiles.length - 1];
    if (!current) return;

    // 30% chance of match on right swipe for demo
    if (direction === "right" && Math.random() > 0.7) {
      setMatchedProfile(current);
    }

    setProfiles((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative">
      <FallingPetals count={10} />

      {/* Header */}
      <header className="relative z-20 px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold blossom-text">WALTZ</h1>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mt-0.5">
            Find your partner
          </p>
        </div>
        <CountdownTimer />
      </header>

      {/* Card Stack */}
      <div className="flex-1 relative z-10 px-5 pb-2">
        <div className="relative w-full h-full max-w-sm mx-auto" style={{ minHeight: "65vh" }}>
          {profiles.length === 0 ? (
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
              {profiles.slice(-2).map((profile, i) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  isTop={i === profiles.slice(-2).length - 1}
                  onSwipeLeft={() => handleSwipe("left")}
                  onSwipeRight={() => handleSwipe("right")}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Actions */}
      {profiles.length > 0 && (
        <div className="relative z-20 pb-8">
          <SwipeActions
            onLeft={() => handleSwipe("left")}
            onRight={() => handleSwipe("right")}
          />
        </div>
      )}

      {/* Match Overlay */}
      <AnimatePresence>
        {matchedProfile && (
          <MatchOverlay
            matchName={matchedProfile.name}
            onClose={() => setMatchedProfile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscoverPage;
