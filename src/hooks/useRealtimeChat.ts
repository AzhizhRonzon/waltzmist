import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage } from "@/context/WaltzStore";

interface UseRealtimeChatOptions {
  matchUuid: string | undefined;
  currentUserId: string | undefined;
  onNewMessage: (msg: ChatMessage) => void;
}

export function useRealtimeChat({ matchUuid, currentUserId, onNewMessage }: UseRealtimeChatOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!matchUuid || !currentUserId) return;

    const channel = supabase
      .channel(`chat-${matchUuid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchUuid}`,
        },
        (payload) => {
          const row = payload.new as any;
          // Only handle messages from the other user (we already add our own optimistically)
          if (row.sender_id === currentUserId) return;

          onNewMessage({
            id: row.id,
            senderId: row.sender_id,
            text: row.text,
            timestamp: new Date(row.created_at),
            status: row.status as "sent" | "read",
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [matchUuid, currentUserId]);
}
