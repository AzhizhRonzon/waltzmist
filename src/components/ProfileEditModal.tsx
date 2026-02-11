import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, AlertTriangle, LogOut, Info, Moon, Sun } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import { useWaltzStore } from "../context/WaltzStore";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface ProfileEditModalProps {
  onClose: () => void;
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

const ProfileEditModal = ({ onClose }: ProfileEditModalProps) => {
  const navigate = useNavigate();
  const { session, myProfile, updateProfile, signOut } = useWaltzStore();
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [form, setForm] = useState({
    name: myProfile?.name || "",
    program: myProfile?.batch || "",
    section: myProfile?.section || "",
    maggiMetric: myProfile?.maggiMetric ?? 50,
    favoriteTrip: myProfile?.favoriteTrip || "",
    partySpot: myProfile?.partySpot || "",
    redFlag: myProfile?.redFlag || "",
    photoUrls: myProfile?.photos?.filter(p => !p.includes("dicebear")) || [],
  });

  const handleSave = async () => {
    if (!session?.user) return;
    if (form.name.trim().length < MIN_NAME_LENGTH) {
      setNameError("At least your first name, please! No professor here to cold-call you 😄");
      return;
    }
    if (form.photoUrls.length === 0) {
      setPhotoError("People around campus already see you — what's the point in hiding yourself among family? 📸");
      return;
    }
    setSaving(true);
    await updateProfile({
      name: form.name.trim(),
      program: form.program,
      section: form.section,
      maggiMetric: form.maggiMetric,
      favoriteTrip: form.favoriteTrip,
      partySpot: form.partySpot,
      redFlag: form.redFlag,
      photoUrls: form.photoUrls,
    });
    setSaving(false);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate("/");
  };

  const handlePhotoChange = (urls: string[]) => {
    setForm({ ...form, photoUrls: urls });
    if (urls.length > 0) setPhotoError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "hsl(var(--night) / 0.85)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary/50">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Photos */}
          {session?.user && (
            <div>
              <label className="text-sm text-muted-foreground font-body block mb-2">Photos <span className="text-maroon text-xs">(min 1 required)</span></label>
              <PhotoUpload
                userId={session.user.id}
                photos={form.photoUrls}
                onChange={handlePhotoChange}
              />
              {photoError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-maroon text-xs font-body mt-2 italic">
                  {photoError}
                </motion.p>
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-sm text-muted-foreground font-body block mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (e.target.value.trim().length >= MIN_NAME_LENGTH) setNameError("");
              }}
              className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blossom/30"
              maxLength={50}
            />
            {nameError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-maroon text-xs font-body mt-1 italic">
                {nameError}
              </motion.p>
            )}
          </div>

          {/* Program */}
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

          {/* Section */}
          <div>
            <label className="text-sm text-muted-foreground font-body flex items-center gap-1.5 mb-2">
              Section (optional)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">Sections are only for PGP25. If you're from another program, feel free to skip this.</p>
                </TooltipContent>
              </Tooltip>
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, section: form.section === s ? "" : s })} className={`pill ${form.section === s ? "pill-active" : ""}`}>
                  Section {s}
                </button>
              ))}
            </div>
          </div>

          {/* Night Owl / Early Bird */}
          <div className="glass rounded-2xl p-4">
            <label className="text-sm text-muted-foreground font-body block mb-3">🌙 Night Owl or Early Bird?</label>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <input
                type="range" min="0" max="100" value={form.maggiMetric}
                onChange={(e) => setForm({ ...form, maggiMetric: Number(e.target.value) })}
                className="w-full accent-blossom"
              />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-center text-xs text-blossom font-body">{getMaggiLabel(form.maggiMetric)}</p>
          </div>

          {/* Trip */}
          <div>
            <label className="text-sm text-muted-foreground font-body block mb-2">Favorite trip</label>
            <input
              type="text" value={form.favoriteTrip}
              onChange={(e) => setForm({ ...form, favoriteTrip: e.target.value })}
              className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-blossom/30"
              maxLength={100}
            />
          </div>

          {/* Party Spot */}
          <div>
            <label className="text-sm text-muted-foreground font-body block mb-2">Party spot</label>
            <input
              type="text" value={form.partySpot}
              onChange={(e) => setForm({ ...form, partySpot: e.target.value })}
              className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-blossom/30"
              maxLength={100}
            />
          </div>

          {/* Red Flag */}
          <div className="glass rounded-2xl p-4 border border-maroon/20">
            <label className="text-sm text-maroon font-body flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />Red Flag
            </label>
            <input
              type="text" value={form.redFlag}
              onChange={(e) => setForm({ ...form, redFlag: e.target.value })}
              className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-maroon/30"
              maxLength={120}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || form.name.trim().length < MIN_NAME_LENGTH || form.photoUrls.length === 0}
            className="btn-waltz w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </motion.button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-body text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileEditModal;
