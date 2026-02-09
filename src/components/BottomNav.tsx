import { useLocation, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Compass, Eye, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useWaltzStore } from "../context/WaltzStore";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { nudgesReceived, crushesReceived, matches } = useWaltzStore();

  const unseenNudges = nudgesReceived.filter((n) => !n.seen).length;
  const unrevealedCrushes = crushesReceived.filter((c) => !c.revealed).length;
  const totalUnread = matches.reduce((sum, m) => sum + m.unread, 0);

  const NAV_ITEMS = [
    { path: "/discover", icon: Compass, label: "Discover", badge: 0 },
    { path: "/matches", icon: Heart, label: "Matches", badge: 0 },
    { path: "/whispers", icon: MessageCircle, label: "Whispers", badge: unseenNudges + totalUnread },
    { path: "/crushes", icon: Eye, label: "Crushes", badge: unrevealedCrushes },
    { path: "/wrapped", icon: BarChart3, label: "Wrapped", badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/30 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 sm:py-2 px-1 sm:px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-2xl transition-colors min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "hsl(var(--blossom) / 0.1)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    isActive ? "text-blossom" : "text-muted-foreground"
                  }`}
                  fill={isActive && item.icon === Heart ? "currentColor" : "none"}
                />
                {item.badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-primary-foreground z-20"
                    style={{ background: "linear-gradient(135deg, hsl(var(--blossom)), hsl(var(--glow)))" }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-body relative z-10 transition-colors ${
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
