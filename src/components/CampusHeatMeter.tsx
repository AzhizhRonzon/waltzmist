import { motion } from "framer-motion";
import { Flame, Clock, Heart, TrendingUp, Zap, MessageCircle } from "lucide-react";
import { HEAT_STATS } from "../context/WaltzStore";

const stats = [
  { label: "Most Active Program", value: HEAT_STATS.mostActiveProgram, icon: TrendingUp, color: "blossom" },
  { label: "Busiest Swipe Hour", value: HEAT_STATS.busiestHour, icon: Clock, color: "glow" },
  { label: "Prom Pact Count", value: String(HEAT_STATS.promPactCount), icon: Heart, color: "blossom" },
  { label: "Total Swipes", value: HEAT_STATS.totalSwipes.toLocaleString(), icon: Zap, color: "glow" },
  { label: "Match Rate", value: HEAT_STATS.matchRate, icon: MessageCircle, color: "blossom" },
];

const CampusHeatMeter = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-5 h-5 text-blossom" />
        <h3 className="font-display text-lg text-foreground">Campus Heat Meter</h3>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-4">
        Anonymous aggregate stats from the Clouds 🔥
      </p>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass rounded-2xl p-4 ${i === 0 ? "col-span-2" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${stat.color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-body">
                  {stat.label}
                </span>
              </div>
              <p className="font-display text-2xl text-foreground">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-4 mt-3 border border-blossom/10">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-body mb-1">
          Most Popular Red Flag
        </p>
        <p className="text-sm text-blossom font-body italic">
          "I honestly believe that {HEAT_STATS.topPrompt}"
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground/40 font-body text-center mt-2">
        No individual rankings. No ego damage.
      </p>
    </div>
  );
};

export default CampusHeatMeter;
