
import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center gap-2 md:flex-row md:justify-between py-6">
        <p className="text-sm text-muted-foreground">
          © {currentYear} Renters Mentor. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/faq"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
          <Link
            to="/contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
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

      {/* Legal disclaimer footer */}
      <div className="w-full py-2 bg-white dark:bg-black border-t">
        <div className="container">
          <p className="text-xs text-center text-gray-500">
            Renters Mentor is an educational tool. We are <strong>not attorneys or a licensed real-estate broker</strong>.
            Nothing here is legal advice. Consult a qualified professional before acting.
          </p>
        </div>
      </div>
    </footer>
  );
}
