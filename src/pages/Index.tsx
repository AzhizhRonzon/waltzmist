import { useState } from "react";
import { motion } from "framer-motion";
import FallingPetals from "../components/FallingPetals";
import CountdownTimer from "../components/CountdownTimer";
import { useNavigate } from "react-router-dom";
const LandingPage = () => {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => navigate("/login"), 600);
  };
  return <div className="min-h-screen breathing-bg flex flex-col items-center justify-center relative overflow-hidden px-6">
      <FallingPetals count={25} />

      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: entered ? 0 : 1
    }} transition={{
      duration: 0.5
    }} className="relative z-10 text-center max-w-md">
        {/* Logo & Title */}
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 1,
        ease: "easeOut"
      }}>
          <motion.div animate={{
          scale: [1, 1.03, 1]
        }} transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }} className="mb-6">
            <h1 className="font-display text-7xl sm:text-8xl font-bold blossom-text tracking-tight">
              WALTZ
            </h1>
          </motion.div>

          <p className="text-muted-foreground font-body text-lg mb-2">Who are you going with?</p>
          <p className="text-muted-foreground/60 font-body text-sm mb-8">for IIM Shillong<span className="text-blossom italic">"The Clouds"</span>
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4,
        duration: 0.8
      }} className="mb-10 flex justify-center">
          <div className="glass-strong rounded-2xl px-6 py-4 inline-block">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-3">
              The music stops in
            </p>
            <CountdownTimer />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7,
        duration: 0.8
      }} className="space-y-4">
          <motion.button whileHover={{
          scale: 1.04
        }} whileTap={{
          scale: 0.97
        }} onClick={handleEnter} className="btn-waltz text-lg px-12 py-4">
            Enter the Dance Floor 🌸
          </motion.button>

          <p className="text-xs text-muted-foreground/40 font-body">
            Not a networking app. Not LinkedIn. <br />
            Just vibes.
          </p>
        </motion.div>

        {/* Bottom flavor text */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1.2,
        duration: 1
      }} className="mt-16">
          <p className="text-[11px] text-muted-foreground/30 font-body italic">
            "If it feels like a placement interview, delete it."
          </p>
        </motion.div>
      </motion.div>
    </div>;
};
export default LandingPage;