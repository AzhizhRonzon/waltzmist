import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FallingPetals from "../components/FallingPetals";
import CountdownTimer from "../components/CountdownTimer";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Heart, Zap, Sparkles, Shield, MessageCircle, Eye, Trophy, Clock } from "lucide-react";
import { getRandomQuip } from "../components/EasterEggs";

interface LiveStats {
  totalUsers: number;
  totalMatches: number;
  totalSwipes: number;
}

const TESTIMONIALS = [
  { text: "Found my Waltz partner in 3 swipes. The mess will never feel the same.", emoji: "💕" },
  { text: "My red flag brought all the matches to the yard.", emoji: "🚩" },
  { text: "Turns out we both hated the same prof. Match made in heaven.", emoji: "✨" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [countRes, statsRes] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.rpc("get_campus_stats"),
        ]);
        setStats({
          totalUsers: countRes.count || 0,
          totalMatches: (statsRes.data as any)?.total_matches || 0,
          totalSwipes: (statsRes.data as any)?.total_swipes || 0,
        });
      } catch {
        // Not critical
      }
    };
    fetchStats();
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Easter egg: tap logo 5 times
  const handleLogoTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setEasterEgg(true);
      setTapCount(0);
      setTimeout(() => setEasterEgg(false), 3000);
    }
  };

  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => navigate("/login"), 600);
  };

  const features = [
    { icon: Zap, title: "Swipe & Match", desc: "Discover people from your campus. Right swipe to vibe." },
    { icon: MessageCircle, title: "Whispers & Crushes", desc: "Send anonymous nudges or secret crush hints." },
    { icon: Shield, title: "Campus Only", desc: "Verified @iimshillong.ac.in emails. No outsiders." },
    { icon: Sparkles, title: "Waltz Wrapped", desc: "Your campus dating stats — anonymized & fun." },
    { icon: Eye, title: "Secret Admirers", desc: "See blurred hints about who liked you. Swipe to reveal." },
    { icon: Clock, title: "Cinderella Mode", desc: "The music stops on Feb 14. Every match counts." },
  ];

  return (
    <div className="min-h-screen breathing-bg flex flex-col items-center relative overflow-hidden">
      <FallingPetals count={18} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entered ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg px-6"
      >
        {/* Hero Section */}
        <div className="text-center pt-14 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
              onClick={handleLogoTap}
            >
              <h1 className="font-display text-7xl sm:text-8xl font-bold blossom-text tracking-tight cursor-pointer select-none">
                WALTZ
              </h1>
            </motion.div>

            {/* Easter egg */}
            <AnimatePresence>
              {easterEgg && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-blossom font-body text-xs mb-2"
                >
                  🎉 You found a secret! The devs are watching. Always.
                </motion.p>
              )}
            </AnimatePresence>

            <p className="text-muted-foreground font-body text-lg mb-1">Who are you going with?</p>
            <p className="text-muted-foreground/50 font-body text-sm italic">
              The dating app for IIM Shillong
            </p>
          </motion.div>
        </div>

        {/* Live Stats Bar */}
        {stats && (stats.totalUsers > 0 || stats.totalMatches > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="glass-strong rounded-2xl p-4 mb-6"
          >
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest text-center mb-3">Live from the Clouds</p>
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blossom" />
                  <motion.span
                    key={stats.totalUsers}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-body text-foreground font-bold"
                  >
                    {stats.totalUsers}
                  </motion.span>
                </div>
                <span className="text-[10px] text-muted-foreground font-body mt-0.5">dancers</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-blossom" fill="currentColor" />
                  <motion.span
                    key={stats.totalMatches}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-body text-foreground font-bold"
                  >
                    {stats.totalMatches}
                  </motion.span>
                </div>
                <span className="text-[10px] text-muted-foreground font-body mt-0.5">matches</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blossom" />
                  <motion.span
                    key={stats.totalSwipes}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-body text-foreground font-bold"
                  >
                    {stats.totalSwipes}
                  </motion.span>
                </div>
                <span className="text-[10px] text-muted-foreground font-body mt-0.5">swipes</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-6 flex justify-center"
        >
          <div className="glass-strong rounded-2xl px-6 py-4 inline-block">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-3 text-center">
              The music stops in
            </p>
            <CountdownTimer />
          </div>
        </motion.div>

        {/* Rotating Testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-4 text-center"
            >
              <p className="text-sm text-foreground font-body italic">
                "{TESTIMONIALS[testimonialIndex].text}"
              </p>
              <p className="text-lg mt-1">{TESTIMONIALS[testimonialIndex].emoji}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-center mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEnter}
            className="btn-waltz text-lg px-12 py-4"
          >
            Enter the Dance Floor 🌸
          </motion.button>
          <p className="text-xs text-muted-foreground/40 font-body mt-3">
            Just vibes. No cap.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="grid grid-cols-2 gap-3 mb-10"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.08, duration: 0.5 }}
                className="glass rounded-2xl p-4"
              >
                <Icon className="w-5 h-5 text-blossom mb-2" />
                <h3 className="font-display text-sm text-foreground mb-1">{f.title}</h3>
                <p className="text-[11px] text-muted-foreground font-body leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mb-10"
        >
          <h2 className="font-display text-xl text-foreground text-center mb-6">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: "1", text: "Sign up with your @iimshillong.ac.in email", emoji: "📧" },
              { step: "2", text: "Build your Anti-CV — no LinkedIn vibes here", emoji: "🎨" },
              { step: "3", text: "Swipe, match, and start the Waltz", emoji: "💃" },
              { step: "4", text: "Send anonymous crushes & nudges", emoji: "💌" },
              { step: "5", text: "Music stops on Feb 14 — make it count", emoji: "⏰" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-4"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  {item.step}
                </div>
                <p className="text-sm text-muted-foreground font-body flex-1">{item.text}</p>
                <span className="text-lg">{item.emoji}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="glass rounded-2xl p-5 mb-10 text-center"
        >
          <Trophy className="w-6 h-6 text-blossom mx-auto mb-2" />
          <h3 className="font-display text-lg text-foreground mb-1">Built for IIM Shillong</h3>
          <p className="text-xs text-muted-foreground font-body">
            Every profile is verified. Every match is real. Every swipe stays in the Clouds. 🌸
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="text-center pb-8"
        >
          <p className="text-[11px] text-muted-foreground/30 font-body italic">
            Made for IIM Shillong, by Ashish, with boredom at heart
          </p>
          <p className="text-[10px] text-muted-foreground/20 font-body mt-1">
            v2.0 · {getRandomQuip()}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
