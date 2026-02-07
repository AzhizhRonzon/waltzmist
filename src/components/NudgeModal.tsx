import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Zap } from "lucide-react";
import { NUDGE_PRESETS } from "../context/WaltzStore";

interface NudgeModalProps {
  targetName: string;
  onSend: (message: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

const NudgeModal = ({ targetName, onSend, onClose, disabled }: NudgeModalProps) => {
  const [selected, setSelected] = useState<string | null>(null);

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
        className="glass-strong rounded-3xl p-6 w-full max-w-sm blossom-glow"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blossom" />
            <h3 className="font-display text-xl text-foreground">Anonymous Nudge</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/50">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground font-body mb-4">
          Send a secret nudge to <span className="text-blossom">{targetName}</span>. They won't know it's you.
        </p>

        {disabled ? (
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground font-body">
              You've used your nudge for today. <br />
              Come back tomorrow! 🌙
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-5">
              {NUDGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSelected(preset)}
                  className={`w-full text-left px-4 py-3 rounded-2xl font-body text-sm transition-all border ${
                    selected === preset
                      ? "border-blossom/40 bg-blossom/10 text-blossom"
                      : "border-transparent glass text-foreground hover:border-blossom/20"
                  }`}
                >
                  "{preset}"
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selected && onSend(selected)}
              disabled={!selected}
              className="btn-waltz w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send Nudge
            </motion.button>
          </>
        )}

        <p className="text-[10px] text-muted-foreground/50 font-body text-center mt-3">
          1 nudge per day · Completely anonymous
        </p>
      </motion.div>
    </motion.div>
  );
};

export default NudgeModal;
