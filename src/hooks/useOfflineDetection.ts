import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    let hasShownOffline = false;

    const handleOnline = () => {
      setIsOnline(true);
      if (hasShownOffline) {
        toast({ title: "Back online 🌸", description: "Connection restored." });
        hasShownOffline = false;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      hasShownOffline = true;
      toast({
        title: "You're offline 📡",
        description: "Some features may not work until you reconnect.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
