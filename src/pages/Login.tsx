import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import FallingPetals from "../components/FallingPetals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup" | "forgot";
type AuthStep = "form" | "verify" | "reset-password";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = async (emailAddr: string) => {
    const { data, error: fnError } = await supabase.functions.invoke("send-verification-email", {
      body: { email: emailAddr },
    });
    if (fnError) throw new Error(fnError.message || "Failed to send code");
    if (data?.error) throw new Error(data.error);
  };

  const validateEmail = (e: string): string | null => {
    if (!e) return "Enter your college email.";
    if (!e.endsWith("@iimshillong.ac.in")) return "Sorry, only @iimshillong.ac.in emails allowed. 📚";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim().toLowerCase();
    const emailErr = validateEmail(trimmedEmail);
    if (emailErr) { setError(emailErr); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        if (signInError.message.includes("Invalid login")) {
          setError("Wrong email or password. Try again or sign up.");
        } else {
          setError(signInError.message);
        }
      } else {
        toast({ title: "🌸 Welcome back!", description: "Let's dance." });
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim().toLowerCase();
    const emailErr = validateEmail(trimmedEmail);
    if (emailErr) { setError(emailErr); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      await sendOtp(trimmedEmail);
      setStep("verify");
      toast({ title: "Code sent! 📧", description: "Check your email for the 6-digit code." });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    }
    setLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim().toLowerCase();
    const emailErr = validateEmail(trimmedEmail);
    if (emailErr) { setError(emailErr); return; }

    setLoading(true);
    try {
      await sendOtp(trimmedEmail);
      setStep("verify");
      toast({ title: "Code sent! 📧", description: "Check your email for the reset code." });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    if (pasted.length === 6) otpRefs.current[5]?.focus();
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the full 6-digit code."); return; }

    setLoading(true);
    setError("");

    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (mode === "signup") {
        // Verify OTP then create account with password
        const { data, error: fnError } = await supabase.functions.invoke("verify-otp", {
          body: { email: trimmedEmail, code, password, action: "signup" },
        });

        if (fnError) { setError(fnError.message || "Verification failed"); setLoading(false); return; }
        if (data?.error) { setError(data.error); setLoading(false); return; }

        // Sign in with the token_hash
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (verifyError) { setError(verifyError.message || "Failed to sign in"); setLoading(false); return; }
        toast({ title: "🌸 Welcome to WALTZ!", description: "Let's set up your profile." });
      } else if (mode === "forgot") {
        // Verify OTP for password reset — show new password form
        const { data, error: fnError } = await supabase.functions.invoke("verify-otp", {
          body: { email: trimmedEmail, code, action: "verify_only" },
        });

        if (fnError) { setError(fnError.message || "Verification failed"); setLoading(false); return; }
        if (data?.error) { setError(data.error); setLoading(false); return; }

        setStep("reset-password");
        toast({ title: "✅ Code verified!", description: "Set your new password." });
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError("");

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error: fnError } = await supabase.functions.invoke("verify-otp", {
        body: { email: trimmedEmail, password: newPassword, action: "reset_password" },
      });

      if (fnError) { setError(fnError.message || "Reset failed"); setLoading(false); return; }
      if (data?.error) { setError(data.error); setLoading(false); return; }

      toast({ title: "🔑 Password reset!", description: "Sign in with your new password." });
      resetForm();
      setMode("login");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");
    try {
      await sendOtp(email.trim().toLowerCase());
      toast({ title: "New code sent! 📧" });
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
    setResending(false);
  };

  const resetForm = () => {
    setStep("form");
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setNewPassword("");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
    setPassword("");
  };

  const formTitle = mode === "login" ? "Welcome Back 🌸" : mode === "signup" ? "Join the Dance Floor 🌸" : "Reset Password 🔑";
  const formSubtitle = mode === "login" ? "Sign in to continue" : mode === "signup" ? "Create your account" : "We'll send you a code";

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
            {step !== "form" ? (step === "reset-password" ? "Set new password" : "Almost there 📧") : formSubtitle}
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
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                    Verifying...
                  </span>
                ) : "Verify Code"}
              </motion.button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => resetForm()}
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
          ) : step === "reset-password" ? (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-strong rounded-2xl p-6 space-y-5 blossom-glow"
            >
              <div className="text-center">
                <Lock className="w-12 h-12 mx-auto text-blossom" />
                <h2 className="font-display text-xl text-foreground mt-3">New Password</h2>
                <p className="text-muted-foreground font-body text-sm mt-2">
                  Choose a new password for<br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  placeholder="New password (min. 6 characters)"
                  className="w-full bg-input rounded-xl pl-10 pr-10 py-3 text-foreground font-body placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blossom/30"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                onClick={handleResetPassword}
                disabled={loading || newPassword.length < 6}
                className="btn-waltz w-full text-base disabled:opacity-60"
              >
                {loading ? "Resetting..." : "Set New Password"}
              </motion.button>

              <button
                onClick={() => resetForm()}
                className="text-sm text-muted-foreground font-body hover:underline flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotSubmit}
              className="space-y-4"
            >
              <div className="glass-strong rounded-2xl p-6 space-y-4 blossom-glow">
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

                {mode !== "forgot" && (
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
                        placeholder={mode === "signup" ? "Create a password (min. 6)" : "Your password"}
                        className="w-full bg-input rounded-xl pl-10 pr-10 py-3 text-foreground font-body placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blossom/30"
                        maxLength={100}
                        minLength={6}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 text-destructive text-sm font-body glass rounded-xl p-3 border border-destructive/20"
                  >
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                      {mode === "login" ? "Signing in..." : mode === "signup" ? "Sending code..." : "Sending code..."}
                    </span>
                  ) : mode === "login" ? "Sign In 🌸" : mode === "signup" ? "Send Verification Code 📧" : "Send Reset Code 📧"}
                </motion.button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-blossom/70 font-body hover:underline w-full text-center"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="text-center">
                {mode === "login" ? (
                  <p className="text-xs text-muted-foreground/60 font-body">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => switchMode("signup")} className="text-blossom hover:underline">
                      Sign up
                    </button>
                  </p>
                ) : mode === "signup" ? (
                  <p className="text-xs text-muted-foreground/60 font-body">
                    Already have an account?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="text-blossom hover:underline">
                      Sign in
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/60 font-body">
                    Remember your password?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="text-blossom hover:underline">
                      Sign in
                    </button>
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/40 font-body mt-2">
                  Only @iimshillong.ac.in emails allowed.
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;
