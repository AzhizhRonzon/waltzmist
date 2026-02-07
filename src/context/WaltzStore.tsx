import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────
export interface ProfileData {
  id: string;
  name: string;
  batch: string;
  section: string;
  photos: string[];
  maggiMetric: number;
  favoriteTrip: string;
  partySpot: string;
  redFlag?: string;
  compatibility: number;
  isOnline?: boolean;
}

export interface MatchData {
  id: string;
  profile: ProfileData;
  matchedAt: Date;
  lastMessage?: string;
  lastMessageTime?: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: "sent" | "read";
}

export interface NudgeData {
  id: string;
  fromId: string;
  toId: string;
  message: string;
  sentAt: Date;
  seen: boolean;
}

export interface CrushData {
  id: string;
  fromId: string;
  toId: string;
  hint: string;
  sentAt: Date;
  guessesLeft: number;
  revealed: boolean;
}

export interface ReportData {
  id: string;
  reportedId: string;
  reason: string;
  timestamp: Date;
}

export const NUDGE_PRESETS = [
  "I saw you in the library and you weren't even studying.",
  "Your playlist is probably better than mine.",
  "Is it too late to ask for a Waltz partner?",
  "I promise not to talk about the economy.",
];

export const CRUSH_HINTS = [
  "Someone from your batch",
  "Someone from a different section",
  "We've worked together once",
  "You know me from the mess",
  "We have a mutual friend",
];

// ─── Mock Profile Pool ──────────────────────────────────────────
export const ALL_PROFILES: ProfileData[] = [
  {
    id: "p1", name: "Ananya", batch: "PGP25", section: "3",
    photos: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop"],
    maggiMetric: 75, favoriteTrip: "Dawki Crystal Waters", partySpot: "Cloud 9",
    redFlag: "finance is a personality trait", compatibility: 88, isOnline: true,
  },
  {
    id: "p2", name: "Rohan", batch: "PGP24", section: "1",
    photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"],
    maggiMetric: 30, favoriteTrip: "Nongriat Trek", partySpot: "ML 05 Café",
    redFlag: "we should network at the prom", compatibility: 72, isOnline: false,
  },
  {
    id: "p3", name: "Priya", batch: "PGP25", section: "5",
    photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop"],
    maggiMetric: 90, favoriteTrip: "Mawlynnong Village", partySpot: "The Terrace",
    redFlag: "PowerPoint is an art form", compatibility: 94, isOnline: true,
  },
  {
    id: "p4", name: "Arjun", batch: "PGPEx", section: "2",
    photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop"],
    maggiMetric: 55, favoriteTrip: "Laitlum Canyons", partySpot: "Déjà Vu",
    compatibility: 65, isOnline: false,
  },
  {
    id: "p5", name: "Meera", batch: "PGP25", section: "4",
    photos: ["https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop"],
    maggiMetric: 82, favoriteTrip: "Sohra Waterfall", partySpot: "Café Shillong",
    redFlag: "morning runs are self-care", compatibility: 79, isOnline: true,
  },
  {
    id: "p6", name: "Karan", batch: "IPM", section: "1",
    photos: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop"],
    maggiMetric: 45, favoriteTrip: "Umiam Lake", partySpot: "Platinum Lounge",
    redFlag: "hustle culture is a lifestyle", compatibility: 61, isOnline: false,
  },
  {
    id: "p7", name: "Diya", batch: "PGP24", section: "6",
    photos: ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop"],
    maggiMetric: 68, favoriteTrip: "Double Decker Bridge", partySpot: "Dylan's Café",
    redFlag: "astrology is real science", compatibility: 83, isOnline: true,
  },
  {
    id: "p8", name: "Vikram", batch: "PGPEx", section: "3",
    photos: ["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop"],
    maggiMetric: 35, favoriteTrip: "Police Bazaar at night", partySpot: "Cloud 9",
    compatibility: 58, isOnline: false,
  },
];

