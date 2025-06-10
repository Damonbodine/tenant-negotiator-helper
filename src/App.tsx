
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
const ScriptBuilder = lazy(() => import("@/pages/ScriptBuilder"));
const DownPaymentPrograms = lazy(() => import("@/pages/DownPaymentPrograms"));
const LeaseAnalyzer = lazy(() => import("@/pages/LeaseAnalyzer"));
const NegotiationChat = lazy(() => import("@/chat/components/NegotiationChat"));
const PropertyComparison = lazy(() => import("@/propertyComparison/components/PropertyComparison"));
const MarketInsights = lazy(() => import("@/listingAnalyzer/components/MarketInsights"));
const PropertyAnalysis = lazy(() => import("@/pages/PropertyAnalysis"));

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
        <Route path="/script-builder" element={<ScriptBuilder />} />
        <Route path="/lease" element={<LeaseAnalyzer />} />
        <Route path="/negotiation" element={<NegotiationChat />} />
        <Route path="/property-analysis" element={<PropertyAnalysis />} />
        {/* Legacy routes - redirect to unified property analysis */}
        <Route path="/comparison" element={<PropertyAnalysis />} />
        <Route path="/market/:address?" element={<PropertyAnalysis />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function LoadingScreen() {
  console.log("🔄 LoadingScreen is showing - component is loading...");
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
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 pb-32">
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
