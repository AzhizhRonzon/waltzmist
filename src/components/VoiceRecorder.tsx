import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRecorderProps {
  userId: string;
  matchUuid: string;
  onSend: (audioUrl: string) => void;
}

const VoiceRecorder = ({ userId, matchUuid, onSend }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadAndSend(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, 30000);
    } catch {
      // Microphone permission denied
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const uploadAndSend = async (blob: Blob) => {
    setUploading(true);
    const filePath = `${userId}/${matchUuid}-${Date.now()}.webm`;
    const { error } = await supabase.storage
      .from("voice-notes")
      .upload(filePath, blob);

    if (!error) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("voice-notes")
        .createSignedUrl(filePath, 86400); // 24 hour expiry
      if (!signedError && signedData) {
        onSend(signedData.signedUrl);
      }
    }
    setUploading(false);
    setDuration(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (uploading) {
    return (
      <div className="p-2">
        <Loader2 className="w-4 h-4 text-blossom animate-spin" />
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onPointerDown={startRecording}
      onPointerUp={stopRecording}
      onPointerLeave={() => recording && stopRecording()}
      className={`p-2 rounded-full transition-all ${recording ? "bg-destructive" : ""}`}
      title="Hold to record"
    >
      {recording ? (
        <div className="flex items-center gap-1.5">
          <Square className="w-4 h-4 text-destructive-foreground" />
          <span className="text-[10px] font-body text-destructive-foreground">{formatDuration(duration)}</span>
        </div>
      ) : (
        <Mic className="w-4 h-4 text-muted-foreground" />
      )}
    </motion.button>
  );
};

// Audio playback component for chat bubbles
export const AudioPlayer = ({ src }: { src: string }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
          }
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button onClick={toggle} className="flex-shrink-0">
        {playing ? (
          <Pause className="w-4 h-4 text-blossom" />
        ) : (
          <Play className="w-4 h-4 text-blossom" />
        )}
      </button>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(var(--blossom)), hsl(var(--glow)))",
          }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground font-body">🎤</span>
    </div>
  );
};

export default VoiceRecorder;
