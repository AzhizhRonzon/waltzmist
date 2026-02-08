import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, Heart, TrendingUp, Zap, MessageCircle } from "lucide-react";
import { useWaltzStore } from "../context/WaltzStore";

const CampusHeatMeter = () => {
  const { campusStats, fetchCampusStats } = useWaltzStore();

  useEffect(() => {
    fetchCampusStats();
  }, []);

  const formatHour = (h: number | null) => {
    if (h === null) return "—";
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  };

  const stats = campusStats ? [
    { label: "Most Active Program", value: campusStats.mostActiveProgram || "—", icon: TrendingUp, color: "blossom" },
    { label: "Busiest Swipe Hour", value: formatHour(campusStats.busiestHour), icon: Clock, color: "glow" },
    { label: "Prom Pact Count", value: String(campusStats.promPactCount), icon: Heart, color: "blossom" },
    { label: "Total Swipes", value: campusStats.totalSwipes.toLocaleString(), icon: Zap, color: "glow" },
    { label: "Match Rate", value: `${campusStats.matchRate}%`, icon: MessageCircle, color: "blossom" },
  ] : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-5 h-5 text-blossom" />
        <h3 className="font-display text-lg text-foreground">Campus Heat Meter</h3>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-4">
        Anonymous aggregate stats from the Clouds 🔥
      </p>

      {!campusStats ? (
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className={`glass rounded-2xl p-4 animate-pulse ${i === 0 ? "col-span-2" : ""}`}>
              <div className="h-3 bg-secondary/30 rounded-full w-1/2 mb-2" />
              <div className="h-6 bg-secondary/20 rounded-full w-1/3" />
            </div>
          ))}
        </div>
      ) : (
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
                  <Icon className="w-4 h-4 text-blossom" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-body">
                    {stat.label}
                  </span>
                </div>
                <p className="font-display text-2xl text-foreground">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {campusStats?.topRedFlag && (
        <div className="glass rounded-2xl p-4 mt-3 border border-blossom/10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-body mb-1">
            Most Popular Red Flag
          </p>
          <p className="text-sm text-blossom font-body italic">
            "I honestly believe that {campusStats.topRedFlag}"
          </p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40 font-body text-center mt-2">
        No individual rankings. No ego damage.
      </p>
    </div>
  );
};

export default CampusHeatMeter;
