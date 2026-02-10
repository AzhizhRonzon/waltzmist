import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
  audioUrl?: string;
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

export interface CampusStats {
  totalSwipes: number;
  totalMatches: number;
  totalNudges: number;
  mostActiveProgram: string;
  matchRate: number;
  busiestHour: number | null;
  topRedFlag: string;
  promPactCount: number;
}

export interface SecretAdmirerHint {
  program: string;
  section: string | null;
  photo_hash: string;
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

// ─── Constants ──────────────────────────────────────────────────
const DAILY_SWIPE_LIMIT = 50;
const CHAT_PAGE_SIZE = 30;

// ─── Context Interface ──────────────────────────────────────────
interface WaltzStoreContextType {
  session: Session | null;
  isLoggedIn: boolean;
  hasProfile: boolean;
  myProfile: ProfileData | null;
  loading: boolean;
  dataLoading: boolean;

  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  
  completeProfile: (data: Record<string, any>) => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<void>;

  discoverQueue: ProfileData[];
  swipeLeft: (profileId: string) => Promise<void>;
  swipeRight: (profileId: string) => Promise<boolean>;
  swipesRemaining: number;

  matches: MatchData[];
  conversations: Record<string, ChatMessage[]>;
  sendMessage: (profileId: string, text: string, audioUrl?: string) => Promise<void>;
  loadConversation: (profileId: string) => Promise<void>;
  loadMoreMessages: (profileId: string) => Promise<boolean>;
  markMessagesRead: (profileId: string) => Promise<void>;
  hasMoreMessages: Record<string, boolean>;

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
  blockUser: (userId: string) => Promise<void>;
  unmatchUser: (matchUuid: string) => Promise<void>;
  blockedIds: string[];
  allProfiles: ProfileData[];

  campusStats: CampusStats | null;
  secretAdmirerCount: number;
  secretAdmirerHints: SecretAdmirerHint[];
  fetchCampusStats: () => Promise<void>;
  fetchSecretAdmirers: () => Promise<void>;

  getWrappedStats: () => {
    matchCount: number;
    crushesSent: number;
    crushesReceived: number;
    topPrompt: string;
    totalSwipes: number;
    nudgesSent: number;
    nudgesReceived: number;
  };
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
  const [dataLoading, setDataLoading] = useState(true);
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
  const [campusStats, setCampusStats] = useState<CampusStats | null>(null);
  const [secretAdmirerCount, setSecretAdmirerCount] = useState(0);
  const [secretAdmirerHints, setSecretAdmirerHints] = useState<SecretAdmirerHint[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [swipesToday, setSwipesToday] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});

  const matchesRef = useRef<MatchData[]>([]);
  useEffect(() => { matchesRef.current = matches; }, [matches]);

  const isLoggedIn = !!session?.user;
  const hasProfile = !!myProfile;
  const canNudgeToday = !nudgesSent.some(n => n.sentAt.toDateString() === new Date().toDateString());
  const swipesRemaining = Math.max(0, DAILY_SWIPE_LIMIT - swipesToday);

  const allProfiles = allProfileRows
    .filter(p => p.id !== session?.user?.id && !p.is_shadow_banned && !blockedIds.includes(p.id))
    .map(p => dbProfileToApp(p));

