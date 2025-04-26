
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const PracticeHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-blue-600">Practice Negotiation Calls</h2>
        <p className="text-muted-foreground mt-1">
          Improve your rental negotiation skills with interactive voice practice
        </p>
      </div>
      <div className="flex gap-2">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
