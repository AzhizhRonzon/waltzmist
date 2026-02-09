import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import FallingPetals from "../components/FallingPetals";
import BottomNav from "../components/BottomNav";
import { useWaltzStore } from "../context/WaltzStore";
import { Heart, Sparkles } from "lucide-react";
import { SkeletonMatchCard } from "../components/Skeletons";

const MatchesPage = () => {
  const navigate = useNavigate();
  const { matches, dataLoading } = useWaltzStore();

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative pb-20">
      <FallingPetals count={6} />

      <header className="relative z-20 px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Matches</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">People who vibed with you 🌸</p>
          </div>
          {matches.length > 0 && (
            <div className="glass rounded-full px-2.5 py-1 flex items-center gap-1">
              <Heart className="w-3 h-3 text-blossom" fill="currentColor" />
              <span className="text-[11px] font-body text-blossom font-semibold">{matches.length}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 relative z-10 px-4 sm:px-5 mt-3 sm:mt-4">
        {dataLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <SkeletonMatchCard key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-5">
              <Heart className="w-8 h-8 text-blossom/40" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-foreground mb-2">No Matches Yet</h2>
            <p className="text-muted-foreground font-body text-sm max-w-[260px]">Keep swiping! Your partner is out there somewhere in the Clouds.</p>
            <button onClick={() => navigate("/discover")} className="btn-waltz mt-6">Start Swiping</button>
            <p className="text-[10px] text-muted-foreground/40 font-body mt-3">
              Fun fact: The average match takes 12 swipes. You got this.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {matches.map((match, i) => (
              <motion.button key={match.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="glass rounded-2xl overflow-hidden group hover:blossom-glow transition-all border border-transparent hover:border-blossom/20 relative">
                <div className="relative aspect-[3/4]">
                  <img src={match.profile.photos[0]} alt={match.profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-display text-base sm:text-lg text-foreground leading-tight">{match.profile.name}</h3>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground font-body">{match.profile.batch}</p>
                  </div>
                  {/* Unread indicator */}
                  {match.unread > 0 && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-primary-foreground"
                      style={{ background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" }}>
                      {match.unread}
                    </div>
                  )}
                  {/* Compatibility */}
                  <div className="absolute top-2 left-2 glass rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-blossom" />
                    <span className="text-[9px] font-bold text-blossom">{match.profile.compatibility}%</span>
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

export default MatchesPage;
