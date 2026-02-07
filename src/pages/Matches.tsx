import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import FallingPetals from "../components/FallingPetals";
import BottomNav from "../components/BottomNav";
import { useWaltzStore } from "../context/WaltzStore";
import { Heart } from "lucide-react";

const MatchesPage = () => {
  const navigate = useNavigate();
  const { matches } = useWaltzStore();

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative pb-20">
      <FallingPetals count={8} />

      {/* Header */}
      <header className="relative z-20 px-5 pt-5 pb-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Matches
        </h1>
        <p className="text-xs text-muted-foreground font-body mt-0.5">
          People who vibed with you 🌸
        </p>
      </header>

      {/* Matches Grid */}
      <div className="flex-1 relative z-10 px-5 mt-4">
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-20"
          >
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-5">
              <Heart className="w-8 h-8 text-blossom/40" />
            </div>
            <h2 className="font-display text-2xl text-foreground mb-2">
              No Matches Yet
            </h2>
            <p className="text-muted-foreground font-body text-sm max-w-[260px]">
              Keep swiping! Your partner is out there somewhere in the Clouds.
            </p>
            <button
              onClick={() => navigate("/discover")}
              className="btn-waltz mt-6"
            >
              Start Swiping
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {matches.map((match, i) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="glass rounded-2xl overflow-hidden group hover:blossom-glow transition-all border border-transparent hover:border-blossom/20"
              >
                <div className="relative aspect-[3/4]">
                  <img
                    src={match.profile.photos[0]}
                    alt={match.profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-display text-lg text-foreground leading-tight">
                      {match.profile.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-body">
                      {match.profile.batch}
                    </p>
                  </div>
                  {match.profile.isOnline && (
                    <div
                      className="absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-card"
                      style={{ background: "hsl(140 70% 50%)" }}
                    />
                  )}
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
