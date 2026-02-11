import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Gift, Heart, MessageCircle, Eye, Sparkles, ArrowRight, Zap, Send, Share2 } from "lucide-react";
import FallingPetals from "../components/FallingPetals";
import CampusHeatMeter from "../components/CampusHeatMeter";
import { ConfettiBurst } from "../components/EasterEggs";
import { useWaltzStore } from "../context/WaltzStore";

const WrappedPage = () => {
  const navigate = useNavigate();
  const { getWrappedStats, fetchCampusStats } = useWaltzStore();
  const stats = getWrappedStats();
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { fetchCampusStats(); }, []);

  // Trigger confetti on last slide
  useEffect(() => {
    if (step === 5) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [step]);

  const getPersonalityType = () => {
    const { matchCount, crushesSent, nudgesSent, totalSwipes } = stats;
    if (matchCount >= 5 && crushesSent >= 2) return { title: "The Romantic", emoji: "💕", desc: "You came, you swiped, you conquered." };
    if (totalSwipes > 30 && matchCount < 2) return { title: "The Optimist", emoji: "🌟", desc: "Persistence is your middle name." };
    if (nudgesSent >= 3) return { title: "The Boldsmith", emoji: "⚡", desc: "You shoot your shot. Respect." };
    if (crushesSent >= 2) return { title: "The Mysterious One", emoji: "🎭", desc: "Anonymous but deadly effective." };
    return { title: "The Wallflower", emoji: "🌸", desc: "Slow and steady wins the Waltz." };
  };

  const personality = getPersonalityType();

  const slides = [
    // Intro
    <motion.div key="intro" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <Gift className="w-14 h-14 sm:w-16 sm:h-16 text-blossom mb-6" />
      </motion.div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold blossom-text mb-3">Your Waltz Wrapped</h1>
      <p className="text-muted-foreground font-body text-sm sm:text-base">A look back at your time in the Clouds 🌸</p>
    </motion.div>,

    // Matches
    <motion.div key="matches" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <Heart className="w-14 h-14 sm:w-16 sm:h-16 text-blossom mb-4" fill="currentColor" />
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="font-display text-5xl sm:text-6xl font-bold text-foreground mb-2">{stats.matchCount}</motion.p>
      <p className="text-muted-foreground font-body text-base sm:text-lg">people vibed with you</p>
      {stats.matchCount === 0 && (
        <p className="text-muted-foreground/50 font-body text-xs mt-2 italic">The Waltz isn't over yet! 💪</p>
      )}
    </motion.div>,

    // Activity
    <motion.div key="activity" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
      <Zap className="w-14 h-14 sm:w-16 sm:h-16 text-blossom mb-4" />
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="font-display text-3xl sm:text-4xl font-bold text-foreground">{stats.nudgesSent}</motion.p>
          <p className="text-muted-foreground font-body text-xs sm:text-sm">nudges sent</p>
        </div>
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="font-display text-3xl sm:text-4xl font-bold text-foreground">{stats.nudgesReceived}</motion.p>
          <p className="text-muted-foreground font-body text-xs sm:text-sm">nudges received</p>
        </div>
      </div>
      <p className="text-muted-foreground/60 font-body text-xs italic mt-2">
        {stats.nudgesSent > stats.nudgesReceived ? "You're a go-getter 🎯" : stats.nudgesReceived > 0 ? "You're in demand! 🔥" : "Start nudging! ⚡"}
      </p>
    </motion.div>,

    // Crushes
    <motion.div key="crushes" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <Eye className="w-14 h-14 sm:w-16 sm:h-16 mb-4" style={{ color: "hsl(45 100% 70%)" }} />
      </motion.div>
      <div className="flex gap-8 mb-4">
        <div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-display text-4xl sm:text-5xl font-bold text-foreground">{stats.crushesSent}</motion.p>
          <p className="text-muted-foreground font-body text-xs sm:text-sm">sent</p>
        </div>
        <div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="font-display text-4xl sm:text-5xl font-bold text-foreground">{stats.crushesReceived}</motion.p>
          <p className="text-muted-foreground font-body text-xs sm:text-sm">received</p>
        </div>
      </div>
      <p className="text-muted-foreground font-body">anonymous crushes</p>
    </motion.div>,

    // Personality type — easter egg
    <motion.div key="personality" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-6xl sm:text-7xl mb-4"
      >
        {personality.emoji}
      </motion.div>
      <p className="text-muted-foreground font-body text-xs uppercase tracking-widest mb-2">Your Waltz Personality</p>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{personality.title}</h2>
      <p className="text-muted-foreground font-body text-sm max-w-xs">{personality.desc}</p>
    </motion.div>,

    // Heat Meter
    <motion.div key="heat" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -100 }} className="py-4 sm:py-6">
      <CampusHeatMeter />
    </motion.div>,
  ];

  return (
    <div className="h-[100dvh] breathing-bg flex flex-col relative overflow-hidden">
      <FallingPetals count={15} />
      <ConfettiBurst active={showConfetti} />

      {/* Exit button */}
      <button
        onClick={() => navigate("/discover")}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 glass rounded-full px-3 sm:px-4 py-1.5 text-xs font-body text-muted-foreground hover:text-foreground hover:border-blossom/30 border border-transparent transition-all"
      >
        ✕ Exit
      </button>

      <div className="relative z-20 flex items-center justify-center gap-1.5 sm:gap-2 pt-5 sm:pt-6 pb-2">
        {slides.map((_, i) => (
          <div key={i} className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
            style={{
              background: i <= step ? "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" : "hsl(var(--secondary))",
              width: i === step ? 18 : 7,
            }} />
        ))}
      </div>
      <div className="flex-1 relative z-10 px-4 sm:px-5 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">{slides[step]}</AnimatePresence>
        </div>
      </div>
      <div className="relative z-20 px-4 sm:px-5 pb-6 sm:pb-8 flex gap-3">
        {step > 0 && <button onClick={() => setStep(step - 1)} className="btn-ghost-waltz flex-1 text-sm sm:text-base">Back</button>}
        {step < slides.length - 1 ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(step + 1)}
            className="btn-waltz flex-1 flex items-center justify-center gap-2 text-sm sm:text-base">
            Next <ArrowRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/discover")}
            className="btn-waltz flex-1 text-sm sm:text-base">Back to the Dance Floor 🌸</motion.button>
        )}
      </div>
    </div>
  );
};

export default WrappedPage;