// ─── Mock Conversations ─────────────────────────────────────────
const INITIAL_CONVERSATIONS: Record<string, ChatMessage[]> = {
  p1: [
    { id: "c1", senderId: "p1", text: "Hey! I saw your Maggi Metric was through the roof 😄", timestamp: new Date(Date.now() - 1000 * 60 * 30), status: "read" },
    { id: "c2", senderId: "me", text: "Haha guilty as charged. 2 AM philosophy sessions are my thing", timestamp: new Date(Date.now() - 1000 * 60 * 25), status: "read" },
    { id: "c3", senderId: "p1", text: "Perfect. I need someone to debate whether Maggi is better with cheese or without", timestamp: new Date(Date.now() - 1000 * 60 * 10), status: "read" },
    { id: "c4", senderId: "me", text: "Without, obviously. Cheese is for pizzas, not Maggi 🍕", timestamp: new Date(Date.now() - 1000 * 60 * 5), status: "read" },
    { id: "c5", senderId: "p1", text: "See you at the Waltz? 🌸", timestamp: new Date(Date.now() - 1000 * 60 * 2), status: "sent" },
  ],
  p3: [
    { id: "c7", senderId: "me", text: "I saw your red flag and I have to say… PowerPoint IS an art form", timestamp: new Date(Date.now() - 1000 * 60 * 90), status: "read" },
    { id: "c8", senderId: "p3", text: "FINALLY someone gets it! Custom animations, colour theory, the whole nine yards", timestamp: new Date(Date.now() - 1000 * 60 * 80), status: "read" },
    { id: "c9", senderId: "p3", text: "Your playlist is probably better than mine", timestamp: new Date(Date.now() - 1000 * 60 * 60), status: "read" },
  ],
};

// ─── Stats for Heat Meter ────────────────────────────────────────
export const HEAT_STATS = {
  mostActiveProgram: "PGP25",
  busiestHour: "11 PM",
  promPactCount: 47,
  totalSwipes: 1284,
  matchRate: "34%",
  topPrompt: "finance is a personality trait",
};

// ─── Context Interface ───────────────────────────────────────────
interface WaltzStoreContextType {
  // Auth & Profile
  isLoggedIn: boolean;
  hasProfile: boolean;
  myProfile: ProfileData | null;
  login: () => void;
  completeProfile: (data: Partial<ProfileData>) => void;

  // Discovery
  discoverQueue: ProfileData[];
  swipeLeft: (profileId: string) => void;
  swipeRight: (profileId: string) => void;

  // Matches
  matches: MatchData[];
  conversations: Record<string, ChatMessage[]>;
  sendMessage: (matchId: string, text: string) => void;

  // Nudges
  nudgesSent: NudgeData[];
  nudgesReceived: NudgeData[];
  canNudgeToday: boolean;
  sendNudge: (toId: string, message: string) => void;
  markNudgeSeen: (nudgeId: string) => void;

  // Crushes
  crushesSent: CrushData[];
  crushesReceived: CrushData[];
  sendCrush: (toId: string, hint: string) => boolean;
  guessCrush: (crushId: string, guessId: string) => boolean;

  // Reports
  reportUser: (userId: string, reason: string) => void;

  // Stats
  getWrappedStats: () => { matchCount: number; crushesSent: number; crushesReceived: number; topPrompt: string };
}

const WaltzStoreContext = createContext<WaltzStoreContextType | null>(null);

export const useWaltzStore = () => {
  const ctx = useContext(WaltzStoreContext);
  if (!ctx) throw new Error("useWaltzStore must be used within WaltzStoreProvider");
  return ctx;
};

