import { motion } from "framer-motion";
import FallingPetals from "./FallingPetals";

const CinderellaScreen = () => {
  return (
    <div className="min-h-screen breathing-bg flex flex-col items-center justify-center relative overflow-hidden px-6">
      <FallingPetals count={30} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="relative z-10 text-center max-w-md"
      >
        {/* Cherry Blossom Tree */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-8"
        >
          <svg width="120" height="160" viewBox="0 0 120 160" className="mx-auto">
            {/* Trunk */}
            <path d="M55 160 L55 90 Q50 70 45 60 Q40 50 50 40" stroke="hsl(25 30% 35%)" strokeWidth="6" fill="none" />
            <path d="M65 160 L65 90 Q70 70 75 60 Q80 50 70 40" stroke="hsl(25 30% 35%)" strokeWidth="6" fill="none" />
            {/* Branches */}
            <path d="M50 80 Q30 60 20 50" stroke="hsl(25 30% 35%)" strokeWidth="3" fill="none" />
            <path d="M70 80 Q90 60 100 50" stroke="hsl(25 30% 35%)" strokeWidth="3" fill="none" />
            <path d="M48 60 Q25 45 15 35" stroke="hsl(25 30% 35%)" strokeWidth="2" fill="none" />
            <path d="M72 60 Q95 45 105 35" stroke="hsl(25 30% 35%)" strokeWidth="2" fill="none" />
            {/* Blossoms */}
            {[
              [60, 30], [40, 35], [80, 35], [25, 40], [95, 40],
              [50, 25], [70, 25], [15, 32], [105, 32],
              [35, 45], [85, 45], [55, 20], [65, 15],
              [30, 50], [90, 50], [45, 15], [75, 15],
              [20, 45], [100, 45], [60, 10],
            ].map(([cx, cy], i) => (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={Math.random() * 3 + 4}
                fill={`hsl(4 100% ${75 + Math.random() * 15}% / ${0.6 + Math.random() * 0.3})`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + i * 0.08, duration: 0.4, type: "spring" }}
              />
            ))}
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-4 leading-relaxed">
            The music's over.
          </h1>
          <p className="text-muted-foreground font-body text-lg leading-relaxed mb-2">
            Hope you found your partner.
          </p>
          <p className="text-blossom/60 font-body text-sm italic">
            See you on the other side. 🌸
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1 }}
          className="mt-12 text-[11px] text-muted-foreground/30 font-body"
        >
          WALTZ · IIM Shillong · 2026
        </motion.p>
      </motion.div>
    </div>
  );
};

export default CinderellaScreen;
