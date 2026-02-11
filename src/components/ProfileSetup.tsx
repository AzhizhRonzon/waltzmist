import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, AlertTriangle, Info, Moon, Sun } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import { useWaltzStore } from "../context/WaltzStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileFormData {
  name: string;
  program: string;
  section: string;
  sex: string;
  age: number;
  maggiMetric: number;
  favoriteTrip: string;
  partySpot: string;
  redFlag: string;
  photoUrls: string[];
}

interface ProfileSetupProps {
  onComplete: (data: ProfileFormData) => void;
}

const PROGRAMS = ["PGP24", "PGP25", "PGPEx", "IPM", "PhD"];
const SECTIONS = ["1", "2", "3", "4", "5", "6"];

const MIN_NAME_LENGTH = 3;

const getMaggiLabel = (v: number) => {
  if (v <= 25) return "Early Bird 🌅";
  if (v <= 50) return "Balanced ⚖️";
  if (v <= 75) return "Night Owl 🦉";
  return "Vampire Hours 🧛";
};

const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const { session } = useWaltzStore();
  const [step, setStep] = useState(0);
  const [photoError, setPhotoError] = useState(false);
  const [nameError, setNameError] = useState("");
  const [form, setForm] = useState<ProfileFormData>({
    name: "",
    program: "",
    section: "",
    sex: "",
    age: 0,
    maggiMetric: 50,
    favoriteTrip: "",
    partySpot: "",
    redFlag: "",
    photoUrls: [],
  });

  const validateName = (name: string) => {
    if (name.trim().length > 0 && name.trim().length < MIN_NAME_LENGTH) {
      return "At least your first name, please! No professor here to cold-call you 😄";
    }
    return "";
  };

  const steps = [
    // Step 0: Basics
    <motion.div key="basics" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">The Anti-CV</h2>
        <p className="text-muted-foreground text-sm font-body">No convocation photos allowed.</p>
        <p className="text-[10px] text-blossom/70 font-body mt-2 italic leading-relaxed">
          ⚠️ You need a recognizable first name and at least one photo to join the dance floor. Incomplete profiles won't be shown to others.
        </p>
      </div>

      {/* Photo upload */}
      {session?.user && (
        <div>
          <PhotoUpload
            userId={session.user.id}
            photos={form.photoUrls}
            onChange={(urls) => { setForm({ ...form, photoUrls: urls }); setPhotoError(false); }}
          />
          {photoError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-maroon text-xs font-body mt-2 italic"
            >
              People around campus already see you — what's the point in hiding yourself among family? 📸
            </motion.p>
          )}
        </div>
      )}

      <div>
        <label className="text-sm text-muted-foreground font-body block mb-2">What do they call you?</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            setNameError(validateName(e.target.value));
          }}
          placeholder="Your name"
          className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blossom/30"
          maxLength={50}
        />
        {nameError && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-maroon text-xs font-body mt-1 italic">
            {nameError}
          </motion.p>
        )}
      </div>

      <div>
        <label className="text-sm text-muted-foreground font-body block mb-2">Program</label>
        <div className="flex flex-wrap gap-2">
          {PROGRAMS.map((p) => (
            <button key={p} onClick={() => setForm({ ...form, program: p })} className={`pill ${form.program === p ? "pill-active" : ""}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground font-body block mb-2">I am</label>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setForm({ ...form, sex: s })}
              className={`pill flex-1 text-center capitalize ${form.sex === s ? "pill-active" : ""}`}
            >
              {s === "male" ? "👨 Male" : "👩 Female"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground font-body block mb-2">Age</label>
        <input
          type="number"
          min={18}
          max={99}
          value={form.age || ""}
          onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
          placeholder="Must be 18+"
          className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blossom/30"
        />
        {form.age > 0 && form.age < 18 && (
          <p className="text-maroon text-xs font-body mt-1">You must be at least 18.</p>
        )}
      </div>
    </motion.div>,

    // Step 1: Vibe Check
    <motion.div key="vibe" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">The Vibe Check</h2>
        <p className="text-muted-foreground text-sm font-body">Let's see what you're really about.</p>
      </div>

      <div className="glass rounded-2xl p-4">
        <label className="text-sm text-muted-foreground font-body block mb-3">🌙 Night Owl or Early Bird?</label>
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-4 h-4 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="100"
            value={form.maggiMetric}
            onChange={(e) => setForm({ ...form, maggiMetric: Number(e.target.value) })}
            className="w-full accent-blossom"
          />
          <Moon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-center text-xs text-blossom font-body mt-1">{getMaggiLabel(form.maggiMetric)}</p>
      </div>

      <div>
        <label className="text-sm text-muted-foreground font-body flex items-center gap-1.5 mb-2">
          Section Pride <span className="text-muted-foreground/50">(optional)</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">Sections are only for PGP25. If you're from another program, feel free to skip this.</p>
            </TooltipContent>
          </Tooltip>
        </label>
        <p className="text-xs text-muted-foreground/70 mb-2 italic font-body">
          "Choose wisely. Cross-batch dating is high risk, high reward."
        </p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setForm({ ...form, section: form.section === s ? "" : s })}
              className={`pill ${form.section === s ? "pill-active" : ""}`}
            >
              Section {s}
            </button>
          ))}
        </div>
        {form.section && (
          <button
            onClick={() => setForm({ ...form, section: "" })}
            className="text-xs text-blossom/60 font-body mt-2 hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>
    </motion.div>,

    // Step 2: Shillong Essentials
    <motion.div key="essentials" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">Shillong Essentials</h2>
        <p className="text-muted-foreground text-sm font-body">What makes you, you — in the Clouds.</p>
      </div>

      <div>
        <label className="text-sm text-muted-foreground font-body block mb-2">My favorite trip so far</label>
        <input
          type="text"
          value={form.favoriteTrip}
          onChange={(e) => setForm({ ...form, favoriteTrip: e.target.value })}
          placeholder="Cherrapunji in the rain..."
          className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blossom/30"
          maxLength={100}
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground font-body block mb-2">Go-to party spot</label>
        <input
          type="text"
          value={form.partySpot}
          onChange={(e) => setForm({ ...form, partySpot: e.target.value })}
          placeholder="Cloud 9, obviously..."
          className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blossom/30"
          maxLength={100}
        />
      </div>

      <div className="glass rounded-2xl p-4 border border-maroon/20">
        <label className="text-sm text-maroon font-body flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4" />
          The Red Flag (Optional)
        </label>
        <p className="text-xs text-muted-foreground/70 mb-2 font-body">"I honestly believe that…"</p>
        <input
          type="text"
          value={form.redFlag}
          onChange={(e) => setForm({ ...form, redFlag: e.target.value })}
          placeholder="...finance is a personality trait."
          className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-maroon/30"
          maxLength={120}
        />
      </div>
    </motion.div>,
  ];

  const canProceed = () => {
    if (step === 0) return form.name.trim().length >= MIN_NAME_LENGTH && form.program && form.sex && form.age >= 18;
    return true;
  };

  const handleNext = () => {
    if (step === 0 && form.photoUrls.length === 0) {
      setPhotoError(true);
      return;
    }
    if (step === 0 && form.name.trim().length < MIN_NAME_LENGTH) {
      setNameError("At least your first name, please! No professor here to cold-call you 😄");
      return;
    }
    setPhotoError(false);
    setNameError("");
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(form);
    }
  };

  return (
    <div className="min-h-screen breathing-bg flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i <= step
                  ? "linear-gradient(90deg, hsl(var(--blossom)), hsl(var(--glow)))"
                  : "hsl(var(--secondary))",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>

      {/* Action */}
      <div className="px-6 pb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!canProceed()}
          className="btn-waltz w-full flex items-center justify-center gap-2 text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          {step < steps.length - 1 ? "Next" : "Start the Waltz"}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default ProfileSetup;