// ─── Provider ────────────────────────────────────────────────────
export const WaltzStoreProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);

  // Discovery: use profiles not yet matched/swiped
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set(["p1", "p3"])); // pre-matched for demo

  const [matches, setMatches] = useState<MatchData[]>([
    {
      id: "p1", profile: ALL_PROFILES[0], matchedAt: new Date(Date.now() - 1000 * 60 * 60),
      lastMessage: "See you at the Waltz? 🌸", lastMessageTime: "2m ago", unread: 1,
    },
    {
      id: "p3", profile: ALL_PROFILES[2], matchedAt: new Date(Date.now() - 1000 * 60 * 120),
      lastMessage: "Your playlist is probably better than mine", lastMessageTime: "1h ago", unread: 0,
    },
    {
      id: "p4", profile: ALL_PROFILES[3], matchedAt: new Date(Date.now() - 1000 * 60 * 180),
      lastMessage: "", lastMessageTime: "", unread: 0,
    },
  ]);

  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(INITIAL_CONVERSATIONS);

  // Nudges
  const [nudgesSent, setNudgesSent] = useState<NudgeData[]>([]);
  const [nudgesReceived, setNudgesReceived] = useState<NudgeData[]>([
    { id: "nr1", fromId: "p5", toId: "me", message: NUDGE_PRESETS[1], sentAt: new Date(Date.now() - 1000 * 60 * 45), seen: false },
  ]);

  const canNudgeToday = !nudgesSent.some((n) => {
    const today = new Date();
    const sent = new Date(n.sentAt);
    return sent.toDateString() === today.toDateString();
  });

  // Crushes
  const [crushesSent, setCrushesSent] = useState<CrushData[]>([]);
  const [crushesReceived, setCrushesReceived] = useState<CrushData[]>([
    { id: "cr1", fromId: "p7", toId: "me", hint: "Someone from a different section", sentAt: new Date(Date.now() - 1000 * 60 * 120), guessesLeft: 3, revealed: false },
  ]);

  const [reports, setReports] = useState<ReportData[]>([]);

  // ── Auth ──
  const login = useCallback(() => setIsLoggedIn(true), []);
  const completeProfile = useCallback((data: Partial<ProfileData>) => {
    setMyProfile({
      id: "me",
      name: data.name || "You",
      batch: data.batch || "PGP25",
      section: data.section || "3",
      photos: [],
      maggiMetric: data.maggiMetric || 50,
      favoriteTrip: data.favoriteTrip || "",
      partySpot: data.partySpot || "",
      redFlag: data.redFlag,
      compatibility: 100,
    });
    setHasProfile(true);
  }, []);

  // ── Discovery ──
  const discoverQueue = ALL_PROFILES.filter(
    (p) => !swipedIds.has(p.id) && !matchedIds.has(p.id)
  );

  const swipeLeft = useCallback((profileId: string) => {
    setSwipedIds((prev) => new Set(prev).add(profileId));
  }, []);

  const swipeRight = useCallback((profileId: string) => {
    setSwipedIds((prev) => new Set(prev).add(profileId));
    const profile = ALL_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;

    // 40% match chance for demo
    if (Math.random() < 0.4) {
      setMatchedIds((prev) => new Set(prev).add(profileId));
      setMatches((prev) => [
        {
          id: profileId,
          profile,
          matchedAt: new Date(),
          lastMessage: "",
          lastMessageTime: "",
          unread: 0,
        },
        ...prev,
      ]);
      return true;
    }
    return false;
  }, []);

  // ── Chat ──
  const sendMessage = useCallback((matchId: string, text: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "me",
      text,
      timestamp: new Date(),
      status: "sent",
    };
    setConversations((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), msg],
    }));
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, lastMessage: text, lastMessageTime: "Just now", unread: 0 }
          : m
      )
    );
  }, []);

  // ── Nudges ──
  const sendNudge = useCallback((toId: string, message: string) => {
    const nudge: NudgeData = {
      id: `nudge-${Date.now()}`,
      fromId: "me",
      toId,
      message,
      sentAt: new Date(),
      seen: false,
    };
    setNudgesSent((prev) => [...prev, nudge]);
  }, []);

  const markNudgeSeen = useCallback((nudgeId: string) => {
    setNudgesReceived((prev) =>
      prev.map((n) => (n.id === nudgeId ? { ...n, seen: true } : n))
    );
  }, []);

  // ── Crushes ──
  const sendCrush = useCallback((toId: string, hint: string): boolean => {
    if (crushesSent.length >= 3) return false;
    const crush: CrushData = {
      id: `crush-${Date.now()}`,
      fromId: "me",
      toId,
      hint,
      sentAt: new Date(),
      guessesLeft: 3,
      revealed: false,
    };
    setCrushesSent((prev) => [...prev, crush]);
    return true;
  }, [crushesSent.length]);

  const guessCrush = useCallback((crushId: string, guessId: string): boolean => {
    let correct = false;
    setCrushesReceived((prev) =>
      prev.map((c) => {
        if (c.id !== crushId) return c;
        if (c.guessesLeft <= 0) return c;
        if (guessId === c.fromId) {
          correct = true;
          return { ...c, revealed: true, guessesLeft: 0 };
        }
        return { ...c, guessesLeft: c.guessesLeft - 1 };
      })
    );
    return correct;
  }, []);

  // ── Report ──
  const reportUser = useCallback((userId: string, reason: string) => {
    setReports((prev) => [...prev, { id: `rep-${Date.now()}`, reportedId: userId, reason, timestamp: new Date() }]);
  }, []);

  // ── Wrapped Stats ──
  const getWrappedStats = useCallback(() => ({
    matchCount: matches.length,
    crushesSent: crushesSent.length,
    crushesReceived: crushesReceived.length,
    topPrompt: HEAT_STATS.topPrompt,
  }), [matches.length, crushesSent.length, crushesReceived.length]);

  return (
    <WaltzStoreContext.Provider
      value={{
        isLoggedIn, hasProfile, myProfile, login, completeProfile,
        discoverQueue, swipeLeft, swipeRight,
        matches, conversations, sendMessage,
        nudgesSent, nudgesReceived, canNudgeToday, sendNudge, markNudgeSeen,
        crushesSent, crushesReceived, sendCrush, guessCrush,
        reportUser,
        getWrappedStats,
      }}
    >
      {children}
    </WaltzStoreContext.Provider>
  );
};
