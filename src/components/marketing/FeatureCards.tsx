
import { Link } from "react-router-dom";
import { PieChart, MessageSquare, Headphones, BookOpen, FileEdit } from "lucide-react";

export function FeatureCards() {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

      <Link to="/property-analysis" className="journey-bubble flex flex-col items-center justify-center p-6 bg-card border rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105 duration-300">
        <PieChart className="h-10 w-10 text-card-foreground mb-3" />
        <div className="text-card-foreground text-xl font-bold mb-2">Property Analysis</div>
        <p className="text-muted-foreground text-center text-sm">Analyze individual properties or compare multiple rentals side-by-side</p>
      </Link>

      <Link to="/negotiation"  className="journey-bubble flex flex-col items-center justify-center p-6 bg-card border rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105 duration-300">
        <MessageSquare className="h-10 w-10 text-card-foreground mb-3" />
        <div className="text-card-foreground text-xl font-bold mb-2">Get Negotiation Help</div>
        <p className="text-muted-foreground text-center text-sm">Learn effective strategies for rental negotiations</p>
      </Link>

      <Link to="/practice/voice" className="journey-bubble flex flex-col items-center justify-center p-6 bg-card border rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105 duration-300">
        <Headphones className="h-10 w-10 text-card-foreground mb-3" />
        <div className="text-card-foreground text-xl font-bold mb-2">Practice Call</div>
        <p className="text-muted-foreground text-center text-sm">Rehearse your negotiation with an AI landlord</p>
      </Link>

      <Link to="/script-builder" className="journey-bubble flex flex-col items-center justify-center p-6 bg-card border rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105 duration-300">
        <FileEdit className="h-10 w-10 text-card-foreground mb-3" />
        <div className="text-card-foreground text-xl font-bold mb-2">Email Script Builder</div>
        <p className="text-muted-foreground text-center text-sm">Create personalized negotiation scripts based on your goals</p>
      </Link>

      <Link to="/resources" className="journey-bubble flex flex-col items-center justify-center p-6 bg-card border rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105 duration-300">
        <BookOpen className="h-10 w-10 text-card-foreground mb-3" />
        <div className="text-card-foreground text-xl font-bold mb-2">Resources</div>
        <p className="text-muted-foreground text-center text-sm">Access guides, templates and learning materials</p>
      </Link>
    </div>;
}
