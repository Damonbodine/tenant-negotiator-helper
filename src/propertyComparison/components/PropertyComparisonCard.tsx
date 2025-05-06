
import { FileSearch } from "lucide-react";
import { Link } from "react-router-dom";

export function PropertyComparisonCard() {
  return (
    <div className="journey-bubble flex flex-col items-center justify-center p-6 bg-cyan-950/30 hover:bg-cyan-950/40 border border-cyan-400/20 rounded-xl h-52 w-full mx-auto transition-all hover:shadow-lg hover:scale-105">
      <FileSearch className="h-10 w-10 text-cyan-400 mb-3" />
      <div className="text-cyan-400 text-xl font-bold mb-2">Compare Properties</div>
      <p className="text-cyan-100/70 text-center text-sm">Compare up to 4 properties side-by-side to find the best value</p>
      <p className="text-cyan-100/70 text-center text-xs mt-2">Use any address or listing URL</p>
    </div>
  );
}
