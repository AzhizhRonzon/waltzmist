import { useLocation, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Compass, User } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/discover", icon: Compass, label: "Discover" },
  { path: "/matches", icon: Heart, label: "Matches" },
  { path: "/whispers", icon: MessageCircle, label: "Whispers" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/30">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "hsl(var(--blossom) / 0.1)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? "text-blossom" : "text-muted-foreground"
                }`}
                fill={isActive && item.icon === Heart ? "currentColor" : "none"}
              />
              <span
                className={`text-[10px] font-body relative z-10 transition-colors ${
                  isActive ? "text-blossom font-semibold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
