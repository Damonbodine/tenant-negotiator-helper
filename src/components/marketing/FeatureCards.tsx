
import { Link } from "react-router-dom";

interface FeatureCardsProps {
  setActiveJourney: (journey: string) => void;
}

export function FeatureCards({ setActiveJourney }: FeatureCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <button
        onClick={() => setActiveJourney("market")}
        className="journey-bubble flex flex-col items-center justify-center p-8 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-64 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <div className="text-cyan-400 text-3xl font-bold mb-3">Market Tips</div>
        <p className="text-cyan-100/70 text-center">Get insights on rental prices and market trends</p>
      </button>
      
      <Link
        to="/practice"
        className="journey-bubble flex flex-col items-center justify-center p-8 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-64 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <div className="text-cyan-400 text-3xl font-bold mb-3">Rent Analysis</div>
        <p className="text-cyan-100/70 text-center">Analyze apartment pricing to strengthen your position</p>
      </Link>
      
      <Link
        to="/practice/voice"
        className="journey-bubble flex flex-col items-center justify-center p-8 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-64 w-full mx-auto transition-all hover:shadow-lg hover:scale-105"
      >
        <div className="text-cyan-400 text-3xl font-bold mb-3">Practice Call</div>
        <p className="text-cyan-100/70 text-center">Rehearse your negotiation with an AI landlord</p>
      </Link>
    </div>
  );
}
