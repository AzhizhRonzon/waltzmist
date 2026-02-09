import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import FallingPetals from "../components/FallingPetals";
import { useWaltzStore } from "../context/WaltzStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getRandomQuip } from "../components/EasterEggs";

type AuthStep = "form" | "verify" | "success";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { signIn } = useWaltzStore();

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationEmail = async (targetEmail: string) => {
    const code = generateOTP();
    // Store OTP in localStorage for verification (expires in 10 min)
    localStorage.setItem(`waltz_otp_${targetEmail}`, JSON.stringify({
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    }));

    const { data, error } = await supabase.functions.invoke("send-verification-email", {
      body: { email: targetEmail, otp: code },
    });

    if (error) throw new Error(error.message || "Failed to send verification email");
    return data;
  };

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
    if (isSignUp) {
      try {
        // First create the account with auto-confirm disabled
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (signUpError) {
          // Handle "user already registered"
          if (signUpError.message.includes("already registered")) {
            setError("This email is already registered. Try signing in instead.");
            setLoading(false);
            return;
          }
          throw signUpError;
        }

        // Send OTP verification email via Resend
        await sendVerificationEmail(trimmedEmail);
        setStep("verify");
        toast({ title: "Code sent! 📧", description: "Check your email for the 6-digit code." });
      } catch (err: any) {
        setError(err.message || "Something went wrong. Try again.");
      }
      setLoading(false);
    } else {
      const result = await signIn(trimmedEmail, password);
      setLoading(false);
      if (result.error) { setError(result.error); return; }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the full 6-digit code."); return; }

    setLoading(true);
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const stored = localStorage.getItem(`waltz_otp_${trimmedEmail}`);
    
    if (!stored) {
      setError("Verification expired. Please request a new code.");
      setLoading(false);
      return;
    }

    const { code: storedCode, expiresAt } = JSON.parse(stored);
    
    if (Date.now() > expiresAt) {
      localStorage.removeItem(`waltz_otp_${trimmedEmail}`);
      setError("Code expired. Please request a new one.");
      setLoading(false);
      return;
    }

    if (code !== storedCode) {
      setError("Incorrect code. Please try again.");
      setLoading(false);
      return;
    }

    // OTP verified — sign in
    localStorage.removeItem(`waltz_otp_${trimmedEmail}`);
    const result = await signIn(trimmedEmail, password);
    setLoading(false);

    if (result.error) {
      // If sign-in fails, email might not be confirmed yet
      setError(result.error);
      return;
    }

    setStep("success");
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");
    try {
      await sendVerificationEmail(email.trim().toLowerCase());
      toast({ title: "New code sent! 📧", description: "Check your inbox." });
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
    setResending(false);
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
            {step === "verify" ? "Almost there 📧" : isSignUp ? "Join the Dance Floor 🌸" : "Welcome back 🌸"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "verify" ? (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-strong rounded-2xl p-6 space-y-5 blossom-glow"
            >
              <div className="text-center">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <KeyRound className="w-12 h-12 mx-auto text-blossom" />
                </motion.div>
                <h2 className="font-display text-xl text-foreground mt-3">Enter Verification Code</h2>
                <p className="text-muted-foreground font-body text-sm mt-2">
                  We sent a 6-digit code to<br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold bg-input rounded-xl text-foreground font-body focus:outline-none focus:ring-2 focus:ring-blossom/40 transition-all"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-2 text-destructive text-sm font-body glass rounded-xl p-3 border border-destructive/20">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={verifyOTP}
                disabled={loading || otp.join("").length !== 6}
                className="btn-waltz w-full text-base disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    Verifying...
                  </span>
                ) : "Verify & Enter"}
              </motion.button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setStep("form"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                  className="text-sm text-muted-foreground font-body hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={resending}
                  className="text-sm text-blossom font-body hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              </div>

              <p className="text-center text-[10px] text-muted-foreground/50 font-body">
                Check spam folder if you don't see it. Code expires in 10 minutes.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
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
                    className="flex items-start gap-2 text-destructive text-sm font-body glass rounded-xl p-3 border border-destructive/20"
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
                  ) : isSignUp ? "Enter the Dance Floor" : "Welcome Back"}
                </motion.button>
              </div>

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
                Only @iimshillong.ac.in emails allowed.
                <br />No exceptions. No LinkedIn profiles.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;
