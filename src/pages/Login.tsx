import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FallingPetals from "../components/FallingPetals";
import { useWaltzStore } from "../context/WaltzStore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn } = useWaltzStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setError("Enter your college email."); return; }
    if (!trimmedEmail.endsWith("@iimshillong.ac.in")) {
      setError("Sorry, this party is strictly for the Clouds. Go study. 📚");
      return;
    }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    const result = isSignUp
      ? await signUp(trimmedEmail, password)
      : await signIn(trimmedEmail, password);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate("/profile");
  };

  return (
    <div className="min-h-screen breathing-bg flex flex-col items-center justify-center relative px-6">
      <FallingPetals count={15} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-10">
          <motion.h1
            className="font-display text-5xl font-bold blossom-text mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            WALTZ
          </motion.h1>
          <p className="text-muted-foreground font-body text-sm">
            {isSignUp ? "Join the Dance Floor 🌸" : "Welcome back 🌸"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-strong rounded-2xl p-6 space-y-4 blossom-glow">
            {/* Email */}
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-2 uppercase tracking-wider">
                College Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@iimshillong.ac.in"
                  className="w-full bg-input rounded-xl pl-10 pr-4 py-3 text-foreground font-body placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blossom/30"
                  maxLength={100}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Min 6 characters"
                  className="w-full bg-input rounded-xl pl-10 pr-12 py-3 text-foreground font-body placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blossom/30"
                  maxLength={100}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-maroon text-sm font-body glass rounded-xl p-3 border border-maroon/20"
              >
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-waltz w-full text-base disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                isSignUp ? "Enter the Dance Floor" : "Welcome Back"
              )}
            </motion.button>
          </div>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-sm text-blossom font-body hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "New here? Sign Up"}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 font-body">
            Only @iimshillong.ac.in emails allowed. <br />
            No exceptions. No LinkedIn profiles.
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
