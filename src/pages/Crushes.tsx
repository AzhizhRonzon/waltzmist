import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Send } from "lucide-react";
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
      <FallingPetals count={8} />

      {/* Header */}
      <header className="relative z-20 px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Secret Admirers
            </h1>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Anonymous crushes & mystery 💌
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSendModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" }}
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </div>
      </header>

      <div className="flex-1 relative z-10 px-5 mt-2 space-y-6">
        {/* Received Crushes */}
        <div>
          <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4" style={{ color: "hsl(45 100% 70%)" }} />
            Received ({crushesReceived.length})
          </h2>

          {crushesReceived.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-muted-foreground font-body text-sm">
                No secret admirers yet. Keep being awesome! ✨
              </p>
            </div>
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
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-muted-foreground font-body text-sm">
                You haven't sent any anonymous crushes yet. <br />
                Go on, be brave! 💕
              </p>
            </div>
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
                  <p className="text-xs text-muted-foreground font-body">Crush #{i + 1}</p>
                  <p className="text-sm text-foreground font-body mt-1">Hint: "{crush.hint}"</p>
                  <p className="text-[10px] text-muted-foreground/60 font-body mt-1">
                    Sent {crush.sentAt.toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Send Crush Modal */}
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
