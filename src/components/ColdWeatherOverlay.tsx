import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";

// Open-Meteo API for Shillong (lat: 25.5788, lon: 91.8933) — free, no API key needed
const SHILLONG_LAT = 25.5788;
const SHILLONG_LON = 91.8933;

export function useColdWeatherMode() {
  const [isCold, setIsCold] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${SHILLONG_LAT}&longitude=${SHILLONG_LON}&current_weather=true`
        );
        const data = await res.json();
        const currentTemp = data?.current_weather?.temperature;
        if (typeof currentTemp === "number") {
          setTemp(currentTemp);
          setIsCold(currentTemp < 10);
        }
      } catch {
        // Silently fail — not critical
      }
    };
    check();
    const interval = setInterval(check, 30 * 60 * 1000); // Check every 30 min
    return () => clearInterval(interval);
  }, []);

  return { isCold, temp };
}

const ColdWeatherOverlay = ({ temp }: { temp: number | null }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {/* Frost edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at top left, hsl(200 80% 90% / 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at top right, hsl(200 80% 90% / 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at bottom left, hsl(200 80% 90% / 0.08) 0%, transparent 30%)
          `,
        }}
      />

      {/* Floating snowflakes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, Math.sin(i) * 30],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        >
          <Snowflake
            className="text-blue-200/30"
            style={{ width: 8 + Math.random() * 12, height: 8 + Math.random() * 12 }}
          />
        </motion.div>
      ))}

      {/* Temperature badge — positioned in empty space to avoid overlap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-24 right-4 glass rounded-full px-3 py-1.5 flex items-center gap-1.5 pointer-events-auto"
        style={{ border: "1px solid hsl(200 80% 70% / 0.3)" }}
      >
        <Snowflake className="w-3.5 h-3.5" style={{ color: "hsl(200 80% 70%)" }} />
        <span className="text-[11px] font-body" style={{ color: "hsl(200 80% 70%)" }}>
          {temp !== null ? `${temp}°C` : "❄️"} Shillong
        </span>
      </motion.div>
    </div>
  );
};

export default ColdWeatherOverlay;
