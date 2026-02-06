import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import FallingPetals from "../components/FallingPetals";
import BottomNav from "../components/BottomNav";
import CountdownTimer from "../components/CountdownTimer";
import { MOCK_MATCHES } from "../data/mockChat";
import { MessageCircle } from "lucide-react";

const WhispersPage = () => {
  const navigate = useNavigate();
  const hasMatches = MOCK_MATCHES.length > 0;

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative pb-20">
      <FallingPetals count={8} />

      {/* Header */}
      <header className="relative z-20 px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Whisper Room
            </h1>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Your secret conversations 🌸
            </p>
          </div>
        </div>

        {/* Countdown Banner */}
        <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">
            Waltz Night in
          </span>
          <CountdownTimer />
        </div>
      </header>

      {/* Match List or Empty State */}
      <div className="flex-1 relative z-10 px-5 mt-4">
        {!hasMatches ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-20"
          >
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-5">
              <MessageCircle className="w-8 h-8 text-blossom/40" />
            </div>
            <h2 className="font-display text-2xl text-foreground mb-2">
              No Whispers Yet
            </h2>
            <p className="text-muted-foreground font-body text-sm max-w-[260px]">
              Don't just stare. <br />
              Swipe right on someone and say something risky.
            </p>
            <button
              onClick={() => navigate("/discover")}
              className="btn-waltz mt-6"
            >
              Start Swiping
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {MOCK_MATCHES.map((match, i) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:border-blossom/20 transition-all text-left border border-transparent"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={match.photo}
                    alt={match.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blossom/20"
                  />
                  {match.isOnline && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card"
                      style={{ background: "hsl(140 70% 50%)" }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base text-foreground">
                      {match.name}
                    </h3>
                    {match.lastMessageTime && (
                      <span className="text-[10px] text-muted-foreground font-body">
                        {match.lastMessageTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {match.lastMessage ? (
                      <p className="text-xs text-muted-foreground font-body truncate pr-2">
                        {match.lastMessage}
                      </p>
                    ) : (
                      <p className="text-xs text-blossom/60 font-body italic">
                        Say something risky...
                      </p>
                    )}
                    {match.unread && match.unread > 0 ? (
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))",
                        }}
                      >
                        {match.unread}
                      </span>
                    ) : null}
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
