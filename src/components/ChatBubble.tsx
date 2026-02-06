import { motion } from "framer-motion";
import { ChatMessage } from "../data/mockChat";

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const PetalReceipt = ({ status }: { status: "sent" | "read" }) => (
  <span className="inline-flex items-center gap-0.5 ml-1.5">
    <span className="text-xs" style={{ fontSize: "10px" }}>🌸</span>
    {status === "read" && (
      <span className="text-xs" style={{ fontSize: "10px" }}>🌸</span>
    )}
  </span>
);

const ChatBubble = ({ message, isOwn }: ChatBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
    >
      <div
        className={`max-w-[80%] px-4 py-2.5 font-body text-sm leading-relaxed ${
          isOwn
            ? "rounded-[20px_20px_4px_20px]"
            : "rounded-[20px_20px_20px_4px]"
        }`}
        style={{
          background: isOwn
            ? "linear-gradient(135deg, hsl(var(--blossom) / 0.2), hsl(var(--glow) / 0.15))"
            : "hsl(var(--glass-bg) / 0.8)",
          border: isOwn
            ? "1px solid hsl(var(--blossom) / 0.2)"
            : "1px solid hsl(var(--glass-border) / 0.2)",
        }}
      >
        <p className={isOwn ? "text-blossom-soft" : "text-foreground"}>
          {message.text}
        </p>
        <div
          className={`flex items-center gap-0.5 mt-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {isOwn && <PetalReceipt status={message.status} />}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
