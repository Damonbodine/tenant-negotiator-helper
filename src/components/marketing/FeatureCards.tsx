import { Link } from "react-router-dom";
import { ArrowRight, Search, MessageSquare, Scale, FileText } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  onClick?: () => void;
  to?: string;
}

const FeatureCard = ({ title, description, icon, action, onClick, to }: FeatureCardProps) => {
  const content = (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10 hover:border-cyan-400/30 hover:bg-white/10 transition-all duration-300 flex flex-col h-full">
      <div className="p-3 rounded-full bg-cyan-400/10 w-fit mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-white/70 mb-4 flex-grow">{description}</p>
      <div className="flex items-center text-cyan-400 font-medium mt-auto">
        <span>{action}</span>
        <ArrowRight className="h-4 w-4 ml-1" />
      </div>
    </div>
  );
  
  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className="text-left h-full block w-full">
      {content}
    </button>
  );
};

export function FeatureCards({ setActiveJourney }: { setActiveJourney?: (journey: "market" | "negotiation" | "comparison") => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {setActiveJourney && (
        <>
          <FeatureCard
            title="Market Analysis"
            description="Compare your rent to similar properties in your area"
            icon={<Search className="h-6 w-6 text-cyan-400" />}
            action="Analyze market"
            onClick={() => setActiveJourney("market")}
          />
          
          <FeatureCard
            title="Negotiation Coach"
            description="Get personalized negotiation advice from our AI assistant"
            icon={<MessageSquare className="h-6 w-6 text-cyan-400" />}
            action="Start negotiating"
            onClick={() => setActiveJourney("negotiation")}
          />
          
          <FeatureCard
            title="Property Comparison"
            description="Compare different properties to find the best value"
            icon={<Scale className="h-6 w-6 text-cyan-400" />}
            action="Compare properties"
            onClick={() => setActiveJourney("comparison")}
          />
          
          <FeatureCard
            title="Lease Analyzer"
            description="Upload your lease to identify risks, opportunities, and key terms"
            icon={<FileText className="h-6 w-6 text-cyan-400" />}
            action="Analyze your lease"
            to="/lease-analyzer"
          />
        </>
      )}

      {!setActiveJourney && (
        <FeatureCard
          title="Down Payment Programs"
          description="Find programs to help you buy your dream home"
          icon={<Search className="h-6 w-6 text-cyan-400" />}
          action="Find programs"
          to="/down-payment-programs"
        />
      )}
    </div>
  );
}
