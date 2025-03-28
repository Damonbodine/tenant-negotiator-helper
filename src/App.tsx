
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Practice from "@/pages/Practice";
import { migrateApiKeysToSupabase } from "@/utils/migrationUtils";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Attempt to migrate API keys from localStorage to Supabase
    migrateApiKeysToSupabase().catch(error => {
      console.error("Failed to migrate API keys:", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/practice" element={<Practice />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
