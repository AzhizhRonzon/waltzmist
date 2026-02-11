import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, XCircle, Eye, EyeOff, Sparkles } from "lucide-react";
import { useWaltzStore } from "../context/WaltzStore";
import { toast } from "@/hooks/use-toast";
import { playMatchSound } from "@/lib/sounds";

interface SecretAdmirerRevealModalProps {
  onClose: () => void;
}

const REVEAL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY = "waltz_last_reveal";

const SecretAdmirerRevealModal = ({ onClose }: SecretAdmirerRevealModalProps) => {
  const { admirerProfiles, fetchAdmirerProfiles, reSwipeAdmirer, fetchSecretAdmirers } = useWaltzStore();
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchAdmirerProfiles().then(() => setLoading(false));
    const stored = sessionStorage.getItem("waltz_revealed_admirers");
    if (stored) setRevealedIds(new Set(JSON.parse(stored)));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const last = localStorage.getItem(STORAGE_KEY);
      if (!last) { setTimeLeft(0); return; }
      const remaining = REVEAL_COOLDOWN_MS - (Date.now() - parseInt(last));
      setTimeLeft(Math.max(0, remaining));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const canReveal = timeLeft <= 0;

  const handleReveal = (id: string) => {
    if (!canReveal) {
      const mins = Math.ceil(timeLeft / 60000);
      toast({ title: "Reveal on cooldown ⏰", description: `Wait ${mins} more minute${mins === 1 ? "" : "s"}.` });
      return;
    }
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setTimeLeft(REVEAL_COOLDOWN_MS);
    const newRevealed = new Set(revealedIds);
    newRevealed.add(id);
    setRevealedIds(newRevealed);
    sessionStorage.setItem("waltz_revealed_admirers", JSON.stringify([...newRevealed]));
  };

  const handleSwipe = async (admirerId: string, direction: "like" | "dislike") => {
    setActioning(admirerId);
    const success = await reSwipeAdmirer(admirerId, direction);
    if (success && direction === "like") {
      const admirer = admirerProfiles.find(a => a.id === admirerId);
      playMatchSound();
      setMatchedName(admirer?.name || "Someone");
    }
    await fetchSecretAdmirers();
    await fetchAdmirerProfiles();
    setActioning(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "hsl(var(--night) / 0.9)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-blossom" />
            <h2 className="font-display text-xl text-foreground">Who Liked You</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary/50">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-1">
          Tap a blurred photo to reveal their identity. 1 reveal per hour, no rollover.
        </p>
        <p className="text-[10px] font-body mb-4 italic" style={{ color: canReveal ? "hsl(var(--blossom))" : "hsl(var(--muted-foreground) / 0.6)" }}>
          {canReveal ? "✨ You have a reveal available!" : `⏰ Next reveal in ${Math.ceil(timeLeft / 60000)} min`}
        </p>

        <AnimatePresence>
          {matchedName && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl p-4 text-center mb-4 border border-blossom/30 blossom-glow">
              <Sparkles className="w-8 h-8 text-blossom mx-auto mb-2" />
              <p className="font-display text-lg text-foreground">It's a Match! 🌸</p>
              <p className="text-sm text-muted-foreground font-body">You and {matchedName} can now chat in Whispers!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="aspect-square rounded-2xl animate-pulse bg-secondary/30" />
            ))}
          </div>
        ) : admirerProfiles.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-body">No secret admirers right now.</p>
            <p className="text-[10px] text-muted-foreground/40 font-body mt-1">Keep being awesome! 🌸</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {admirerProfiles.map((admirer) => {
              const isRevealed = revealedIds.has(admirer.id);
              return (
                <motion.div key={admirer.id} layout className="relative">
                  {isRevealed ? (
                    <div className="space-y-2">
                      <div className="aspect-square rounded-2xl overflow-hidden border-2 border-blossom/30">
                        <img src={admirer.photo_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${admirer.id}`} alt={admirer.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-foreground font-body text-center truncate">{admirer.name}</p>
                      <p className="text-[9px] text-muted-foreground font-body text-center">{admirer.program}</p>
                      <div className="flex gap-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSwipe(admirer.id, "dislike")}
                          disabled={actioning === admirer.id}
                          className="flex-1 py-1.5 rounded-xl glass flex items-center justify-center disabled:opacity-40"
                        >
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSwipe(admirer.id, "like")}
                          disabled={actioning === admirer.id}
                          className="flex-1 py-1.5 rounded-xl flex items-center justify-center disabled:opacity-40"
                          style={{ background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" }}
                        >
                          <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReveal(admirer.id)}
                      className="w-full aspect-square rounded-2xl overflow-hidden relative group"
                    >
                      <img
                        src={admirer.photo_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${admirer.id}`}
                        alt="Secret admirer"
                        className="w-full h-full object-cover"
                        style={{ filter: "blur(20px) brightness(0.7)" }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Eye className="w-6 h-6 text-blossom/80 group-hover:text-blossom transition-colors" />
                        <span className="text-[9px] text-blossom/60 font-body mt-1">{admirer.program}</span>
                      </div>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/40 font-body text-center mt-4">
          Like someone who liked you → instant match! 💫
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SecretAdmirerRevealModal;
