import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

// ─── Types ───────────────────────────────────────────────────────
export interface ProfileData {
  id: string;
  name: string;
  batch: string;
  section: string;
  sex: string;
  age: number;
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
  matchUuid: string;
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

// ─── Constants ───────────────────────────────────────────────────
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

export const HEAT_STATS = {
  mostActiveProgram: "PGP25",
  busiestHour: "11 PM",
  promPactCount: 47,
  totalSwipes: 1284,
  matchRate: "34%",
  topPrompt: "finance is a personality trait",
};

// ─── Helpers ─────────────────────────────────────────────────────
function dbProfileToApp(row: Tables<'profiles'>, compatibility = 50): ProfileData {
  return {
    id: row.id,
    name: row.name,
    batch: row.program,
    section: row.section || "",
    sex: row.sex,
    age: row.age,
    photos: (row.photo_urls && row.photo_urls.length > 0)
      ? row.photo_urls
      : [`https://api.dicebear.com/9.x/avataaars/svg?seed=${row.id}`],
    maggiMetric: row.maggi_metric ?? 50,
    favoriteTrip: row.favorite_trip || "",
    partySpot: row.party_spot || "",
    redFlag: row.red_flag || undefined,
    compatibility,
    isOnline: false,
  };
}

function computeCompat(my: Tables<'profiles'>, other: Tables<'profiles'>): number {
  let s = 50;
  if (my.section && other.section && my.section === other.section) s += 10;
  if (Math.abs((my.maggi_metric ?? 50) - (other.maggi_metric ?? 50)) < 20) s += 15;
  if (my.program === other.program) s += 5;
  if (my.sex !== other.sex) s += 10;
  s += Math.floor(Math.random() * 10);
  return Math.min(s, 99);
}

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Context Interface ──────────────────────────────────────────
interface WaltzStoreContextType {
  session: Session | null;
  isLoggedIn: boolean;
  hasProfile: boolean;
  myProfile: ProfileData | null;
  loading: boolean;

  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  completeProfile: (data: Record<string, any>) => Promise<void>;

  discoverQueue: ProfileData[];
  swipeLeft: (profileId: string) => Promise<void>;
  swipeRight: (profileId: string) => Promise<boolean>;

  matches: MatchData[];
  conversations: Record<string, ChatMessage[]>;
  sendMessage: (profileId: string, text: string) => Promise<void>;
  loadConversation: (profileId: string) => Promise<void>;

  nudgesSent: NudgeData[];
  nudgesReceived: NudgeData[];
  canNudgeToday: boolean;
  sendNudge: (toId: string, message: string) => Promise<void>;
  markNudgeSeen: (nudgeId: string) => Promise<void>;

  crushesSent: CrushData[];
  crushesReceived: CrushData[];
  sendCrush: (toId: string, hint: string) => Promise<boolean>;
  guessCrush: (crushId: string, guessId: string) => Promise<boolean>;

