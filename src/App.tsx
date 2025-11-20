import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useGlobalLeaderboardSync } from "@/hooks/useGlobalLeaderboardSync";
import Intro from "./pages/Intro";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Settings from "./pages/Settings";
import Marketplace from "./pages/Marketplace";
import MarketplaceItemDetail from "./pages/MarketplaceItemDetail";
import TransactionHistory from "./pages/TransactionHistory";
import Leaderboard from "./pages/Leaderboard";
import SeasonHistory from "./pages/SeasonHistory";
import Music from "./pages/Music";
import NotFound from "./pages/NotFound";
import EightBallPool from "./components/games/EightBallPool";

const queryClient = new QueryClient();

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global leaderboard sync
  useGlobalLeaderboardSync(user?.id);

  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/groups/:groupId" element={<GroupDetail />} />
      <Route path="/games/8-ball-pool/:groupId" element={<EightBallPool />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/marketplace/:id" element={<MarketplaceItemDetail />} />
      <Route path="/transactions" element={<TransactionHistory />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/season-history" element={<SeasonHistory />} />
      <Route path="/music" element={<Music />} />
      <Route path="/settings" element={<Settings />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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
