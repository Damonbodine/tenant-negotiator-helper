
import { Building, MessageSquare } from "lucide-react";

interface FeatureCardsProps {
  setActiveJourney: (journey: "market" | "negotiation" | null) => void;
}

export const FeatureCards = ({ setActiveJourney }: FeatureCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        onClick={() => setActiveJourney("market")}
        className="border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300 cursor-pointer bg-white dark:bg-slate-800"
      >
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Market Insights</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Analyze rental listings and get market rates for your area to know if you're overpaying.</p>
          
          <div className="mt-auto">
            <button className="text-blue-500 font-medium hover:underline">
              Analyze market &rarr;
            </button>
          </div>
        </div>
      </div>
      
      <div 
        onClick={() => setActiveJourney("negotiation")}
        className="border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300 cursor-pointer bg-white dark:bg-slate-800"
      >
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Negotiation Tips</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Get personalized negotiation advice and practice your skills with our AI coach.</p>
          
          <div className="mt-auto">
            <button className="text-blue-500 font-medium hover:underline">
              Get negotiation help &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
