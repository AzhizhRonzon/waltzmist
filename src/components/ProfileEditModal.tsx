import { useState } from "react";
import { motion } from "framer-motion";
import { X, Camera, Save, AlertTriangle } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import { useWaltzStore } from "../context/WaltzStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProfileEditModalProps {
  onClose: () => void;
}

const PROGRAMS = ["PGP24", "PGP25", "PGPEx", "IPM", "PhD"];
const SECTIONS = ["1", "2", "3", "4", "5", "6"];

const ProfileEditModal = ({ onClose }: ProfileEditModalProps) => {
  const { session, myProfile } = useWaltzStore();
  const [saving, setSaving] = useState(false);
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
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim(),
        program: form.program,
        section: form.section || null,
        maggi_metric: form.maggiMetric,
        favorite_trip: form.favoriteTrip,
        party_spot: form.partySpot,
        red_flag: form.redFlag || null,
        photo_urls: form.photoUrls.length > 0 ? form.photoUrls : null,
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated! 🌸" });
      // Reload page to refresh data
      window.location.reload();
    }
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
              <label className="text-sm text-muted-foreground font-body block mb-2">Photos</label>
              <PhotoUpload
                userId={session.user.id}
                photos={form.photoUrls}
                onChange={(urls) => setForm({ ...form, photoUrls: urls })}
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-sm text-muted-foreground font-body block mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-input rounded-xl px-4 py-3 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blossom/30"
              maxLength={50}
            />
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
            <label className="text-sm text-muted-foreground font-body block mb-2">Section (optional)</label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, section: form.section === s ? "" : s })} className={`pill ${form.section === s ? "pill-active" : ""}`}>
                  Section {s}
                </button>
              ))}
            </div>
          </div>

          {/* Maggi Metric */}
          <div className="glass rounded-2xl p-4">
            <label className="text-sm text-muted-foreground font-body block mb-3">🍜 Late-Night Maggi Metric</label>
            <input
              type="range" min="0" max="100" value={form.maggiMetric}
              onChange={(e) => setForm({ ...form, maggiMetric: Number(e.target.value) })}
              className="w-full accent-blossom"
            />
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
            disabled={saving || !form.name.trim()}
            className="btn-waltz w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileEditModal;
