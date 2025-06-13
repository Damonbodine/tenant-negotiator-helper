
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-card border-b border-sidebar-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="hover:text-sidebar-accent text-2xl font-bold leading-none transition-colors">Renters Mentor</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/resources" className="hover:text-sidebar-accent transition-colors">Resources</Link>
          <Link to="/script-builder" className="hover:text-sidebar-accent transition-colors">Email Script Builder</Link>
          <Link to="/faq" className="hover:text-sidebar-accent transition-colors">FAQ</Link>
          <Link to="/contact" className="hover:text-sidebar-accent transition-colors">Contact</Link>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile">
                <Button variant="outline" size="sm">Profile</Button>
              </Link>
              <Button variant="link" size="sm" onClick={signOut}>Sign Out</Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden py-2 px-4 border-t border-gray-200">
          <div className="flex flex-col space-y-3">
            <Link
              to="/resources"
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Resources
            </Link>
            <Link
              to="/script-builder"
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Email Script Builder
            </Link>
            <Link
              to="/faq"
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              to="/contact"
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