  // ── Auth listener ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setLoading(false);
      if (!sess) setDataLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchAllData(session.user.id);
    } else {
      resetData();
      setDataLoading(false);
    }
  }, [session?.user?.id]);

  // ── Realtime notifications ──
  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, (payload) => {
        const m = payload.new as any;
        if (m.user1_id === userId || m.user2_id === userId) {
          toast({ title: "🌸 New Match!", description: "Someone vibed with you!" });
          setTimeout(() => fetchAllData(userId), 0);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== userId) {
          toast({ title: "💌 New Message", description: "Someone sent you a whisper!" });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    setCampusStats(null);
    setSecretAdmirerCount(0);
    setSecretAdmirerHints([]);
    setBlockedIds([]);
  };

  const fetchAllData = async (userId: string) => {
    setDataLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [profileRes, allProfilesRes, swipesRes, matchesRes, nudgeSentRes, nudgeRecvRes, crushSentRes, crushRecvRes, blocksRes, todaySwipesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("profiles").select("*").eq("is_shadow_banned", false),
        supabase.from("swipes").select("swiped_id").eq("swiper_id", userId),
        supabase.from("matches").select("*").or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
        supabase.from("nudges").select("*").eq("sender_id", userId),
        supabase.from("nudges").select("*").eq("receiver_id", userId),
        supabase.from("crushes").select("*").eq("sender_id", userId),
        supabase.from("crushes").select("*").eq("receiver_id", userId),
        (supabase as any).from("blocks").select("blocked_id").eq("blocker_id", userId),
        supabase.from("swipes").select("id", { count: "exact", head: true }).eq("swiper_id", userId).gte("created_at", todayStart.toISOString()),
      ]);

      const profileRow = profileRes.data;
      setMyProfileRow(profileRow);
      setMyProfile(profileRow ? dbProfileToApp(profileRow, 100) : null);

      const allRows = allProfilesRes.data || [];
      setAllProfileRows(allRows);

      const blockedIdSet = new Set<string>((blocksRes.data || []).map((b: any) => b.blocked_id));
      setBlockedIds(Array.from(blockedIdSet));

      const swipedIds = new Set((swipesRes.data || []).map(s => s.swiped_id));
      const queue = allRows
        .filter(p => p.id !== userId && !swipedIds.has(p.id))
        .filter(p => profileRow ? p.sex !== profileRow.sex : true)
        .filter(p => !blockedIdSet.has(p.id))
        .map(p => dbProfileToApp(p, profileRow ? computeCompat(profileRow, p) : 50));
      setDiscoverQueue(queue);
      setSwipesToday(todaySwipesRes.count || 0);

      const matchRows = matchesRes.data || [];
      if (matchRows.length > 0) {
        const filteredMatchRows = matchRows.filter(m => {
          const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
          return !blockedIdSet.has(otherId);
        });
        const otherIds = filteredMatchRows.map(m => m.user1_id === userId ? m.user2_id : m.user1_id);
        
        if (otherIds.length > 0) {
          const { data: matchProfiles } = await supabase.from("profiles").select("*").in("id", otherIds);
          const { data: allMsgs } = await supabase.from("messages").select("*").in("match_id", filteredMatchRows.map(m => m.id)).order("created_at", { ascending: false });

          const md: MatchData[] = filteredMatchRows.map(m => {
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
      } else {
        setMatches([]);
      }

      setNudgesSent((nudgeSentRes.data || []).map(n => ({ id: n.id, fromId: n.sender_id, toId: n.receiver_id, message: n.message, sentAt: new Date(n.created_at), seen: n.seen ?? false })));
      setNudgesReceived((nudgeRecvRes.data || []).map(n => ({ id: n.id, fromId: n.sender_id, toId: n.receiver_id, message: n.message, sentAt: new Date(n.created_at), seen: n.seen ?? false })));
      setCrushesSent((crushSentRes.data || []).map(c => ({ id: c.id, fromId: c.sender_id, toId: c.receiver_id, hint: c.hint, sentAt: new Date(c.created_at), guessesLeft: c.guesses_left, revealed: c.revealed ?? false })));
      setCrushesReceived((crushRecvRes.data || []).map(c => ({ id: c.id, fromId: c.sender_id, toId: c.receiver_id, hint: c.hint, sentAt: new Date(c.created_at), guessesLeft: c.guesses_left, revealed: c.revealed ?? false })));
    } catch (err) {
      toast({ title: "Failed to load data", description: "Please try refreshing.", variant: "destructive" });
    } finally {
      setDataLoading(false);
    }
  };

  // ── Auth ──
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => { await supabase.auth.signOut(); };



  const completeProfile = async (data: Record<string, any>) => {
    if (!session?.user) return;
    const { error } = await supabase.from("profiles").upsert({
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
    }, { onConflict: 'id' });
    if (error) {
      toast({ title: "Profile creation failed", description: error.message, variant: "destructive" });
      return;
    }
    await fetchAllData(session.user.id);
  };

  const updateProfile = async (data: Record<string, any>) => {
    if (!session?.user) return;
    const { error } = await supabase.from("profiles").update({
      name: data.name,
      program: data.program,
      section: data.section || null,
      maggi_metric: data.maggiMetric ?? 50,
      favorite_trip: data.favoriteTrip || "",
      party_spot: data.partySpot || "",
      red_flag: data.redFlag || null,
      photo_urls: data.photoUrls && data.photoUrls.length > 0 ? data.photoUrls : null,
    }).eq("id", session.user.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile updated! 🌸" });
    await fetchAllData(session.user.id);
  };

  // ── Swipe ──
  const swipeLeft = async (profileId: string) => {
    if (!session?.user) return;
    if (swipesRemaining <= 0) {
      toast({ title: "Daily limit reached 🛑", description: `You've used all ${DAILY_SWIPE_LIMIT} swipes today. Come back tomorrow!`, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("swipes").insert({ swiper_id: session.user.id, swiped_id: profileId, direction: "dislike" });
    if (error) { toast({ title: "Swipe failed", description: error.message, variant: "destructive" }); return; }
    setDiscoverQueue(q => q.filter(p => p.id !== profileId));
    setSwipesToday(n => n + 1);
  };

  const swipeRight = async (profileId: string): Promise<boolean> => {
    if (!session?.user) return false;
    if (swipesRemaining <= 0) {
      toast({ title: "Daily limit reached 🛑", description: `You've used all ${DAILY_SWIPE_LIMIT} swipes today. Come back tomorrow!`, variant: "destructive" });
      return false;
    }
    const { error } = await supabase.from("swipes").insert({ swiper_id: session.user.id, swiped_id: profileId, direction: "like" });
    if (error) { toast({ title: "Swipe failed", description: error.message, variant: "destructive" }); return false; }
    setDiscoverQueue(q => q.filter(p => p.id !== profileId));
    setSwipesToday(n => n + 1);
    const { data: match } = await supabase.from("matches").select("*")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${profileId}),and(user1_id.eq.${profileId},user2_id.eq.${session.user.id})`)
      .maybeSingle();
    if (match) { await fetchAllData(session.user.id); return true; }
    return false;
  };

  // ── Chat ──
  const loadConversation = useCallback(async (profileId: string) => {
    const match = matchesRef.current.find(m => m.id === profileId);
    if (!match) return;
    const { data } = await supabase.from("messages").select("*")
      .eq("match_id", match.matchUuid)
      .order("created_at", { ascending: false })
      .limit(CHAT_PAGE_SIZE);

    const messages = (data || []).reverse().map(m => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      audioUrl: (m as any).audio_url || undefined,
      timestamp: new Date(m.created_at),
      status: m.status as "sent" | "read",
    }));

    setConversations(prev => ({ ...prev, [profileId]: messages }));
    setHasMoreMessages(prev => ({ ...prev, [profileId]: (data || []).length >= CHAT_PAGE_SIZE }));
  }, []);

  const loadMoreMessages = useCallback(async (profileId: string): Promise<boolean> => {
    const match = matchesRef.current.find(m => m.id === profileId);
    if (!match) return false;

    const existing = conversations[profileId] || [];
    if (existing.length === 0) return false;

    const oldestTimestamp = existing[0].timestamp.toISOString();
    const { data } = await supabase.from("messages").select("*")
      .eq("match_id", match.matchUuid)
      .lt("created_at", oldestTimestamp)
      .order("created_at", { ascending: false })
      .limit(CHAT_PAGE_SIZE);

    const olderMessages = (data || []).reverse().map(m => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      audioUrl: (m as any).audio_url || undefined,
      timestamp: new Date(m.created_at),
      status: m.status as "sent" | "read",
    }));

    if (olderMessages.length > 0) {
      setConversations(prev => ({
        ...prev,
        [profileId]: [...olderMessages, ...(prev[profileId] || [])],
      }));
    }

    const hasMore = (data || []).length >= CHAT_PAGE_SIZE;
    setHasMoreMessages(prev => ({ ...prev, [profileId]: hasMore }));
    return hasMore;
  }, [conversations]);

  const sendMessage = async (profileId: string, text: string, audioUrl?: string) => {
    const match = matchesRef.current.find(m => m.id === profileId);
    if (!match || !session?.user) return;
    const insertData: any = { match_id: match.matchUuid, sender_id: session.user.id, text };
    if (audioUrl) insertData.audio_url = audioUrl;
    const { error } = await supabase.from("messages").insert(insertData);
    if (error) { toast({ title: "Message failed", description: error.message, variant: "destructive" }); return; }
    await loadConversation(profileId);
    setMatches(prev => prev.map(m =>
      m.id === profileId ? { ...m, lastMessage: audioUrl ? "🎤 Voice note" : text, lastMessageTime: "Just now" } : m
    ));
  };

  const markMessagesRead = async (profileId: string) => {
    const match = matchesRef.current.find(m => m.id === profileId);
    if (!match || !session?.user) return;
    await supabase.from("messages")
      .update({ status: "read" })
      .eq("match_id", match.matchUuid)
      .neq("sender_id", session.user.id)
      .eq("status", "sent");
    setMatches(prev => prev.map(m => m.id === profileId ? { ...m, unread: 0 } : m));
  };

  // ── Nudges ──
  const sendNudge = async (toId: string, message: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from("nudges").insert({ sender_id: session.user.id, receiver_id: toId, message });
    if (error) { toast({ title: "Nudge failed", description: error.message, variant: "destructive" }); return; }
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
    if (error) { toast({ title: "Crush failed", description: error.message, variant: "destructive" }); return false; }
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

  const reportUser = async (userId: string, reason: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from("reports").insert({ reporter_id: session.user.id, reported_id: userId, reason });
    if (error) { toast({ title: "Report failed", variant: "destructive" }); return; }
    toast({ title: "Report submitted", description: "We'll review it shortly." });
  };

  // ── Block / Unmatch ──
  const blockUser = async (userId: string) => {
    if (!session?.user) return;
    const { error } = await (supabase as any).from("blocks").insert({
      blocker_id: session.user.id,
      blocked_id: userId,
    });
    if (error) { toast({ title: "Block failed", description: error.message, variant: "destructive" }); return; }
    setBlockedIds(prev => [...prev, userId]);
    setMatches(prev => prev.filter(m => m.id !== userId));
    setDiscoverQueue(prev => prev.filter(p => p.id !== userId));
    toast({ title: "User blocked 🚫", description: "They won't appear in your feed anymore." });
  };

  const unmatchUser = async (matchUuid: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from("matches").delete().eq("id", matchUuid);
    if (error) { toast({ title: "Unmatch failed", description: error.message, variant: "destructive" }); return; }
    setMatches(prev => prev.filter(m => m.matchUuid !== matchUuid));
    toast({ title: "Unmatched", description: "This match has been removed." });
  };

  // ── Stats ──
  const fetchCampusStats = async () => {
    const { data, error } = await supabase.rpc("get_campus_stats");
    if (!error && data) {
      const d = data as any;
      setCampusStats({
        totalSwipes: d.total_swipes || 0,
        totalMatches: d.total_matches || 0,
        totalNudges: d.total_nudges || 0,
        mostActiveProgram: d.most_active_program || "—",
        matchRate: d.match_rate || 0,
        busiestHour: d.busiest_hour,
        topRedFlag: d.top_red_flag || "finance is a personality trait",
        promPactCount: d.prom_pact_count || 0,
      });
    }
  };

  const fetchSecretAdmirers = async () => {
    if (!session?.user) return;
    const [countRes, hintsRes] = await Promise.all([
      supabase.rpc("get_secret_admirers_count", { p_user_id: session.user.id }),
      supabase.rpc("get_secret_admirer_hints", { p_user_id: session.user.id }),
    ]);
    if (!countRes.error) setSecretAdmirerCount(countRes.data || 0);
    if (!hintsRes.error && hintsRes.data) setSecretAdmirerHints(hintsRes.data as any || []);
  };

  const getWrappedStats = useCallback(() => ({
    matchCount: matches.length,
    crushesSent: crushesSent.length,
    crushesReceived: crushesReceived.length,
    topPrompt: campusStats?.topRedFlag || "finance is a personality trait",
    totalSwipes: campusStats?.totalSwipes || 0,
    nudgesSent: nudgesSent.length,
    nudgesReceived: nudgesReceived.length,
  }), [matches.length, crushesSent.length, crushesReceived.length, campusStats, nudgesSent.length, nudgesReceived.length]);

  return (
    <WaltzStoreContext.Provider
      value={{
        session, isLoggedIn, hasProfile, myProfile, loading, dataLoading,
        signUp, signIn, signOut, completeProfile, updateProfile,
        discoverQueue, swipeLeft, swipeRight, swipesRemaining,
        matches, conversations, sendMessage, loadConversation, loadMoreMessages, markMessagesRead, hasMoreMessages,
        nudgesSent, nudgesReceived, canNudgeToday, sendNudge, markNudgeSeen,
        crushesSent, crushesReceived, sendCrush, guessCrush,
        reportUser, blockUser, unmatchUser, blockedIds,
        allProfiles,
        campusStats, secretAdmirerCount, secretAdmirerHints, fetchCampusStats, fetchSecretAdmirers,
        getWrappedStats,
      }}
    >
      {children}
    </WaltzStoreContext.Provider>
  );
};
