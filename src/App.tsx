import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import CinderellaScreen from "./components/CinderellaScreen";
import ColdWeatherOverlay, { useColdWeatherMode } from "./components/ColdWeatherOverlay";
import { WaltzStoreProvider, useWaltzStore } from "./context/WaltzStore";
import { useOfflineDetection } from "./hooks/useOfflineDetection";

const CINDERELLA_DATE = new Date("2026-02-15T00:00:00+05:30").getTime();

const queryClient = new QueryClient();

// Lazy-loaded routes for smaller initial bundle
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Discover = lazy(() => import("./pages/Discover"));
const Whispers = lazy(() => import("./pages/Whispers"));
const Matches = lazy(() => import("./pages/Matches"));
const Chat = lazy(() => import("./pages/Chat"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const CrushesPage = lazy(() => import("./pages/Crushes"));
const WrappedPage = lazy(() => import("./pages/Wrapped"));
const AdminPage = lazy(() => import("./pages/Admin"));

const LoadingScreen = () => (
  <div className="min-h-screen breathing-bg flex flex-col items-center justify-center">
    <motion.div
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="text-center"
    >
      <h1 className="font-display text-5xl font-bold blossom-text mb-3">WALTZ</h1>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="inline-block w-5 h-5 border-2 border-blossom/30 border-t-blossom rounded-full mt-4"
      />
    </motion.div>
  </div>
);

const AppContent = () => {
  const { isLoggedIn, hasProfile, loading, dataLoading } = useWaltzStore();
  const [isCinderella, setIsCinderella] = useState(false);
  const { isCold, temp } = useColdWeatherMode();
  useOfflineDetection();

  useEffect(() => {
    const check = () => setIsCinderella(Date.now() >= CINDERELLA_DATE);
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isCinderella) return <CinderellaScreen />;
  if (loading) return <LoadingScreen />;
  if (isLoggedIn && dataLoading) return <LoadingScreen />;

  const authed = isLoggedIn && hasProfile;

  return (
    <>
      {isCold && <ColdWeatherOverlay temp={temp} />}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={
            isLoggedIn ? (hasProfile ? <Navigate to="/discover" /> : <Navigate to="/profile" />) : <Login />
          } />
          <Route path="/profile" element={
            isLoggedIn ? (hasProfile ? <Navigate to="/discover" /> : <ProfilePage />) : <Navigate to="/login" />
          } />
          <Route path="/discover" element={authed ? <Discover /> : <Navigate to="/login" />} />
          <Route path="/whispers" element={authed ? <Whispers /> : <Navigate to="/login" />} />
          <Route path="/matches" element={authed ? <Matches /> : <Navigate to="/login" />} />
          <Route path="/chat/:matchId" element={authed ? <Chat /> : <Navigate to="/login" />} />
          <Route path="/crushes" element={authed ? <CrushesPage /> : <Navigate to="/login" />} />
          <Route path="/wrapped" element={authed ? <WrappedPage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isLoggedIn ? <AdminPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WaltzStoreProvider>
            <AppContent />
          </WaltzStoreProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
