
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Practice from "@/pages/Practice";
import Auth from "@/pages/Auth";
import { migrateApiKeysToSupabase } from "@/utils/migrationUtils";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

// Removed the ProtectedRoute component

const AppRoutes = () => {
  useEffect(() => {
    // Attempt to migrate API keys from localStorage to Supabase
    migrateApiKeysToSupabase().catch(error => {
      console.error("Failed to migrate API keys:", error);
    });
  }, []);

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Index />} />
      <Route path="/practice" element={<Practice />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
