import { useEffect, useState } from "react";

const WALTZ_DATE = new Date("2025-02-14T00:00:00+05:30").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = WALTZ_DATE - now;

      if (diff <= 0) {
        setIsOver(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isOver) {
    return (
      <div className="text-center">
        <p className="font-display text-xl italic text-blossom animate-pulse-glow">
          The music has stopped 🌸
        </p>
      </div>
    );
  }

  const blocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-3">
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="glass rounded-xl px-3 py-2 min-w-[52px] text-center animate-count-pulse">
              <span className="text-2xl font-bold text-blossom font-body tabular-nums">
                {String(block.value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 font-body uppercase tracking-wider">
              {block.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-blossom/40 text-lg font-bold mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
