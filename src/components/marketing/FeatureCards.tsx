
import { Link } from "react-router-dom";
import { PieChart, MessageSquare, Headphones, BookOpen, FileText } from "lucide-react";

// Update the type to match what index.tsx is providing
type JourneyType = "market" | "negotiation" | null;

interface FeatureCardsProps {
  setActiveJourney: (journey: JourneyType) => void;
}

export function FeatureCards({ setActiveJourney }: FeatureCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
      <button
        onClick={() => setActiveJourney("market")}
        className="journey-bubble flex flex-col items-center justify-center p-6 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <PieChart className="h-10 w-10 text-cyan-400 mb-3" />
        <div className="text-cyan-400 text-xl font-bold mb-2">Analyze Market</div>
        <p className="text-cyan-100/70 text-center text-sm">Get insights on rental prices and market trends</p>
      </button>
      
      <button
        onClick={() => setActiveJourney("negotiation")}
        className="journey-bubble flex flex-col items-center justify-center p-6 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <MessageSquare className="h-10 w-10 text-cyan-400 mb-3" />
        <div className="text-cyan-400 text-xl font-bold mb-2">Get Negotiation Help</div>
        <p className="text-cyan-100/70 text-center text-sm">Learn effective strategies for rental negotiations</p>
      </button>
      
      <Link
        to="/practice/voice"
        className="journey-bubble flex flex-col items-center justify-center p-6 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <Headphones className="h-10 w-10 text-cyan-400 mb-3" />
        <div className="text-cyan-400 text-xl font-bold mb-2">Practice Call</div>
        <p className="text-cyan-100/70 text-center text-sm">Rehearse your negotiation with an AI landlord</p>
      </Link>

      <Link
        to="/lease-analyzer"
        className="journey-bubble flex flex-col items-center justify-center p-6 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <FileText className="h-10 w-10 text-cyan-400 mb-3" />
        <div className="text-cyan-400 text-xl font-bold mb-2">Lease Analyzer</div>
        <p className="text-cyan-100/70 text-center text-sm">Upload your lease for AI analysis and plain-language explanations</p>
      </Link>

      <Link
        to="/resources"
        className="journey-bubble flex flex-col items-center justify-center p-6 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <BookOpen className="h-10 w-10 text-cyan-400 mb-3" />
        <div className="text-cyan-400 text-xl font-bold mb-2">Resources</div>
        <p className="text-cyan-100/70 text-center text-sm">Access guides, templates and learning materials</p>
      </Link>
    </div>
  );
}
