import { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart, Send } from "lucide-react";
import { CRUSH_HINTS, useWaltzStore } from "../context/WaltzStore";

interface SendCrushModalProps {
  onSend: (toId: string, hint: string) => Promise<boolean>;
  onClose: () => void;
  crushesRemaining: number;
}

const SendCrushModal = ({ onSend, onClose, crushesRemaining }: SendCrushModalProps) => {
  const { allProfiles } = useWaltzStore();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState<string | null>(null);
  const [customHint, setCustomHint] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const finalHint = customHint.trim() || selectedHint;

  const handleSend = async () => {
    if (!selectedProfile || !finalHint || sending) return;
    setSending(true);
    const result = await onSend(selectedProfile, finalHint);
    setSending(false);
    if (result) setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
      style={{ background: "hsl(var(--night) / 0.8)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-3xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto"
        style={{ boxShadow: "0 0 60px hsl(45 100% 60% / 0.1)" }}
      >
        {sent ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Heart className="w-16 h-16 text-blossom mx-auto mb-4" fill="currentColor" />
            </motion.div>
            <h3 className="font-display text-xl text-foreground mb-2">Crush Sent! 💌</h3>
            <p className="text-sm text-muted-foreground font-body">They'll see a blurred card with your hint. Fingers crossed! 🤞</p>
            <button onClick={onClose} className="btn-waltz mt-5">Done</button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" style={{ color: "hsl(45 100% 70%)" }} />
                <h3 className="font-display text-xl text-foreground">Send a Crush</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/50">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground font-body mb-1">{crushesRemaining} of 3 crushes remaining</p>

            {crushesRemaining <= 0 ? (
              <div className="glass rounded-2xl p-4 text-center mt-4">
                <p className="text-sm text-muted-foreground font-body">You've used all 3 anonymous crushes. 💔</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground/70 font-body mb-4">Choose someone and a hint. Your identity stays hidden.</p>

                {/* Crush target — dropdown */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-2">Who's your crush?</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {allProfiles.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 font-body text-center py-4">No other profiles on campus yet.</p>
                    ) : (
                      allProfiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProfile(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left border ${
                            selectedProfile === p.id ? "border-blossom/40 bg-blossom/10" : "border-transparent glass hover:border-blossom/20"
                          }`}
                        >
                          <img src={p.photos[0]} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-sm text-foreground font-body">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{p.batch}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Hint selection */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-2">Drop a hint</p>
                  <div className="space-y-2">
                    {CRUSH_HINTS.map((hint) => (
                      <button
                        key={hint}
                        onClick={() => { setSelectedHint(hint); setCustomHint(""); }}
                        className={`w-full text-left px-4 py-3 rounded-2xl font-body text-sm transition-all border ${
                          selectedHint === hint && !customHint
                            ? "border-blossom/40 bg-blossom/10 text-blossom"
                            : "border-transparent glass text-foreground hover:border-blossom/20"
                        }`}
                      >
                        "{hint}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom hint */}
                <div className="mb-5">
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-2">Or write your own hint ✏️</p>
                  <input
                    type="text"
                    value={customHint}
                    onChange={(e) => { setCustomHint(e.target.value); if (e.target.value.trim()) setSelectedHint(null); }}
                    placeholder="We once fought over the last samosa..."
                    className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blossom/30"
                    maxLength={120}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={!selectedProfile || !finalHint || sending}
                  className="btn-waltz w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send Anonymous Crush"}
                </motion.button>
              </>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SendCrushModal;