  reportUser: (userId: string, reason: string) => Promise<void>;
  allProfiles: ProfileData[];
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProfileRow, setMyProfileRow] = useState<Tables<'profiles'> | null>(null);
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [allProfileRows, setAllProfileRows] = useState<Tables<'profiles'>[]>([]);
  const [discoverQueue, setDiscoverQueue] = useState<ProfileData[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [nudgesSent, setNudgesSent] = useState<NudgeData[]>([]);
  const [nudgesReceived, setNudgesReceived] = useState<NudgeData[]>([]);
  const [crushesSent, setCrushesSent] = useState<CrushData[]>([]);
  const [crushesReceived, setCrushesReceived] = useState<CrushData[]>([]);

  const matchesRef = useRef<MatchData[]>([]);
  useEffect(() => { matchesRef.current = matches; }, [matches]);

  const isLoggedIn = !!session?.user;
  const hasProfile = !!myProfile;

  const canNudgeToday = !nudgesSent.some(n => n.sentAt.toDateString() === new Date().toDateString());

  const allProfiles = allProfileRows
    .filter(p => p.id !== session?.user?.id && !p.is_shadow_banned)
    .map(p => dbProfileToApp(p));

  // ── Auth listener ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch data when session changes ──
  useEffect(() => {
    if (session?.user) {
      fetchAllData(session.user.id);
    } else {
      resetData();
    }
  }, [session?.user?.id]);

  const resetData = () => {
    setMyProfileRow(null);
    setMyProfile(null);
    setAllProfileRows([]);
    setDiscoverQueue([]);
    setMatches([]);
    setConversations({});
    setNudgesSent([]);
    setNudgesReceived([]);
    setCrushesSent([]);
    setCrushesReceived([]);
  };

  const fetchAllData = async (userId: string) => {
    const [profileRes, allProfilesRes, swipesRes, matchesRes, nudgeSentRes, nudgeRecvRes, crushSentRes, crushRecvRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("profiles").select("*").eq("is_shadow_banned", false),
      supabase.from("swipes").select("swiped_id").eq("swiper_id", userId),
      supabase.from("matches").select("*").or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase.from("nudges").select("*").eq("sender_id", userId),
      supabase.from("nudges").select("*").eq("receiver_id", userId),
      supabase.from("crushes").select("*").eq("sender_id", userId),
      supabase.from("crushes").select("*").eq("receiver_id", userId),
    ]);

    const profileRow = profileRes.data;
    setMyProfileRow(profileRow);
    setMyProfile(profileRow ? dbProfileToApp(profileRow, 100) : null);

    const allRows = allProfilesRes.data || [];
    setAllProfileRows(allRows);

    // Discovery queue
    const swipedIds = new Set((swipesRes.data || []).map(s => s.swiped_id));
    const queue = allRows
      .filter(p => p.id !== userId && !swipedIds.has(p.id))
      .map(p => dbProfileToApp(p, profileRow ? computeCompat(profileRow, p) : 50));
    setDiscoverQueue(queue);

    // Matches
    const matchRows = matchesRes.data || [];
    if (matchRows.length > 0) {
      const otherIds = matchRows.map(m => m.user1_id === userId ? m.user2_id : m.user1_id);
      const { data: matchProfiles } = await supabase.from("profiles").select("*").in("id", otherIds);
      const { data: allMsgs } = await supabase.from("messages").select("*").in("match_id", matchRows.map(m => m.id)).order("created_at", { ascending: false });

      const md: MatchData[] = matchRows.map(m => {
        const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
        const prof = (matchProfiles || []).find(p => p.id === otherId);
        const msgs = (allMsgs || []).filter(msg => msg.match_id === m.id);
        const latest = msgs[0];
        const unread = msgs.filter(msg => msg.sender_id !== userId && msg.status === "sent").length;
        return {
          id: otherId,
          matchUuid: m.id,
          profile: prof ? dbProfileToApp(prof, profileRow ? computeCompat(profileRow, prof) : 50) : dbProfileToApp(profileRow!, 0),
          matchedAt: new Date(m.matched_at),
          lastMessage: latest?.text || "",
          lastMessageTime: latest ? timeAgo(latest.created_at) : "",
          unread,
        };
      });
      setMatches(md);
    } else {
      setMatches([]);
    }

    // Nudges
    setNudgesSent((nudgeSentRes.data || []).map(n => ({ id: n.id, fromId: n.sender_id, toId: n.receiver_id, message: n.message, sentAt: new Date(n.created_at), seen: n.seen ?? false })));
    setNudgesReceived((nudgeRecvRes.data || []).map(n => ({ id: n.id, fromId: n.sender_id, toId: n.receiver_id, message: n.message, sentAt: new Date(n.created_at), seen: n.seen ?? false })));

    // Crushes
    setCrushesSent((crushSentRes.data || []).map(c => ({ id: c.id, fromId: c.sender_id, toId: c.receiver_id, hint: c.hint, sentAt: new Date(c.created_at), guessesLeft: c.guesses_left, revealed: c.revealed ?? false })));
    setCrushesReceived((crushRecvRes.data || []).map(c => ({ id: c.id, fromId: c.sender_id, toId: c.receiver_id, hint: c.hint, sentAt: new Date(c.created_at), guessesLeft: c.guesses_left, revealed: c.revealed ?? false })));
  };

  // ── Auth actions ──
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const completeProfile = async (data: Record<string, any>) => {
    if (!session?.user) return;
    await supabase.from("profiles").insert({
      id: session.user.id,
      email: session.user.email!,
      name: data.name,
      program: data.program,
      section: data.section || null,
      sex: data.sex,
      age: data.age,
      maggi_metric: data.maggiMetric ?? 50,
      favorite_trip: data.favoriteTrip || "",
      party_spot: data.partySpot || "",
      red_flag: data.redFlag || null,
      photo_urls: data.photoUrls && data.photoUrls.length > 0 ? data.photoUrls : null,
    });
    await fetchAllData(session.user.id);
  };

  // ── Swipe ──
  const swipeLeft = async (profileId: string) => {
    if (!session?.user) return;
    await supabase.from("swipes").insert({ swiper_id: session.user.id, swiped_id: profileId, direction: "dislike" });
    setDiscoverQueue(q => q.filter(p => p.id !== profileId));
  };

