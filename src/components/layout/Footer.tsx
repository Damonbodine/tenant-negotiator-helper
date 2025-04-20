
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full py-6 bg-slate-50 dark:bg-slate-900 border-t">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/34dcbc44-8a1c-4f73-8f2d-c65b665a74b8.png" 
              alt="RentCoach.ai Logo" 
              className="h-8 w-auto"
            />
            <span className="text-sm font-medium text-cyan-500">RentCoach.ai</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">Home</Link>
            <Link to="/practice" className="text-sm text-slate-500 hover:text-slate-800">Rent Analysis</Link>
            <Link to="/practice/voice" className="text-sm text-slate-500 hover:text-slate-800">Negotiation Practice</Link>
          </div>
          
          <div className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} RentCoach.ai
          </div>
        </div>
        
        <div className="mt-6 p-4 border border-amber-200 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="text-sm">
            <strong>Disclaimer:</strong> RentCoach.ai is not a licensed broker, attorney, or financial advisor. 
            The information and advice provided on this website are for informational and educational purposes only and 
            should not be construed as professional advice. Nothing on this site should be taken as legal advice or 
            as an offer or guarantee of any specific rental outcome. Please consult with appropriate professionals 
            regarding your specific situation.
          </p>
        </div>
      </div>
    </footer>
  );
}
