
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Footer } from "@/shared/components/layout/Footer";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { Header } from "@/shared/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/index"));
const Practice = lazy(() => import("@/pages/Practice"));
const VoicePractice = lazy(() => import("@/pages/VoicePractice"));
const Contact = lazy(() => import("@/pages/Contact"));
const Auth = lazy(() => import("@/pages/Auth"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Resources = lazy(() => import("@/pages/Resources"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const PromptManager = lazy(() => import("@/shared/components/PromptManager"));
const LeaseAnalyzer = lazy(() => import("@/pages/LeaseAnalyzer"));
const ScriptBuilder = lazy(() => import("@/pages/ScriptBuilder"));
const DownPaymentPrograms = lazy(() => import("@/pages/DownPaymentPrograms"));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/practice/voice" element={<VoicePractice />} />
        <Route path="/prompts" element={<PromptManager />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:resourceId" element={<Resources />} />
        <Route path="/resources/down-payment-programs" element={<DownPaymentPrograms />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/lease-analyzer" element={<LeaseAnalyzer />} />
        <Route path="/script-builder" element={<ScriptBuilder />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-1">
              <AppRoutes />
            </div>
            <Footer />
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
