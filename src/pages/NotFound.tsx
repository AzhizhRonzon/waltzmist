import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import FallingPetals from "../components/FallingPetals";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen breathing-bg flex items-center justify-center relative overflow-hidden">
      <FallingPetals count={8} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🥀
        </motion.div>
        <h1 className="font-display text-5xl font-bold blossom-text mb-3">404</h1>
        <p className="text-muted-foreground font-body text-sm mb-1">This path doesn't exist in the Clouds.</p>
        <p className="text-muted-foreground/50 font-body text-xs mb-6 italic">Maybe your Waltz partner is on the dance floor instead?</p>
        <button onClick={() => navigate("/")} className="btn-waltz">
          Back to the Dance Floor 🌸
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
