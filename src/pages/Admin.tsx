import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Heart, AlertTriangle, Ban, Trash2, Eye, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWaltzStore } from "@/context/WaltzStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  program: string;
  section: string | null;
  sex: string;
  is_shadow_banned: boolean | null;
  created_at: string;
}

interface AdminReport {
  id: string;
  reason: string;
  created_at: string;
  reporter: { name: string; email: string } | null;
  reported: { name: string; email: string } | null;
}

interface AdminStats {
  total_users: number | null;
  total_matches: number | null;
  total_reports: number | null;
  total_swipes: number | null;
}

type Tab = "stats" | "users" | "reports";

const AdminPage = () => {
  const { session } = useWaltzStore();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const callAdmin = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action, ...extra },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  // Check admin role
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
      } else if (t === "reports") {
        const data = await callAdmin("get_reports");
        setReports(data.reports || []);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  }, [callAdmin]);

  useEffect(() => {
    if (isAdmin) loadTab(tab);
  }, [isAdmin, tab, loadTab]);

  const handleShadowBan = async (userId: string, ban: boolean) => {
    setActionLoading(userId);
    try {
      await callAdmin(ban ? "shadow_ban" : "unshadow_ban", { target_user_id: userId });
      toast({ title: ban ? "User shadow banned" : "User unbanned" });
      loadTab("users");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    setActionLoading(userId);
    try {
      await callAdmin("delete_user", { target_user_id: userId });
      toast({ title: "User deleted" });
      loadTab("users");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  if (isAdmin === null) {
    return <div className="min-h-screen breathing-bg flex items-center justify-center">
      <div className="text-muted-foreground">Checking access...</div>
    </div>;
  }

  if (!isAdmin) {
    return <div className="min-h-screen breathing-bg flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h1 className="font-display text-2xl text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
        <button onClick={() => navigate("/discover")} className="btn-waltz">Go Back</button>
      </div>
    </div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "stats", label: "Stats", icon: <Eye className="w-4 h-4" /> },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "reports", label: "Reports", icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen breathing-bg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/discover")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-6 h-6 text-blossom" />
          <h1 className="font-display text-2xl text-foreground">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body transition-all ${
                tab === t.key ? "bg-blossom/20 text-blossom border border-blossom/30" : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <button onClick={() => loadTab(tab)} className="ml-auto text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tab === "stats" && stats && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Users", value: stats.total_users, icon: <Users className="w-5 h-5" /> },
                  { label: "Total Matches", value: stats.total_matches, icon: <Heart className="w-5 h-5" /> },
                  { label: "Total Swipes", value: stats.total_swipes, icon: <Eye className="w-5 h-5" /> },
                  { label: "Total Reports", value: stats.total_reports, icon: <AlertTriangle className="w-5 h-5" /> },
                ].map(s => (
                  <div key={s.label} className="glass-strong rounded-2xl p-5 text-center">
                    <div className="text-blossom mb-2 flex justify-center">{s.icon}</div>
                    <div className="text-3xl font-bold text-foreground">{s.value ?? "—"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "users" && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-3">{users.length} users total</div>
                {users.map(u => (
                  <div key={u.id} className={`glass-strong rounded-xl p-4 flex items-center gap-3 ${u.is_shadow_banned ? "border border-destructive/30 opacity-60" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-foreground text-sm font-medium truncate">
                        {u.name} {u.is_shadow_banned && <span className="text-destructive text-xs">(banned)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.program} {u.section && `• ${u.section}`} • {u.sex}</div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleShadowBan(u.id, !u.is_shadow_banned)}
                        disabled={actionLoading === u.id}
                        className={`p-2 rounded-lg text-xs ${u.is_shadow_banned ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"} hover:opacity-80 disabled:opacity-40`}
                        title={u.is_shadow_banned ? "Unban" : "Shadow Ban"}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={actionLoading === u.id}
                        className="p-2 rounded-lg bg-destructive/20 text-destructive hover:opacity-80 disabled:opacity-40"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "reports" && (
              <div className="space-y-2">
                {reports.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">No reports yet 🎉</div>
                ) : reports.map(r => (
                  <div key={r.id} className="glass-strong rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-foreground font-body">
                          <strong>{(r.reporter as any)?.name || "Unknown"}</strong> reported <strong>{(r.reported as any)?.name || "Unknown"}</strong>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{r.reason}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
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
