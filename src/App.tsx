import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider, useAppContext } from "@/contexts/AppContext";
import AppLayout from "@/components/AppLayout";
import { AuthPage } from "@/components/auth/AuthPage";
import { useEffect } from "react";
import { AuthService } from "@/services/AuthService";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, setUser } = useAppContext();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    };
    checkUser();
  }, [setUser]);

  if (!user) {
    return <AuthPage />;
  }

  return <AppLayout />;
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