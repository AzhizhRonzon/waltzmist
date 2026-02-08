import { motion } from "framer-motion";

const SkeletonCard = () => (
  <div className="glass-strong rounded-3xl overflow-hidden h-full flex flex-col animate-pulse">
    <div className="h-[55%] bg-secondary/30" />
    <div className="flex-1 p-5 space-y-3">
      <div className="h-4 bg-secondary/30 rounded-full w-3/4" />
      <div className="h-3 bg-secondary/20 rounded-full w-1/2" />
      <div className="glass rounded-2xl p-3 space-y-2">
        <div className="h-3 bg-secondary/20 rounded-full w-1/3" />
        <div className="h-3 bg-secondary/20 rounded-full w-full" />
      </div>
      <div className="h-2 bg-secondary/20 rounded-full w-full" />
      <div className="grid grid-cols-2 gap-2">
        <div className="glass rounded-2xl p-3 h-16" />
        <div className="glass rounded-2xl p-3 h-16" />
      </div>
    </div>
  </div>
);

export const SkeletonMatchCard = () => (
  <div className="glass rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[3/4] bg-secondary/30" />
  </div>
);

export const SkeletonChatItem = () => (
  <div className="glass rounded-2xl p-4 flex items-center gap-3 animate-pulse">
    <div className="w-14 h-14 rounded-full bg-secondary/30 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-secondary/30 rounded-full w-1/3" />
      <div className="h-3 bg-secondary/20 rounded-full w-2/3" />
    </div>
  </div>
);

export const SkeletonMessage = () => (
  <div className="flex justify-start mb-2 animate-pulse">
    <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-secondary/20 space-y-1">
      <div className="h-3 bg-secondary/30 rounded-full w-40" />
      <div className="h-3 bg-secondary/30 rounded-full w-24" />
    </div>
  </div>
);

export default SkeletonCard;
