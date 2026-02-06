import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import ChatBubble from "../components/ChatBubble";
import CountdownTimer from "../components/CountdownTimer";
import FallingPetals from "../components/FallingPetals";
import { MOCK_MATCHES, MOCK_CONVERSATIONS, ChatMessage } from "../data/mockChat";

const ChatPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const match = MOCK_MATCHES.find((m) => m.id === matchId);

  useEffect(() => {
    if (matchId && MOCK_CONVERSATIONS[matchId]) {
      setMessages([...MOCK_CONVERSATIONS[matchId]]);
    }
  }, [matchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!match) {
    navigate("/whispers");
    return null;
  }

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const msg: ChatMessage = {
      id: `new-${Date.now()}`,
      senderId: "me",
      text: trimmed,
      timestamp: new Date(),
      status: "sent",
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen breathing-bg flex flex-col relative">
      <FallingPetals count={6} />

      {/* Chat Header */}
      <header className="relative z-20 glass-strong border-b border-border/20">
        {/* Countdown bar */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">
              Waltz Night in
            </span>
            <CountdownTimer />
          </div>
        </div>

        {/* Profile bar */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/whispers")}
            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <div className="relative">
            <img
              src={match.photo}
              alt={match.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-blossom/30"
            />
            {match.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background"
                style={{ background: "hsl(140 70% 50%)" }}
              />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-display text-lg text-foreground leading-tight">
              {match.name}
            </h3>
            <p className="text-[11px] text-muted-foreground font-body">
              {match.batch} {match.isOnline ? "· Online" : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 relative z-10"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-5xl mb-4">🌸</div>
              <h3 className="font-display text-xl text-foreground mb-2">
                New Match!
              </h3>
              <p className="text-muted-foreground font-body text-sm max-w-[250px]">
                Don't just stare. <br />
                Say something risky.
              </p>
            </motion.div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === "me"}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="relative z-20 px-4 pb-6 pt-2">
        <div className="glass-strong rounded-full flex items-center gap-2 px-4 py-2 blossom-glow">
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
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2 rounded-full transition-all disabled:opacity-30"
            style={{
              background: newMessage.trim()
                ? "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))"
                : "transparent",
            }}
          >
            <Send
              className={`w-4 h-4 ${
                newMessage.trim() ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
