import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import FallingPetals from "../components/FallingPetals";
import BottomNav from "../components/BottomNav";
import CountdownTimer from "../components/CountdownTimer";
import { useWaltzStore } from "../context/WaltzStore";
import { MessageCircle, Zap, Sparkles } from "lucide-react";
import { SkeletonChatItem } from "../components/Skeletons";

const WITTY_EMPTY_STATES = [
  "Your inbox is emptier than the mess at midnight.",
  "No whispers yet. Even the WiFi is more connected than you.",
  "The silence is louder than the prof's mic in Auditorium.",
];

const WhispersPage = () => {
  const navigate = useNavigate();
  const { matches, nudgesReceived, markNudgeSeen, dataLoading } = useWaltzStore();
  const hasMatches = matches.length > 0;
  const unseenNudges = nudgesReceived.filter((n) => !n.seen);
  const emptyMessage = WITTY_EMPTY_STATES[Math.floor(Math.random() * WITTY_EMPTY_STATES.length)];

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative pb-20">
      <FallingPetals count={6} />

      <header className="relative z-20 px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Whisper Room</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">Your secret conversations 🌸</p>
          </div>
          {matches.length > 0 && (
            <div className="glass rounded-full px-2.5 py-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blossom" />
              <span className="text-[11px] font-body text-blossom font-semibold">{matches.length}</span>
            </div>
          )}
        </div>
        <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">Waltz Night in</span>
          <CountdownTimer />
        </div>
      </header>

      <div className="flex-1 relative z-10 px-4 sm:px-5 mt-3 sm:mt-4 space-y-4">
        {unseenNudges.length > 0 && (
          <div>
            <h2 className="font-display text-sm text-blossom mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Anonymous Nudges
            </h2>
            <div className="space-y-2">
              {unseenNudges.map((nudge, i) => (
                <motion.div key={nudge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="glass rounded-2xl p-4 border border-blossom/20 blossom-glow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-blossom uppercase tracking-widest font-body mb-1">Someone nudged you 👀</p>
                      <p className="text-sm text-foreground font-body italic truncate">"{nudge.message}"</p>
                    </div>
                    <button onClick={() => markNudgeSeen(nudge.id)} className="text-[10px] text-muted-foreground font-body hover:text-foreground transition-colors ml-2 flex-shrink-0">Dismiss</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {dataLoading ? (
          <div className="space-y-2">
            {[0,1,2].map(i => <SkeletonChatItem key={i} />)}
          </div>
        ) : !hasMatches ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-5">
              <MessageCircle className="w-8 h-8 text-blossom/40" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-foreground mb-2">No Whispers Yet</h2>
            <p className="text-muted-foreground font-body text-sm max-w-[260px]">{emptyMessage}</p>
            <button onClick={() => navigate("/discover")} className="btn-waltz mt-6">Start Swiping</button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {matches
              .sort((a, b) => {
                // Sort by unread first, then by last message time
                if (a.unread > 0 && b.unread === 0) return -1;
                if (b.unread > 0 && a.unread === 0) return 1;
                return 0;
              })
              .map((match, i) => (
              <motion.button key={match.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className={`w-full glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 hover:border-blossom/20 transition-all text-left border ${match.unread > 0 ? "border-blossom/20 blossom-glow" : "border-transparent"}`}>
                <div className="relative flex-shrink-0">
                  <img src={match.profile.photos[0]} alt={match.profile.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-blossom/20" loading="lazy" />
                  {match.unread > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blossom animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm sm:text-base text-foreground">{match.profile.name}</h3>
                    {match.lastMessageTime && <span className="text-[10px] text-muted-foreground font-body flex-shrink-0 ml-2">{match.lastMessageTime}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {match.lastMessage ? (
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-body truncate pr-2">{match.lastMessage}</p>
                    ) : (
                      <p className="text-[11px] sm:text-xs text-blossom/60 font-body italic">Say something risky...</p>
                    )}
                    {match.unread > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                        style={{ background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" }}>
                        {match.unread}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default WhispersPage;
