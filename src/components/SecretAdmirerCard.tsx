import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOff, Heart, HelpCircle, Search } from "lucide-react";
import type { CrushData } from "../context/WaltzStore";
import { useWaltzStore } from "../context/WaltzStore";

interface SecretAdmirerCardProps {
  crush: CrushData;
  onGuess: (crushId: string, guessId: string) => Promise<boolean>;
}

const SecretAdmirerCard = ({ crush, onGuess }: SecretAdmirerCardProps) => {
  const { allProfiles } = useWaltzStore();
  const [showGuess, setShowGuess] = useState(false);
  const [guessName, setGuessName] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [guessing, setGuessing] = useState(false);

  const sender = crush.revealed ? allProfiles.find((p) => p.id === crush.fromId) : null;

  const handleNameGuess = async () => {
    if (!guessName.trim() || guessing) return;
    setGuessing(true);

    // Find sender profile to compare names
    const senderProfile = allProfiles.find(p => p.id === crush.fromId);
    if (!senderProfile) { setGuessing(false); return; }

    const senderFirstName = senderProfile.name.split(" ")[0].toLowerCase().trim();
    const senderFullName = senderProfile.name.toLowerCase().trim();
    const guessedName = guessName.trim().toLowerCase();

    const isCorrect = guessedName === senderFirstName || guessedName === senderFullName;

    if (isCorrect) {
      await onGuess(crush.id, crush.fromId);
      setResult("correct");
    } else {
      await onGuess(crush.id, "wrong-guess-" + Date.now());
      setResult("wrong");
    }
    setGuessing(false);
    setGuessName("");
    if (!isCorrect) setTimeout(() => setResult(null), 2000);
  };

  if (crush.revealed && sender) {
    return (
      <motion.div layout className="glass-strong rounded-3xl p-5 blossom-glow">
        <div className="flex items-center gap-4">
          <img src={sender.photos[0]} alt={sender.name} className="w-16 h-16 rounded-full object-cover border-2 border-blossom/40" />
          <div>
            <p className="text-xs text-blossom font-body uppercase tracking-widest">Revealed!</p>
            <h3 className="font-display text-xl text-foreground">{sender.name}</h3>
            <p className="text-sm text-muted-foreground font-body">{sender.batch}{sender.section ? ` · Section ${sender.section}` : ""}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-blossom" fill="currentColor" />
          <span className="text-sm text-blossom font-body">It's a match! Start a conversation 🌸</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout className="glass-strong rounded-3xl overflow-hidden" style={{ boxShadow: "0 0 40px hsl(45 100% 60% / 0.15)" }}>
      <div className="relative h-40 overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--maroon-deep)), hsl(var(--night)))" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-center">
            <EyeOff className="w-10 h-10 mx-auto mb-2" style={{ color: "hsl(45 100% 70%)" }} />
            <p className="font-display text-lg" style={{ color: "hsl(45 100% 70%)" }}>Secret Admirer</p>
          </motion.div>
        </div>
      </div>

      <div className="p-5">
        <div className="glass rounded-2xl p-3 mb-3">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-1">Hint</p>
          <p className="text-sm text-foreground font-body">{crush.hint}</p>
        </div>

        <p className="text-xs text-muted-foreground font-body text-center mb-3">Someone has a crush on you 👀</p>

        <AnimatePresence>
          {result === "correct" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-3 text-center mb-3 border border-blossom/30">
              <span className="text-blossom font-body text-sm">🎉 Correct! It's a match!</span>
            </motion.div>
          )}
          {result === "wrong" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-3 text-center mb-3 border border-maroon/30">
              <span className="text-maroon font-body text-sm">Nope! {Math.max(crush.guessesLeft - 1, 0)} guesses left</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          {crush.guessesLeft > 0 && !crush.revealed && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowGuess(!showGuess)} className="flex-1 btn-waltz flex items-center justify-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4" />
              Guess ({crush.guessesLeft} left)
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 btn-ghost-waltz text-sm" onClick={() => setShowGuess(false)}>
            Ignore
          </motion.button>
        </div>

        <AnimatePresence>
          {showGuess && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
              <p className="text-xs text-muted-foreground font-body mb-1">Type the name of who you think it is:</p>
              <p className="text-[10px] text-blossom/60 font-body mb-2 italic">💡 Even a matching first name counts!</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={guessName}
                    onChange={(e) => setGuessName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleNameGuess(); }}
                    placeholder="Their name..."
                    className="w-full bg-input rounded-xl pl-10 pr-4 py-2.5 text-foreground font-body text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blossom/30"
                    maxLength={50}
                    disabled={guessing}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNameGuess}
                  disabled={!guessName.trim() || guessing}
                  className="btn-waltz px-4 py-2.5 text-sm disabled:opacity-40"
                >
                  {guessing ? "..." : "Guess"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SecretAdmirerCard;
