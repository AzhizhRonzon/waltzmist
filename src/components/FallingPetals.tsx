import { useCallback, useEffect, useState } from "react";

interface Petal {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const FallingPetals = ({ count = 20 }: { count?: number }) => {
  const [petals, setPetals] = useState<Petal[]>([]);

  const generatePetals = useCallback(() => {
    const newPetals: Petal[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 12 + 8,
      duration: Math.random() * 8 + 8,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.4 + 0.2,
    }));
    setPetals(newPetals);
  }, [count]);

  useEffect(() => {
    generatePetals();
  }, [generatePetals]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute animate-float-petal"
          style={{
            left: `${petal.left}%`,
            width: petal.size,
            height: petal.size,
            "--duration": `${petal.duration}s`,
            "--delay": `${petal.delay}s`,
            opacity: petal.opacity,
          } as React.CSSProperties}
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className="w-full h-full"
          >
            <path
              d="M16 2C16 2 24 8 24 16C24 24 16 30 16 30C16 30 8 24 8 16C8 8 16 2 16 2Z"
              fill="hsl(4 100% 85% / 0.8)"
            />
            <path
              d="M16 6C16 6 20 10 20 16C20 22 16 26 16 26C16 26 12 22 12 16C12 10 16 6 16 6Z"
              fill="hsl(10 80% 88% / 0.6)"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default FallingPetals;
