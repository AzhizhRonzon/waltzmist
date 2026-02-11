import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Heart, AlertTriangle, Ban, Trash2, Eye, ArrowLeft, RefreshCw,
  CheckSquare, Square, Search, UserPlus, Download, X, ChevronDown, BarChart3,
  MessageSquare, Zap, UserX, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWaltzStore } from "@/context/WaltzStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  program: string;
  section: string | null;
  sex: string;
  age: number;
  is_shadow_banned: boolean | null;
  created_at: string;
  photo_urls: string[] | null;
  maggi_metric: number | null;
  favorite_trip: string | null;
  party_spot: string | null;
  red_flag: string | null;
}

interface AdminReport {
  id: string;
  reason: string;
  created_at: string;
  reporter: { name: string; email: string } | null;
  reported: { name: string; email: string } | null;
  reporter_id: string;
  reported_id: string;
}

interface AdminMatch {
  id: string;
  matched_at: string;
  user1: { name: string; email: string } | null;
  user2: { name: string; email: string } | null;
}

interface AdminStats {
  total_users: number;
  total_matches: number;
  total_reports: number;
  total_swipes: number;
  total_crushes: number;
  total_nudges: number;
  shadow_banned: number;
  gender_breakdown: Record<string, number>;
  program_breakdown: Record<string, number>;
}

type Tab = "stats" | "users" | "reports" | "matches";

