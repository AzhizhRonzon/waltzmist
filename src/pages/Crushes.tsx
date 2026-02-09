import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Send, Sparkles } from "lucide-react";
import FallingPetals from "../components/FallingPetals";
import BottomNav from "../components/BottomNav";
import SecretAdmirerCard from "../components/SecretAdmirerCard";
import SendCrushModal from "../components/SendCrushModal";
import { useWaltzStore } from "../context/WaltzStore";

const CrushesPage = () => {
  const { crushesReceived, crushesSent, sendCrush, guessCrush } = useWaltzStore();
  const [showSendModal, setShowSendModal] = useState(false);

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative pb-20">
      <FallingPetals count={6} />

      <header className="relative z-20 px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Secret Admirers
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">
              Anonymous crushes & mystery 💌
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSendModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" }}
            aria-label="Send a crush"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </div>
      </header>

      <div className="flex-1 relative z-10 px-4 sm:px-5 mt-2 space-y-6">
        {/* Received Crushes */}
        <div>
          <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4" style={{ color: "hsl(45 100% 70%)" }} />
            Received ({crushesReceived.length})
          </h2>

          {crushesReceived.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Sparkles className="w-10 h-10 text-blossom/30 mx-auto mb-3" />
              </motion.div>
              <p className="text-foreground font-display text-lg mb-1">No secret admirers... yet</p>
              <p className="text-muted-foreground font-body text-sm">
                Keep being awesome! Someone's building up the courage. ✨
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {crushesReceived.map((crush) => (
                <SecretAdmirerCard key={crush.id} crush={crush} onGuess={guessCrush} />
              ))}
            </div>
          )}
        </div>

        {/* Sent Crushes */}
        <div>
          <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-blossom" />
            Sent ({crushesSent.length}/3)
          </h2>

          {crushesSent.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <p className="text-foreground font-body text-sm mb-1">You haven't sent any anonymous crushes yet.</p>
              <p className="text-muted-foreground font-body text-xs">Go on, be brave! 💕</p>
              <button onClick={() => setShowSendModal(true)} className="btn-waltz mt-4 text-sm">
                Send Your First Crush
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {crushesSent.map((crush, i) => (
                <motion.div
                  key={crush.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-body">Crush #{i + 1}</p>
                      <p className="text-sm text-foreground font-body mt-1">Hint: "{crush.hint}"</p>
                    </div>
                    <div className="glass rounded-full px-2 py-0.5">
                      <span className="text-[9px] text-muted-foreground font-body">
                        {crush.sentAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <AnimatePresence>
        {showSendModal && (
          <SendCrushModal
            onSend={sendCrush}
            onClose={() => setShowSendModal(false)}
            crushesRemaining={3 - crushesSent.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrushesPage;
