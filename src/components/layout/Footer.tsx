
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-slate-100 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} Rent Negotiator. All rights reserved.
          </div>
          
          <div className="flex gap-6">
            <Link to="/terms" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">
              Contact
            </Link>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-center text-gray-400 max-w-3xl mx-auto">
          <p>
            DISCLAIMER: Rent Negotiator is not a licensed real estate broker, attorney, or financial advisor. 
            All information provided is for general informational purposes only and should not be considered 
            legal, financial, or professional advice. Please consult with qualified professionals 
            regarding your specific situation.
          </p>
        </div>
      </div>
    </footer>
  );
}