const AdminPage = () => {
  const { session } = useWaltzStore();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProgram, setFilterProgram] = useState<string>("");
  const [filterBanned, setFilterBanned] = useState<"all" | "banned" | "active">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", program: "PGP", sex: "male", age: "22", section: "" });

  const callAdmin = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action, ...extra },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  useEffect(() => {
    if (!session?.user) { navigate("/login"); return; }
    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) { setIsAdmin(false); return; }
      setIsAdmin(true);
    };
    checkRole();
  }, [session, navigate]);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      if (t === "stats") {
        const data = await callAdmin("get_stats");
        setStats(data);
      } else if (t === "users") {
        const data = await callAdmin("get_all_users");
        setUsers(data.users || []);
        setSelectedUsers(new Set());
      } else if (t === "reports") {
        const data = await callAdmin("get_reports");
        setReports(data.reports || []);
      } else if (t === "matches") {
        const data = await callAdmin("get_matches");
        setMatches(data.matches || []);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  }, [callAdmin]);

  useEffect(() => {
    if (isAdmin) loadTab(tab);
  }, [isAdmin, tab, loadTab]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filterProgram) list = list.filter(u => u.program === filterProgram);
    if (filterBanned === "banned") list = list.filter(u => u.is_shadow_banned);
    if (filterBanned === "active") list = list.filter(u => !u.is_shadow_banned);
    return list;
  }, [users, searchQuery, filterProgram, filterBanned]);

  const programs = useMemo(() => [...new Set(users.map(u => u.program))].sort(), [users]);

  const toggleSelect = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleAction = async (actionName: string, extra: Record<string, any>, successMsg: string) => {
    setActionLoading(extra.target_user_id || "bulk");
    try {
      await callAdmin(actionName, extra);
      toast({ title: successMsg });
      loadTab(tab as Tab);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user and all their data?")) return;
    await handleAction("delete_user", { target_user_id: userId }, "User deleted");
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Permanently delete ${selectedUsers.size} user(s)?`)) return;
    await handleAction("bulk_delete_users", { target_user_ids: Array.from(selectedUsers) }, `${selectedUsers.size} user(s) deleted`);
  };

  const handleBulkBan = async (ban: boolean) => {
    if (selectedUsers.size === 0) return;
    const action = ban ? "bulk_shadow_ban" : "bulk_unshadow_ban";
    await handleAction(action, { target_user_ids: Array.from(selectedUsers) }, `${selectedUsers.size} user(s) ${ban ? "banned" : "unbanned"}`);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    setActionLoading("create");
    try {
      await callAdmin("create_user", newUser);
      toast({ title: "User created successfully" });
      setShowCreateUser(false);
      setNewUser({ email: "", password: "", name: "", program: "PGP", sex: "male", age: "22", section: "" });
      loadTab("users");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleExport = async () => {
    try {
      const data = await callAdmin("export_users_csv");
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `waltz-users-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exported" });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDismissReport = async (reportId: string) => {
    await handleAction("dismiss_report", { report_id: reportId }, "Report dismissed");
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Delete this match and all messages?")) return;
    await handleAction("delete_match", { match_id: matchId }, "Match deleted");
  };

  const getUserAvatar = (user: AdminUser) => {
    if (user.photo_urls && user.photo_urls.length > 0) return user.photo_urls[0];
    return user.sex === "female"
      ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}&top=longHair`
      : `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.id}&top=shortHair`;
  };

  if (isAdmin === null) {
    return <div className="min-h-screen breathing-bg flex items-center justify-center">
      <div className="text-muted-foreground font-body">Checking access...</div>
    </div>;
  }

  if (!isAdmin) {
    return <div className="min-h-screen breathing-bg flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h1 className="font-display text-2xl text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4 font-body">You don't have admin privileges.</p>
        <button onClick={() => navigate("/discover")} className="btn-waltz">Go Back</button>
      </div>
    </div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "stats", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" />, count: users.length },
    { key: "reports", label: "Reports", icon: <AlertTriangle className="w-4 h-4" />, count: reports.length },
    { key: "matches", label: "Matches", icon: <Heart className="w-4 h-4" />, count: matches.length },
  ];

  return (
    <div className="min-h-screen breathing-bg">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/discover")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-6 h-6 text-blossom" />
          <h1 className="font-display text-xl sm:text-2xl text-foreground">Admin Console</h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => loadTab(tab)} className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-body whitespace-nowrap transition-all ${
                tab === t.key ? "bg-blossom/20 text-blossom border border-blossom/30" : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-[10px] bg-blossom/20 text-blossom rounded-full px-1.5 py-0.5 ml-0.5">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12 font-body">Loading...</div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={tab}>
            {/* ═══ STATS ═══ */}
            {tab === "stats" && stats && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Users", value: stats.total_users, icon: <Users className="w-5 h-5" />, color: "text-blossom" },
                    { label: "Matches", value: stats.total_matches, icon: <Heart className="w-5 h-5" />, color: "text-blossom" },
                    { label: "Swipes", value: stats.total_swipes, icon: <Eye className="w-5 h-5" />, color: "text-muted-foreground" },
                    { label: "Crushes", value: stats.total_crushes, icon: <MessageSquare className="w-5 h-5" />, color: "text-muted-foreground" },
                    { label: "Nudges", value: stats.total_nudges, icon: <Zap className="w-5 h-5" />, color: "text-muted-foreground" },
                    { label: "Reports", value: stats.total_reports, icon: <AlertTriangle className="w-5 h-5" />, color: "text-destructive" },
                    { label: "Banned", value: stats.shadow_banned, icon: <UserX className="w-5 h-5" />, color: "text-destructive" },
                    { label: "Match Rate", value: stats.total_swipes > 0 ? `${((stats.total_matches * 2 / stats.total_swipes) * 100).toFixed(1)}%` : "0%", icon: <BarChart3 className="w-5 h-5" />, color: "text-blossom" },
                  ].map(s => (
                    <div key={s.label} className="glass-strong rounded-2xl p-4 text-center">
                      <div className={`${s.color} mb-1.5 flex justify-center`}>{s.icon}</div>
                      <div className="text-2xl font-bold text-foreground">{s.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-body">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Breakdowns */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="glass-strong rounded-2xl p-4">
                    <h3 className="font-body text-sm text-foreground font-semibold mb-3">Gender Distribution</h3>
                    {Object.entries(stats.gender_breakdown).map(([gender, count]) => (
                      <div key={gender} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-muted-foreground font-body capitalize">{gender}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-blossom" style={{ width: `${(count / stats.total_users) * 100}%` }} />
                          </div>
                          <span className="text-xs text-foreground font-body font-semibold w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="glass-strong rounded-2xl p-4">
                    <h3 className="font-body text-sm text-foreground font-semibold mb-3">Program Distribution</h3>
                    {Object.entries(stats.program_breakdown).map(([prog, count]) => (
                      <div key={prog} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-muted-foreground font-body">{prog}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-blossom" style={{ width: `${(count / stats.total_users) * 100}%` }} />
                          </div>
                          <span className="text-xs text-foreground font-body font-semibold w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ USERS ═══ */}
            {tab === "users" && (
              <div className="space-y-3">
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl glass text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blossom/50"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl glass text-sm ${showFilters ? "text-blossom" : "text-muted-foreground"} hover:text-foreground transition-colors`}>
                      <Filter className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowCreateUser(!showCreateUser)} className="p-2.5 rounded-xl glass text-muted-foreground hover:text-blossom transition-colors" title="Add User">
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button onClick={handleExport} className="p-2.5 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors" title="Export CSV">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex flex-wrap gap-2 glass-strong rounded-xl p-3">
                        <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-1.5">
                          <option value="">All Programs</option>
                          {programs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select value={filterBanned} onChange={e => setFilterBanned(e.target.value as any)} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-1.5">
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="banned">Banned</option>
                        </select>
                        <span className="text-[10px] text-muted-foreground font-body self-center ml-auto">{filteredUsers.length} results</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Create User Form */}
                <AnimatePresence>
                  {showCreateUser && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="glass-strong rounded-xl p-4 space-y-3">
                        <h3 className="font-body text-sm font-semibold text-foreground">Create New User</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Email*" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-2 col-span-2" />
                          <input placeholder="Password*" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-2 col-span-2" />
                          <input placeholder="Name*" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-2" />
                          <input placeholder="Age" type="number" value={newUser.age} onChange={e => setNewUser(p => ({ ...p, age: e.target.value }))} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-2" />
                          <select value={newUser.program} onChange={e => setNewUser(p => ({ ...p, program: e.target.value }))} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-2">
                            <option value="PGP">PGP</option><option value="PGPEx">PGPEx</option><option value="IPM">IPM</option><option value="PhD">PhD</option>
                          </select>
                          <select value={newUser.sex} onChange={e => setNewUser(p => ({ ...p, sex: e.target.value }))} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-2">
                            <option value="male">Male</option><option value="female">Female</option>
                          </select>
                          <input placeholder="Section (optional)" value={newUser.section} onChange={e => setNewUser(p => ({ ...p, section: e.target.value }))} className="rounded-lg bg-secondary text-foreground text-xs font-body px-3 py-2 col-span-2" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowCreateUser(false)} className="px-3 py-1.5 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground">Cancel</button>
                          <button onClick={handleCreateUser} disabled={actionLoading === "create"} className="px-4 py-1.5 rounded-lg text-xs font-body bg-blossom text-white hover:opacity-90 disabled:opacity-40">
                            {actionLoading === "create" ? "Creating..." : "Create User"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bulk Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
                      {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                        ? <CheckSquare className="w-4 h-4 text-blossom" />
                        : <Square className="w-4 h-4" />}
                    </button>
                    <span className="text-xs text-muted-foreground font-body">
                      {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : `${filteredUsers.length} users`}
                    </span>
                  </div>
                  {selectedUsers.size > 0 && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleBulkBan(true)} disabled={actionLoading === "bulk"}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-body bg-yellow-500/20 text-yellow-400 hover:opacity-80 disabled:opacity-40">
                        <Ban className="w-3 h-3" /> Ban
                      </button>
                      <button onClick={() => handleBulkBan(false)} disabled={actionLoading === "bulk"}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-body bg-green-500/20 text-green-400 hover:opacity-80 disabled:opacity-40">
                        <Ban className="w-3 h-3" /> Unban
                      </button>
                      <button onClick={handleBulkDelete} disabled={actionLoading === "bulk"}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-body bg-destructive/20 text-destructive hover:opacity-80 disabled:opacity-40">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* User List */}
                <div className="space-y-1.5">
                  {filteredUsers.map(u => (
                    <div key={u.id} className={`glass-strong rounded-xl overflow-hidden transition-all ${u.is_shadow_banned ? "border border-destructive/30 opacity-70" : ""}`}>
                      <div className="p-3 flex items-center gap-3">
                        <button onClick={() => toggleSelect(u.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                          {selectedUsers.has(u.id) ? <CheckSquare className="w-4 h-4 text-blossom" /> : <Square className="w-4 h-4" />}
                        </button>

                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={getUserAvatar(u)} alt={u.name} />
                          <AvatarFallback className="text-xs bg-secondary">{u.name[0]}</AvatarFallback>
                        </Avatar>

                        <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-body text-foreground text-sm font-medium truncate">{u.name}</span>
                            {u.is_shadow_banned && <span className="text-[9px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full font-body">banned</span>}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-body truncate">{u.email}</div>
                          <div className="text-[10px] text-muted-foreground/60 font-body">{u.program}{u.section ? ` · ${u.section}` : ""} · {u.sex} · {u.age}y</div>
                        </button>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedUser === u.id ? "rotate-180" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleAction(u.is_shadow_banned ? "unshadow_ban" : "shadow_ban", { target_user_id: u.id }, u.is_shadow_banned ? "Unbanned" : "Banned")}
                            disabled={actionLoading === u.id}
                            className={`p-1.5 rounded-lg ${u.is_shadow_banned ? "text-green-400 hover:bg-green-500/10" : "text-yellow-400 hover:bg-yellow-500/10"} disabled:opacity-40 transition-colors`}
                            title={u.is_shadow_banned ? "Unban" : "Ban"}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(u.id)} disabled={actionLoading === u.id}
                            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedUser === u.id && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 border-t border-border/30 pt-3">
                              {/* All photos */}
                              {u.photo_urls && u.photo_urls.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
                                  {u.photo_urls.map((url, i) => (
                                    <img key={i} src={url} alt={`${u.name} photo ${i + 1}`} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                                  ))}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-body">
                                {u.favorite_trip && <div className="glass rounded-lg p-2"><span className="text-muted-foreground">🏔 Trip:</span> <span className="text-foreground">{u.favorite_trip}</span></div>}
                                {u.party_spot && <div className="glass rounded-lg p-2"><span className="text-muted-foreground">🎉 Party:</span> <span className="text-foreground">{u.party_spot}</span></div>}
                                {u.red_flag && <div className="glass rounded-lg p-2 col-span-2"><span className="text-destructive">🚩 Red Flag:</span> <span className="text-foreground italic">{u.red_flag}</span></div>}
                                <div className="glass rounded-lg p-2"><span className="text-muted-foreground">🌙 Night Owl:</span> <span className="text-foreground">{u.maggi_metric ?? 50}%</span></div>
                                <div className="glass rounded-lg p-2"><span className="text-muted-foreground">📅 Joined:</span> <span className="text-foreground">{new Date(u.created_at).toLocaleDateString()}</span></div>
                              </div>
                              <div className="mt-2 text-[9px] text-muted-foreground/40 font-mono break-all">ID: {u.id}</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 font-body text-sm">No users found</div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ REPORTS ═══ */}
            {tab === "reports" && (
              <div className="space-y-2">
                {reports.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12 font-body">No reports yet 🎉</div>
                ) : reports.map(r => (
                  <div key={r.id} className="glass-strong rounded-xl p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground font-body">
                          <strong>{(r.reporter as any)?.name || "Unknown"}</strong> → <strong>{(r.reported as any)?.name || "Unknown"}</strong>
                        </div>
                        <div className="text-xs text-muted-foreground font-body mt-1">{r.reason}</div>
                        <div className="text-[10px] text-muted-foreground/50 font-body mt-1">{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleAction("shadow_ban", { target_user_id: r.reported_id }, "User banned")}
                          className="px-2 py-1 rounded-lg text-[10px] font-body bg-yellow-500/20 text-yellow-400 hover:opacity-80">
                          Ban Reported
                        </button>
                        <button onClick={() => handleDismissReport(r.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-body bg-secondary text-muted-foreground hover:text-foreground">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ MATCHES ═══ */}
            {tab === "matches" && (
              <div className="space-y-2">
                {matches.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12 font-body">No matches yet</div>
                ) : matches.map(m => (
                  <div key={m.id} className="glass-strong rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground font-body">
                        <strong>{(m.user1 as any)?.name || "?"}</strong>
                        <Heart className="w-3 h-3 text-blossom inline mx-1.5" fill="currentColor" />
                        <strong>{(m.user2 as any)?.name || "?"}</strong>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-body">{new Date(m.matched_at).toLocaleString()}</div>
                    </div>
                    <button onClick={() => handleDeleteMatch(m.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete Match">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
