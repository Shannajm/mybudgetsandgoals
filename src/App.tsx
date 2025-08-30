import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider, useAppContext } from "@/contexts/AppContext";
import AppLayout from "@/components/AppLayout";
import { AuthPage } from "@/components/auth/AuthPage";
import { useEffect, useState } from "react";
import { AuthService } from "@/services/AuthService";
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Marketing from "@/pages/Marketing";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, setUser } = useAppContext();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser as any);
      } else {
        const fallback = await AuthService.getCurrentUser();
        setUser(fallback);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [setUser]);

  if (!authReady) {
    return <div className="p-6">Loading…</div>;
  }
  return (
    <Routes>
      {user ? (
        <>
          <Route path="/*" element={<AppLayout />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Marketing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
