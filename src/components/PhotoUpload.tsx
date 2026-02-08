import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  userId: string;
  photos: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
}

const PhotoUpload = ({ userId, photos, onChange, maxPhotos = 4 }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [targetSlot, setTargetSlot] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB per photo.", variant: "destructive" });
      return;
    }

    setUploading(targetSlot);

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${targetSlot}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    const newPhotos = [...photos];
    newPhotos[targetSlot] = urlData.publicUrl;
    onChange(newPhotos.filter(Boolean));
    setUploading(null);

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] || null);

  return (
    <div className="flex gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {slots.map((photo, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (uploading !== null) return;
            setTargetSlot(i);
            inputRef.current?.click();
          }}
          className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border transition-colors"
          style={{
            borderColor: photo
              ? "hsl(var(--blossom) / 0.3)"
              : "hsl(var(--glass-border) / 0.3)",
            background: photo ? "transparent" : "hsl(var(--glass-bg) / 0.6)",
          }}
        >
          {photo ? (
            <>
              <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--destructive))" }}
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {uploading === i ? (
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          )}

          {i === 0 && !photo && (
            <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] text-muted-foreground/60 font-body">
              Required
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default PhotoUpload;