  const swipeRight = async (profileId: string): Promise<boolean> => {
    if (!session?.user) return false;
    await supabase.from("swipes").insert({ swiper_id: session.user.id, swiped_id: profileId, direction: "like" });
    setDiscoverQueue(q => q.filter(p => p.id !== profileId));

    // Check if mutual match was created by trigger
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${profileId}),and(user1_id.eq.${profileId},user2_id.eq.${session.user.id})`)
      .maybeSingle();

    if (match) {
      await fetchAllData(session.user.id);
      return true;
    }
    return false;
  };

  // ── Chat ──
  const loadConversation = async (profileId: string) => {
    const match = matchesRef.current.find(m => m.id === profileId);
    if (!match) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", match.matchUuid)
      .order("created_at", { ascending: true });

    setConversations(prev => ({
      ...prev,
      [profileId]: (data || []).map(m => ({
        id: m.id,
        senderId: m.sender_id,
        text: m.text,
        timestamp: new Date(m.created_at),
        status: m.status as "sent" | "read",
      })),
    }));
  };

  const sendMessage = async (profileId: string, text: string) => {
    const match = matchesRef.current.find(m => m.id === profileId);
    if (!match || !session?.user) return;
    await supabase.from("messages").insert({
      match_id: match.matchUuid,
      sender_id: session.user.id,
      text,
    });
    await loadConversation(profileId);
    // Update match's last message
    setMatches(prev => prev.map(m =>
      m.id === profileId ? { ...m, lastMessage: text, lastMessageTime: "Just now" } : m
    ));
  };

  // ── Nudges ──
  const sendNudge = async (toId: string, message: string) => {
    if (!session?.user) return;
    await supabase.from("nudges").insert({ sender_id: session.user.id, receiver_id: toId, message });
    setNudgesSent(prev => [...prev, { id: `temp-${Date.now()}`, fromId: session.user!.id, toId, message, sentAt: new Date(), seen: false }]);
  };

  const markNudgeSeen = async (nudgeId: string) => {
    await supabase.from("nudges").update({ seen: true }).eq("id", nudgeId);
    setNudgesReceived(prev => prev.map(n => n.id === nudgeId ? { ...n, seen: true } : n));
  };

  // ── Crushes ──
  const sendCrush = async (toId: string, hint: string): Promise<boolean> => {
    if (!session?.user || crushesSent.length >= 3) return false;
    const { error } = await supabase.from("crushes").insert({ sender_id: session.user.id, receiver_id: toId, hint });
    if (error) return false;
    setCrushesSent(prev => [...prev, { id: `temp-${Date.now()}`, fromId: session.user!.id, toId, hint, sentAt: new Date(), guessesLeft: 3, revealed: false }]);
    return true;
  };

  const guessCrush = async (crushId: string, guessId: string): Promise<boolean> => {
    const crush = crushesReceived.find(c => c.id === crushId);
    if (!crush || crush.guessesLeft <= 0) return false;
    const correct = guessId === crush.fromId;
    if (correct) {
      await supabase.from("crushes").update({ revealed: true, guesses_left: 0 }).eq("id", crushId);
    } else {
      await supabase.from("crushes").update({ guesses_left: crush.guessesLeft - 1 }).eq("id", crushId);
    }
    setCrushesReceived(prev => prev.map(c => {
      if (c.id !== crushId) return c;
      return correct ? { ...c, revealed: true, guessesLeft: 0 } : { ...c, guessesLeft: c.guessesLeft - 1 };
    }));
    return correct;
  };

  // ── Reports ──
  const reportUser = async (userId: string, reason: string) => {
    if (!session?.user) return;
    await supabase.from("reports").insert({ reporter_id: session.user.id, reported_id: userId, reason });
  };

  // ── Stats ──
  const getWrappedStats = useCallback(() => ({
    matchCount: matches.length,
    crushesSent: crushesSent.length,
    crushesReceived: crushesReceived.length,
    topPrompt: HEAT_STATS.topPrompt,
  }), [matches.length, crushesSent.length, crushesReceived.length]);

  return (
    <WaltzStoreContext.Provider
      value={{
        session, isLoggedIn, hasProfile, myProfile, loading,
        signUp, signIn, signOut, completeProfile,
        discoverQueue, swipeLeft, swipeRight,
        matches, conversations, sendMessage, loadConversation,
        nudgesSent, nudgesReceived, canNudgeToday, sendNudge, markNudgeSeen,
        crushesSent, crushesReceived, sendCrush, guessCrush,
        reportUser, allProfiles, getWrappedStats,
      }}
    >
      {children}
    </WaltzStoreContext.Provider>
  );
};
