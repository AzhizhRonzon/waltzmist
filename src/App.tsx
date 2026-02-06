import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Discover from "./pages/Discover";
import Whispers from "./pages/Whispers";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/Profile";
import { useState, createContext, useContext } from "react";

interface WaltzContextType {
  isLoggedIn: boolean;
  hasProfile: boolean;
  login: () => void;
  completeProfile: () => void;
}

export const WaltzContext = createContext<WaltzContextType>({
  isLoggedIn: false,
  hasProfile: false,
  login: () => {},
  completeProfile: () => {},
});

export const useWaltz = () => useContext(WaltzContext);

const queryClient = new QueryClient();

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const authed = isLoggedIn && hasProfile;

  return (
    <WaltzContext.Provider
      value={{
        isLoggedIn,
        hasProfile,
        login: () => setIsLoggedIn(true),
        completeProfile: () => setHasProfile(true),
      }}
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/discover"
          element={authed ? <Discover /> : <Navigate to="/login" />}
        />
        <Route
          path="/whispers"
          element={authed ? <Whispers /> : <Navigate to="/login" />}
        />
        <Route
          path="/matches"
          element={authed ? <Matches /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat/:matchId"
          element={authed ? <Chat /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </WaltzContext.Provider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
