import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Discover from "./pages/Discover";
import Whispers from "./pages/Whispers";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/Profile";
import CrushesPage from "./pages/Crushes";
import WrappedPage from "./pages/Wrapped";
import CinderellaScreen from "./components/CinderellaScreen";
import ColdWeatherOverlay, { useColdWeatherMode } from "./components/ColdWeatherOverlay";
import { WaltzStoreProvider, useWaltzStore } from "./context/WaltzStore";

const CINDERELLA_DATE = new Date("2026-02-15T00:00:00+05:30").getTime();

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoggedIn, hasProfile } = useWaltzStore();
  const [isCinderella, setIsCinderella] = useState(false);
  const { isCold, temp } = useColdWeatherMode();

  useEffect(() => {
    const check = () => setIsCinderella(Date.now() >= CINDERELLA_DATE);
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isCinderella) return <CinderellaScreen />;

  const authed = isLoggedIn && hasProfile;

  return (
    <>
      {isCold && <ColdWeatherOverlay temp={temp} />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/discover" element={authed ? <Discover /> : <Navigate to="/login" />} />
        <Route path="/whispers" element={authed ? <Whispers /> : <Navigate to="/login" />} />
        <Route path="/matches" element={authed ? <Matches /> : <Navigate to="/login" />} />
        <Route path="/chat/:matchId" element={authed ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/crushes" element={authed ? <CrushesPage /> : <Navigate to="/login" />} />
        <Route path="/wrapped" element={authed ? <WrappedPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
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
);

export default App;
