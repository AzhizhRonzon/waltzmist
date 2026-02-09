import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Lightbulb, MoreVertical, Flag, Ban, UserX, ChevronUp, Loader2 } from "lucide-react";
import ChatBubble from "../components/ChatBubble";
import CountdownTimer from "../components/CountdownTimer";
import FallingPetals from "../components/FallingPetals";
import ReportModal from "../components/ReportModal";
import VoiceRecorder from "../components/VoiceRecorder";
import { SkeletonMessage } from "../components/Skeletons";
import { useWaltzStore, ChatMessage } from "../context/WaltzStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRealtimeChat } from "../hooks/useRealtimeChat";
import { getIcebreakers } from "../lib/icebreakers";
import { playMessageSentSound } from "../lib/sounds";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ChatPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { session, myProfile, matches, conversations, sendMessage, loadConversation, loadMoreMessages, markMessagesRead, reportUser, blockUser, unmatchUser, dataLoading, hasMoreMessages } = useWaltzStore();
  const [newMessage, setNewMessage] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "unmatch"; id: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const match = matches.find((m) => m.id === matchId);
  const messages = matchId ? conversations[matchId] || [] : [];
  const icebreakers = match ? getIcebreakers(myProfile, match.profile) : [];
  const canLoadMore = matchId ? hasMoreMessages[matchId] ?? false : false;

  useEffect(() => {
    if (matchId) {
      setChatLoading(true);
      loadConversation(matchId).then(() => setChatLoading(false));
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId && messages.length > 0) {
      markMessagesRead(matchId);
    }
  }, [matchId, messages.length]);

  const handleRealtimeMessage = useCallback((msg: ChatMessage) => {
    if (matchId) loadConversation(matchId);
  }, [matchId, loadConversation]);

  useRealtimeChat({
    matchUuid: match?.matchUuid,
    currentUserId: session?.user?.id,
    onNewMessage: handleRealtimeMessage,
  });

  useEffect(() => {
    if (scrollRef.current && !loadingMore) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleLoadMore = async () => {
    if (!matchId || loadingMore) return;
    const scrollEl = scrollRef.current;
    const prevHeight = scrollEl?.scrollHeight || 0;

    setLoadingMore(true);
    await loadMoreMessages(matchId);
    setLoadingMore(false);

    // Maintain scroll position after prepending older messages
    if (scrollEl) {
      requestAnimationFrame(() => {
        scrollEl.scrollTop = scrollEl.scrollHeight - prevHeight;
      });
    }
  };

  if (!match && !dataLoading) {
    return (
      <div className="min-h-screen breathing-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🥀</div>
          <h2 className="font-display text-xl text-foreground mb-2">Match Not Found</h2>
          <p className="text-muted-foreground font-body text-sm mb-4">This match may have been removed.</p>
          <button onClick={() => navigate("/whispers")} className="btn-waltz">Back to Whispers</button>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !matchId) return;
    setNewMessage("");
    playMessageSentSound();
    await sendMessage(matchId, trimmed);
    inputRef.current?.focus();
  };

  const handleVoiceSend = async (audioUrl: string) => {
    if (!matchId) return;
    playMessageSentSound();
    await sendMessage(matchId, "🎤 Voice note", audioUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "block") {
      await blockUser(confirmAction.id);
    } else {
      await unmatchUser(confirmAction.id);
    }
    setConfirmAction(null);
    navigate("/whispers");
  };

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative">
      <FallingPetals count={4} />

      <header className="relative z-20 glass-strong border-b border-border/20">
        <div className="px-4 pt-3 pb-2 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">Waltz Night in</span>
            <CountdownTimer />
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-3">
          <button onClick={() => navigate("/whispers")} className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="relative">
            <img src={match?.profile.photos[0] || ""} alt={match?.profile.name} className="w-10 h-10 rounded-full object-cover border-2 border-blossom/30" loading="lazy" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-foreground leading-tight">{match?.profile.name}</h3>
            <p className="text-[11px] text-muted-foreground font-body">{match?.profile.batch}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-border/30">
              <DropdownMenuItem onClick={() => setShowReport(true)} className="text-foreground font-body text-sm">
                <Flag className="w-4 h-4 mr-2" />Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => match && setConfirmAction({ type: "block", id: match.id, name: match.profile.name })}
                className="text-maroon font-body text-sm"
              >
                <Ban className="w-4 h-4 mr-2" />Block
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => match && setConfirmAction({ type: "unmatch", id: match.matchUuid, name: match.profile.name })}
                className="text-muted-foreground font-body text-sm"
              >
                <UserX className="w-4 h-4 mr-2" />Unmatch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
        {/* Load more button */}
        {canLoadMore && !chatLoading && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="glass rounded-full px-4 py-1.5 text-xs font-body text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
              {loadingMore ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}

        {chatLoading ? (
          <div className="space-y-3 py-4">
            <SkeletonMessage /><SkeletonMessage /><SkeletonMessage />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <div className="text-5xl mb-4">🌸</div>
              <h3 className="font-display text-xl text-foreground mb-2">New Match!</h3>
              <p className="text-muted-foreground font-body text-sm max-w-[250px]">Don't just stare.<br />Say something risky.</p>
              {icebreakers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] text-blossom uppercase tracking-widest font-body">Try saying...</p>
                  {icebreakers.slice(0, 2).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setNewMessage(prompt)}
                      className="block w-full text-left glass rounded-xl px-3 py-2 text-xs text-foreground font-body hover:border-blossom/20 border border-transparent transition-colors"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId !== match?.profile.id} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Icebreaker toggle */}
      <AnimatePresence>
        {showIcebreakers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-20 px-4 overflow-hidden"
          >
            <div className="glass rounded-2xl p-3 mb-2 space-y-1.5">
              <p className="text-[10px] text-blossom uppercase tracking-widest font-body">Icebreakers 💡</p>
              {icebreakers.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setNewMessage(prompt); setShowIcebreakers(false); }}
                  className="block w-full text-left px-3 py-2 rounded-xl text-xs text-foreground font-body hover:bg-blossom/5 transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 px-4 pb-6 pt-2">
        <div className="glass-strong rounded-full flex items-center gap-2 px-4 py-2 blossom-glow">
          <button onClick={() => setShowIcebreakers(!showIcebreakers)} className="p-1 rounded-full hover:bg-secondary/50 transition-colors">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something risky..."
            className="flex-1 bg-transparent text-foreground font-body text-sm placeholder:text-muted-foreground/40 focus:outline-none py-1.5"
            maxLength={500}
          />
          {session?.user && match && (
            <VoiceRecorder userId={session.user.id} matchUuid={match.matchUuid} onSend={handleVoiceSend} />
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2 rounded-full transition-all disabled:opacity-30"
            style={{ background: newMessage.trim() ? "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" : "transparent" }}
          >
            <Send className={`w-4 h-4 ${newMessage.trim() ? "text-primary-foreground" : "text-muted-foreground"}`} />
          </motion.button>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && match && (
          <ReportModal
            targetName={match.profile.name}
            onReport={(reason) => reportUser(match.profile.id, reason)}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>

      {/* Confirm Block/Unmatch Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="glass-strong border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              {confirmAction?.type === "block" ? "Block User?" : "Unmatch?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              {confirmAction?.type === "block"
                ? `Are you sure you want to block ${confirmAction.name}? They won't appear in your feed anymore and you won't be able to message them.`
                : `Are you sure you want to unmatch with ${confirmAction?.name}? This will remove the match and conversation permanently.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirmAction} className="bg-destructive text-destructive-foreground font-body">
              {confirmAction?.type === "block" ? "Block" : "Unmatch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatPage;
