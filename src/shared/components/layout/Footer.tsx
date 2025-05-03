
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-6 border-t">
      <div className="container flex flex-col items-center gap-2 md:flex-row md:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Tenant Negotiator. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link 
            to="/privacy" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link 
            to="/terms" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
