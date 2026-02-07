import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, Check } from "lucide-react";

interface ReportModalProps {
  targetName: string;
  onReport: (reason: string) => void;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Inappropriate behavior",
  "Offensive messages",
  "Harassment or threats",
  "Identity leak / doxxing",
  "Screenshot-based harassment",
  "Other",
];

const ReportModal = ({ targetName, onReport, onClose }: ReportModalProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    onReport(selected);
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
      style={{ background: "hsl(var(--night) / 0.8)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-3xl p-6 w-full max-w-sm"
      >
        {submitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "hsl(140 70% 50% / 0.2)" }}>
              <Check className="w-8 h-8" style={{ color: "hsl(140 70% 50%)" }} />
            </div>
            <h3 className="font-display text-xl text-foreground mb-1">Report Submitted</h3>
            <p className="text-sm text-muted-foreground font-body">Our team will review this shortly.</p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-maroon" />
                <h3 className="font-display text-xl text-foreground">Report {targetName}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/50">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground font-body mb-4">
              We take safety seriously. Select a reason below.
            </p>

            <div className="space-y-2 mb-5">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelected(reason)}
                  className={`w-full text-left px-4 py-3 rounded-2xl font-body text-sm transition-all border ${
                    selected === reason
                      ? "border-maroon/40 bg-maroon/10 text-maroon"
                      : "border-transparent glass text-foreground hover:border-maroon/20"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!selected}
              className="w-full rounded-full px-8 py-3 font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "hsl(var(--maroon))", color: "hsl(var(--foreground))" }}
            >
              Submit Report
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReportModal;
