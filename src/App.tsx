
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Index from './pages/index'
import NotFound from './pages/NotFound'
import Auth from './pages/Auth'
import Contact from './pages/Contact'
import Resources from './pages/Resources'
import FAQ from './pages/FAQ'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ScriptBuilder from './pages/ScriptBuilder'
import Practice from './pages/Practice'
import VoicePractice from './pages/VoicePractice'
import Profile from './pages/Profile'
import DownPaymentPrograms from './pages/DownPaymentPrograms'
import LeaseAnalyzer from './pages/LeaseAnalyzer'

import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/script-builder" element={<ScriptBuilder />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/voice-practice" element={<VoicePractice />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/down-payment-programs" element={<DownPaymentPrograms />} />
          <Route path="/lease-analyzer" element={<LeaseAnalyzer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}

export default App
